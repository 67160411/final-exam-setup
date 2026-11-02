const express = require("express");
const path = require("path");

const app = express();

// Import Routes
const menuRoutes = require("./routes/menuRoutes");
const orderRoutes = require("./routes/orderRoutes");

// อ่านข้อมูล JSON
app.use(express.json());

// เปิดหน้าเว็บไซต์จากโฟลเดอร์ frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// เชื่อมต่อ API Routes
app.use("/api/menus", menuRoutes);
app.use("/api/orders", orderRoutes);

// หน้าแรก กรณีไม่มีไฟล์ index.html
app.get("/", (req, res) => {
  res.json({
    message: "Food API is running",
  });
});

module.exports = app;
