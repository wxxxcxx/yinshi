"use client";

import { useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";

import {
  applyMealSplits,
  calculateBmr,
  findMacroCell,
  formatPercent,
  getCardioPerHour,
  getFatQuota,
  getGoalMultiplier,
  getStrengthCalories,
  roundValue,
} from "@/lib/calculations";
import type { AppData, Goal, Sex, TrainingLevel } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
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
          <SelectTrigger>
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

type ResponsiveNumberProps = {
  value: string;
  onChange: (value: string) => void;
  min: number;
  max: number;
  step?: number;
};

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
      <div className="space-y-2 md:hidden">
        <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm">
          <span className="text-muted-foreground">当前值</span>
          <span className="font-medium">{value || "0"}</span>
        </div>
        <input
          type="range"
          className="h-2 w-full accent-primary"
          min={min}
          max={max}
          step={step}
          value={sliderValue}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
      <div className="hidden md:block">
        <Input
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
    return data.mealSequences.sequences.map((sequence) => ({
      value: sequence.id,
      label: sequence.label,
    }));
  }, [data.mealSequences.sequences]);

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

  const derived = useMemo(() => {
    if (!numericInputs.isValid) return null;

    const heightCm = numericInputs.heightValue;
    const weightKg = numericInputs.weightValue;
    const ageYears = numericInputs.ageValue;
    const isNoStrength = scenarioId === "no_strength";
    const strengthLevel = isNoStrength ? "none" : trainingLevel;

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
      strengthLevel
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
        const dailyCalories = perHour
          ? (perHour * weeklyHours) / 7
          : null;
        return {
          id: item.id,
          label: buildCardioLabel(item.group, item.label),
          weeklyHours,
          perHour,
          dailyCalories: dailyCalories ?? null,
        };
      })
      .filter(
        (entry): entry is NonNullable<typeof entry> => entry !== null
      );

    const cardioDaily = cardioDetails.reduce((total, entry) => {
      if (!entry || entry.dailyCalories == null) return total;
      return total + entry.dailyCalories;
    }, 0);

    const trainingDayBalance = tdee + strengthCalories + cardioDaily;
    const restDayBalance = tdee + cardioDaily;

    const multiplier = getGoalMultiplier(data.constants, goal);
    const trainingDayCalories = trainingDayBalance * multiplier;
    const restDayCalories = restDayBalance * multiplier;

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

    const scenario = data.mealSplits.goals[goal]?.scenarios[scenarioId];
    const trainingSplits = scenario?.training ?? [];
    const restSplits = scenario?.rest ?? [];

    const trainingMeals =
      trainCarbTotal != null && proteinTotal != null
        ? applyMealSplits(trainingSplits, trainCarbTotal, proteinTotal)
        : [];

    const restMeals =
      restCarbTotal != null && proteinTotal != null
        ? applyMealSplits(restSplits, restCarbTotal, proteinTotal)
        : [];

    return {
      isNoStrength,
      strengthLevel,
      heightCm,
      weightKg,
      ageYears,
      bmr,
      tdee,
      strengthCalories,
      cardioDaily,
      cardioDetails,
      trainingDayBalance,
      restDayBalance,
      multiplier,
      trainingDayCalories,
      restDayCalories,
      macroCell,
      trainCarbTotal,
      restCarbTotal,
      proteinTotal,
      fatTotal,
      trainingMeals,
      restMeals,
      scenario,
      scenarioTimeline: data.mealSequences.sequences.find(
        (sequence) => sequence.id === scenarioId
      ),
    };
  }, [
    numericInputs,
    scenarioId,
    trainingLevel,
    cardioEntries,
    sex,
    goal,
    data.constants,
    data.cardio,
    data.macroTables,
    data.mealSplits,
    data.mealSequences.sequences,
  ]);

  const addCardio = () => {
    const first = data.cardio.items[0];
    if (!first) return;
    setCardioEntries((prev) => [
      ...prev,
      {
        id: first.id,
        hours: "0",
      },
    ]);
  };

  const updateCardio = (index: number, patch: Partial<CardioEntry>) => {
    setCardioEntries((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, ...patch } : entry))
    );
  };

  const removeCardio = (index: number) => {
    setCardioEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const showWarning =
    derived?.isNoStrength && goal === "bulk" ? true : false;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr]">
      <section className="space-y-5">
        <Card className="surface-card border-border/60">
          <CardHeader>
            <CardTitle className="font-display text-2xl">基础信息</CardTitle>
            <CardDescription>用于估算基础代谢和总消耗。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">身高 (cm)</label>
                <ResponsiveNumberInput
                  value={height}
                  onChange={setHeight}
                  min={120}
                  max={230}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">体重 (kg)</label>
                <ResponsiveNumberInput
                  value={weight}
                  onChange={setWeight}
                  min={30}
                  max={200}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">年龄</label>
                <ResponsiveNumberInput
                  value={age}
                  onChange={setAge}
                  min={12}
                  max={80}
                />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">性别</label>
                <ResponsiveSelect
                  value={sex}
                  onChange={(value) => setSex(value as Sex)}
                  placeholder="选择性别"
                  options={sexOptions}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">目标</label>
                <ResponsiveSelect
                  value={goal}
                  onChange={(value) => setGoal(value as Goal)}
                  placeholder="选择目标"
                  options={goalOptions}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="surface-card border-border/60">
          <CardHeader>
            <CardTitle className="font-display text-2xl">训练设置</CardTitle>
            <CardDescription>用于选择力训强度与餐序场景。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">训练水平</label>
                <ResponsiveSelect
                  value={
                    scenarioId === "no_strength" ? "none" : trainingLevel
                  }
                  onChange={(value) => setTrainingLevel(value as TrainingLevel)}
                  placeholder="选择训练水平"
                  options={trainingLevels}
                  disabled={scenarioId === "no_strength"}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">训练时间场景</label>
                <ResponsiveSelect
                  value={scenarioId}
                  onChange={(value) => setScenarioId(value)}
                  placeholder="选择场景"
                  options={scenarioOptions}
                />
              </div>
            </div>
            {scenarioId === "no_strength" ? (
              <div className="rounded-md border border-dashed border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                无力训场景会将力训消耗记为 0，同时只展示休息日餐配额。
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="surface-card border-border/60">
          <CardHeader>
            <CardTitle className="font-display text-2xl">有氧消耗</CardTitle>
            <CardDescription>可多选项目，填写每周小时数。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {cardioEntries.length === 0 ? (
              <div className="rounded-md border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                暂无有氧项目。点击下方按钮添加。
              </div>
            ) : null}
            <div className="space-y-3">
              {cardioEntries.map((entry, index) => (
                <div
                  key={`${entry.id}-${index}`}
                  className="grid gap-3 rounded-md border border-border/60 bg-background/70 p-3 md:grid-cols-[1.6fr_0.8fr_auto]"
                >
                  <ResponsiveSelect
                    value={entry.id}
                    onChange={(value) => updateCardio(index, { id: value })}
                    placeholder="选择有氧"
                    options={data.cardio.items.map((item) => ({
                      value: item.id,
                      label: buildCardioLabel(item.group, item.label),
                    }))}
                  />
                  <ResponsiveNumberInput
                    value={entry.hours}
                    onChange={(value) => updateCardio(index, { hours: value })}
                    min={0}
                    max={20}
                    step={0.5}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-10 w-10 rounded-md"
                    onClick={() => removeCardio(index)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button type="button" onClick={addCardio} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              添加有氧项目
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-5">
        <Card className="surface-card border-border/60">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="font-display text-2xl">结果概览</CardTitle>
              <Badge className="data-chip" variant="secondary">
                g/kg 配额表
              </Badge>
              <Badge className="data-chip" variant="secondary">
                四舍五入输出
              </Badge>
            </div>
            <CardDescription>
              若缺失配额数据，将显示为 “—”。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {showWarning ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                增肌必须稳定力训。当前选择无力训场景，建议切换为减脂或添加力训。
              </div>
            ) : null}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-md border border-border/70 bg-background/80 p-4">
                <div className="text-sm text-muted-foreground">训练日热量</div>
                <div className="mt-2 text-3xl font-semibold">
                  {formatCalories(
                    derived ? roundValue(derived.trainingDayCalories) : null
                  )}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  平衡热量 e1：
                  {formatCalories(
                    derived ? roundValue(derived.trainingDayBalance) : null
                  )}
                </div>
              </div>
              <div className="rounded-md border border-border/70 bg-background/80 p-4">
                <div className="text-sm text-muted-foreground">休息日热量</div>
                <div className="mt-2 text-3xl font-semibold">
                  {formatCalories(
                    derived ? roundValue(derived.restDayCalories) : null
                  )}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  平衡热量 e2：
                  {formatCalories(
                    derived ? roundValue(derived.restDayBalance) : null
                  )}
                </div>
              </div>
            </div>
            <Separator />
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-md bg-muted/40 p-3">
                <div className="text-xs text-muted-foreground">训练日碳水</div>
                <div className="mt-1 text-lg font-semibold">
                  {formatMacroValue(derived?.trainCarbTotal ?? null)}
                </div>
              </div>
              <div className="rounded-md bg-muted/40 p-3">
                <div className="text-xs text-muted-foreground">休息日碳水</div>
                <div className="mt-1 text-lg font-semibold">
                  {formatMacroValue(derived?.restCarbTotal ?? null)}
                </div>
              </div>
              <div className="rounded-md bg-muted/40 p-3">
                <div className="text-xs text-muted-foreground">每日蛋白</div>
                <div className="mt-1 text-lg font-semibold">
                  {formatMacroValue(derived?.proteinTotal ?? null)}
                </div>
              </div>
              <div className="rounded-md bg-muted/40 p-3">
                <div className="text-xs text-muted-foreground">每日脂肪</div>
                <div className="mt-1 text-lg font-semibold">
                  {formatMacroValue(derived?.fatTotal ?? null)}
                </div>
              </div>
              <div className="rounded-md bg-muted/40 p-3 md:col-span-2">
                <div className="text-xs text-muted-foreground">配额匹配</div>
                <div className="mt-1 text-sm">
                  {derived?.macroCell
                    ? `匹配表格：${derived.macroCell.matchedHeight}cm / ${derived.macroCell.matchedWeight}kg → ${derived.macroCell.sourceValue}`
                    : "暂无匹配配额"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="surface-card border-border/60">
          <CardHeader>
            <CardTitle className="font-display text-2xl">每餐配额</CardTitle>
            <CardDescription>百分比来自 Excel 占位符格式。</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="training" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="training">训练日</TabsTrigger>
                <TabsTrigger value="rest">休息日</TabsTrigger>
              </TabsList>
              <TabsContent value="training">
                {derived?.isNoStrength ? (
                  <div className="rounded-md border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                    无力训场景不展示训练日配额。
                  </div>
                ) : (
                  <div className="space-y-3">
                    {derived?.trainingMeals.length ? (
                      derived.trainingMeals.map((meal) => (
                        <div
                          key={meal.label}
                          className="grid gap-2 rounded-md border border-border/60 bg-background/70 p-3 md:grid-cols-[1.4fr_1fr_1fr]"
                        >
                          <div className="text-sm font-medium">
                            {meal.label}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            碳水 {formatMacroValue(meal.carbs_g)} ({
                            formatPercent(meal.carbs_pct)
                            })
                          </div>
                          <div className="text-sm text-muted-foreground">
                            蛋白 {formatMacroValue(meal.protein_g)} ({
                            formatPercent(meal.protein_pct)
                            })
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-md border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                        暂无训练日配额数据。
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="rest">
                <div className="space-y-3">
                  {derived?.restMeals.length ? (
                    derived.restMeals.map((meal) => (
                      <div
                        key={meal.label}
                        className="grid gap-2 rounded-md border border-border/60 bg-background/70 p-3 md:grid-cols-[1.4fr_1fr_1fr]"
                      >
                        <div className="text-sm font-medium">{meal.label}</div>
                        <div className="text-sm text-muted-foreground">
                          碳水 {formatMacroValue(meal.carbs_g)} ({
                          formatPercent(meal.carbs_pct)
                          })
                        </div>
                        <div className="text-sm text-muted-foreground">
                          蛋白 {formatMacroValue(meal.protein_g)} ({
                          formatPercent(meal.protein_pct)
                          })
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-md border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                      暂无休息日配额数据。
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="surface-card border-border/60">
          <CardHeader>
            <CardTitle className="font-display text-2xl">训练日餐序</CardTitle>
            <CardDescription>餐序来自饮食计划文档。</CardDescription>
          </CardHeader>
          <CardContent>
            {derived?.scenarioTimeline ? (
              <div className="flex flex-wrap gap-2">
                {derived.scenarioTimeline.steps.map((step, index) => (
                  <div
                    key={`${step.label}-${index}`}
                    className="flex items-center gap-2 rounded-md border border-border/60 bg-background/70 px-3 py-1 text-sm"
                  >
                    <span className="text-xs text-muted-foreground">
                      {index + 1}
                    </span>
                    <span>{step.label}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                无力训场景没有训练日餐序。
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="surface-card border-border/60">
          <CardHeader>
            <CardTitle className="font-display text-2xl">计算步骤</CardTitle>
            <CardDescription>严格按文档公式输出。</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="bmr">
                <AccordionTrigger>1. 基础代谢 BMR</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm text-muted-foreground">
                  <div>
                    男性：体重×9.99 + 身高×6.25 - 年龄×4.92 + 5
                  </div>
                  <div>
                    女性：体重×9.99 + 身高×6.25 - 年龄×4.92 - 161
                  </div>
                  <div>
                    计算结果：
                    {formatCalories(
                      derived ? roundValue(derived.bmr) : null
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="tdee">
                <AccordionTrigger>2. 无运动总消耗 b</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm text-muted-foreground">
                  <div>b = BMR ÷ 0.7</div>
                  <div>
                    计算结果：
                    {formatCalories(
                      derived ? roundValue(derived.tdee) : null
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="training">
                <AccordionTrigger>3. 运动消耗 c / d</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm text-muted-foreground">
                  <div>
                    力训消耗 c：{formatCalories(
                      derived ? roundValue(derived.strengthCalories) : null
                    )}
                  </div>
                  <div>
                    有氧消耗 d：{formatCalories(
                      derived ? roundValue(derived.cardioDaily) : null
                    )}
                  </div>
                  {derived?.cardioDetails?.length ? (
                    <div className="space-y-1">
                      {derived.cardioDetails.map((detail) => (
                        <div key={detail.id}>
                          {detail.label}：
                          {detail.weeklyHours}h/周，日均 {formatCalories(
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
              <AccordionItem value="balance">
                <AccordionTrigger>4. 平衡热量 e1 / e2</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm text-muted-foreground">
                  <div>
                    力训日 e1 = b + c + d = {formatCalories(
                      derived ? roundValue(derived.trainingDayBalance) : null
                    )}
                  </div>
                  <div>
                    休息日 e2 = b + d = {formatCalories(
                      derived ? roundValue(derived.restDayBalance) : null
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="goal">
                <AccordionTrigger>5. 目标热量 f1 / f2</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm text-muted-foreground">
                  <div>
                    目标系数：{derived ? derived.multiplier : "—"}
                  </div>
                  <div>
                    力训日 f1 = e1 × 系数 = {formatCalories(
                      derived ? roundValue(derived.trainingDayCalories) : null
                    )}
                  </div>
                  <div>
                    休息日 f2 = e2 × 系数 = {formatCalories(
                      derived ? roundValue(derived.restDayCalories) : null
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
