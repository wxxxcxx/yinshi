import { CaloriePlanner } from "@/components/calorie-planner";
import { loadAppData } from "@/lib/data";

export default function Home() {
  const data = loadAppData();

  return (
    <div className="min-h-screen">
      <div className="mx-auto w-full max-w-6xl px-6 py-12">
        <header className="mb-10 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-md bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
              PWA 草案
            </span>
            <span className="rounded-md border border-border/70 bg-background/70 px-3 py-1 text-xs">
              Next.js + shadcn + Tailwind
            </span>
          </div>
          <h1 className="font-display text-4xl leading-tight text-foreground md:text-5xl">
            饮食计划热量与配额计算器
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground">
            输入身高、体重与训练情况，自动匹配配额表并输出训练日/休息日热量与每餐碳水、蛋白分配。
          </p>
        </header>

        <CaloriePlanner data={data} />

        <footer className="mt-12 space-y-2 text-xs text-muted-foreground">
          <div>
            数据来源：/Users/W/Workspace/Personal/撸铁/data/*.json
          </div>
          <div>
            配额表当前来自截图提取版本，后续校对会直接更新数据文件。
          </div>
        </footer>
      </div>
    </div>
  );
}
