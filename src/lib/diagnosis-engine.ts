import type { GrowthStage, SymptomCategory, PossibleCause, DiagnosisResult, Likelihood, ConditionType } from '@/types';

interface ConditionEntry {
  name: string;
  type: ConditionType;
  pathogen?: string;
  symptoms: Partial<Record<SymptomCategory, string[]>>;
  relevantStages: GrowthStage[];
  treatment: string;
  prevention: string;
}

interface CategorizedSymptoms {
  categories: Partial<Record<SymptomCategory, string[]>>;
  allTerms: string[];
  hasSpecificDiseaseTerms: boolean;
  specificTerms: string[];
}

const CATEGORY_KEYWORDS: Record<SymptomCategory, string[]> = {
  leaf: [
    'leaf', 'leaves', 'spot', 'blight', 'chlorosis', 'yellowing', 'mosaic',
    'curling', 'wilting leaf', 'necrotic', 'lesion', 'blotch', 'blister',
    'pustule', 'rust', 'mildew', 'defoliation', 'leaf drop', 'leaf fall',
    'fuzzy growth', 'white growth', 'downy', 'vein', 'mottling',
    'chlorotic', ' necrosis', 'marginal burn', 'leaf scorch',
  ],
  flower: [
    'flower', 'blossom', 'blight flower', 'flower drop', 'flower fall',
    'inflorescence', 'bloom', 'petal', 'flower distortion', 'flower rot',
    'falling of flowers', 'flowers falling', 'flowers dropping',
    'blossom drop', 'flower abortion',
  ],
  fruit_nut: [
    'fruit', 'nut', 'pod', 'cob', 'berry', 'kernel', 'capsule',
    'fruit drop', 'fruit rot', 'fruit spot', 'fruit lesion',
    'fruit distortion', 'premature fruit', 'fruit fall',
    'sunken lesion', 'spore mass', 'husk', 'nut drop',
    'fruit splitting', 'gum exudation', 'fruit discoloration',
    'fruit deformation', 'bitter fruit', 'lopsided fruit',
    'pod rot', 'pod lesion', 'boll rot', 'grain discoloration',
    'seed rot', 'fruit cracking',
  ],
  stem_root: [
    'stem', 'root', 'stalk', 'trunk', 'branch', 'cane', 'vine',
    'stem rot', 'stem lesion', 'canker', 'vascular', 'wilt',
    'root rot', 'dieback', 'gummosis', 'whip', 'sett',
    'stem discoloration', 'vascular discoloration',
    'root decay', 'crown rot', 'stool', 'tiller',
    'branch dieback', 'shoot', 'sprout',
  ],
  environmental_stress: [
    'wilting', 'drought', 'heat', 'sunscald', 'sunburn',
    'waterlog', 'flood', 'frost', 'cold', 'wind', 'hail',
    'nutrient deficiency', 'yellowing general', 'stunted growth',
    'poor growth', 'slow growth', 'leaf scorch', 'marginal burn',
    'tip burn', 'blossom end rot', 'sunken', 'water-soaked',
    'falling of flowers', 'flower drop', 'fruit drop',
    'premature drop', 'shedding', 'abscission',
  ],
  general: [
    'stunted', 'yellow', 'brown', 'black', 'white', 'gray',
    'discoloration', 'malformation', 'deformation', 'necrosis',
    'dieback', 'decline', 'poor yield', 'low yield',
    'abnormal growth', 'reduced growth', 'stunting',
  ],
};

function categorizeSymptoms(symptomText: string): CategorizedSymptoms {
  const lower = symptomText.toLowerCase();
  const categories: Partial<Record<SymptomCategory, string[]>> = {};
  const allTerms: string[] = [];
  const specificTerms: string[] = [];

  const diseaseKeywords = [
    'blight', 'rust', 'mildew', 'mosaic', 'wilt', 'rot', 'canker',
    'anthracnose', 'smut', 'virus', 'bacterial', 'fungal', 'fungus',
    'spot', 'lesion', 'pustule', 'blister',
  ];

  let hasSpecificDiseaseTerms = false;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const matched: string[] = [];
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        matched.push(kw);
        allTerms.push(kw);
      }
    }
    if (matched.length > 0) {
      categories[category as SymptomCategory] = matched;
    }
  }

  for (const dk of diseaseKeywords) {
    if (lower.includes(dk)) {
      hasSpecificDiseaseTerms = true;
      specificTerms.push(dk);
    }
  }

  if (lower.length > 0 && Object.keys(categories).length === 0) {
    categories.general = ['general symptoms described'];
  }

  return { categories, allTerms, hasSpecificDiseaseTerms, specificTerms };
}

function scoreCondition(
  condition: ConditionEntry,
  categorized: CategorizedSymptoms,
  growthStage: GrowthStage,
): { score: number; matchedSymptoms: string[]; unmatchedSymptoms: string[]; categoryCount: number } {
  const matchedSymptoms: string[] = [];
  const unmatchedSymptoms: string[] = [];
  let matchedCategories = 0;

  for (const [category, condSymptoms] of Object.entries(condition.symptoms)) {
    const cat = category as SymptomCategory;
    const userCatSymptoms = categorized.categories[cat];
    const categoryMatched = userCatSymptoms && userCatSymptoms.length > 0;

    if (categoryMatched) {
      matchedCategories++;
    }

    if (condSymptoms) {
      let hasMatchInCategory = false;
      for (const condSym of condSymptoms) {
        if (categorized.allTerms.some(t => condSym.includes(t) || t.includes(condSym))) {
          matchedSymptoms.push(condSym);
          hasMatchInCategory = true;
        } else if (categorized.allTerms.length === 0) {
          break;
        }
      }
      if (!hasMatchInCategory && condSymptoms.length > 0) {
        unmatchedSymptoms.push(...condSymptoms);
      }
    }
  }

  const totalCondSymptoms = Object.values(condition.symptoms).reduce((sum, arr) => sum + (arr?.length ?? 0), 0);

  let baseScore = 0;
  if (totalCondSymptoms > 0) {
    baseScore = matchedSymptoms.length / Math.max(totalCondSymptoms, 1);
  }

  if (totalCondSymptoms === 0 && categorized.allTerms.length > 0) {
    baseScore = 0.15;
  }

  let categoryBonus = 1.0;
  if (matchedCategories >= 2) {
    categoryBonus = 1.0 + (matchedCategories - 1) * 0.12;
  }
  categoryBonus = Math.min(categoryBonus, 1.3);

  let stageFactor = 1.0;
  if (growthStage !== 'unknown' && condition.relevantStages.length > 0) {
    if (condition.relevantStages.includes(growthStage)) {
      stageFactor = 1.0;
    } else if (condition.relevantStages.some(s =>
      (s === 'vegetative' && growthStage === 'seedling') ||
      (s === 'flowering' && growthStage === 'fruiting') ||
      (s === 'fruiting' && growthStage === 'flowering')
    )) {
      stageFactor = 0.65;
    } else {
      stageFactor = 0.35;
    }
  }

  let vaguenessPenalty = 1.0;
  const matchedCatCount = Object.keys(categorized.categories).length;
  if (matchedCatCount <= 1 && categorized.allTerms.length < 3) {
    vaguenessPenalty = 0.55;
  } else if (matchedCatCount <= 1 && categorized.allTerms.length < 5) {
    vaguenessPenalty = 0.75;
  }

  let specificityBonus = 1.0;
  if (categorized.hasSpecificDiseaseTerms && categorized.specificTerms.length >= 2) {
    if (categorized.specificTerms.some(t => condition.name.toLowerCase().includes(t))) {
      specificityBonus = 1.15;
    } else {
      specificityBonus = 1.05;
    }
  }

  let score = baseScore * categoryBonus * stageFactor * vaguenessPenalty * specificityBonus;

  if (categorized.allTerms.length === 0) {
    score = 0.05;
  }

  score = Math.max(0, Math.min(0.95, score));

  if (growthStage === 'unknown') {
    score *= 0.85;
  }

  return { score, matchedSymptoms, unmatchedSymptoms, categoryCount: matchedCategories };
}

function confidenceLevel(score: number, totalSymptoms: number, matchedSymptoms: number): Likelihood {
  if (score >= 0.65 && matchedSymptoms >= 3 && totalSymptoms >= 3) return 'high';
  if (score >= 0.40 && matchedSymptoms >= 2) return 'medium';
  return 'low';
}

