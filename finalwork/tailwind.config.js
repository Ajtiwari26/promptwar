/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        obsidian: {
          canvas: "#09090B",
          card: "#18181B",
          border: "#27272A",
          muted: "#71717A",
          text: "#FAFAFA",
        },
        semantic: {
          severe: "#DC2626",      // Crimson border/badge
          severeBg: "#450A0A",    // Dark crimson bg
          poor: "#F59E0B",        // Amber border/badge
          poorBg: "#451A03",      // Dark amber bg
          normal: "#10B981",      // Emerald border/badge
          normalBg: "#022C22",    // Dark emerald bg
          fault: "#A1A1AA",       // Monochrome fault
          faultBg: "#27272A",     // Fault dark bg
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      }
    },
  },
  plugins: [],
}
