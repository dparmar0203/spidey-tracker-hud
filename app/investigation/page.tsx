import InvestigationView from "@/components/InvestigationView";
import { getInvestigationData } from "@/app/actions";

// The dataset is historical/static, so cache the heavy full-table fetch +
// server-side classification for an hour instead of recomputing per request.
export const revalidate = 3600;

export default async function InvestigationPage() {
  const data = await getInvestigationData();

  return (
    <section className="flex flex-1 flex-col px-4 py-6 sm:px-6">
      <InvestigationView data={data} />
    </section>
  );
}
