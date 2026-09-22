export type AutomationMode = "AUTONOMOUS" | "MANUAL";

export function parseAutomationMode(value: unknown): AutomationMode {
  return value === "AUTONOMOUS" ? "AUTONOMOUS" : "MANUAL";
}
