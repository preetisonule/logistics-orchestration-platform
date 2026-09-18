import { Box, Typography } from "@mui/material";
import { Check } from "lucide-react";
import { SHIPMENT_STATUS_ORDER, type ShipmentStatus } from "../../types/shipment";
import { formatStatusLabel } from "../../utils/statusHelpers";

interface ShipmentTimelineProps {
  currentStatus: ShipmentStatus;
}

export function ShipmentTimeline({ currentStatus }: ShipmentTimelineProps) {
  const currentIndex = SHIPMENT_STATUS_ORDER.indexOf(currentStatus);

  return (
    <Box sx={{ py: 2 }}>
      {SHIPMENT_STATUS_ORDER.map((status, index) => {
        const completed = index <= currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <Box key={status} sx={{ display: "flex", gap: 2, mb: index === SHIPMENT_STATUS_ORDER.length - 1 ? 0 : 2 }}>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: 28 }}>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: completed ? "primary.main" : "background.default",
                  border: "2px solid",
                  borderColor: completed ? "primary.main" : "divider",
                  color: completed ? "common.white" : "text.secondary",
                }}
              >
                {completed && <Check size={14} />}
              </Box>
              {index < SHIPMENT_STATUS_ORDER.length - 1 && (
                <Box
                  sx={{
                    width: 2,
                    flex: 1,
                    minHeight: 32,
                    bgcolor: index < currentIndex ? "primary.main" : "divider",
                    my: 0.5,
                  }}
                />
              )}
            </Box>

            <Box sx={{ pt: 0.25, pb: 1 }}>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: isCurrent ? 700 : 500,
                  color: completed ? "text.primary" : "text.secondary",
                }}
              >
                {formatStatusLabel(status)}
              </Typography>
              {isCurrent && (
                <Typography variant="caption" color="primary">
                  Current status
                </Typography>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
