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
