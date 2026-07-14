import { NextRequest } from 'next/server';
import { z } from 'zod';
import { GoogleGenAI } from '@google/genai';
import { serverSupabase, writeAuditLog } from '@/lib/server-auth';
import { diagnose } from '@/lib/diagnosis-engine';
import { withErrorHandling, parseBody, apiError, apiSuccess } from '@/lib/api-utils';
import { sanitizeObject } from '@/middleware/security';
import { trackAiUsage, reportError } from '@/lib/monitoring';
import { logger } from '@/lib/logger';
import type { GrowthStage } from '@/types';

const GROWTH_STAGES = ['seedling', 'vegetative', 'flowering', 'fruiting', 'unknown'] as const;
const GEMINI_MODEL = 'gemini-2.5-flash';

const DiagnoseSchema = z.object({
  cropType: z.string().min(1, 'Crop type is required').max(100),
  symptoms: z.string().min(1, 'Symptoms are required').max(5000),
  growthStage: z.enum(GROWTH_STAGES).optional(),
  imageBase64: z.string().max(10_000_000).optional(),
  userId: z.string().optional(),
});

async function handler(req: NextRequest) {
  const parsed = await parseBody(req, DiagnoseSchema);
  if (!parsed.success) return parsed.response;

  const sanitized = sanitizeObject({ cropType: parsed.data.cropType, symptoms: parsed.data.symptoms });
  const { cropType, symptoms, growthStage, imageBase64, userId } = { ...parsed.data, ...sanitized };
  const startTime = Date.now();

  const isDemoMode = !process.env.GEMINI_API_KEY;

  if (serverSupabase && !isDemoMode) {
    const { data: { session } } = await serverSupabase.auth.getSession();
    if (!session?.user) {
      return apiError(401, 'Unauthorized');
    }

    if (userId && userId !== session.user.id) {
      const { data: userData } = await serverSupabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();
      if (!userData || userData.role !== 'admin') {
        return apiError(403, 'Forbidden');
      }
    }

    const { data: consent } = await serverSupabase
      .from('consent_records')
      .select('granted')
      .eq('user_id', session.user.id)
      .eq('type', 'ai_processing')
      .single();
    if (consent && !consent.granted) {
      return apiError(403, 'AI processing not consented');
    }
  }

  const hasRealAI = !!process.env.GEMINI_API_KEY;

  if (hasRealAI) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const stageInfo = growthStage && growthStage !== 'unknown'
        ? `\nCrop Growth Stage: ${growthStage}`
        : '';
      const prompt = 'You are an expert crop disease diagnostician with training in plant pathology and agronomy. Analyze the following crop symptoms and provide a diagnosis. Be conservative with confidence - only give high confidence (above 0.80) when symptoms are specific and multiple. If symptoms are vague, provide possible causes ranked by likelihood with appropriate confidence levels. Distinguish between diseases, pest damage, environmental stress, and physiological issues.\n\nCrop: ' + cropType + stageInfo + '\nSymptoms: ' + symptoms + '\n\nRespond in JSON format with fields: primaryDiagnosis (object with name, type (disease/stress/physiological/nutrient_deficiency/pest), confidence 0-1, likelihood (high/medium/low), treatment, prevention), possibleCauses (array of same shape), confidenceRange (object with min/max), reasoning (object with summary, symptomInfluences array, uncertainties array, growthStageNote string), uncertaintyLevel (low/moderate/high), requestMoreInfo (boolean).';

      const contents: { text: string }[] | { text: string; inlineData: { mimeType: string; data: string } }[] = [
        { text: prompt },
      ];

      if (imageBase64) {
        (contents as { text: string; inlineData: { mimeType: string; data: string } }[]).push({
          text: '',
          inlineData: { mimeType: 'image/jpeg', data: imageBase64 },
        });
      }

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: imageBase64 ? contents as { text: string; inlineData: { mimeType: string; data: string } }[] : prompt,
        config: {
          temperature: 0.3,
          maxOutputTokens: 2048,
        },
      });

      const rawText = response.text ?? '';
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON in Gemini response');
      }
      const result = JSON.parse(jsonMatch[0]);
      const duration = Date.now() - startTime;

      trackAiUsage('diagnose', duration, true, GEMINI_MODEL, userId);
      await writeAuditLog({
        user_id: userId || 'anonymous',
        action: 'ai_diagnosis',
        resource: 'ai_diagnose',
        details: { cropType, growthStage, confidence: result.primaryDiagnosis?.confidence },
        ip_address: req.headers.get('x-forwarded-for') || undefined,
      });

      return apiSuccess({
        ...result,
        confidence_score: result.primaryDiagnosis?.confidence,
        responsible_agent: 'AI Disease Diagnostic Agent',
        frameworks_used: ['AIM Framework', 'MAP Framework', 'TRACK Framework'],
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      trackAiUsage('diagnose', Date.now() - startTime, false, GEMINI_MODEL, userId);
      await reportError(error, { cropType, growthStage, endpoint: 'ai/diagnose' });
      logger.error('[ai/diagnose] Gemini API error', {
        component: 'ai',
        metadata: { error: error instanceof Error ? error.message : String(error) },
      });
      return apiError(500, 'Failed to diagnose. Please try again.');
    }
  }

  await new Promise((r) => setTimeout(r, 800));

  const result = diagnose({
    cropType,
    symptoms,
    growthStage: growthStage as GrowthStage | undefined,
  });

  const duration = Date.now() - startTime;
  trackAiUsage('diagnose', duration, true, 'local-engine', userId);

  await writeAuditLog({
    user_id: userId || 'anonymous',
    action: 'ai_diagnosis',
    resource: 'ai_diagnose',
    details: {
      cropType,
      growthStage,
      confidence: result.primaryDiagnosis?.confidence,
      uncertaintyLevel: result.uncertaintyLevel,
      mock: true,
    },
    ip_address: req.headers.get('x-forwarded-for') || undefined,
  });

  return apiSuccess({
    ...result,
    confidence_score: result.primaryDiagnosis?.confidence,
    responsible_agent: 'Crop Disease Diagnostic Agent',
    frameworks_used: ['AIM Framework', 'MAP Framework', 'TRACK Framework'],
    timestamp: new Date().toISOString(),
  });
}

export const POST = withErrorHandling(handler);
