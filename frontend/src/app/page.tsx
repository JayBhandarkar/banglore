import type { Metadata } from "next";
import EventAnalysisPage from "./event-analysis-page-client";

export const metadata: Metadata = {
  title: "TrafficOS — Event Analysis Console",
  description:
    "Configure a planned or unplanned event and forecast its citywide traffic impact in seconds.",
};

export default function Page() {
  return <EventAnalysisPage />;
}
