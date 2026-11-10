import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ToEat List",
    short_name: "ToEat",
    description: "Our group's list of places worth eating at",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf8f4",
    theme_color: "#d9480f",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
