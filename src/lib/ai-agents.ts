import { AIAgentResponse } from '@/types';
import { diagnose, getCropExists } from '@/lib/diagnosis-engine';
import type { GrowthStage } from '@/types';

export function diagnoseDisease(
  cropType: string,
  symptoms?: string,
  growthStage?: GrowthStage,
): AIAgentResponse {
  const effectiveSymptoms = symptoms && symptoms.length > 0 ? symptoms : 'general symptoms described';
  const result = diagnose({
    cropType,
    symptoms: effectiveSymptoms,
    growthStage,
  });

  if (result.primaryDiagnosis || result.possibleCauses.length > 0) {
    return {
      success: true,
      data: result,
      confidence_score: result.primaryDiagnosis?.confidence,
      possible_causes: result.possibleCauses,
      reasoning: result.reasoning,
      uncertainty_level: result.uncertaintyLevel,
      responsible_agent: 'Crop Disease Diagnostic Agent',
      frameworks_used: ['AIM Framework', 'MAP Framework', 'TRACK Framework'],
      timestamp: new Date().toISOString(),
    };
  }

  return {
    success: true,
    data: result,
    confidence_score: 0.15,
    possible_causes: [],
    reasoning: {
      summary: 'Unable to identify specific crop conditions from the provided information.',
      symptomInfluences: [],
      uncertainties: ['Insufficient symptom data for diagnosis'],
    },
    uncertainty_level: 'high',
    responsible_agent: 'Crop Disease Diagnostic Agent',
    frameworks_used: ['AIM Framework'],
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

  const isPoultry = lower.includes('chicken') || lower.includes('hen') || lower.includes('rooster') || lower.includes('broiler') || lower.includes('layer') || lower.includes('poultry') || lower.includes('egg') || lower.includes('hatch') || lower.includes('incubat') || lower.includes('vaccin') || lower.includes('fowl') || lower.includes('turkey') || lower.includes('duck') || lower.includes('kienyeji');
  const isAquaculture = lower.includes('fish') || lower.includes('pond') || lower.includes('tilapia') || lower.includes('catfish') || lower.includes('aquaculture') || lower.includes('fingerling') || lower.includes('aquaponics') || lower.includes('ocha') || lower.includes('samaki');
  const isBeekeeping = lower.includes('bee') || lower.includes('honey') || lower.includes('apiary') || lower.includes('hive') || lower.includes('beekeep') || lower.includes('pollinat') || lower.includes('wax') || lower.includes('propolis') || lower.includes('asali') || lower.includes('nyuki');
  const isIrrigation = lower.includes('irrigat') || lower.includes('drip') || lower.includes('sprinkler') || lower.includes('water') || lower.includes('drought') || lower.includes('watering') || lower.includes('moisture');
  const isPostHarvest = lower.includes('storage') || lower.includes('post-harvest') || lower.includes('post harvest') || lower.includes('silo') || lower.includes('drying') || lower.includes('grading') || lower.includes('packaging') || lower.includes('value addition') || lower.includes('processing') || lower.includes('preserv') || lower.includes('shelf life');
  const isFarmEconomics = lower.includes('profit') || lower.includes('cost') || lower.includes('budget') || lower.includes('income') || lower.includes('revenue') || lower.includes('expense') || lower.includes('loan') || lower.includes('credit') || lower.includes('market') || lower.includes('price') || lower.includes('sell') || lower.includes('record') || lower.includes('bookkeep') || lower.includes('enterprise budget');
  const isSoil = lower.includes('soil') || lower.includes('compost') || lower.includes('manure') || lower.includes('fertility') || lower.includes('ph') || lower.includes('organic matter') || lower.includes('nitrogen') || lower.includes('phosphorus') || lower.includes('potassium') || lower.includes('npk') || lower.includes('dap') || lower.includes('can') || lower.includes('liming') || lower.includes('deficiency');
  const isGreenhouse = lower.includes('greenhouse') || lower.includes('polytunnel') || lower.includes('shade net') || lower.includes('protected') || lower.includes('mulch') || lower.includes('row cover');

  if (detectedCrop) {
    const isDisease = lower.includes('disease') || lower.includes('symptom') || lower.includes('diagnos') || lower.includes('blight') || lower.includes('rust') || lower.includes('mold') || lower.includes('infection') || lower.includes('treatment') || lower.includes('cure') || lower.includes('fungus') || lower.includes('bacteria') || lower.includes('virus') || lower.includes('rot') || lower.includes('wilt') || lower.includes('spot') || lower.includes('lesion');
    const isFertilizer = lower.includes('fertilizer') || lower.includes('manure') || lower.includes('nutrient') || lower.includes('npk') || lower.includes('dap') || lower.includes('can') || lower.includes('compost') || lower.includes('feeding');
    const isPest = lower.includes('pest') || lower.includes('insect') || lower.includes('bug') || lower.includes('weed') || lower.includes('worm') || lower.includes('caterpillar') || lower.includes('aphid') || lower.includes('mite') || lower.includes('borer') || lower.includes('weevil') || lower.includes('thrips') || lower.includes('whitefly') || lower.includes('ipm');

    if (isDisease) {
      const diag = diagnoseDisease(detectedCrop, query);
      if (diag.success) {
        const d = diag.data as {
          primaryDiagnosis?: { name: string; type: string; confidence: number };
          possibleCauses: Array<{ name: string; type: string; likelihood: string; confidence: number; treatment?: string; prevention?: string }>;
          reasoning: { summary: string };
          uncertaintyLevel: string;
        };
        if (d.primaryDiagnosis) {
          response = `Diagnosis for ${capitalize(detectedCrop)}: ${d.primaryDiagnosis.name}\n`;
          response += `Type: ${d.primaryDiagnosis.type} | Confidence: ${Math.round(d.primaryDiagnosis.confidence * 100)}% | Uncertainty: ${d.uncertaintyLevel}\n\n`;
          response += `Reasoning: ${d.reasoning.summary}\n\n`;

          if (d.possibleCauses.length > 1) {
            response += `Other possible causes:\n`;
            d.possibleCauses.slice(0, 3).forEach((c, i) => {
              response += `${i + 1}. ${c.name} (${c.likelihood} likelihood, ${Math.round(c.confidence * 100)}% confidence)\n`;
            });
            response += '\n';
          }

          const primaryDetail = d.possibleCauses.find(c => c.name === d.primaryDiagnosis?.name);
          if (primaryDetail?.treatment) {
            response += `Treatment: ${primaryDetail.treatment}\n\n`;
            response += `Prevention: ${primaryDetail.prevention}`;
          }
        } else {
          response = `Analysis for ${capitalize(detectedCrop)}:\n`;
          response += `Uncertainty Level: ${d.uncertaintyLevel}\n`;
          response += `Reasoning: ${d.reasoning.summary}\n\n`;
          if (d.possibleCauses.length > 0) {
            response += `Possible causes (${d.uncertaintyLevel} confidence):\n`;
            d.possibleCauses.slice(0, 3).forEach((c, i) => {
              response += `${i + 1}. ${c.name} (${c.likelihood} likelihood)\n`;
            });
          }
        }
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
  } else if (isPoultry) {
    if (lower.includes('layer') || lower.includes('egg')) {
      response = `I can help with layer (egg) poultry farming. Here are key areas:

WHAT: Layer farming focuses on raising chickens for egg production.

KEY PRACTICES:
1. Breed selection: Hy-Line Brown, ISA Brown, Lohmann Brown, or Kenbro for dual-purpose
2. Housing: Deep litter system (4-5 birds/m²) or battery cages with proper ventilation
3. Feeding: Layer starter (0-8 weeks), growers mash (8-18 weeks), layers mash (18+ weeks) with calcium supplementation
4. Lighting: 16 hours of light per day for optimal egg production
5. Vaccination: Marek's (day 1), Newcastle (weeks 1, 4), Gumboro (weeks 2, 5), Fowl Pox (week 6)
6. Egg collection: 3-4 times daily, store at 15-20°C, 75-80% humidity

For specific advice, please provide: your location, breed, flock size, housing system, and current challenges.`;
      agentName = 'Poultry Specialist Agent';
    } else {
      response = `I can help with poultry farming. Here are key areas for broiler production:

WHAT: Broiler farming raises chickens for meat, harvestable at 5-8 weeks.

KEY PRACTICES:
1. Housing: 10-12 birds/m², proper ventilation, brooder heating
2. Feeding: Broiler starter then finisher for optimal growth
3. Health: Strict biosecurity, vaccination (Newcastle, Gumboro, Fowl Pox)
4. Harvest: Process at 5-8 weeks (target 1.5-2.5 kg live weight)

For specific advice, please provide: your location, breed, flock size, and current challenges.`;
      agentName = 'Poultry Specialist Agent';
    }
    frameworks = ['AIM Framework', 'TRACK Framework', 'TRAIL Framework'];
  } else if (isAquaculture) {
    response = `I can help with fish farming (aquaculture). Here are key areas:

WHAT: Fish farming involves raising fish in controlled environments for food production.

KEY PRACTICES:
1. Species: Tilapia (hardy, fast-growing), Catfish (high demand, fast-growing), or both in polyculture
2. Pond construction: 0.1-1 acre ponds, 1-1.5m deep, clay soil preferred, proper inlet/outlet systems
3. Stocking: Tilapia at 2-3 fingerlings/m², Catfish at 5-10 fingerlings/m²
4. Feeding: Floating pellets (25-35% protein), feed 2-4 times daily at 3-5% body weight
5. Water quality: Dissolved oxygen > 5mg/L, pH 6.5-8.5, ammonia < 0.05mg/L
6. Harvesting: Partial harvesting after 4-6 months, complete harvest after 6-8 months

BENEFITS: High protein food source, good income, can integrate with crop farming (rice-fish, aquaponics).

For specific advice, please provide: your location, pond size, fish species, and main challenge.`;
    agentName = 'Aquaculture Specialist Agent';
    frameworks = ['AIM Framework', 'TRAIL Framework'];
  } else if (isBeekeeping) {
    response = `I can help with beekeeping (apiculture). Here are key areas:

WHAT: Beekeeping involves maintaining bee colonies for honey, wax, propolis, and pollination services.

KEY PRACTICES:
1. Hive types: Langstroth (modern, movable frames), Kenya Top Bar (affordable, ideal for smallholders), traditional log hives
2. Apiary setup: Place hives under shade, near flowering plants, away from human/animal traffic, facing east or southeast
3. Equipment: Bee suit, smoker, hive tool, brush, feeder, queen excluder
4. Seasonal management: Inspect every 2-3 weeks, control swarm, pest management (Varroa mites, wax moths, ants)
5. Honey harvesting: Harvest when 80% of frames are capped, use proper extraction equipment
6. Value addition: Pure honey, beeswax products, propolis tincture, royal jelly

BENEFITS: Pollination improves crop yields by 30-50%, honey has high market value, low startup costs.

For specific advice, please provide: your location, hive type, number of hives, and main challenge.`;
    agentName = 'Beekeeping Specialist Agent';
    frameworks = ['AIM Framework', 'TRAIL Framework'];
  } else if (isIrrigation) {
    response = `I can help with irrigation and water management. Here are key areas:

WHAT: Irrigation is the artificial application of water to crops to supplement rainfall.

KEY TYPES:
1. Drip irrigation: Water delivered directly to root zone — 60-80% water efficiency, best for vegetables and high-value crops
2. Sprinkler irrigation: Overhead water application — good for field crops, 70-75% efficiency
3. Surface irrigation: Furrow, basin, or flood — 40-60% efficiency, low cost but water-intensive
4. Centre pivot: Automated large-scale irrigation — ideal for commercial farms

BEST PRACTICES:
1. Schedule irrigation based on crop water requirements and soil moisture
2. Irrigate in early morning or evening to reduce evaporation
3. Use mulching to reduce water loss from soil surface
4. Consider rainwater harvesting (roof catchment, ponds, tanks)
5. Test soil moisture before irrigating (feel method, tensiometer, or moisture sensors)

COMMON MISTAKES: Over-irrigation causing waterlogging and disease, irrigating during peak sun hours, poor system maintenance.

For specific advice, please provide: your location, crops grown, farm size, water source, and current irrigation system.`;
    agentName = 'Irrigation Specialist Agent';
    frameworks = ['AIM Framework', 'TRAIL Framework', 'TRACK Framework'];
  } else if (isPostHarvest) {
    response = `I can help with post-harvest handling and storage. Here are key areas:

WHAT: Post-harvest handling covers all activities from harvest to consumption.

KEY PRACTICES:
1. Harvest timing: Harvest at optimal maturity — too early reduces quality, too late increases losses
2. Cleaning and grading: Remove debris, sort by size and quality to get better prices
3. Drying: Reduce moisture to safe levels — maize 13.5%, beans 15%, rice 14%
4. Storage: Hermetic bags (PICS bags), metal silos, proper ventilation, pest monitoring
5. Value addition: Processing, packaging, branding to increase income

COMMON LOSSES: 30-40% of produce lost post-harvest in many regions due to poor handling, pests, and lack of storage.

BENEFITS OF GOOD PRACTICE: Longer shelf life, higher market prices, reduced waste, food security.

For specific advice, please provide: your crop type, quantity, storage facilities, and main post-harvest challenge.`;
    agentName = 'Post-Harvest Specialist Agent';
    frameworks = ['AIM Framework', 'TRAIL Framework'];
  } else if (isFarmEconomics) {
    response = `I can help with farm economics and management. Here are key areas:

WHAT: Farm economics involves analyzing the financial aspects of farming to maximize profitability.

KEY PRACTICES:
1. Record keeping: Track all income, expenses, production, and inventory — use simple ledgers or digital tools
2. Enterprise budgeting: Calculate costs and returns for each farm activity separately
3. Break-even analysis: Determine the price or production level needed to cover costs
4. Profit margins: Revenue minus all costs — aim for at least 30% gross margin
5. Market analysis: Research market prices, timing, and channels before planting
6. Risk management: Diversify crops, consider insurance, maintain emergency savings

COMMON MISTAKES: Poor record keeping, not separating personal and farm finances, ignoring depreciation, selling at farm gate without marketing.

For specific advice, please provide: your farm size, enterprises, main expenses, and location.`;
    agentName = 'Farm Economics Specialist Agent';
    frameworks = ['AIM Framework', 'TRACK Framework', 'RANK Framework'];
  } else if (isGreenhouse) {
    response = `I can help with greenhouse farming. Here are key areas:

WHAT: Greenhouse farming involves growing crops in a controlled environment for year-round production.

KEY CROPS: Tomatoes, capsicum (bell peppers), cucumbers, lettuce, strawberries, herbs, flowers.

KEY PRACTICES:
1. Greenhouse types: Tunnel (low-cost), Venlo (commercial), shade net (for low-light crops)
2. Climate control: Temperature (25-30°C day, 15-20°C night), humidity (60-80%), ventilation
3. Irrigation: Drip irrigation with fertigation — apply water and nutrients together
4. Growing media: Coco peat, rockwool, or sterilized soil in bags
5. Pest management: Sticky traps, biological control (predatory mites, parasitoids), screen netting
6. Crop management: Pruning, staking, pollination (bumblebees or manual), de-leafing

BENEFITS: Higher yields (3-5x open field), better quality, year-round production, efficient water use.

For specific advice, please provide: your location, greenhouse size, crops planned, and budget.`;
    agentName = 'Greenhouse Specialist Agent';
    frameworks = ['AIM Framework', 'TRAIL Framework', 'TRACK Framework'];
  } else if (lower.includes('weather') || lower.includes('rain') || lower.includes('temperature') || lower.includes('humid') || lower.includes('forecast') || lower.includes('drought') || lower.includes('sunny') || lower.includes('cloud')) {
    const advisory = getWeatherAdvisory('current', []);
    if (advisory.success) {
      response = (advisory.data as { advisory: string }).advisory;
      agentName = advisory.responsible_agent ?? 'Weather Intelligence Agent';
      frameworks = advisory.frameworks_used ?? ['TRAIL Framework', 'TRACK Framework'];
    }
  } else if (isSoil || lower.includes('sustainab') || lower.includes('carbon') || lower.includes('environment') || lower.includes('organic') || lower.includes('score') || lower.includes('footprint')) {
    response = 'To improve your sustainability score and soil health on your farm:\n\n1) Practice crop rotation to maintain soil health and break pest cycles.\n2) Use drip irrigation or alternate wetting-drying to reduce water consumption by up to 60%.\n3) Plant cover crops like cowpeas or lablab to prevent erosion and fix nitrogen.\n4) Compost crop residues to enrich soil organic matter.\n5) Plant agroforestry trees (grevillea, calliandra) for shade, fodder, and firewood.\n6) Maintain buffer zones near water bodies.\n7) Use integrated soil fertility management combining organic manure with inorganic fertilizers.\n8) Practice zero-tillage or minimum tillage to reduce soil disturbance.\n9) Conduct regular soil testing to determine pH, organic matter, and nutrient levels.\n10) Apply lime if soil pH is below 5.5 for most crops (target pH 6.0-7.0).';
    agentName = 'Sustainability and Soil Specialist Agent';
    frameworks = ['AIM Framework', 'OASIS Framework', 'TRACK Framework'];
  } else {
    response = `I'm your AgriPride AI agricultural assistant. I can help with a wide range of agricultural topics including:

CROP PRODUCTION: Planting, fertilizers, pest and disease management, harvesting for over 40 crops
AQUACULTURE: Fish farming, pond management
BEEKEEPING: Hive management, honey harvesting
SOIL MANAGEMENT: Fertility, composting, testing
IRRIGATION: Drip, sprinkler, systems design
GREENHOUSE: Protected cultivation
POST-HARVEST: Storage, processing, value addition
FARM ECONOMICS: Budgeting, record keeping, marketing
SUSTAINABILITY: Organic farming, conservation, climate-smart practices

To give you the best advice, please tell me:
1. What specific agricultural topic or problem do you need help with?
2. What is your location or growing region?
3. What is your farm size and scale?

Ask me anything about farming and agriculture!`;
  }

  return {
    success: true,
    data: { response },
    confidence_score: 0.92,
    possible_causes: undefined,
    responsible_agent: agentName,
    frameworks_used: frameworks,
    timestamp: new Date().toISOString(),
  };
}
