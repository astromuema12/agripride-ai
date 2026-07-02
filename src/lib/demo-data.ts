import { Farm, Crop, DiseaseReport, Recommendation, WeatherData, WeatherForecast, MarketPrice, SustainabilityScore, Notification, AuditLog, YieldRecord, ConsentRecord, User, UserRole, Animal, VaccinationRecord, HealthRecord, MilkProduction, BreedingRecord, FeedRecord, LivestockCategory, AnimalGender, HealthStatus, VaccinationStatus } from '@/types';

const cropTypes = ['Maize', 'Wheat', 'Rice', 'Cassava', 'Sorghum', 'Millet', 'Beans', 'Coffee', 'Tea', 'Cotton', 'Groundnuts', 'Sweet Potatoes', 'Yams', 'Plantains', 'Vegetables'];
const regions = ['Rift Valley', 'Central', 'Coastal', 'Eastern', 'Western', 'Nyanza', 'North Eastern'];
const soilTypes = ['Loamy', 'Sandy', 'Clay', 'Silt', 'Peaty', 'Chalky', 'Laterite'];
const diseases = [
  { disease: 'Northern Leaf Blight', risk: 'high', treatment: 'Apply fungicide containing triazole or strobilurin. Remove infected leaves.' },
  { disease: 'Fall Armyworm', risk: 'critical', treatment: 'Use neem oil extract or Bacillus thuringiensis. Introduce natural predators.' },
  { disease: 'Cassava Mosaic Virus', risk: 'high', treatment: 'Remove and destroy infected plants. Use resistant varieties.' },
  { disease: 'Wheat Rust', risk: 'medium', treatment: 'Apply sulfur-based fungicides. Practice crop rotation.' },
  { disease: 'Coffee Berry Disease', risk: 'high', treatment: 'Apply copper-based fungicides. Improve air circulation.' },
  { disease: 'Bacterial Wilt', risk: 'critical', treatment: 'Remove infected plants. Solarize soil. Practice crop rotation.' },
  { disease: 'Powdery Mildew', risk: 'medium', treatment: 'Apply sulfur spray or neem oil. Improve air flow.' },
  { disease: 'Downy Mildew', risk: 'medium', treatment: 'Apply copper-based fungicides. Avoid overhead irrigation.' },
];

const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Heavy Rain', 'Thunderstorms', 'Clear', 'Windy', 'Foggy'];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomDate(start: Date, end: Date): string {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString();
}

export function generateFarms(count: number, userIds: string[]): Farm[] {
  const farms: Farm[] = [];
  for (let i = 0; i < count; i++) {
    farms.push({
      id: `farm-${i + 1}`,
      user_id: userIds[Math.floor(Math.random() * userIds.length)],
      name: `${randomItem(['Green Acres', 'Sunrise', 'Golden', 'Harvest', 'Valley', 'Highland', 'Royal', 'Prime', 'Blessed', 'Victory'])} Farm ${i + 1}`,
      location: `${randomItem(regions)} Region, ${randomItem(['Kenya', 'Uganda', 'Tanzania', 'Rwanda', 'Ethiopia'])}`,
      size_acres: randomFloat(1, 50),
      soil_type: randomItem(soilTypes),
      crops_grown: [randomItem(cropTypes), randomItem(cropTypes)],
      created_at: randomDate(new Date('2024-01-01'), new Date('2025-06-01')),
      updated_at: randomDate(new Date('2025-01-01'), new Date('2026-06-01')),
      status: Math.random() > 0.1 ? 'active' : 'archived',
    });
  }
  return farms;
}

export function generateCrops(count: number, farmIds: string[]): Crop[] {
  const crops: Crop[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const planted = randomDate(new Date('2025-01-01'), new Date('2026-05-01'));
    const harvested = Math.random() > 0.4 ? randomDate(new Date(planted), now) : undefined;
    const status = harvested ? 'harvested' : Math.random() > 0.1 ? 'growing' : 'failed';
    crops.push({
      id: `crop-${i + 1}`,
      farm_id: randomItem(farmIds),
      name: randomItem(cropTypes),
      variety: `Variety ${String.fromCharCode(65 + randomInt(0, 5))}${randomInt(1, 99)}`,
      planting_date: planted,
      harvest_date: harvested,
      area_acres: randomFloat(0.5, 20),
      status,
      expected_yield_kg: randomFloat(500, 5000),
      actual_yield_kg: status === 'harvested' ? randomFloat(400, 4500) : undefined,
      created_at: planted,
    });
  }
  return crops;
}

