import { Alert, Box, Grid, Typography } from "@mui/material";
import { Boxes, PackageCheck, RefreshCw, Truck, Warehouse } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { fetchInventory } from "../api/inventoryApi";
import { fetchShipments } from "../api/shipmentApi";
import { fetchWarehouseTasks } from "../api/warehouseApi";
import { getErrorMessage } from "../api/axios";
import { ActivityFeed } from "../components/dashboard/ActivityFeed";
import { MetricCard } from "../components/dashboard/MetricCard";
import { ShipmentPipeline } from "../components/dashboard/ShipmentPipeline";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";
import { usePolling } from "../hooks/usePolling";
import { fetchEvents } from "../services/eventService";
import { mapEventsToActivity, type ActivityItem } from "../services/activityService";

type LoadState = "loading" | "success" | "error";

export function DashboardPage() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [inventoryCount, setInventoryCount] = useState(0);
  const [pendingTasks, setPendingTasks] = useState(0);
  const [activeShipments, setActiveShipments] = useState(0);
  const [deliveredShipments, setDeliveredShipments] = useState(0);
  const [pipelineCounts, setPipelineCounts] = useState<Record<string, number>>({});
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const hasLoadedRef = useRef(false);
  const isFetchingRef = useRef(false);

  const loadDashboardData = useCallback(async (isInitial = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (isInitial) {
      setLoadState("loading");
      setErrorMessage("");
    }

    try {
      const [inventory, tasks, shipments, rawEvents] = await Promise.all([
        fetchInventory(),
        fetchWarehouseTasks(),
        fetchShipments(),
        fetchEvents({ limit: 10 }),
      ]);

      setInventoryCount(inventory.length);
      setPendingTasks(
        tasks.filter((task) => task.status === "PICKING_PENDING").length,
      );
      setActiveShipments(
        shipments.filter((shipment) => shipment.status !== "DELIVERED").length,
      );
      setDeliveredShipments(
        shipments.filter((shipment) => shipment.status === "DELIVERED").length,
      );

      setPipelineCounts({
        inventory: inventory.reduce((sum, item) => sum + item.reservedQuantity, 0),
        picking: tasks.filter((task) => task.status === "PICKING_PENDING").length,
        packed: tasks.filter((task) => task.status === "PACKED").length,
        ready: tasks.filter((task) => task.status === "PACKAGE_READY").length,
        carrier: shipments.filter((shipment) => shipment.status === "CREATED").length,
        transit: shipments.filter(
          (shipment) =>
            shipment.status === "IN_TRANSIT" ||
            shipment.status === "OUT_FOR_DELIVERY",
        ).length,
        delivered: shipments.filter((shipment) => shipment.status === "DELIVERED").length,
      });

      setActivities(mapEventsToActivity(rawEvents));
      setLastUpdated(new Date().toLocaleTimeString());
      setLoadState("success");
    } catch (error) {
      if (isInitial) {
        setErrorMessage(getErrorMessage(error, "Failed to load dashboard metrics."));
        setLoadState("error");
      }
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  usePolling(async () => {
    const isInitial = !hasLoadedRef.current;
    hasLoadedRef.current = true;
    await loadDashboardData(isInitial);
  }, 4000);

  if (loadState === "loading") {
    return <LoadingState message="Loading live operational metrics..." />;
  }

  if (loadState === "error") {
    return (
      <ErrorState message={errorMessage} onRetry={() => void loadDashboardData(true)} />
    );
  }

  return (
    <>
      <Alert severity="success" sx={{ mb: 3 }} action={
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, pr: 1 }}>
          <RefreshCw size={14} style={{ animation: isFetchingRef.current ? "spin 1s linear infinite" : "none" }} />
          <Typography variant="caption">Updated {lastUpdated}</Typography>
        </Box>
      }>
        Live Dashboard connected to Microservice REST APIs & Event Store Service. Metrics auto-refresh periodically.
      </Alert>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            title="Total Inventory Items"
            value={inventoryCount}
            subtitle="Stock records across warehouses"
            icon={Boxes}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            title="Pending Warehouse Tasks"
            value={pendingTasks}
            subtitle="Awaiting pick operations"
            icon={Warehouse}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            title="Active Shipments"
            value={activeShipments}
            subtitle="In progress deliveries"
            icon={Truck}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            title="Delivered Shipments"
            value={deliveredShipments}
            subtitle="Completed deliveries"
            icon={PackageCheck}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <ShipmentPipeline counts={pipelineCounts} />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <ActivityFeed activities={activities} />
        </Grid>
      </Grid>
    </>
  );
}
