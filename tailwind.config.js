/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // Espelha src/theme/colors.ts — mesmos valores, só duplicados aqui
      // porque o Tailwind config roda em Node puro e não importa .ts direto.
      // Se mudar um valor lá, muda aqui também.
      colors: {
        surface: "#16111b",
        surfaceContainerLowest: "#110e1b",
        surfaceContainerLow: "#1f1924",
        surfaceContainer: "#231d28",
        surfaceContainerHigh: "#2e2832",
        surfaceContainerHighest: "#39323d",
        primaryContainer: "#8a2be2",
        onPrimaryContainer: "#eed9ff",
        primary: "#dcb8ff",
        onSurface: "#eadfee",
        onSurfaceVariant: "#cfc2d7",
        outlineVariant: "#4c4354",
        secondaryContainer: "#5d3587",
        onSecondaryContainer: "#d2a6ff",
        correct: "#00c896",
        surfaceDim: {
          DEFAULT: "#080510",
          subtema: "#120e1c",
          conceito: "#1a1528",
        },
        danger: "#ff6b6b",
        warning: "#f0a030",
        info: "#60a5fa",
        success: "#22c55e",
        muted: "#a09ba8",
      },
    },
  },
  plugins: [],
}