export function generateDiseaseReports(count: number, farmIds: string[], cropIds: string[], userIds: string[]): DiseaseReport[] {
  const reports: DiseaseReport[] = [];
  for (let i = 0; i < count; i++) {
    const disease = randomItem(diseases);
    reports.push({
      id: `disease-${i + 1}`,
      farm_id: randomItem(farmIds),
      crop_id: randomItem(cropIds),
      user_id: randomItem(userIds),
      crop_type: randomItem(cropTypes),
      symptoms: `Yellowing leaves, stunted growth, ${randomItem(['spots on leaves', 'wilting', 'rotting stems', 'discoloration'])}`,
      disease_prediction: disease.disease,
      confidence_score: randomFloat(0.65, 0.98),
      risk_level: disease.risk as 'low' | 'medium' | 'high' | 'critical',
      treatment: disease.treatment,
      prevention: `Practice crop rotation. Use disease-resistant varieties. Ensure proper spacing. Maintain field hygiene.`,
      explanation: `Based on analysis of symptoms and crop type, the most likely diagnosis is ${disease.disease}. The confidence score reflects the strength of pattern matching against known disease profiles.`,
      status: randomItem(['submitted', 'reviewed', 'resolved']) as 'submitted' | 'reviewed' | 'resolved',
      created_at: randomDate(new Date('2025-06-01'), new Date('2026-06-01')),
      reviewed_at: Math.random() > 0.3 ? randomDate(new Date('2025-07-01'), new Date('2026-06-01')) : undefined,
      reviewed_by: Math.random() > 0.3 ? `user-${randomInt(1, 5)}` : undefined,
    });
  }
  return reports;
}

export function generateWeatherData(locations: string[]): WeatherData[] {
  return locations.map((location, i) => {
    const forecasts: WeatherForecast[] = [];
    const today = new Date();
    for (let d = 0; d < 7; d++) {
      const date = new Date(today);
      date.setDate(date.getDate() + d);
      forecasts.push({
        date: date.toISOString().split('T')[0],
        temp_high: randomInt(22, 35),
        temp_low: randomInt(12, 20),
        condition: randomItem(conditions),
        rainfall_chance: randomInt(0, 90),
      });
    }
    return {
      id: `weather-${i + 1}`,
      location,
      temperature: randomInt(18, 32),
      humidity: randomInt(40, 90),
      rainfall_mm: randomFloat(0, 15),
      wind_speed: randomFloat(2, 25),
      condition: randomItem(conditions),
      forecast: forecasts,
      recorded_at: new Date().toISOString(),
    };
  });
}

export function generateMarketPrices(): MarketPrice[] {
  return cropTypes.slice(0, 10).map((crop, i) => ({
    id: `price-${i + 1}`,
    crop,
    region: randomItem(regions),
    price_per_kg: randomFloat(30, 500),
    currency: 'KES',
    trend: randomItem(['up', 'down', 'stable']) as 'up' | 'down' | 'stable',
    recorded_at: new Date().toISOString(),
  }));
}

export function generateSustainabilityScores(farmIds: string[]): SustainabilityScore[] {
  return farmIds.slice(0, 20).map((farmId) => ({
    id: `sustain-${farmId}`,
    farm_id: farmId,
    soil_health: randomFloat(0.4, 0.95),
    water_usage: randomFloat(0.3, 0.9),
    biodiversity: randomFloat(0.3, 0.85),
    carbon_footprint: randomFloat(0.2, 0.8),
    overall_score: randomFloat(0.4, 0.9),
    recorded_at: new Date().toISOString(),
  }));
}

export function generateNotifications(userIds: string[]): Notification[] {
  return Array.from({ length: 20 }, (_, i) => ({
    id: `notif-${i + 1}`,
    user_id: randomItem(userIds),
    type: randomItem(['weather_alert', 'disease_alert', 'recommendation', 'system']) as Notification['type'],
    title: randomItem([
      'Heavy Rainfall Warning',
      'Disease Outbreak Alert',
      'New AI Recommendation Available',
      'Farm Report Ready',
      'Sustainability Score Updated',
      'Market Price Alert',
      'Crop Advisory Update',
      'System Maintenance Notice',
    ]),
    message: `This is an automated notification regarding your agricultural activities.`,
    is_read: Math.random() > 0.5,
    created_at: randomDate(new Date('2026-05-01'), new Date('2026-06-01')),
  }));
}

