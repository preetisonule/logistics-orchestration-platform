import { Chip, type ChipProps } from "@mui/material";

type StatusTone = "default" | "info" | "warning" | "success" | "error";

interface StatusChipProps {
  label: string;
  tone?: StatusTone;
  size?: ChipProps["size"];
}

const toneColors: Record<
  StatusTone,
  { bg: string; color: string; border: string }
> = {
  default: { bg: "#eef1f4", color: "#4a6278", border: "#d8dee6" },
  info: { bg: "#e8f0f8", color: "#1e3a5f", border: "#c5d7ea" },
  warning: { bg: "#fdf6e3", color: "#8a6d1d", border: "#ecdca0" },
  success: { bg: "#e8f5ef", color: "#2e7d5a", border: "#b8ddc8" },
  error: { bg: "#fdecea", color: "#c0392b", border: "#f0c4bf" },
};

export function StatusChip({
  label,
  tone = "default",
  size = "small",
}: StatusChipProps) {
  const colors = toneColors[tone];

  return (
    <Chip
      label={label}
      size={size}
      sx={{
        bgcolor: colors.bg,
        color: colors.color,
        border: `1px solid ${colors.border}`,
        fontWeight: 600,
        fontSize: "0.72rem",
        letterSpacing: "0.02em",
      }}
    />
  );
}
