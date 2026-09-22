import {
  Box,
  IconButton,
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
import { ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import type { WarehouseTask, WarehouseTaskStatus } from "../../types/warehouse";
import {
  formatDateTime,
  formatStatusLabel,
  getNextWarehouseStatus,
  truncateId,
} from "../../utils/statusHelpers";
import { StatusChip } from "../common/StatusChip";

interface WarehouseTaskTableProps {
  tasks: WarehouseTask[];
  onAdvanceStatus?: (task: WarehouseTask, nextStatus: WarehouseTaskStatus) => void;
}

const statusTone: Record<
  WarehouseTaskStatus,
  "default" | "info" | "warning" | "success"
> = {
  PICKING_PENDING: "warning",
  PICKED: "info",
  PACKED: "info",
  PACKAGE_READY: "success",
};

export function WarehouseTaskTable({
  tasks,
  onAdvanceStatus,
}: WarehouseTaskTableProps) {
  const [statusFilter, setStatusFilter] = useState<WarehouseTaskStatus | "ALL">(
    "ALL",
  );

  const filteredTasks = useMemo(() => {
    if (statusFilter === "ALL") {
      return tasks;
    }
    return tasks.filter((task) => task.status === statusFilter);
  }, [tasks, statusFilter]);

  return (
    <Paper>
      <Box
        sx={{
          p: 2,
          display: "flex",
          gap: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <TextField
          select
          size="small"
          label="Status filter"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as WarehouseTaskStatus | "ALL")
          }
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="ALL">All statuses</MenuItem>
          <MenuItem value="PICKING_PENDING">Picking pending</MenuItem>
          <MenuItem value="PICKED">Picked</MenuItem>
          <MenuItem value="PACKED">Packed</MenuItem>
          <MenuItem value="PACKAGE_READY">Package ready</MenuItem>
        </TextField>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Task ID</TableCell>
              <TableCell>Product</TableCell>
              <TableCell>Warehouse</TableCell>
              <TableCell align="right">Quantity</TableCell>
              <TableCell>Mode</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Updated</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTasks.map((task) => {
              const nextStatus = getNextWarehouseStatus(task.status);
              return (
                <TableRow key={task.id} hover>
                  <TableCell sx={{ fontFamily: "IBM Plex Mono, monospace" }}>
                    {truncateId(task.id)}
                  </TableCell>
                  <TableCell>{truncateId(task.productId)}</TableCell>
                  <TableCell>{truncateId(task.warehouseId)}</TableCell>
                  <TableCell align="right">{task.quantity}</TableCell>
                  <TableCell>
                    <StatusChip
                      label={task.automationMode === "AUTONOMOUS" ? "Automatic" : "Manual"}
                      tone={task.automationMode === "AUTONOMOUS" ? "info" : "default"}
                    />
                  </TableCell>
                  <TableCell>
                    <StatusChip
                      label={formatStatusLabel(task.status)}
                      tone={statusTone[task.status]}
                    />
                  </TableCell>
                  <TableCell>{formatDateTime(task.createdAt)}</TableCell>
                  <TableCell>{formatDateTime(task.updatedAt)}</TableCell>
                  <TableCell align="right">
                    {task.automationMode === "MANUAL" && nextStatus && onAdvanceStatus && (
                      <Tooltip title={`Advance to ${formatStatusLabel(nextStatus)}`}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => onAdvanceStatus(task, nextStatus)}
                        >
                          <ArrowRight size={18} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
