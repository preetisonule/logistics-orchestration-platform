import { Box, Paper, Typography } from "@mui/material";
import { ArrowDown } from "lucide-react";
import { StatusChip } from "../common/StatusChip";

const pipelineStages = [
  { key: "inventory", label: "Inventory Reserved", tone: "info" as const },
  { key: "picking", label: "Picking", tone: "default" as const },
  { key: "packed", label: "Packed", tone: "default" as const },
  { key: "ready", label: "Package Ready", tone: "warning" as const },
  { key: "carrier", label: "Carrier Selected", tone: "info" as const },
  { key: "transit", label: "In Transit", tone: "warning" as const },
  { key: "delivered", label: "Delivered", tone: "success" as const },
];

interface ShipmentPipelineProps {
  counts: Record<string, number>;
}

export function ShipmentPipeline({ counts }: ShipmentPipelineProps) {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 0.5 }}>
        Shipment Pipeline
      </Typography>
      <Typography variant="body2" sx={{ mb: 3 }}>
        End-to-end flow across inventory, warehouse, carrier, and shipment services
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", lg: "row" },
          alignItems: { xs: "stretch", lg: "center" },
          gap: 1.5,
          flexWrap: "wrap",
        }}
      >
        {pipelineStages.map((stage, index) => (
          <Box
            key={stage.key}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              flex: { lg: "1 1 0" },
              minWidth: { xs: "100%", lg: 120 },
            }}
          >
            <Box
              sx={{
                flex: 1,
                p: 2,
                borderRadius: 1,
                bgcolor: "#f8fafb",
                border: "1px solid",
                borderColor: "divider",
                textAlign: "center",
              }}
            >
              <StatusChip label={stage.label} tone={stage.tone} />
              <Typography variant="h5" sx={{ mt: 1.5, fontWeight: 700 }}>
                {counts[stage.key] ?? 0}
              </Typography>
            </Box>
            {index < pipelineStages.length - 1 && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  color: "text.secondary",
                  transform: { xs: "rotate(0deg)", lg: "rotate(-90deg)" },
                }}
              >
                <ArrowDown size={16} />
              </Box>
            )}
          </Box>
        ))}
      </Box>
    </Paper>
  );
}
