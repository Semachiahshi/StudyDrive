import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "StudyDrive",
    short_name: "StudyDrive",
    description: "Soukromá cesta k maturitě: termíny, postup a tempo.",
    lang: "cs",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f2f2f7",
    theme_color: "#f2f2f7",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