export function generateAuditLogs(userIds: string[]): AuditLog[] {
  const actions = ['login', 'logout', 'create_farm', 'update_farm', 'delete_farm', 'create_crop', 'disease_report', 'ai_recommendation', 'view_report', 'export_data'];
  const resources = ['auth', 'farms', 'crops', 'disease_reports', 'recommendations', 'weather', 'users', 'settings'];
  return Array.from({ length: 30 }, (_, i) => ({
    id: `audit-${i + 1}`,
    user_id: randomItem(userIds),
    action: randomItem(actions),
    resource: randomItem(resources),
    resource_id: `res-${randomInt(1, 100)}`,
    details: { method: randomItem(['GET', 'POST', 'PUT', 'DELETE']), timestamp: new Date().toISOString() },
    ip_address: `192.168.${randomInt(1, 255)}.${randomInt(1, 255)}`,
    created_at: randomDate(new Date('2026-05-01'), new Date('2026-06-01')),
  }));
}

export function generateYieldRecords(farmIds: string[], cropIds: string[]): YieldRecord[] {
  return Array.from({ length: 50 }, (_, i) => ({
    id: `yield-${i + 1}`,
    farm_id: randomItem(farmIds),
    crop_id: randomItem(cropIds),
    harvest_date: randomDate(new Date('2025-01-01'), new Date('2026-06-01')),
    yield_kg: randomFloat(200, 5000),
    area_acres: randomFloat(0.5, 15),
    quality_rating: randomInt(1, 5),
    notes: randomItem(['Good harvest', 'Fair quality', 'Excellent yield', 'Affected by drought', 'Average production']),
    created_at: randomDate(new Date('2025-01-01'), new Date('2026-06-01')),
  }));
}

export function generateUsers(count: number): User[] {
  const admins: User[] = [
    { id: 'demo-user-1', name: 'Admin User', email: 'admin@agripride.ai', role: 'admin', created_at: randomDate(new Date('2024-01-01'), new Date('2025-06-01')), updated_at: randomDate(new Date('2025-01-01'), new Date('2026-06-01')), is_suspended: false },
    { id: 'demo-user-2', name: 'Officer User', email: 'officer@agripride.ai', role: 'officer', created_at: randomDate(new Date('2024-01-01'), new Date('2025-06-01')), updated_at: randomDate(new Date('2025-01-01'), new Date('2026-06-01')), is_suspended: false },
  ];
  const users = [...admins];
  for (let i = 3; i <= count; i++) {
    const isOfficer = i <= 10;
    const isSuspended = Math.random() > 0.98;
    users.push({
      id: `demo-user-${i}`,
      email: isOfficer ? `officer${i}@agripride.ai` : `farmer${i}@agripride.ai`,
      name: isOfficer ? `Officer ${i}` : `Farmer ${i}`,
      role: isOfficer ? 'officer' : 'farmer',
      created_at: randomDate(new Date('2024-01-01'), new Date('2025-06-01')),
      updated_at: randomDate(new Date('2025-01-01'), new Date('2026-06-01')),
      is_suspended: isSuspended,
    });
  }
  return users;
}

export const demoUsers: User[] = Array.from({ length: 50 }, (_, i) => ({
  id: `demo-user-${i + 1}`,
  email: `farmer${i + 1}@agripride.ai`,
  name: `Farmer ${i + 1}`,
  role: (i < 5 ? (i === 0 ? 'admin' : i === 1 ? 'officer' : 'farmer') : 'farmer') as UserRole,
  created_at: randomDate(new Date('2024-01-01'), new Date('2025-06-01')),
  updated_at: randomDate(new Date('2025-01-01'), new Date('2026-06-01')),
  is_suspended: Math.random() > 0.95,
}));

