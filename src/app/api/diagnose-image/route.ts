import { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';
import { getClientIdentifier, getUsage, recordUsage, FREE_TIER_LIMIT, WEEK_IN_MS } from '@/lib/demo-usage';

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const identifier = getClientIdentifier(req);
    logger.info('[diagnose-image] Request received', {
      component: 'ai',
      metadata: { identifier },
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

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      logger.error('[diagnose-image] OPENAI_API_KEY not configured', { component: 'ai' });
      return Response.json({
        success: false,
        error: 'Image diagnosis is not available. The AI service is not configured on this server. Please contact support.',
      }, { status: 503 });
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

    logger.info('[diagnose-image] Sending request to OpenAI vision API', {
      component: 'ai',
      metadata: { model: 'gpt-4o-mini' },
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
          ],
        }],
        response_format: { type: 'json_object' },
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Could not read error response');
      logger.error('[diagnose-image] OpenAI API error', {
        component: 'ai',
        metadata: {
          status: response.status,
          statusText: response.statusText,
          error: errorText.substring(0, 500),
        },
      });
      return Response.json({
        success: false,
        error: `AI analysis failed (HTTP ${response.status}). ${response.status === 401 ? 'Invalid API key.' : response.status === 429 ? 'Rate limited. Please try again later.' : 'Please try again.'}`,
      }, { status: response.status === 401 ? 401 : response.status === 429 ? 429 : 502 });
    }

    logger.info('[diagnose-image] OpenAI response received, parsing', { component: 'ai' });

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content;

    if (!rawContent) {
      logger.error('[diagnose-image] Empty response from OpenAI', {
        component: 'ai',
        metadata: { data: JSON.stringify(data).substring(0, 500) },
      });
      return Response.json({
        success: false,
        error: 'AI returned an empty response. Please try uploading a clearer image.',
      }, { status: 502 });
    }

    let result: Record<string, unknown>;
    try {
      result = JSON.parse(rawContent);
    } catch (parseError) {
      logger.error('[diagnose-image] Failed to parse OpenAI JSON response', {
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
        model: 'gpt-4o-mini',
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('[diagnose-image] Unhandled error', {
      component: 'ai',
      metadata: { error: errorMessage, duration: `${duration}ms` },
    });
    return Response.json({
      success: false,
      error: `Image diagnosis failed: ${errorMessage}`,
    }, { status: 500 });
  }
}
