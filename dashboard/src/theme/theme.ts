import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1e3a5f",
      light: "#2d5a87",
      dark: "#122840",
    },
    secondary: {
      main: "#4a6278",
    },
    background: {
      default: "#eef1f4",
      paper: "#ffffff",
    },
    text: {
      primary: "#1a2332",
      secondary: "#5c6b7a",
    },
    success: {
      main: "#2e7d5a",
    },
    warning: {
      main: "#b8860b",
    },
    error: {
      main: "#c0392b",
    },
    divider: "#d8dee6",
  },
  typography: {
    fontFamily: '"IBM Plex Sans", "Segoe UI", sans-serif',
    h4: {
      fontWeight: 600,
      letterSpacing: "-0.02em",
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    subtitle2: {
      fontWeight: 600,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      fontSize: "0.7rem",
    },
    body2: {
      color: "#5c6b7a",
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#eef1f4",
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          border: "1px solid #d8dee6",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          backgroundColor: "#f4f6f8",
          color: "#5c6b7a",
          fontSize: "0.75rem",
          letterSpacing: "0.03em",
          textTransform: "uppercase",
        },
      },
    },
  },
});
