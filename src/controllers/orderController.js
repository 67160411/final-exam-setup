const { pool } = require("../../db");

// ดึงข้อมูลคำสั่งซื้อทั้งหมด
async function getOrders(req, res) {
  try {
    const sql = `
      SELECT
        o.id,
        o.customer_name,
        o.status,
        o.created_at,
        m.name AS menu_name,
        m.price,
        oi.quantity
      FROM orders o
      JOIN order_items oi
        ON o.id = oi.order_id
      JOIN menu_items m
        ON oi.menu_item_id = m.id
      ORDER BY o.id DESC
    `;

    const [rows] = await pool.execute(sql);

    res.status(200).json({
      message: "Get orders successfully",
      data: rows,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

// สร้างคำสั่งซื้อใหม่
async function createOrder(req, res) {
  // รับข้อมูลจากผู้ใช้
  const { customer_name, items } = req.body;

  // ตรวจสอบข้อมูลเบื้องต้น
  if (!customer_name || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      message: "Customer name and items are required",
    });
  }

  // ตรวจสอบรายการสินค้า
  for (const item of items) {
    if (
      !Number.isInteger(Number(item.menu_item_id)) ||
      !Number.isInteger(Number(item.quantity)) ||
      Number(item.menu_item_id) <= 0 ||
      Number(item.quantity) <= 0
    ) {
      return res.status(400).json({
        message: "Invalid menu item or quantity",
      });
    }
  }

  // ขอ connection สำหรับทำ Transaction
  const connection = await pool.getConnection();

  try {
    // เริ่ม Transaction
    await connection.beginTransaction();

    // ตรวจสอบว่าเมนูที่สั่งมีอยู่จริง
    for (const item of items) {
      const [menus] = await connection.execute(
        "SELECT id FROM menu_items WHERE id = ?",
        [item.menu_item_id],
      );

      if (menus.length === 0) {
        await connection.rollback();

        return res.status(404).json({
          message: `Menu ID ${item.menu_item_id} not found`,
        });
      }
    }

    // เพิ่มคำสั่งซื้อ
    const [orderResult] = await connection.execute(
      "INSERT INTO orders (customer_name) VALUES (?)",
      [customer_name],
    );

    // รับ ID ของคำสั่งซื้อที่เพิ่งสร้าง
    const orderId = orderResult.insertId;

    // เพิ่มรายการสินค้าในคำสั่งซื้อ
    for (const item of items) {
      await connection.execute(
        `INSERT INTO order_items
        (order_id, menu_item_id, quantity)
        VALUES (?, ?, ?)`,
        [orderId, item.menu_item_id, item.quantity],
      );
    }

    // ยืนยันการบันทึกข้อมูลทั้งหมด
    await connection.commit();

    res.status(201).json({
      message: "Order created successfully",
      data: {
        order_id: orderId,
      },
    });
  } catch (error) {
    // หากเกิดข้อผิดพลาด ยกเลิกการบันทึก
    await connection.rollback();

    res.status(500).json({
      message: "Internal Server Error",
    });
  } finally {
    // คืน connection กลับสู่ pool
    connection.release();
  }
}

// เปลี่ยนสถานะคำสั่งซื้อ
async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // ตรวจสอบสถานะที่อนุญาต
    const allowedStatus = ["pending", "preparing", "delivered"];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        message: "Invalid status",
      });
    }

    // อัปเดตสถานะ
    const sql = `
      UPDATE orders
      SET status = ?
      WHERE id = ?
    `;

    const [result] = await pool.execute(sql, [status, id]);

    // ตรวจสอบว่าพบคำสั่งซื้อหรือไม่
    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    res.status(200).json({
      message: "Order status updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

// DELETE ลบคำสั่งซื้อ
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    // ตรวจสอบว่ามีคำสั่งซื้อนี้หรือไม่
    const [orders] = await pool.query("SELECT id FROM orders WHERE id = ?", [
      id,
    ]);

    if (orders.length === 0) {
      return res.status(404).json({
        message: "ไม่พบคำสั่งซื้อ",
      });
    }

    // ลบรายการอาหารในคำสั่งซื้อก่อน
    await pool.query("DELETE FROM order_items WHERE order_id = ?", [id]);

    // ลบคำสั่งซื้อ
    await pool.query("DELETE FROM orders WHERE id = ?", [id]);

    res.json({
      message: "ลบคำสั่งซื้อสำเร็จ",
    });
  } catch (error) {
    res.status(500).json({
      message: "เกิดข้อผิดพลาดในการลบคำสั่งซื้อ",
      error: error.message,
    });
  }
};

module.exports = {
  getOrders,
  createOrder,
  updateOrderStatus,
  deleteOrder,
};
