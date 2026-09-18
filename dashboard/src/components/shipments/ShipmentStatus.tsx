import { Box, Button, MenuItem, Paper, TextField, Typography } from "@mui/material";
import type { ShipmentStatus as ShipmentStatusType } from "../../types/shipment";
import {
  formatStatusLabel,
  getNextShipmentStatus,
  isValidShipmentTransition,
} from "../../utils/statusHelpers";
import { StatusChip } from "../common/StatusChip";

interface ShipmentStatusProps {
  status: ShipmentStatusType;
  onUpdate: (status: ShipmentStatusType) => void;
  updating?: boolean;
}

const statusTone: Record<
  ShipmentStatusType,
  "default" | "info" | "warning" | "success"
> = {
  CREATED: "default",
  IN_TRANSIT: "info",
  OUT_FOR_DELIVERY: "warning",
  DELIVERED: "success",
};

export function ShipmentStatusControl({
  status,
  onUpdate,
  updating = false,
}: ShipmentStatusProps) {
  const nextStatus = getNextShipmentStatus(status);

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Status Update
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Current status
        </Typography>
        <StatusChip label={formatStatusLabel(status)} tone={statusTone[status]} />
      </Box>

      {nextStatus ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            select
            size="small"
            label="Next status"
            value={nextStatus}
            disabled
            helperText="Only sequential transitions are allowed"
          >
            <MenuItem value={nextStatus}>{formatStatusLabel(nextStatus)}</MenuItem>
          </TextField>
          <Button
            variant="contained"
            disabled={updating || !isValidShipmentTransition(status, nextStatus)}
            onClick={() => onUpdate(nextStatus)}
          >
            Advance to {formatStatusLabel(nextStatus)}
          </Button>
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          This shipment has reached its final status.
        </Typography>
      )}
    </Paper>
  );
}
