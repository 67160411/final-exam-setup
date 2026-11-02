const request = require("supertest");
const app = require("../src/app");
const { pool } = require("../db");

describe("Order API", () => {
  let orderId;

  // Test 1: ดึงรายการคำสั่งซื้อ
  test("GET /api/orders should return status 200", async () => {
    const response = await request(app).get("/api/orders");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
  });

  // Test 2: สร้างคำสั่งซื้อ
  test("POST /api/orders should create a new order", async () => {
    const response = await request(app)
      .post("/api/orders")
      .send({
        customer_name: "ลูกค้าทดสอบ",
        items: [
          {
            menu_item_id: 1,
            quantity: 2,
          },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("data.order_id");

    orderId = response.body.data.order_id;
  });

  // Test 3: ไม่ส่งชื่อลูกค้า
  test("POST /api/orders should return 400 if customer name is missing", async () => {
    const response = await request(app)
      .post("/api/orders")
      .send({
        items: [{ menu_item_id: 1, quantity: 2 }],
      });

    expect(response.status).toBe(400);
  });

  // Test 4: ไม่ส่งสถานะคำสั่งซื้อ
  test("PATCH /api/orders/:id/status should return 400 if status is missing", async () => {
    const response = await request(app).patch("/api/orders/1/status").send({});

    expect(response.status).toBe(400);
  });

  // Test 5: ส่งสถานะที่ไม่อนุญาต
  test("PATCH /api/orders/:id/status should return 400 for invalid status", async () => {
    const response = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .send({
        status: "cancelled",
      });

    expect(response.status).toBe(400);
  });

  // Test 6: เปลี่ยนสถานะคำสั่งซื้อที่ไม่มีอยู่
  test("PATCH /api/orders/:id/status should return 404 if order not found", async () => {
    const response = await request(app)
      .patch("/api/orders/999999/status")
      .send({
        status: "preparing",
      });

    expect(response.status).toBe(404);
  });

  // Test 7: ไม่ส่งรายการอาหาร
  test("POST /api/orders should return 400 if items are missing", async () => {
    const response = await request(app).post("/api/orders").send({
      customer_name: "ลูกค้าทดสอบ",
    });

    expect(response.status).toBe(400);
  });

  // Test 8: จำนวนอาหารเป็น 0
  test("POST /api/orders should return 400 if quantity is zero", async () => {
    const response = await request(app)
      .post("/api/orders")
      .send({
        customer_name: "ลูกค้าทดสอบ",
        items: [{ menu_item_id: 1, quantity: 0 }],
      });

    expect(response.status).toBe(400);
  });

  // Test 9: จำนวนอาหารติดลบ
  test("POST /api/orders should return 400 if quantity is negative", async () => {
    const response = await request(app)
      .post("/api/orders")
      .send({
        customer_name: "ลูกค้าทดสอบ",
        items: [{ menu_item_id: 1, quantity: -2 }],
      });

    expect(response.status).toBe(400);
  });

  // ลบข้อมูลทดสอบหลังจาก Test ทั้งหมดเสร็จ
  afterAll(async () => {
    try {
      if (orderId) {
        await pool.execute("DELETE FROM order_items WHERE order_id = ?", [
          orderId,
        ]);

        await pool.execute("DELETE FROM orders WHERE id = ?", [orderId]);
      }
    } finally {
      await pool.end();
    }
  });
});
