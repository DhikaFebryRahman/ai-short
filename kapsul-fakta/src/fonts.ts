  import { loadFont as loadLoraFont } from "@remotion/google-fonts/Lora";
import { loadFont as loadPoppinsFont } from "@remotion/google-fonts/Poppins";

const lora = loadLoraFont("italic", {
  weights: ["400", "500", "600"],
  subsets: ["latin"],
});

const poppins = loadPoppinsFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const FONT_FAMILIES = {
  serifItalic: lora.fontFamily,
  sans: poppins.fontFamily,
} as const;

