"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Activity,
  CircleHelp,
  Flame,
  Minus,
  MoonStar,
  Plus,
  Sparkles,
  Target,
  TimerReset,
} from "lucide-react";

import {
  applyMealSplits,
  calculateBmr,
  findMacroCell,
  formatPercent,
  getCardioPerHour,
  getFatQuota,
  getGoalTargetMultiplier,
  getIntakeAdherenceFactor,
  getStrengthCalories,
  roundValue,
} from "@/lib/calculations";
import type { AppData, Goal, Sex, TrainingLevel } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const sexOptions = [
  { value: "male", label: "男性" },
  { value: "female", label: "女性" },
];

const goalOptions = [
  { value: "cut", label: "减脂" },
  { value: "bulk", label: "增肌" },
];

const trainingLevels = [
  { value: "novice", label: "新手" },
  { value: "intermediate", label: "有基础" },
  { value: "advanced", label: "老手" },
  { value: "none", label: "无力训" },
];

const revealUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.55 },
};

const formatMacroValue = (value: number | null) =>
  value == null || Number.isNaN(value) ? "—" : `${value} g`;

const formatCalories = (value: number | null) =>
  value == null || Number.isNaN(value) ? "—" : `${value} kcal`;

const buildCardioLabel = (group: string, label: string | number) => {
  const groupText = group.replace(/\n/g, " · ");
  return `${groupText} / ${label}`;
};

type CardioEntry = {
  id: string;
  hours: string;
};

type PlannerProps = {
  data: AppData;
};

type Option = {
  value: string;
  label: string;
};

type ResponsiveSelectProps = {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
};

type ResponsiveNumberProps = {
  value: string;
  onChange: (value: string) => void;
  min: number;
  max: number;
  step?: number;
};

function AnimatedValue({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <span className={className}>{value}</span>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={value}
        className={className}
        initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
        transition={{ duration: 0.28, ease: "easeOut" }}
      >
        {value}
      </motion.span>
    </AnimatePresence>
  );
}

function ResponsiveSelect({
  value,
  options,
  onChange,
  placeholder,
  disabled,
}: ResponsiveSelectProps) {
  return (
    <>
      <div className="md:hidden">
        <select
          className="input-shell h-11 w-full rounded-md px-4 text-sm"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
        >
          {!options.find((item) => item.value === value) ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="hidden md:block">
        <Select value={value} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger className="input-shell h-11 rounded-md border-0 bg-transparent">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

function ResponsiveNumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
}: ResponsiveNumberProps) {
  const numericValue = Number(value);
  const sliderValue = Number.isFinite(numericValue) ? numericValue : min;

  return (
    <>
      <div className="space-y-3 md:hidden">
        <div className="glass-subtle flex items-center justify-between rounded-md px-4 py-3 text-sm">
          <span className="text-muted-foreground">当前值</span>
          <span className="font-semibold text-foreground">{value || "0"}</span>
        </div>
        <input
          type="range"
          className="w-full accent-[var(--color-hero-ink)]"
          min={min}
          max={max}
          step={step}
          value={sliderValue}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
      <div className="hidden md:block">
        <Input
          className="input-shell h-11 rounded-md border-0 bg-transparent"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          type="number"
          min={min}
          max={max}
          step={step}
        />
      </div>
    </>
  );
}

function SectionShell({
  eyebrow,
  title,
  description,
  className,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      {...revealUp}
      className={cn("panel-shell rounded-xl p-6 md:p-8", className)}
    >
      <div className="mb-6 space-y-3">
        <div className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-hero-ink)]/70">
          {eyebrow}
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-2xl leading-tight text-foreground md:text-3xl">
            {title}
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
            {description}
          </p>
        </div>
      </div>
      {children}
    </motion.section>
  );
}

function MetricCard({
  label,
  value,
  detail,
  tone = "neutral",
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "neutral" | "warm" | "ink";
  icon: React.ReactNode;
}) {
  return (
    <motion.div
      layout
      whileHover={{ y: -4 }}
      transition={{ duration: 0.22 }}
      className={cn(
        "metric-shell rounded-lg p-5",
        tone === "warm" && "metric-shell-warm",
        tone === "ink" && "metric-shell-ink"
      )}
    >
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/75 text-[var(--color-hero-ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
          {icon}
        </div>
      </div>
      <div className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
        <AnimatedValue value={value} />
      </div>
      <div className="mt-3 text-sm leading-6 text-muted-foreground">{detail}</div>
    </motion.div>
  );
}

function QuickStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <motion.div
      layout
      className="glass-subtle rounded-lg px-4 py-4"
    >
      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 text-xl font-semibold text-foreground">
        <AnimatedValue value={value} />
      </div>
    </motion.div>
  );
}

