import type { Metadata } from "next";
import Reports from "./reports-client";

export const metadata: Metadata = {
  title: "Reports — TrafficOS",
  description: "Operational analytics, monthly trends, and incident reports.",
};

export default function Page() {
  return <Reports />;
}
