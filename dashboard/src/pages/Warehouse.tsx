import { Alert, Snackbar } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import {
  fetchWarehouseTasks,
  updateWarehouseTaskStatus,
} from "../api/warehouseApi";
import { getErrorMessage } from "../api/axios";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";
import { WarehouseTaskTable } from "../components/warehouse/WarehouseTaskTable";
import type { WarehouseTask, WarehouseTaskStatus } from "../types/warehouse";

type LoadState = "loading" | "success" | "empty" | "error";

export function WarehousePage() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [tasks, setTasks] = useState<WarehouseTask[]>([]);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  const loadTasks = useCallback(async () => {
    setLoadState("loading");
    setErrorMessage("");

    try {
      const data = await fetchWarehouseTasks();
      setTasks(data);
      setLoadState(data.length === 0 ? "empty" : "success");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Failed to load warehouse tasks."));
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const handleAdvanceStatus = async (
    task: WarehouseTask,
    nextStatus: WarehouseTaskStatus,
  ) => {
    try {
      await updateWarehouseTaskStatus(task.id, { status: nextStatus });
      setSnackbar({
        open: true,
        message: `Task ${task.id.slice(0, 8)} advanced to ${nextStatus}.`,
        severity: "success",
      });
      await loadTasks();
    } catch (error) {
      setSnackbar({
        open: true,
        message: getErrorMessage(error, "Failed to update task status."),
        severity: "error",
      });
    }
  };

  if (loadState === "loading") {
    return <LoadingState message="Loading warehouse tasks..." />;
  }

  if (loadState === "error") {
    return (
      <ErrorState message={errorMessage} onRetry={() => void loadTasks()} />
    );
  }

  if (loadState === "empty") {
    return <EmptyState message="No warehouse tasks found." />;
  }

  return (
    <>
      <Alert severity="success" sx={{ mb: 2 }}>
        Connected to warehouse-service REST API (GET /tasks, PATCH /tasks/:id/status).
      </Alert>

      <WarehouseTaskTable tasks={tasks} onAdvanceStatus={handleAdvanceStatus} />

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
