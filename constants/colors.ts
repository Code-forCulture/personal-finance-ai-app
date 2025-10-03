export const Colors = {
  primary: "#2563EB",
  primaryLight: "#3B82F6",
  ink: "#1F2937",
  tintSoft: "#DBEAFE",
  white: "#FFFFFF",
  gray500: "#6B7280",
  gray600: "#4B5563",
  gray700: "#374151",
  gray400: "#9CA3AF",
  gray100: "#F3F4F6",
  bg: "#F0F7FF",
} as const;

export type AppColors = typeof Colors;