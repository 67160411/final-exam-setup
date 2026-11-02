const API = "/api";

let menus = [];
let orders = [];
let cart = [];

// เรียก API
async function api(url, options = {}) {
  const response = await fetch(url, options);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "เกิดข้อผิดพลาด");
  }

  return result;
}

// แสดงข้อความ
function message(id, text, type = "success") {
  const element = document.getElementById(id);
  element.textContent = text;
  element.className = `message-${type}`;
}

// =========================
// MENU
// =========================

// โหลดเมนู
async function loadMenus() {
  try {
    const result = await api(`${API}/menus`);
    menus = result.data || [];
    displayMenus();
  } catch (error) {
    message("menu-message", error.message, "error");
  }
}

// แสดงเมนู
function displayMenus() {
  const list = document.getElementById("menu-list");

  if (menus.length === 0) {
    list.innerHTML = "<p>ยังไม่มีเมนูอาหาร</p>";
    return;
  }

  list.innerHTML = menus
    .map(
      (menu) => `
    <div class="menu-card">
      <h3>${menu.name}</h3>
      <p class="price">${Number(menu.price).toFixed(2)} บาท</p>
      <p class="${menu.available ? "available" : "unavailable"}">
        ${menu.available ? "พร้อมขาย" : "หมด"}
      </p>

      <button onclick="addToCart(${Number(menu.id)})"
        ${menu.available ? "" : "disabled"}>
        เพิ่มลงตะกร้า
      </button>

      <button class="gray" onclick="editMenu(${Number(menu.id)})">
        แก้ไข
      </button>

      <button class="danger" onclick="deleteMenu(${Number(menu.id)})">
        ลบ
      </button>
    </div>
  `,
    )
    .join("");
}

