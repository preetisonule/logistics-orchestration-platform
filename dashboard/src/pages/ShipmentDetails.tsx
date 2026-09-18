import {
  Alert,
  Box,
  Grid,
  Paper,
  Snackbar,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  fetchShipmentByTrackingNumber,
  updateShipmentStatus,
} from "../api/shipmentApi";
import { getErrorMessage } from "../api/axios";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";
import { ShipmentStatusControl } from "../components/shipments/ShipmentStatus";
import { ShipmentTimeline } from "../components/shipments/ShipmentTimeline";
import type { Shipment, ShipmentStatus } from "../types/shipment";
import { formatDateTime, formatStatusLabel } from "../utils/statusHelpers";

type LoadState = "loading" | "success" | "error";

export function ShipmentDetailsPage() {
  const { trackingNumber } = useParams<{ trackingNumber: string }>();
  const navigate = useNavigate();
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [updating, setUpdating] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  const loadShipment = useCallback(async () => {
    if (!trackingNumber) {
      setErrorMessage("Tracking number is required.");
      setLoadState("error");
      return;
    }

    setLoadState("loading");
    setErrorMessage("");

    try {
      const data = await fetchShipmentByTrackingNumber(trackingNumber);
      setShipment(data);
      setLoadState("success");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Failed to load shipment details."));
      setLoadState("error");
    }
  }, [trackingNumber]);

  useEffect(() => {
    void loadShipment();
  }, [loadShipment]);

  const handleStatusUpdate = async (status: ShipmentStatus) => {
    if (!trackingNumber || !shipment) {
      return;
    }

    setUpdating(true);

    try {
      const updated = await updateShipmentStatus(trackingNumber, { status });
      setShipment(updated);
      setSnackbar({
        open: true,
        message: `Status updated to ${formatStatusLabel(status)}.`,
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: getErrorMessage(error, "Failed to update shipment status."),
        severity: "error",
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loadState === "loading") {
    return <LoadingState message="Loading shipment details..." />;
  }

  if (loadState === "error" || !shipment) {
    return (
      <ErrorState
        message={errorMessage || "Shipment not found."}
        onRetry={() => {
          if (trackingNumber) {
            void loadShipment();
          } else {
            navigate("/shipments");
          }
        }}
      />
    );
  }

  return (
    <>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="overline" color="text.secondary">
          Shipment Tracking
        </Typography>
        <Typography
          variant="h4"
          sx={{ fontFamily: "IBM Plex Mono, monospace", mb: 2 }}
        >
          #{shipment.trackingNumber}
        </Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <DetailItem label="Carrier" value={shipment.carrier} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <DetailItem label="Service" value={shipment.serviceLevel} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <DetailItem label="Weight" value={`${shipment.weight} kg`} />
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Delivery Progress
            </Typography>
            <ShipmentTimeline currentStatus={shipment.status} />
          </Paper>

          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Shipment Information
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DetailItem label="Tracking Number" value={shipment.trackingNumber} mono />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DetailItem label="Product ID" value={shipment.productId} mono />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DetailItem label="Quantity" value={String(shipment.quantity)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DetailItem label="Warehouse ID" value={shipment.warehouseId} mono />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DetailItem
                  label="Current Status"
                  value={formatStatusLabel(shipment.status)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DetailItem label="Created At" value={formatDateTime(shipment.createdAt)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DetailItem label="Updated At" value={formatDateTime(shipment.updatedAt)} />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <ShipmentStatusControl
            status={shipment.status}
            onUpdate={handleStatusUpdate}
            updating={updating}
          />
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

function DetailItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
        {label}
      </Typography>
      <Typography
        variant="body1"
        sx={{ fontWeight: 500, fontFamily: mono ? "IBM Plex Mono, monospace" : undefined }}
      >
        {value}
      </Typography>
    </Box>
  );
}
