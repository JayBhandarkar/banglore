import type { Metadata } from "next";
import RiskMap from "./risk-map-client";

export const metadata: Metadata = {
  title: "Risk Map — TrafficOS",
  description: "Citywide risk heatmap and corridor monitoring.",
};

export default function Page() {
  return <RiskMap />;
}
