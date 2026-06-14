import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        
        "bg-void":    "#0D1017",
        "bg-base":    "#0D1017",
        "bg-surface": "#111520",
        "bg-elevated":"#181D2E",
        "bg-overlay": "#1E2438",

        
        surface:                    "#111319",
        "surface-dim":              "#111319",
        "surface-bright":           "#37393f",
        "surface-container-lowest": "#0c0e13",
        "surface-container-low":    "#191b21",
        "surface-container":        "#1e1f25",
        "surface-container-high":   "#282a30",
        "surface-container-highest":"#33353a",
        "surface-variant":          "#33353a",
        "surface-tint":             "#c0c1ff",

        
        primary:                "#c0c1ff",
        "primary-container":    "#5b5fef",
        "on-primary":           "#0e00aa",
        "on-primary-container": "#f9f6ff",
        "primary-fixed":        "#e1e0ff",
        "primary-fixed-dim":    "#c0c1ff",
        "inverse-primary":      "#474adb",
        "on-primary-fixed":     "#05006c",
        "on-primary-fixed-variant": "#2c2cc3",

        
        secondary:                    "#ceffdf",
        "secondary-container":        "#01f5a0",
        "secondary-fixed":            "#50ffaf",
        "secondary-fixed-dim":        "#00e293",
        "on-secondary":               "#003921",
        "on-secondary-container":     "#006b43",
        "on-secondary-fixed":         "#002111",
        "on-secondary-fixed-variant": "#005232",

        
        tertiary:                    "#d7baff",
        "tertiary-container":        "#8a55d3",
        "tertiary-fixed":            "#eddcff",
        "tertiary-fixed-dim":        "#d7baff",
        "on-tertiary":               "#440087",
        "on-tertiary-container":     "#fdf5ff",
        "on-tertiary-fixed":         "#290055",
        "on-tertiary-fixed-variant": "#5d24a4",

        
        "text-primary":          "#EDF0FF",
        "text-secondary":        "#7B82A0",
        "on-surface":            "#e2e2e9",
        "on-surface-variant":    "#c6c5d7",
        "on-background":         "#e2e2e9",
        "inverse-on-surface":    "#2e3036",
        "inverse-surface":       "#e2e2e9",
        background:              "#111319",

        
        "border-subtle":  "#1A2035",
        "border-mid":     "#252D48",
        outline:          "#908fa0",
        "outline-variant":"#464555",

        
        "status-info":    "#4DC3FF",
        "status-warn":    "#FFB547",
        "status-danger":  "#FF4D6A",
        error:            "#ffb4ab",
        "error-container":"#93000a",
        "on-error":       "#690005",
        "on-error-container": "#ffdad6",

        
        "brand-primary":        "#5b5fef",
        "brand-primary-hover":  "#4e52d6",
        "brand-primary-light":  "rgba(91,95,239,0.12)",
        "brand-secondary":      "#00e293",
        "brand-accent-ai":      "#d7baff",
        "brand-accent-ai-light":"rgba(215,186,255,0.12)",
        "success-custom":       "#00e293",
        "success-light":        "rgba(0,226,147,0.15)",
        "warning-custom":       "#FFB547",
        "warning-light":        "rgba(255,181,71,0.15)",
        "error-custom":         "#FF4D6A",
        "error-light":          "rgba(255,77,106,0.15)",
        "info-custom":          "#4DC3FF",
        "info-light":           "rgba(77,195,255,0.15)",
        "purple-custom":        "#8a55d3",
        "purple-light":         "rgba(138,85,211,0.15)",

        
        whatsapp: "#25D366",
        sms:      "#7B82A0",
        email:    "#4DC3FF",
        rcs:      "#FF4D6A",
      },

      fontFamily: {
        
        "headline-h1": ["Syne", "sans-serif"],
        "headline-h2": ["Syne", "sans-serif"],
        "display-hero":["Syne", "sans-serif"],
        "kpi-metric":  ["Syne", "sans-serif"],
        "body-md":     ["DM Sans", "sans-serif"],
        "body-lg":     ["DM Sans", "sans-serif"],
        "label-sm":    ["DM Sans", "sans-serif"],
        "label-caps":  ["DM Sans", "sans-serif"],
        "data-mono":   ["JetBrains Mono", "monospace"],
        
        sans: ["DM Sans", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },

      fontSize: {
        "display-hero":  ["72px",  { lineHeight:"1.1",  letterSpacing:"-0.02em", fontWeight:"700" }],
        "headline-h1":   ["32px",  { lineHeight:"40px", fontWeight:"700" }],
        "headline-h2":   ["22px",  { lineHeight:"28px", fontWeight:"700" }],
        "kpi-metric":    ["44px",  { lineHeight:"1",    letterSpacing:"-0.03em", fontWeight:"800" }],
        "body-lg":       ["16px",  { lineHeight:"24px", fontWeight:"400" }],
        "body-md":       ["15px",  { lineHeight:"22px", fontWeight:"400" }],
        "label-sm":      ["13px",  { lineHeight:"18px", fontWeight:"500" }],
        "label-caps":    ["11px",  { lineHeight:"16px", letterSpacing:"0.06em", fontWeight:"600" }],
        "data-mono":     ["14px",  { lineHeight:"20px", fontWeight:"400" }],
      },

      spacing: {
        xs:  "4px",
        sm:  "8px",
        md:  "16px",
        lg:  "24px",
        xl:  "40px",
        "topbar-height":    "64px",
        "sidebar-expanded": "260px",
        "sidebar-collapsed":"68px",
        "container-max":    "1560px",
        base: "4px",
      },

      borderRadius: {
        DEFAULT: "0.125rem",
        lg:      "0.25rem",
        xl:      "0.5rem",
        "2xl":   "0.75rem",
        full:    "0.75rem",
      },

      boxShadow: {
        "glow-indigo": "0 0 40px rgba(91,95,239,0.25)",
        "glow-mint":   "0 0 30px rgba(0,226,147,0.2)",
        "glow-card":   "0 8px 32px -4px rgba(0,0,0,0.5)",
      },

      animation: {
        marquee:       "marquee 30s linear infinite",
        float:         "float 8s ease-in-out infinite",
        "float-delayed":"float 10s ease-in-out infinite reverse",
        "pulse-glow":  "slow-pulse-glow 12s ease-in-out infinite",
        "pulse-mint":  "pulse-mint 2s infinite",
        "bot-rotate":  "bot-rotate 8s linear infinite",
        "ai-reveal":   "ai-reveal 1.5s cubic-bezier(0.77,0,0.175,1) forwards",
        "count-up":    "count-up-reveal 0.4s ease forwards",
        shimmer:       "shimmer 2.5s infinite linear",
      },
    },
  },
  plugins: [],
};

export default config;
