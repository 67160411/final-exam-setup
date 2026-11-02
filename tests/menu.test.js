const request = require("supertest");
const app = require("../src/app");
const { pool } = require("../db");

describe("Menu API", () => {
  // เก็บ ID ของเมนูที่สร้างจากการทดสอบ
  const createdMenuIds = [];

  // Test 1: ดึงข้อมูลเมนู
  test("GET /api/menus should return status 200", async () => {
    const response = await request(app).get("/api/menus");

    expect(response.status).toBe(200);
  });

  // Test 2: เพิ่มเมนู
  test("POST /api/menus should create a new menu", async () => {
    const response = await request(app).post("/api/menus").send({
      name: "โค้ก",
      price: 25,
      available: true,
    });

    if (response.body.data?.id) {
      createdMenuIds.push(response.body.data.id);
    }

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("data");
  });

  // Test 3: ลบเมนูที่ไม่มีอยู่
  test("DELETE /api/menus/:id should return 404 if menu not found", async () => {
    const response = await request(app).delete("/api/menus/99999");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Menu not found");
  });

  // Test 4: ไม่ส่งชื่อเมนู
  test("POST /api/menus should return 400 if name is missing", async () => {
    const response = await request(app).post("/api/menus").send({
      price: 60,
      available: true,
    });

    expect(response.status).toBe(400);
  });

  // Test 5: ราคาไม่ถูกต้อง
  test("POST /api/menus should return 400 if price is invalid", async () => {
    const response = await request(app).post("/api/menus").send({
      name: "ข้าวผัด",
      price: -10,
      available: true,
    });

    expect(response.status).toBe(400);
  });

  // Test 6: แก้ไขเมนู
  test("PUT /api/menus/:id should update menu", async () => {
    const createResponse = await request(app).post("/api/menus").send({
      name: "เมนูสำหรับแก้ไข",
      price: 50,
      available: true,
    });

    if (createResponse.body.data?.id) {
      createdMenuIds.push(createResponse.body.data.id);
    }

    expect(createResponse.status).toBe(201);

    const menuId = createResponse.body.data.id;

    const response = await request(app).put(`/api/menus/${menuId}`).send({
      name: "สปาเก็ตตี้",
      price: 70,
      available: true,
    });

    expect(response.status).toBe(200);
  });

  // ลบเมนูที่สร้างจากการทดสอบ
  afterAll(async () => {
    try {
      for (const id of createdMenuIds) {
        await pool.execute("DELETE FROM menu_items WHERE id = ?", [id]);
      }
    } finally {
      await pool.end();
    }
  });
});
