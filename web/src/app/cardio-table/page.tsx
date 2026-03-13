import Link from "next/link";

import { loadAppData } from "@/lib/data";

export default function CardioTablePage() {
  const { cardio } = loadAppData();

  const groupedItems = cardio.items.reduce<
    Array<{
      group: string;
      items: typeof cardio.items;
    }>
  >((groups, item) => {
    const existing = groups.find((group) => group.group === item.group);
    if (existing) {
      existing.items.push(item);
      return groups;
    }

    groups.push({
      group: item.group,
      items: [item],
    });
    return groups;
  }, []);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-5 py-8 md:px-8 md:py-10">
      <section className="hero-shell rounded-xl px-6 py-8 md:px-10 md:py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-4">
            <div className="hero-badge">Cardio Reference</div>
            <div className="space-y-2">
              <h1 className="font-display text-4xl leading-tight text-[var(--color-hero-ink)] md:text-5xl">
                有氧消耗表
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">
                按体重档位查看每小时有氧热量消耗。主页面里的“有氧消耗”计算会直接引用这份表，再结合每周时长折算成日均热量。
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

      <section className="panel-shell rounded-xl p-6 md:p-8">
        <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              {cardio.meta.title}
            </h2>
            <p className="text-sm leading-7 text-muted-foreground">
              单位：每小时 {cardio.meta.unit_per_hour}。体重从 80kg 开始按数据说明做了大体重修正。
            </p>
          </div>
          <div className="glass-subtle rounded-lg px-4 py-4 text-sm leading-7 text-muted-foreground">
            数据来源：{cardio.meta.source}
          </div>
        </div>

        {cardio.meta.usage_notes?.length ? (
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {cardio.meta.usage_notes.map((note, index) => (
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

      {groupedItems.map((group) => (
        <section
          key={group.group}
          className="panel-shell rounded-xl p-6 md:p-8"
        >
          <div className="mb-5 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-hero-ink)]/70">
              Cardio Group
            </div>
            <h2 className="text-2xl font-semibold text-foreground whitespace-pre-line">
              {group.group}
            </h2>
          </div>

          <div className="overflow-x-auto rounded-lg border border-white/40 bg-[rgba(255,255,255,0.14)] backdrop-blur-xl">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/30 text-left">
                  <th className="sticky left-0 z-10 bg-[rgba(235,245,255,0.78)] px-4 py-4 font-semibold text-foreground backdrop-blur-xl">
                    项目
                  </th>
                  <th className="bg-[rgba(235,245,255,0.52)] px-4 py-4 font-semibold text-foreground">
                    每公斤参考
                  </th>
                  {cardio.meta.weights_kg.map((weight) => (
                    <th
                      key={weight}
                      className="bg-[rgba(235,245,255,0.52)] px-4 py-4 font-semibold text-foreground"
                    >
                      {weight} kg
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {group.items.map((item, rowIndex) => (
                  <tr
                    key={item.id}
                    className={rowIndex % 2 === 0 ? "bg-[rgba(255,255,255,0.06)]" : ""}
                  >
                    <td className="sticky left-0 z-10 bg-[rgba(244,249,255,0.8)] px-4 py-4 font-medium text-foreground backdrop-blur-xl">
                      {item.label}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {item.per_kg}
                    </td>
                    {cardio.meta.weights_kg.map((weight) => (
                      <td
                        key={`${item.id}-${weight}`}
                        className="px-4 py-4 text-muted-foreground"
                      >
                        {item.per_hour[String(weight)] ?? "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {cardio.meta.data_source_note ? (
        <section className="panel-shell rounded-xl p-6 md:p-8">
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-hero-ink)]/70">
              Notes
            </div>
            <h2 className="text-2xl font-semibold text-foreground">数据说明</h2>
            <div className="glass-subtle rounded-lg px-5 py-4 whitespace-pre-line text-sm leading-7 text-muted-foreground">
              {cardio.meta.data_source_note}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
