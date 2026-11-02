const express = require("express");
const router = express.Router();

const {
  getMenus,
  createMenu,
  updateMenu,
  patchMenu,
  deleteMenu,
} = require("../controllers/menuController");

// GET ดึงเมนูทั้งหมด
router.get("/", getMenus);

// POST เพิ่มเมนูใหม่
router.post("/", createMenu);

// PUT แก้ไขเมนู
router.put("/:id", updateMenu);

// PATCH แก้ไขข้อมูลบางส่วน
router.patch("/:id", patchMenu);

// DELETE ลบเมนู
router.delete("/:id", deleteMenu);

module.exports = router;
