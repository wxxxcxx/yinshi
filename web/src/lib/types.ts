export type Sex = "male" | "female";
export type Goal = "cut" | "bulk";
export type TrainingLevel = "novice" | "intermediate" | "advanced" | "none";

export type MacroQuotaTable = {
  meta: {
    sex: Sex;
    goal: Goal;
    unit: "g/kg" | string;
    fields: ["train_day_carbs", "rest_day_carbs", "daily_protein"] | string[];
    source: string;
    notes?: string[];
  };
  heights_cm: number[];
  rows: Array<{
    weight_kg: number;
    values: Array<string | null>;
  }>;
};

export type CardioTable = {
  meta: {
    title: string;
    weights_kg: number[];
    unit_per_hour: string;
    source: string;
    usage_notes?: string[];
    data_source_note?: string;
  };
  items: Array<{
    id: string;
    group: string;
    label: string | number;
    per_kg: number;
    per_hour: Record<string, number>;
  }>;
};

export type CalculationConstants = {
  bmr_coefficients: Record<
    Sex,
    {
      weight: number;
      height: number;
      age: number;
      constant: number;
    }
  >;
  bmr_to_tdee_ratio: number;
  strength_training_calories: Record<
    Sex,
    {
      novice: number;
      intermediate: number;
      advanced: number;
    }
  >;
  goal_multipliers: Record<Goal, number>;
  fat_quota_grams: Record<
    Goal,
    {
      male: number;
      female: number;
      male_over_120kg?: number;
    }
  >;
  cardio_weight_handling: {
    rounding: string;
    extrapolation: string;
  };
};

export type MealSequence = {
  id: string;
  label: string;
  steps: Array<{
    slot: string;
    quota_type: string | null;
    label: string;
  }>;
};

export type MealSequences = {
  meta: {
    source: string;
    note?: string;
  };
  sequences: MealSequence[];
};

export type MealSplit = {
  label: string;
  slot: string;
  meal_type: string;
  carbs_pct: number | null;
  protein_pct: number | null;
};

export type MealQuotaSplits = {
  meta: {
    source: string;
    unit: string;
    notes?: string[];
  };
  green_table: {
    breakfast: {
      carbs_pct: number | null;
      protein_pct: number | null;
    };
    snack: {
      carbs_pct: number | null;
      protein_pct: number | null;
    };
  };
  rest_day_carb_defaults: {
    lunch: number;
    dinner: number;
  };
  goals: Record<
    Goal,
    {
      scenarios: Record<
        string,
        {
          training: MealSplit[];
          rest: MealSplit[];
        }
      >;
    }
  >;
};

export type AppData = {
  cardio: CardioTable;
  constants: CalculationConstants;
  mealSequences: MealSequences;
  mealSplits: MealQuotaSplits;
  macroTables: {
    male: {
      cut: MacroQuotaTable;
      bulk: MacroQuotaTable;
    };
    female: {
      cut: MacroQuotaTable;
      bulk: MacroQuotaTable;
    };
  };
};
