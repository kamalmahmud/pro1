/****************************************
 *     GLOBAL DATA STRUCTURES
 ****************************************/

// We'll store these in localStorage. But first, define default arrays if localStorage is empty.
let farmers = [];
let purchases = [];
let orders = [];
let inventoryItems = [];
let categoryPricing = []; // Pricing for product categories
let packagedInventory = []; // how many units exist for each packaged category

/****************************************
 *   LOAD/SAVE from LOCAL STORAGE
 ****************************************/
function loadDataFromLocalStorage() {
  const farmersStr = localStorage.getItem("farmers");
  if (farmersStr) farmers = JSON.parse(farmersStr);

  const purchasesStr = localStorage.getItem("purchases");
  if (purchasesStr) purchases = JSON.parse(purchasesStr);

  const ordersStr = localStorage.getItem("orders");
  if (ordersStr) orders = JSON.parse(ordersStr);

  const inventoryStr = localStorage.getItem("inventoryItems");
  if (inventoryStr) inventoryItems = JSON.parse(inventoryStr);

  const categoryPricingStr = localStorage.getItem("categoryPricing");
  if (categoryPricingStr) {
    categoryPricing = JSON.parse(categoryPricingStr);
  } else {
    // If not in storage, load default
    categoryPricing = [
      { category: "Small (100g)", weightInfo: "0.1 kg", price: 5 },
      { category: "Medium (250g)", weightInfo: "0.25 kg", price: 10 },
      { category: "Large (500g)", weightInfo: "0.5 kg", price: 18 },
      { category: "Extra Large (1kg)", weightInfo: "1.0 kg", price: 30 },
      { category: "Family Pack (2kg)", weightInfo: "2.0 kg", price: 55 },
      { category: "Bulk Pack (5kg)", weightInfo: "5.0 kg", price: 120 },
      { category: "Premium (custom)", weightInfo: "Varies", price: 0 },
    ];
  }

  const packagedInvStr = localStorage.getItem("packagedInventory");
  if (packagedInvStr) {
    packagedInventory = JSON.parse(packagedInvStr);
  } else {
    // Initialize with default zero inventory if not stored
    packagedInventory = categoryPricing.map((cat) => ({
      category: cat.category,
      units: 0,
      totalKg: 0,
    }));
  }
}

function saveFarmers() {
  localStorage.setItem("farmers", JSON.stringify(farmers));
}

function savePurchases() {
  localStorage.setItem("purchases", JSON.stringify(purchases));
}

function saveOrders() {
  localStorage.setItem("orders", JSON.stringify(orders));
}

function saveInventoryItems() {
  localStorage.setItem("inventoryItems", JSON.stringify(inventoryItems));
}

function saveCategoryPricing() {
  localStorage.setItem("categoryPricing", JSON.stringify(categoryPricing));
}

function savePackagedInventory() {
  localStorage.setItem("packagedInventory", JSON.stringify(packagedInventory));
}

/****************************************
 *   EVENT: DOMContentLoaded
 ****************************************/
window.addEventListener("DOMContentLoaded", () => {
  // 1. Load data from localStorage
  loadDataFromLocalStorage();

  // 2. Initialize the UI sections
  initFarmersSection();
  initPurchasesSection();
  initExpenseCalculation();
  initPricingSection();
  initPackagingSection();
  initOrderSection();
  initRevenueSection();
  initFinancialAnalysis();
  initInventoryManagement();
  initComprehensiveReport();

  // Render everything once
  renderFarmersTable();
  renderPurchasesTable();
  renderOrdersTable();
  renderInventoryTable();
  renderPricingTable();
  renderPackagedInventory();
  recalcTotalRevenue();
});

/****************************************
 *  HELPER: Generate & Download CSV
 ****************************************/
function generateCSVStringFromArrayOfObjects(dataArray, headers) {
  let csvContent = headers.join(",") + "\n";
  dataArray.forEach((obj) => {
    let row = headers
      .map((h) => (obj[h] !== undefined ? obj[h] : ""))
      .join(",");
    csvContent += row + "\n";
  });
  return csvContent;
}

function downloadCSV(filename, csvContent) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/****************************************
 *  SUPPLIER MANAGEMENT
 ****************************************/
