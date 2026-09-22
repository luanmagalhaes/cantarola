import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lá Lá Lá",
    short_name: "Lá Lá Lá",
    description:
      "Party game musical: cantarole a música usando só a sílaba lá e faça seu time adivinhar antes do tempo acabar.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#512664",
    theme_color: "#512664",
    lang: "pt-BR",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
