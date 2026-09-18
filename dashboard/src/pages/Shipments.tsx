import { useCallback, useEffect, useState } from "react";
import { fetchShipments } from "../api/shipmentApi";
import { getErrorMessage } from "../api/axios";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";
import { ShipmentTable } from "../components/shipments/ShipmentTable";
import type { Shipment } from "../types/shipment";

type LoadState = "loading" | "success" | "empty" | "error";

export function ShipmentsPage() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [shipments, setShipments] = useState<Shipment[]>([]);

  const loadShipments = useCallback(async () => {
    setLoadState("loading");
    setErrorMessage("");

    try {
      const data = await fetchShipments();
      setShipments(data);
      setLoadState(data.length === 0 ? "empty" : "success");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Failed to load shipments."));
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    void loadShipments();
  }, [loadShipments]);

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
