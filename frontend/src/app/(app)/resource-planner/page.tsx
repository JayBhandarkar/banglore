import type { Metadata } from "next";
import ResourcePlanner from "./resource-planner-client";

export const metadata: Metadata = {
  title: "Resource Planner — TrafficOS",
  description: "Optimize police, barricades, and diversion routes for active events.",
};

export default function Page() {
  return <ResourcePlanner />;
}
