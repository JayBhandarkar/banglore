import type { Metadata } from "next";
import SettingsPage from "./settings-client";

export const metadata: Metadata = {
  title: "Settings — TrafficOS",
};

export default function Page() {
  return <SettingsPage />;
}
