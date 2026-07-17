import { AIAgentResponse } from '@/types';
import { diagnose, getCropExists } from '@/lib/diagnosis-engine';
import { serverT, serverTArray } from '@/lib/i18n/server';
import type { GrowthStage } from '@/types';

export function diagnoseDisease(
  cropType: string,
  symptoms?: string,
  growthStage?: GrowthStage,
  locale: string = 'en',
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
      responsible_agent: serverT(locale, 'aiChat.agentNames.cropDisease'),
      frameworks_used: [
        serverT(locale, 'assistant.frameworks.aim'),
        serverT(locale, 'assistant.frameworks.map'),
        serverT(locale, 'assistant.frameworks.track'),
      ],
      timestamp: new Date().toISOString(),
    };
  }

  return {
    success: true,
    data: result,
    confidence_score: 0.15,
    possible_causes: [],
    reasoning: {
      summary: serverT(locale, 'diagnosisEngine.insufficientSymptoms'),
      symptomInfluences: [],
      uncertainties: [serverT(locale, 'diagnosisEngine.insufficientSymptoms')],
    },
    uncertainty_level: 'high',
    responsible_agent: serverT(locale, 'aiChat.agentNames.cropDisease'),
    frameworks_used: [serverT(locale, 'assistant.frameworks.aim')],
    timestamp: new Date().toISOString(),
  };
}

export function getCropAdvisorAdvice(
  cropType: string,
  question: 'planting' | 'fertilizer' | 'pest',
  locale: string = 'en',
): AIAgentResponse {
  const cropKeyMap: Record<string, string> = {
    Maize: 'maize',
    Wheat: 'wheat',
    Rice: 'rice',
    Sorghum: 'sorghum',
    Millet: 'millet',
    Cassava: 'cassava',
    Beans: 'beans',
    'Sweet potato': 'sweetPotato',
    Potato: 'potato',
    Banana: 'banana',
    Coffee: 'coffee',
    Tea: 'tea',
    Sugarcane: 'sugarcane',
    Cotton: 'cotton',
    Tomato: 'tomato',
    Onion: 'onion',
    Kale: 'kale',
    Mango: 'mango',
    Avocado: 'avocado',
    Groundnut: 'groundnut',
    Sunflower: 'sunflower',
    Cowpea: 'cowpea',
    Pineapple: 'pineapple',
    'Passion fruit': 'passionFruit',
    Orange: 'orange',
    Coconut: 'coconut',
    Cashew: 'cashew',
    Macadamia: 'macadamia',
    Sesame: 'sesame',
    'Green grams': 'greenGrams',
    'Pigeon peas': 'pigeonPeas',
    Cabbage: 'cabbage',
    Spinach: 'spinach',
    Carrot: 'carrot',
    Watermelon: 'watermelon',
    Pawpaw: 'pawpaw',
  };

  const cropKey = cropKeyMap[cropType];
  const advice = cropKey
    ? serverT(locale, `aiChat.crops.${cropKey}.${question}`)
    : undefined;

  if (advice) {
    return {
      success: true,
      data: { advice, cropType, question },
      confidence_score: 0.92,
      responsible_agent: serverT(locale, 'aiChat.agentNames.cropAdvisor'),
      frameworks_used: [
        serverT(locale, 'assistant.frameworks.aim'),
        serverT(locale, 'assistant.frameworks.rank'),
        serverT(locale, 'assistant.frameworks.trail'),
      ],
      timestamp: new Date().toISOString(),
    };
  }

  return {
    success: true,
    data: {
      advice: serverT(locale, 'aiChat.fallbackAdvice', { crop: cropType }),
      cropType,
      question,
    },
    confidence_score: 0.7,
    responsible_agent: serverT(locale, 'aiChat.agentNames.cropAdvisor'),
    frameworks_used: [serverT(locale, 'assistant.frameworks.aim')],
    timestamp: new Date().toISOString(),
  };
}

