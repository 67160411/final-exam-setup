const request = require("supertest");
const app = require("../src/app");

describe("Menu API", () => {
  // Test 1: ดึงข้อมูลเมนู
  test("GET /api/menus should return status 200", async () => {
    const response = await request(app).get("/api/menus");

    expect(response.status).toBe(200);
  });

  // Test 2: เพิ่มเมนู
  test("POST /api/menus should create a new menu", async () => {
    const response = await request(app).post("/api/menus").send({
      name: "ข้าวผัดทดสอบ",
      price: 60,
      available: true,
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("data");
  });

  // Test 3: ลบเมนูที่ไม่มีอยู่
  test("DELETE /api/menus/:id should return 404 if menu not found", async () => {
    const response = await request(app).delete("/api/menus/99999");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Menu not found");
  });
});
