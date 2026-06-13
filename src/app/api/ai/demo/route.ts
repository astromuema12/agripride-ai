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
  sorghum: {
    disease: 'Sorghum Anthracnose', confidence: 0.86, risk: 'high',
    treatment: 'Apply foliar fungicides (triazole or strobilurin). Remove infected crop residues.',
    prevention: 'Plant resistant varieties. Practice crop rotation. Treat seeds before planting.',
    explanation: 'Small circular red spots on leaves coalescing into larger lesions indicate Sorghum Anthracnose.',
    emoji: '🌾',
  },
  millet: {
    disease: 'Millet Downy Mildew', confidence: 0.84, risk: 'high',
    treatment: 'Remove infected plants. Apply metalaxyl-based fungicide. Improve field drainage.',
    prevention: 'Use resistant varieties. Practice crop rotation. Treat seeds with metalaxyl.',
    explanation: 'Pale green chlorotic patches with white downy growth indicate Millet Downy Mildew.',
    emoji: '🌾',
  },
  'sweet potato': {
    disease: 'Sweet Potato Virus Disease', confidence: 0.88, risk: 'high',
    treatment: 'Remove infected plants. Use virus-free planting materials. Control aphid vectors.',
    prevention: 'Plant certified virus-free vines. Use resistant varieties where available.',
    explanation: 'Leaf curling, chlorotic mottling, and stunted growth indicate Sweet Potato Virus Disease.',
    emoji: '🍠',
  },
  potato: {
    disease: 'Potato Late Blight', confidence: 0.93, risk: 'critical',
    treatment: 'Apply fungicides (chlorothalonil or mancozeb). Remove infected foliage.',
    prevention: 'Plant certified disease-free seed potatoes. Practice crop rotation. Use resistant varieties.',
    explanation: 'Water-soaked lesions with white fungal growth indicate Potato Late Blight.',
    emoji: '🥔',
  },
  banana: {
    disease: 'Fusarium Wilt (Panama Disease)', confidence: 0.9, risk: 'critical',
    treatment: 'Remove infected plants. Quarantine affected areas. Use soil solarization.',
    prevention: 'Use tissue-culture seedlings. Plant resistant FHIA hybrids. Disinfect tools.',
    explanation: 'Yellowing leaves with internal vascular discoloration indicate Fusarium Wilt.',
    emoji: '🍌',
  },
  coffee: {
    disease: 'Coffee Leaf Rust', confidence: 0.91, risk: 'high',
    treatment: 'Apply copper-based fungicides. Prune affected branches. Manage shade.',
    prevention: 'Plant resistant varieties (Ruiru 11, Batian). Maintain optimal shade. Prune regularly.',
    explanation: 'Orange-yellow powdery pustules on leaf undersurface indicate Coffee Leaf Rust.',
    emoji: '☕',
  },
  tea: {
    disease: 'Tea Blister Blight', confidence: 0.89, risk: 'high',
    treatment: 'Apply copper-based fungicides. Prune affected shoots. Improve air circulation.',
    prevention: 'Plant resistant clones. Maintain proper plucking intervals. Ensure adequate shade.',
    explanation: 'Translucent circular lesions on young leaves with raised blisters indicate Tea Blister Blight.',
    emoji: '🍵',
  },
  sugarcane: {
    disease: 'Sugarcane Smut', confidence: 0.87, risk: 'high',
    treatment: 'Remove infected stools. Use disease-free setts. Apply systemic fungicides.',
    prevention: 'Use resistant varieties. Treat setts with hot water. Practice crop rotation.',
    explanation: 'Long whip-like black structures from the spindle indicate Sugarcane Smut.',
    emoji: '🎋',
  },
  cotton: {
    disease: 'Cotton Bacterial Blight', confidence: 0.85, risk: 'medium',
    treatment: 'Apply copper-based bactericides. Remove infected debris. Use certified seed.',
    prevention: 'Plant resistant varieties. Practice crop rotation. Avoid overhead irrigation.',
    explanation: 'Angular water-soaked lesions on leaves turning brown indicate Cotton Bacterial Blight.',
    emoji: '🌿',
  },
  tomato: {
    disease: 'Tomato Late Blight', confidence: 0.9, risk: 'high',
    treatment: 'Apply fungicides (chlorothalonil, mancozeb). Remove infected plants. Improve air circulation.',
    prevention: 'Use resistant varieties. Practice crop rotation. Avoid overhead irrigation.',
    explanation: 'Water-soaked dark lesions with white fungal growth indicate Tomato Late Blight.',
    emoji: '🍅',
  },
  onion: {
    disease: 'Onion Downy Mildew', confidence: 0.86, risk: 'medium',
    treatment: 'Apply fungicides (metalaxyl or mancozeb). Improve field drainage. Avoid overhead irrigation.',
    prevention: 'Use disease-free sets. Practice crop rotation. Ensure proper spacing.',
    explanation: 'Pale green lesions with purple-gray fuzzy growth indicate Onion Downy Mildew.',
    emoji: '🧅',
  },
  kale: {
    disease: 'Black Rot', confidence: 0.84, risk: 'high',
    treatment: 'Remove infected plants. Apply copper-based bactericides. Disinfect tools.',
    prevention: 'Use certified seeds. Practice crop rotation. Avoid overhead irrigation.',
    explanation: 'V-shaped yellow lesions at leaf margins with blackened veins indicate Black Rot.',
    emoji: '🥬',
  },
  mango: {
    disease: 'Mango Anthracnose', confidence: 0.88, risk: 'medium',
    treatment: 'Apply copper-based fungicides during flowering. Prune affected branches.',
    prevention: 'Plant resistant varieties. Prune for open canopy. Maintain orchard sanitation.',
    explanation: 'Dark sunken lesions on fruits with orange-pink spore masses indicate Mango Anthracnose.',
    emoji: '🥭',
  },
  avocado: {
    disease: 'Avocado Root Rot', confidence: 0.87, risk: 'critical',
    treatment: 'Improve soil drainage. Apply phosphite fungicides. Remove severely affected trees.',
    prevention: 'Plant resistant rootstocks. Ensure good drainage. Avoid heavy clay soils.',
    explanation: 'Yellowing leaves with branch dieback and decayed roots indicate Avocado Root Rot.',
    emoji: '🥑',
  },
  groundnut: {
    disease: 'Groundnut Rosette Virus', confidence: 0.85, risk: 'high',
    treatment: 'Remove infected plants. Control aphid vectors with systemic insecticides.',
    prevention: 'Use resistant varieties. Plant at recommended spacing. Practice crop rotation.',
    explanation: 'Severe stunting with leaf curling and chlorotic mottling indicate Groundnut Rosette Virus.',
    emoji: '🥜',
  },
  sunflower: {
    disease: 'Sunflower Downy Mildew', confidence: 0.84, risk: 'medium',
    treatment: 'Apply metalaxyl seed treatment. Remove infected plants. Improve drainage.',
    prevention: 'Use resistant varieties. Treat seeds with metalaxyl. Practice crop rotation.',
    explanation: 'Stunted growth with chlorotic patches and white downy growth indicate Sunflower Downy Mildew.',
    emoji: '🌻',
  },
  cowpea: {
    disease: 'Cowpea Aphid-Borne Mosaic Virus', confidence: 0.83, risk: 'medium',
    treatment: 'Remove infected plants. Control aphid vectors using neem-based insecticides.',
    prevention: 'Plant resistant varieties. Use certified seed. Practice crop rotation.',
    explanation: 'Mosaic pattern on leaves with vein banding and stunted growth indicate Cowpea Aphid-Borne Mosaic Virus.',
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
  sorghum: ['red circular spots', 'leaf lesions coalescing', 'stunted growth', 'grain discoloration', 'leaf blight'],
  millet: ['chlorotic patches', 'white downy growth', 'stunted tillers', 'leaf shredding', 'poor head formation'],
  'sweet potato': ['leaf curling', 'yellow mottling', 'stunted vines', 'reduced tuber size', 'leaf distortion'],
  potato: ['water-soaked lesions', 'white fungal growth', 'leaf wilting', 'stem rot', 'tuber rot'],
  banana: ['leaf yellowing', 'vascular discoloration', 'wilting leaves', 'stunted growth', 'fruit splitting'],
  coffee: ['orange pustules', 'leaf fall', 'yellow spots', 'defoliation', 'berry drop'],
  tea: ['translucent lesions', 'blistered leaves', 'shoot distortion', 'leaf fall', 'reduced flush'],
  sugarcane: ['black whip structures', 'stunted stalks', 'reduced sugar content', 'tillering reduction', 'leaf yellowing'],
  cotton: ['angular leaf spots', 'boll rot', 'wilting', 'stem lesions', 'bacterial ooze'],
  tomato: ['dark leaf lesions', 'stem cankers', 'fruit rot', 'white fungal growth', 'leaf wilting'],
  onion: ['pale leaf lesions', 'purple fungal growth', 'leaf dieback', 'bulb rot', 'stunted growth'],
  kale: ['V-shaped yellow lesions', 'blackened veins', 'leaf yellowing', 'wilting', 'stunted growth'],
  mango: ['dark fruit lesions', 'flower blight', 'leaf spots', 'fruit drop', 'stem end rot'],
  avocado: ['leaf yellowing', 'branch dieback', 'reduced fruiting', 'root decay', 'wilting'],
  groundnut: ['severe stunting', 'leaf curling', 'chlorotic mottling', 'reduced pod set', 'yellow patches'],
  sunflower: ['chlorotic patches', 'white downy growth', 'stunted plants', 'head distortion', 'leaf curling'],
  cowpea: ['mosaic pattern', 'vein banding', 'leaf distortion', 'stunted growth', 'reduced podding'],
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
