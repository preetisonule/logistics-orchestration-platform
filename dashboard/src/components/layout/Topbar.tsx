import {
  AppBar,
  Box,
  FormControlLabel,
  IconButton,
  Switch,
  Toolbar,
  Typography,
} from "@mui/material";
import { Menu } from "lucide-react";
import { useAutomationPipelineMode } from "../../context/AutomationPipelineContext";
import { SIDEBAR_WIDTH } from "./Sidebar";

interface TopbarProps {
  title: string;
  systemOnline?: boolean;
  onMenuClick: () => void;
}

export function Topbar({ title, systemOnline = true, onMenuClick }: TopbarProps) {
  const { mode, setMode, isAutonomous } = useAutomationPipelineMode();

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
      <Toolbar sx={{ minHeight: 64, gap: 2 }}>
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

        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          <FormControlLabel
            sx={{ mr: 0 }}
            control={
              <Switch
                checked={isAutonomous}
                onChange={(event) =>
                  setMode(event.target.checked ? "AUTONOMOUS" : "MANUAL")
                }
                slotProps={{ input: { "aria-label": "Autonomous pipeline mode" } }}
              />
            }
            label={
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                  Autonomous Pipeline
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {mode}
                </Typography>
              </Box>
            }
          />

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
        </Box>
      </Toolbar>
    </AppBar>
  );
}