function MealRow({
  meal,
  index,
}: {
  meal: {
    label: string;
    carbs_g: number | null;
    protein_g: number | null;
    carbs_pct: number | null;
    protein_pct: number | null;
  };
  index: number;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.04 }}
      className="glass-subtle rounded-lg p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-base font-semibold text-foreground">{meal.label}</div>
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          第 {index + 1} 餐
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="glass-subtle rounded-md px-4 py-3">
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            碳水
          </div>
          <div className="mt-1 text-lg font-semibold text-foreground">
            {formatMacroValue(meal.carbs_g)}
          </div>
          <div className="text-sm text-muted-foreground">
            {formatPercent(meal.carbs_pct)}
          </div>
        </div>
        <div className="glass-subtle rounded-md px-4 py-3">
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            蛋白
          </div>
          <div className="mt-1 text-lg font-semibold text-foreground">
            {formatMacroValue(meal.protein_g)}
          </div>
          <div className="text-sm text-muted-foreground">
            {formatPercent(meal.protein_pct)}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ProcessCard({
  step,
  label,
  value,
  detail,
}: {
  step: string;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <motion.div
      layout
      className="glass-subtle rounded-lg p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {step}
          </div>
          <div className="mt-1 text-sm font-semibold text-foreground">{label}</div>
        </div>
        <div className="rounded-full border border-white/40 bg-[rgba(255,255,255,0.16)] px-2.5 py-1 text-xs text-[var(--color-hero-ink)]">
          当前值
        </div>
      </div>
      <div className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
        <AnimatedValue value={value} />
      </div>
      <div className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</div>
    </motion.div>
  );
}