export function getWeatherAdvisory(
  condition: string,
  forecast: { temp_high: number; temp_low: number; condition: string; rainfall_chance: number }[],
  locale: string = 'en',
): AIAgentResponse {
  const hasHeavyRain = forecast.some((d) => d.rainfall_chance > 70);
  const hasHighHeat = forecast.some((d) => d.temp_high > 35);
  const hasDrought = forecast.every((d) => d.rainfall_chance < 20);

  let advisory = serverT(locale, 'aiChat.weatherAdvisories.normal');
  if (hasHeavyRain) advisory = serverT(locale, 'aiChat.weatherAdvisories.heavyRain');
  if (hasHighHeat) advisory = serverT(locale, 'aiChat.weatherAdvisories.highTemp');
  if (hasDrought) advisory = serverT(locale, 'aiChat.weatherAdvisories.dry');

  return {
    success: true,
    data: { advisory, forecast_summary: forecast.length > 0 ? `${forecast.length}-day forecast analyzed` : serverT(locale, 'aiChat.currentConditionsOnly') },
    confidence_score: 0.88,
    responsible_agent: serverT(locale, 'aiChat.agentNames.weatherIntelligence'),
    frameworks_used: [serverT(locale, 'assistant.frameworks.trail'), serverT(locale, 'assistant.frameworks.track')],
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

export function getChatResponse(query: string, locale: string = 'en'): AIAgentResponse {
  const lower = query.toLowerCase();
  let agentName = serverT(locale, 'aiChat.agentNames.generalAssistant');
  let frameworks = [serverT(locale, 'assistant.frameworks.aim')];
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
      const diag = diagnoseDisease(detectedCrop, query, undefined, locale);
      if (diag.success) {
        const d = diag.data as {
          primaryDiagnosis?: { name: string; type: string; confidence: number };
          possibleCauses: Array<{ name: string; type: string; likelihood: string; confidence: number; treatment?: string; prevention?: string }>;
          reasoning: { summary: string };
          uncertaintyLevel: string;
        };
        if (d.primaryDiagnosis) {
          response = `${serverT(locale, 'diagnosis.diagnosisFor')} ${capitalize(detectedCrop)}: ${d.primaryDiagnosis.name}\n`;
          response += `${serverT(locale, 'diagnosis.typeLabel')} ${d.primaryDiagnosis.type} | ${serverT(locale, 'diagnosis.confidenceLabel')} ${Math.round(d.primaryDiagnosis.confidence * 100)}% | ${serverT(locale, 'diagnosis.uncertaintyLabel')} ${d.uncertaintyLevel}\n\n`;
          response += `${serverT(locale, 'diagnosis.reasoningLabel')} ${d.reasoning.summary}\n\n`;

          if (d.possibleCauses.length > 1) {
            response += `${serverT(locale, 'diagnosis.otherCauses')}\n`;
            d.possibleCauses.slice(0, 3).forEach((c, i) => {
              response += `${i + 1}. ${c.name} (${c.likelihood} likelihood, ${Math.round(c.confidence * 100)}% confidence)\n`;
            });
            response += '\n';
          }

          const primaryDetail = d.possibleCauses.find(c => c.name === d.primaryDiagnosis?.name);
          if (primaryDetail?.treatment) {
            response += `${serverT(locale, 'diagnosis.treatmentLabel')} ${primaryDetail.treatment}\n\n`;
            response += `${serverT(locale, 'diagnosis.preventionLabel')} ${primaryDetail.prevention}`;
          }
        } else {
          response = `${serverT(locale, 'diagnosis.analysisFor')} ${capitalize(detectedCrop)}:\n`;
          response += `${serverT(locale, 'diagnosis.uncertaintyLevel')} ${d.uncertaintyLevel}\n`;
          response += `${serverT(locale, 'diagnosis.reasoningLabel')} ${d.reasoning.summary}\n\n`;
          if (d.possibleCauses.length > 0) {
            response += `${serverT(locale, 'diagnosis.possibleCausesLabel')} (${d.uncertaintyLevel} confidence):\n`;
            d.possibleCauses.slice(0, 3).forEach((c, i) => {
              response += `${i + 1}. ${c.name} (${c.likelihood} likelihood)\n`;
            });
          }
        }
        agentName = serverT(locale, 'aiChat.agentNames.cropDisease');
        frameworks = [
          serverT(locale, 'assistant.frameworks.aim'),
          serverT(locale, 'assistant.frameworks.map'),
          serverT(locale, 'assistant.frameworks.track'),
        ];
      }
    } else {
      const question = isFertilizer ? 'fertilizer' : isPest ? 'pest' : 'planting';
      const capitalizedCrop = detectedCrop.split(' ').map(capitalize).join(' ');
      const advice = getCropAdvisorAdvice(capitalizedCrop, question, locale);
      if (advice.success) {
        response = (advice.data as { advice: string }).advice;
        agentName = advice.responsible_agent ?? serverT(locale, 'aiChat.agentNames.cropAdvisor');
        frameworks = advice.frameworks_used ?? [serverT(locale, 'assistant.frameworks.aim'), serverT(locale, 'assistant.frameworks.rank'), serverT(locale, 'assistant.frameworks.trail')];
      }
    }
  } else if (isPoultry) {
    if (lower.includes('layer') || lower.includes('egg')) {
      response = serverT(locale, 'aiChat.poultry.layer');
      agentName = serverT(locale, 'aiChat.agentNames.poultrySpecialist');
    } else {
      response = serverT(locale, 'aiChat.poultry.broiler');
      agentName = serverT(locale, 'aiChat.agentNames.poultrySpecialist');
    }
    frameworks = [serverT(locale, 'assistant.frameworks.aim'), serverT(locale, 'assistant.frameworks.track'), serverT(locale, 'assistant.frameworks.trail')];
  } else if (isAquaculture) {
    response = serverT(locale, 'aiChat.aquaculture');
    agentName = serverT(locale, 'aiChat.agentNames.aquacultureSpecialist');
    frameworks = [serverT(locale, 'assistant.frameworks.aim'), serverT(locale, 'assistant.frameworks.trail')];
  } else if (isBeekeeping) {
    response = serverT(locale, 'aiChat.beekeeping');
    agentName = serverT(locale, 'aiChat.agentNames.beekeepingSpecialist');
    frameworks = [serverT(locale, 'assistant.frameworks.aim'), serverT(locale, 'assistant.frameworks.trail')];
  } else if (isIrrigation) {
    response = serverT(locale, 'aiChat.irrigation');
    agentName = serverT(locale, 'aiChat.agentNames.irrigationSpecialist');
    frameworks = [serverT(locale, 'assistant.frameworks.aim'), serverT(locale, 'assistant.frameworks.trail'), serverT(locale, 'assistant.frameworks.track')];
  } else if (isPostHarvest) {
    response = serverT(locale, 'aiChat.postHarvest');
    agentName = serverT(locale, 'aiChat.agentNames.postHarvestSpecialist');
    frameworks = [serverT(locale, 'assistant.frameworks.aim'), serverT(locale, 'assistant.frameworks.trail')];
  } else if (isFarmEconomics) {
    response = serverT(locale, 'aiChat.farmEconomics');
    agentName = serverT(locale, 'aiChat.agentNames.farmEconomicsSpecialist');
    frameworks = [serverT(locale, 'assistant.frameworks.aim'), serverT(locale, 'assistant.frameworks.track'), serverT(locale, 'assistant.frameworks.rank')];
  } else if (isGreenhouse) {
    response = serverT(locale, 'aiChat.greenhouse');
    agentName = serverT(locale, 'aiChat.agentNames.greenhouseSpecialist');
    frameworks = [serverT(locale, 'assistant.frameworks.aim'), serverT(locale, 'assistant.frameworks.trail'), serverT(locale, 'assistant.frameworks.track')];
  } else if (lower.includes('weather') || lower.includes('rain') || lower.includes('temperature') || lower.includes('humid') || lower.includes('forecast') || lower.includes('drought') || lower.includes('sunny') || lower.includes('cloud')) {
    const advisory = getWeatherAdvisory('current', [], locale);
    if (advisory.success) {
      response = (advisory.data as { advisory: string }).advisory;
      agentName = advisory.responsible_agent ?? serverT(locale, 'aiChat.agentNames.weatherIntelligence');
      frameworks = advisory.frameworks_used ?? [serverT(locale, 'assistant.frameworks.trail'), serverT(locale, 'assistant.frameworks.track')];
    }
  } else if (isSoil || lower.includes('sustainab') || lower.includes('carbon') || lower.includes('environment') || lower.includes('organic') || lower.includes('score') || lower.includes('footprint')) {
    response = serverTArray(locale, 'aiChat.sustainabilityTips').map((tip, i) => `${i + 1}) ${tip}`).join('\n');
    agentName = serverT(locale, 'aiChat.agentNames.sustainabilitySpecialist');
    frameworks = [serverT(locale, 'assistant.frameworks.aim'), serverT(locale, 'assistant.frameworks.oasis'), serverT(locale, 'assistant.frameworks.track')];
  } else {
    response = serverT(locale, 'aiChat.welcome');
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
