import { NextRequest } from 'next/server';

const DISEASE_DB: Record<string, {
  disease: string; confidence: number; risk: string;
  treatment: string; prevention: string; explanation: string; emoji: string;
}> = {
  maize: {
    disease: 'Northern Leaf Blight', confidence: 0.92, risk: 'high',
    treatment: 'Apply fungicide containing triazole or strobilurin. Remove and destroy infected leaves. Ensure proper plant spacing.',
    prevention: 'Plant resistant hybrid varieties. Practice crop rotation with non-cereal crops.',
    explanation: 'The symptoms match Northern Leaf Blight (Exserohilum turcicum) with 92% confidence.',
    emoji: '🌽',
  },
  wheat: {
    disease: 'Wheat Stem Rust', confidence: 0.88, risk: 'high',
    treatment: 'Apply fungicide (triazole or strobilurin class). Remove rust pustules from leaves.',
    prevention: 'Plant resistant varieties. Early planting to avoid peak spore season.',
    explanation: 'The reddish-brown pustules on stems strongly indicate Wheat Stem Rust (Puccinia graminis).',
    emoji: '🌾',
  },
  rice: {
    disease: 'Rice Blast', confidence: 0.85, risk: 'medium',
    treatment: 'Apply fungicide (tricyclazole or isoprothiolane). Maintain proper water management.',
    prevention: 'Use resistant varieties. Avoid excessive nitrogen. Maintain consistent water depth.',
    explanation: 'The diamond-shaped lesions with gray centers are characteristic of Rice Blast (Magnaporthe oryzae).',
    emoji: '🍚',
  },
  cassava: {
    disease: 'Cassava Mosaic Virus', confidence: 0.94, risk: 'critical',
    treatment: 'Remove and burn infected plants immediately. Use virus-free planting cuttings.',
    prevention: 'Use certified virus-free cuttings. Plant resistant varieties. Control whitefly populations.',
    explanation: 'The mosaic pattern on leaves is pathognomonic for Cassava Mosaic Virus.',
    emoji: '🌿',
  },
  beans: {
    disease: 'Angular Leaf Spot', confidence: 0.87, risk: 'medium',
    treatment: 'Apply copper-based fungicide. Remove infected plant debris.',
    prevention: 'Use disease-free seed. Practice 2-3 year crop rotation.',
    explanation: 'The angular, gray-brown lesions limited by leaf veins are diagnostic for Angular Leaf Spot.',
    emoji: '🫘',
  },
};

const cropList = Object.keys(DISEASE_DB);

const commonSymptoms: Record<string, string[]> = {
  maize: ['yellow streaks on leaves', 'gray-green lesions', 'wilting lower leaves', 'rotting stem base', 'discolored cobs'],
  wheat: ['rust-colored pustules', 'yellowing leaves', 'white heads', 'stunted growth', 'brown spots'],
  rice: ['diamond-shaped lesions', 'yellowing leaves', 'stunted tillers', 'empty panicles', 'brown spots'],
  cassava: ['mosaic yellow pattern', 'curled leaves', 'stunted growth', 'whiteflies present', 'leaf distortion'],
  beans: ['angular brown spots', 'yellow halos', 'wilting leaves', 'pod lesions', 'stunted plants'],
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const cropType: string = (body.cropType || '').toLowerCase().trim();
    const symptoms: string = (body.symptoms || '').trim();

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

    // Simulate processing delay
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));

    const match = DISEASE_DB[cropType];
    const confidence = +(match.confidence * (0.9 + Math.random() * 0.1)).toFixed(2);
    const relevantSymptoms = commonSymptoms[cropType]?.slice(0, 3).join(', ') || symptoms.slice(0, 50);

    return Response.json({
      success: true,
      data: {
        crop: cropType,
        disease: match.disease,
        confidence,
        risk: match.risk,
        treatment: match.treatment,
        prevention: match.prevention,
        explanation: match.explanation,
        emoji: match.emoji,
        symptoms_matched: relevantSymptoms,
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
    crops: Object.entries(DISEASE_DB).map(([key, val]) => ({
      id: key,
      name: key.charAt(0).toUpperCase() + key.slice(1),
      emoji: val.emoji,
    })),
  });
}