function initFarmersSection() {
  const farmerForm = document.getElementById("farmerForm");
  farmerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    addOrUpdateFarmer();
  });

  document
    .getElementById("farmerSearch")
    .addEventListener("input", renderFarmersTable);

  document
    .getElementById("exportFarmersCsv")
    .addEventListener("click", exportFarmersAsCsv);
}

function addOrUpdateFarmer() {
  const farmerId = document.getElementById("farmerId").value.trim();
  const name = document.getElementById("farmerName").value.trim();
  const phone = document.getElementById("farmerPhone").value.trim();
  const email = document.getElementById("farmerEmail").value.trim();
  const address = document.getElementById("farmerAddress").value.trim();
  const region = document.getElementById("farmerRegion").value.trim();
  const gps = document.getElementById("farmerGPS").value.trim();

  if (!farmerId || !name || !phone || !email || !address || !region || !gps) {
    alert(
      "All fields (ID, Name, Phone, Email, Address, Region, GPS) are required!"
    );
    return;
  }

  // Simple phone pattern (7-15 digits, optional + or -)
  const phonePattern = /^[0-9+\-]{7,15}$/;
  if (!phonePattern.test(phone)) {
    alert("Phone format is invalid. Example: +123-456789, 1234567, etc.");
    return;
  }

  // Simple email pattern
  const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  if (!emailPattern.test(email)) {
    alert("Please enter a valid email address. Example: name@example.com");
    return;
  }

  const existing = farmers.find((f) => f.farmerId === farmerId);

  if (existing) {
    // Prompt user for confirmation
    const confirmUpdate = confirm(
      `Farmer ID '${farmerId}' already exists.\n` +
        `Do you want to update this farmer's information?`
    );
    if (confirmUpdate) {
      // Proceed with update
      existing.name = name;
      existing.phone = phone;
      existing.email = email;
      existing.address = address;
      existing.region = region;
      existing.gps = gps;
      alert(`Farmer '${farmerId}' was updated successfully.`);
    } else {
      // User canceled; do nothing
      return;
    }
  } else {
    // ID does not exist; proceed to add new farmer
    farmers.push({
      farmerId,
      name,
      phone,
      email,
      address,
      region,
      gps,
    });
    alert(`New Farmer '${farmerId}' added successfully.`);
  }

  document.getElementById("farmerForm").reset();
  saveFarmers(); // If you’re using localStorage
  renderFarmersTable();
  populateFarmerDropdown();
}

