import { CaloriePlanner } from "@/components/calorie-planner";
import { loadAppData } from "@/lib/data";

export default function Home() {
  const data = loadAppData();

  return (
    <main className="min-h-screen overflow-x-hidden">
      <CaloriePlanner data={data} />
    </main>
  );
}
