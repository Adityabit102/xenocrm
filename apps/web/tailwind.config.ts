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
        /* Cove — warm light pastel palette (teal · sage · cream · dusty rose · mauve) */
        "bg-void":    "#ECE3D0",
        "bg-base":    "#F4EEDF",
        "bg-surface": "#FBF7EC",
        "bg-elevated":"#FFFFFF",
        "bg-overlay": "#FFFFFF",


        surface:                    "#FBF7EC",
        "surface-dim":              "#F1EADA",
        "surface-bright":           "#FFFFFF",
        "surface-container-lowest": "#FFFFFF",
        "surface-container-low":    "#F8F3E7",
        "surface-container":        "#F3EDDD",
        "surface-container-high":   "#ECE4D3",
        "surface-container-highest":"#E4DAC8",
        "surface-variant":          "#E9E0CF",
        "surface-tint":             "#3E8A9E",


        primary:                "#3E8A9E",
        "primary-container":    "#3E8A9E",
        "on-primary":           "#FFFFFF",
        "on-primary-container": "#FFFFFF",
        "primary-fixed":        "#D2E7EC",
        "primary-fixed-dim":    "#9BC6D1",
        "inverse-primary":      "#2C6A7B",
        "on-primary-fixed":     "#0E3640",
        "on-primary-fixed-variant": "#1F5564",


        secondary:                    "#DCEEE9",
        "secondary-container":        "#9CC3BB",
        "secondary-fixed":            "#BFDDD6",
        "secondary-fixed-dim":        "#4E9B8A",
        "on-secondary":               "#FFFFFF",
        "on-secondary-container":     "#22564A",
        "on-secondary-fixed":         "#0D3A30",
        "on-secondary-fixed-variant": "#2F6E5B",


        tertiary:                    "#D9B8B0",
        "tertiary-container":        "#C98E83",
        "tertiary-fixed":            "#ECDCD9",
        "tertiary-fixed-dim":        "#C98E83",
        "on-tertiary":               "#FFFFFF",
        "on-tertiary-container":     "#7A4A41",
        "on-tertiary-fixed":         "#4A2A24",
        "on-tertiary-fixed-variant": "#8A5750",


        "text-primary":          "#38322E",
        "text-secondary":        "#8A7F76",
        "on-surface":            "#38322E",
        "on-surface-variant":    "#6E635D",
        "on-background":         "#38322E",
        "inverse-on-surface":    "#F4EEDF",
        "inverse-surface":       "#38322E",
        background:              "#F4EEDF",


        "border-subtle":  "#E5DBC9",
        "border-mid":     "#D8CCB6",
        outline:          "#B0A89C",
        "outline-variant":"#C9BFB0",


        "status-info":    "#4D8FA8",
        "status-warn":    "#C9954E",
        "status-danger":  "#CC6B6B",
        error:            "#CC6B6B",
        "error-container":"#F6DAD5",
        "on-error":       "#FFFFFF",
        "on-error-container": "#7A2E2E",


        "brand-primary":        "#3E8A9E",
        "brand-primary-hover":  "#2C6A7B",
        "brand-primary-light":  "rgba(62,138,158,0.12)",
        "brand-secondary":      "#4E9B8A",
        "brand-accent-ai":      "#C98E83",
        "brand-accent-ai-light":"rgba(201,142,131,0.14)",
        "success-custom":       "#4E9B8A",
        "success-light":        "rgba(78,155,138,0.16)",
        "warning-custom":       "#C9954E",
        "warning-light":        "rgba(201,149,78,0.16)",
        "error-custom":         "#CC6B6B",
        "error-light":          "rgba(204,107,107,0.15)",
        "info-custom":          "#4D8FA8",
        "info-light":           "rgba(77,143,168,0.15)",
        "purple-custom":        "#9C8482",
        "purple-light":         "rgba(156,132,130,0.15)",


        whatsapp: "#2FA56F",
        sms:      "#8A7F76",
        email:    "#4D8FA8",
        rcs:      "#C98E83",
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
        "glow-indigo": "0 0 40px rgba(62,138,158,0.22)",
        "glow-mint":   "0 0 30px rgba(78,155,138,0.20)",
        "glow-card":   "0 12px 32px -8px rgba(99,86,70,0.18)",
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
