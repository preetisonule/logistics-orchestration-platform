import { Box, Paper, Typography } from "@mui/material";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
}

export function MetricCard({ title, value, subtitle, icon: Icon }: MetricCardProps) {
  return (
    <Paper sx={{ p: 2.5, height: "100%" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">
          {title}
        </Typography>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1,
            bgcolor: "#eef1f4",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "primary.main",
          }}
        >
          <Icon size={18} />
        </Box>
      </Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Paper>
  );
}
