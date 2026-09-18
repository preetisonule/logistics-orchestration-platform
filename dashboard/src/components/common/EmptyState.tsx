import { Box, Typography } from "@mui/material";

interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <Box sx={{ py: 6, textAlign: "center" }}>
      <Typography color="text.secondary">{message}</Typography>
    </Box>
  );
}
