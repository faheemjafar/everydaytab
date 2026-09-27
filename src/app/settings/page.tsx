import type { Metadata } from "next";
import { SettingsClient } from "./client";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export default function SettingsPage() {
  return <SettingsClient />;
}