// เพิ่มหรือแก้ไขเมนู
document.getElementById("menu-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = document.getElementById("menu-id").value;

  const data = {
    name: document.getElementById("menu-name").value.trim(),
    price: Number(document.getElementById("menu-price").value),
    available: true,
  };

  try {
    await api(id ? `${API}/menus/${id}` : `${API}/menus`, {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    message("menu-message", id ? "แก้ไขเมนูสำเร็จ" : "เพิ่มเมนูสำเร็จ");

    resetMenuForm();
    await loadMenus();
  } catch (error) {
    message("menu-message", error.message, "error");
  }
});

// แก้ไขเมนู
function editMenu(id) {
  const menu = menus.find((item) => Number(item.id) === id);
  if (!menu) return;

  document.getElementById("menu-id").value = menu.id;
  document.getElementById("menu-name").value = menu.name;
  document.getElementById("menu-price").value = menu.price;
  document.getElementById("menu-available").checked =
    menu.available === true || menu.available === 1 || menu.available === "1";

  document.getElementById("save-menu").textContent = "บันทึกการแก้ไข";
}

// ลบเมนู
async function deleteMenu(id) {
  if (!confirm("ต้องการลบเมนูนี้หรือไม่?")) return;

  try {
    await api(`${API}/menus/${id}`, { method: "DELETE" });

    cart = cart.filter((item) => item.menu_item_id !== id);

    displayCart();
    await loadMenus();

    message("menu-message", "ลบเมนูสำเร็จ");
  } catch (error) {
    message("menu-message", error.message, "error");
  }
}

// ล้างฟอร์มเมนู
function resetMenuForm() {
  document.getElementById("menu-form").reset();
  document.getElementById("menu-id").value = "";
  document.getElementById("save-menu").textContent = "เพิ่มเมนู";
}

document.getElementById("cancel-edit").addEventListener("click", resetMenuForm);

// =========================
// CART
// =========================

// เพิ่มสินค้า
function addToCart(id) {
  const menu = menus.find((item) => Number(item.id) === id);

  if (!menu) return;

  const existing = cart.find((item) => item.menu_item_id === id);

  if (existing) {
    existing.quantity++;
  } else {
    cart.push({
      menu_item_id: id,
      name: menu.name,
      price: Number(menu.price),
      quantity: 1,
    });
  }

  displayCart();
}

// เพิ่มหรือลดจำนวน
function changeQuantity(id, amount) {
  const item = cart.find((item) => item.menu_item_id === id);

  if (!item) return;

  item.quantity += amount;

  if (item.quantity <= 0) {
    cart = cart.filter((item) => item.menu_item_id !== id);
  }

  displayCart();
}

// แสดงตะกร้า
function displayCart() {
  const list = document.getElementById("cart-list");

  if (cart.length === 0) {
    list.innerHTML = "<p>ยังไม่มีสินค้า</p>";
  } else {
    list.innerHTML = cart
      .map(
        (item) => `
      <div class="cart-item">
        <div>
          <strong>${item.name}</strong>
          <p>${item.price.toFixed(2)} บาท</p>
        </div>

        <div>
          <button onclick="changeQuantity(${item.menu_item_id}, -1)">-</button>
          ${item.quantity}
          <button onclick="changeQuantity(${item.menu_item_id}, 1)">+</button>
        </div>
      </div>
    `,
      )
      .join("");
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const count = cart.reduce((sum, item) => sum + item.quantity, 0);

  document.getElementById("total-price").textContent = total.toFixed(2);
  document.getElementById("cart-count").textContent = count;
}

// =========================
// CREATE ORDER
// =========================

document.getElementById("order-button").addEventListener("click", async () => {
  const customerName = document.getElementById("customer-name").value.trim();

  if (!customerName) {
    message("order-message", "กรุณากรอกชื่อลูกค้า", "error");
    return;
  }

  if (cart.length === 0) {
    message("order-message", "กรุณาเลือกอาหารก่อน", "error");
    return;
  }

  const data = {
    customer_name: customerName,
    items: cart.map((item) => ({
      menu_item_id: item.menu_item_id,
      quantity: item.quantity,
    })),
  };

  const button = document.getElementById("order-button");
  button.disabled = true;

  try {
    await api(`${API}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    cart = [];
    displayCart();

    document.getElementById("customer-name").value = "";

    message("order-message", "สั่งอาหารสำเร็จ!");

    await loadOrders();
  } catch (error) {
    message("order-message", error.message, "error");
  } finally {
    button.disabled = false;
  }
});

// =========================
// ORDER MANAGEMENT
// =========================

// โหลดคำสั่งซื้อ
async function loadOrders() {
  try {
    const result = await api(`${API}/orders`);
    orders = result.data || [];
    displayOrders();
  } catch (error) {
    message("orders-list", error.message, "error");
  }
}

// รวมคำสั่งซื้อที่มี ID ซ้ำ
function groupOrders() {
  const grouped = {};

  orders.forEach((order) => {
    const id = order.id;

    if (!grouped[id]) {
      grouped[id] = {
        id,
        customer_name: order.customer_name,
        status: order.status,
        items: [],
      };
    }

    if (order.menu_name) {
      grouped[id].items.push(order);
    }
  });

  return Object.values(grouped);
}

// แสดงคำสั่งซื้อ
function displayOrders() {
  const list = document.getElementById("orders-list");

  const search = document.getElementById("order-search").value.toLowerCase();
  const filter = document.getElementById("status-filter").value;

  const filtered = groupOrders().filter((order) => {
    const matchSearch =
      String(order.id).includes(search) ||
      String(order.customer_name).toLowerCase().includes(search);

    const matchStatus = filter === "all" || order.status === filter;

    return matchSearch && matchStatus;
  });

  if (filtered.length === 0) {
    list.innerHTML = "<p>ไม่พบคำสั่งซื้อ</p>";
    return;
  }

  list.innerHTML = filtered
    .map((order) => {
      const total = order.items.reduce(
        (sum, item) => sum + Number(item.price) * Number(item.quantity),
        0,
      );

      return `
      <div class="order-card">
        <h3>คำสั่งซื้อ #${order.id}</h3>

        <p>ลูกค้า: ${order.customer_name}</p>
        <p>สถานะ: ${order.status}</p>

        <div class="order-items">
          <strong>รายการอาหาร</strong>
          ${order.items
            .map(
              (item) => `
            <p>${item.menu_name} x ${item.quantity}</p>
          `,
            )
            .join("")}

          <strong>รวม ${total.toFixed(2)} บาท</strong>
        </div>

        <select onchange="updateStatus(${order.id}, this.value)">
          <option value="pending" ${order.status === "pending" ? "selected" : ""}>
            รอดำเนินการ
          </option>
          <option value="preparing" ${order.status === "preparing" ? "selected" : ""}>
            กำลังเตรียม
          </option>
          <option value="delivered" ${order.status === "delivered" ? "selected" : ""}>
            จัดส่งแล้ว
          </option>
        </select>

        <button class="danger" onclick="deleteOrder(${order.id})">
          ลบคำสั่งซื้อ
        </button>
      </div>
    `;
    })
    .join("");
}

// เปลี่ยนสถานะ
async function updateStatus(id, status) {
  try {
    await api(`${API}/orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    await loadOrders();
  } catch (error) {
    alert(error.message);
  }
}

// ลบคำสั่งซื้อ
async function deleteOrder(id) {
  if (!confirm("ต้องการลบคำสั่งซื้อนี้หรือไม่?")) return;

  try {
    await api(`${API}/orders/${id}`, {
      method: "DELETE",
    });

    await loadOrders();
  } catch (error) {
    alert(error.message);
  }
}

// ค้นหาและกรอง
document
  .getElementById("order-search")
  .addEventListener("input", displayOrders);

document
  .getElementById("status-filter")
  .addEventListener("change", displayOrders);

document
  .getElementById("refresh-orders")
  .addEventListener("click", async () => {
    await loadMenus();
    await loadOrders();
  });

// เริ่มต้นระบบ
loadMenus();
loadOrders();
displayCart();
