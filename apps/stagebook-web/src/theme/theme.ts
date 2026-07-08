export const theme = {
  colors: {
    background: "#0A0A0F",
    surface: "#12121A",
    surfaceAlt: "#171722",
    gold: "#C8A84B",
    green: "#2DD4A0",
    red: "#FF5A5A",
    amber: "#F5A623",
    border: "rgba(255,255,255,0.08)",
    textPrimary: "#F7F4EA",
    textMuted: "#B7B4C7"
  },
  gradients: {
    app: ["#06060B", "#0A0A0F", "#11111A"] as const,
    card: ["rgba(200,168,75,0.12)", "rgba(18,18,26,0.96)"] as const
  },
  radius: {
    xl: 28,
    lg: 22,
    md: 16
  }
} as const;