function renderFarmersTable() {
  const tbody = document.querySelector("#farmersTable tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  const searchVal = document
    .getElementById("farmerSearch")
    .value.trim()
    .toLowerCase();

  // Filter by name, region, or ID
  const filtered = farmers.filter((f) => {
    return (
      f.name.toLowerCase().includes(searchVal) ||
      f.region.toLowerCase().includes(searchVal) ||
      f.farmerId.toLowerCase().includes(searchVal)
    );
  });

  filtered.forEach((farmer) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${farmer.farmerId}</td>
      <td>${farmer.name}</td>
      <td>${farmer.phone}</td>
      <td>${farmer.email}</td>
      <td>${farmer.address}</td>
      <td>${farmer.region}</td>
      <td>${farmer.gps}</td>
      <td>
        <button onclick="editFarmer('${farmer.farmerId}')">Edit</button>
        <button onclick="deleteFarmer('${farmer.farmerId}')">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function editFarmer(farmerId) {
  const f = farmers.find((f) => f.farmerId === farmerId);
  if (!f) return;

  document.getElementById("farmerId").value = f.farmerId;
  document.getElementById("farmerName").value = f.name;
  document.getElementById("farmerPhone").value = f.phone;
  document.getElementById("farmerEmail").value = f.email;
  document.getElementById("farmerAddress").value = f.address;
  document.getElementById("farmerRegion").value = f.region;
  document.getElementById("farmerGPS").value = f.gps;
}

function deleteFarmer(farmerId) {
  farmers = farmers.filter((f) => f.farmerId !== farmerId);
  saveFarmers();
  renderFarmersTable();
  populateFarmerDropdown();
}

function exportFarmersAsCsv() {
  const headers = [
    "farmerId",
    "name",
    "phone",
    "email",
    "address",
    "region",
    "gps",
  ];
  const csvString = generateCSVStringFromArrayOfObjects(farmers, headers);
  downloadCSV("farmers.csv", csvString);
}

/****************************************
 *  PURCHASE RECORDS
 ****************************************/
function initPurchasesSection() {
  const purchaseForm = document.getElementById("purchaseForm");
  purchaseForm.addEventListener("submit", (e) => {
    e.preventDefault();
    addPurchaseRecord();
  });

  document
    .getElementById("exportPurchasesCsv")
    .addEventListener("click", exportPurchasesAsCsv);
}

function populateFarmerDropdown() {
  const purchaseFarmerId = document.getElementById("purchaseFarmerId");
  if (!purchaseFarmerId) return;
  purchaseFarmerId.innerHTML = "";

  const opt = document.createElement("option");
  opt.value = "";
  opt.textContent = "Select Farmer...";
  purchaseFarmerId.appendChild(opt);

  farmers.forEach((f) => {
    const option = document.createElement("option");
    option.value = f.farmerId;
    option.textContent = f.farmerId + " - " + f.name;
    purchaseFarmerId.appendChild(option);
  });
}

function addPurchaseRecord() {
  const purchaseId = document.getElementById("purchaseId").value.trim();
  const farmerId = document.getElementById("purchaseFarmerId").value.trim();
  const date = document.getElementById("purchaseDate").value;
  const quantity = parseFloat(
    document.getElementById("purchaseQuantity").value
  );
  const pricePerKg = parseFloat(document.getElementById("purchasePrice").value);

  if (!purchaseId || !farmerId || !date || !quantity || !pricePerKg) return;

  const totalCost = quantity * pricePerKg;

  const existing = purchases.find((p) => p.purchaseId === purchaseId);
  if (existing) {
    existing.farmerId = farmerId;
    existing.date = date;
    existing.quantity = quantity;
    existing.pricePerKg = pricePerKg;
    existing.totalCost = totalCost;
  } else {
    purchases.push({
      purchaseId,
      farmerId,
      date,
      quantity,
      pricePerKg,
      totalCost,
    });
  }

  document.getElementById("purchaseForm").reset();
  savePurchases();
  renderPurchasesTable();
}

function renderPurchasesTable() {
  const tbody = document.querySelector("#purchasesTable tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  purchases.forEach((p) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.purchaseId}</td>
      <td>${p.farmerId}</td>
      <td>${p.date}</td>
      <td>${p.quantity}</td>
      <td>${p.pricePerKg.toFixed(2)}</td>
      <td>${p.totalCost.toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function exportPurchasesAsCsv() {
  const headers = [
    "purchaseId",
    "farmerId",
    "date",
    "quantity",
    "pricePerKg",
    "totalCost",
  ];
  const csvString = generateCSVStringFromArrayOfObjects(purchases, headers);
  downloadCSV("purchases.csv", csvString);
}

/****************************************
 *  EXPENSE CALCULATION
 ****************************************/
function initExpenseCalculation() {
  document
    .getElementById("calculateExpenseBtn")
    .addEventListener("click", calculateExpensesForPeriod);
}

function calculateExpensesForPeriod() {
  const start = document.getElementById("expenseStartDate").value;
  const end = document.getElementById("expenseEndDate").value;

  let totalExpense = 0;
  purchases.forEach((p) => {
    if ((start && p.date < start) || (end && p.date > end)) {
      // skip
    } else {
      totalExpense += p.totalCost;
    }
  });

  document.getElementById("totalExpenseDisplay").textContent =
    totalExpense.toFixed(2);
}

/****************************************
 *  PRODUCT CATEGORIZATION / PRICING
 ****************************************/
function initPricingSection() {
  const pricingForm = document.getElementById("pricingForm");
  pricingForm.addEventListener("submit", (e) => {
    e.preventDefault();
    updateCategoryPrice();
  });

  const categorySelect = document.getElementById("categorySelect");
  categorySelect.innerHTML = "";
  categoryPricing.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat.category;
    option.textContent = cat.category;
    categorySelect.appendChild(option);
  });
}

function updateCategoryPrice() {
  const category = document.getElementById("categorySelect").value;
  const newWeight = document.getElementById("categoryWeight").value.trim();
  const newPrice = parseFloat(document.getElementById("categoryPrice").value);
  if (!category || !newWeight || isNaN(newPrice)) {
    alert(
      "Please select a category, provide a weight, and enter a valid price."
    );
    return;
  }

  const catObj = categoryPricing.find((c) => c.category === category);
  if (!catObj) {
    alert("Category not found. Cannot update.");
    return;
  }

  catObj.weightInfo = newWeight; // e.g., "0.1 kg" or "Varies"
  catObj.price = newPrice;

  saveCategoryPricing(); // If you're using localStorage
  renderPricingTable();

  document.getElementById("pricingForm").reset();
  alert(`Category "${category}" updated!`);
}

function renderPricingTable() {
  const tbody = document.querySelector("#pricingTable tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  categoryPricing.forEach((cat) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${cat.category}</td>
      <td>${cat.weightInfo}</td>
      <td>${cat.price}</td>
    `;
    tbody.appendChild(tr);
  });
}

/****************************************
 *   PACKAGING
 ****************************************/
function initPackagingSection() {
  const packageForm = document.getElementById("packageForm");
  packageForm.addEventListener("submit", (e) => {
    e.preventDefault();
    packageBlueberries();
  });

  const packageCategorySelect = document.getElementById(
    "packageCategorySelect"
  );
  packageCategorySelect.innerHTML = "";
  categoryPricing.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat.category;
    option.textContent = cat.category;
    packageCategorySelect.appendChild(option);
  });

  // If packagedInventory was empty in storage, it’s already initialized above,
  // but let's ensure it aligns with categoryPricing:
  alignPackagedInventory();
}

function alignPackagedInventory() {
  // Make sure each category in categoryPricing has a corresponding entry in packagedInventory
  categoryPricing.forEach((cat) => {
    const found = packagedInventory.find((pi) => pi.category === cat.category);
    if (!found) {
      packagedInventory.push({ category: cat.category, units: 0, totalKg: 0 });
    }
  });
  // Remove any leftover categories from packagedInventory that no longer exist in categoryPricing
  packagedInventory = packagedInventory.filter((pi) =>
    categoryPricing.some((cat) => cat.category === pi.category)
  );
  savePackagedInventory();
}

function packageBlueberries() {
  const catSelect = document.getElementById("packageCategorySelect").value;
  const quantityKg = parseFloat(
    document.getElementById("packageQuantity").value
  );

  const catObj = categoryPricing.find((c) => c.category === catSelect);
  const invObj = packagedInventory.find((i) => i.category === catSelect);

  if (catObj && invObj) {
    // parse catObj.weightInfo if it's numeric
    let weight = parseFloat(catObj.weightInfo);

    if (isNaN(weight)) {
      // If user typed something like "Varies" or something non-numeric,
      // we must decide how many units we can form.
      // For example, we might treat the entire input as 1 "unit."
      // Or you could prompt the user for a numeric value.
      weight = quantityKg; // Or do something else sensible
    }

    // number of whole "units" from the input quantity
    const unitsToAdd = Math.floor(quantityKg / weight);
    invObj.units += unitsToAdd;
    invObj.totalKg += unitsToAdd * weight;
  }

  // save and re-render
  savePackagedInventory();
  renderPackagedInventory();
}

function renderPackagedInventory() {
  const tbody = document.querySelector("#packagedInventoryTable tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  packagedInventory.forEach((item) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.category}</td>
      <td>${item.units}</td>
      <td>${item.totalKg.toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });
}

/****************************************
 *   SALES MANAGEMENT (Orders)
 ****************************************/
function initOrderSection() {
  const orderForm = document.getElementById("orderForm");
  orderForm.addEventListener("submit", (e) => {
    e.preventDefault();
    addOrUpdateOrder();
  });

  document
    .getElementById("orderStatusFilter")
    .addEventListener("change", renderOrdersTable);

  document
    .getElementById("exportOrdersCsv")
    .addEventListener("click", exportOrdersAsCsv);

  const orderCategory = document.getElementById("orderCategory");
  orderCategory.innerHTML = "";
  categoryPricing.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat.category;
    option.textContent = cat.category;
    orderCategory.appendChild(option);
  });
}

function addOrUpdateOrder() {
  const orderId = document.getElementById("orderId").value.trim();
  const customerName = document.getElementById("customerName").value.trim();
  const customerContact = document
    .getElementById("customerContact")
    .value.trim();
  const category = document.getElementById("orderCategory").value;
  const quantity = parseInt(document.getElementById("orderQuantity").value);

  if (!orderId || !customerName || !customerContact || !category || !quantity) {
    return;
  }

  const catObj = categoryPricing.find((c) => c.category === category);
  let totalPrice = 0;
  if (catObj) {
    totalPrice = catObj.price * quantity;
  }

  const existing = orders.find((o) => o.orderId === orderId);
  if (existing) {
    existing.customerName = customerName;
    existing.customerContact = customerContact;
    existing.category = category;
    existing.quantity = quantity;
    existing.totalPrice = totalPrice;
    // status remains unchanged
  } else {
    orders.push({
      orderId,
      customerName,
      customerContact,
      category,
      quantity,
      totalPrice,
      status: "Pending",
    });
  }

  document.getElementById("orderForm").reset();
  saveOrders();
  renderOrdersTable();
  recalcTotalRevenue();
  updateInventoryAfterSale(category, quantity);
}

function updateInventoryAfterSale(category, quantity) {
  const invObj = packagedInventory.find((i) => i.category === category);
  if (invObj) {
    invObj.units = Math.max(0, invObj.units - quantity);
    const catObj = categoryPricing.find((c) => c.category === category);
    if (catObj) {
      let weight = parseFloat(catObj.weightInfo);
      if (!isNaN(weight)) {
        invObj.totalKg = Math.max(0, invObj.totalKg - quantity * weight);
      }
    }
    savePackagedInventory();
    renderPackagedInventory();
  }
}

function renderOrdersTable() {
  const tbody = document.querySelector("#ordersTable tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const statusFilter = document.getElementById("orderStatusFilter").value;

  orders.forEach((o) => {
    if (statusFilter && o.status !== statusFilter) {
      return;
    }
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${o.orderId}</td>
      <td>${o.customerName}</td>
      <td>${o.customerContact}</td>
      <td>${o.category}</td>
      <td>${o.quantity}</td>
      <td>${o.totalPrice.toFixed(2)}</td>
      <td>
        <select onchange="updateOrderStatus('${o.orderId}', this.value)">
          <option value="Pending" ${
            o.status === "Pending" ? "selected" : ""
          }>Pending</option>
          <option value="Processed" ${
            o.status === "Processed" ? "selected" : ""
          }>Processed</option>
          <option value="Shipped" ${
            o.status === "Shipped" ? "selected" : ""
          }>Shipped</option>
          <option value="Delivered" ${
            o.status === "Delivered" ? "selected" : ""
          }>Delivered</option>
        </select>
      </td>
      <td>
        <button onclick="editOrder('${o.orderId}')">Edit</button>
        <button onclick="deleteOrder('${o.orderId}')">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function editOrder(orderId) {
  const o = orders.find((o) => o.orderId === orderId);
  if (!o) return;
  document.getElementById("orderId").value = o.orderId;
  document.getElementById("customerName").value = o.customerName;
  document.getElementById("customerContact").value = o.customerContact;
  document.getElementById("orderCategory").value = o.category;
  document.getElementById("orderQuantity").value = o.quantity;
}

function deleteOrder(orderId) {
  orders = orders.filter((o) => o.orderId !== orderId);
  saveOrders();
  renderOrdersTable();
  recalcTotalRevenue();
}

function updateOrderStatus(orderId, newStatus) {
  const o = orders.find((o) => o.orderId === orderId);
  if (o) {
    o.status = newStatus;
    saveOrders();
    renderOrdersTable();
  }
}

function exportOrdersAsCsv() {
  const headers = [
    "orderId",
    "customerName",
    "customerContact",
    "category",
    "quantity",
    "totalPrice",
    "status",
  ];
  const csvString = generateCSVStringFromArrayOfObjects(orders, headers);
  downloadCSV("orders.csv", csvString);
}

/****************************************
 *   REVENUE CALCULATION
 ****************************************/
function initRevenueSection() {
  document
    .getElementById("recalcRevenueBtn")
    .addEventListener("click", recalcTotalRevenue);
}

function recalcTotalRevenue() {
  let totalRev = 0;
  const revByCategory = {};

  orders.forEach((o) => {
    totalRev += o.totalPrice;
    if (!revByCategory[o.category]) {
      revByCategory[o.category] = 0;
    }
    revByCategory[o.category] += o.totalPrice;
  });

  document.getElementById("totalRevenueDisplay").textContent =
    totalRev.toFixed(2);

  const tbody = document.querySelector("#revenueByCategoryTable tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  Object.keys(revByCategory).forEach((cat) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${cat}</td>
      <td>${revByCategory[cat].toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });
}

/****************************************
 *  FINANCIAL ANALYSIS
 ****************************************/
function initFinancialAnalysis() {
  document
    .getElementById("analyzeFinBtn")
    .addEventListener("click", analyzeFinancials);
}

function analyzeFinancials() {
  const start = document.getElementById("finStart").value;
  const end = document.getElementById("finEnd").value;
  const taxRate = parseFloat(document.getElementById("taxRate").value) || 0;

  // Income from all orders
  let income = 0;
  // If you wanted date-based, you'd store order dates. For now, sum all.
  orders.forEach((o) => {
    income += o.totalPrice;
  });

  // Expenses from purchases (filtered by date)
  let expense = 0;
  purchases.forEach((p) => {
    if ((start && p.date < start) || (end && p.date > end)) {
      return;
    }
    expense += p.totalCost;
  });

  const taxAmount = income * (taxRate / 100);
  const netProfit = income - expense - taxAmount;

  document.getElementById("finIncomeDisplay").textContent = income.toFixed(2);
  document.getElementById("finExpenseDisplay").textContent = expense.toFixed(2);
  document.getElementById("finTaxDisplay").textContent = taxAmount.toFixed(2);
  document.getElementById("finProfitDisplay").textContent =
    netProfit.toFixed(2);
}

/****************************************
 *  INVENTORY MANAGEMENT
 ****************************************/
function initInventoryManagement() {
  const inventoryForm = document.getElementById("inventoryForm");
  inventoryForm.addEventListener("submit", (e) => {
    e.preventDefault();
    addOrUpdateInventoryItem();
  });

  document
    .getElementById("exportInventoryCsv")
    .addEventListener("click", exportInventoryCsv);
}

function addOrUpdateInventoryItem() {
  const itemId = document.getElementById("invItemId").value.trim();
  const category = document.getElementById("invCategory").value.trim();
  const quantity = parseFloat(document.getElementById("invQuantity").value);
  const reorderLevel = parseFloat(
    document.getElementById("invReorderLevel").value
  );
  const restockDate = document.getElementById("invRestockDate").value;
  const storageLocation = document
    .getElementById("invStorageLocation")
    .value.trim();

  if (!itemId || !category || isNaN(quantity) || isNaN(reorderLevel)) return;

  const existing = inventoryItems.find((i) => i.itemId === itemId);
  if (existing) {
    existing.category = category;
    existing.quantity = quantity;
    existing.reorderLevel = reorderLevel;
    existing.restockDate = restockDate;
    existing.storageLocation = storageLocation;
  } else {
    inventoryItems.push({
      itemId,
      category,
      quantity,
      reorderLevel,
      restockDate,
      storageLocation,
    });
  }

  document.getElementById("inventoryForm").reset();
  saveInventoryItems();
  renderInventoryTable();
}

function renderInventoryTable() {
  const tbody = document.querySelector("#inventoryTable tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  inventoryItems.forEach((item) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.itemId}</td>
      <td>${item.category}</td>
      <td>${item.quantity.toFixed(2)}</td>
      <td>${item.reorderLevel.toFixed(2)}</td>
      <td>${item.restockDate || ""}</td>
      <td>${item.storageLocation}</td>
      <td>
        <button onclick="editInventoryItem('${item.itemId}')">Edit</button>
        <button onclick="deleteInventoryItem('${item.itemId}')">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  renderLowStockAlerts();
}

function editInventoryItem(itemId) {
  const item = inventoryItems.find((i) => i.itemId === itemId);
  if (!item) return;
  document.getElementById("invItemId").value = item.itemId;
  document.getElementById("invCategory").value = item.category;
  document.getElementById("invQuantity").value = item.quantity;
  document.getElementById("invReorderLevel").value = item.reorderLevel;
  document.getElementById("invRestockDate").value = item.restockDate;
  document.getElementById("invStorageLocation").value = item.storageLocation;
}

function deleteInventoryItem(itemId) {
  inventoryItems = inventoryItems.filter((i) => i.itemId !== itemId);
  saveInventoryItems();
  renderInventoryTable();
}

function exportInventoryCsv() {
  const headers = [
    "itemId",
    "category",
    "quantity",
    "reorderLevel",
    "restockDate",
    "storageLocation",
  ];
  const csvString = generateCSVStringFromArrayOfObjects(
    inventoryItems,
    headers
  );
  downloadCSV("inventory.csv", csvString);
}

function renderLowStockAlerts() {
  const alertUl = document.getElementById("lowStockAlerts");
  if (!alertUl) return;
  alertUl.innerHTML = "";

  inventoryItems.forEach((i) => {
    if (i.quantity < i.reorderLevel) {
      const li = document.createElement("li");
      li.textContent = `Item ${i.itemId} (Category: ${i.category}) is below reorder level!`;
      alertUl.appendChild(li);
    }
  });
}

/****************************************
 *  COMPREHENSIVE REPORT
 ****************************************/
let lastGeneratedReport = [];

function initComprehensiveReport() {
  const btn = document.getElementById("generateReportBtn");
  btn.addEventListener("click", generateComprehensiveReport);

  document
    .getElementById("exportComprehensiveCsv")
    .addEventListener("click", exportComprehensiveReportCsv);
}

function generateComprehensiveReport() {
  const start = document.getElementById("reportStartDate").value;
  const end = document.getElementById("reportEndDate").value;

  // 1. Total Income
  let totalIncome = 0;
  orders.forEach((o) => {
    // no order date to filter, so sum all
    totalIncome += o.totalPrice;
  });

  // 2. Total expenses (filtered by date)
  let totalExpenses = 0;
  purchases.forEach((p) => {
    if ((start && p.date < start) || (end && p.date > end)) {
      return;
    }
    totalExpenses += p.totalCost;
  });

  // 3. Tax
  // For demonstration, use a fixed 10%
  const taxRate = 0.1;
  const taxApplied = totalIncome * taxRate;

  // 4. Net profit
  const netProfit = totalIncome - totalExpenses - taxApplied;

  // 5. Number of products sold per category
  let soldPerCategory = {};
  orders.forEach((o) => {
    if (!soldPerCategory[o.category]) {
      soldPerCategory[o.category] = 0;
    }
    soldPerCategory[o.category] += o.quantity;
  });

  // 6. Remaining stock per category (Packaged)
  const remainingStock = packagedInventory.map((pi) => ({
    category: pi.category,
    units: pi.units,
    totalKg: pi.totalKg,
  }));

  // Build HTML
  const outputDiv = document.getElementById("reportOutput");
  let html = `
    <h3>Comprehensive Report (Start: ${start || "N/A"} - End: ${
    end || "N/A"
  })</h3>
    <p><strong>Total Income (Sales):</strong> $${totalIncome.toFixed(2)}</p>
    <p><strong>Total Expenses (Purchases):</strong> $${totalExpenses.toFixed(
      2
    )}</p>
    <p><strong>Tax Applied (10% approx):</strong> $${taxApplied.toFixed(2)}</p>
    <p><strong>Net Profit:</strong> $${netProfit.toFixed(2)}</p>
    <h4>Products Sold per Category:</h4>
    <ul>
  `;
  Object.keys(soldPerCategory).forEach((cat) => {
    html += `<li>${cat}: ${soldPerCategory[cat]} units sold</li>`;
  });
  html += `</ul>`;

  html += `<h4>Remaining Stock per Category (Packaged):</h4><ul>`;
  remainingStock.forEach((rs) => {
    html += `<li>${rs.category}: ${rs.units} units (${rs.totalKg.toFixed(
      2
    )} kg)</li>`;
  });
  html += `</ul>`;

  outputDiv.innerHTML = html;

  // Prepare data for CSV export
  lastGeneratedReport = [
    { parameter: "Start Date", value: start },
    { parameter: "End Date", value: end },
    { parameter: "Total Income", value: totalIncome.toFixed(2) },
    { parameter: "Total Expenses", value: totalExpenses.toFixed(2) },
    { parameter: "Tax Applied", value: taxApplied.toFixed(2) },
    { parameter: "Net Profit", value: netProfit.toFixed(2) },
    {
      parameter: "Products Sold (per category)",
      value: JSON.stringify(soldPerCategory),
    },
    {
      parameter: "Remaining Stock (per category)",
      value: JSON.stringify(remainingStock),
    },
  ];
}

function exportComprehensiveReportCsv() {
  if (lastGeneratedReport.length === 0) {
    alert("No report generated yet!");
    return;
  }
  const headers = ["parameter", "value"];
  const csvString = generateCSVStringFromArrayOfObjects(
    lastGeneratedReport,
    headers
  );
  downloadCSV("comprehensive_report.csv", csvString);
}
