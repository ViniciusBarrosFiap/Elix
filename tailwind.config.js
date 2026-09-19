/** @type {import('tailwindcss').Config} */
const { colors, semantic, surfaceDim } = require("./src/theme/colors.json");

module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // Fonte única em src/theme/colors.json — mudou um valor lá, muda aqui
      // (classes NativeWind podem precisar de `npx expo start -c` pra
      // recompilar) e no `colors`/`semantic` importado em JS, ambos ao mesmo
      // tempo, sem precisar editar em dois lugares.
      colors: {
        ...colors,
        ...semantic,
        surfaceDim: {
          DEFAULT: surfaceDim.base,
          subtema: surfaceDim.subtema,
          conceito: surfaceDim.conceito,
        },
      },
    },
  },
  plugins: [],
}