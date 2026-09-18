import {
  Alert,
  Box,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
} from "@mui/material";
import type { ActivityItem } from "../../services/activityService";

interface ActivityFeedProps {
  activities: ActivityItem[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const isMock = activities.some((item) => item.source === "mock");

  return (
    <Paper sx={{ p: 3, height: "100%" }}>
      <Typography variant="h6" sx={{ mb: 0.5 }}>
        Recent Activity
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        Latest operational events across the platform
      </Typography>

      {isMock && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Illustrative activity feed — connect to a backend Event API for live data.
        </Alert>
      )}

      <List disablePadding>
        {activities.map((activity) => (
          <ListItem
            key={activity.id}
            disableGutters
            sx={{
              py: 1.25,
              borderBottom: "1px solid",
              borderColor: "divider",
              "&:last-child": { borderBottom: "none" },
            }}
          >
            <Box
              sx={{
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: "0.8rem",
                color: "text.secondary",
                minWidth: 52,
                mr: 2,
              }}
            >
              {activity.time}
            </Box>
            <ListItemText
              primary={activity.label}
              slotProps={{ primary: { sx: { fontSize: "0.9rem" } } }}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}
