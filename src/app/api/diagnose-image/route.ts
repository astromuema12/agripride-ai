import { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';
import { getClientIdentifier, getUsage, recordUsage, usageResponse, FREE_TIER_LIMIT } from '@/lib/demo-usage';

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export async function POST(req: NextRequest) {
  try {
    const identifier = getClientIdentifier(req);
    const entries = getUsage(identifier);
    const used = entries.length;

    if (used >= FREE_TIER_LIMIT) {
      const oldestEntry = entries[0];
      const resetsAt = oldestEntry ? new Date(oldestEntry.timestamp + 7 * 24 * 60 * 60 * 1000).toISOString() : '';
      return Response.json({
        success: false,
        error: `Free tier limit reached. You have used ${used} of ${FREE_TIER_LIMIT} analyses this week.`,
        usage: { used, limit: FREE_TIER_LIMIT, remaining: 0, resetsAt },
      }, { status: 429 });
    }

    const formData = await req.formData();
    const imageFile = formData.get('image') as File | null;

    if (!imageFile || !(imageFile instanceof File)) {
      return Response.json({
        success: false,
        error: 'Please upload an image to diagnose.',
      }, { status: 400 });
    }

    if (!ACCEPTED_TYPES.includes(imageFile.type)) {
      return Response.json({
        success: false,
        error: 'Please upload a valid image (JPG, PNG, or WebP).',
      }, { status: 400 });
    }

    if (imageFile.size > 10 * 1024 * 1024) {
      return Response.json({
        success: false,
        error: 'Image must be under 10MB.',
      }, { status: 400 });
    }

    const updatedEntries = recordUsage(identifier);
    const newUsed = updatedEntries.length;
    const newRemaining = Math.max(0, FREE_TIER_LIMIT - newUsed);
    const resetsAt = updatedEntries[0] ? new Date(updatedEntries[0].timestamp + 7 * 24 * 60 * 60 * 1000).toISOString() : '';
    const usageData = { used: newUsed, limit: FREE_TIER_LIMIT, remaining: newRemaining, resetsAt };

    const hasRealAI = !!process.env.OPENAI_API_KEY;
    const startTime = Date.now();

    if (hasRealAI) {
      try {
        const bytes = await imageFile.arrayBuffer();
        const base64 = Buffer.from(bytes).toString('base64');
        const mimeType = imageFile.type || 'image/jpeg';

        const prompt = `You are an expert crop disease diagnostician. Analyze this plant image carefully and provide a comprehensive diagnosis.

Analyze the image for:
- Visual disease signs (spots, lesions, discoloration, fungal growth, pest damage)
- Severity level (mild/moderate/severe/critical) based on visual extent of damage
- Description of what you observe in the image

Respond in JSON format with:
{
  "disease": "Disease/Condition Name",
  "confidence": 0.0-1.0,
  "severity": "mild|moderate|severe|critical",
  "description": "Detailed description of what was observed in the image and how it relates to the condition",
  "treatment": ["list", "of", "specific", "treatment", "recommendations"],
  "prevention": ["list", "of", "prevention", "tips"]
}`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
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
          }),
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          logger.error('OpenAI API error in image diagnosis', {
            component: 'ai',
            metadata: { status: response.status, error: errorText },
          });
          throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        const result = JSON.parse(data.choices[0].message.content);
        const duration = Date.now() - startTime;

        logger.info(`Image diagnosis completed in ${duration}ms`, {
          component: 'ai',
          metadata: { model: 'gpt-4o-mini', duration },
        });

        return Response.json({
          success: true,
          data: {
            disease: result.disease || 'Unknown Condition',
            confidence: typeof result.confidence === 'number' ? result.confidence : 0.5,
            severity: result.severity || 'moderate',
            description: result.description || 'Analysis completed based on the uploaded image.',
            treatment: Array.isArray(result.treatment) ? result.treatment : [result.treatment || 'Consult an agricultural extension officer.'],
            prevention: Array.isArray(result.prevention) ? result.prevention : [result.prevention || 'Monitor the plant closely.'],
            imageAnalyzed: true,
          },
          usage: usageData,
          disclaimer: 'This is an AI-assisted diagnosis. Results should be verified by a local agricultural extension officer.',
        });
      } catch (error) {
        logger.error('Image diagnosis failed, falling back to local response', {
          component: 'ai',
          metadata: { error: error instanceof Error ? error.message : String(error) },
        });
      }
    }

    await new Promise((r) => setTimeout(r, 800 + Math.random() * 400));

    return Response.json({
      success: true,
      data: {
        disease: 'Image Received — AI Analysis Unavailable',
        confidence: 0.3,
        severity: 'moderate',
        description: 'The image was received but AI analysis is currently unavailable. Please consult a local agricultural extension officer for a professional diagnosis.',
        treatment: ['Consult a local agricultural extension officer for treatment recommendations.'],
        prevention: ['Ensure proper plant nutrition and irrigation.', 'Monitor plants regularly for early signs of disease.'],
        imageAnalyzed: false,
      },
      usage: usageData,
      disclaimer: 'This is a demo diagnosis. AI vision is not configured. Results are simulated. Always consult a local agricultural extension officer.',
    });
  } catch {
    return Response.json({ success: false, error: 'Invalid request. Please upload a valid image.' }, { status: 400 });
  }
}
