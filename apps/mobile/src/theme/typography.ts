import type { TextStyle } from "react-native";

export const typography = {
  display: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.6,
    lineHeight: 38
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.35,
    lineHeight: 30
  },
  headline: {
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: -0.2,
    lineHeight: 24
  },
  body: {
    fontSize: 15,
    fontWeight: "400",
    letterSpacing: 0.15,
    lineHeight: 22
  },
  bodyStrong: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.1,
    lineHeight: 22
  },
  caption: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.35,
    lineHeight: 16
  },
  overline: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.4,
    lineHeight: 14,
    textTransform: "uppercase"
  },
  metric: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.25,
    lineHeight: 26
  }
} satisfies Record<string, TextStyle>;