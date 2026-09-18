import { Alert, Grid } from "@mui/material";
import { Boxes, PackageCheck, Truck, Warehouse } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchInventory } from "../api/inventoryApi";
import { fetchShipments } from "../api/shipmentApi";
import { fetchWarehouseTasks } from "../api/warehouseApi";
import { getErrorMessage } from "../api/axios";
import { ActivityFeed } from "../components/dashboard/ActivityFeed";
import { MetricCard } from "../components/dashboard/MetricCard";
import { ShipmentPipeline } from "../components/dashboard/ShipmentPipeline";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";
import { getMockRecentActivity } from "../services/activityService";

type LoadState = "loading" | "success" | "error";

export function DashboardPage() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [inventoryCount, setInventoryCount] = useState(0);
  const [pendingTasks, setPendingTasks] = useState(0);
  const [activeShipments, setActiveShipments] = useState(0);
  const [deliveredShipments, setDeliveredShipments] = useState(0);
  const [pipelineCounts, setPipelineCounts] = useState<Record<string, number>>({});

  const activities = useMemo(() => getMockRecentActivity(), []);

  const loadDashboard = useCallback(async () => {
    setLoadState("loading");
    setErrorMessage("");

    try {
      const [inventory, tasks, shipments] = await Promise.all([
        fetchInventory(),
        fetchWarehouseTasks(),
        fetchShipments(),
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
        delivered: deliveredCount(shipments),
      });

      setLoadState("success");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Failed to load dashboard metrics."));
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  if (loadState === "loading") {
    return <LoadingState message="Loading dashboard metrics..." />;
  }

  if (loadState === "error") {
    return (
      <ErrorState message={errorMessage} onRetry={() => void loadDashboard()} />
    );
  }

  return (
    <>
      <Alert severity="info" sx={{ mb: 3 }}>
        Metric cards and pipeline counts are derived from live service APIs. Recent
        activity is illustrative until an Event API is available.
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

function deliveredCount(
  shipments: Awaited<ReturnType<typeof fetchShipments>>,
): number {
  return shipments.filter((shipment) => shipment.status === "DELIVERED").length;
}