export function generateRecommendations(userIds: string[]): Recommendation[] {
  const recs = [
    { type: 'crop_advisor', title: 'Optimal Planting Window', content: 'Based on current weather patterns and soil conditions, the optimal planting window for maize in your region is within the next 2 weeks. Soil temperature is favorable at 22°C with adequate moisture levels.' },
    { type: 'disease', title: 'Early Blight Prevention', content: 'Your tomato crops show early signs of blight risk. Apply preventative fungicide treatment. Ensure proper air circulation by maintaining 60cm spacing between plants.' },
    { type: 'weather', title: 'Upcoming Dry Spell', content: 'Weather models indicate a dry spell in your region starting next week. Consider adjusting irrigation schedules to ensure adequate water supply during this period.' },
    { type: 'general', title: 'Soil Health Improvement', content: 'Your soil analysis shows low nitrogen levels. Consider planting legumes as cover crops this season to naturally fix nitrogen and improve soil fertility.' },
    { type: 'crop_advisor', title: 'Fertilizer Recommendation', content: 'Apply DAP fertilizer at a rate of 100kg per acre for your maize crop. Split application: half at planting, half at 6 weeks after emergence.' },
    { type: 'crop_advisor', title: 'Pest Management Strategy', content: 'Monitor for fall armyworm daily. Set up pheromone traps at 5 per acre. If infestation exceeds 20%, apply recommended biopesticides.' },
  ];
  return recs.map((rec, i) => ({
    id: `rec-${i + 1}`,
    user_id: randomItem(userIds),
    type: rec.type as Recommendation['type'],
    title: rec.title,
    content: rec.content,
    source_data: { model: 'AgriPride-AI-v2', region: randomItem(regions), timestamp: new Date().toISOString() },
    confidence_score: randomFloat(0.75, 0.99),
    responsible_agent: randomItem(['Crop Advisor', 'Disease Diagnostic', 'Weather Intelligence']),
    frameworks_used: randomItem([['AIM', 'MAP'], ['TRACK', 'RANK'], ['OASIS', 'TRAIL'], ['AIM', 'TRACK', 'OASIS']]),
    is_read: Math.random() > 0.6,
    created_at: randomDate(new Date('2026-05-01'), new Date('2026-06-01')),
  }));
}

export function generateConsentRecords(userIds: string[]): ConsentRecord[] {
  const types: ConsentRecord['type'][] = ['data_collection', 'ai_processing', 'disease_diagnosis', 'weather_monitoring'];
  return userIds.slice(0, 30).flatMap((uid) =>
    types.map((type) => ({
      id: `consent-${uid}-${type}`,
      user_id: uid,
      type,
      granted: true,
      granted_at: randomDate(new Date('2025-01-01'), new Date('2026-01-01')),
      revoked_at: Math.random() > 0.9 ? randomDate(new Date('2026-01-01'), new Date('2026-06-01')) : undefined,
    }))
  );
}

// ─── Livestock Data Generators ────────────────────────────

const livestockCategories: LivestockCategory[] = ['dairy_cattle', 'beef_cattle', 'goat', 'sheep', 'poultry_layer', 'poultry_broiler', 'pig'];
const cattleBreeds = ['Friesian', 'Ayrshire', 'Jersey', 'Guernsey', 'Sahiwal', 'Boran', 'Zebu', 'Hereford', 'Charolais', 'Angus'];
const goatBreeds = ['Saanen', 'Toggenburg', 'Alpine', 'Gall', 'Small East African', 'Boer', 'Kenya Alpine'];
const sheepBreeds = ['Dorper', 'Red Maasai', 'Merino', 'Hampshire Down', 'Corriedale', 'Blackhead Persian'];
const poultryBreeds = ['Isa Brown', 'Hy-Line', 'Rhode Island Red', 'Kenbro', 'Kuroiler', 'Sasso', 'Cobb 500', 'Ross 308'];
const pigBreeds = ['Large White', 'Landrace', 'Duroc', 'Hampshire', 'Pietrain', 'Saddleback'];
const vaccineNames: Record<LivestockCategory, string[]> = {
  dairy_cattle: ['Anthrax', 'Black Quarter', 'Brucellosis (RB51)', 'Foot & Mouth Disease', 'Lumpy Skin Disease', 'East Coast Fever', 'Rift Valley Fever', 'Rabies'],
  beef_cattle: ['Anthrax', 'Black Quarter', 'Foot & Mouth Disease', 'Lumpy Skin Disease', 'Rabies', 'Brucellosis'],
  goat: ['PPR (Goat Plague)', 'Anthrax', 'Enterotoxaemia', 'Orf', 'Goat Pox', 'Contagious Caprine Pleuropneumonia'],
  sheep: ['PPR', 'Anthrax', 'Blackleg', 'Enterotoxaemia', 'Sheep Pox', 'Rift Valley Fever', 'Ovine Brucellosis'],
  poultry_layer: ['Newcastle Disease', 'Infectious Bursal Disease (Gumboro)', 'Fowl Pox', 'Fowl Typhoid', 'Avian Influenza', 'Marek\'s Disease', 'Coccidiosis'],
  poultry_broiler: ['Newcastle Disease', 'Infectious Bursal Disease', 'Fowl Pox', 'Avian Influenza', 'Coccidiosis'],
  pig: ['Classical Swine Fever', 'African Swine Fever', 'Foot & Mouth Disease', 'Porcine Reproductive & Respiratory Syndrome', 'Swine Erysipelas', 'Porcine Circovirus'],
  bee: ['European Foulbrood', 'American Foulbrood', 'Nosema', 'Varroa Mite Treatment', 'Chalkbrood'],
  fish: ['Columnaris', 'Furunculosis', 'Vibriosis', 'Ich (White Spot)', 'Costia', 'Trichodina'],
};

