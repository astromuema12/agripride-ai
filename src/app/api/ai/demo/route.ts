import { NextRequest } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { diagnose, KNOWN_CROPS, GROWTH_STAGES } from '@/lib/diagnosis-engine';
import { logger } from '@/lib/logger';
import { getClientIdentifier, getUsage, recordUsage, usageResponse, FREE_TIER_LIMIT, WEEK_IN_MS } from '@/lib/demo-usage';
import type { GrowthStage } from '@/types';

const cropList = KNOWN_CROPS;
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 2;
const RETRY_DELAYS = [1000, 2000];

const SEVERITY_LEVELS = ['mild', 'moderate', 'severe', 'critical'] as const;

type ErrorCode = 'rate_limit' | 'service_unavailable' | 'connection_error' | 'unexpected_error' | 'safety_blocked' | 'invalid_key' | 'permission_denied' | 'invalid_model' | 'timeout' | 'auth_error';

function classifyGeminiError(status: number, message: string, errorName?: string): { code: ErrorCode; httpStatus: number } {
  if (errorName === 'AbortError' || message.includes('abort') || message.includes('timeout')) {
    return { code: 'timeout', httpStatus: 504 };
  }

  switch (status) {
    case 400:
      if (message.includes('API key') || message.includes('INVALID_ARGUMENT') || message.includes('key not valid')) {
        return { code: 'invalid_key', httpStatus: 502 };
      }
      if (message.includes('SAFETY') || message.includes('blocked') || message.includes('safety')) {
        return { code: 'safety_blocked', httpStatus: 422 };
      }
      return { code: 'unexpected_error', httpStatus: 422 };

    case 401:
      return { code: 'auth_error', httpStatus: 502 };

    case 403:
      return { code: 'permission_denied', httpStatus: 502 };

    case 404:
      return { code: 'invalid_model', httpStatus: 502 };

    case 429:
      return { code: 'rate_limit', httpStatus: 429 };

    case 500:
      return { code: 'service_unavailable', httpStatus: 502 };

    case 503:
      return { code: 'service_unavailable', httpStatus: 503 };

    default:
      if (status >= 500) {
        return { code: 'service_unavailable', httpStatus: 502 };
      }
      return { code: 'unexpected_error', httpStatus: 502 };
  }
}

function isRetryable(code: ErrorCode): boolean {
  return code === 'service_unavailable' || code === 'connection_error';
}

function inferSeverity(confidence: number, likelihood: string): 'mild' | 'moderate' | 'severe' | 'critical' {
  if (confidence >= 0.80 && likelihood === 'high') return 'severe';
  if (confidence >= 0.60) return 'moderate';
  if (confidence >= 0.40) return 'mild';
  return 'mild';
}

