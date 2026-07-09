import { STAGEBOOK_DESIGN_TOKENS } from "@stagebook/shared";
import { typography } from "./typography";

export const theme = {
  colors: {
    ...STAGEBOOK_DESIGN_TOKENS.colors,
    obsidian: "#08080A",
    obsidianRaised: "#0E0E12",
    glass: "rgba(14, 14, 18, 0.72)",
    borderSubtle: "rgba(255, 255, 255, 0.06)",
    borderFine: "rgba(255, 255, 255, 0.09)"
  },
  gradients: STAGEBOOK_DESIGN_TOKENS.gradients,
  radius: STAGEBOOK_DESIGN_TOKENS.radius,
  spacing: STAGEBOOK_DESIGN_TOKENS.spacing,
  typography,
  shadow: {
    float: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.38,
      shadowRadius: 18,
      elevation: 10
    }
  }
};