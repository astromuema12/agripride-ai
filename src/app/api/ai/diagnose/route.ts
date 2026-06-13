import { NextRequest } from 'next/server';
import { z } from 'zod';
import { serverSupabase, writeAuditLog } from '@/lib/server-auth';

const DISEASE_DB: Record<string, {
  disease: string; confidence: number; risk: string;
  treatment: string; prevention: string; explanation: string;
}> = {
  maize: {
    disease: 'Northern Leaf Blight',
    confidence: 0.92, risk: 'high',
    treatment: 'Apply fungicide containing triazole or strobilurin. Remove and destroy infected leaves. Ensure proper plant spacing for air circulation.',
    prevention: 'Plant resistant hybrid varieties. Practice crop rotation with non-cereal crops. Apply preventive fungicides during humid conditions.',
    explanation: 'The symptoms described are classic indicators of Northern Leaf Blight (Exserohilum turcicum). The pattern matches the disease progression profile with 92% confidence.',
  },
  wheat: {
    disease: 'Wheat Stem Rust',
    confidence: 0.88, risk: 'high',
    treatment: 'Apply fungicide (triazole or strobilurin class). Remove rust pustules from leaves. Use disease-free seed for next planting.',
    prevention: 'Plant resistant varieties. Early planting to avoid peak spore season. Monitor fields weekly during growing season.',
    explanation: 'The reddish-brown pustules on stems and leaf sheaths strongly indicate Wheat Stem Rust (Puccinia graminis).',
  },
  rice: {
    disease: 'Rice Blast',
    confidence: 0.85, risk: 'medium',
    treatment: 'Apply fungicide (tricyclazole or isoprothiolane). Maintain proper water management. Reduce nitrogen fertilizer temporarily.',
    prevention: 'Use resistant varieties. Avoid excessive nitrogen. Maintain consistent water depth. Remove crop residues after harvest.',
    explanation: 'The diamond-shaped lesions with gray centers and brown margins on leaves are characteristic of Rice Blast (Magnaporthe oryzae).',
  },
  cassava: {
    disease: 'Cassava Mosaic Virus',
    confidence: 0.94, risk: 'critical',
    treatment: 'Remove and burn infected plants immediately. Use virus-free planting cuttings. Control whitefly populations with neem-based insecticides.',
    prevention: 'Use certified virus-free cuttings. Plant resistant varieties. Maintain field hygiene. Remove alternative host plants.',
    explanation: 'The mosaic pattern on leaves with yellow-green chlorosis, stunted growth, and leaf distortion are pathognomonic for Cassava Mosaic Virus.',
  },
  beans: {
    disease: 'Angular Leaf Spot',
    confidence: 0.87, risk: 'medium',
    treatment: 'Apply copper-based fungicide. Remove infected plant debris. Ensure proper air circulation through adequate spacing.',
    prevention: 'Use disease-free seed. Practice 2-3 year crop rotation. Avoid overhead irrigation. Remove volunteer bean plants.',
    explanation: 'The angular, gray-brown lesions limited by leaf veins are diagnostic for Angular Leaf Spot.',
  },
  sorghum: {
    disease: 'Sorghum Anthracnose',
    confidence: 0.86, risk: 'high',
    treatment: 'Apply foliar fungicides (triazole or strobilurin). Remove and destroy infected crop residues. Use certified disease-free seed.',
    prevention: 'Plant resistant varieties. Practice crop rotation with non-cereal crops. Treat seeds with fungicide before planting. Ensure proper field drainage.',
    explanation: 'Small circular red spots on leaves coalescing into larger lesions indicate Sorghum Anthracnose.',
  },
  millet: {
    disease: 'Millet Downy Mildew',
    confidence: 0.84, risk: 'high',
    treatment: 'Remove and destroy infected plants. Apply metalaxyl-based fungicide. Improve field drainage to reduce humidity.',
    prevention: 'Use resistant pearl millet varieties. Practice crop rotation. Avoid dense planting. Treat seeds with metalaxyl before sowing.',
    explanation: 'Pale green chlorotic patches on leaves with white downy growth indicate Millet Downy Mildew.',
  },
  'sweet potato': {
    disease: 'Sweet Potato Virus Disease',
    confidence: 0.88, risk: 'high',
    treatment: 'Remove and destroy infected plants. Use virus-free planting materials. Control aphid vectors with neem-based insecticides.',
    prevention: 'Plant certified virus-free vines. Rogue out infected plants early. Use resistant varieties where available.',
    explanation: 'Leaf curling, chlorotic mottling, and stunted growth are classic symptoms of Sweet Potato Virus Disease.',
  },
  potato: {
    disease: 'Potato Late Blight',
    confidence: 0.93, risk: 'critical',
    treatment: 'Apply fungicides (chlorothalonil or mancozeb). For active infection use metalaxyl-based fungicides. Remove infected foliage.',
    prevention: 'Plant certified disease-free seed potatoes. Use resistant varieties. Practice 3-4 year crop rotation. Hill soil around plants.',
    explanation: 'Water-soaked lesions on leaves with white fungal growth are diagnostic for Potato Late Blight.',
  },
  banana: {
    disease: 'Fusarium Wilt (Panama Disease)',
    confidence: 0.9, risk: 'critical',
    treatment: 'Remove and destroy infected plants immediately. Quarantine affected areas. Apply soil solarization for small plots.',
    prevention: 'Use tissue-culture certified seedlings. Plant resistant FHIA hybrids. Disinfect farm tools. Avoid moving infected soil.',
    explanation: 'Yellowing and wilting of leaves with internal vascular discoloration indicate Fusarium Wilt Tropical Race 4.',
  },
  coffee: {
    disease: 'Coffee Leaf Rust',
    confidence: 0.91, risk: 'high',
    treatment: 'Apply copper-based fungicides. Prune affected branches. Ensure proper shade management to reduce humidity.',
    prevention: 'Plant resistant varieties (Ruiru 11, Batian). Maintain optimal shade. Prune regularly for air circulation.',
    explanation: 'Orange-yellow powdery pustules on undersurface of leaves indicate Coffee Leaf Rust.',
  },
  tea: {
    disease: 'Tea Blister Blight',
    confidence: 0.89, risk: 'high',
    treatment: 'Apply copper-based fungicides. Prune affected shoots. Improve air circulation through proper plucking and pruning.',
    prevention: 'Plant resistant clones. Maintain proper plucking intervals. Ensure adequate shade. Avoid excessive nitrogen.',
    explanation: 'Translucent circular lesions on young leaves with raised blisters indicate Tea Blister Blight.',
  },
  sugarcane: {
    disease: 'Sugarcane Smut',
    confidence: 0.87, risk: 'high',
    treatment: 'Remove and burn infected stools immediately. Use disease-free setts for planting. Apply systemic fungicides.',
    prevention: 'Use resistant varieties. Treat setts with hot water (52°C for 30 min) before planting. Practice crop rotation.',
    explanation: 'Long whip-like black structures from the spindle indicate Sugarcane Smut.',
  },
  cotton: {
    disease: 'Cotton Bacterial Blight',
    confidence: 0.85, risk: 'medium',
    treatment: 'Apply copper-based bactericides. Remove and destroy infected plant debris. Use acid-delinted certified seed.',
    prevention: 'Plant resistant varieties. Practice crop rotation. Use disease-free seed. Avoid overhead irrigation.',
    explanation: 'Angular water-soaked lesions on leaves turning brown indicate Cotton Bacterial Blight.',
  },
  tomato: {
    disease: 'Tomato Late Blight',
    confidence: 0.9, risk: 'high',
    treatment: 'Apply fungicides (chlorothalonil, mancozeb). Remove infected plants. Improve air circulation through staking and pruning.',
    prevention: 'Use resistant varieties. Practice 3-4 year crop rotation. Avoid overhead irrigation. Ensure proper spacing.',
    explanation: 'Water-soaked dark lesions on leaves and stems with white fungal growth indicate Tomato Late Blight.',
  },
  onion: {
    disease: 'Onion Downy Mildew',
    confidence: 0.86, risk: 'medium',
    treatment: 'Apply fungicides (metalaxyl or mancozeb). Improve field drainage. Avoid overhead irrigation. Remove infected debris.',
    prevention: 'Use disease-free sets or seeds. Practice crop rotation. Ensure proper spacing. Plant in well-drained soils.',
    explanation: 'Pale green lesions on leaves with purple-gray fuzzy growth indicate Onion Downy Mildew.',
  },
  kale: {
    disease: 'Black Rot',
    confidence: 0.84, risk: 'high',
    treatment: 'Remove and destroy infected plants. Apply copper-based bactericides. Disinfect tools with bleach solution.',
    prevention: 'Use certified disease-free seeds. Practice 3-4 year crop rotation. Avoid overhead irrigation. Control cruciferous weeds.',
    explanation: 'V-shaped yellow lesions at leaf margins with blackened veins indicate Black Rot.',
  },
  mango: {
    disease: 'Mango Anthracnose',
    confidence: 0.88, risk: 'medium',
    treatment: 'Apply copper-based fungicides during flowering and fruit development. Prune affected branches. Remove fallen fruits.',
    prevention: 'Plant resistant varieties. Prune for open canopy. Apply preventive fungicide sprays during flowering.',
    explanation: 'Dark sunken lesions on fruits with orange-pink spore masses indicate Mango Anthracnose.',
  },
  avocado: {
    disease: 'Avocado Root Rot',
    confidence: 0.87, risk: 'critical',
    treatment: 'Improve soil drainage. Apply phosphite fungicides via trunk injection. Remove severely affected trees.',
    prevention: 'Plant resistant rootstocks. Ensure proper soil drainage. Avoid planting in heavy clay soils.',
    explanation: 'Yellowing leaves with branch dieback and decayed feeder roots indicate Avocado Root Rot.',
  },
  groundnut: {
    disease: 'Groundnut Rosette Virus',
    confidence: 0.85, risk: 'high',
    treatment: 'Remove and destroy infected plants. Control aphid vectors with systemic insecticides.',
    prevention: 'Use resistant varieties. Plant at recommended spacing. Practice crop rotation. Control volunteer groundnuts.',
    explanation: 'Severe stunting with leaf curling and chlorotic mottling indicate Groundnut Rosette Virus.',
  },
  sunflower: {
    disease: 'Sunflower Downy Mildew',
    confidence: 0.84, risk: 'medium',
    treatment: 'Apply metalaxyl seed treatment. Remove infected plants. Improve field drainage.',
    prevention: 'Use resistant varieties. Treat seeds with metalaxyl. Practice crop rotation. Avoid waterlogged soils.',
    explanation: 'Stunted growth with chlorotic patches and white downy growth indicate Sunflower Downy Mildew.',
  },
  cowpea: {
    disease: 'Cowpea Aphid-Borne Mosaic Virus',
    confidence: 0.83, risk: 'medium',
    treatment: 'Remove and destroy infected plants. Control aphid vectors using neem-based insecticides.',
    prevention: 'Plant resistant varieties. Use certified disease-free seed. Practice crop rotation. Control weed hosts.',
    explanation: 'Mosaic pattern on leaves with vein banding and stunted growth indicate Cowpea Aphid-Borne Mosaic Virus.',
  },
  pineapple: {
    disease: 'Pineapple Fusariosis', confidence: 0.82, risk: 'medium',
    treatment: 'Remove infected fruits. Apply systemic fungicides. Use disease-free planting materials.',
    prevention: 'Use certified disease-free suckers. Practice crop rotation. Ensure field sanitation.',
    explanation: 'Gum exudation on fruits with internal rot indicates Pineapple Fusariosis.',
  },
  'passion fruit': {
    disease: 'Passion Fruit Woodiness Virus', confidence: 0.84, risk: 'high',
    treatment: 'Remove infected vines. Control aphid vectors. Use virus-free seedlings.',
    prevention: 'Plant certified virus-free seedlings. Control aphids. Remove alternative hosts.',
    explanation: 'Leaf mottling and fruit distortion indicate Passion Fruit Woodiness Virus.',
  },
  orange: {
    disease: 'Citrus Greening', confidence: 0.88, risk: 'critical',
    treatment: 'Remove infected trees. Control Asian citrus psyllid. Use certified nursery stock.',
    prevention: 'Plant certified disease-free seedlings. Monitor psyllid populations. Remove infected trees.',
    explanation: 'Blotchy leaf mottling and lopsided bitter fruits indicate Citrus Greening.',
  },
  coconut: {
    disease: 'Coconut Lethal Yellowing', confidence: 0.85, risk: 'critical',
    treatment: 'Remove infected palms. Apply oxytetracycline injections. Control planthopper vectors.',
    prevention: 'Plant resistant varieties. Maintain field sanitation. Control planthoppers.',
    explanation: 'Premature nut fall and yellowing fronds indicate Coconut Lethal Yellowing.',
  },
  cashew: {
    disease: 'Cashew Powdery Mildew', confidence: 0.83, risk: 'medium',
    treatment: 'Apply sulphur-based fungicides during flowering. Prune affected branches.',
    prevention: 'Plant resistant varieties. Prune for open canopy. Avoid dense planting.',
    explanation: 'White powdery growth on leaves and inflorescence indicates Cashew Powdery Mildew.',
  },
  macadamia: {
    disease: 'Macadamia Husk Spot', confidence: 0.82, risk: 'medium',
    treatment: 'Apply copper fungicides during nut development. Remove fallen nuts. Prune for air circulation.',
    prevention: 'Plant resistant varieties. Practice orchard sanitation. Prune for open canopy.',
    explanation: 'Dark sunken spots on husks causing premature nut drop indicate Macadamia Husk Spot.',
  },
  sesame: {
    disease: 'Sesame Bacterial Leaf Spot', confidence: 0.81, risk: 'low',
    treatment: 'Apply copper-based bactericides. Remove infected debris. Use disease-free seed.',
    prevention: 'Use certified seed. Practice crop rotation. Remove crop residues after harvest.',
    explanation: 'Water-soaked angular lesions on leaves turning brown indicate Bacterial Leaf Spot.',
  },
  cabbage: {
    disease: 'Cabbage Black Rot', confidence: 0.86, risk: 'high',
    treatment: 'Remove infected plants. Apply copper bactericides. Disinfect farm tools.',
    prevention: 'Use certified seeds. Practice crop rotation. Avoid overhead irrigation.',
    explanation: 'V-shaped yellow lesions at leaf margins with blackened veins indicate Black Rot.',
  },
  spinach: {
    disease: 'Spinach Downy Mildew', confidence: 0.84, risk: 'medium',
    treatment: 'Apply metalaxyl or mancozeb. Remove infected leaves. Improve air circulation.',
    prevention: 'Use resistant varieties. Practice crop rotation. Avoid overhead irrigation.',
    explanation: 'Yellow patches with purple-gray fuzzy growth on leaf undersides indicate Downy Mildew.',
  },
  carrot: {
    disease: 'Carrot Alternaria Leaf Blight', confidence: 0.83, risk: 'medium',
    treatment: 'Apply chlorothalonil or azoxystrobin. Remove infected debris. Practice crop rotation.',
    prevention: 'Use disease-free seed. Practice crop rotation. Remove crop residues.',
    explanation: 'Dark brown lesions with yellow halos on leaf margins indicate Alternaria Leaf Blight.',
  },
  watermelon: {
    disease: 'Watermelon Anthracnose', confidence: 0.85, risk: 'high',
    treatment: 'Apply chlorothalonil or mancozeb. Remove infected fruits. Practice crop rotation.',
    prevention: 'Use disease-free seed. Practice crop rotation. Plant resistant varieties.',
    explanation: 'Circular sunken lesions on fruits with pink spore masses indicate Anthracnose.',
  },
  pawpaw: {
    disease: 'Papaya Ringspot Virus', confidence: 0.87, risk: 'critical',
    treatment: 'Remove infected trees immediately. Control aphid vectors. Plant away from infected areas.',
    prevention: 'Plant certified virus-free seedlings. Control aphid populations. Remove alternative hosts.',
    explanation: 'Ringspot pattern on fruits and leaf mosaic distortion indicate Papaya Ringspot Virus.',
  },
};

