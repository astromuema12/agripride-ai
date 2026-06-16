import { NextRequest } from 'next/server';
import { diagnose, KNOWN_CROPS, GROWTH_STAGES } from '@/lib/diagnosis-engine';
import type { GrowthStage } from '@/types';

const cropList = KNOWN_CROPS;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const cropType: string = (body.cropType || '').toLowerCase().trim();
    const symptoms: string = (body.symptoms || '').trim();
    const growthStage: GrowthStage = body.growthStage ?? 'unknown';

    if (!cropType || !cropList.includes(cropType)) {
      return Response.json({
        success: false,
        error: 'Please select a crop from: ' + cropList.join(', '),
      }, { status: 400 });
    }

    if (!symptoms || symptoms.length < 5) {
      return Response.json({
        success: false,
        error: 'Please describe the symptoms you are observing (at least 5 characters).',
      }, { status: 400 });
    }

    await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));

    const result = diagnose({ cropType, symptoms, growthStage });

    return Response.json({
      success: true,
      data: {
        crop: cropType,
        primaryDiagnosis: result.primaryDiagnosis,
        possibleCauses: result.possibleCauses,
        confidenceRange: result.confidenceRange,
        reasoning: result.reasoning,
        symptomCategories: result.symptomCategories,
        growthStage: result.growthStage,
        uncertaintyLevel: result.uncertaintyLevel,
        requestMoreInfo: result.requestMoreInfo,
        missingInfo: result.missingInfo,
      },
      disclaimer: 'This is a demo diagnosis. Results are simulated and should not replace professional agricultural advice.',
    });
  } catch {
    return Response.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}

export async function GET() {
  return Response.json({
    success: true,
    crops: KNOWN_CROPS.map((key) => ({
      id: key,
      name: key.charAt(0).toUpperCase() + key.slice(1),
    })),
    growthStages: GROWTH_STAGES,
  });
}
