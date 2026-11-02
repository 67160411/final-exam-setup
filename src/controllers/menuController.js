const { pool } = require("../../db");

// GET: แสดงเมนูอาหารทั้งหมด
async function getMenus(req, res) {
  try {
    // ดึงข้อมูลจากตาราง menu_items
    const [rows] = await pool.execute("SELECT * FROM menu_items");

    // ส่งข้อมูลกลับไปให้ผู้ใช้งาน
    res.status(200).json({
      message: "Get menus successfully",
      data: rows,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

// เพิ่มเมนูใหม่
async function createMenu(req, res) {
  try {
    // รับข้อมูลจากผู้ใช้
    const { name, price, available } = req.body;

    // ตรวจสอบข้อมูล
    if (!name || price === undefined) {
      return res.status(400).json({
        message: "Name and price are required",
      });
    }

    // บันทึกข้อมูลลงฐานข้อมูล
    const sql = `
      INSERT INTO menu_items (name, price, available)
      VALUES (?, ?, ?)
    `;

    const [result] = await pool.execute(sql, [
      name,
      price,
      available === undefined ? true : available,
    ]);

    // ส่งผลลัพธ์กลับ
    res.status(201).json({
      message: "Menu created successfully",
      data: {
        id: result.insertId,
        name,
        price,
        available: available === undefined ? true : available,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

// แก้ไขเมนู
async function updateMenu(req, res) {
  try {
    // รับ id จาก URL
    const { id } = req.params;

    // รับข้อมูลจาก Body
    const { name, price, available } = req.body;

    // ตรวจสอบข้อมูล
    if (!name || price === undefined || available === undefined) {
      return res.status(400).json({
        message: "Please provide name, price and available",
      });
    }

    // อัปเดตข้อมูลในฐานข้อมูล
    const sql = `
      UPDATE menu_items
      SET name = ?, price = ?, available = ?
      WHERE id = ?
    `;

    const [result] = await pool.execute(sql, [name, price, available, id]);

    // ตรวจสอบว่าพบเมนูที่ต้องการแก้ไขหรือไม่
    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Menu not found",
      });
    }

    res.status(200).json({
      message: "Menu updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

// แก้ไขข้อมูลบางส่วน
async function patchMenu(req, res) {
  try {
    const { id } = req.params;
    const { name, price, available } = req.body;

    // ตรวจสอบว่ามีข้อมูลส่งมาหรือไม่
    if (name === undefined && price === undefined && available === undefined) {
      return res.status(400).json({
        message: "No data provided",
      });
    }

    // ตรวจสอบว่ามีเมนูนี้หรือไม่
    const [rows] = await pool.execute("SELECT * FROM menu_items WHERE id = ?", [
      id,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Menu not found",
      });
    }

    // ใช้ค่าเดิมหากไม่ได้ส่งฟิลด์นั้นมา
    const oldMenu = rows[0];

    const sql = `
      UPDATE menu_items
      SET name = ?, price = ?, available = ?
      WHERE id = ?
    `;

    await pool.execute(sql, [
      name === undefined ? oldMenu.name : name,
      price === undefined ? oldMenu.price : price,
      available === undefined ? oldMenu.available : available,
      id,
    ]);

    res.status(200).json({
      message: "Menu updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

// ลบเมนู
async function deleteMenu(req, res) {
  try {
    // รับ id จาก URL
    const { id } = req.params;

    // ลบข้อมูลจากฐานข้อมูล
    const sql = "DELETE FROM menu_items WHERE id = ?";

    const [result] = await pool.execute(sql, [id]);

    // ตรวจสอบว่ามีเมนูที่ถูกลบหรือไม่
    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Menu not found",
      });
    }

    res.status(200).json({
      message: "Menu deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

module.exports = {
  getMenus,
  createMenu,
  updateMenu,
  patchMenu,
  deleteMenu,
};