function determineUncertainty(
  primaryScore: number,
  matchedSymptoms: number,
  totalConditions: number,
  growthStage: GrowthStage,
): {
  level: 'low' | 'moderate' | 'high';
  requestMoreInfo: boolean;
  missingInfo: string[];
} {
  const missingInfo: string[] = [];
  let level: 'low' | 'moderate' | 'high' = 'high';
  let requestMoreInfo = false;

  if (growthStage === 'unknown') {
    missingInfo.push('Crop growth stage');
  }

  if (matchedSymptoms < 2) {
    missingInfo.push('More specific symptom details');
  }

  if (primaryScore < 0.40) {
    level = 'high';
    requestMoreInfo = true;
  } else if (primaryScore < 0.60) {
    level = 'moderate';
    if (matchedSymptoms < 3) {
      requestMoreInfo = true;
    }
  } else {
    level = 'low';
  }

  if (totalConditions > 3 && primaryScore < 0.50) {
    level = 'high';
    requestMoreInfo = true;
  }

  return { level, requestMoreInfo, missingInfo };
}

function buildReasoning(
  primary: PossibleCause | undefined,
  possibleCauses: PossibleCause[],
  categorized: CategorizedSymptoms,
  growthStage: GrowthStage,
  uncertaintyLevel: string,
): DiagnosisResult['reasoning'] {
  const symptomInfluences: string[] = [];
  const uncertainties: string[] = [];

  for (const [cat, terms] of Object.entries(categorized.categories)) {
    if (terms && terms.length > 0) {
      symptomInfluences.push(`Detected ${cat} symptoms: ${terms.join(', ')}`);
    }
  }

  if (uncertaintyLevel === 'high') {
    uncertainties.push('Symptoms are too vague for a confident diagnosis');
    if (growthStage === 'unknown') {
      uncertainties.push('Growth stage is unknown, which affects diagnosis accuracy');
    }
  } else if (uncertaintyLevel === 'moderate') {
    uncertainties.push('More symptoms would improve diagnostic confidence');
  }

  if (possibleCauses.length > 1 && primary) {
    const diff = primary.confidence - (possibleCauses[1]?.confidence ?? 0);
    if (diff < 0.15) {
      uncertainties.push(`Multiple conditions have similar symptom profiles (confidence gap: ${Math.round(diff * 100)}%)`);
    }
  }

  const hasStress = possibleCauses.some(c => c.type === 'stress');
  const hasDisease = possibleCauses.some(c => c.type === 'disease');
  if (hasStress && hasDisease) {
    symptomInfluences.push('Both stress and disease symptoms detected — requires careful differentiation');
  }

  let growthStageNote: string | undefined;
  if (growthStage !== 'unknown') {
    growthStageNote = `Diagnosis considers the ${growthStage} growth stage`;
    if (primary && !possibleCauses.find(c => c.name === primary.name)?.name) {
      growthStageNote += `. Some conditions are less likely at this stage`;
    }
  }

  const likelyPrimary = possibleCauses.find(c => c.likelihood === 'high') ?? possibleCauses[0];
  let summary: string;
  if (uncertaintyLevel === 'high') {
    summary = 'Symptoms are insufficient for a definitive diagnosis. Multiple possible causes identified with low confidence. Consider providing more details.';
  } else if (likelyPrimary && likelyPrimary.confidence >= 0.60) {
    summary = `${likelyPrimary.name} is the most likely cause based on the symptoms described, with ${Math.round(likelyPrimary.confidence * 100)}% confidence.`;
  } else {
    summary = `${possibleCauses.length} possible conditions identified. Symptoms are not sufficiently specific for a definitive diagnosis.`;
  }

  return { summary, symptomInfluences, uncertainties, growthStageNote };
}

