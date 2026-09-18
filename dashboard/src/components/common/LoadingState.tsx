import { Box, CircularProgress, Typography } from "@mui/material";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 8,
        gap: 2,
      }}
    >
      <CircularProgress size={32} />
      <Typography color="text.secondary">{message}</Typography>
    </Box>
  );
}
