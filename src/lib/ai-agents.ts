import { AIAgentResponse } from '@/types';

const diseaseDatabase: Record<string, {
  disease: string;
  confidence: number;
  risk: 'low' | 'medium' | 'high' | 'critical';
  treatment: string;
  prevention: string;
  explanation: string;
}> = {
  maize: {
    disease: 'Northern Leaf Blight',
    confidence: 0.92,
    risk: 'high',
    treatment: 'Apply fungicide containing triazole or strobilurin. Remove and destroy infected leaves. Ensure proper plant spacing for air circulation.',
    prevention: 'Plant resistant hybrid varieties. Practice crop rotation with non-cereal crops. Apply preventive fungicides during humid conditions.',
    explanation: 'The symptoms described (elongated gray-green lesions on lower leaves, spreading upward) are classic indicators of Northern Leaf Blight (Exserohilum turcicum). The pattern matches the disease progression profile with 92% confidence.',
  },
  wheat: {
    disease: 'Wheat Stem Rust',
    confidence: 0.88,
    risk: 'high',
    treatment: 'Apply fungicide (triazole or strobilurin class). Remove rust pustules from leaves. Use disease-free seed for next planting.',
    prevention: 'Plant resistant varieties. Early planting to avoid peak spore season. Monitor fields weekly during growing season.',
    explanation: 'The reddish-brown pustules on stems and leaf sheaths, combined with the timing in the growing season, strongly indicate Wheat Stem Rust (Puccinia graminis).',
  },
  cassava: {
    disease: 'Cassava Mosaic Virus',
    confidence: 0.94,
    risk: 'critical',
    treatment: 'Remove and burn infected plants immediately. Use virus-free planting cuttings. Control whitefly populations with neem-based insecticides.',
    prevention: 'Use certified virus-free cuttings. Plant resistant varieties. Maintain field hygiene. Remove alternative host plants.',
    explanation: 'The mosaic pattern on leaves with yellow-green chlorosis, stunted growth, and leaf distortion are pathognomonic for Cassava Mosaic Virus, with very high confidence.',
  },
  rice: {
    disease: 'Rice Blast',
    confidence: 0.85,
    risk: 'medium',
    treatment: 'Apply fungicide (tricyclazole or isoprothiolane). Maintain proper water management. Reduce nitrogen fertilizer temporarily.',
    prevention: 'Use resistant varieties. Avoid excessive nitrogen. Maintain consistent water depth. Remove crop residues after harvest.',
    explanation: 'The diamond-shaped lesions with gray centers and brown margins on leaves are characteristic of Rice Blast (Magnaporthe oryzae).',
  },
  beans: {
    disease: 'Angular Leaf Spot',
    confidence: 0.87,
    risk: 'medium',
    treatment: 'Apply copper-based fungicide. Remove infected plant debris. Ensure proper air circulation through adequate spacing.',
    prevention: 'Use disease-free seed. Practice 2-3 year crop rotation. Avoid overhead irrigation. Remove volunteer bean plants.',
    explanation: 'The angular, gray-brown lesions limited by leaf veins, with dark brown margins on the undersurface, are diagnostic for Angular Leaf Spot.',
  },
  sorghum: {
    disease: 'Sorghum Anthracnose',
    confidence: 0.86,
    risk: 'high',
    treatment: 'Apply foliar fungicides (triazole or strobilurin). Remove and destroy infected crop residues. Use certified disease-free seed.',
    prevention: 'Plant resistant varieties. Practice crop rotation with non-cereal crops. Treat seeds with fungicide before planting. Ensure proper field drainage.',
    explanation: 'The small, circular to elliptical red spots on leaves that coalesce into larger lesions are characteristic of Sorghum Anthracnose (Colletotrichum sublineolum).',
  },
  millet: {
    disease: 'Millet Downy Mildew',
    confidence: 0.84,
    risk: 'high',
    treatment: 'Remove and destroy infected plants. Apply metalaxyl-based fungicide. Improve field drainage to reduce humidity.',
    prevention: 'Use resistant pearl millet varieties. Practice crop rotation. Avoid dense planting. Treat seeds with metalaxyl before sowing.',
    explanation: 'The pale green to yellow chlorotic patches on leaves with white downy growth on the undersurface indicate Millet Downy Mildew (Sclerospora graminicola).',
  },
  'sweet potato': {
    disease: 'Sweet Potato Virus Disease',
    confidence: 0.88,
    risk: 'high',
    treatment: 'Remove and destroy infected plants. Use virus-free planting materials. Control aphid vectors with neem-based insecticides.',
    prevention: 'Plant certified virus-free vines. Rogue out infected plants early. Use resistant varieties where available. Maintain field hygiene.',
    explanation: 'The leaf curling, chlorotic mottling, and stunted growth with reduced root formation are classic symptoms of Sweet Potato Virus Disease complex.',
  },
  potato: {
    disease: 'Potato Late Blight',
    confidence: 0.93,
    risk: 'critical',
    treatment: 'Apply fungicides containing chlorothalonil or mancozeb preventively. For active infection, use metalaxyl-based systemic fungicides. Remove and destroy infected foliage.',
    prevention: 'Plant certified disease-free seed potatoes. Use resistant varieties. Practice crop rotation (3-4 years). Avoid overhead irrigation. Hill soil around plants.',
    explanation: 'The water-soaked lesions on leaves with white fungal growth at lesion margins under humid conditions are diagnostic for Potato Late Blight (Phytophthora infestans).',
  },
  banana: {
    disease: 'Fusarium Wilt (Panama Disease)',
    confidence: 0.9,
    risk: 'critical',
    treatment: 'Remove and destroy infected plants immediately. Apply systemic fungicides. Quarantine affected areas. Use soil solarization for small plots.',
    prevention: 'Use tissue-culture certified disease-free seedlings. Plant resistant varieties (FHIA hybrids). Avoid movement of infected soil and plant material. Disinfect farm tools.',
    explanation: 'The yellowing and wilting of lower leaves progressing inward, with internal vascular discoloration in the pseudostem, strongly indicate Fusarium Wilt Tropical Race 4.',
  },
  coffee: {
    disease: 'Coffee Leaf Rust',
    confidence: 0.91,
    risk: 'high',
    treatment: 'Apply copper-based fungicides or triazole fungicides. Prune affected branches. Ensure proper shade management to reduce humidity.',
    prevention: 'Plant resistant varieties (e.g., Ruiru 11, Batian). Maintain optimal shade levels. Prune regularly for air circulation. Apply preventive fungicides before rainy seasons.',
    explanation: 'The orange-yellow powdery pustules on the undersurface of coffee leaves are pathognomonic for Coffee Leaf Rust (Hemileia vastatrix).',
  },
  tea: {
    disease: 'Tea Blister Blight',
    confidence: 0.89,
    risk: 'high',
    treatment: 'Apply copper-based fungicides. Prune affected shoots. Improve air circulation through proper plucking and pruning.',
    prevention: 'Plant resistant clones. Maintain proper plucking intervals. Ensure adequate shade. Avoid excessive nitrogen fertilization.',
    explanation: 'The translucent, circular lesions on young leaves that later turn brown and concave with a raised blister on the opposite side are characteristic of Tea Blister Blight (Exobasidium vexans).',
  },
  sugarcane: {
    disease: 'Sugarcane Smut',
    confidence: 0.87,
    risk: 'high',
    treatment: 'Remove and burn infected stools immediately. Apply systemic fungicides. Use disease-free setts for planting.',
    prevention: 'Use resistant varieties. Treat setts with hot water (52°C for 30 minutes) before planting. Practice crop rotation. Avoid ratooning infected fields.',
    explanation: 'The long, whip-like black structures emerging from the spindle of sugarcane stalks are characteristic of Sugarcane Smut (Ustilago scitaminea).',
  },
  cotton: {
    disease: 'Cotton Bacterial Blight',
    confidence: 0.85,
    risk: 'medium',
    treatment: 'Apply copper-based bactericides. Remove and destroy infected plant debris. Use acid-delinted certified seed.',
    prevention: 'Plant resistant varieties. Practice crop rotation. Use disease-free seed. Avoid overhead irrigation. Remove crop residues after harvest.',
    explanation: 'The angular, water-soaked lesions on leaves that turn brown and necrotic, with bacterial ooze in humid conditions, indicate Cotton Bacterial Blight (Xanthomonas campestris pv. malvacearum).',
  },
  tomato: {
    disease: 'Tomato Late Blight',
    confidence: 0.9,
    risk: 'high',
    treatment: 'Apply fungicides (chlorothalonil, mancozeb, or metalaxyl). Remove and destroy infected plants. Improve air circulation through pruning and staking.',
    prevention: 'Use resistant varieties. Practice crop rotation (3-4 years). Avoid overhead irrigation. Ensure proper plant spacing. Remove volunteer tomato plants.',
    explanation: 'The water-soaked, dark green to brown lesions on leaves and stems with white fungal growth under humid conditions are diagnostic for Tomato Late Blight (Phytophthora infestans).',
  },
  onion: {
    disease: 'Onion Downy Mildew',
    confidence: 0.86,
    risk: 'medium',
    treatment: 'Apply fungicides (metalaxyl or mancozeb). Improve field drainage. Avoid overhead irrigation. Remove infected plant debris.',
    prevention: 'Use disease-free sets or seeds. Practice crop rotation. Ensure proper spacing for air circulation. Plant in well-drained soils with good sun exposure.',
    explanation: 'The pale green to yellow lesions on leaves with purple-gray fuzzy growth during humid weather are characteristic of Onion Downy Mildew (Peronospora destructor).',
  },
  kale: {
    disease: 'Black Rot',
    confidence: 0.84,
    risk: 'high',
    treatment: 'Remove and destroy infected plants. Apply copper-based bactericides. Avoid working in wet fields. Disinfect tools with bleach solution.',
    prevention: 'Use certified disease-free seeds. Practice crop rotation (3-4 years). Avoid overhead irrigation. Control cruciferous weeds. Plant resistant varieties.',
    explanation: 'The V-shaped yellow lesions at leaf margins with blackened veins progressing toward the midrib are diagnostic for Black Rot (Xanthomonas campestris pv. campestris).',
  },
  mango: {
    disease: 'Mango Anthracnose',
    confidence: 0.88,
    risk: 'medium',
    treatment: 'Apply copper-based fungicides during flowering and fruit development. Prune affected branches. Remove and destroy fallen fruits and debris.',
    prevention: 'Plant resistant varieties. Prune for open canopy and air circulation. Apply preventive fungicide sprays during flowering. Maintain orchard sanitation.',
    explanation: 'The dark brown to black sunken lesions on fruits with orange-pink spore masses under humid conditions, plus leaf spots and blossom blight, indicate Mango Anthracnose (Colletotrichum gloeosporioides).',
  },
  avocado: {
    disease: 'Avocado Root Rot',
    confidence: 0.87,
    risk: 'critical',
    treatment: 'Improve soil drainage. Apply phosphite fungicides via trunk injection or foliar spray. Remove severely affected trees. Avoid over-irrigation.',
    prevention: 'Plant resistant rootstocks. Ensure proper soil drainage before planting. Avoid planting in heavy clay soils. Use well-draining planting sites. Maintain proper irrigation schedules.',
    explanation: 'The yellowing and wilting of leaves with branch dieback, reduced fruit size, and decayed feeder roots indicate Avocado Root Rot (Phytophthora cinnamomi).',
  },
  'groundnut': {
    disease: 'Groundnut Rosette Virus',
    confidence: 0.85,
    risk: 'high',
    treatment: 'Remove and destroy infected plants. Control aphid vectors with systemic insecticides. Plant at optimal density to reduce aphid landing.',
    prevention: 'Use resistant varieties. Plant at recommended spacing. Practice crop rotation. Avoid planting near Groundnut Rosette Virus hotspots. Control volunteer groundnuts.',
    explanation: 'The severe stunting with leaf curling, chlorotic mottling, and reduced pod formation are characteristic of Groundnut Rosette Virus disease complex.',
  },
  sunflower: {
    disease: 'Sunflower Downy Mildew',
    confidence: 0.84,
    risk: 'medium',
    treatment: 'Apply metalaxyl-based fungicide seed treatment. Remove infected plants. Improve field drainage. Reduce plant density for air circulation.',
    prevention: 'Use resistant varieties. Treat seeds with metalaxyl before planting. Practice crop rotation. Avoid planting in waterlogged soils.',
    explanation: 'The stunted growth with pale green chlorotic patches on leaves and white downy growth on the undersurface indicate Sunflower Downy Mildew (Plasmopara halstedii).',
  },
  cowpea: {
    disease: 'Cowpea Aphid-Borne Mosaic Virus',
    confidence: 0.83,
    risk: 'medium',
    treatment: 'Remove and destroy infected plants. Control aphid vectors using neem-based insecticides or systemic insecticides. Use virus-free seed.',
    prevention: 'Plant resistant varieties. Use certified disease-free seed. Practice crop rotation. Avoid planting near infected fields. Control weed hosts.',
    explanation: 'The mosaic pattern on leaves with vein banding, leaf distortion, and stunted growth are characteristic of Cowpea Aphid-Borne Mosaic Virus.',
  },
  pineapple: {
    disease: 'Pineapple Fusariosis',
    confidence: 0.82,
    risk: 'medium',
    treatment: 'Remove and destroy infected fruits and plants. Apply systemic fungicides. Improve field drainage. Use disease-free planting materials.',
    prevention: 'Use certified disease-free suckers or crowns. Practice crop rotation. Avoid mechanical damage to fruits. Ensure proper field sanitation.',
    explanation: 'The gum exudation on fruits with internal rot and plant wilting indicate Pineapple Fusariosis (Fusarium subglutinans).',
  },
  'passion fruit': {
    disease: 'Passion Fruit Woodiness Virus',
    confidence: 0.84,
    risk: 'high',
    treatment: 'Remove and destroy infected vines. Control aphid vectors with neem-based insecticides. Use virus-free planting materials.',
    prevention: 'Plant certified virus-free seedlings. Control aphid populations. Remove alternative host plants. Practice field sanitation.',
    explanation: 'The leaf mottling, fruit distortion with hard rind, and stunted vine growth are characteristic of Passion Fruit Woodiness Virus.',
  },
  orange: {
    disease: 'Citrus Greening (Huanglongbing)',
    confidence: 0.88,
    risk: 'critical',
    treatment: 'Remove and destroy infected trees. Control Asian citrus psyllid with systemic insecticides. Use certified disease-free nursery stock.',
    prevention: 'Plant certified disease-free seedlings. Monitor and control psyllid populations. Remove infected trees promptly. Use reflective mulch to repel psyllids.',
    explanation: 'The blotchy mottling of leaves, lopsided bitter fruits with color inversion, and premature fruit drop indicate Citrus Greening (Candidatus Liberibacter spp.).',
  },
  coconut: {
    disease: 'Coconut Lethal Yellowing',
    confidence: 0.85,
    risk: 'critical',
    treatment: 'Remove and destroy infected palms immediately. Apply antibiotic injections (oxytetracycline) for early-stage trees. Control planthopper vectors.',
    prevention: 'Plant resistant/tolerant varieties. Maintain good field sanitation. Control planthopper populations. Avoid movement of infected plant material.',
    explanation: 'The premature nut fall, yellowing of lower fronds progressing upward, and blackening of inflorescence indicate Coconut Lethal Yellowing phytoplasma.',
  },
  cashew: {
    disease: 'Cashew Powdery Mildew',
    confidence: 0.83,
    risk: 'medium',
    treatment: 'Apply sulphur-based or triazole fungicides during flowering. Prune affected branches. Improve air circulation through proper spacing.',
    prevention: 'Plant resistant varieties. Prune for open canopy. Apply preventive fungicides before flowering. Avoid dense planting.',
    explanation: 'The white powdery growth on young leaves, inflorescence, and developing nuts with distorted growth indicate Cashew Powdery Mildew.',
  },
  macadamia: {
    disease: 'Macadamia Husk Spot',
    confidence: 0.82,
    risk: 'medium',
    treatment: 'Apply copper-based fungicides during nut development. Remove and destroy fallen nuts. Prune for better air circulation.',
    prevention: 'Plant resistant varieties. Practice orchard sanitation. Prune to maintain open canopy. Ensure proper drainage.',
    explanation: 'The small dark sunken spots on husks that enlarge and cause premature nut drop indicate Macadamia Husk Spot (Pseudocercospora macadamiae).',
  },
  sesame: {
    disease: 'Sesame Bacterial Leaf Spot',
    confidence: 0.81,
    risk: 'low',
    treatment: 'Apply copper-based bactericides. Remove and destroy infected plant debris. Use disease-free seed.',
    prevention: 'Use certified disease-free seed. Practice crop rotation. Avoid overhead irrigation. Remove crop residues after harvest.',
    explanation: 'The small water-soaked angular lesions on leaves that turn brown and necrotic indicate Sesame Bacterial Leaf Spot.',
  },
  'pigeon peas': {
    disease: 'Pigeon Pea Fusarium Wilt',
    confidence: 0.84,
    risk: 'high',
    treatment: 'Remove and destroy wilted plants. Apply soil drench with systemic fungicides. Practice crop rotation with non-host crops.',
    prevention: 'Plant resistant varieties. Use disease-free seed. Practice crop rotation (3-4 years). Improve soil drainage.',
    explanation: 'The progressive yellowing and wilting of leaves with vascular discoloration in stems indicate Pigeon Pea Fusarium Wilt.',
  },
  cabbage: {
    disease: 'Cabbage Black Rot',
    confidence: 0.86,
    risk: 'high',
    treatment: 'Remove and destroy infected plants. Apply copper-based bactericides. Disinfect farm tools with bleach solution.',
    prevention: 'Use certified disease-free seeds. Practice 3-4 year crop rotation. Avoid overhead irrigation. Control cruciferous weeds.',
    explanation: 'The V-shaped yellow lesions at leaf margins with blackened veins progressing toward midrib indicate Cabbage Black Rot.',
  },
  spinach: {
    disease: 'Spinach Downy Mildew',
    confidence: 0.84,
    risk: 'medium',
    treatment: 'Apply fungicides (metalaxyl or mancozeb). Remove infected leaves. Improve air circulation through proper spacing.',
    prevention: 'Use resistant varieties. Practice crop rotation. Avoid overhead irrigation. Ensure proper plant spacing.',
    explanation: 'The yellow patches on upper leaf surfaces with purple-gray fuzzy growth on undersides indicate Spinach Downy Mildew.',
  },
  carrot: {
    disease: 'Carrot Alternaria Leaf Blight',
    confidence: 0.83,
    risk: 'medium',
    treatment: 'Apply fungicides (chlorothalonil or azoxystrobin). Remove infected plant debris. Practice crop rotation.',
    prevention: 'Use disease-free seed. Practice 3-4 year crop rotation. Remove crop residues. Avoid overhead irrigation.',
    explanation: 'The dark brown to black lesions with yellow halos on leaf margins and tips indicate Carrot Alternaria Leaf Blight.',
  },
  watermelon: {
    disease: 'Watermelon Anthracnose',
    confidence: 0.85,
    risk: 'high',
    treatment: 'Apply fungicides (chlorothalonil or mancozeb). Remove infected fruits and vines. Practice crop rotation.',
    prevention: 'Use disease-free seed. Practice crop rotation (3-4 years). Plant resistant varieties. Avoid overhead irrigation.',
    explanation: 'The circular sunken lesions on fruits with pink spore masses and leaf spots indicate Watermelon Anthracnose.',
  },
  pawpaw: {
    disease: 'Papaya Ringspot Virus',
    confidence: 0.87,
    risk: 'critical',
    treatment: 'Remove and destroy infected trees immediately. Control aphid vectors. Plant new trees away from infected areas.',
    prevention: 'Plant certified virus-free seedlings. Use cross-protection with mild strain. Control aphid populations. Remove alternative hosts.',
    explanation: 'The ringspot pattern on fruits, leaf mosaic and distortion, and stunted tree growth indicate Papaya Ringspot Virus.',
  },
};

