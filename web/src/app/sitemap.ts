import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";
import { getAllPosts } from "@/lib/blog";

const STATIC_ROUTES = [
  "",
  "/demo",
  "/features",
  "/pricing",
  "/blog",
  "/docs",
  "/changelog",
  "/community",
  "/leaderboard",
  "/login",
  "/register",
  "/disclaimer",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${base}${route || "/"}`,
    lastModified: now,
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : route === "/blog" ? 0.8 : 0.6,
  }));

  let blogEntries: MetadataRoute.Sitemap = [];
  try {
    blogEntries = getAllPosts().map((post) => ({
      url: `${base}/blog/${post.slug}`,
      lastModified: post.date ? new Date(post.date) : now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));
  } catch {
    /* build sin contenido: solo rutas estáticas */
  }

  return [...staticEntries, ...blogEntries];
}
