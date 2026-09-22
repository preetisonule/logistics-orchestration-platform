import {
  Alert,
  Box,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { ArrowDown, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { getErrorMessage } from "../api/axios";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";
import { StatusChip } from "../components/common/StatusChip";
import { fetchEvents } from "../services/eventService";
import type { LogisticsEvent } from "../types/event";
import { formatDateTime, formatStatusLabel } from "../utils/statusHelpers";

type LoadState = "loading" | "success" | "error";

const eventTone: Record<string, "info" | "warning" | "success" | "default"> = {
  INVENTORY_RESERVED: "info",
  PACKAGE_READY: "warning",
  CARRIER_SELECTED: "default",
  SHIPMENT_CREATED: "success",
  SHIPMENT_STATUS_UPDATED: "success",
};

export function EventsPage() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [events, setEvents] = useState<LogisticsEvent[]>([]);
  const [eventTypeFilter, setEventTypeFilter] = useState("ALL");
  const [serviceFilter, setServiceFilter] = useState("ALL");
  const [correlationIdFilter, setCorrelationIdFilter] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const isFetchingRef = useRef(false);

  const loadEventsData = useCallback(async (isInitial = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (isInitial) {
      setLoadState("loading");
      setErrorMessage("");
    }

    try {
      const data = await fetchEvents({
        eventType: eventTypeFilter,
        source: serviceFilter,
        correlationId: correlationIdFilter.trim() || undefined,
        limit: 50,
      });

      setEvents(data);
      setLastUpdated(new Date().toLocaleTimeString());
      setLoadState("success");
    } catch (error) {
      if (isInitial) {
        setErrorMessage(getErrorMessage(error, "Failed to load event logs."));
        setLoadState("error");
      }
    } finally {
      isFetchingRef.current = false;
    }
  }, [eventTypeFilter, serviceFilter, correlationIdFilter]);

  useEffect(() => {
    void loadEventsData(true);

    const interval = setInterval(() => {
      void loadEventsData(false);
    }, 4000);

    return () => clearInterval(interval);
  }, [loadEventsData]);

  if (loadState === "loading") {
    return <LoadingState message="Loading live Kafka event log stream..." />;
  }

  if (loadState === "error") {
    return (
      <ErrorState message={errorMessage} onRetry={() => void loadEventsData(true)} />
    );
  }

  return (
    <>
      <Alert severity="success" sx={{ mb: 3 }} action={
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, pr: 1 }}>
          <RefreshCw size={14} style={{ animation: isFetchingRef.current ? "spin 1s linear infinite" : "none" }} />
          <Typography variant="caption">Auto-refreshing (4s) • Updated {lastUpdated}</Typography>
        </Box>
      }>
        Real Event Store Service logs consumed directly from Kafka topics (inventory-events, warehouse-events, carrier-events, shipment-events).
      </Alert>

      {/* Filter Bar */}
      <Paper sx={{ p: 2, mb: 3, display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}>
        <TextField
          select
          size="small"
          label="Event Type"
          value={eventTypeFilter}
          onChange={(e) => setEventTypeFilter(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="ALL">All Event Types</MenuItem>
          <MenuItem value="INVENTORY_RESERVED">INVENTORY_RESERVED</MenuItem>
          <MenuItem value="PACKAGE_READY">PACKAGE_READY</MenuItem>
          <MenuItem value="CARRIER_SELECTED">CARRIER_SELECTED</MenuItem>
          <MenuItem value="SHIPMENT_CREATED">SHIPMENT_CREATED</MenuItem>
          <MenuItem value="SHIPMENT_STATUS_UPDATED">SHIPMENT_STATUS_UPDATED</MenuItem>
        </TextField>

        <TextField
          select
          size="small"
          label="Source Service"
          value={serviceFilter}
          onChange={(e) => setServiceFilter(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="ALL">All Services</MenuItem>
          <MenuItem value="inventory-service">inventory-service</MenuItem>
          <MenuItem value="warehouse-service">warehouse-service</MenuItem>
          <MenuItem value="carrier-selection-service">carrier-selection-service</MenuItem>
          <MenuItem value="shipment-service">shipment-service</MenuItem>
        </TextField>

        <TextField
          size="small"
          label="Filter by Correlation ID"
          placeholder="e.g. uuid..."
          value={correlationIdFilter}
          onChange={(e) => setCorrelationIdFilter(e.target.value)}
          sx={{ minWidth: 240, flex: 1 }}
        />
      </Paper>

      {/* Distributed Event Flow Visualizer */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Recent Workflow Stream
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Kafka-backed asynchronous pipeline across microservices
        </Typography>

        {events.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No events found matching your filter criteria. Try triggering an inventory reservation.
          </Typography>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: "center",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            {events.slice(0, 5).map((event, index, arr) => (
              <Box key={event.eventId} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <StatusChip
                  label={formatStatusLabel(event.eventType)}
                  tone={eventTone[event.eventType] || "default"}
                />
                {index < arr.length - 1 && (
                  <Box
                    sx={{
                      display: "flex",
                      color: "text.secondary",
                      transform: { xs: "none", md: "rotate(-90deg)" },
                    }}
                  >
                    <ArrowDown size={16} />
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        )}
      </Paper>

      {/* Detailed Event Log List */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          Event Log Stream ({events.length})
        </Typography>

        {events.map((event, index) => (
          <Box
            key={event.eventId || index}
            sx={{
              display: "flex",
              gap: 2,
              pb: index === events.length - 1 ? 0 : 3,
              position: "relative",
            }}
          >
            <Box sx={{ width: 12, pt: 0.5 }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  bgcolor: "primary.main",
                }}
              />
              {index < events.length - 1 && (
                <Box
                  sx={{
                    width: 2,
                    bgcolor: "divider",
                    minHeight: 48,
                    ml: "4px",
                    mt: 0.5,
                  }}
                />
              )}
            </Box>

            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1, alignItems: "center" }}>
                <StatusChip
                  label={formatStatusLabel(event.eventType)}
                  tone={eventTone[event.eventType] || "default"}
                />
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  [{event.service || event.source}]
                </Typography>
                {event.correlationId && (
                  <Typography variant="caption" sx={{ bgcolor: "#eef2f6", px: 1, py: 0.2, borderRadius: 1, fontFamily: "monospace" }}>
                    corrId: {event.correlationId.slice(0, 8)}...
                  </Typography>
                )}
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {formatDateTime(event.timestamp || event.occurredAt || "")} · Event ID: {event.eventId}
              </Typography>

              <Box
                component="pre"
                sx={{
                  m: 0,
                  p: 1.5,
                  bgcolor: "#f4f6f8",
                  borderRadius: 1,
                  fontSize: "0.75rem",
                  fontFamily: "IBM Plex Mono, monospace",
                  overflow: "auto",
                }}
              >
                {JSON.stringify(event.data || event.payload || {}, null, 2)}
              </Box>
            </Box>
          </Box>
        ))}
      </Paper>
    </>
  );
}