const healthConditions: Record<LivestockCategory, string[]> = {
  dairy_cattle: ['Mastitis', 'Lameness', 'Ketosis', 'Milk Fever', 'Bloat', 'Respiratory Infection', 'Foot Rot', 'Coccidiosis', 'Worm Infestation', 'Eye Infection'],
  beef_cattle: ['Bloat', 'Foot Rot', 'Respiratory Infection', 'Pink Eye', 'Anthrax', 'Blackleg', 'Internal Parasites', 'External Parasites'],
  goat: ['Coccidiosis', 'Pneumonia', 'Enterotoxaemia', 'PPR', 'Orf', 'Internal Parasites', 'External Parasites', 'Caprine Arthritis Encephalitis'],
  sheep: ['Bloat', 'Foot Rot', 'Internal Parasites', 'Fly Strike', 'Pneumonia', 'Lambing Complications', 'Enterotoxaemia', 'Sore Mouth'],
  poultry_layer: ['Coccidiosis', 'Avian Influenza', 'Newcastle Disease', 'Fowl Cholera', 'Bumble Foot', 'Egg Binding', 'Prolapse', 'Respiratory Infection'],
  poultry_broiler: ['Coccidiosis', 'Avian Influenza', 'Newcastle Disease', 'Sudden Death Syndrome', 'Lameness', 'Ascites', 'Respiratory Infection'],
  pig: ['African Swine Fever', 'Classical Swine Fever', 'Foot Rot', 'Pneumonia', 'Swine Erysipelas', 'Porcine Stress Syndrome', 'Internal Parasites', 'Mastitis'],
  bee: ['Varroa Mite', 'American Foulbrood', 'European Foulbrood', 'Nosema', 'Chalkbrood', 'Small Hive Beetle'],
  fish: ['Columnaris', 'Furunculosis', 'Vibriosis', 'Saprolegnia', 'Ich', 'Costia', 'Trichodina', 'Gill Disease'],
};

const feedTypes: Record<LivestockCategory, string[]> = {
  dairy_cattle: ['Napier Grass', 'Rhodes Grass', 'Lucerne', 'Dairy Meal', 'Maize Silage', 'Mineral Block', 'Cotton Seed Cake', 'Wheat Bran'],
  beef_cattle: ['Napier Grass', 'Rhodes Grass', 'Maize Stover', 'Beef Concentrate', 'Molasses', 'Maize Silage', 'Mineral Block'],
  goat: ['Napier Grass', 'Lucerne', 'Goat Pellet', 'Dairy Meal', 'Mineral Block', 'Maize Bran', 'Sweet Potato Vines'],
  sheep: ['Rhodes Grass', 'Lucerne', 'Sheep Pellet', 'Mineral Block', 'Wheat Bran', 'Maize Stover'],
  poultry_layer: ['Layers Mash', 'Layers Pellets', 'Oyster Shells', 'Growers Mash', 'Chick Mash', 'Green Vegetables'],
  poultry_broiler: ['Broiler Starter', 'Broiler Finisher', 'Chick Mash', 'Broiler Concentrate'],
  pig: ['Pig Starter', 'Pig Grower', 'Pig Finisher', 'Maize Bran', 'Wheat Bran', 'Kitchen Waste', 'Soya Meal'],
  bee: ['Sugar Syrup', 'Pollen Substitute', 'Protein Patty'],
  fish: ['Fish Pellets (Floating)', 'Fish Pellets (Sinking)', 'Omena Meal'],
};

