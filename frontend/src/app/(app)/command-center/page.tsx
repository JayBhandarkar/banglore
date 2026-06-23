import type { Metadata } from "next";
import CommandCenter from "./command-center-client";

export const metadata: Metadata = {
  title: "Command Center — TrafficOS",
  description:
    "Live event-driven traffic intelligence for Bengaluru: impact prediction, resource recommendations, and risk corridors.",
};

export default function Page() {
  return <CommandCenter />;
}
