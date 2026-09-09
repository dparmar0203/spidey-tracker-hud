import WebSenseHUD from "@/components/WebSenseHUD";
import { getOverviewStats } from "@/app/actions";

export default async function Home() {
  const overview = await getOverviewStats();

  return <WebSenseHUD overview={overview} />;
}
