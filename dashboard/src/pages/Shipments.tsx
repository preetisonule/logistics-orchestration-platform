import { useCallback, useRef, useState } from "react";
import { fetchShipments } from "../api/shipmentApi";
import { getErrorMessage } from "../api/axios";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";
import { ShipmentTable } from "../components/shipments/ShipmentTable";
import { usePolling } from "../hooks/usePolling";
import type { Shipment } from "../types/shipment";

type LoadState = "loading" | "success" | "empty" | "error";

export function ShipmentsPage() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const hasLoadedRef = useRef(false);

  const loadShipments = useCallback(async (isInitial = false) => {
    if (isInitial) {
      setLoadState("loading");
      setErrorMessage("");
    }

    try {
      const data = await fetchShipments();
      setShipments(data);
      setLoadState(data.length === 0 ? "empty" : "success");
    } catch (error) {
      if (isInitial) {
        setErrorMessage(getErrorMessage(error, "Failed to load shipments."));
        setLoadState("error");
      }
    }
  }, []);

  usePolling(async () => {
    const isInitial = !hasLoadedRef.current;
    hasLoadedRef.current = true;
    await loadShipments(isInitial);
  }, 4000);

  if (loadState === "loading") {
    return <LoadingState message="Loading shipments..." />;
  }

  if (loadState === "error") {
    return (
      <ErrorState
        message={errorMessage}
        onRetry={() => void loadShipments()}
      />
    );
  }

  if (loadState === "empty") {
    return <EmptyState message="No shipments found." />;
  }

  return <ShipmentTable shipments={shipments} />;
}
