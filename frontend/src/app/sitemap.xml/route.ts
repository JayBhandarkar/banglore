interface SitemapEntry {
  path: string;
  changefreq?: string;
  priority?: string;
}

const BASE_URL = "";

export async function GET() {
  const entries: SitemapEntry[] = [
    { path: "/", changefreq: "weekly", priority: "1.0" },
    { path: "/command-center", changefreq: "hourly", priority: "0.9" },
    { path: "/simulator", changefreq: "weekly", priority: "0.7" },
    { path: "/risk-map", changefreq: "hourly", priority: "0.8" },
    { path: "/resource-planner", changefreq: "daily", priority: "0.7" },
    { path: "/reports", changefreq: "daily", priority: "0.6" },
    { path: "/settings", changefreq: "monthly", priority: "0.3" },
  ];

  const urls = entries.map(
    (e) =>
      `  <url>\n    <loc>${BASE_URL}${e.path}</loc>\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`,
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