export function CaloriePlanner({ data }: PlannerProps) {
  const [height, setHeight] = useState("175");
  const [weight, setWeight] = useState("70");
  const [age, setAge] = useState("28");
  const [sex, setSex] = useState<Sex>("male");
  const [goal, setGoal] = useState<Goal>("cut");
  const [trainingLevel, setTrainingLevel] = useState<TrainingLevel>(
    "intermediate"
  );
  const [scenarioId, setScenarioId] = useState(
    data.mealSequences.sequences[0]?.id ?? "post_breakfast_early"
  );
  const [cardioEntries, setCardioEntries] = useState<CardioEntry[]>([]);

  const scenarioOptions = useMemo(() => {
    return data.mealSequences.sequences
      .filter((sequence) => sequence.id !== "no_strength")
      .map((sequence) => ({
      value: sequence.id,
      label: sequence.label,
      }));
  }, [data.mealSequences.sequences]);

  const effectiveScenarioId = trainingLevel === "none" ? "no_strength" : scenarioId;

  const cardioOptions = useMemo(
    () =>
      data.cardio.items.map((item) => ({
        value: item.id,
        label: buildCardioLabel(item.group, item.label),
      })),
    [data.cardio.items]
  );

  const numericInputs = useMemo(() => {
    const heightValue = Number(height);
    const weightValue = Number(weight);
    const ageValue = Number(age);

    return {
      heightValue,
      weightValue,
      ageValue,
      isValid:
        Number.isFinite(heightValue) &&
        Number.isFinite(weightValue) &&
        Number.isFinite(ageValue) &&
        heightValue > 0 &&
        weightValue > 0 &&
        ageValue > 0,
    };
  }, [height, weight, age]);

  const currentWeightKg = numericInputs.isValid ? numericInputs.weightValue : null;

  const calorieDerived = useMemo(() => {
    if (!numericInputs.isValid) return null;

    const heightCm = numericInputs.heightValue;
    const weightKg = numericInputs.weightValue;
    const ageYears = numericInputs.ageValue;

    const { bmr, tdee } = calculateBmr(
      data.constants,
      sex,
      weightKg,
      heightCm,
      ageYears
    );

    const strengthCalories = getStrengthCalories(
      data.constants,
      sex,
      trainingLevel
    );

    const cardioDetails = cardioEntries
      .map((entry) => {
        const item = data.cardio.items.find((target) => target.id === entry.id);
        if (!item) return null;
        const weeklyHours = Number(entry.hours);
        if (!Number.isFinite(weeklyHours) || weeklyHours <= 0) {
          return {
            id: item.id,
            label: buildCardioLabel(item.group, item.label),
            weeklyHours: 0,
            perHour: null,
            dailyCalories: 0,
          };
        }
        const perHour = getCardioPerHour(data.cardio, item.id, weightKg);
        const dailyCalories = perHour ? (perHour * weeklyHours) / 7 : null;
        return {
          id: item.id,
          label: buildCardioLabel(item.group, item.label),
          weeklyHours,
          perHour,
          dailyCalories: dailyCalories ?? null,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

    const cardioDaily = cardioDetails.reduce((total, entry) => {
      if (entry.dailyCalories == null) return total;
      return total + entry.dailyCalories;
    }, 0);

    const trainingDayBalance = tdee + strengthCalories + cardioDaily;
    const restDayBalance = tdee + cardioDaily;

    const targetMultiplier = getGoalTargetMultiplier(data.constants, goal);
    const intakeAdherenceFactor = getIntakeAdherenceFactor(data.constants);
    const effectiveMultiplier = targetMultiplier * intakeAdherenceFactor;
    const trainingDayTargetCalories = trainingDayBalance * targetMultiplier;
    const restDayTargetCalories = restDayBalance * targetMultiplier;
    const trainingDayEatCalories =
      trainingDayTargetCalories * intakeAdherenceFactor;
    const restDayEatCalories = restDayTargetCalories * intakeAdherenceFactor;

    const macroTable = data.macroTables[sex][goal];
    const macroCell = findMacroCell(macroTable, heightCm, weightKg);

    const trainCarbTotal = macroCell
      ? roundValue(macroCell.trainPerKg * weightKg)
      : null;
    const restCarbTotal = macroCell
      ? roundValue(macroCell.restPerKg * weightKg)
      : null;
    const proteinTotal = macroCell
      ? roundValue(macroCell.proteinPerKg * weightKg)
      : null;

    const fatTotal = getFatQuota(data.constants, sex, goal, weightKg);

    return {
      bmr,
      tdee,
      strengthCalories,
      cardioDaily,
      cardioDetails,
      trainingDayBalance,
      restDayBalance,
      targetMultiplier,
      intakeAdherenceFactor,
      effectiveMultiplier,
      trainingDayTargetCalories,
      restDayTargetCalories,
      trainingDayEatCalories,
      restDayEatCalories,
      macroCell,
      trainCarbTotal,
      restCarbTotal,
      proteinTotal,
      fatTotal,
    };
  }, [
    cardioEntries,
    data.cardio,
    data.constants,
    data.macroTables,
    goal,
    numericInputs,
    sex,
    trainingLevel,
  ]);

  const dietDerived = useMemo(() => {
    if (!calorieDerived) return null;

    const scenario = data.mealSplits.goals[goal]?.scenarios[effectiveScenarioId];
    const trainingSplits = scenario?.training ?? [];
    const restSplits = scenario?.rest ?? [];

    const trainingMeals =
      calorieDerived.trainCarbTotal != null && calorieDerived.proteinTotal != null
        ? applyMealSplits(
            trainingSplits,
            calorieDerived.trainCarbTotal,
            calorieDerived.proteinTotal
          )
        : [];

    const restMeals =
      calorieDerived.restCarbTotal != null && calorieDerived.proteinTotal != null
        ? applyMealSplits(
            restSplits,
            calorieDerived.restCarbTotal,
            calorieDerived.proteinTotal
          )
        : [];

    return {
      isNoStrength: trainingLevel === "none",
      trainingMeals,
      restMeals,
      scenarioTimeline: data.mealSequences.sequences.find(
        (sequence) => sequence.id === effectiveScenarioId
      ),
    };
  }, [
    calorieDerived,
    data.mealSequences.sequences,
    data.mealSplits,
    effectiveScenarioId,
    goal,
    trainingLevel,
  ]);

  const addCardio = () => {
    const first = data.cardio.items[0];
    if (!first) return;
    setCardioEntries((prev) => [...prev, { id: first.id, hours: "1" }]);
  };

  const updateCardio = (index: number, patch: Partial<CardioEntry>) => {
    setCardioEntries((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, ...patch } : entry))
    );
  };

  const removeCardio = (index: number) => {
    setCardioEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const showWarning = trainingLevel === "none" && goal === "bulk";

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[38rem] bg-[radial-gradient(circle_at_top_left,rgba(163,225,255,0.3),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(167,190,255,0.22),transparent_24%),linear-gradient(180deg,rgba(243,250,255,0.88),rgba(232,242,251,0))]" />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-6 md:px-8 md:py-10">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="hero-badge">Body OS</span>
            <span>饮食与训练管理的基础计算层</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/diet-quota-table"
              className="glass-subtle rounded-full px-3 py-1.5 text-[var(--color-hero-ink)]"
            >
              饮食配额表
            </Link>
            <Link
              href="/cardio-table"
              className="glass-subtle rounded-full px-3 py-1.5 text-[var(--color-hero-ink)]"
            >
              有氧消耗表
            </Link>
          </div>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="hero-shell overflow-hidden rounded-xl px-6 py-8 md:px-10 md:py-12"
        >
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.9fr] lg:items-end">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="hero-badge">智能规划</span>
                <span className="hero-badge hero-badge-subtle">训练日与休息日分开计算</span>
              </div>
              <div className="space-y-4">
                <h1 className="font-display text-5xl leading-[0.95] tracking-tight text-[var(--color-hero-ink)] md:text-7xl">
                  不再靠感觉吃饭，
                  <br />
                  直接得到今天该怎么吃
                </h1>
                <p className="max-w-2xl text-base leading-7 text-[rgba(58,40,19,0.72)] md:text-lg">
                  输入体型、目标和训练安排，系统会自动给出训练日与休息日的热量建议、每日宏量营养目标，以及可直接执行的每餐分配方案。
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <QuickStat
                  label="训练日目标热量"
                  value={formatCalories(
                    calorieDerived
                      ? roundValue(calorieDerived.trainingDayTargetCalories)
                      : null
                  )}
                />
                <QuickStat
                  label="休息日目标热量"
                  value={formatCalories(
                    calorieDerived
                      ? roundValue(calorieDerived.restDayTargetCalories)
                      : null
                  )}
                />
                <QuickStat
                  label="每日蛋白"
                  value={formatMacroValue(calorieDerived?.proteinTotal ?? null)}
                />
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.12 }}
              className="glass-subtle rounded-xl p-5"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">当前方案</div>
                  <div className="mt-1 text-2xl font-semibold text-foreground">
                    {goal === "cut" ? "减脂饮食策略" : "增肌饮食策略"}
                  </div>
                </div>
                <Badge className="rounded-full border border-white/45 bg-[rgba(255,255,255,0.2)] px-3 py-1 text-[var(--color-hero-ink)] backdrop-blur-xl">
                  {sex === "male" ? "男性" : "女性"}
                </Badge>
              </div>
              <div className="mt-6 space-y-4">
                <div className="rounded-lg border border-white/35 bg-[linear-gradient(180deg,rgba(141,121,170,0.54),rgba(112,95,140,0.4))] p-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] backdrop-blur-xl">
                  <div className="text-xs uppercase tracking-[0.22em] text-white/72">
                    今日执行重点
                  </div>
                  <div className="mt-2 text-3xl font-semibold">
                    {calorieDerived
                      ? `${roundValue(
                          calorieDerived.trainingDayEatCalories -
                            calorieDerived.restDayEatCalories
                        )} kcal`
                      : "—"}
                  </div>
                  <div className="mt-2 text-sm text-white/78">
                    训练日和休息日采用不同摄入标准，帮助你在保证执行感受的前提下更稳定地推进目标。
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="glass-subtle rounded-md p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      饮食场景
                    </div>
                    <div className="mt-2 text-base font-semibold text-foreground">
                      {trainingLevel === "none"
                        ? "无力训 / 休息日分配"
                        : scenarioOptions.find(
                            (option) => option.value === effectiveScenarioId
                          )?.label ?? "—"}
                    </div>
                  </div>
                  <div className="glass-subtle rounded-md p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      日均有氧消耗
                    </div>
                    <div className="mt-2 text-base font-semibold text-foreground">
                      {formatCalories(
                        calorieDerived ? roundValue(calorieDerived.cardioDaily) : null
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.section>

        <div className="grid gap-8 xl:grid-cols-[0.96fr_1.12fr]">
          <div className="space-y-8">
            <SectionShell
              eyebrow="Calories"
              title="基础设置"
              description="先输入身体参数、目标、训练水平和有氧安排，系统会基于这些信息计算训练日与休息日的热量建议。训练时间场景不参与这里的热量计算。"
            >
              <div className="grid gap-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      身高 (cm)
                    </label>
                    <ResponsiveNumberInput
                      value={height}
                      onChange={setHeight}
                      min={120}
                      max={230}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      体重 (kg)
                    </label>
                    <ResponsiveNumberInput
                      value={weight}
                      onChange={setWeight}
                      min={30}
                      max={200}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      年龄
                    </label>
                    <ResponsiveNumberInput
                      value={age}
                      onChange={setAge}
                      min={12}
                      max={80}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      性别
                    </label>
                    <ResponsiveSelect
                      value={sex}
                      onChange={(value) => setSex(value as Sex)}
                      options={sexOptions}
                      placeholder="选择性别"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      目标
                    </label>
                    <ResponsiveSelect
                      value={goal}
                      onChange={(value) => setGoal(value as Goal)}
                      options={goalOptions}
                      placeholder="选择目标"
                    />
                  </div>
                </div>

                <Separator className="bg-[rgba(95,61,19,0.12)]" />

                <div className="grid gap-4 md:grid-cols-1">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      训练水平
                    </label>
                    <ResponsiveSelect
                      value={trainingLevel}
                      onChange={(value) => setTrainingLevel(value as TrainingLevel)}
                      options={trainingLevels}
                      placeholder="选择训练水平"
                    />
                  </div>
                </div>

                {trainingLevel === "none" ? (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border border-dashed border-white/45 bg-[rgba(255,255,255,0.18)] p-4 text-sm leading-6 text-muted-foreground backdrop-blur-xl"
                  >
                    选择“无力训”后，热量模块会将力训消耗记为 0；饮食建议模块也会切换为只展示休息日分配。
                  </motion.div>
                ) : null}

                <div className="glass-subtle rounded-lg p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-foreground">
                        有氧消耗
                      </div>
                      <div className="text-sm text-muted-foreground">
                        可以叠加多个项目，按周小时数折算为日均消耗。
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href="/cardio-table"
                        aria-label="查看有氧消耗表"
                        title="查看有氧消耗表"
                        className="glass-subtle flex h-10 w-10 items-center justify-center rounded-md text-[var(--color-hero-ink)]"
                      >
                        <CircleHelp className="h-4 w-4" />
                      </Link>
                      <Button
                        type="button"
                        onClick={addCardio}
                        className="rounded-md border border-white/30 bg-[linear-gradient(180deg,rgba(154,136,181,0.9),rgba(118,100,146,0.94))] px-4 text-white shadow-[0_12px_24px_rgba(113,96,143,0.18)] hover:bg-[linear-gradient(180deg,rgba(162,144,188,0.94),rgba(124,106,151,0.98))]"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        添加
                      </Button>
                    </div>
                  </div>

                  {cardioEntries.length === 0 ? (
                    <div className="rounded-[1.4rem] border border-dashed border-white/45 bg-[rgba(255,255,255,0.18)] p-4 text-sm text-muted-foreground backdrop-blur-xl">
                      暂无有氧项目。需要时再添加，避免默认噪音。
                    </div>
                  ) : null}

                  <div className="mt-4 space-y-3">
                    <AnimatePresence initial={false}>
                      {cardioEntries.map((entry, index) => (
                        <motion.div
                          key={`${entry.id}-${index}`}
                          layout
                          initial={{ opacity: 0, y: 16, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -16, scale: 0.98 }}
                          transition={{ duration: 0.22 }}
                          className="glass-subtle grid gap-3 rounded-lg p-4 md:grid-cols-[1.35fr_0.8fr_1fr_auto]"
                        >
                          <ResponsiveSelect
                            value={entry.id}
                            onChange={(value) => updateCardio(index, { id: value })}
                            options={cardioOptions}
                            placeholder="选择有氧"
                          />
                          <ResponsiveNumberInput
                            value={entry.hours}
                            onChange={(value) =>
                              updateCardio(index, { hours: value })
                            }
                            min={0}
                            max={20}
                            step={0.5}
                          />
                          <div className="glass-subtle rounded-md px-4 py-3 text-sm leading-6 text-muted-foreground">
                            {(() => {
                              const hours = Number(entry.hours);
                              const perHour =
                                currentWeightKg == null
                                  ? null
                                  : getCardioPerHour(
                                      data.cardio,
                                      entry.id,
                                      currentWeightKg
                                    );
                              const dailyCalories =
                                perHour != null &&
                                Number.isFinite(hours) &&
                                hours > 0
                                  ? (perHour * hours) / 7
                                  : null;

                              return (
                                <>
                                  <div>
                                    当前项目有氧消耗：
                                    <span className="font-semibold text-foreground">
                                      {" "}
                                      {formatCalories(
                                        dailyCalories == null
                                          ? null
                                          : roundValue(dailyCalories)
                                      )}
                                    </span>
                                  </div>
                                  <div className="text-xs leading-5 text-muted-foreground">
                                    按当前项目和填写时长自动折算为日均消耗。
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            className="glass-subtle h-11 w-11 rounded-md"
                            onClick={() => removeCardio(index)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </SectionShell>
          </div>
          <div className="space-y-8">
            <SectionShell
              eyebrow="Overview"
              title="热量概览"
              description="这里汇总正式执行时最关键的热量信息，包括目标热量、应吃热量，以及完整的计算步骤，便于核对和复盘。"
            >
              {showWarning ? (
                <div className="glass-subtle mb-5 rounded-lg border-[rgba(255,173,173,0.4)] bg-[linear-gradient(180deg,rgba(255,228,228,0.3),rgba(255,255,255,0.12))] p-4 text-sm leading-6 text-[rgb(120,73,73)]">
                  增肌必须稳定力训。当前选择无力训场景，建议切换为减脂或补上力训。
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <MetricCard
                  label="训练日目标热量"
                  value={formatCalories(
                    calorieDerived
                      ? roundValue(calorieDerived.trainingDayTargetCalories)
                      : null
                  )}
                  detail={`训练日应吃热量：${formatCalories(
                    calorieDerived
                      ? roundValue(calorieDerived.trainingDayEatCalories)
                      : null
                  )}`}
                  tone="warm"
                  icon={<Flame className="h-5 w-5" />}
                />
                <MetricCard
                  label="休息日目标热量"
                  value={formatCalories(
                    calorieDerived
                      ? roundValue(calorieDerived.restDayTargetCalories)
                      : null
                  )}
                  detail={`休息日应吃热量：${formatCalories(
                    calorieDerived
                      ? roundValue(calorieDerived.restDayEatCalories)
                      : null
                  )}`}
                  tone="ink"
                  icon={<MoonStar className="h-5 w-5" />}
                />
              </div>

              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      热量计算步骤
                    </div>
                    <div className="text-sm text-muted-foreground">
                      从基础代谢到应吃热量，按顺序查看每一步当前结果。
                    </div>
                  </div>
                  <Badge className="rounded-full border border-white/45 bg-[rgba(255,255,255,0.16)] px-3 py-1 text-[var(--color-hero-ink)] backdrop-blur-xl">
                    过程可视化
                  </Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <ProcessCard
                    step="Step 1"
                    label="基础代谢"
                    value={formatCalories(
                      calorieDerived ? roundValue(calorieDerived.bmr) : null
                    )}
                    detail={`${
                      sex === "male" ? "男性" : "女性"
                    }公式下的基础代谢结果。`}
                  />
                  <ProcessCard
                    step="Step 2"
                    label="无运动总消耗"
                    value={formatCalories(
                      calorieDerived ? roundValue(calorieDerived.tdee) : null
                    )}
                    detail="按基础代谢 ÷ 0.7 估算日常无运动总消耗。"
                  />
                  <ProcessCard
                    step="Step 3"
                    label="力训消耗"
                    value={formatCalories(
                      calorieDerived
                        ? roundValue(calorieDerived.strengthCalories)
                        : null
                    )}
                    detail={
                      trainingLevel === "none"
                        ? "当前为无力训，力训消耗记为 0。"
                        : `按训练水平“${trainingLevels.find((item) => item.value === trainingLevel)?.label ?? "—"}”取值。`
                    }
                  />
                  <ProcessCard
                    step="Step 4"
                    label="有氧消耗"
                    value={formatCalories(
                      calorieDerived
                        ? roundValue(calorieDerived.cardioDaily)
                        : null
                    )}
                    detail={
                      calorieDerived?.cardioDetails.length
                        ? calorieDerived.cardioDetails
                            .map(
                              (detail) =>
                                `${detail.label} ${detail.weeklyHours}h/周`
                            )
                            .join(" · ")
                        : "当前未添加有氧项目。"
                    }
                  />
                  <ProcessCard
                    step="Step 5"
                    label="训练日 / 休息日平衡热量"
                    value={
                      calorieDerived
                        ? `${roundValue(calorieDerived.trainingDayBalance)} / ${roundValue(calorieDerived.restDayBalance)} kcal`
                        : "—"
                    }
                    detail="左侧是训练日平衡热量，右侧是休息日平衡热量。"
                  />
                  <ProcessCard
                    step="Step 6"
                    label="训练日 / 休息日目标热量"
                    value={
                      calorieDerived
                        ? `${roundValue(calorieDerived.trainingDayTargetCalories)} / ${roundValue(calorieDerived.restDayTargetCalories)} kcal`
                        : "—"
                    }
                    detail={`在平衡热量基础上乘以目标系数 ${calorieDerived?.targetMultiplier ?? "—"}。`}
                  />
                  <ProcessCard
                    step="Step 7"
                    label="训练日 / 休息日应吃热量"
                    value={
                      calorieDerived
                        ? `${roundValue(calorieDerived.trainingDayEatCalories)} / ${roundValue(calorieDerived.restDayEatCalories)} kcal`
                        : "—"
                    }
                    detail={`按普遍会多吃 20% 反推，目标热量再乘以 ${calorieDerived?.intakeAdherenceFactor ?? "—"}。`}
                  />
                </div>
              </div>

            </SectionShell>

            <SectionShell
              eyebrow="Diet"
              title="饮食建议"
              description="这一部分专门处理饮食执行层。你可以查看碳水、蛋白质和脂肪目标，并根据训练时间场景获得每餐分配和训练日餐序建议。"
            >
              <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="训练日碳水"
                  value={formatMacroValue(calorieDerived?.trainCarbTotal ?? null)}
                  detail="按饮食配额表 g/kg 折算"
                  icon={<Target className="h-5 w-5" />}
                />
                <MetricCard
                  label="休息日碳水"
                  value={formatMacroValue(calorieDerived?.restCarbTotal ?? null)}
                  detail="休息日低碳处理"
                  icon={<TimerReset className="h-5 w-5" />}
                />
                <MetricCard
                  label="每日蛋白质"
                  value={formatMacroValue(calorieDerived?.proteinTotal ?? null)}
                  detail="所有日期保持稳定"
                  icon={<Sparkles className="h-5 w-5" />}
                />
                <MetricCard
                  label="每日脂肪"
                  value={formatMacroValue(calorieDerived?.fatTotal ?? null)}
                  detail="根据目标与性别取值"
                  icon={<Activity className="h-5 w-5" />}
                />
              </div>

                <div className="glass-subtle mb-5 rounded-lg p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="rounded-full border border-white/45 bg-[rgba(255,255,255,0.2)] px-3 py-1 text-[var(--color-hero-ink)] backdrop-blur-xl">
                    g/kg 配额表
                  </Badge>
                  <Badge className="rounded-full border border-white/45 bg-[rgba(255,255,255,0.16)] px-3 py-1 text-[var(--color-hero-ink)] backdrop-blur-xl">
                    四舍五入输出
                  </Badge>
                  <Link
                    href="/diet-quota-table"
                    className="rounded-full border border-white/45 bg-[rgba(255,255,255,0.16)] px-3 py-1 text-sm text-[var(--color-hero-ink)] backdrop-blur-xl"
                  >
                    查看饮食配额表
                  </Link>
                </div>
                <div className="mt-4 text-sm leading-7 text-muted-foreground">
                  {calorieDerived?.macroCell
                    ? `当前命中的配额区间为 ${calorieDerived.macroCell.matchedHeight}cm / ${calorieDerived.macroCell.matchedWeight}kg，对应比例 ${calorieDerived.macroCell.sourceValue}。`
                    : "当前输入未匹配到饮食配额表，对应项目会显示为“—”。"}
                </div>
              </div>

              <div className="mb-5 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    训练时间场景
                  </label>
                  <ResponsiveSelect
                    value={trainingLevel === "none" ? scenarioOptions[0]?.value ?? "" : scenarioId}
                    onChange={setScenarioId}
                    options={scenarioOptions}
                    placeholder="选择场景"
                    disabled={trainingLevel === "none"}
                  />
                </div>
                <div className="glass-subtle rounded-md px-4 py-3 text-sm leading-6 text-muted-foreground">
                  {trainingLevel === "none"
                    ? "当前没有力量训练，仅输出休息日的饮食建议。"
                    : "训练时间场景只影响用餐顺序和每餐分配，不改变热量结果。"}
                </div>
              </div>

              <Tabs defaultValue="training" className="space-y-5">
                <TabsList className="glass-subtle grid h-auto w-full grid-cols-2 rounded-lg p-1">
                  <TabsTrigger value="training" className="rounded-md">
                    训练日
                  </TabsTrigger>
                  <TabsTrigger value="rest" className="rounded-md">
                    休息日
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="training" className="mt-0">
                  {dietDerived?.isNoStrength ? (
                    <div className="rounded-lg border border-dashed border-white/45 bg-[rgba(255,255,255,0.16)] p-4 text-sm text-muted-foreground backdrop-blur-xl">
                      无力训场景不展示训练日配额。
                    </div>
                  ) : dietDerived?.trainingMeals.length ? (
                    <div className="space-y-3">
                      {dietDerived.trainingMeals.map((meal, index) => (
                        <MealRow key={meal.label} meal={meal} index={index} />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-white/45 bg-[rgba(255,255,255,0.16)] p-4 text-sm text-muted-foreground backdrop-blur-xl">
                      暂无训练日配额数据。
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="rest" className="mt-0">
                  {dietDerived?.restMeals.length ? (
                    <div className="space-y-3">
                      {dietDerived.restMeals.map((meal, index) => (
                        <MealRow key={meal.label} meal={meal} index={index} />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-[rgba(141,121,170,0.18)] bg-white/75 p-4 text-sm text-muted-foreground">
                      暂无休息日配额数据。
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </SectionShell>

            <SectionShell
              eyebrow="Timeline"
              title="训练日餐序"
              description="用时间顺序查看训练日前后的进食安排，方便直接照着执行，而不是自己再去拼接餐次。"
            >
              {dietDerived?.scenarioTimeline ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {dietDerived.scenarioTimeline.steps.map((step, index) => (
                    <motion.div
                      key={`${step.label}-${index}`}
                      layout
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.24, delay: index * 0.04 }}
                      className="timeline-shell rounded-lg p-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-white/35 bg-[linear-gradient(180deg,rgba(154,136,181,0.92),rgba(118,100,146,0.94))] text-sm font-semibold text-white shadow-[0_10px_24px_rgba(113,96,143,0.2)]">
                          {index + 1}
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                            {step.slot}
                          </div>
                          <div className="mt-1 text-base font-semibold text-foreground">
                            {step.label}
                          </div>
                          {step.quota_type ? (
                            <div className="mt-2 text-sm text-muted-foreground">
                              配额类型：{step.quota_type}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-white/45 bg-[rgba(255,255,255,0.16)] p-4 text-sm text-muted-foreground backdrop-blur-xl">
                  无力训场景没有训练日餐序。
                </div>
              )}
            </SectionShell>

            <SectionShell
              eyebrow="Formula"
              title="计算步骤"
              description="保留全部计算逻辑，便于校验公式来源和结果推导；默认折叠，避免打断日常使用。"
            >
              <Card className="border-0 bg-transparent shadow-none">
                <CardContent className="p-0">
                  <Accordion type="single" collapsible className="w-full space-y-3">
                    <AccordionItem
                      value="bmr"
                      className="glass-subtle rounded-lg px-5"
                    >
                      <AccordionTrigger>1. 基础代谢</AccordionTrigger>
                      <AccordionContent className="space-y-2 text-sm leading-6 text-muted-foreground">
                        <div>男性：体重×9.99 + 身高×6.25 - 年龄×4.92 + 5</div>
                        <div>女性：体重×9.99 + 身高×6.25 - 年龄×4.92 - 161</div>
                        <div>计算结果：{formatCalories(calorieDerived ? roundValue(calorieDerived.bmr) : null)}</div>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem
                      value="tdee"
                      className="glass-subtle rounded-lg px-5"
                    >
                      <AccordionTrigger>2. 无运动总消耗</AccordionTrigger>
                      <AccordionContent className="space-y-2 text-sm leading-6 text-muted-foreground">
                        <div>无运动总消耗 = 基础代谢 ÷ 0.7</div>
                        <div>计算结果：{formatCalories(calorieDerived ? roundValue(calorieDerived.tdee) : null)}</div>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem
                      value="training"
                      className="glass-subtle rounded-lg px-5"
                    >
                      <AccordionTrigger>3. 运动消耗</AccordionTrigger>
                      <AccordionContent className="space-y-2 text-sm leading-6 text-muted-foreground">
                        <div>力训消耗：{formatCalories(calorieDerived ? roundValue(calorieDerived.strengthCalories) : null)}</div>
                        <div>有氧消耗：{formatCalories(calorieDerived ? roundValue(calorieDerived.cardioDaily) : null)}</div>
                        {calorieDerived?.cardioDetails?.length ? (
                          <div className="space-y-1">
                            {calorieDerived.cardioDetails.map((detail) => (
                              <div key={detail.id}>
                                {detail.label}：{detail.weeklyHours}h/周，日均{" "}
                                {formatCalories(
                                  detail.dailyCalories == null
                                    ? null
                                    : roundValue(detail.dailyCalories)
                                )}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem
                      value="balance"
                      className="glass-subtle rounded-lg px-5"
                    >
                      <AccordionTrigger>4. 平衡热量</AccordionTrigger>
                      <AccordionContent className="space-y-2 text-sm leading-6 text-muted-foreground">
                        <div>
                          训练日平衡热量 = 无运动总消耗 + 力训消耗 + 有氧消耗 ={" "}
                          {formatCalories(
                            calorieDerived
                              ? roundValue(calorieDerived.trainingDayBalance)
                              : null
                          )}
                        </div>
                        <div>
                          休息日平衡热量 = 无运动总消耗 + 有氧消耗 ={" "}
                          {formatCalories(
                            calorieDerived
                              ? roundValue(calorieDerived.restDayBalance)
                              : null
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem
                      value="goal"
                      className="glass-subtle rounded-lg px-5"
                    >
                      <AccordionTrigger>5. 目标热量</AccordionTrigger>
                      <AccordionContent className="space-y-2 text-sm leading-6 text-muted-foreground">
                        <div>目标系数：{calorieDerived ? calorieDerived.targetMultiplier : "—"}</div>
                        <div>
                          训练日目标热量 = 训练日平衡热量 × 系数 ={" "}
                          {formatCalories(
                            calorieDerived
                              ? roundValue(calorieDerived.trainingDayTargetCalories)
                              : null
                          )}
                        </div>
                        <div>
                          休息日目标热量 = 休息日平衡热量 × 系数 ={" "}
                          {formatCalories(
                            calorieDerived
                              ? roundValue(calorieDerived.restDayTargetCalories)
                              : null
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem
                      value="intake"
                      className="glass-subtle rounded-lg px-5"
                    >
                      <AccordionTrigger>6. 应吃热量</AccordionTrigger>
                      <AccordionContent className="space-y-2 text-sm leading-6 text-muted-foreground">
                        <div>
                          普遍多吃修正系数：
                          {calorieDerived ? calorieDerived.intakeAdherenceFactor : "—"}
                        </div>
                        <div>
                          训练日应吃热量 = 训练日目标热量 × 修正系数 ={" "}
                          {formatCalories(
                            calorieDerived
                              ? roundValue(calorieDerived.trainingDayEatCalories)
                              : null
                          )}
                        </div>
                        <div>
                          休息日应吃热量 = 休息日目标热量 × 修正系数 ={" "}
                          {formatCalories(
                            calorieDerived
                              ? roundValue(calorieDerived.restDayEatCalories)
                              : null
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </SectionShell>
          </div>
        </div>
      </div>
    </div>
  );
}