export function diagnoseDisease(
  cropType: string
): AIAgentResponse {
  const lowerCrop = cropType.toLowerCase();
  const match = diseaseDatabase[lowerCrop];

  if (match) {
    return {
      success: true,
      data: match,
      confidence_score: match.confidence,
      responsible_agent: 'Crop Disease Diagnostic Agent',
      frameworks_used: ['AIM Framework', 'MAP Framework', 'TRACK Framework'],
      timestamp: new Date().toISOString(),
    };
  }

  const generic = diseaseDatabase[Object.keys(diseaseDatabase)[0]];
  return {
    success: true,
    data: {
      ...generic,
      disease: `Potential ${cropType} Disease`,
      confidence: 0.65,
    },
    confidence_score: 0.65,
    responsible_agent: 'Crop Disease Diagnostic Agent',
    frameworks_used: ['AIM Framework', 'MAP Framework'],
    timestamp: new Date().toISOString(),
  };
}

export function getCropAdvisorAdvice(
  cropType: string,
  question: 'planting' | 'fertilizer' | 'pest'
): AIAgentResponse {
  const adviceMap: Record<string, Record<string, string>> = {
    Maize: {
      planting: 'Plant maize at the onset of rains when soil temperature reaches 18-22°C. Depth: 3-5cm. Spacing: 75cm x 25cm (1 seed) or 75cm x 50cm (2 seeds). Population target: 53,333 plants per hectare.',
      fertilizer: 'Apply DAP at 100kg/ha at planting. Top-dress with CAN at 150kg/ha 4-6 weeks after emergence. For organic farming, apply well-decomposed manure at 10 tons/ha 2 weeks before planting.',
      pest: 'Monitor for Fall Armyworm using pheromone traps (5 traps/ha). If infestation exceeds 20%, apply Bacillus thuringiensis or neem extract. For stalk borers, introduce parasitic wasps (Trichogramma spp.).',
    },
    Wheat: {
      planting: 'Sow wheat at the beginning of the cool season. Seed rate: 100-125kg/ha. Depth: 3-4cm. Row spacing: 20cm. Ensure well-drained loamy soil with pH 6.0-7.5.',
      fertilizer: 'Apply NPK (23:23:0) at 150kg/ha at planting. Top-dress with Urea at 100kg/ha at tillering stage. For rainfed conditions, split nitrogen application.',
      pest: 'Monitor for aphids and rust diseases. Apply fungicide at first sign of rust. Use threshold-based spraying for aphids (5-10 aphids per tiller).',
    },
    Rice: {
      planting: 'Transplant seedlings at 20-25 days old. Spacing: 20cm x 20cm. Apply 2-3 seedlings per hill. Ensure 3-5cm standing water during vegetative growth.',
      fertilizer: 'Apply basal NPK (16:16:16) at 200kg/ha. Top-dress with Urea at 100kg/ha at active tillering and 50kg/ha at panicle initiation. Use slow-release fertilizers for efficiency.',
      pest: 'Monitor for rice blast and brown spot. Drain fields before applying fungicides for blast control. Use light traps for stem borer monitoring.',
    },
    Sorghum: {
      planting: 'Plant sorghum at the onset of rains. Seed rate: 8-12kg/ha. Depth: 3-5cm. Row spacing: 75cm x 20cm. Thrives in warmer areas with 400-800mm rainfall.',
      fertilizer: 'Apply DAP at 80kg/ha at planting. Top-dress with CAN at 100kg/ha 4 weeks after emergence. Sorghum is drought-tolerant and requires less fertilizer than maize.',
      pest: 'Monitor for sorghum midge during flowering. Apply neem extract for aphid control. Use bird scaring techniques near grain maturity. Control Striga weed through crop rotation.',
    },
    Millet: {
      planting: 'Plant pearl millet at the onset of rains. Seed rate: 4-6kg/ha. Depth: 2-3cm. Row spacing: 60cm x 15cm. Excellent drought tolerance for semi-arid regions like Turkana and Kitui.',
      fertilizer: 'Apply DAP at 60kg/ha at planting. Top-dress with CAN at 80kg/ha 3-4 weeks after emergence. Millet performs well even in low-fertility soils.',
      pest: 'Monitor for head miners and grain midges. Use light traps for millet stem borer. Practice bird scaring during grain filling stage. Remove crop residues after harvest.',
    },
    Cassava: {
      planting: 'Plant cassava cuttings (20-30cm long) at an angle. Spacing: 100cm x 100cm. Plant at the onset of rains. Use disease-free planting material from certified sources.',
      fertilizer: 'Apply DAP at 50kg/ha at planting. Potassium is critical for root development. Apply muriate of potash at 80kg/ha. Well-decomposed manure at 5 tons/ha improves yield.',
      pest: 'Monitor for cassava green mite and whiteflies. Use neem-based insecticides for whitefly control. Remove and burn virus-infected plants immediately. Plant resistant varieties.',
    },
    Beans: {
      planting: 'Plant beans at the onset of rains. Seed rate: 60-80kg/ha. Depth: 3-5cm. Spacing: 50cm x 10cm. Inoculate seeds with Rhizobium bacteria for better nitrogen fixation.',
      fertilizer: 'Apply DAP at 100kg/ha at planting. Beans fix their own nitrogen so minimize nitrogen fertilizer. Apply MOP at 60kg/ha for pod filling. Use well-decomposed manure.',
      pest: 'Monitor for bean fly, aphids, and thrips. Apply neem extract for aphid control. Use crop rotation (2-3 years) to reduce soil-borne diseases. Remove volunteer plants.',
    },
    'Sweet potato': {
      planting: 'Plant sweet potato vine cuttings (30-40cm) at an angle. Spacing: 100cm x 30cm. Ridge planting improves drainage and root development. Plant at onset of rains.',
      fertilizer: 'Apply DAP at 80kg/ha at planting. Potassium is critical for tuber development. Apply muriate of potash at 100kg/ha. Avoid excessive nitrogen to prevent lush vine growth.',
      pest: 'Monitor for sweet potato weevil (cylas spp.) and vine borers. Use clean planting materials. Practice crop rotation. Ridge soil around developing tubers to reduce weevil damage.',
    },
    Potato: {
      planting: 'Plant certified seed potatoes at 15-20cm depth. Spacing: 75cm x 30cm. Plant in well-drained loamy soils at the beginning of rainy season. Use 2-3 ton/ha of seed potatoes.',
      fertilizer: 'Apply DAP at 150kg/ha at planting. Top-dress with CAN at 100kg/ha after emergence. Potassium is critical for tuber quality. Apply MOP at 120kg/ha.',
      pest: 'Monitor for potato tuber moth, aphids, and late blight. Apply preventive fungicides during humid conditions. Practice crop rotation (3-4 years). Use certified disease-free seed.',
    },
    Banana: {
      planting: 'Plant tissue culture seedlings or disease-free suckers. Spacing: 3m x 3m for dessert bananas, 3m x 2m for cooking bananas. Dig planting holes 60cm x 60cm x 60cm.',
      fertilizer: 'Apply well-decomposed manure at 20kg per plant. Apply NPK (17:17:17) at 200g per plant monthly. Potassium is critical for bunch development. Apply MOP at 150g per plant.',
      pest: 'Monitor for banana weevil and nematodes. Use clean planting materials. Remove and destroy pseudostems after harvest. Apply neem cake for nematode control. Practice mat management.',
    },
    Coffee: {
      planting: 'Plant coffee seedlings at the onset of long rains. Spacing: 2.5m x 2.5m (1,600 trees/ha). Dig holes 60cm x 60cm x 60cm. Provide temporary shade during establishment.',
      fertilizer: 'Apply NPK (17:17:17) at 200g per tree four times per year. Apply well-decomposed manure at 10kg per tree annually. Boron and zinc foliar sprays improve berry set.',
      pest: 'Monitor for Coffee Leaf Rust and Coffee Berry Borer. Use pheromone traps for berry borer. Prune to maintain open canopy. Maintain optimal shade levels (30-40%).',
    },
    Tea: {
      planting: 'Plant tea clones at onset of rains. Spacing: 1.2m x 0.75m (11,000 plants/ha). Plant in well-drained acidic soils (pH 4.5-5.5). Provide shade during establishment.',
      fertilizer: 'Apply NPK (25:5:5) at 200kg/ha annually in split doses. Apply well-decomposed manure at 5 tons/ha. Sulphur-based fertilizers help maintain soil acidity for tea.',
      pest: 'Monitor for tea mosquito bug and red spider mite. Maintain proper plucking intervals. Prune to maintain plucking table. Avoid excessive nitrogen which increases disease susceptibility.',
    },
    Sugarcane: {
      planting: 'Plant sugarcane setts (3-budded) in furrows. Spacing: 150cm x 60cm. Setts should be planted horizontally in moist soil. Plant at beginning of rains for good establishment.',
      fertilizer: 'Apply NPK (20:10:10) at 300kg/ha at planting. Top-dress with Urea at 150kg/ha at 6-8 weeks after planting. Sugarcane is a heavy feeder requiring high potassium.',
      pest: 'Monitor for sugarcane stalk borer and termites. Treat setts with fungicide before planting. Use light traps for stalk borer. Practice crop rotation. Remove crop residues after harvest.',
    },
    Cotton: {
      planting: 'Plant cotton at the onset of rains. Seed rate: 15-20kg/ha (delinted seed). Depth: 2-4cm. Row spacing: 90cm x 30cm. Requires well-drained soils with pH 5.5-7.0.',
      fertilizer: 'Apply DAP at 100kg/ha at planting. Top-dress with CAN at 80kg/ha at flowering. Potassium improves boll quality. Apply MOP at 50kg/ha. Use well-decomposed manure.',
      pest: 'Monitor for bollworms, aphids, and jassids using pheromone traps. Practice integrated pest management. Remove and destroy crop residues after harvest. Use neem-based sprays.',
    },
    Tomato: {
      planting: 'Transplant tomato seedlings at 4-5 weeks old. Spacing: 90cm x 60cm (determinate) or 90cm x 45cm (indeterminate). Stake indeterminate varieties. Plant in well-drained fertile soil.',
      fertilizer: 'Apply DAP at 150kg/ha at transplanting. Top-dress with CAN at 100kg/ha 3-4 weeks after transplanting. Foliar calcium sprays prevent blossom end rot.',
      pest: 'Monitor for aphids, whiteflies, and tomato leaf miner. Use yellow sticky traps for whiteflies. Practice crop rotation with non-solanaceous crops. Stake plants for better air circulation.',
    },
    Onion: {
      planting: 'Transplant onion seedlings at 6-8 weeks. Spacing: 30cm x 10cm. Plant on raised beds for better drainage. Requires well-drained loamy soils with pH 6.0-7.0.',
      fertilizer: 'Apply DAP at 100kg/ha at transplanting. Top-dress with CAN at 80kg/ha at 3-4 weeks and again at bulb initiation. Sulphur-based fertilizers improve bulb quality.',
      pest: 'Monitor for onion thrips using yellow sticky traps. Apply neem extract for thrips control. Practice crop rotation (3-4 years). Avoid overhead irrigation which promotes disease.',
    },
    Kale: {
      planting: 'Transplant kale seedlings at 4-6 weeks. Spacing: 60cm x 45cm. Plant on raised beds with good drainage. Thrives in well-drained fertile soils with pH 6.0-7.5.',
      fertilizer: 'Apply DAP at 100kg/ha at transplanting. Top-dress with CAN at 80kg/ha every 3-4 weeks. Kale is a leafy green that requires regular nitrogen application.',
      pest: 'Monitor for diamondback moth and aphids. Use neem-based insecticides for caterpillar control. Practice crop rotation with non-brassica crops. Remove and destroy infected leaves.',
    },
    Mango: {
      planting: 'Plant mango grafted seedlings at onset of rains. Spacing: 10m x 10m (100 trees/ha). Dig holes 90cm x 90cm x 90cm. Fill with topsoil mixed with well-decomposed manure.',
      fertilizer: 'Apply well-decomposed manure at 20kg per tree annually. Apply NPK (17:17:17) at 500g per tree for mature trees. Apply before flowering and after harvest.',
      pest: 'Monitor for mango fruit fly and seed weevil. Use pheromone traps for fruit fly. Harvest fruits at mature green stage. Practice orchard sanitation. Prune for open canopy.',
    },
    Avocado: {
      planting: 'Plant grafted avocado seedlings at onset of rains. Spacing: 8m x 8m (156 trees/ha). Dig holes 90cm x 90cm x 90cm. Ensure excellent drainage as avocados are sensitive to waterlogging.',
      fertilizer: 'Apply well-decomposed manure at 20kg per tree twice per year. Apply NPK (17:17:17) at 400g per tree for mature trees. Zinc foliar sprays improve fruit set.',
      pest: 'Monitor for avocado thrips and mites. Maintain good soil drainage to prevent root rot. Mulch to retain moisture and suppress weeds. Prune to maintain tree shape and air circulation.',
    },
    Groundnut: {
      planting: 'Plant groundnuts at the onset of rains. Seed rate: 80-100kg/ha (unshelled). Depth: 3-5cm. Spacing: 45cm x 15cm. Requires light well-drained sandy loam for proper pod development.',
      fertilizer: 'Apply DAP at 80kg/ha at planting. Groundnuts fix their own nitrogen. Apply gypsum at 200kg/ha at flowering for pod filling. Use well-decomposed manure at 5 tons/ha.',
      pest: 'Monitor for aphids, thrips, and leaf miners. Practice crop rotation to reduce soil-borne diseases. Harvest when pods are mature (60-70% pod shell darkening). Dry properly before storage.',
    },
    Sunflower: {
      planting: 'Plant sunflower at the onset of rains. Seed rate: 5-8kg/ha. Depth: 3-5cm. Spacing: 75cm x 30cm. Grows well in a wide range of soils from Machakos to Trans Nzoia.',
      fertilizer: 'Apply DAP at 60kg/ha at planting. Top-dress with CAN at 80kg/ha at knee height. Sunflower is moderately drought-tolerant and requires less fertilizer than maize.',
      pest: 'Monitor for sunflower moth and head rot. Practice crop rotation. Harvest when the back of the head turns yellow-brown. Control birds during seed maturation stage.',
    },
    Cowpea: {
      planting: 'Plant cowpea at the onset of rains. Seed rate: 20-30kg/ha. Depth: 2-4cm. Spacing: 60cm x 20cm. Excellent drought tolerance for dry regions like Kitui, Makueni, and Tharaka Nithi.',
      fertilizer: 'Apply DAP at 60kg/ha at planting. Cowpeas fix their own nitrogen. Apply MOP at 40kg/ha for pod development. Well-decomposed manure improves yield on poor soils.',
      pest: 'Monitor for aphids, thrips, and pod borers. Use neem-based insecticides for aphid control. Practice crop rotation. Harvest pods when they turn brown and dry. Store in airtight containers.',
    },
    Pineapple: {
      planting: 'Plant pineapple crowns or suckers at spacing of 60cm x 30cm x 90cm (double row). Prepare raised beds in well-drained soils. Mulch with plastic or organic material. Plant at onset of rains.',
      fertilizer: 'Apply NPK (17:17:17) at 200kg/ha at planting. Apply Urea at 100kg/ha 4-6 months after planting. Potassium is critical for fruit quality. Apply MOP at 150kg/ha at forcing.',
      pest: 'Monitor for mealybugs and scale insects. Use clean planting materials. Practice field sanitation. Force flowering with calcium carbide or ethylene for uniform harvesting.',
    },
    'Passion fruit': {
      planting: 'Plant passion fruit seedlings at spacing of 2.5m x 3m. Provide strong trellis support (T-trellis or overhead). Plant at onset of rains. Apply well-decomposed manure in planting holes.',
      fertilizer: 'Apply NPK (17:17:17) at 150g per vine monthly. Apply well-decomposed manure at 10kg per vine twice per year. Foliar spray with zinc and boron for better fruit set.',
      pest: 'Monitor for woodiness virus, fusarium wilt, and brown spot. Use resistant rootstocks. Prune regularly for air circulation. Remove and destroy virus-infected vines immediately.',
    },
    Orange: {
      planting: 'Plant grafted citrus seedlings at spacing of 5m x 5m (400 trees/ha). Dig holes 60cm x 60cm x 60cm. Fill with topsoil mixed with well-decomposed manure. Plant at onset of rains.',
      fertilizer: 'Apply NPK (17:17:17) at 300g per tree in first year, increasing to 1kg for mature trees. Apply well-decomposed manure at 20kg per tree annually. Zinc and iron foliar sprays prevent deficiency.',
      pest: 'Monitor for citrus psyllid, leaf miner, and fruit fly. Use systemic insecticides for psyllid control. Install yellow sticky traps for leaf miner. Practice integrated pest management.',
    },
    Coconut: {
      planting: 'Plant coconut seedlings at spacing of 8m x 8m (156 palms/ha). Dig large pits 90cm x 90cm x 90cm. Fill with topsoil and well-decomposed manure. Plant at onset of rains. Provide irrigation during dry spells.',
      fertilizer: 'Apply NPK (17:17:17) at 500g per palm increasing to 2kg for mature palms. Apply well-decomposed manure at 15kg per palm annually. Boron foliar spray prevents leaf malformation.',
      pest: 'Monitor for coconut mite, rhinoceros beetle, and lethal yellowing disease. Use pheromone traps for rhinoceros beetle. Practice field sanitation. Remove and destroy infected palms.',
    },
    Cashew: {
      planting: 'Plant cashew seedlings at spacing of 8m x 8m (156 trees/ha). Dig holes 60cm x 60cm x 60cm. Cashew thrives in coastal areas like Kilifi, Kwale, and Lamu. Plant at onset of rains.',
      fertilizer: 'Apply NPK (17:17:17) at 200g per tree in first year, increasing to 1kg for mature trees. Apply well-decomposed manure at 15kg per tree annually. Zinc spray improves nut yield.',
      pest: 'Monitor for cashew powdery mildew and mosquito bug. Apply sulphur fungicides during flowering. Prune for open canopy. Practice orchard sanitation. Harvest fallen nuts regularly.',
    },
    Macadamia: {
      planting: 'Plant grafted macadamia seedlings at spacing of 8m x 8m (156 trees/ha). Dig holes 60cm x 60cm x 60cm. Plant at onset of rains. Provide windbreaks in exposed areas.',
      fertilizer: 'Apply NPK (17:17:17) at 300g per tree in first year, increasing to 1.5kg for mature trees. Apply well-decomposed manure at 20kg per tree annually. Apply zinc and boron foliar sprays.',
      pest: 'Monitor for macadamia nut borer and husk spot. Use pheromone traps for nut borer. Practice orchard sanitation. Harvest ripe nuts from ground. Dry nuts properly before storage.',
    },
    Sesame: {
      planting: 'Plant sesame at onset of rains. Seed rate: 4-6kg/ha. Depth: 1-2cm. Row spacing: 60cm x 10cm. Thrives in well-drained sandy loam soils. Common in Nyanza, Eastern, and Coastal regions.',
      fertilizer: 'Apply DAP at 60kg/ha at planting. Top-dress with CAN at 50kg/ha at flowering. Sesame requires moderate fertilization. Avoid excessive nitrogen which causes lodging.',
      pest: 'Monitor for aphids, leaf feeders, and capsule borers. Practice crop rotation. Harvest when lower capsules turn yellow-brown. Dry plants before threshing.',
    },
    'Green grams': {
      planting: 'Plant green grams at onset of rains. Seed rate: 15-20kg/ha. Depth: 3-5cm. Spacing: 45cm x 10cm. Excellent drought tolerance for dry regions. Matures in 65-75 days.',
      fertilizer: 'Apply DAP at 60kg/ha at planting. Green grams fix their own nitrogen. Apply MOP at 30kg/ha for pod development. Well-decomposed manure improves yield on poor soils.',
      pest: 'Monitor for aphids, pod borers, and powdery mildew. Use neem-based insecticides. Harvest pods progressively as they mature. Dry and store in airtight containers.',
    },
    'Pigeon peas': {
      planting: 'Plant pigeon peas at onset of rains. Seed rate: 10-15kg/ha. Depth: 3-5cm. Spacing: 150cm x 50cm. Deep-rooted drought-tolerant crop for semi-arid regions. Can be intercropped with maize or sorghum.',
      fertilizer: 'Apply DAP at 80kg/ha at planting. Pigeon peas fix their own nitrogen. Apply MOP at 40kg/ha for pod development. Responds well to well-decomposed manure.',
      pest: 'Monitor for pod borers, flower thrips, and fusarium wilt. Use neem-based sprays. Practice crop rotation. Harvest pods progressively as they mature. Store in clean dry containers.',
    },
    Cabbage: {
      planting: 'Transplant cabbage seedlings at 4-6 weeks. Spacing: 60cm x 45cm. Prepare well-drained raised beds. Apply well-decomposed manure at 10 tons/ha before transplanting. Plant at onset of rains.',
      fertilizer: 'Apply DAP at 150kg/ha at transplanting. Top-dress with CAN at 100kg/ha at 3 weeks and again at head initiation. Cabbage is a heavy feeder requiring regular fertilization.',
      pest: 'Monitor for diamondback moth, aphids, and black rot. Use neem-based insecticides for caterpillar control. Practice crop rotation with non-brassica crops. Remove crop residues after harvest.',
    },
    Spinach: {
      planting: 'Sow spinach seeds directly or transplant seedlings. Seed rate: 10-15kg/ha. Spacing: 30cm x 15cm. Prepare well-drained raised beds with fertile soil. Plant at onset of rains.',
      fertilizer: 'Apply DAP at 80kg/ha at planting. Top-dress with CAN at 60kg/ha every 3 weeks. Spinach requires regular nitrogen for leafy growth. Apply well-decomposed manure.',
      pest: 'Monitor for leaf miners, aphids, and downy mildew. Use neem-based insecticides. Practice crop rotation. Harvest outer leaves regularly to encourage new growth.',
    },
    Carrot: {
      planting: 'Sow carrot seeds directly in well-prepared raised beds. Seed rate: 4-6kg/ha. Depth: 0.5-1cm. Spacing: 30cm x 5cm. Requires deep well-drained sandy loam soils free of stones.',
      fertilizer: 'Apply DAP at 80kg/ha at planting. Potassium is critical for root development. Apply MOP at 100kg/ha. Avoid excessive nitrogen which causes forked roots.',
      pest: 'Monitor for leaf blight, root knot nematodes, and carrot fly. Practice crop rotation (3-4 years). Use well-decomposed manure. Ensure soil is free of nematodes before planting.',
    },
    Watermelon: {
      planting: 'Plant watermelon seeds directly at spacing of 2m x 1m. Seed rate: 2-3kg/ha. Prepare raised beds with plastic mulch for weed control. Requires well-drained sandy loam soils.',
      fertilizer: 'Apply DAP at 100kg/ha at planting. Top-dress with CAN at 80kg/ha at vining stage. Potassium improves fruit quality. Apply MOP at 100kg/ha at fruit set.',
      pest: 'Monitor for aphids, whiteflies, and fruit flies. Use yellow sticky traps. Practice crop rotation. Remove and destroy infected fruits. Harvest at full maturity with dried tendril.',
    },
    Pawpaw: {
      planting: 'Plant pawpaw seedlings (2-3 per hole, remove males later) at spacing of 2.5m x 2.5m. Dig holes 60cm x 60cm x 60cm. Fill with topsoil and well-decomposed manure. Plant at onset of rains.',
      fertilizer: 'Apply NPK (17:17:17) at 150g per tree every 2 months. Apply well-decomposed manure at 10kg per tree twice per year. Boron spray prevents fruit malformation.',
      pest: 'Monitor for papaya ringspot virus, mealybugs, and fruit flies. Remove and destroy virus-infected trees. Control aphid vectors. Practice field sanitation.',
    },
  };

  const advice = adviceMap[cropType]?.[question];
  if (advice) {
    return {
      success: true,
      data: { advice, cropType, question },
      confidence_score: 0.92,
      responsible_agent: 'Crop Advisor Agent',
      frameworks_used: ['AIM Framework', 'RANK Framework', 'TRAIL Framework'],
      timestamp: new Date().toISOString(),
    };
  }

  return {
    success: true,
    data: {
      advice: `For ${cropType}, we recommend consulting local agricultural extension services for specific guidance tailored to your region.`,
      cropType,
      question,
    },
    confidence_score: 0.7,
    responsible_agent: 'Crop Advisor Agent',
    frameworks_used: ['AIM Framework'],
    timestamp: new Date().toISOString(),
  };
}

