import type { Metadata } from "next";
import { FavoritesClient } from "./client";

export const metadata: Metadata = {
  title: "Favorites",
  robots: { index: false, follow: false },
};

export default function FavoritesPage() {
  return <FavoritesClient />;
}
