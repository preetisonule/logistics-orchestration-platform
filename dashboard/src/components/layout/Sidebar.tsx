import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import {
  Activity,
  LayoutDashboard,
  Package,
  Truck,
  Warehouse,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const DRAWER_WIDTH = 240;

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Inventory", path: "/inventory", icon: Package },
  { label: "Warehouse", path: "/warehouse", icon: Warehouse },
  { label: "Shipments", path: "/shipments", icon: Truck },
  { label: "Events", path: "/events", icon: Activity },
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function SidebarContent() {
  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ px: 2.5, py: 2.5, borderBottom: "1px solid", borderColor: "divider" }}>
        <Typography variant="h6" sx={{ color: "primary.main", fontWeight: 700 }}>
          Logistics Ops
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Operations Console
        </Typography>
      </Box>

      <List sx={{ px: 1.5, py: 2, flex: 1 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <ListItemButton
              key={item.path}
              component={NavLink}
              to={item.path}
              sx={{
                mb: 0.5,
                borderRadius: 1,
                "&.active": {
                  bgcolor: "primary.main",
                  color: "common.white",
                  "& .MuiListItemIcon-root": { color: "common.white" },
                  "&:hover": { bgcolor: "primary.dark" },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: "text.secondary" }}>
                <Icon size={18} />
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                slotProps={{ primary: { sx: { fontSize: "0.9rem", fontWeight: 500 } } }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <Box sx={{ px: 2.5, py: 2, borderTop: "1px solid", borderColor: "divider" }}>
        <Typography variant="caption" color="text.secondary">
          Distributed Logistics Platform
        </Typography>
      </Box>
    </Box>
  );
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  return (
    <>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box" },
        }}
      >
        <SidebarContent />
      </Drawer>

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            borderRight: "1px solid",
            borderColor: "divider",
          },
        }}
        open
      >
        <SidebarContent />
      </Drawer>
    </>
  );
}

export const SIDEBAR_WIDTH = DRAWER_WIDTH;