export function getWeatherAdvisory(
  condition: string,
  forecast: { temp_high: number; temp_low: number; condition: string; rainfall_chance: number }[]
): AIAgentResponse {
  const hasHeavyRain = forecast.some((d) => d.rainfall_chance > 70);
  const hasHighHeat = forecast.some((d) => d.temp_high > 35);
  const hasDrought = forecast.every((d) => d.rainfall_chance < 20);

  let advisory = 'Normal weather conditions expected. Continue regular farm operations.';
  if (hasHeavyRain) advisory = 'Heavy rainfall expected. Ensure drainage systems are clear. Delay planting or harvesting activities.';
  if (hasHighHeat) advisory = 'High temperatures forecast. Increase irrigation frequency. Provide shade for sensitive seedlings.';
  if (hasDrought) advisory = 'Dry conditions predicted. Conserve water. Prioritize irrigation for high-value crops.';

  return {
    success: true,
    data: { advisory, forecast_summary: forecast.length > 0 ? `${forecast.length}-day forecast analyzed` : 'Current conditions only' },
    confidence_score: 0.88,
    responsible_agent: 'Weather Intelligence Agent',
    frameworks_used: ['TRAIL Framework', 'TRACK Framework'],
    timestamp: new Date().toISOString(),
  };
}

const ALL_CROP_KEYS = ['maize', 'wheat', 'rice', 'cassava', 'beans', 'sorghum', 'millet', 'sweet potato', 'potato', 'banana', 'coffee', 'tea', 'sugarcane', 'cotton', 'tomato', 'onion', 'kale', 'mango', 'avocado', 'groundnut', 'sunflower', 'cowpea', 'pineapple', 'passion fruit', 'orange', 'lemon', 'coconut', 'cashew', 'macadamia', 'sesame', 'green grams', 'pigeon peas', 'cabbage', 'spinach', 'carrot', 'arrow roots', 'yam', 'pyrethrum', 'sisal', 'barley', 'french beans', 'capsicum', 'watermelon', 'pawpaw', 'tissue banana'];

