import { NextRequest } from 'next/server';
import { z } from 'zod';
import { serverSupabase, writeAuditLog } from '@/lib/server-auth';
import { diagnose } from '@/lib/diagnosis-engine';
import type { GrowthStage } from '@/types';

const GROWTH_STAGES = ['seedling', 'vegetative', 'flowering', 'fruiting', 'unknown'] as const;

const DiagnoseSchema = z.object({
  cropType: z.string().min(1, 'Crop type is required').max(100),
  symptoms: z.string().min(1, 'Symptoms are required').max(5000),
  growthStage: z.enum(GROWTH_STAGES).optional(),
  imageBase64: z.string().max(10_000_000).optional(),
  userId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = DiagnoseSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({
      success: false,
      error: parsed.error.issues.map(e => e.message).join(', '),
    }, { status: 400 });
  }

  const { cropType, symptoms, growthStage, imageBase64, userId } = parsed.data;

  if (serverSupabase) {
    const { data: { session } } = await serverSupabase.auth.getSession();
    if (!session?.user) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (userId && userId !== session.user.id) {
      const { data: userData } = await serverSupabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();
      if (!userData || userData.role !== 'admin') {
        return Response.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }
    }

    const { data: consent } = await serverSupabase
      .from('consent_records')
      .select('granted')
      .eq('user_id', session.user.id)
      .eq('type', 'ai_processing')
      .single();
    if (consent && !consent.granted) {
      return Response.json({ success: false, error: 'AI processing not consented' }, { status: 403 });
    }
  }

  const hasRealAI = !!process.env.OPENAI_API_KEY;

  if (hasRealAI) {
    try {
      const stageInfo = growthStage && growthStage !== 'unknown'
        ? `\nCrop Growth Stage: ${growthStage}`
        : '';
      const prompt = 'You are an expert crop disease diagnostician with training in plant pathology and agronomy. Analyze the following crop symptoms and provide a diagnosis. Be conservative with confidence - only give high confidence (above 0.80) when symptoms are specific and multiple. If symptoms are vague, provide possible causes ranked by likelihood with appropriate confidence levels. Distinguish between diseases, pest damage, environmental stress, and physiological issues.\n\nCrop: ' + cropType + stageInfo + '\nSymptoms: ' + symptoms + '\n\nRespond in JSON format with fields: primaryDiagnosis (object with name, type (disease/stress/physiological/nutrient_deficiency/pest), confidence 0-1, likelihood (high/medium/low), treatment, prevention), possibleCauses (array of same shape), confidenceRange (object with min/max), reasoning (object with summary, symptomInfluences array, uncertainties array, growthStageNote string), uncertaintyLevel (low/moderate/high), requestMoreInfo (boolean).';

      const msgContent: { type: string; text?: string; image_url?: { url: string } }[] = [
        { type: 'text', text: prompt },
      ];

      if (imageBase64) {
        msgContent.push({
          type: 'image_url',
          image_url: { url: 'data:image/jpeg;base64,' + imageBase64 },
        });
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: msgContent }],
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) throw new Error('API error');

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);

      writeAuditLog({
        user_id: userId || 'anonymous',
        action: 'ai_diagnosis',
        resource: 'ai_diagnose',
        details: { cropType, growthStage, confidence: result.primaryDiagnosis?.confidence },
        ip_address: req.headers.get('x-forwarded-for') || undefined,
      });

      return Response.json({
        success: true,
        data: result,
        confidence_score: result.primaryDiagnosis?.confidence,
        responsible_agent: 'AI Disease Diagnostic Agent',
        frameworks_used: ['AIM Framework', 'MAP Framework', 'TRACK Framework'],
        timestamp: new Date().toISOString(),
      });
    } catch {
      return Response.json({
        success: false,
        error: 'Failed to diagnose. Please try again.',
      }, { status: 500 });
    }
  }

  await new Promise((r) => setTimeout(r, 800));

  const result = diagnose({
    cropType,
    symptoms,
    growthStage: growthStage as GrowthStage | undefined,
  });

  writeAuditLog({
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

  return Response.json({
    success: true,
    data: result,
    confidence_score: result.primaryDiagnosis?.confidence,
    responsible_agent: 'Crop Disease Diagnostic Agent',
    frameworks_used: ['AIM Framework', 'MAP Framework', 'TRACK Framework'],
    timestamp: new Date().toISOString(),
  });
}
