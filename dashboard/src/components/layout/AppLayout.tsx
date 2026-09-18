import { Box, Container } from "@mui/material";
import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar, SIDEBAR_WIDTH } from "./Sidebar";
import { Topbar } from "./Topbar";

const pageTitles: Record<string, string> = {
  "/dashboard": "Operations Overview",
  "/inventory": "Inventory Control",
  "/warehouse": "Warehouse Operations",
  "/shipments": "Shipment Tracking",
  "/events": "Event Stream",
};

function getPageTitle(pathname: string): string {
  if (pathname.startsWith("/shipments/") && pathname !== "/shipments") {
    return "Shipment Details";
  }
  return pageTitles[pathname] ?? "Logistics Ops";
}

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const title = getPageTitle(location.pathname);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
        }}
      >
        <Topbar title={title} onMenuClick={() => setMobileOpen(true)} />

        <Container maxWidth="xl" sx={{ py: 3 }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
}
