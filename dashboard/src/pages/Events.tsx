import {
  Alert,
  Box,
  Paper,
  Typography,
} from "@mui/material";
import { ArrowDown } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "../api/axios";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";
import { StatusChip } from "../components/common/StatusChip";
import { fetchEvents } from "../services/eventService";
import type { LogisticsEvent } from "../types/event";
import { formatDateTime, formatStatusLabel } from "../utils/statusHelpers";

type LoadState = "loading" | "success" | "error";

const eventTone: Record<
  LogisticsEvent["eventType"],
  "info" | "warning" | "success" | "default"
> = {
  INVENTORY_RESERVED: "info",
  PACKAGE_READY: "warning",
  CARRIER_SELECTED: "default",
  SHIPMENT_CREATED: "success",
};

export function EventsPage() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [events, setEvents] = useState<LogisticsEvent[]>([]);

  const loadEvents = useCallback(async () => {
    setLoadState("loading");
    setErrorMessage("");

    try {
      const data = await fetchEvents();
      setEvents(data);
      setLoadState("success");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Failed to load events."));
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  if (loadState === "loading") {
    return <LoadingState message="Loading event stream..." />;
  }

  if (loadState === "error") {
    return (
      <ErrorState message={errorMessage} onRetry={() => void loadEvents()} />
    );
  }

  return (
    <>
      <Alert severity="info" sx={{ mb: 3 }}>
        Mock event data — isolated in eventService.ts. Replace with a backend Event
        API and WebSocket/SSE delivery when available.
      </Alert>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Distributed Event Flow
        </Typography>
        <Typography variant="body2" sx={{ mb: 3 }}>
          Kafka-backed pipeline across microservices
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          {events.map((event, index) => (
            <Box key={event.eventId} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <StatusChip
                label={formatStatusLabel(event.eventType)}
                tone={eventTone[event.eventType]}
              />
              {index < events.length - 1 && (
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
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          Event Timeline
        </Typography>

        {events.map((event, index) => (
          <Box
            key={event.eventId}
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
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1 }}>
                <StatusChip
                  label={formatStatusLabel(event.eventType)}
                  tone={eventTone[event.eventType]}
                />
                <Typography variant="caption" color="text.secondary">
                  {event.service}
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {formatDateTime(event.timestamp)} · Event ID: {event.eventId}
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
                {JSON.stringify(event.data, null, 2)}
              </Box>
            </Box>
          </Box>
        ))}
      </Paper>
    </>
  );
}
