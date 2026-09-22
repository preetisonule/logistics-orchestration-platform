import http from "node:http";

const INVENTORY_SERVICE_URL = process.env.INVENTORY_URL || "http://localhost:3000";

async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  return { status: response.status, data };
}

async function getJson(url) {
  const response = await fetch(url);
  const data = await response.json();
  return { status: response.status, data };
}

async function seedDemo() {
  console.log("🌱 Starting Logistics Platform Demo Seeder...");
  console.log(`Target Inventory Service: ${INVENTORY_SERVICE_URL}\n`);

  try {
    // 1. Fetch or Create Demo Product
    console.log("1. Checking existing products...");
    const productsRes = await getJson(`${INVENTORY_SERVICE_URL}/products`);
    let product;

    if (productsRes.status === 200 && Array.isArray(productsRes.data) && productsRes.data.length > 0) {
      product = productsRes.data[0];
      console.log(`✔ Reusing existing product: ${product.name} (SKU: ${product.sku}, Weight: ${product.weightKg}kg) - ID: ${product.id}`);
    } else {
      const createProdRes = await postJson(`${INVENTORY_SERVICE_URL}/products`, {
        name: "Ergonomic Office Chair",
        sku: "FURN-CHAIR-001",
        weightKg: 12.5,
      });

      if (createProdRes.status === 201 || createProdRes.status === 200) {
        product = createProdRes.data;
        console.log(`✔ Created new product: ${product.name} (SKU: ${product.sku}, Weight: ${product.weightKg}kg) - ID: ${product.id}`);
      } else {
        console.error("❌ Failed to create product:", createProdRes.data);
        return;
      }
    }

    // 2. Fetch or Create Demo Warehouse
    console.log("\n2. Checking existing warehouses...");
    const warehousesRes = await getJson(`${INVENTORY_SERVICE_URL}/warehouses`);
    let warehouse;

    if (warehousesRes.status === 200 && Array.isArray(warehousesRes.data) && warehousesRes.data.length > 0) {
      warehouse = warehousesRes.data[0];
      console.log(`✔ Reusing existing warehouse: ${warehouse.name} (${warehouse.location}) - ID: ${warehouse.id}`);
    } else {
      const createWhRes = await postJson(`${INVENTORY_SERVICE_URL}/warehouses`, {
        name: "Central Fulfilment Hub A",
        location: "Mumbai, MH",
      });

      if (createWhRes.status === 201 || createWhRes.status === 200) {
        warehouse = createWhRes.data;
        console.log(`✔ Created new warehouse: ${warehouse.name} (${warehouse.location}) - ID: ${warehouse.id}`);
      } else {
        console.error("❌ Failed to create warehouse:", createWhRes.data);
        return;
      }
    }

    // 3. Fetch or Create Demo Inventory Record
    console.log("\n3. Checking existing inventory stock...");
    const inventoryRes = await getJson(`${INVENTORY_SERVICE_URL}/inventory`);
    let inventoryItem;

    if (inventoryRes.status === 200 && Array.isArray(inventoryRes.data)) {
      inventoryItem = inventoryRes.data.find(
        (inv) => inv.productId === product.id && inv.warehouseId === warehouse.id
      );
    }

    if (inventoryItem) {
      console.log(`✔ Reusing existing inventory record: Available: ${inventoryItem.totalQuantity - inventoryItem.reservedQuantity}/${inventoryItem.totalQuantity} - ID: ${inventoryItem.id}`);
    } else {
      const createInvRes = await postJson(`${INVENTORY_SERVICE_URL}/inventory`, {
        productId: product.id,
        warehouseId: warehouse.id,
        totalQuantity: 150,
      });

      if (createInvRes.status === 201 || createInvRes.status === 200) {
        inventoryItem = createInvRes.data;
        console.log(`✔ Created new inventory stock: Total Quantity: ${inventoryItem.totalQuantity} - ID: ${inventoryItem.id}`);
      } else {
        console.error("❌ Failed to create inventory:", createInvRes.data);
        return;
      }
    }

    console.log("\n==================================================");
    console.log("🚀 DEMO SEEDING COMPLETED SUCCESSFULLY!");
    console.log("==================================================");
    console.log(`Product ID:   ${product.id}`);
    console.log(`Warehouse ID: ${warehouse.id}`);
    console.log(`Inventory ID: ${inventoryItem.id}`);
    console.log("==================================================");
    console.log(`You can now reserve inventory by clicking 'Reserve Stock' in the Dashboard or calling:`);
    console.log(`POST ${INVENTORY_SERVICE_URL}/inventory/${inventoryItem.id}/reserve {"quantity": 2, "serviceLevel": "EXPRESS"}\n`);
  } catch (err) {
    console.error("❌ Error during demo seeding:", err.message || err);
  }
}

seedDemo();
