import { Car, UserPreferences, UserBehavior, Recommendation } from './types';

// --- Scoring Algorithm ---
export function scoreCar(
  car: Car,
  prefs: UserPreferences,
  behavior: UserBehavior,
): { score: number; reasons: string[]; confidence: number } {
  let score = 0;
  let reasons: string[] = [];
  let confidence = 1;

  // Budget (25%)
  if (prefs.budget) {
    const budgetScore = Math.max(
      0,
      1 - Math.abs(car.price - prefs.budget) / prefs.budget,
    );
    score += budgetScore * 25;
    reasons.push(`Budget match: ${Math.round(budgetScore * 100)}%`);
  }

  // Body style (20%)
  if (prefs.preferredBodyStyles?.length) {
    const match = prefs.preferredBodyStyles.includes(car.bodyStyle);
    score += match ? 20 : 0;
    if (match) reasons.push('Preferred body style');
  }

  // Fuel efficiency (15%)
  if (prefs.minFuelEfficiency) {
    const feScore = car.fuelEfficiency >= prefs.minFuelEfficiency ? 1 : 0;
    score += feScore * 15;
    if (feScore) reasons.push('Meets fuel efficiency');
  }

  // Brand preference (15%)
  if (prefs.preferredBrands?.length) {
    const match = prefs.preferredBrands.includes(car.brand);
    score += match ? 15 : 0;
    if (match) reasons.push('Preferred brand');
  }

  // Feature requirements (15%)
  if (prefs.requiredFeatures?.length) {
    const matched = prefs.requiredFeatures.filter((f) =>
      car.features.includes(f),
    );
    const featScore = matched.length / prefs.requiredFeatures.length;
    score += featScore * 15;
    if (matched.length) reasons.push(`Features matched: ${matched.join(', ')}`);
  }

  // Safety rating (10%)
  if (prefs.minSafetyRating) {
    const safeScore = car.safetyRating >= prefs.minSafetyRating ? 1 : 0;
    score += safeScore * 10;
    if (safeScore) reasons.push('Meets safety rating');
  }

  // Confidence: more user data = higher confidence
  const behaviorWeight = Math.min(1, (behavior.carViews?.length || 0) / 10);
  confidence = 0.7 + 0.3 * behaviorWeight;

  return { score, reasons, confidence };
}

// --- User Behavior Tracking ---
export function trackCarView(carId: string, duration: number) {
  const key = 'carViews';
  const views = JSON.parse(localStorage.getItem(key) || '[]');
  views.push({ carId, duration, timestamp: Date.now() });
  localStorage.setItem(key, JSON.stringify(views));
}

export function trackFilterSelection(filter: string, value: string) {
  const key = 'filterSelections';
  const selections = JSON.parse(localStorage.getItem(key) || '[]');
  selections.push({ filter, value, timestamp: Date.now() });
  localStorage.setItem(key, JSON.stringify(selections));
}

export function trackComparisonSelection(carIds: string[]) {
  const key = 'comparisonSelections';
  const selections = JSON.parse(localStorage.getItem(key) || '[]');
  selections.push({ carIds, timestamp: Date.now() });
  localStorage.setItem(key, JSON.stringify(selections));
}

export function getUserBehavior(): UserBehavior {
  return {
    carViews: JSON.parse(localStorage.getItem('carViews') || '[]'),
    filterSelections: JSON.parse(
      localStorage.getItem('filterSelections') || '[]',
    ),
    comparisonSelections: JSON.parse(
      localStorage.getItem('comparisonSelections') || '[]',
    ),
  };
}

// --- Machine Learning (Simple Algorithms) ---
// Collaborative filtering (user-car similarity)
export function collaborativeFiltering(
  userPreferences: number[][],
  carFeatures: number[][],
): number[] {
  // Simple dot product similarity calculation
  const scores: number[] = [];

  for (let i = 0; i < carFeatures.length; i++) {
    let score = 0;
    for (let j = 0; j < userPreferences.length; j++) {
      // Calculate cosine similarity between user preferences and car features
      const userVec = userPreferences[j];
      const carVec = carFeatures[i];

      let dotProduct = 0;
      let userMag = 0;
      let carMag = 0;

      for (let k = 0; k < Math.min(userVec.length, carVec.length); k++) {
        dotProduct += userVec[k] * carVec[k];
        userMag += userVec[k] * userVec[k];
        carMag += carVec[k] * carVec[k];
      }

      const similarity =
        dotProduct / (Math.sqrt(userMag) * Math.sqrt(carMag) || 1);
      score += similarity;
    }
    scores.push(score / userPreferences.length);
  }

  return scores;
}

// Content-based filtering (car features)
export function contentBasedFiltering(
  cars: Car[],
  prefs: UserPreferences,
): number[] {
  return cars.map((car) => {
    let score = 0;
    if (prefs.preferredBodyStyles?.includes(car.bodyStyle)) score += 1;
    if (prefs.preferredBrands?.includes(car.brand)) score += 1;
    if (car.fuelEfficiency >= prefs.minFuelEfficiency) score += 1;
    if (car.safetyRating >= prefs.minSafetyRating) score += 1;
    return score;
  });
}

// Hybrid approach
export function getRecommendations(
  cars: Car[],
  prefs: UserPreferences,
  behavior: UserBehavior,
): Recommendation[] {
  // Score all cars
  const recs = cars.map((car) => {
    const { score, reasons, confidence } = scoreCar(car, prefs, behavior);
    return { car, score, reasons, confidence };
  });
  // Sort by score desc
  recs.sort((a, b) => b.score - a.score);
  return recs;
}

// --- Cold Start Quiz ---
export function getColdStartQuiz() {
  return [
    { question: 'What is your budget?', type: 'number', key: 'budget' },
    {
      question: 'Preferred body styles?',
      type: 'multi-select',
      key: 'preferredBodyStyles',
      options: ['SUV', 'Sedan', 'Hatchback', 'Coupe', 'Convertible', 'Truck'],
    },
    {
      question: 'Minimum fuel efficiency (mpg)?',
      type: 'number',
      key: 'minFuelEfficiency',
    },
    {
      question: 'Preferred brands?',
      type: 'multi-select',
      key: 'preferredBrands',
      options: ['Toyota', 'Honda', 'Ford', 'BMW', 'Tesla', 'Hyundai', 'Kia'],
    },
    {
      question: 'Required features?',
      type: 'multi-select',
      key: 'requiredFeatures',
      options: [
        'Bluetooth',
        'Backup Camera',
        'AWD',
        'Navigation',
        'Heated Seats',
        'Sunroof',
      ],
    },
    {
      question: 'Minimum safety rating?',
      type: 'number',
      key: 'minSafetyRating',
    },
  ];
}
