import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import {
  fetchInventory,
  fetchProducts,
  fetchWarehouses,
  reserveInventory,
} from "../api/inventoryApi";
import { getErrorMessage } from "../api/axios";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";
import { InventoryTable } from "../components/inventory/InventoryTable";
import type { InventoryRow } from "../types/inventory";
import { getInventoryStatus } from "../utils/statusHelpers";

type LoadState = "loading" | "success" | "empty" | "error";

export function InventoryPage() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [selectedRow, setSelectedRow] = useState<InventoryRow | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [serviceLevel, setServiceLevel] = useState<"STANDARD" | "EXPRESS">("STANDARD");
  const [reserving, setReserving] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  const loadInventory = useCallback(async () => {
    setLoadState("loading");
    setErrorMessage("");

    try {
      const [inventory, products, warehouses] = await Promise.all([
        fetchInventory(),
        fetchProducts(),
        fetchWarehouses(),
      ]);

      const productMap = new Map(products.map((product) => [product.id, product]));
      const warehouseMap = new Map(warehouses.map((wh) => [wh.id, wh]));

      const enrichedRows: InventoryRow[] = inventory.map((item) => {
        const product = productMap.get(item.productId);
        const warehouse = warehouseMap.get(item.warehouseId);
        const availableQuantity = item.totalQuantity - item.reservedQuantity;

        return {
          ...item,
          productName: product?.name ?? "Unknown Product",
          productSku: product?.sku ?? item.productId,
          productWeightKg: product?.weightKg ?? 1.0,
          warehouseName: warehouse?.name ?? `Warehouse ${item.warehouseId.slice(0, 8)}`,
          warehouseLocation: warehouse?.location ?? "Unknown Location",
          warehouseLabel: warehouse ? `${warehouse.name} (${warehouse.location})` : item.warehouseId,
          availableQuantity,
          status: getInventoryStatus(availableQuantity, item.totalQuantity),
        };
      });

      setRows(enrichedRows);
      setLoadState(enrichedRows.length === 0 ? "empty" : "success");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Failed to load inventory."));
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    void loadInventory();
  }, [loadInventory]);

  const handleReserve = async () => {
    if (!selectedRow) {
      return;
    }

    const parsedQuantity = Number(quantity);
    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      setSnackbar({
        open: true,
        message: "Quantity must be a positive integer.",
        severity: "error",
      });
      return;
    }

    if (parsedQuantity > selectedRow.availableQuantity) {
      setSnackbar({
        open: true,
        message: "Quantity exceeds available inventory.",
        severity: "error",
      });
      return;
    }

    setReserving(true);

    try {
      await reserveInventory(selectedRow.id, {
        quantity: parsedQuantity,
        serviceLevel,
      });
      setSnackbar({
        open: true,
        message: `Reserved ${parsedQuantity} units of ${selectedRow.productName} (${serviceLevel} delivery). Workflow initialized.`,
        severity: "success",
      });
      setSelectedRow(null);
      setQuantity("1");
      setServiceLevel("STANDARD");
      await loadInventory();
    } catch (error) {
      setSnackbar({
        open: true,
        message: getErrorMessage(error, "Failed to reserve inventory."),
        severity: "error",
      });
    } finally {
      setReserving(false);
    }
  };

  if (loadState === "loading") {
    return <LoadingState message="Loading inventory..." />;
  }

  if (loadState === "error") {
    return (
      <ErrorState message={errorMessage} onRetry={() => void loadInventory()} />
    );
  }

  if (loadState === "empty") {
    return <EmptyState message="No inventory records found." />;
  }

  return (
    <>
      <Alert severity="info" sx={{ mb: 2 }}>
        Reserving inventory triggers an asynchronous Kafka workflow: Inventory Reserved → Warehouse Task Created → Operator Processing → Package Ready → Carrier Selection → Shipment Created.
      </Alert>

      <InventoryTable
        rows={rows}
        onReserve={(row) => {
          setSelectedRow(row);
          setQuantity("1");
          setServiceLevel("STANDARD");
        }}
      />

      <Dialog
        open={selectedRow !== null}
        onClose={() => !reserving && setSelectedRow(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Reserve Inventory</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {selectedRow?.productName} ({selectedRow?.productWeightKg} kg) — {selectedRow?.availableQuantity} units available
          </Typography>
          <TextField
            autoFocus
            fullWidth
            type="number"
            label="Quantity"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            sx={{ mb: 2 }}
            slotProps={{
              htmlInput: { min: 1, max: selectedRow?.availableQuantity },
            }}
          />
          <TextField
            select
            fullWidth
            label="Service Level (SLA)"
            value={serviceLevel}
            onChange={(event) => setServiceLevel(event.target.value as "STANDARD" | "EXPRESS")}
          >
            <MenuItem value="STANDARD">STANDARD (Ground Shipping)</MenuItem>
            <MenuItem value="EXPRESS">EXPRESS (Air Priority)</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedRow(null)} disabled={reserving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={() => void handleReserve()} disabled={reserving}>
            Reserve Stock
          </Button>
        </DialogActions>
      </Dialog>

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
