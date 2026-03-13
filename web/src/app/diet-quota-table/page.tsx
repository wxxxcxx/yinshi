import Link from "next/link";

import { loadAppData } from "@/lib/data";
import type { Goal, MacroQuotaTable, Sex } from "@/lib/types";

function parseQuotaValue(value: string | null) {
  if (!value) {
    return {
      trainCarbs: "—",
      restCarbs: "—",
      protein: "—",
    };
  }

  const [trainCarbs, restCarbs, protein] = value.split("/");

  return {
    trainCarbs: trainCarbs ? `${trainCarbs} g/kg` : "—",
    restCarbs: restCarbs ? `${restCarbs} g/kg` : "—",
    protein: protein ? `${protein} g/kg` : "—",
  };
}

function getSectionTitle(sex: Sex, goal: Goal) {
  return `${sex === "male" ? "男性" : "女性"} · ${
    goal === "cut" ? "减脂" : "增肌"
  }`;
}

function DietQuotaTable({
  table,
  sex,
  goal,
}: {
  table: MacroQuotaTable;
  sex: Sex;
  goal: Goal;
}) {
  return (
    <section className="panel-shell rounded-xl p-6 md:p-8">
      <div className="mb-5 space-y-2">
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-hero-ink)]/70">
          Diet Quota
        </div>
        <h2 className="text-2xl font-semibold text-foreground">
          {getSectionTitle(sex, goal)}
        </h2>
        <p className="text-sm leading-7 text-muted-foreground">
          单元格依次显示训练日碳水、休息日碳水、每日蛋白质，单位均为 `g/kg`。
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-white/40 bg-[rgba(255,255,255,0.14)] backdrop-blur-xl">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-white/30 text-left">
              <th className="sticky left-0 z-10 bg-[rgba(235,245,255,0.78)] px-4 py-4 font-semibold text-foreground backdrop-blur-xl">
                体重
              </th>
              {table.heights_cm.map((height) => (
                <th
                  key={height}
                  className="bg-[rgba(235,245,255,0.52)] px-4 py-4 font-semibold text-foreground"
                >
                  {height} cm
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIndex) => (
              <tr
                key={row.weight_kg}
                className={rowIndex % 2 === 0 ? "bg-[rgba(255,255,255,0.06)]" : ""}
              >
                <td className="sticky left-0 z-10 bg-[rgba(244,249,255,0.8)] px-4 py-4 font-medium text-foreground backdrop-blur-xl">
                  {row.weight_kg} kg
                </td>
                {row.values.map((value, index) => {
                  const quota = parseQuotaValue(value);

                  return (
                    <td
                      key={`${row.weight_kg}-${table.heights_cm[index]}`}
                      className="px-4 py-4 align-top text-muted-foreground"
                    >
                      <div className="space-y-1 leading-6">
                        <div>
                          训碳: <span className="text-foreground">{quota.trainCarbs}</span>
                        </div>
                        <div>
                          休碳: <span className="text-foreground">{quota.restCarbs}</span>
                        </div>
                        <div>
                          蛋白: <span className="text-foreground">{quota.protein}</span>
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {table.meta.notes?.length ? (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {table.meta.notes.map((note, index) => (
            <div
              key={`${note}-${index}`}
              className="glass-subtle rounded-lg px-4 py-3 text-sm leading-7 text-muted-foreground"
            >
              {note}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export default function DietQuotaTablePage() {
  const { macroTables } = loadAppData();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-5 py-8 md:px-8 md:py-10">
      <section className="hero-shell rounded-xl px-6 py-8 md:px-10 md:py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-4">
            <div className="hero-badge">Diet Ratio Reference</div>
            <div className="space-y-2">
              <h1 className="font-display text-4xl leading-tight text-[var(--color-hero-ink)] md:text-5xl">
                饮食配额表
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">
                按性别、目标、身高和体重查看训练日碳水、休息日碳水和每日蛋白质配额。主页面里的宏量结果会基于同一份配额数据自动匹配。
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="glass-subtle rounded-full px-4 py-2 text-sm font-medium text-[var(--color-hero-ink)]"
          >
            返回计算器
          </Link>
        </div>
      </section>

      <DietQuotaTable table={macroTables.male.cut} sex="male" goal="cut" />
      <DietQuotaTable table={macroTables.male.bulk} sex="male" goal="bulk" />
      <DietQuotaTable table={macroTables.female.cut} sex="female" goal="cut" />
      <DietQuotaTable table={macroTables.female.bulk} sex="female" goal="bulk" />
    </main>
  );
}