function generateLivestockTags(): string {
  const prefix = randomItem(['AP', 'AG', 'AH', 'AK']);
  return `${prefix}-${String(randomInt(100, 999))}`;
}

export function generateAnimals(count: number, farmIds: string[]): Animal[] {
  const animals: Animal[] = [];
  for (let i = 0; i < count; i++) {
    const category = randomItem(livestockCategories);
    const gender: AnimalGender = category === 'poultry_layer' ? 'female' : Math.random() > 0.3 ? 'female' : 'male';
    const breeds = category === 'dairy_cattle' || category === 'beef_cattle' ? cattleBreeds
      : category === 'goat' ? goatBreeds
      : category === 'sheep' ? sheepBreeds
      : category === 'poultry_layer' || category === 'poultry_broiler' ? poultryBreeds
      : pigBreeds;
    const birthDate = randomDate(new Date('2022-01-01'), new Date('2026-03-01'));
    const createdDate = randomDate(new Date(birthDate), new Date('2026-05-01'));
    const healthStatuses: HealthStatus[] = ['healthy', 'healthy', 'healthy', 'healthy', 'sick', 'recovering', 'critical'];
    animals.push({
      id: `animal-${i + 1}`,
      farm_id: randomItem(farmIds),
      user_id: 'demo-user-1',
      tag_number: generateLivestockTags(),
      name: Math.random() > 0.4 ? randomItem(['Bella', 'Daisy', 'Luna', 'Max', 'Stella', 'Milo', 'Charlie', 'Coco', 'Ruby', 'Zuri', 'Leo', 'Mpenzi', 'Simba', 'Jasiri', 'Peace']) : undefined,
      category,
      breed: randomItem(breeds),
      gender,
      birth_date: birthDate,
      acquisition_date: randomDate(new Date(birthDate), new Date('2026-03-01')),
      weight_kg: Math.random() > 0.1 ? randomFloat(15, 600, 1) : undefined,
      health_status: randomItem(healthStatuses),
      vaccination_status: randomItem(['up_to_date', 'overdue']) as VaccinationStatus,
      is_active: Math.random() > 0.1,
      created_at: createdDate,
      updated_at: randomDate(new Date(createdDate), new Date('2026-06-01')),
    });
  }
  return animals;
}

export function generateVaccinations(animals: Animal[]): VaccinationRecord[] {
  const records: VaccinationRecord[] = [];
  for (const animal of animals) {
    const vaccines = vaccineNames[animal.category] || [];
    const numVaccines = Math.min(vaccines.length, randomInt(2, 5));
    const selected = [...vaccines].sort(() => Math.random() - 0.5).slice(0, numVaccines);
    for (const vaccineName of selected) {
      const administered = randomDate(new Date('2025-01-01'), new Date('2026-06-01'));
      records.push({
        id: `vacc-${animal.id}-${records.length + 1}`,
        animal_id: animal.id,
        vaccine_name: vaccineName,
        batch_number: `BN-${randomInt(1000, 9999)}`,
        date_administered: administered,
        next_due_date: Math.random() > 0.2 ? randomDate(new Date(administered), new Date(Date.parse(administered) + 365 * 24 * 3600 * 1000)) : undefined,
        notes: Math.random() > 0.6 ? `Administered by ${randomItem(['Dr. Kamau', 'Dr. Wanjiku', 'Vet Officer', 'Community Vet'])}` : undefined,
        created_at: administered,
      });
    }
  }
  return records;
}

export function generateHealthRecords(animals: Animal[]): HealthRecord[] {
  const records: HealthRecord[] = [];
  for (const animal of animals.filter(() => Math.random() > 0.4)) {
    const conditions = healthConditions[animal.category] || ['General Check-up'];
    const numRecords = randomInt(0, 3);
    for (let i = 0; i < numRecords; i++) {
      const recordDate = randomDate(new Date('2025-06-01'), new Date('2026-06-01'));
      const condition = randomItem(conditions);
      records.push({
        id: `health-${animal.id}-${i + 1}`,
        animal_id: animal.id,
        date: recordDate,
        condition,
        symptoms: randomItem([`Loss of appetite, lethargy`, `Coughing, nasal discharge`, `Diarrhoea, dehydration`, `Lameness, swelling`, `Reduced milk yield`, `Weight loss, dull coat`]),
        diagnosis: `Clinical examination suggests ${condition.toLowerCase()}`,
        treatment: randomItem([`Antibiotic course 5 days`, `Deworming - Albendazole 10mg/kg`, `Anti-inflammatory medication`, `Supportive care + fluids`, `Topical treatment`]),
        veterinarian: randomItem(['Dr. Kamau', 'Dr. Wanjiku', 'Dr. Ochieng', 'Dr. Akinyi', 'Dr. Mutua']),
        cost_kes: randomInt(500, 8000),
        follow_up_date: Math.random() > 0.6 ? randomDate(new Date(recordDate), new Date(Date.parse(recordDate) + 30 * 24 * 3600 * 1000)) : undefined,
        outcome: randomItem(['recovered', 'recovered', 'ongoing', 'referred']),
        created_at: recordDate,
      });
    }
  }
  return records;
}

