import { NextRequest } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { logger } from '@/lib/logger';
import { getClientIdentifier, getUsage, recordUsage, FREE_TIER_LIMIT, WEEK_IN_MS } from '@/lib/demo-usage';

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 2;
const RETRY_DELAYS = [1000, 2000];

type ErrorCode = 'rate_limit' | 'service_unavailable' | 'connection_error' | 'unexpected_error' | 'safety_blocked' | 'invalid_key';

function classifyGeminiError(status: number, message: string): { code: ErrorCode; httpStatus: number } {
  if (status === 429 || message.includes('RESOURCE_EXHAUSTED') || message.includes('Rate limit')) {
    return { code: 'rate_limit', httpStatus: 429 };
  }
  if (status === 400 || message.includes('API key not valid') || message.includes('INVALID_ARGUMENT')) {
    return { code: 'invalid_key', httpStatus: 502 };
  }
  if (message.includes('SAFETY') || message.includes('blocked')) {
    return { code: 'safety_blocked', httpStatus: 422 };
  }
  if (status === 403 || message.includes('PERMISSION_DENIED')) {
    return { code: 'invalid_key', httpStatus: 502 };
  }
  if (status >= 500) {
    return { code: 'service_unavailable', httpStatus: 502 };
  }
  return { code: 'unexpected_error', httpStatus: 502 };
}

function isRetryable(code: ErrorCode): boolean {
  return code === 'service_unavailable' || code === 'connection_error';
}

