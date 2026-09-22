import {
  Box,
  IconButton,
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
  Tooltip,
} from "@mui/material";
import { PackagePlus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { InventoryRow, InventoryStatus } from "../../types/inventory";
import { formatStatusLabel } from "../../utils/statusHelpers";
import { StatusChip } from "../common/StatusChip";

interface InventoryTableProps {
  rows: InventoryRow[];
  onReserve: (row: InventoryRow) => void;
}

const statusTone: Record<InventoryStatus, "success" | "warning" | "error"> = {
  AVAILABLE: "success",
  LOW_STOCK: "warning",
  DEPLETED: "error",
};

export function InventoryTable({ rows, onReserve }: InventoryTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InventoryStatus | "ALL">("ALL");

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesSearch =
        row.productName.toLowerCase().includes(search.toLowerCase()) ||
        row.productSku.toLowerCase().includes(search.toLowerCase()) ||
        row.warehouseName.toLowerCase().includes(search.toLowerCase()) ||
        row.warehouseLocation.toLowerCase().includes(search.toLowerCase()) ||
        row.warehouseLabel.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" || row.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [rows, search, statusFilter]);

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
          placeholder="Search product, SKU or warehouse..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          sx={{ minWidth: 280, flex: 1 }}
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
            setStatusFilter(event.target.value as InventoryStatus | "ALL")
          }
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="ALL">All statuses</MenuItem>
          <MenuItem value="AVAILABLE">Available</MenuItem>
          <MenuItem value="LOW_STOCK">Low stock</MenuItem>
          <MenuItem value="DEPLETED">Depleted</MenuItem>
        </TextField>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell>Warehouse</TableCell>
              <TableCell align="right">Available</TableCell>
              <TableCell align="right">Reserved</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRows.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>
                  <Box sx={{ fontWeight: 600 }}>{row.productName}</Box>
                  <Box sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
                    SKU: {row.productSku} • Weight: {row.productWeightKg} kg
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ fontWeight: 500 }}>{row.warehouseName}</Box>
                  <Box sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
                    {row.warehouseLocation}
                  </Box>
                </TableCell>
                <TableCell align="right">{row.availableQuantity}</TableCell>
                <TableCell align="right">{row.reservedQuantity}</TableCell>
                <TableCell>
                  <StatusChip
                    label={formatStatusLabel(row.status)}
                    tone={statusTone[row.status]}
                  />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Reserve inventory">
                    <span>
                      <IconButton
                        size="small"
                        color="primary"
                        disabled={row.availableQuantity <= 0}
                        onClick={() => onReserve(row)}
                      >
                        <PackagePlus size={18} />
                      </IconButton>
                    </span>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredRows.length === 0 && (
        <Box sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
          No inventory records match your filters.
        </Box>
      )}
    </Paper>
  );
}
