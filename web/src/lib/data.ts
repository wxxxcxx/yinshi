import fs from "fs";
import path from "path";

import type {
  AppData,
  CalculationConstants,
  CardioTable,
  MacroQuotaTable,
  MealQuotaSplits,
  MealSequences,
} from "./types";

const dataRoot = path.resolve(process.cwd(), "data");

function loadJson<T>(fileName: string): T {
  const fullPath = path.join(dataRoot, fileName);
  const raw = fs.readFileSync(fullPath, "utf8");
  return JSON.parse(raw) as T;
}

export function loadAppData(): AppData {
  return {
    cardio: loadJson<CardioTable>("cardio_table.json"),
    constants: loadJson<CalculationConstants>("calculation_constants.json"),
    mealSequences: loadJson<MealSequences>("meal_sequences.json"),
    mealSplits: loadJson<MealQuotaSplits>("meal_quota_splits.json"),
    macroTables: {
      male: {
        cut: loadJson<MacroQuotaTable>("macro_quota_male_cut.json"),
        bulk: loadJson<MacroQuotaTable>("macro_quota_male_bulk.json"),
      },
      female: {
        cut: loadJson<MacroQuotaTable>("macro_quota_female_cut.json"),
        bulk: loadJson<MacroQuotaTable>("macro_quota_female_bulk.json"),
      },
    },
  };
}
