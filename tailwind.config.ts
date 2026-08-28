import type { Config } from "tailwindcss";

// Paleta e tipografia do template. Para reaproveitar em outro cliente,
// troque os valores aqui — os componentes não precisam mudar.
const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/content/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#12181B",       // fundo escuro principal
        paper: "#F4F1E9",     // fundo claro / texto sobre o ink
        amber: "#E8A33D",     // cor de destaque (CTA, links, hover)
        teal: "#3E6259",      // cor secundária (bordas, ícones, apoio)
        muted: "#8A9290",     // texto secundário
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        body: ["var(--font-display)", "sans-serif"],
        mono: ["var(--font-display)", "monospace"],
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
