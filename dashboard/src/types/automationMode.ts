export type AutomationPipelineMode = "AUTONOMOUS" | "MANUAL";

export const AUTOMATION_PIPELINE_STORAGE_KEY = "logistics-ops-automation-pipeline-mode";

export function parseAutomationPipelineMode(value: string | null): AutomationPipelineMode {
  return value === "AUTONOMOUS" ? "AUTONOMOUS" : "MANUAL";
}
