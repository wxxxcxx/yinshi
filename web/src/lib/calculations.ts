import type {
  CardioTable,
  CalculationConstants,
  Goal,
  MacroQuotaTable,
  MealSplit,
  Sex,
  TrainingLevel,
} from "./types";

export const roundValue = (value: number) => Math.round(value);

export function calculateBmr(
  constants: CalculationConstants,
  sex: Sex,
  weightKg: number,
  heightCm: number,
  age: number
) {
  const coeff = constants.bmr_coefficients[sex];
  const bmr =
    weightKg * coeff.weight +
    heightCm * coeff.height +
    age * coeff.age +
    coeff.constant;
  const tdee = bmr / constants.bmr_to_tdee_ratio;
  return {
    bmr,
    tdee,
  };
}

export function getStrengthCalories(
  constants: CalculationConstants,
  sex: Sex,
  level: TrainingLevel
) {
  if (level === "none") {
    return 0;
  }
  return constants.strength_training_calories[sex][level];
}

export function getGoalMultiplier(constants: CalculationConstants, goal: Goal) {
  return constants.goal_multipliers[goal];
}

export function getFatQuota(
  constants: CalculationConstants,
  sex: Sex,
  goal: Goal,
  weightKg: number
) {
  const fat = constants.fat_quota_grams[goal];
  if (goal === "cut" && sex === "male" && weightKg >= 120) {
    return fat.male_over_120kg ?? fat.male;
  }
  return sex === "male" ? fat.male : fat.female;
}

export function getCardioPerHour(
  cardio: CardioTable,
  itemId: string,
  weightKg: number
) {
  const item = cardio.items.find((entry) => entry.id === itemId);
  if (!item) return null;

  const weights = cardio.meta.weights_kg;
  const minWeight = weights[0];
  const maxWeight = weights[weights.length - 1];

  const readValue = (weight: number) => {
    const key = String(weight);
    return item.per_hour[key] ?? null;
  };

  if (weightKg < minWeight) {
    const w1 = minWeight;
    const w2 = weights[1];
    const v1 = readValue(w1);
    const v2 = readValue(w2);
    if (v1 == null || v2 == null) return null;
    const slope = (v2 - v1) / (w2 - w1);
    return v1 + (weightKg - w1) * slope;
  }

  if (weightKg > maxWeight) {
    const w2 = maxWeight;
    const w1 = weights[weights.length - 2];
    const v1 = readValue(w1);
    const v2 = readValue(w2);
    if (v1 == null || v2 == null) return null;
    const slope = (v2 - v1) / (w2 - w1);
    return v2 + (weightKg - w2) * slope;
  }

  const rounded = Math.round(weightKg / 5) * 5;
  const clamped = Math.min(maxWeight, Math.max(minWeight, rounded));
  return readValue(clamped);
}

export function findMacroCell(
  table: MacroQuotaTable,
  heightCm: number,
  weightKg: number
) {
  const heights = table.heights_cm;
  let best: {
    value: string;
    diff: number;
    weight: number;
    height: number;
  } | null = null;

  for (const row of table.rows) {
    for (let index = 0; index < heights.length; index += 1) {
      const value = row.values[index];
      if (!value) continue;
      const diff =
        Math.abs(row.weight_kg - weightKg) +
        Math.abs(heights[index] - heightCm);
      if (!best || diff < best.diff) {
        best = {
          value,
          diff,
          weight: row.weight_kg,
          height: heights[index],
        };
      }
    }
  }

  if (!best) return null;

  const [train, rest, protein] = best.value.split("/").map(Number);
  if ([train, rest, protein].some((entry) => Number.isNaN(entry))) return null;

  return {
    trainPerKg: train,
    restPerKg: rest,
    proteinPerKg: protein,
    matchedHeight: best.height,
    matchedWeight: best.weight,
    sourceValue: best.value,
  };
}

export function applyMealSplits(
  splits: MealSplit[],
  totalCarbs: number,
  totalProtein: number
) {
  return splits.map((item) => {
    const carbs =
      item.carbs_pct == null
        ? null
        : roundValue((totalCarbs * item.carbs_pct) / 100);
    const protein =
      item.protein_pct == null
        ? null
        : roundValue((totalProtein * item.protein_pct) / 100);

    return {
      ...item,
      carbs_g: carbs,
      protein_g: protein,
    };
  });
}

export function formatPercent(value: number | null) {
  if (value == null) return "—";
  return `${value}%`;
}
