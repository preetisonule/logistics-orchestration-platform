import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { DashboardPage } from "./pages/Dashboard";
import { EventsPage } from "./pages/Events";
import { InventoryPage } from "./pages/Inventory";
import { ShipmentDetailsPage } from "./pages/ShipmentDetails";
import { ShipmentsPage } from "./pages/Shipments";
import { WarehousePage } from "./pages/Warehouse";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/warehouse" element={<WarehousePage />} />
        <Route path="/shipments" element={<ShipmentsPage />} />
        <Route path="/shipments/:trackingNumber" element={<ShipmentDetailsPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