const FRIENDLY_MESSAGES: Record<ErrorCode, string> = {
  rate_limit: 'Our AI service is temporarily busy. Please wait a moment and try again.',
  service_unavailable: 'The AI service is temporarily unavailable. Please try again shortly.',
  connection_error: 'Could not reach the AI service. Please check your connection and try again.',
  unexpected_error: 'Something went wrong while analyzing the image. Please try again.',
  safety_blocked: 'The image was blocked by content filters. Please try a different image.',
  invalid_key: 'The AI service is not properly configured. Please contact support.',
};

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('MISSING_API_KEY');
  }
  return new GoogleGenAI({ apiKey });
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const identifier = getClientIdentifier(req);
    logger.info('[diagnose-image] Request received', {
      component: 'ai',
      metadata: {
        identifier,
        hasGeminiKey: !!process.env.GEMINI_API_KEY,
        keyPrefix: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 6) + '...' : 'none',
        model: GEMINI_MODEL,
      },
    });

    const entries = getUsage(identifier);
    const used = entries.length;

    if (used >= FREE_TIER_LIMIT) {
      const oldestEntry = entries[0];
      const resetsAt = oldestEntry ? new Date(oldestEntry.timestamp + WEEK_IN_MS).toISOString() : '';
      logger.warn('[diagnose-image] Free tier limit reached', {
        component: 'ai',
        metadata: { identifier, used },
      });
      return Response.json({
        success: false,
        error: `Free tier limit reached. You have used ${used} of ${FREE_TIER_LIMIT} analyses this week.`,
        usage: { used, limit: FREE_TIER_LIMIT, remaining: 0, resetsAt },
      }, { status: 429 });
    }

    const formData = await req.formData();
    const imageFile = formData.get('image') as File | null;

    if (!imageFile || !(imageFile instanceof File)) {
      logger.error('[diagnose-image] No image file in request', { component: 'ai' });
      return Response.json({
        success: false,
        error: 'Please upload an image to diagnose.',
      }, { status: 400 });
    }

    if (!ACCEPTED_TYPES.includes(imageFile.type)) {
      logger.error('[diagnose-image] Invalid image type', {
        component: 'ai',
        metadata: { type: imageFile.type },
      });
      return Response.json({
        success: false,
        error: `Invalid image type: ${imageFile.type}. Please upload JPG, PNG, or WebP.`,
      }, { status: 400 });
    }

    if (imageFile.size > MAX_FILE_SIZE) {
      logger.error('[diagnose-image] Image too large', {
        component: 'ai',
        metadata: { size: imageFile.size },
      });
      return Response.json({
        success: false,
        error: `Image too large: ${(imageFile.size / 1024 / 1024).toFixed(1)}MB. Maximum is 10MB.`,
      }, { status: 400 });
    }

    logger.info('[diagnose-image] Image validated', {
      component: 'ai',
      metadata: {
        fileName: imageFile.name,
        fileType: imageFile.type,
        fileSize: `${(imageFile.size / 1024).toFixed(1)}KB`,
      },
    });

    let ai: GoogleGenAI;
    try {
      ai = getGeminiClient();
    } catch (err) {
      if (err instanceof Error && err.message === 'MISSING_API_KEY') {
        logger.error('[diagnose-image] GEMINI_API_KEY not configured', { component: 'ai' });
        return Response.json({
          success: false,
          error: 'The AI service is not properly configured. Please contact support.',
          errorCode: 'invalid_key',
        }, { status: 503 });
      }
      throw err;
    }

    logger.info('[diagnose-image] Reading image data', { component: 'ai' });
    const bytes = await imageFile.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const mimeType = imageFile.type || 'image/jpeg';

    logger.info('[diagnose-image] Image preprocessing complete', {
      component: 'ai',
      metadata: {
        base64Length: base64.length,
        mimeType,
        dimensions: `${bytes.byteLength} bytes`,
      },
    });

    const prompt = `You are an expert crop disease diagnostician specializing in East African agriculture. Analyze this plant image carefully and provide a comprehensive diagnosis.

Analyze the image for:
- Visual disease signs (spots, lesions, discoloration, fungal growth, pest damage, nutrient deficiency patterns)
- Severity level (mild/moderate/severe/critical) based on visual extent of damage
- Description of what you observe in the image
- Likely crop type if visible

Common crops in East Africa: maize, beans, tomatoes, kale, cabbage, potatoes, onions, rice, wheat, coffee, tea, mangoes, bananas/plantains, cassava, sorghum, millet, pigeon peas, cowpeas, groundnuts, soybeans, sukuma wiki (collard greens), spinach, capsicum, carrots, cabbages.

Respond ONLY with valid JSON in this exact format:
{
  "disease": "Disease or Condition Name",
  "confidence": 0.85,
  "severity": "moderate",
  "description": "Detailed description of what was observed in the image and how it relates to the condition. Include visual evidence from the image.",
  "treatment": [
    "Specific treatment recommendation 1",
    "Specific treatment recommendation 2",
    "Specific treatment recommendation 3"
  ],
  "prevention": [
    "Prevention tip 1",
    "Prevention tip 2",
    "Prevention tip 3"
  ],
  "symptoms_observed": [
    "Visual symptom 1 observed in image",
    "Visual symptom 2 observed in image"
  ]
}`;

    logger.info('[diagnose-image] Sending request to Gemini API', {
      component: 'ai',
      metadata: { model: GEMINI_MODEL },
    });

    let rawContent = '';
    let lastError: { code: ErrorCode; httpStatus: number } | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        const delay = RETRY_DELAYS[attempt - 1] || 2000;
        logger.info(`[diagnose-image] Retry attempt ${attempt}/${MAX_RETRIES} after ${delay}ms`, { component: 'ai' });
        await new Promise((r) => setTimeout(r, delay));
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

        const response = await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: [
            { text: prompt },
            { inlineData: { mimeType, data: base64 } },
          ],
          config: {
            temperature: 0.3,
            maxOutputTokens: 1024,
          },
        });

        clearTimeout(timeoutId);
        rawContent = response.text ?? '';
        lastError = null;
        break;
      } catch (err: unknown) {
        const apiErr = err as { status?: number; message?: string; name?: string; error?: { message?: string; code?: number; status?: string } };
        const status = apiErr.status ?? apiErr.error?.code ?? 500;
        const msg = apiErr.message ?? apiErr.error?.message ?? String(err);
        const errStatus = apiErr.error?.status ?? 'UNKNOWN';

        const classified = classifyGeminiError(status, msg);
        lastError = classified;

        logger.error('[diagnose-image] Gemini API error', {
          component: 'ai',
          metadata: {
            attempt,
            status,
            gcpStatus: errStatus,
            errorCode: classified.code,
            message: msg.substring(0, 300),
            fullError: JSON.stringify(apiErr.error || apiErr).substring(0, 800),
            model: GEMINI_MODEL,
          },
        });

        if (!isRetryable(classified.code)) break;
      }
    }

    if (lastError) {
      return Response.json({
        success: false,
        error: FRIENDLY_MESSAGES[lastError.code],
        errorCode: lastError.code,
      }, { status: lastError.httpStatus });
    }

    if (!rawContent || rawContent.trim().length === 0) {
      logger.error('[diagnose-image] Empty response from Gemini', { component: 'ai' });
      return Response.json({
        success: false,
        error: 'AI returned an empty response. Please try uploading a clearer image.',
      }, { status: 502 });
    }

    logger.info('[diagnose-image] Gemini response received, parsing', { component: 'ai' });

    let result: Record<string, unknown>;
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in response');
      }
      result = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      logger.error('[diagnose-image] Failed to parse Gemini JSON response', {
        component: 'ai',
        metadata: {
          rawContent: rawContent.substring(0, 500),
          parseError: parseError instanceof Error ? parseError.message : String(parseError),
        },
      });
      return Response.json({
        success: false,
        error: 'AI returned an invalid response format. Please try again.',
      }, { status: 502 });
    }

    const duration = Date.now() - startTime;
    const confidence = typeof result.confidence === 'number' ? result.confidence : 0.5;
    const disease = typeof result.disease === 'string' ? result.disease : 'Unknown Condition';
    const severity = ['mild', 'moderate', 'severe', 'critical'].includes(result.severity as string)
      ? result.severity as string
      : 'moderate';

    logger.info('[diagnose-image] Prediction complete', {
      component: 'ai',
      metadata: {
        disease,
        confidence,
        severity,
        duration: `${duration}ms`,
        model: GEMINI_MODEL,
      },
    });

    const recordEntries = recordUsage(identifier);
    const newUsed = recordEntries.length;
    const newRemaining = Math.max(0, FREE_TIER_LIMIT - newUsed);
    const resetsAt = recordEntries[0] ? new Date(recordEntries[0].timestamp + WEEK_IN_MS).toISOString() : '';

    const treatment = Array.isArray(result.treatment)
      ? result.treatment.filter((t): t is string => typeof t === 'string')
      : typeof result.treatment === 'string'
        ? [result.treatment]
        : ['Consult a local agricultural extension officer for treatment recommendations.'];

    const prevention = Array.isArray(result.prevention)
      ? result.prevention.filter((p): p is string => typeof p === 'string')
      : typeof result.prevention === 'string'
        ? [result.prevention]
        : ['Monitor plants regularly for early signs of disease.'];

    const symptomsObserved = Array.isArray(result.symptoms_observed)
      ? result.symptoms_observed.filter((s): s is string => typeof s === 'string')
      : [];

    const diagnosisResponse = {
      success: true,
      data: {
        disease,
        confidence,
        severity,
        description: typeof result.description === 'string'
          ? result.description
          : `Analysis completed for ${disease}.`,
        treatment,
        prevention,
        symptoms_observed: symptomsObserved,
        imageAnalyzed: true,
      },
      usage: { used: newUsed, limit: FREE_TIER_LIMIT, remaining: newRemaining, resetsAt },
      disclaimer: 'This is an AI-assisted diagnosis. Results should be verified by a local agricultural extension officer.',
    };

    logger.info('[diagnose-image] Response sent', {
      component: 'ai',
      metadata: { disease, confidence, duration: `${duration}ms` },
    });

    return Response.json(diagnosisResponse);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('[diagnose-image] Unhandled error', {
      component: 'ai',
      metadata: { error: error instanceof Error ? error.message : String(error), duration: `${duration}ms` },
    });
    return Response.json({
      success: false,
      error: 'An unexpected error occurred. Please try again.',
      errorCode: 'unexpected_error',
    }, { status: 500 });
  }
}
