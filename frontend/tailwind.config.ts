import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gestura: {
          bg: "#F7F9F7",
          "bg-secondary": "#DDF3F0",
          surface: "#FFFFFF",
          text: "#17312F",
          "text-secondary": "#4A6260",
          border: "#DDF3F0",
          success: "#10B981",
          warning: "#F5C45B",
          error: "#EF4444",
        },
        background: "#F7F9F7",
        surface: {
          DEFAULT: "#FFFFFF",
          cream: "#F7F9F7",
          secondary: "#DDF3F0",
          dark: "#17312F",
          card: "#FFFFFF",
        },
        primary: {
          DEFAULT: "#0F766E",
          hover: "#0B554E",
          light: "#DDF3F0",
          dark: "#083C37",
        },
        secondary: {
          DEFAULT: "#17312F",
          hover: "#0F201F",
          light: "#DDF3F0",
          dark: "#050909",
        },
        accent: {
          DEFAULT: "#F5C45B",
          light: "#FDF5DF",
        },
        ink: {
          DEFAULT: "#17312F",
          muted: "#4A6260",
          subtle: "#94A3B8",
          border: "#DDF3F0",
        },
        danger: {
          DEFAULT: "#EF4444",
          hover: "#B91C1C",
          light: "#FEE2E2",
        },
        success: {
          DEFAULT: "#10B981",
          hover: "#059669",
          light: "#D1FAE5",
        },
        warning: {
          DEFAULT: "#F5C45B",
          hover: "#D97706",
          light: "#FEF3C7",
        },
      },
      boxShadow: {
        "soft-sm": "0 1px 2px rgba(45, 36, 33, 0.04), 0 2px 6px rgba(45, 36, 33, 0.03)",
        soft: "0 1px 3px rgba(45, 36, 33, 0.05), 0 8px 24px rgba(45, 36, 33, 0.07)",
        "soft-md": "0 2px 6px rgba(45, 36, 33, 0.05), 0 12px 32px rgba(45, 36, 33, 0.09)",
        "soft-lg": "0 4px 12px rgba(45, 36, 33, 0.06), 0 20px 48px rgba(45, 36, 33, 0.12)",
        "soft-xl": "0 8px 24px rgba(45, 36, 33, 0.07), 0 32px 64px rgba(45, 36, 33, 0.15)",
        // Aliases for any remaining neo-* references in inner pages
        "neo-sm": "0 1px 2px rgba(45, 36, 33, 0.04), 0 2px 6px rgba(45, 36, 33, 0.03)",
        neo: "0 1px 3px rgba(45, 36, 33, 0.05), 0 8px 24px rgba(45, 36, 33, 0.07)",
        "neo-md": "0 2px 6px rgba(45, 36, 33, 0.05), 0 12px 32px rgba(45, 36, 33, 0.09)",
        "neo-lg": "0 4px 12px rgba(45, 36, 33, 0.06), 0 20px 48px rgba(45, 36, 33, 0.12)",
        "neo-xl": "0 8px 24px rgba(45, 36, 33, 0.07), 0 32px 64px rgba(45, 36, 33, 0.15)",
        "neo-primary": "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(212, 112, 85, 0.2)",
        "neo-blue": "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(212, 112, 85, 0.2)",
        "neo-danger": "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(220, 38, 38, 0.15)",
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
        "4xl": "28px",
      },
      borderWidth: {
        "3": "1px",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
        display: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      keyframes: {
        "pulse-subtle": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.85", transform: "scale(1.03)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "landmark-pulse": {
          "0%, 100%": { opacity: "0.7", r: "2.4" },
          "50%": { opacity: "1", r: "3.2" },
        },
      },
      animation: {
        "pulse-subtle": "pulse-subtle 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in-up": "fade-in-up 0.6s ease-out both",
        "landmark-pulse": "landmark-pulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
