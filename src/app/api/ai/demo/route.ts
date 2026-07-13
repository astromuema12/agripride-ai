import { NextRequest } from 'next/server';
import { diagnose, KNOWN_CROPS, GROWTH_STAGES } from '@/lib/diagnosis-engine';
import { logger } from '@/lib/logger';
import type { GrowthStage } from '@/types';

const cropList = KNOWN_CROPS;

const FREE_TIER_LIMIT = 3;
const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

interface UsageEntry {
  timestamp: number;
}

const usageStore = new Map<string, UsageEntry[]>();

function getClientIdentifier(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'demo-user';
  return ip;
}

function getUsage(identifier: string): UsageEntry[] {
  const now = Date.now();
  const entries = usageStore.get(identifier) || [];
  const valid = entries.filter((e) => now - e.timestamp < WEEK_IN_MS);
  usageStore.set(identifier, valid);
  return valid;
}

function recordUsage(identifier: string): UsageEntry[] {
  const entries = getUsage(identifier);
  entries.push({ timestamp: Date.now() });
  usageStore.set(identifier, entries);
  return entries;
}

function usageResponse(identifier: string, overrides?: Record<string, unknown>) {
  const entries = getUsage(identifier);
  const used = entries.length;
  const remaining = Math.max(0, FREE_TIER_LIMIT - used);
  const resetsAt = entries[0] ? new Date(entries[0].timestamp + WEEK_IN_MS).toISOString() : '';
  return { used, limit: FREE_TIER_LIMIT, remaining, resetsAt, ...overrides };
}

const SEVERITY_LEVELS = ['mild', 'moderate', 'severe', 'critical'] as const;

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

    if (!symptoms || symptoms.length < 5) {
      return Response.json({
        success: false,
        error: 'Please describe the symptoms you are observing (at least 5 characters).',
        usage: usageResponse(identifier),
      }, { status: 400 });
    }

    const updatedEntries = recordUsage(identifier);
    const newUsed = updatedEntries.length;
    const newRemaining = Math.max(0, FREE_TIER_LIMIT - newUsed);
    const resetsAt = updatedEntries[0] ? new Date(updatedEntries[0].timestamp + WEEK_IN_MS).toISOString() : '';
    const usageData = { used: newUsed, limit: FREE_TIER_LIMIT, remaining: newRemaining, resetsAt };

    const hasRealAI = !!process.env.OPENAI_API_KEY;
    const startTime = Date.now();

    if (hasRealAI) {
      try {
        const stageInfo = growthStage && growthStage !== 'unknown' ? `\nCrop Growth Stage: ${growthStage}` : '';
        const hasImage = !!image;
        const prompt = hasImage
          ? `You are an expert crop disease diagnostician. Analyze the plant image along with the reported symptoms and provide a comprehensive diagnosis.

Crop: ${cropType}${stageInfo}
Symptoms reported by farmer: ${symptoms}

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

        const msgContent: { type: string; text?: string; image_url?: { url: string } }[] = [
          { type: 'text', text: prompt },
        ];

        if (image) {
          const base64Data = image.includes(',') ? image.split(',')[1] : image;
          msgContent.push({
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${base64Data}` },
          });
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: msgContent }],
            response_format: { type: 'json_object' },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          logger.error('OpenAI API error in demo', {
            component: 'ai',
            metadata: { status: response.status, error: errorText },
          });
          throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        const result = JSON.parse(data.choices[0].message.content);
        const duration = Date.now() - startTime;

        logger.info(`AI demo diagnosis completed in ${duration}ms`, {
          component: 'ai',
          metadata: { cropType, model: 'gpt-4o-mini', duration },
        });

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
        logger.error('AI demo diagnosis failed, falling back to local engine', {
          component: 'ai',
          metadata: { error: error instanceof Error ? error.message : String(error) },
        });
      }
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
    return Response.json({ success: false, error: 'Invalid request' }, { status: 400 });
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
