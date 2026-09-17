import "dotenv/config";
import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "carrier-selection-service",
  brokers: ["localhost:9092"],
});

const consumer = kafka.consumer({
  groupId: "carrier-selection-service-group",
});

const producer = kafka.producer();

/*
  Available carriers.
  Later these could come from a database/config service.
*/
const carriers = [
  {
    name: "DELHIVERY",
    maxWeight: 20,
    supportedSLA: ["STANDARD", "EXPRESS"],
  },
  {
    name: "BLUEDART",
    maxWeight: 10,
    supportedSLA: ["EXPRESS"],
  },
  {
    name: "DTDC",
    maxWeight: 15,
    supportedSLA: ["STANDARD"],
  },
];

/*
  Carrier selection logic.
*/
function selectCarrier(weight: number, sla: string) {
  const eligibleCarriers = carriers.filter(
    (carrier) =>
      carrier.maxWeight >= weight &&
      carrier.supportedSLA.includes(sla)
  );

  if (eligibleCarriers.length === 0) {
    throw new Error(
      `No carrier available for weight=${weight}, SLA=${sla}`
    );
  }

  /*
    Simple deterministic rule:
    choose the first eligible carrier.
    
    We can make this smarter later using:
    - price
    - delivery time
    - carrier reliability
    - destination coverage
  */
  return eligibleCarriers[0];
}

async function start() {
  await producer.connect();
  await consumer.connect();

  await consumer.subscribe({
    topic: "warehouse-events",
    fromBeginning: false,
  });

  console.log("🚚 Carrier Selection Service connected");

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;

      const event = JSON.parse(message.value.toString());

      console.log("📦 Event received:", event);

      if (event.event !== "PACKAGE_READY") {
        return;
      }

      /*
        For now, we use sample shipment properties.
        Later Shipment Service / Order Service will provide
        actual destination, weight and SLA.
      */
      const weight = 2;
      const sla = "EXPRESS";

      const carrier = selectCarrier(weight, sla);

      console.log("🚚 Carrier selected:", carrier.name);

      await producer.send({
        topic: "carrier-events",
        messages: [
          {
            value: JSON.stringify({
              event: "CARRIER_SELECTED",

              taskId: event.taskId,
              productId: event.productId,
              warehouseId: event.warehouseId,
              quantity: event.quantity,

              carrier: carrier.name,
              serviceLevel: sla,
              weight,
            }),
          },
        ],
      });

      console.log("🚚 CARRIER_SELECTED event published");
    },
  });
}

start().catch((error) => {
  console.error("Carrier Selection Service failed:", error);
});