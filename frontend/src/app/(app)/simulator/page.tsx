import type { Metadata } from "next";
import Simulator from "./simulator-client";

export const metadata: Metadata = {
  title: "Event Simulator — TrafficOS",
  description: "Model hypothetical events and compare resource needs.",
};

export default function Page() {
  return <Simulator />;
}
