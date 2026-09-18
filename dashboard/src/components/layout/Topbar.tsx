import { AppBar, Box, IconButton, Toolbar, Typography } from "@mui/material";
import { Menu } from "lucide-react";
import { SIDEBAR_WIDTH } from "./Sidebar";

interface TopbarProps {
  title: string;
  systemOnline?: boolean;
  onMenuClick: () => void;
}

export function Topbar({ title, systemOnline = true, onMenuClick }: TopbarProps) {
  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: "background.paper",
        color: "text.primary",
        borderBottom: "1px solid",
        borderColor: "divider",
        width: { md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
        ml: { md: `${SIDEBAR_WIDTH}px` },
      }}
    >
      <Toolbar sx={{ minHeight: 64 }}>
        <IconButton
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 1, display: { md: "none" } }}
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </IconButton>

        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
          {title}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: systemOnline ? "success.main" : "error.main",
            }}
          />
          <Typography variant="body2" color="text.secondary">
            System {systemOnline ? "Online" : "Degraded"}
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
