const express = require("express");
const router = express.Router();

const {
  getOrders,
  createOrder,
  updateOrderStatus,
  deleteOrder, // เพิ่มบรรทัดนี้
} = require("../controllers/orderController");

// GET ดึงข้อมูลคำสั่งซื้อทั้งหมด
router.get("/", getOrders);

// POST สร้างคำสั่งซื้อใหม่
router.post("/", createOrder);

// PATCH แก้ไขสถานะคำสั่งซื้อ
router.patch("/:id/status", updateOrderStatus);

// DELETE ลบคำสั่งซื้อ
router.delete("/:id", deleteOrder);

module.exports = router;
