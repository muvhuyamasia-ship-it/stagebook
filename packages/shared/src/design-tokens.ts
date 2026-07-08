export const STAGEBOOK_DESIGN_TOKENS = {
  colors: {
    background: "#0B0B0B",
    backgroundElevated: "#111111",
    surface: "#161616",
    surfaceAlt: "#1C1C1C",
    border: "#2A2A2A",
    borderGold: "rgba(203, 168, 72, 0.45)",
    gold: "#CBA848",
    goldMuted: "#9A8A0F",
    goldSoft: "rgba(203, 168, 72, 0.14)",
    textPrimary: "#F5F2EA",
    textMuted: "#A8A29E",
    success: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444",
    disabled: "#374151"
  },
  gradients: {
    app: ["#060606", "#0B0B0B", "#141414"] as const,
    card: ["rgba(203, 168, 72, 0.1)", "rgba(22, 22, 22, 0.98)"] as const,
    goldButton: ["#E2C76A", "#CBA848", "#9A8A0F"] as const
  },
  radius: {
    xl: 28,
    lg: 20,
    md: 14,
    sm: 10,
    pill: 999
  },
  spacing: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48
  },
  typography: {
    display: '"Cormorant Garamond", Georgia, serif',
    body: '"Outfit", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  }
} as const;