function capitalize(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function detectCropType(lower: string): string | null {
  for (const crop of ALL_CROP_KEYS) {
    if (lower.includes(crop)) return crop;
  }
  return null;
}

export function getChatResponse(query: string): AIAgentResponse {
  const lower = query.toLowerCase();
  let agentName = 'General AI Assistant';
  let frameworks = ['AIM Framework'];
  let response = '';

  const detectedCrop = detectCropType(lower);

  if (detectedCrop) {
    const isDisease = lower.includes('disease') || lower.includes('symptom') || lower.includes('diagnos') || lower.includes('blight') || lower.includes('rust') || lower.includes('mold') || lower.includes('infection') || lower.includes('treatment') || lower.includes('cure') || lower.includes('fungus') || lower.includes('bacteria') || lower.includes('virus') || lower.includes('rot') || lower.includes('wilt') || lower.includes('spot') || lower.includes('lesion');
    const isFertilizer = lower.includes('fertilizer') || lower.includes('manure') || lower.includes('nutrient') || lower.includes('npk') || lower.includes('dap') || lower.includes('can') || lower.includes('compost') || lower.includes('feeding');
    const isPest = lower.includes('pest') || lower.includes('insect') || lower.includes('bug') || lower.includes('weed') || lower.includes('worm') || lower.includes('caterpillar') || lower.includes('aphid') || lower.includes('mite') || lower.includes('borer') || lower.includes('weevil') || lower.includes('thrips') || lower.includes('whitefly') || lower.includes('ipm');

    if (isDisease) {
      const diag = diagnoseDisease(detectedCrop);
      if (diag.success) {
        const d = diag.data as { disease: string; treatment: string; prevention: string; risk: string };
        response = `Diagnosis for ${capitalize(detectedCrop)}: ${d.disease}\nRisk Level: ${d.risk}\n\nTreatment: ${d.treatment}\n\nPrevention: ${d.prevention}`;
        agentName = 'Crop Disease Diagnostic Agent';
        frameworks = ['AIM Framework', 'MAP Framework', 'TRACK Framework'];
      }
    } else {
      const question = isFertilizer ? 'fertilizer' : isPest ? 'pest' : 'planting';
      const capitalizedCrop = detectedCrop.split(' ').map(capitalize).join(' ');
      const advice = getCropAdvisorAdvice(capitalizedCrop, question);
      if (advice.success) {
        response = (advice.data as { advice: string }).advice;
        agentName = advice.responsible_agent ?? 'Crop Advisor Agent';
        frameworks = advice.frameworks_used ?? ['AIM Framework', 'RANK Framework', 'TRAIL Framework'];
      }
    }
  } else if (lower.includes('weather') || lower.includes('rain') || lower.includes('temperature') || lower.includes('humid') || lower.includes('forecast') || lower.includes('drought') || lower.includes('sunny') || lower.includes('cloud')) {
    const advisory = getWeatherAdvisory('current', []);
    if (advisory.success) {
      response = (advisory.data as { advisory: string }).advisory;
      agentName = advisory.responsible_agent ?? 'Weather Intelligence Agent';
      frameworks = advisory.frameworks_used ?? ['TRAIL Framework', 'TRACK Framework'];
    }
  } else if (lower.includes('sustainab') || lower.includes('soil') || lower.includes('carbon') || lower.includes('environment') || lower.includes('organic') || lower.includes('score') || lower.includes('footprint')) {
    response = 'To improve your sustainability score on your Kenyan farm:\n1) Practice crop rotation to maintain soil health and break pest cycles.\n2) Use drip irrigation or alternate wetting-drying to reduce water consumption by up to 60%.\n3) Plant cover crops like cowpeas or lablab to prevent erosion and fix nitrogen.\n4) Compost crop residues to enrich soil organic matter.\n5) Plant agroforestry trees (grevillea, calliandra) for shade, fodder, and firewood.\n6) Maintain buffer zones near water bodies.\n7) Use integrated soil fertility management combining organic manure with inorganic fertilizers.\n8) Practice zero-tillage or minimum tillage to reduce soil disturbance.';
    agentName = 'Sustainability Agent';
    frameworks = ['AIM Framework', 'OASIS Framework', 'TRACK Framework'];
  } else {
    response = `I'm your AgriPride AI assistant for Kenyan agriculture. I can help you with over 40 crops grown in Kenya including:

🌽 Cereals: Maize, Wheat, Rice, Sorghum, Millet, Barley
🥔 Tubers: Cassava, Sweet Potato, Potato, Arrow Roots, Yams
🫘 Legumes: Beans, Cowpeas, Green Grams, Pigeon Peas, Groundnuts
🍌 Fruits: Banana, Mango, Avocado, Pineapple, Passion Fruit, Citrus, Watermelon, Pawpaw
☕ Cash Crops: Coffee, Tea, Sugarcane, Cotton, Pyrethrum, Sisal
🥬 Vegetables: Tomato, Onion, Kale, Cabbage, Spinach, French Beans, Capsicum
🌴 Other: Coconut, Cashew, Macadamia, Sunflower, Sesame

Ask me about planting techniques, fertilizer rates, pest and disease management, or weather information for any crop!`;
  }

  return {
    success: true,
    data: { response },
    confidence_score: 0.92,
    responsible_agent: agentName,
    frameworks_used: frameworks,
    timestamp: new Date().toISOString(),
  };
}
