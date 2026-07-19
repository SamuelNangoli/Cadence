import type { MetadataRoute } from "next";

/** Drives the Android / desktop "install app" experience and home-screen name. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cadence — one board for every client",
    short_name: "Cadence",
    description: "Plan, approve, and publish every client's month from one board.",
    start_url: "/",
    display: "standalone",
    background_color: "#0A192C",
    theme_color: "#0A192C",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
