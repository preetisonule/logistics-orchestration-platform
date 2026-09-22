import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  AUTOMATION_PIPELINE_STORAGE_KEY,
  parseAutomationPipelineMode,
  type AutomationPipelineMode,
} from "../types/automationMode";

interface AutomationPipelineContextValue {
  mode: AutomationPipelineMode;
  setMode: (mode: AutomationPipelineMode) => void;
  isAutonomous: boolean;
}

const AutomationPipelineContext = createContext<AutomationPipelineContextValue | null>(
  null,
);

function readStoredMode(): AutomationPipelineMode {
  if (typeof window === "undefined") {
    return "MANUAL";
  }
  return parseAutomationPipelineMode(
    localStorage.getItem(AUTOMATION_PIPELINE_STORAGE_KEY),
  );
}

export function AutomationPipelineProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<AutomationPipelineMode>(readStoredMode);

  const setMode = useCallback((next: AutomationPipelineMode) => {
    setModeState(next);
    localStorage.setItem(AUTOMATION_PIPELINE_STORAGE_KEY, next);
  }, []);

  const value = useMemo(
    () => ({
      mode,
      setMode,
      isAutonomous: mode === "AUTONOMOUS",
    }),
    [mode, setMode],
  );

  return (
    <AutomationPipelineContext.Provider value={value}>
      {children}
    </AutomationPipelineContext.Provider>
  );
}

export function useAutomationPipelineMode(): AutomationPipelineContextValue {
  const context = useContext(AutomationPipelineContext);
  if (!context) {
    throw new Error("useAutomationPipelineMode must be used within AutomationPipelineProvider");
  }
  return context;
}
