export interface ActivityItem {
  id: string;
  time: string;
  label: string;
  source: "mock" | "derived";
}

/**
 * TODO: Replace with aggregated activity from a backend Event/Activity API.
 * Currently uses illustrative mock data for the dashboard home feed.
 */
export function getMockRecentActivity(): ActivityItem[] {
  return [
    {
      id: "act-1",
      time: "10:42",
      label: "Inventory reserved",
      source: "mock",
    },
    {
      id: "act-2",
      time: "10:43",
      label: "Warehouse task created",
      source: "mock",
    },
    {
      id: "act-3",
      time: "10:44",
      label: "Package ready",
      source: "mock",
    },
    {
      id: "act-4",
      time: "10:44",
      label: "Carrier selected",
      source: "mock",
    },
    {
      id: "act-5",
      time: "10:45",
      label: "Shipment created",
      source: "mock",
    },
  ];
}