function generateId(): string {
  return 'diag-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

const CROP_CONDITIONS: Record<string, ConditionEntry[]> = {
  maize: [
    {
      name: 'Northern Leaf Blight',
      type: 'disease',
      pathogen: 'Exserohilum turcicum',
      symptoms: {
        leaf: ['elongated lesions', 'gray-green lesions', 'lesions on lower leaves', 'lesions spreading upward'],
        general: ['leaf blight', 'reduced yield'],
      },
      relevantStages: ['vegetative', 'flowering'],
      treatment: 'Apply fungicide containing triazole or strobilurin. Remove and destroy infected leaves. Ensure proper plant spacing for air circulation.',
      prevention: 'Plant resistant hybrid varieties. Practice crop rotation with non-cereal crops. Apply preventive fungicides during humid conditions.',
    },
    {
      name: 'Maize Streak Virus',
      type: 'disease',
      pathogen: 'Maize streak virus (MSV)',
      symptoms: {
        leaf: ['chlorotic streaks', 'yellow streaks', 'leaf stunting', 'mosaic pattern'],
        general: ['stunted growth', 'reduced yield'],
      },
      relevantStages: ['seedling', 'vegetative'],
      treatment: 'No curative treatment. Remove and destroy infected plants early. Control leafhopper vectors with systemic insecticides.',
      prevention: 'Plant resistant/tolerant varieties. Control leafhopper vectors. Avoid planting near infected fields. Plant early to avoid peak vector populations.',
    },
    {
      name: 'Heat & Drought Stress',
      type: 'stress',
      symptoms: {
        leaf: ['leaf rolling', 'leaf scorch', 'marginal burn', 'wilting'],
        environmental_stress: ['wilting', 'leaf rolling during heat', 'drought stress'],
        general: ['stunted growth', 'poor yield'],
      },
      relevantStages: ['vegetative', 'flowering', 'fruiting'],
      treatment: 'Irrigate during dry spells. Apply mulch to conserve soil moisture. Avoid planting during peak dry seasons.',
      prevention: 'Plant drought-tolerant varieties. Practice conservation tillage. Use drip irrigation. Maintain soil organic matter for water retention.',
    },
    {
      name: 'Nitrogen Deficiency',
      type: 'nutrient_deficiency',
      symptoms: {
        leaf: ['pale green leaves', 'yellowing from tip', 'V-shaped yellowing', 'chlorosis lower leaves'],
        general: ['stunted growth', 'poor yield', 'thin stalks'],
      },
      relevantStages: ['vegetative', 'flowering', 'fruiting'],
      treatment: 'Apply nitrogen fertilizer (CAN, Urea) at recommended rates. Foliar spray with urea for rapid correction.',
      prevention: 'Apply adequate nitrogen fertilizer based on soil test. Use split application for better efficiency. Incorporate legumes in rotation.',
    },
  ],
  wheat: [
    {
      name: 'Wheat Stem Rust',
      type: 'disease',
      pathogen: 'Puccinia graminis',
      symptoms: {
        stem_root: ['rust pustules on stems', 'stem lesions', 'stem discoloration'],
        leaf: ['rust pustules on leaves', 'reddish-brown pustules', 'leaf rust'],
        general: ['reduced yield', 'grain shriveling'],
      },
      relevantStages: ['vegetative', 'flowering'],
      treatment: 'Apply fungicide (triazole or strobilurin class). Remove rust pustules from leaves. Use disease-free seed for next planting.',
      prevention: 'Plant resistant varieties. Early planting to avoid peak spore season. Monitor fields weekly during growing season.',
    },
    {
      name: 'Wheat Powdery Mildew',
      type: 'disease',
      pathogen: 'Blumeria graminis',
      symptoms: {
        leaf: ['white powdery growth', 'powdery coating', 'leaf spots', 'yellowing leaves'],
        general: ['reduced tillering', 'poor grain fill'],
      },
      relevantStages: ['vegetative', 'flowering'],
      treatment: 'Apply sulphur-based or triazole fungicides. Improve air circulation. Reduce plant density.',
      prevention: 'Plant resistant varieties. Avoid excessive nitrogen. Ensure proper spacing. Practice crop rotation.',
    },
    {
      name: 'Drought Stress',
      type: 'stress',
      symptoms: {
        leaf: ['leaf rolling', 'wilting', 'leaf tip burn'],
        environmental_stress: ['drought stress', 'wilting', 'heat stress'],
        general: ['stunted growth', 'poor head formation'],
      },
      relevantStages: ['vegetative', 'flowering', 'fruiting'],
      treatment: 'Irrigate if possible. Apply mulch to reduce evaporation. Avoid cultivation that disturbs roots.',
      prevention: 'Plant drought-tolerant varieties. Practice conservation agriculture. Maintain soil organic matter.',
    },
  ],
  rice: [
    {
      name: 'Rice Blast',
      type: 'disease',
      pathogen: 'Magnaporthe oryzae',
      symptoms: {
        leaf: ['diamond-shaped lesions', 'gray center lesions', 'brown margin lesions', 'leaf spots'],
        stem_root: ['neck rot', 'node infection'],
        general: ['panicle blight', 'reduced yield'],
      },
      relevantStages: ['vegetative', 'flowering'],
      treatment: 'Apply fungicide (tricyclazole or isoprothiolane). Maintain proper water management. Reduce nitrogen fertilizer temporarily.',
      prevention: 'Use resistant varieties. Avoid excessive nitrogen. Maintain consistent water depth. Remove crop residues after harvest.',
    },
    {
      name: 'Rice Yellow Mottle Virus',
      type: 'disease',
      pathogen: 'Rice yellow mottle virus (RYMV)',
      symptoms: {
        leaf: ['yellow mottling', 'chlorotic streaks', 'leaf discoloration', 'leaf distortion'],
        general: ['stunted growth', 'reduced tillering', 'poor panicle exertion'],
      },
      relevantStages: ['seedling', 'vegetative'],
      treatment: 'Remove and destroy infected plants. Control beetle vectors. Use clean planting materials.',
      prevention: 'Plant resistant varieties. Use certified clean seed. Control weed hosts. Practice field sanitation.',
    },
    {
      name: 'Nitrogen Deficiency',
      type: 'nutrient_deficiency',
      symptoms: {
        leaf: ['pale green to yellow', 'chlorosis lower leaves', 'yellowing from tip'],
        general: ['stunted growth', 'reduced tillering', 'poor yield'],
      },
      relevantStages: ['vegetative', 'flowering'],
      treatment: 'Apply nitrogen fertilizer (Urea) at recommended split rates based on growth stage.',
      prevention: 'Apply balanced fertilization based on soil test. Use slow-release nitrogen fertilizers. Incorporate green manure.',
    },
  ],
  cassava: [
    {
      name: 'Cassava Mosaic Virus',
      type: 'disease',
      pathogen: 'Cassava mosaic virus (CMV)',
      symptoms: {
        leaf: ['mosaic pattern', 'yellow-green chlorosis', 'leaf distortion', 'curled leaves', 'leaf stunting'],
        general: ['stunted growth', 'reduced yield'],
      },
      relevantStages: ['seedling', 'vegetative'],
      treatment: 'Remove and burn infected plants immediately. Use virus-free planting cuttings. Control whitefly populations with neem-based insecticides.',
      prevention: 'Use certified virus-free cuttings. Plant resistant varieties. Maintain field hygiene. Remove alternative host plants.',
    },
    {
      name: 'Cassava Brown Streak Virus',
      type: 'disease',
      pathogen: 'Cassava brown streak virus (CBSV)',
      symptoms: {
        leaf: ['chlorotic leaf spots', 'yellow leaf veins', 'leaf necrosis'],
        stem_root: ['brown necrotic stem lesions', 'root necrosis', 'root rot'],
        general: ['stunted growth', 'root deterioration'],
      },
      relevantStages: ['vegetative', 'flowering'],
      treatment: 'Remove and destroy infected plants. Use disease-free cuttings. Control whitefly vectors.',
      prevention: 'Use certified virus-free planting material. Plant tolerant varieties. Roguing of infected plants. Quarantine affected areas.',
    },
    {
      name: 'Drought Stress',
      type: 'stress',
      symptoms: {
        leaf: ['leaf wilting', 'leaf drop', 'leaf scorch', 'leaf yellowing'],
        environmental_stress: ['drought stress', 'wilting', 'leaf fall'],
        general: ['reduced growth', 'poor root development'],
      },
      relevantStages: ['vegetative', 'flowering'],
      treatment: 'Mulch to conserve moisture. Irrigate during extended dry periods. Reduce plant population to lower water demand.',
      prevention: 'Plant drought-tolerant varieties. Practice conservation tillage. Maintain soil organic matter.',
    },
  ],
  beans: [
    {
      name: 'Angular Leaf Spot',
      type: 'disease',
      pathogen: 'Pseudocercospora griseola',
      symptoms: {
        leaf: ['angular brown spots', 'gray-brown lesions', 'leaf spots limited by veins', 'yellow halos'],
        general: ['reduced yield', 'defoliation'],
      },
      relevantStages: ['vegetative', 'flowering'],
      treatment: 'Apply copper-based fungicide. Remove infected plant debris. Ensure proper air circulation through adequate spacing.',
      prevention: 'Use disease-free seed. Practice 2-3 year crop rotation. Avoid overhead irrigation. Remove volunteer bean plants.',
    },
    {
      name: 'Bean Common Mosaic Virus',
      type: 'disease',
      pathogen: 'Bean common mosaic virus (BCMV)',
      symptoms: {
        leaf: ['mosaic pattern', 'leaf curling', 'vein banding', 'chlorotic leaves'],
        general: ['stunted growth', 'reduced pod set'],
      },
      relevantStages: ['seedling', 'vegetative'],
      treatment: 'Remove infected plants. Control aphid vectors. Use virus-free seed.',
      prevention: 'Plant resistant varieties. Use certified disease-free seed. Control aphid populations. Practice crop rotation.',
    },
    {
      name: 'Flower Drop (Physiological)',
      type: 'physiological',
      symptoms: {
        flower: ['flower drop', 'flowers falling', 'poor pod set'],
        environmental_stress: ['heat stress', 'water stress'],
        general: ['reduced yield'],
      },
      relevantStages: ['flowering'],
      treatment: 'Maintain consistent soil moisture during flowering. Avoid excessive nitrogen which promotes vegetative growth over flowering.',
      prevention: 'Plant at optimal time to avoid heat stress during flowering. Maintain balanced nutrition. Ensure pollinator access.',
    },
  ],
  sorghum: [
    {
      name: 'Sorghum Anthracnose',
      type: 'disease',
      pathogen: 'Colletotrichum sublineolum',
      symptoms: {
        leaf: ['red circular spots', 'coalescing lesions', 'leaf lesions', 'red spots'],
        general: ['grain discoloration', 'reduced yield'],
      },
      relevantStages: ['vegetative', 'flowering'],
      treatment: 'Apply foliar fungicides (triazole or strobilurin). Remove and destroy infected crop residues. Use certified disease-free seed.',
      prevention: 'Plant resistant varieties. Practice crop rotation with non-cereal crops. Treat seeds with fungicide before planting.',
    },
    {
      name: 'Sorghum Downy Mildew',
      type: 'disease',
      pathogen: 'Peronosclerospora sorghi',
      symptoms: {
        leaf: ['chlorotic streaks', 'white downy growth', 'leaf shredding', 'pale green patches'],
        general: ['stunted growth', 'poor head formation'],
      },
      relevantStages: ['seedling', 'vegetative'],
      treatment: 'Remove infected plants. Apply metalaxyl-based fungicide. Improve field drainage.',
      prevention: 'Use resistant varieties. Treat seeds with metalaxyl. Practice crop rotation. Avoid waterlogged conditions.',
    },
    {
      name: 'Drought Stress',
      type: 'stress',
      symptoms: {
        leaf: ['leaf rolling', 'leaf scorch', 'wilting'],
        environmental_stress: ['drought stress', 'water stress'],
        general: ['reduced yield', 'poor grain fill'],
      },
      relevantStages: ['vegetative', 'flowering', 'fruiting'],
      treatment: 'Practice supplementary irrigation if available. Reduce plant population to lower water demand.',
      prevention: 'Plant drought-tolerant sorghum varieties. Practice moisture conservation. Use appropriate plant spacing.',
    },
  ],
  millet: [
    {
      name: 'Millet Downy Mildew',
      type: 'disease',
      pathogen: 'Sclerospora graminicola',
      symptoms: {
        leaf: ['chlorotic patches', 'white downy growth', 'pale green patches', 'leaf shredding'],
        general: ['stunted tillers', 'poor head formation', 'stunted growth'],
      },
      relevantStages: ['seedling', 'vegetative'],
      treatment: 'Remove and destroy infected plants. Apply metalaxyl-based fungicide. Improve field drainage.',
      prevention: 'Use resistant varieties. Practice crop rotation. Avoid dense planting. Treat seeds with metalaxyl before sowing.',
    },
    {
      name: 'Millet Blast',
      type: 'disease',
      pathogen: 'Magnaporthe grisea',
      symptoms: {
        leaf: ['diamond-shaped lesions', 'gray lesions', 'leaf spots', 'leaf blight'],
        stem_root: ['neck infection', 'node rot'],
        general: ['head blight', 'reduced yield'],
      },
      relevantStages: ['vegetative', 'flowering'],
      treatment: 'Apply fungicide (tricyclazole). Remove infected debris. Avoid excessive nitrogen.',
      prevention: 'Use resistant varieties. Balanced fertilization. Practice crop rotation.',
    },
  ],
  'sweet potato': [
    {
      name: 'Sweet Potato Virus Disease',
      type: 'disease',
      pathogen: 'Sweet potato virus complex',
      symptoms: {
        leaf: ['leaf curling', 'chlorotic mottling', 'leaf distortion', 'yellow mottling'],
        general: ['stunted vines', 'reduced tuber size', 'stunted growth'],
      },
      relevantStages: ['vegetative', 'flowering'],
      treatment: 'Remove and destroy infected plants. Use virus-free planting materials. Control aphid vectors with neem-based insecticides.',
      prevention: 'Plant certified virus-free vines. Rogue out infected plants early. Use resistant varieties where available.',
    },
    {
      name: 'Sweet Potato Weevil Damage',
      type: 'pest',
      symptoms: {
        stem_root: ['stem tunneling', 'root damage', 'tuber damage'],
        fruit_nut: ['tuber rot', 'internal feeding'],
        general: ['reduced yield', 'poor quality tubers'],
      },
      relevantStages: ['vegetative', 'fruiting'],
      treatment: 'Remove and destroy infested plants. Apply neem-based insecticides. Ridge soil to cover developing tubers.',
      prevention: 'Use clean planting materials. Practice crop rotation. Ridge soil around plants regularly. Harvest promptly at maturity.',
    },
  ],
  potato: [
    {
      name: 'Potato Late Blight',
      type: 'disease',
      pathogen: 'Phytophthora infestans',
      symptoms: {
        leaf: ['water-soaked lesions', 'white fungal growth', 'dark leaf lesions', 'leaf blight'],
        stem_root: ['stem rot', 'stem lesions'],
        fruit_nut: ['tuber rot', 'brown tuber rot'],
        general: ['plant collapse', 'rapid decline'],
      },
      relevantStages: ['vegetative', 'flowering'],
      treatment: 'Apply fungicides (chlorothalonil or mancozeb). For active infection use metalaxyl-based fungicides. Remove infected foliage.',
      prevention: 'Plant certified disease-free seed potatoes. Use resistant varieties. Practice 3-4 year crop rotation. Hill soil around plants.',
    },
    {
      name: 'Potato Early Blight',
      type: 'disease',
      pathogen: 'Alternaria solani',
      symptoms: {
        leaf: ['target spot lesions', 'dark brown spots', 'concentric rings', 'yellow halos', 'leaf necrosis'],
        general: ['defoliation', 'reduced yield'],
      },
      relevantStages: ['vegetative', 'flowering'],
      treatment: 'Apply fungicides (chlorothalonil, mancozeb, or azoxystrobin). Maintain plant vigor with adequate nutrition.',
      prevention: 'Use certified seed. Practice crop rotation. Ensure proper nutrition. Avoid overhead irrigation.',
    },
    {
      name: 'Drought Stress',
      type: 'stress',
      symptoms: {
        leaf: ['wilting', 'leaf curling', 'leaf scorch'],
        environmental_stress: ['drought stress', 'water stress'],
        general: ['reduced growth', 'poor tuber development'],
      },
      relevantStages: ['vegetative', 'flowering', 'fruiting'],
      treatment: 'Irrigate consistently. Apply mulch to retain moisture. Avoid water stress during tuber initiation.',
      prevention: 'Maintain consistent soil moisture. Use mulch. Plant in well-drained but moisture-retentive soils.',
    },
  ],
  banana: [
    {
      name: 'Fusarium Wilt (Panama Disease)',
      type: 'disease',
      pathogen: 'Fusarium oxysporum f. sp. cubense TR4',
      symptoms: {
        leaf: ['leaf yellowing', 'wilting leaves', 'leaf collapse'],
        stem_root: ['vascular discoloration', 'pseudostem splitting', 'internal discoloration'],
        general: ['plant decline', 'death'],
      },
      relevantStages: ['vegetative', 'flowering', 'fruiting'],
      treatment: 'Remove and destroy infected plants immediately. Quarantine affected areas. Apply soil solarization for small plots.',
      prevention: 'Use tissue-culture certified seedlings. Plant resistant FHIA hybrids. Disinfect farm tools. Avoid moving infected soil.',
    },
    {
      name: 'Black Sigatoka',
      type: 'disease',
      pathogen: 'Mycosphaerella fijiensis',
      symptoms: {
        leaf: ['black streaks', 'dark leaf spots', 'leaf necrosis', 'leaf blight', 'defoliation'],
        general: ['reduced fruit fill', 'premature ripening'],
      },
      relevantStages: ['vegetative', 'flowering'],
      treatment: 'Apply fungicide sprays (triazole or strobilurin). Remove and destroy severely affected leaves. Improve air circulation.',
      prevention: 'Use resistant varieties. Maintain proper plant spacing. Remove affected leaves regularly. Apply preventive fungicide sprays.',
    },
    {
      name: 'Nutrient Deficiency (Potassium)',
      type: 'nutrient_deficiency',
      symptoms: {
        leaf: ['yellow leaf margins', 'orange-yellow leaves', 'leaf tip necrosis', 'rapid leaf death'],
        fruit_nut: ['small bunches', 'thin fingers', 'poor fruit fill'],
        general: ['reduced yield'],
      },
      relevantStages: ['vegetative', 'flowering', 'fruiting'],
      treatment: 'Apply potassium fertilizer (MOP or potassium sulphate). Use foliar potassium sprays for rapid correction.',
      prevention: 'Apply balanced nutrition based on soil test. Maintain regular potassium applications. Use organic mulch to recycle nutrients.',
    },
  ],
  coffee: [
    {
      name: 'Coffee Leaf Rust',
      type: 'disease',
      pathogen: 'Hemileia vastatrix',
      symptoms: {
        leaf: ['orange-yellow pustules', 'yellow spots', 'powdery pustules', 'leaf fall', 'defoliation'],
        general: ['reduced yield', 'berry drop', 'plant decline'],
      },
      relevantStages: ['vegetative', 'flowering'],
      treatment: 'Apply copper-based fungicides. Prune affected branches. Ensure proper shade management to reduce humidity.',
      prevention: 'Plant resistant varieties (Ruiru 11, Batian). Maintain optimal shade. Prune regularly for air circulation.',
    },
    {
      name: 'Coffee Berry Borer',
      type: 'pest',
      pathogen: 'Hypothenemus hampei',
      symptoms: {
        fruit_nut: ['berry drop', 'bore holes in berries', 'berry damage', 'premature berry fall'],
        general: ['reduced yield', 'poor quality beans'],
      },
      relevantStages: ['flowering', 'fruiting'],
      treatment: 'Remove and destroy infested berries. Use pheromone traps. Apply neem-based insecticides. Practice careful harvesting.',
      prevention: 'Maintain field sanitation. Harvest all berries at maturity. Use pheromone trapping. Prune for open canopy.',
    },
    {
      name: 'Drought Stress',
      type: 'stress',
      symptoms: {
        leaf: ['leaf wilting', 'leaf scorch', 'leaf drop'],
        environmental_stress: ['drought stress', 'water stress'],
        general: ['reduced yield', 'poor bean development'],
      },
      relevantStages: ['flowering', 'fruiting'],
      treatment: 'Apply mulch around trees. Irrigate during dry spells. Maintain shade trees to reduce evapotranspiration.',
      prevention: 'Maintain optimal shade levels. Use mulch. Plant drought-tolerant varieties. Practice soil water conservation.',
    },
  ],
  tea: [
    {
      name: 'Tea Blister Blight',
      type: 'disease',
      pathogen: 'Exobasidium vexans',
      symptoms: {
        leaf: ['translucent lesions', 'blistered leaves', 'raised blisters', 'circular lesions', 'leaf distortion'],
        general: ['reduced flush', 'shoot distortion', 'reduced yield'],
      },
      relevantStages: ['vegetative'],
      treatment: 'Apply copper-based fungicides. Prune affected shoots. Improve air circulation through proper plucking and pruning.',
      prevention: 'Plant resistant clones. Maintain proper plucking intervals. Ensure adequate shade. Avoid excessive nitrogen.',
    },
    {
      name: 'Tea Mosquito Bug',
      type: 'pest',
      symptoms: {
        leaf: ['leaf distortion', 'shot holes', 'leaf damage'],
        general: ['reduced flush', 'poor shoot development'],
      },
      relevantStages: ['vegetative'],
      treatment: 'Apply neem-based insecticides. Maintain proper plucking intervals. Prune to maintain plucking table.',
      prevention: 'Regular plucking reduces pest populations. Maintain shade levels. Use biological controls where possible.',
    },
  ],
  sugarcane: [
    {
      name: 'Sugarcane Smut',
      type: 'disease',
      pathogen: 'Ustilago scitaminea',
      symptoms: {
        stem_root: ['black whip structures', 'whip from spindle', 'stalk deformation'],
        general: ['stunted stalks', 'reduced tillering', 'reduced sugar content'],
      },
      relevantStages: ['vegetative', 'flowering'],
      treatment: 'Remove and burn infected stools immediately. Use disease-free setts for planting. Apply systemic fungicides.',
      prevention: 'Use resistant varieties. Treat setts with hot water (52°C for 30 min) before planting. Practice crop rotation.',
    },
    {
      name: 'Sugarcane Red Rot',
      type: 'disease',
      pathogen: 'Colletotrichum falcatum',
      symptoms: {
        leaf: ['leaf midrib lesions', 'leaf discoloration', 'leaf drying'],
        stem_root: ['internal red discoloration', 'stalk rot', 'stalk splitting'],
        general: ['reduced yield', 'low sugar recovery'],
      },
      relevantStages: ['vegetative', 'flowering'],
      treatment: 'Remove infected stools. Use disease-free setts. Apply fungicide to setts before planting.',
      prevention: 'Use resistant varieties. Treat setts with fungicide. Practice crop rotation. Avoid ratooning infected fields.',
    },
  ],
  cotton: [
    {
      name: 'Cotton Bacterial Blight',
      type: 'disease',
      pathogen: 'Xanthomonas campestris pv. malvacearum',
      symptoms: {
        leaf: ['angular water-soaked lesions', 'brown leaf spots', 'leaf necrosis', 'bacterial ooze'],
        stem_root: ['stem lesions', 'black arm'],
        fruit_nut: ['boll rot', 'boll lesions'],
      },
      relevantStages: ['vegetative', 'flowering', 'fruiting'],
      treatment: 'Apply copper-based bactericides. Remove and destroy infected plant debris. Use acid-delinted certified seed.',
      prevention: 'Plant resistant varieties. Practice crop rotation. Use disease-free seed. Avoid overhead irrigation.',
    },
    {
      name: 'Cotton Bollworm',
      type: 'pest',
      symptoms: {
        fruit_nut: ['boll damage', 'bore holes in bolls', 'boll rot', 'boll drop'],
        general: ['reduced yield', 'poor lint quality'],
      },
      relevantStages: ['flowering', 'fruiting'],
      treatment: 'Apply neem-based insecticides or Bt formulations. Use pheromone traps for monitoring. Remove and destroy damaged bolls.',
      prevention: 'Plant Bt cotton varieties. Practice integrated pest management. Use pheromone trapping. Maintain field sanitation.',
    },
  ],
  tomato: [
    {
      name: 'Tomato Late Blight',
      type: 'disease',
      pathogen: 'Phytophthora infestans',
      symptoms: {
        leaf: ['water-soaked dark lesions', 'white fungal growth', 'leaf blight', 'leaf wilting'],
        stem_root: ['stem cankers', 'stem lesions'],
        fruit_nut: ['fruit rot', 'brown fruit lesions', 'fruit damage'],
      },
      relevantStages: ['vegetative', 'flowering', 'fruiting'],
      treatment: 'Apply fungicides (chlorothalonil, mancozeb). Remove infected plants. Improve air circulation through staking and pruning.',
      prevention: 'Use resistant varieties. Practice 3-4 year crop rotation. Avoid overhead irrigation. Ensure proper spacing.',
    },
    {
      name: 'Tomato Early Blight',
      type: 'disease',
      pathogen: 'Alternaria solani',
      symptoms: {
        leaf: ['target spot lesions', 'dark spots with rings', 'yellow halos', 'leaf necrosis', 'defoliation'],
        stem_root: ['stem lesions', 'collar rot'],
        fruit_nut: ['fruit rot at stem end'],
      },
      relevantStages: ['vegetative', 'flowering'],
      treatment: 'Apply fungicides (chlorothalonil, azoxystrobin). Remove infected lower leaves. Mulch to reduce soil splash.',
      prevention: 'Use resistant varieties. Practice crop rotation. Stake plants for air circulation. Use drip irrigation.',
    },
    {
      name: 'Blossom End Rot',
      type: 'physiological',
      symptoms: {
        fruit_nut: ['sunken lesion at blossom end', 'fruit rot', 'dark sunken spot'],
        environmental_stress: ['calcium deficiency', 'water stress'],
      },
      relevantStages: ['flowering', 'fruiting'],
      treatment: 'Apply calcium foliar spray. Maintain consistent soil moisture. Remove affected fruits.',
      prevention: 'Ensure consistent watering. Maintain proper soil pH for calcium availability. Avoid excessive nitrogen. Mulch to retain moisture.',
    },
  ],
  onion: [
    {
      name: 'Onion Downy Mildew',
      type: 'disease',
      pathogen: 'Peronospora destructor',
      symptoms: {
        leaf: ['pale green lesions', 'purple-gray fuzzy growth', 'leaf dieback', 'leaf spots'],
        general: ['stunted growth', 'reduced bulb size'],
      },
      relevantStages: ['vegetative', 'flowering'],
      treatment: 'Apply fungicides (metalaxyl or mancozeb). Improve field drainage. Avoid overhead irrigation. Remove infected debris.',
      prevention: 'Use disease-free sets or seeds. Practice crop rotation. Ensure proper spacing. Plant in well-drained soils.',
    },
    {
      name: 'Onion Thrips',
      type: 'pest',
      symptoms: {
        leaf: ['silvery streaks', 'white patches', 'leaf distortion', 'leaf dieback'],
        general: ['reduced growth', 'small bulbs'],
      },
      relevantStages: ['vegetative', 'flowering'],
      treatment: 'Apply neem-based insecticides or spinosad. Use reflective mulch. Maintain proper irrigation.',
      prevention: 'Use resistant varieties. Practice crop rotation. Avoid planting near infested fields. Remove crop residues.',
    },
  ],
  kale: [
    {
      name: 'Black Rot',
      type: 'disease',
      pathogen: 'Xanthomonas campestris pv. campestris',
      symptoms: {
        leaf: ['V-shaped yellow lesions', 'blackened veins', 'leaf yellowing', 'leaf wilting', 'leaf necrosis'],
        general: ['stunted growth', 'plant decline'],
      },
      relevantStages: ['vegetative', 'flowering'],
      treatment: 'Remove and destroy infected plants. Apply copper-based bactericides. Disinfect tools with bleach solution.',
      prevention: 'Use certified disease-free seeds. Practice 3-4 year crop rotation. Avoid overhead irrigation. Control cruciferous weeds.',
    },
    {
      name: 'Diamondback Moth',
      type: 'pest',
      symptoms: {
        leaf: ['shot holes', 'leaf mining', 'leaf damage', 'holes in leaves'],
        general: ['reduced growth', 'poor yield'],
      },
      relevantStages: ['seedling', 'vegetative'],
      treatment: 'Apply neem-based insecticides or Bt formulations. Use pheromone traps. Remove and destroy infested leaves.',
      prevention: 'Practice crop rotation with non-brassica crops. Use row covers. Maintain field hygiene. Encourage natural enemies.',
    },
  ],
  mango: [
    {
      name: 'Mango Anthracnose',
      type: 'disease',
      pathogen: 'Colletotrichum gloeosporioides',
      symptoms: {
        leaf: ['leaf spots', 'leaf blight', 'leaf necrosis'],
        flower: ['flower blight', 'blossom blight'],
        fruit_nut: ['dark sunken fruit lesions', 'fruit rot', 'fruit drop', 'orange-pink spore masses'],
      },
      relevantStages: ['flowering', 'fruiting'],
      treatment: 'Apply copper-based fungicides during flowering and fruit development. Prune affected branches. Remove fallen fruits.',
      prevention: 'Plant resistant varieties. Prune for open canopy. Apply preventive fungicide sprays during flowering.',
    },
    {
      name: 'Mango Fruit Fly',
      type: 'pest',
      symptoms: {
        fruit_nut: ['fruit drop', 'fruit damage', 'soft spots on fruit', 'maggots in fruit'],
        general: ['reduced yield', 'poor fruit quality'],
      },
      relevantStages: ['fruiting'],
      treatment: 'Collect and destroy fallen fruits. Use pheromone traps. Bag developing fruits. Apply neem-based sprays.',
      prevention: 'Practice orchard sanitation. Use fruit fly traps. Harvest fruits at mature green stage. Remove alternate hosts.',
    },
    {
      name: 'Physiological Fruit Drop',
      type: 'physiological',
      symptoms: {
        fruit_nut: ['fruit drop', 'premature fruit fall', 'young fruit drop'],
        environmental_stress: ['water stress', 'heat stress', 'nutrient stress'],
      },
      relevantStages: ['flowering', 'fruiting'],
      treatment: 'Maintain consistent irrigation during fruit set and development. Apply balanced fertilizer. Provide wind breaks.',
      prevention: 'Ensure adequate pollination. Maintain tree health with balanced nutrition. Avoid water stress during fruit set. Thin fruits appropriately.',
    },
  ],
  avocado: [
    {
      name: 'Avocado Root Rot',
      type: 'disease',
      pathogen: 'Phytophthora cinnamomi',
      symptoms: {
        leaf: ['leaf yellowing', 'leaf wilting', 'small pale leaves'],
        stem_root: ['root decay', 'branch dieback', 'feeder root loss'],
        fruit_nut: ['reduced fruiting', 'small fruit'],
        general: ['tree decline', 'death'],
      },
      relevantStages: ['vegetative', 'flowering', 'fruiting'],
      treatment: 'Improve soil drainage. Apply phosphite fungicides via trunk injection. Remove severely affected trees.',
      prevention: 'Plant resistant rootstocks. Ensure proper soil drainage. Avoid planting in heavy clay soils.',
    },
    {
      name: 'Avocado Thrips',
      type: 'pest',
      symptoms: {
        leaf: ['leaf scarring', 'leaf damage', 'bronzed leaves'],
        fruit_nut: ['fruit scarring', 'russeting'],
        general: ['reduced yield'],
      },
      relevantStages: ['vegetative', 'flowering', 'fruiting'],
      treatment: 'Apply neem-based insecticides or insecticidal soap. Monitor with sticky traps. Maintain beneficial insect populations.',
      prevention: 'Use resistant varieties. Maintain tree health. Encourage natural predators. Monitor regularly.',
    },
  ],
  groundnut: [
    {
      name: 'Groundnut Rosette Virus',
      type: 'disease',
      pathogen: 'Groundnut rosette virus (GRV)',
      symptoms: {
        leaf: ['severe stunting', 'leaf curling', 'chlorotic mottling', 'yellow patches', 'leaf distortion'],
        general: ['reduced pod set', 'plant stunting', 'poor yield'],
      },
      relevantStages: ['vegetative', 'flowering'],
      treatment: 'Remove and destroy infected plants. Control aphid vectors with systemic insecticides.',
      prevention: 'Use resistant varieties. Plant at recommended spacing. Practice crop rotation. Control volunteer groundnuts.',
    },
    {
      name: 'Groundnut Leaf Spot',
      type: 'disease',
      pathogen: 'Cercospora arachidicola / Cercosporidium personatum',
      symptoms: {
        leaf: ['circular brown spots', 'dark leaf spots', 'yellow halos', 'leaf necrosis', 'defoliation'],
        general: ['reduced yield', 'poor pod fill'],
      },
      relevantStages: ['vegetative', 'flowering'],
      treatment: 'Apply fungicides (chlorothalonil or tebuconazole). Practice crop rotation. Remove crop residues.',
      prevention: 'Use resistant varieties. Practice crop rotation. Use disease-free seed. Apply preventive fungicides in humid conditions.',
    },
  ],
  sunflower: [
    {
      name: 'Sunflower Downy Mildew',
      type: 'disease',
      pathogen: 'Plasmopara halstedii',
      symptoms: {
        leaf: ['chlorotic patches', 'white downy growth', 'pale green patches', 'leaf stunting'],
        general: ['stunted plants', 'head distortion', 'reduced yield'],
      },
      relevantStages: ['seedling', 'vegetative'],
      treatment: 'Apply metalaxyl seed treatment. Remove infected plants. Improve field drainage.',
      prevention: 'Use resistant varieties. Treat seeds with metalaxyl. Practice crop rotation. Avoid waterlogged soils.',
    },
    {
      name: 'Sunflower Head Rot',
      type: 'disease',
      pathogen: 'Rhizopus spp. / Sclerotinia sclerotiorum',
      symptoms: {
        fruit_nut: ['head rot', 'head decay', 'seed rot', 'head discoloration'],
        general: ['reduced yield', 'poor seed quality'],
      },
      relevantStages: ['flowering', 'fruiting'],
      treatment: 'Remove and destroy affected heads. Improve air circulation. Avoid overhead irrigation during flowering.',
      prevention: 'Maintain proper spacing. Practice crop rotation. Avoid excessive nitrogen. Harvest at optimal maturity.',
    },
  ],
  cowpea: [
    {
      name: 'Cowpea Aphid-Borne Mosaic Virus',
      type: 'disease',
      pathogen: 'Cowpea aphid-borne mosaic virus (CABMV)',
      symptoms: {
        leaf: ['mosaic pattern', 'vein banding', 'leaf distortion', 'leaf mottling'],
        general: ['stunted growth', 'reduced podding', 'poor yield'],
      },
      relevantStages: ['seedling', 'vegetative'],
      treatment: 'Remove and destroy infected plants. Control aphid vectors using neem-based insecticides.',
      prevention: 'Plant resistant varieties. Use certified disease-free seed. Practice crop rotation. Control weed hosts.',
    },
    {
      name: 'Cowpea Pod Borer',
      type: 'pest',
      symptoms: {
        fruit_nut: ['pod damage', 'pod borer holes', 'seed damage', 'pod rot'],
        general: ['reduced yield', 'poor grain quality'],
      },
      relevantStages: ['flowering', 'fruiting'],
      treatment: 'Apply neem-based insecticides. Remove and destroy damaged pods. Use pheromone traps for monitoring.',
      prevention: 'Practice crop rotation. Plant early-maturing varieties. Use intercropping. Maintain field sanitation.',
    },
  ],
  pineapple: [
    {
      name: 'Pineapple Fusariosis',
      type: 'disease',
      pathogen: 'Fusarium subglutinans',
      symptoms: {
        fruit_nut: ['gum exudation', 'fruit rot', 'internal rot'],
        leaf: ['leaf wilting', 'leaf yellowing'],
        general: ['plant collapse', 'stunted growth'],
      },
      relevantStages: ['vegetative', 'fruiting'],
      treatment: 'Remove infected fruits. Apply systemic fungicides. Use disease-free planting materials.',
      prevention: 'Use certified disease-free suckers. Practice crop rotation. Ensure field sanitation.',
    },
    {
      name: 'Pineapple Mealybug Wilt',
      type: 'disease',
      symptoms: {
        leaf: ['leaf wilting', 'leaf reddening', 'leaf tip dieback', 'leaf curling'],
        general: ['plant decline', 'reduced fruit size', 'root decline'],
      },
      relevantStages: ['vegetative', 'fruiting'],
      treatment: 'Control mealybugs with systemic insecticides. Remove and destroy severely affected plants. Ant control.',
      prevention: 'Use clean planting material. Control ant populations. Practice field sanitation. Monitor mealybug populations.',
    },
  ],
  'passion fruit': [
    {
      name: 'Passion Fruit Woodiness Virus',
      type: 'disease',
      pathogen: 'Passion fruit woodiness virus',
      symptoms: {
        leaf: ['leaf mottling', 'leaf distortion', 'leaf curling'],
        fruit_nut: ['fruit distortion', 'hard rind', 'fruit deformation'],
        general: ['stunted vines', 'reduced yield'],
      },
      relevantStages: ['vegetative', 'flowering', 'fruiting'],
      treatment: 'Remove infected vines. Control aphid vectors. Use virus-free seedlings.',
      prevention: 'Plant certified virus-free seedlings. Control aphids. Remove alternative hosts.',
    },
    {
      name: 'Fusarium Wilt',
      type: 'disease',
      pathogen: 'Fusarium oxysporum f. sp. passiflorae',
      symptoms: {
        leaf: ['leaf yellowing', 'leaf wilting', 'leaf drop'],
        stem_root: ['vascular discoloration', 'stem rot', 'crown rot'],
        general: ['plant decline', 'death'],
      },
      relevantStages: ['vegetative', 'flowering', 'fruiting'],
      treatment: 'Remove and destroy infected plants. Apply soil drench with systemic fungicides. Improve drainage.',
      prevention: 'Use resistant rootstocks. Ensure proper drainage. Avoid planting in infested soils. Practice crop rotation.',
    },
  ],
  orange: [
    {
      name: 'Citrus Greening (Huanglongbing)',
      type: 'disease',
      pathogen: 'Candidatus Liberibacter spp.',
      symptoms: {
        leaf: ['blotchy leaf mottling', 'yellow veins', 'leaf drop'],
        fruit_nut: ['lopsided fruit', 'bitter fruit', 'color inversion', 'premature fruit drop', 'fruit drop'],
        general: ['twig dieback', 'tree decline'],
      },
      relevantStages: ['flowering', 'fruiting'],
      treatment: 'Remove infected trees. Control Asian citrus psyllid. Use certified nursery stock.',
      prevention: 'Plant certified disease-free seedlings. Monitor psyllid populations. Remove infected trees.',
    },
    {
      name: 'Citrus Canker',
      type: 'disease',
      pathogen: 'Xanthomonas citri',
      symptoms: {
        leaf: ['raised corky lesions', 'yellow halos', 'leaf spots', 'leaf necrosis'],
        stem_root: ['stem lesions', 'twig dieback'],
        fruit_nut: ['fruit lesions', 'raised spots on fruit'],
      },
      relevantStages: ['vegetative', 'flowering', 'fruiting'],
      treatment: 'Apply copper-based bactericides. Remove and destroy infected plant material. Use windbreaks.',
      prevention: 'Use disease-free nursery stock. Practice windbreak planting. Apply preventive copper sprays. Disinfect tools.',
    },
    {
      name: 'Physiological Fruit Drop',
      type: 'physiological',
      symptoms: {
        fruit_nut: ['fruit drop', 'premature fruit fall'],
        environmental_stress: ['water stress', 'heat stress', 'nutrient stress'],
      },
      relevantStages: ['flowering', 'fruiting'],
      treatment: 'Maintain consistent irrigation. Apply balanced fertilizer. Ensure adequate pollination.',
      prevention: 'Proper irrigation management. Balanced nutrition. Maintain tree health. Wind protection.',
    },
  ],
  coconut: [
    {
      name: 'Coconut Lethal Yellowing',
      type: 'disease',
      pathogen: 'Coconut lethal yellowing phytoplasma',
      symptoms: {
        fruit_nut: ['premature nut fall', 'nut fall'],
        leaf: ['frond yellowing', 'frond necrosis', 'leaf yellowing'],
        flower: ['inflorescence blackening'],
        general: ['palm decline', 'crown rot', 'death'],
      },
      relevantStages: ['flowering', 'fruiting'],
      treatment: 'Remove infected palms. Apply oxytetracycline injections. Control planthopper vectors.',
      prevention: 'Plant resistant varieties. Maintain field sanitation. Control planthoppers.',
    },
    {
      name: 'Coconut Mite',
      type: 'pest',
      symptoms: {
        fruit_nut: ['nut damage', 'nut scarring', 'premature nut fall', 'nut deformation'],
        general: ['reduced yield', 'poor nut quality'],
      },
      relevantStages: ['fruiting'],
      treatment: 'Apply acaricides or neem-based sprays. Use biological control (predatory mites). Remove affected nuts.',
      prevention: 'Monitor mite populations regularly. Maintain tree health. Encourage natural predators.',
    },
  ],
  cashew: [
    {
      name: 'Cashew Powdery Mildew',
      type: 'disease',
      pathogen: 'Oidium anacardii',
      symptoms: {
        leaf: ['white powdery growth', 'leaf curling', 'leaf distortion'],
        flower: ['inflorescence blight', 'flower distortion', 'flower drop'],
        fruit_nut: ['nut drop', 'apple damage'],
      },
      relevantStages: ['flowering', 'fruiting'],
      treatment: 'Apply sulphur-based fungicides during flowering. Prune affected branches.',
      prevention: 'Plant resistant varieties. Prune for open canopy. Avoid dense planting.',
    },
    {
      name: 'Cashew Mosquito Bug',
      type: 'pest',
      symptoms: {
        leaf: ['leaf wilting', 'leaf necrosis'],
        flower: ['flower blight', 'flower drop'],
        fruit_nut: ['nut fall', 'apple damage'],
        general: ['reduced yield'],
      },
      relevantStages: ['flowering', 'fruiting'],
      treatment: 'Apply neem-based insecticides during flowering. Remove affected branches. Maintain tree health.',
      prevention: 'Prune for open canopy. Maintain orchard sanitation. Monitor pest populations during flowering.',
    },
  ],
  macadamia: [
    {
      name: 'Macadamia Husk Spot',
      type: 'disease',
      pathogen: 'Pseudocercospora macadamiae',
      symptoms: {
        fruit_nut: ['dark sunken husk spots', 'premature nut drop', 'nut discoloration', 'husk lesions'],
        leaf: ['leaf spots'],
      },
      relevantStages: ['fruiting'],
      treatment: 'Apply copper fungicides during nut development. Remove fallen nuts. Prune for air circulation.',
      prevention: 'Plant resistant varieties. Practice orchard sanitation. Prune for open canopy.',
    },
    {
      name: 'Macadamia Nut Borer',
      type: 'pest',
      symptoms: {
        fruit_nut: ['nut damage', 'bore holes in nuts', 'premature nut drop', 'kernel damage'],
        general: ['reduced yield', 'poor nut quality'],
      },
      relevantStages: ['fruiting'],
      treatment: 'Use pheromone traps for monitoring. Apply neem-based insecticides. Remove and destroy fallen nuts.',
      prevention: 'Practice orchard sanitation. Harvest ripe nuts promptly. Use pheromone trapping. Maintain tree health.',
    },
  ],
  sesame: [
    {
      name: 'Sesame Bacterial Leaf Spot',
      type: 'disease',
      pathogen: 'Xanthomonas campestris pv. sesami',
      symptoms: {
        leaf: ['water-soaked angular lesions', 'brown spots', 'leaf necrosis', 'leaf spots'],
        stem_root: ['stem lesions'],
        fruit_nut: ['capsule rot'],
        general: ['defoliation'],
      },
      relevantStages: ['vegetative', 'flowering'],
      treatment: 'Apply copper-based bactericides. Remove infected debris. Use disease-free seed.',
      prevention: 'Use certified seed. Practice crop rotation. Remove crop residues after harvest.',
    },
    {
      name: 'Sesame Phyllody',
      type: 'disease',
      pathogen: 'Phytoplasma',
      symptoms: {
        flower: ['flower modification', 'phyllody', 'green flowers', 'sterile flowers'],
        general: ['reduced yield', 'plant stunting'],
      },
      relevantStages: ['flowering'],
      treatment: 'Remove infected plants. Control leafhopper vectors. Use disease-free seed.',
      prevention: 'Control leafhopper vectors. Practice crop rotation. Remove weed hosts. Use resistant varieties.',
    },
  ],
  cabbage: [
    {
      name: 'Cabbage Black Rot',
      type: 'disease',
      pathogen: 'Xanthomonas campestris pv. campestris',
      symptoms: {
        leaf: ['V-shaped yellow lesions', 'blackened veins', 'leaf yellowing', 'leaf wilting', 'leaf necrosis'],
        general: ['stunted growth', 'head rot'],
      },
      relevantStages: ['vegetative', 'flowering'],
      treatment: 'Remove infected plants. Apply copper bactericides. Disinfect farm tools.',
      prevention: 'Use certified seeds. Practice crop rotation. Avoid overhead irrigation.',
    },
    {
      name: 'Cabbage Aphid',
      type: 'pest',
      symptoms: {
        leaf: ['curled leaves', 'sticky leaves', 'white waxy coating', 'leaf distortion'],
        general: ['stunted growth', 'poor head formation'],
      },
      relevantStages: ['seedling', 'vegetative'],
      treatment: 'Apply neem-based insecticides or insecticidal soap. Use strong water spray to dislodge aphids.',
      prevention: 'Use row covers. Encourage natural enemies. Practice crop rotation. Remove crop residues.',
    },
  ],
  spinach: [
    {
      name: 'Spinach Downy Mildew',
      type: 'disease',
      pathogen: 'Peronospora farinosa f. sp. spinaciae',
      symptoms: {
        leaf: ['yellow patches', 'purple-gray fuzzy growth', 'leaf curling', 'leaf spots', 'leaf drop'],
        general: ['stunted growth'],
      },
      relevantStages: ['vegetative'],
      treatment: 'Apply metalaxyl or mancozeb. Remove infected leaves. Improve air circulation.',
      prevention: 'Use resistant varieties. Practice crop rotation. Avoid overhead irrigation.',
    },
    {
      name: 'Spinach Leaf Miner',
      type: 'pest',
      symptoms: {
        leaf: ['leaf mining tunnels', 'white trails', 'leaf damage', 'leaf necrosis'],
        general: ['reduced growth', 'poor quality'],
      },
      relevantStages: ['vegetative'],
      treatment: 'Remove and destroy affected leaves. Apply neem-based insecticides. Use row covers.',
      prevention: 'Use row covers. Practice crop rotation. Remove crop residues. Encourage natural enemies.',
    },
  ],
  carrot: [
    {
      name: 'Carrot Alternaria Leaf Blight',
      type: 'disease',
      pathogen: 'Alternaria dauci',
      symptoms: {
        leaf: ['dark brown lesions', 'yellow halos', 'leaf blight', 'leaf necrosis', 'leaf dieback'],
        general: ['reduced yield', 'poor root development'],
      },
      relevantStages: ['vegetative'],
      treatment: 'Apply chlorothalonil or azoxystrobin. Remove infected debris. Practice crop rotation.',
      prevention: 'Use disease-free seed. Practice crop rotation. Remove crop residues.',
    },
    {
      name: 'Carrot Root Knot Nematodes',
      type: 'pest',
      symptoms: {
        stem_root: ['root galls', 'forked roots', 'root damage', 'stunted roots'],
        general: ['reduced yield', 'poor quality roots', 'stunted growth'],
      },
      relevantStages: ['vegetative', 'fruiting'],
      treatment: 'Practice soil solarization. Apply neem cake to soil. Use biofumigation with mustard cover crops.',
      prevention: 'Practice crop rotation with non-host crops. Use resistant varieties. Maintain soil organic matter.',
    },
  ],
  watermelon: [
    {
      name: 'Watermelon Anthracnose',
      type: 'disease',
      pathogen: 'Colletotrichum orbiculare',
      symptoms: {
        leaf: ['leaf spots', 'leaf blight'],
        fruit_nut: ['circular sunken fruit lesions', 'pink spore masses', 'fruit rot'],
        general: ['vine collapse'],
      },
      relevantStages: ['vegetative', 'fruiting'],
      treatment: 'Apply chlorothalonil or mancozeb. Remove infected fruits. Practice crop rotation.',
      prevention: 'Use disease-free seed. Practice crop rotation. Plant resistant varieties.',
    },
    {
      name: 'Watermelon Powdery Mildew',
      type: 'disease',
      pathogen: 'Podosphaera xanthii',
      symptoms: {
        leaf: ['white powdery coating', 'leaf yellowing', 'leaf necrosis', 'leaf curling'],
        general: ['reduced yield', 'poor fruit quality', 'vine decline'],
      },
      relevantStages: ['vegetative', 'flowering', 'fruiting'],
      treatment: 'Apply sulphur-based or triazole fungicides. Improve air circulation. Avoid overhead irrigation.',
      prevention: 'Use resistant varieties. Maintain proper spacing. Practice crop rotation. Avoid excessive nitrogen.',
    },
  ],
  pawpaw: [
    {
      name: 'Papaya Ringspot Virus',
      type: 'disease',
      pathogen: 'Papaya ringspot virus (PRSV)',
      symptoms: {
        leaf: ['leaf mosaic', 'leaf distortion', 'leaf curling'],
        fruit_nut: ['ringspots on fruit', 'fruit deformation', 'fruit spots'],
        general: ['stunted tree', 'reduced yield'],
      },
      relevantStages: ['vegetative', 'flowering', 'fruiting'],
      treatment: 'Remove infected trees immediately. Control aphid vectors. Plant away from infected areas.',
      prevention: 'Plant certified virus-free seedlings. Control aphid populations. Remove alternative hosts.',
    },
    {
      name: 'Papaya Anthracnose',
      type: 'disease',
      pathogen: 'Colletotrichum gloeosporioides',
      symptoms: {
        fruit_nut: ['sunken fruit lesions', 'fruit rot', 'circular spots', 'spore masses'],
        leaf: ['leaf spots', 'leaf necrosis'],
      },
      relevantStages: ['fruiting'],
      treatment: 'Apply copper-based fungicides during fruit development. Remove infected fruits. Prune for air circulation.',
      prevention: 'Practice orchard sanitation. Prune for open canopy. Apply preventive fungicides during fruit development.',
    },
  ],
};

const STRESS_CONDITIONS: ConditionEntry[] = [
  {
    name: 'Water Stress (Drought/Overwatering)',
    type: 'stress',
    symptoms: {
      leaf: ['wilting', 'leaf curling', 'leaf drop', 'leaf yellowing'],
      environmental_stress: ['water stress', 'drought', 'overwatering', 'waterlogging'],
      general: ['stunted growth', 'reduced yield'],
    },
    relevantStages: ['seedling', 'vegetative', 'flowering', 'fruiting'],
    treatment: 'For drought: irrigate consistently, apply mulch. For waterlogging: improve drainage, reduce irrigation frequency.',
    prevention: 'Maintain consistent soil moisture. Use mulch. Ensure proper drainage. Adjust irrigation based on rainfall.',
  },
  {
    name: 'Heat Stress',
    type: 'stress',
    symptoms: {
      leaf: ['leaf scorch', 'leaf sunburn', 'marginal burn', 'wilting', 'leaf drop'],
      flower: ['flower drop', 'blossom drop'],
      fruit_nut: ['fruit sunburn', 'fruit drop'],
      environmental_stress: ['heat stress', 'high temperature', 'sunscald'],
    },
    relevantStages: ['vegetative', 'flowering', 'fruiting'],
    treatment: 'Provide shade during peak heat. Increase irrigation frequency. Apply mulch to cool soil.',
    prevention: 'Plant at appropriate season. Use shade nets for sensitive crops. Maintain soil moisture.',
  },
  {
    name: 'Nutrient Deficiency (General)',
    type: 'nutrient_deficiency',
    symptoms: {
      leaf: ['leaf yellowing', 'chlorosis', 'pale leaves', 'discolored leaves'],
      general: ['stunted growth', 'poor yield', 'slow growth'],
    },
    relevantStages: ['seedling', 'vegetative', 'flowering', 'fruiting'],
    treatment: 'Apply balanced fertilizer based on suspected deficiency. Foliar feed with micronutrients for rapid correction.',
    prevention: 'Regular soil testing. Apply balanced fertilization program. Use organic matter to improve nutrient availability.',
  },
];

function findCropConditions(cropType: string): ConditionEntry[] {
  const lower = cropType.toLowerCase().trim();
  const specific = CROP_CONDITIONS[lower];
  if (specific) {
    return [...specific, ...STRESS_CONDITIONS];
  }

  const matched = Object.entries(CROP_CONDITIONS).find(([key]) =>
    lower.includes(key) || key.includes(lower)
  );
  if (matched) {
    return [...matched[1], ...STRESS_CONDITIONS];
  }

  return STRESS_CONDITIONS;
}

function filterByGrowthStage(conditions: ConditionEntry[], stage: GrowthStage): ConditionEntry[] {
  if (stage === 'unknown') return conditions;
  return conditions.filter(c =>
    c.relevantStages.includes(stage) || c.relevantStages.length === 0
  );
}

export function diagnose(options: {
  cropType: string;
  symptoms: string;
  growthStage?: GrowthStage;
}): DiagnosisResult {
  const growthStage = options.growthStage ?? 'unknown';
  const categorized = categorizeSymptoms(options.symptoms);
  const allConditions = findCropConditions(options.cropType);
  const relevantConditions = filterByGrowthStage(allConditions, growthStage);

  const scored = relevantConditions
    .map(c => ({
      condition: c,
      ...scoreCondition(c, categorized, growthStage),
    }))
    .filter(s => s.score > 0.05)
    .sort((a, b) => b.score - a.score);

  const topScore = scored[0]?.score ?? 0;
  const topMatched = scored[0]?.matchedSymptoms.length ?? 0;
  const totalCondSymptoms = scored[0]?.condition
    ? Object.values(scored[0].condition.symptoms).reduce((sum, arr) => sum + (arr?.length ?? 0), 0)
    : 0;

  const possibleCauses: PossibleCause[] = scored.slice(0, 5).map(s => ({
    name: s.condition.name,
    type: s.condition.type,
    pathogen: s.condition.pathogen,
    likelihood: confidenceLevel(s.score, totalCondSymptoms, s.matchedSymptoms.length),
    confidence: Math.round(s.score * 1000) / 1000,
    treatment: s.condition.treatment,
    prevention: s.condition.prevention,
  }));

  let primaryDiagnosis: PossibleCause | undefined;
  if (possibleCauses.length > 0 && possibleCauses[0].confidence >= 0.20) {
    primaryDiagnosis = possibleCauses[0];
  }

  const uncertainty = determineUncertainty(
    topScore,
    topMatched,
    scored.length,
    growthStage,
  );

  const capConfidence = (conf: number, matchedCount: number): number => {
    if (matchedCount < 1) return Math.min(conf, 0.20);
    if (matchedCount < 2) return Math.min(conf, 0.45);
    if (matchedCount < 3) return Math.min(conf, 0.65);
    if (matchedCount < 5) return Math.min(conf, 0.80);
    return Math.min(conf, 0.95);
  };

  if (primaryDiagnosis) {
    const capped = capConfidence(primaryDiagnosis.confidence, topMatched);
    primaryDiagnosis.confidence = capped;
    primaryDiagnosis.likelihood = confidenceLevel(capped, totalCondSymptoms, topMatched);
  }

  for (const pc of possibleCauses) {
    const capped = capConfidence(pc.confidence, scored.find(s => s.condition.name === pc.name)?.matchedSymptoms.length ?? 0);
    pc.confidence = capped;
    pc.likelihood = confidenceLevel(capped, totalCondSymptoms, scored.find(s => s.condition.name === pc.name)?.matchedSymptoms.length ?? 0);
  }

  const confidenceRange: { min: number; max: number } = {
    min: possibleCauses.length > 0 ? Math.min(...possibleCauses.map(p => p.confidence)) : 0,
    max: primaryDiagnosis?.confidence ?? 0,
  };

  const reasoning = buildReasoning(
    primaryDiagnosis,
    possibleCauses,
    categorized,
    growthStage,
    uncertainty.level,
  );

  return {
    primaryDiagnosis,
    possibleCauses,
    confidenceRange,
    reasoning,
    symptomCategories: categorized.categories,
    growthStage,
    uncertaintyLevel: uncertainty.level,
    requestMoreInfo: uncertainty.requestMoreInfo,
    missingInfo: uncertainty.missingInfo,
  };
}

export function getCropExists(cropType: string): boolean {
  const lower = cropType.toLowerCase().trim();
  return !!CROP_CONDITIONS[lower] || Object.keys(CROP_CONDITIONS).some(k =>
    lower.includes(k) || k.includes(lower)
  );
}

export const KNOWN_CROPS = Object.keys(CROP_CONDITIONS);

export const GROWTH_STAGES: { value: GrowthStage; label: string }[] = [
  { value: 'seedling', label: 'Seedling' },
  { value: 'vegetative', label: 'Vegetative' },
  { value: 'flowering', label: 'Flowering' },
  { value: 'fruiting', label: 'Fruiting' },
];