export function generateMilkProduction(animals: Animal[]): MilkProduction[] {
  const dairyAnimals = animals.filter(a => a.category === 'dairy_cattle' && a.gender === 'female' && a.health_status !== 'deceased');
  const records: MilkProduction[] = [];
  const startDate = new Date('2026-01-01');
  const endDate = new Date('2026-06-01');
  for (const animal of dairyAnimals) {
    const numDays = randomInt(10, 30);
    for (let d = 0; d < numDays; d++) {
      const date = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
      const morning = randomFloat(2, 12, 1);
      const evening = randomFloat(1.5, 8, 1);
      records.push({
        id: `milk-${animal.id}-${d + 1}`,
        animal_id: animal.id,
        date: date.toISOString().split('T')[0],
        morning_kg: morning,
        evening_kg: evening,
        total_kg: parseFloat((morning + evening).toFixed(1)),
        notes: Math.random() > 0.8 ? 'Normal production' : undefined,
        created_at: date.toISOString(),
      });
    }
  }
  return records;
}

export function generateBreedingRecords(animals: Animal[]): BreedingRecord[] {
  const femaleAnimals = animals.filter(a => a.gender === 'female' && a.health_status !== 'deceased');
  const records: BreedingRecord[] = [];
  for (const animal of femaleAnimals.slice(0, Math.floor(femaleAnimals.length * 0.6))) {
    if (Math.random() > 0.5) continue;
    const breedingDate = randomDate(new Date('2025-06-01'), new Date('2026-03-01'));
    const isAI = Math.random() > 0.4;
    const outcome = Math.random() > 0.7 ? 'successful' : 'pending';
    records.push({
      id: `breed-${animal.id}`,
      animal_id: animal.id,
      breeding_date: breedingDate,
      method: isAI ? 'artificial_insemination' : 'natural',
      sire_breed: isAI ? randomItem(cattleBreeds) : undefined,
      expected_delivery: outcome === 'successful' ? randomDate(new Date(breedingDate), new Date(Date.parse(breedingDate) + 285 * 24 * 3600 * 1000)) : undefined,
      delivery_date: outcome === 'successful' && Math.random() > 0.7 ? randomDate(new Date(breedingDate), new Date(Date.parse(breedingDate) + 290 * 24 * 3600 * 1000)) : undefined,
      offspring_count: outcome === 'successful' ? randomInt(1, 2) : undefined,
      outcome,
      notes: outcome === 'successful' ? 'Successful breeding' : 'Awaiting confirmation',
      created_at: breedingDate,
    });
  }
  return records;
}

export function generateFeedRecords(animals: Animal[]): FeedRecord[] {
  const records: FeedRecord[] = [];
  for (const animal of animals.filter(() => Math.random() > 0.3)) {
    const feeds = feedTypes[animal.category] || ['General Feed'];
    const numRecords = randomInt(2, 8);
    for (let i = 0; i < numRecords; i++) {
      records.push({
        id: `feed-${animal.id}-${i + 1}`,
        animal_id: animal.id,
        date: randomDate(new Date('2026-01-01'), new Date('2026-06-01')),
        feed_type: randomItem(feeds),
        quantity_kg: randomFloat(0.5, 25, 1),
        cost_kes: randomInt(100, 3000),
        notes: Math.random() > 0.7 ? `Purchased from ${randomItem(['Agrovet', 'KALRO', 'Feed Manufacturer', 'Local Supplier'])}` : undefined,
        created_at: randomDate(new Date('2026-01-01'), new Date('2026-06-01')),
      });
    }
  }
  return records;
}

export const DEMO_DATA_KEY = 'agripride_demo_data';