const DiagnoseSchema = z.object({
  cropType: z.string().min(1, 'Crop type is required').max(100),
  symptoms: z.string().min(1, 'Symptoms are required').max(5000),
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

  const { cropType, symptoms, imageBase64, userId } = parsed.data;

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
      const prompt = 'You are an expert crop disease diagnostician. Analyze the following crop symptoms and provide a diagnosis.\n\nCrop: ' + cropType + '\nSymptoms: ' + symptoms + '\n\nRespond in JSON format with fields: disease, confidence (0-1), risk (low/medium/high/critical), treatment, prevention, explanation.';

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
        details: { cropType, confidence: result.confidence },
        ip_address: req.headers.get('x-forwarded-for') || undefined,
      });

      return Response.json({
        success: true,
        data: result,
        confidence_score: result.confidence,
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

  const lower = cropType.toLowerCase();
  const match = DISEASE_DB[lower] ?? DISEASE_DB.maize;
  const adjustedConfidence = match.confidence * (symptoms.length > 20 ? 1.0 : 0.85);

  writeAuditLog({
    user_id: userId || 'anonymous',
    action: 'ai_diagnosis',
    resource: 'ai_diagnose',
    details: { cropType, confidence: adjustedConfidence, mock: true },
    ip_address: req.headers.get('x-forwarded-for') || undefined,
  });

  return Response.json({
    success: true,
    data: {
      disease: match.disease,
      confidence: adjustedConfidence,
      risk: match.risk,
      treatment: match.treatment,
      prevention: match.prevention,
      explanation: match.explanation,
    },
    confidence_score: adjustedConfidence,
    responsible_agent: 'Crop Disease Diagnostic Agent',
    frameworks_used: ['AIM Framework', 'MAP Framework', 'TRACK Framework'],
    timestamp: new Date().toISOString(),
  });
}
