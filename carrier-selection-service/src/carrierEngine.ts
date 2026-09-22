import { randomUUID } from "crypto";

export interface Carrier {
  name: string;
  maxWeight: number;
  supportedServiceLevels: string[];
  priority: number;
}

export const carriers: Carrier[] = [
  {
    name: "DELHIVERY",
    maxWeight: 30,
    supportedServiceLevels: ["STANDARD", "EXPRESS"],
    priority: 1,
  },
  {
    name: "BLUEDART",
    maxWeight: 15,
    supportedServiceLevels: ["EXPRESS"],
    priority: 2,
  },
  {
    name: "DTDC",
    maxWeight: 20,
    supportedServiceLevels: ["STANDARD"],
    priority: 3,
  },
];

export function selectCarrier(weightKg: number, serviceLevel: string): { carrier: Carrier; selectionReason: string } {
  const eligibleCarriers = carriers
    .filter(
      (carrier) =>
        carrier.maxWeight >= weightKg &&
        carrier.supportedServiceLevels.includes(serviceLevel)
    )
    .sort((a, b) => a.priority - b.priority);

  if (eligibleCarriers.length === 0) {
    throw new Error(
      `No carrier available for weight=${weightKg}kg, serviceLevel=${serviceLevel}`
    );
  }

  const selected = eligibleCarriers[0];
  const selectionReason = `Selected ${selected.name} (Priority ${selected.priority}): Eligible for ${serviceLevel} service and weight limit ${weightKg}kg <= ${selected.maxWeight}kg`;

  return { carrier: selected, selectionReason };
}

export function isValidEventEnvelope(event: unknown): boolean {
  if (typeof event !== "object" || event === null) return false;
  const e = event as Record<string, unknown>;
  return (
    typeof e.eventId === "string" &&
    typeof e.eventType === "string" &&
    typeof e.correlationId === "string" &&
    typeof e.data === "object" && e.data !== null
  );
}
