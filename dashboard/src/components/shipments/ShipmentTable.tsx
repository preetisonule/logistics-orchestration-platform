import {
  Box,
  InputAdornment,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Shipment, ShipmentStatus } from "../../types/shipment";
import { formatDateTime, formatStatusLabel, truncateId } from "../../utils/statusHelpers";
import { StatusChip } from "../common/StatusChip";

interface ShipmentTableProps {
  shipments: Shipment[];
}

const statusTone: Record<
  ShipmentStatus,
  "default" | "info" | "warning" | "success"
> = {
  CREATED: "default",
  IN_TRANSIT: "info",
  OUT_FOR_DELIVERY: "warning",
  DELIVERED: "success",
};

export function ShipmentTable({ shipments }: ShipmentTableProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | "ALL">("ALL");
  const [carrierFilter, setCarrierFilter] = useState("ALL");

  const carriers = useMemo(() => {
    return Array.from(new Set(shipments.map((s) => s.carrier))).sort();
  }, [shipments]);

  const filteredShipments = useMemo(() => {
    return shipments.filter((shipment) => {
      const matchesSearch = shipment.trackingNumber
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "ALL" || shipment.status === statusFilter;
      const matchesCarrier =
        carrierFilter === "ALL" || shipment.carrier === carrierFilter;
      return matchesSearch && matchesStatus && matchesCarrier;
    });
  }, [shipments, search, statusFilter, carrierFilter]);

  return (
    <Paper>
      <Box
        sx={{
          p: 2,
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <TextField
          size="small"
          placeholder="Search tracking number..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          sx={{ minWidth: 260, flex: 1 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={16} />
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          select
          size="small"
          label="Status"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as ShipmentStatus | "ALL")
          }
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="ALL">All statuses</MenuItem>
          <MenuItem value="CREATED">Created</MenuItem>
          <MenuItem value="IN_TRANSIT">In transit</MenuItem>
          <MenuItem value="OUT_FOR_DELIVERY">Out for delivery</MenuItem>
          <MenuItem value="DELIVERED">Delivered</MenuItem>
        </TextField>
        <TextField
          select
          size="small"
          label="Carrier"
          value={carrierFilter}
          onChange={(event) => setCarrierFilter(event.target.value)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="ALL">All carriers</MenuItem>
          {carriers.map((carrier) => (
            <MenuItem key={carrier} value={carrier}>
              {carrier}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tracking Number</TableCell>
              <TableCell>Product</TableCell>
              <TableCell>Warehouse</TableCell>
              <TableCell>Carrier</TableCell>
              <TableCell>Service Level</TableCell>
              <TableCell align="right">Weight</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredShipments.map((shipment) => (
              <TableRow
                key={shipment.id}
                hover
                sx={{ cursor: "pointer" }}
                onClick={() => navigate(`/shipments/${shipment.trackingNumber}`)}
              >
                <TableCell sx={{ fontFamily: "IBM Plex Mono, monospace", fontWeight: 600 }}>
                  {shipment.trackingNumber}
                </TableCell>
                <TableCell>{truncateId(shipment.productId)}</TableCell>
                <TableCell>{truncateId(shipment.warehouseId)}</TableCell>
                <TableCell>{shipment.carrier}</TableCell>
                <TableCell>{shipment.serviceLevel}</TableCell>
                <TableCell align="right">{shipment.weight} kg</TableCell>
                <TableCell>
                  <StatusChip
                    label={formatStatusLabel(shipment.status)}
                    tone={statusTone[shipment.status]}
                  />
                </TableCell>
                <TableCell>{formatDateTime(shipment.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredShipments.length === 0 && (
        <Box sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
          No shipments match your filters.
        </Box>
      )}
    </Paper>
  );
}