function enrichWithImageAnalysis(result: ReturnType<typeof diagnose>, imageBase64: string) {
  const primary = result.primaryDiagnosis;
  const enriched = {
    ...result,
    possibleCauses: result.possibleCauses.map((cause) => ({
      ...cause,
      severity: cause.severity || inferSeverity(cause.confidence, cause.likelihood),
      description: cause.description || `${cause.name} detected in ${cause.type} category. ${cause.treatment ? 'Treatment recommended.' : 'Monitor closely.'}`,
    })),
    primaryDiagnosis: primary
      ? {
          ...primary,
          severity: primary.severity || inferSeverity(primary.confidence, primary.likelihood),
          description: primary.description || `Primary diagnosis: ${primary.name}. ${primary.treatment || 'Consult an agricultural extension officer for treatment options.'}`,
        }
      : undefined,
    imageAnalyzed: true,
  };
  return enriched;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const cropType: string = (body.cropType || '').toLowerCase().trim();
    const symptoms: string = (body.symptoms || '').trim();
    const growthStage: GrowthStage = body.growthStage ?? 'unknown';
    const image: string | undefined = body.image;

    const identifier = getClientIdentifier(req);
    const entries = getUsage(identifier);
    const used = entries.length;
    const remaining = Math.max(0, FREE_TIER_LIMIT - used);

    if (used >= FREE_TIER_LIMIT) {
      const oldestEntry = entries[0];
      const resetsAt = new Date(oldestEntry.timestamp + WEEK_IN_MS).toISOString();
      return Response.json({
        success: false,
        error: `Free tier limit reached. You have used ${used} of ${FREE_TIER_LIMIT} analyses this week. Upgrade your plan for unlimited analyses.`,
        usage: { used, limit: FREE_TIER_LIMIT, remaining: 0, resetsAt },
      }, { status: 429 });
    }

    if (!cropType || !cropList.includes(cropType)) {
      return Response.json({
        success: false,
        error: 'Please select a crop from: ' + cropList.join(', '),
        usage: usageResponse(identifier),
      }, { status: 400 });
    }

    if (!image && (!symptoms || symptoms.length < 5)) {
      return Response.json({
        success: false,
        error: 'Please either describe symptoms (at least 5 characters) or upload an image.',
        usage: usageResponse(identifier),
      }, { status: 400 });
    }

    const updatedEntries = recordUsage(identifier);
    const newUsed = updatedEntries.length;
    const newRemaining = Math.max(0, FREE_TIER_LIMIT - newUsed);
    const resetsAt = updatedEntries[0] ? new Date(updatedEntries[0].timestamp + WEEK_IN_MS).toISOString() : '';
    const usageData = { used: newUsed, limit: FREE_TIER_LIMIT, remaining: newRemaining, resetsAt };

    const hasRealAI = !!process.env.GEMINI_API_KEY;
    const startTime = Date.now();

    logger.info('[ai/demo] Request', {
      component: 'ai',
      metadata: {
        cropType,
        hasImage: !!image,
        hasGeminiKey: hasRealAI,
        keyPrefix: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 6) + '...' : 'none',
        model: GEMINI_MODEL,
      },
    });

    if (hasRealAI) {
      let lastGeminiError: { code: ErrorCode; httpStatus: number } | null = null;

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        if (attempt > 0) {
          const delay = RETRY_DELAYS[attempt - 1] || 2000;
          logger.info(`[ai/demo] Retry attempt ${attempt}/${MAX_RETRIES} after ${delay}ms`, { component: 'ai' });
          await new Promise((r) => setTimeout(r, delay));
        }

        try {
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
          const stageInfo = growthStage && growthStage !== 'unknown' ? `\nCrop Growth Stage: ${growthStage}` : '';
          const hasImage = !!image;
          const symptomsInfo = symptoms ? `\nSymptoms reported by farmer: ${symptoms}` : '\nNo symptoms were described. Rely entirely on the image for your diagnosis.';
          const prompt = hasImage
            ? `You are an expert crop disease diagnostician. Analyze the plant image${symptoms ? ' along with the reported symptoms' : ''} and provide a comprehensive diagnosis.

Crop: ${cropType}${stageInfo}${symptomsInfo}

Analyze the image carefully for:
- Visual disease signs (spots, lesions, discoloration, fungal growth, pest damage)
- Severity level (mild/moderate/severe/critical) based on visual extent of damage
- Description of what you observe in the image

Respond in JSON format with:
{
  "primaryDiagnosis": {
    "name": "Disease/Condition Name",
    "type": "disease|stress|pest|physiological|nutrient_deficiency",
    "confidence": 0.0-1.0,
    "likelihood": "high|medium|low",
    "severity": "mild|moderate|severe|critical",
    "description": "Detailed description of what was observed in the image and how it relates to the condition",
    "treatment": "Specific treatment recommendations",
    "prevention": "Prevention tips"
  },
  "possibleCauses": [array of 2-4 possible causes with same fields],
  "confidenceRange": {"min": 0.0, "max": 1.0},
  "reasoning": {
    "summary": "Overall analysis summary",
    "symptomInfluences": ["list of visual observations from the image"],
    "uncertainties": ["any uncertainties in the diagnosis"],
    "growthStageNote": "note about growth stage if relevant"
  },
  "uncertaintyLevel": "low|moderate|high",
  "requestMoreInfo": false,
  "missingInfo": []
}`
            : `You are an expert crop disease diagnostician. Based on the reported symptoms, provide a diagnosis.

Crop: ${cropType}${stageInfo}
Symptoms reported by farmer: ${symptoms}

No image was provided. Base your diagnosis purely on the reported symptoms and your knowledge of common crop diseases.

Respond in JSON format with:
{
  "primaryDiagnosis": {
    "name": "Disease/Condition Name",
    "type": "disease|stress|pest|physiological|nutrient_deficiency",
    "confidence": 0.0-1.0,
    "likelihood": "high|medium|low",
    "severity": "mild|moderate|severe|critical",
    "description": "Analysis based on reported symptoms. Note that no image was provided so this is a text-based assessment.",
    "treatment": "Specific treatment recommendations",
    "prevention": "Prevention tips"
  },
  "possibleCauses": [array of 2-4 possible causes with same fields],
  "confidenceRange": {"min": 0.0, "max": 1.0},
  "reasoning": {
    "summary": "Overall analysis summary",
    "symptomInfluences": ["list of symptoms that influenced the diagnosis"],
    "uncertainties": ["any uncertainties, especially noting that no image was provided"],
    "growthStageNote": "note about growth stage if relevant"
  },
  "uncertaintyLevel": "low|moderate|high",
  "requestMoreInfo": true,
  "missingInfo": ["A plant image would improve diagnostic accuracy"]
}`;

          const contents = image
            ? [
                { text: prompt },
                { inlineData: { mimeType: 'image/jpeg', data: (image.includes(',') ? image.split(',')[1] : image) } },
              ]
            : prompt;

          const response = await Promise.race([
            ai.models.generateContent({
              model: GEMINI_MODEL,
              contents,
              config: {
                temperature: 0.3,
                maxOutputTokens: 2048,
              },
            }),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Gemini API timeout')), GEMINI_TIMEOUT_MS)
            ),
          ]);

          const rawText = response.text ?? '';
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error('No JSON in Gemini response');
          }
          const result = JSON.parse(jsonMatch[0]);
          const duration = Date.now() - startTime;

          logger.info(`AI demo diagnosis completed in ${duration}ms`, {
            component: 'ai',
            metadata: { cropType, model: GEMINI_MODEL, duration },
          });

          lastGeminiError = null;

          return Response.json({
            success: true,
            data: {
              crop: cropType,
              primaryDiagnosis: result.primaryDiagnosis,
              possibleCauses: result.possibleCauses || [],
              confidenceRange: result.confidenceRange || { min: 0.3, max: 0.8 },
              reasoning: result.reasoning || { summary: 'Analysis completed.', symptomInfluences: [], uncertainties: [] },
              symptomCategories: {},
              growthStage,
              uncertaintyLevel: result.uncertaintyLevel || 'moderate',
              requestMoreInfo: result.requestMoreInfo || false,
              missingInfo: result.missingInfo || [],
              imageAnalyzed: hasImage,
            },
            usage: usageData,
            disclaimer: 'This is an AI-assisted diagnosis. Results should be verified by a local agricultural extension officer.',
          });
        } catch (error) {
          const errDetail = error as { status?: number; message?: string; name?: string; error?: { message?: string; code?: number; status?: string } };
          const status = errDetail.status ?? errDetail.error?.code ?? 0;
          const msg = errDetail.message ?? errDetail.error?.message ?? String(error);
          const errorName = errDetail.name ?? 'UnknownError';
          const classified = classifyGeminiError(status, msg, errorName);
          lastGeminiError = classified;

          logger.error('AI demo Gemini call failed', {
            component: 'ai',
            metadata: {
              attempt,
              errorCode: classified.code,
              httpStatus: status,
              errorName,
              message: msg.substring(0, 300),
            },
          });

          if (!isRetryable(classified.code)) break;
        }
      }

      logger.info('[ai/demo] Gemini exhausted, falling back to local engine', {
        component: 'ai',
        metadata: { lastError: lastGeminiError?.code },
      });
    }

    await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));

    const result = diagnose({ cropType, symptoms, growthStage });
    const enriched = image ? enrichWithImageAnalysis(result, image) : {
      ...result,
      possibleCauses: result.possibleCauses.map((cause) => ({
        ...cause,
        severity: cause.severity || inferSeverity(cause.confidence, cause.likelihood),
        description: cause.description || `${cause.name} detected based on reported symptoms. No image was provided for visual confirmation.`,
      })),
      primaryDiagnosis: result.primaryDiagnosis
        ? {
            ...result.primaryDiagnosis,
            severity: result.primaryDiagnosis.severity || inferSeverity(result.primaryDiagnosis.confidence, result.primaryDiagnosis.likelihood),
            description: result.primaryDiagnosis.description || `Diagnosis based on reported symptoms: ${result.primaryDiagnosis.name}. Consider uploading a plant image for more accurate analysis.`,
          }
        : undefined,
    };

    return Response.json({
      success: true,
      data: {
        crop: cropType,
        primaryDiagnosis: enriched.primaryDiagnosis,
        possibleCauses: enriched.possibleCauses,
        confidenceRange: result.confidenceRange,
        reasoning: result.reasoning,
        symptomCategories: result.symptomCategories,
        growthStage: result.growthStage,
        uncertaintyLevel: result.uncertaintyLevel,
        requestMoreInfo: result.requestMoreInfo,
        missingInfo: result.missingInfo,
        imageAnalyzed: !!image,
      },
      usage: usageData,
      disclaimer: 'This is a demo diagnosis. Results are simulated. Always consult a local agricultural extension officer before applying treatments.',
    });
  } catch {
    return Response.json({
      success: false,
      error: 'Invalid request. Please check your input and try again.',
      errorCode: 'unexpected_error',
    }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const identifier = getClientIdentifier(req);
  const entries = getUsage(identifier);
  const used = entries.length;
  const remaining = Math.max(0, FREE_TIER_LIMIT - used);
  const resetsAt = entries[0] ? new Date(entries[0].timestamp + WEEK_IN_MS).toISOString() : '';

  return Response.json({
    success: true,
    crops: KNOWN_CROPS.map((key) => ({
      id: key,
      name: key.charAt(0).toUpperCase() + key.slice(1),
    })),
    growthStages: GROWTH_STAGES,
    usage: { used, limit: FREE_TIER_LIMIT, remaining, resetsAt },
  });
}
