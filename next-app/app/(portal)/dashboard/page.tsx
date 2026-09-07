import { DashboardOverview } from "@/components/dashboard-overview";
import { AccessGate } from "@/components/access-gate";

export default function DashboardPage() { return <AccessGate resource="dashboard"><DashboardOverview /></AccessGate>; }
