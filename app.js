/****************************************
 *     GLOBAL DATA STRUCTURES
 ****************************************/

// Data Arrays
let farmers = [];
let purchases = [];
let orders = [];
let inventoryItems = [];
let categoryPricing = []; // Pricing for product categories
let packagedInventory = []; // Packaged inventory details

// Report Data
let lastGeneratedReport = []; // Stores the last generated report for CSV export

/****************************************
 *   LOAD/SAVE from LOCAL STORAGE
 ****************************************/
function loadDataFromLocalStorage() {
  farmers = JSON.parse(localStorage.getItem("farmers")) || [];
  purchases = JSON.parse(localStorage.getItem("purchases")) || [];
  orders = JSON.parse(localStorage.getItem("orders")) || [];
  inventoryItems = JSON.parse(localStorage.getItem("inventoryItems")) || [];
  categoryPricing = JSON.parse(localStorage.getItem("categoryPricing")) || [
    { category: "Small (100g)", weightInfo: "0.1 kg", price: 5 },
    { category: "Medium (250g)", weightInfo: "0.25 kg", price: 10 },
    { category: "Large (500g)", weightInfo: "0.5 kg", price: 18 },
    { category: "Extra Large (1kg)", weightInfo: "1.0 kg", price: 30 },
    { category: "Family Pack (2kg)", weightInfo: "2.0 kg", price: 55 },
    { category: "Bulk Pack (5kg)", weightInfo: "5.0 kg", price: 120 },
    { category: "Premium (custom)", weightInfo: "Varies", price: 0 },
  ];

  packagedInventory =
    JSON.parse(localStorage.getItem("packagedInventory")) ||
    categoryPricing.map((cat) => ({
      category: cat.category,
      units: 0,
      totalKg: 0,
    }));
}

function saveToLocalStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function saveFarmers() {
  saveToLocalStorage("farmers", farmers);
}

function savePurchases() {
  saveToLocalStorage("purchases", purchases);
}

function saveOrders() {
  saveToLocalStorage("orders", orders);
}

function saveInventoryItems() {
  saveToLocalStorage("inventoryItems", inventoryItems);
}

function saveCategoryPricing() {
  saveToLocalStorage("categoryPricing", categoryPricing);
}

function savePackagedInventory() {
  saveToLocalStorage("packagedInventory", packagedInventory);
}

/****************************************
 *  HELPER FUNCTIONS
 ****************************************/
function generateCSVStringFromArrayOfObjects(dataArray, headers) {
  let csvContent = headers.join(",") + "\n";
  dataArray.forEach((obj) => {
    let row = headers
      .map((h) => {
        let cell = obj[h];
        if (typeof cell === "string" && cell.includes(",")) {
          cell = `"${cell}"`; // Handle commas in data
        }
        return cell !== undefined ? cell : "";
      })
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

function generateUniqueId(prefix) {
  return prefix + Math.random().toString(36).substr(2, 9).toUpperCase();
}

/****************************************
 *  SUPPLIER MANAGEMENT
 ****************************************/
function initFarmersSection() {
  const farmerForm = document.getElementById("farmerForm");
  if (farmerForm) {
    farmerForm.addEventListener("submit", (e) => {
      e.preventDefault();
      addOrUpdateFarmer();
    });
  }

  const farmerSearch = document.getElementById("farmerSearch");
  if (farmerSearch) {
    farmerSearch.addEventListener("input", renderFarmersTable);
  }

  const exportBtn = document.getElementById("exportFarmersCsv");
  if (exportBtn) {
    exportBtn.addEventListener("click", exportFarmersAsCsv);
  }
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

  // Simple validation patterns
  const phonePattern = /^[0-9+\-]{7,15}$/;
  if (!phonePattern.test(phone)) {
    alert("Invalid phone format.");
    return;
  }

  const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  if (!emailPattern.test(email)) {
    alert("Invalid email address.");
    return;
  }

  const existing = farmers.find((f) => f.farmerId === farmerId);

  if (existing) {
    if (
      confirm(
        `Farmer ID '${farmerId}' exists. Do you want to update this farmer's information?`
      )
    ) {
      Object.assign(existing, { name, phone, email, address, region, gps });
      alert(`Farmer '${farmerId}' updated successfully.`);
    } else {
      return;
    }
  } else {
    farmers.push({ farmerId, name, phone, email, address, region, gps });
    alert(`New Farmer '${farmerId}' added successfully.`);
  }

  document.getElementById("farmerForm").reset();
  saveFarmers();
  renderFarmersTable();
}

function renderFarmersTable() {
  const tbody = document.querySelector("#farmersTable tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  const searchVal = document
    .getElementById("farmerSearch")
    .value.trim()
    .toLowerCase();

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

  populateFarmerDropdown();
}

function editFarmer(farmerId) {
  const farmer = farmers.find((f) => f.farmerId === farmerId);
  if (!farmer) return;

  document.getElementById("farmerId").value = farmer.farmerId;
  document.getElementById("farmerName").value = farmer.name;
  document.getElementById("farmerPhone").value = farmer.phone;
  document.getElementById("farmerEmail").value = farmer.email;
  document.getElementById("farmerAddress").value = farmer.address;
  document.getElementById("farmerRegion").value = farmer.region;
  document.getElementById("farmerGPS").value = farmer.gps;
}

function deleteFarmer(farmerId) {
  if (!confirm(`Delete Farmer ID '${farmerId}'?`)) return;
  farmers = farmers.filter((f) => f.farmerId !== farmerId);
  saveFarmers();
  renderFarmersTable();
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
  if (purchaseForm) {
    purchaseForm.addEventListener("submit", (e) => {
      e.preventDefault();
      addPurchaseRecord();
    });
  }

  const exportBtn = document.getElementById("exportPurchasesCsv");
  if (exportBtn) {
    exportBtn.addEventListener("click", exportPurchasesAsCsv);
  }
}

function populateFarmerDropdown() {
  const purchaseFarmerId = document.getElementById("purchaseFarmerId");
  if (!purchaseFarmerId) return;
  purchaseFarmerId.innerHTML = "";

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select Farmer...";
  purchaseFarmerId.appendChild(defaultOption);

  farmers.forEach((f) => {
    const option = document.createElement("option");
    option.value = f.farmerId;
    option.textContent = `${f.farmerId} - ${f.name}`;
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

  let isValid = true;
  let errorMsg = "";

  const errorDiv = document.getElementById("purchaseFormErrors");
  errorDiv.textContent = "";

  // Validate Purchase ID
  if (!purchaseId) {
    isValid = false;
    errorMsg += "Purchase ID is required.\n";
  } else if (!/^[a-zA-Z0-9]+$/.test(purchaseId)) {
    isValid = false;
    errorMsg += "Purchase ID must be alphanumeric.\n";
  } else if (purchases.find((p) => p.purchaseId === purchaseId)) {
    isValid = false;
    errorMsg += "Purchase ID must be unique.\n";
  }

  // Validate Farmer ID
  if (!farmerId) {
    isValid = false;
    errorMsg += "Farmer ID is required.\n";
  } else if (!farmers.find((f) => f.farmerId === farmerId)) {
    isValid = false;
    errorMsg += "Farmer ID does not exist.\n";
  }

  // Validate Date
  if (!date) {
    isValid = false;
    errorMsg += "Date is required.\n";
  } else {
    const purchaseDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Compare only dates
    if (purchaseDate > today) {
      isValid = false;
      errorMsg += "Date cannot be in the future.\n";
    }
  }

  // Validate Quantity
  if (isNaN(quantity)) {
    isValid = false;
    errorMsg += "Quantity must be a number.\n";
  } else if (quantity <= 0) {
    isValid = false;
    errorMsg += "Quantity must be greater than zero.\n";
  }

  // Validate Price per Kg
  if (isNaN(pricePerKg)) {
    isValid = false;
    errorMsg += "Price per Kg must be a number.\n";
  } else if (pricePerKg <= 0) {
    isValid = false;
    errorMsg += "Price per Kg must be greater than zero.\n";
  }

  // If invalid, alert and stop
  if (!isValid) {
    errorDiv.textContent = "Please correct the following errors:\n" + errorMsg;
    return;
  }

  if (
    !purchaseId ||
    !farmerId ||
    !date ||
    isNaN(quantity) ||
    isNaN(pricePerKg)
  ) {
    alert("All fields are required and must be valid.");
    return;
  }

  const totalCost = quantity * pricePerKg;

  const existing = purchases.find((p) => p.purchaseId === purchaseId);
  if (existing) {
    if (!confirm(`Purchase ID '${purchaseId}' exists. Update record?`)) return;
    Object.assign(existing, {
      farmerId,
      date,
      quantity,
      pricePerKg,
      totalCost,
    });
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

  // Update Raw Inventory
  updateRawInventoryAfterPurchase(farmerId, quantity);

  document.getElementById("purchaseForm").reset();
  savePurchases();
  renderPurchasesTable();
}

function updateRawInventoryAfterPurchase(farmerId, quantity) {
  const farmer = farmers.find((f) => f.farmerId === farmerId);
  if (!farmer) {
    alert(`Farmer ID '${farmerId}' not found.`);
    return;
  }

  const rawCategory = farmer.region; // Assuming region corresponds to raw category

  let inventoryItem = inventoryItems.find(
    (i) => i.category.toLowerCase() === rawCategory.toLowerCase()
  );

  if (inventoryItem) {
    inventoryItem.quantity += quantity;
  } else {
    inventoryItems.push({
      itemId: generateUniqueId("RAW"),
      category: rawCategory,
      quantity: quantity,
      reorderLevel: 10, // Default value; adjust as needed
      restockDate: "",
      storageLocation: "Default Warehouse",
    });
  }

  saveInventoryItems();
  renderInventoryTable();
  renderLowStockAlerts();
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
      <td>${p.quantity.toFixed(2)}</td>
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
  const calculateBtn = document.getElementById("calculateExpenseBtn");
  if (calculateBtn) {
    calculateBtn.addEventListener("click", calculateExpensesForPeriod);
  }
}

function calculateExpensesForPeriod() {
  const start = document.getElementById("expenseStartDate").value;
  const end = document.getElementById("expenseEndDate").value;

  let totalExpense = 0;
  purchases.forEach((p) => {
    if (
      (start && new Date(p.date) < new Date(start)) ||
      (end && new Date(p.date) > new Date(end))
    ) {
      return; // Skip outside the date range
    }
    totalExpense += p.totalCost;
  });

  document.getElementById("totalExpenseDisplay").textContent =
    totalExpense.toFixed(2);
}

/****************************************
 *  PRODUCT CATEGORIZATION / PRICING
 ****************************************/
function initPricingSection() {
  const pricingForm = document.getElementById("pricingForm");
  if (pricingForm) {
    pricingForm.addEventListener("submit", (e) => {
      e.preventDefault();
      updateCategoryPrice();
    });
  }

  const categorySelect = document.getElementById("categorySelect");
  if (categorySelect) {
    categorySelect.innerHTML =
      "<option value=''>-- Select Category --</option>";
    categoryPricing.forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat.category;
      option.textContent = cat.category;
      categorySelect.appendChild(option);
    });
  }

  renderPricingTable();
}

function updateCategoryPrice() {
  const category = document.getElementById("categorySelect").value;
  const newWeight = document.getElementById("categoryWeight").value.trim();
  const newPrice = parseFloat(document.getElementById("categoryPrice").value);

  // Validation Flags
  let isValid = true;
  let errorMsg = "";

  // Validate Category
  if (!category) {
    isValid = false;
    errorMsg += "Product Category is required.\n";
  } else if (!categoryPricing.find((c) => c.category === category)) {
    isValid = false;
    errorMsg += "Selected Product Category does not exist.\n";
  }

  // Validate Weight Info
  if (!newWeight) {
    isValid = false;
    errorMsg += "Weight Info is required.\n";
  } else if (!/^\d+(\.\d+)?\s?kg$/.test(newWeight)) {
    isValid = false;
    errorMsg += "Weight Info must be a valid format (e.g., '0.5 kg').\n";
  }

  // Validate Price
  if (isNaN(newPrice)) {
    isValid = false;
    errorMsg += "Price must be a number.\n";
  } else if (newPrice <= 0) {
    isValid = false;
    errorMsg += "Price must be greater than zero.\n";
  }

  // If invalid, display errors
  const errorDiv = document.getElementById("pricingFormErrors");
  if (errorDiv) errorDiv.textContent = "";

  if (!isValid) {
    if (errorDiv) {
      errorDiv.textContent =
        "Please correct the following errors:\n" + errorMsg;
    } else {
      alert("Please correct the following errors:\n" + errorMsg);
    }
    return;
  }

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

  catObj.weightInfo = newWeight;
  catObj.price = newPrice;

  // Align packagedInventory
  const packInv = packagedInventory.find((pi) => pi.category === category);
  if (!packInv) {
    packagedInventory.push({ category: category, units: 0, totalKg: 0 });
  }

  saveCategoryPricing();
  savePackagedInventory();
  renderPricingTable();
  renderPackagedInventory();
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
      <td>${cat.price.toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });
}

/****************************************
 *   PACKAGING
 ****************************************/
function initPackagingSection() {
  const packageForm = document.getElementById("packageForm");
  if (packageForm) {
    packageForm.addEventListener("submit", (e) => {
      e.preventDefault();
      packageBlueberries();
    });
  }

  const packageCategorySelect = document.getElementById(
    "packageCategorySelect"
  );
  if (packageCategorySelect) {
    packageCategorySelect.innerHTML =
      "<option value=''>-- Select Packaged Category --</option>";
    categoryPricing.forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat.category;
      option.textContent = cat.category;
      packageCategorySelect.appendChild(option);
    });
  }

  alignPackagedInventory();
  renderPackagedInventory();
}

function alignPackagedInventory() {
  categoryPricing.forEach((cat) => {
    const found = packagedInventory.find((pi) => pi.category === cat.category);
    if (!found) {
      packagedInventory.push({ category: cat.category, units: 0, totalKg: 0 });
    }
  });

  // Remove categories no longer present
  packagedInventory = packagedInventory.filter((pi) =>
    categoryPricing.some((cat) => cat.category === pi.category)
  );

  savePackagedInventory();
}

function packageBlueberries() {
  const rawCatSelect = document.getElementById("packagingRawCategory").value;
  const packagedCatSelect = document.getElementById(
    "packageCategorySelect"
  ).value;
  const quantityKg = parseFloat(
    document.getElementById("packageQuantity").value
  );

  // Validation Flags
  let isValid = true;
  let errorMsg = "";

  // Validate Raw Category
  if (!rawCatSelect) {
    isValid = false;
    errorMsg += "Raw Category is required.\n";
  } else if (!inventoryItems.find((i) => i.category === rawCatSelect)) {
    isValid = false;
    errorMsg += "Selected Raw Category does not exist in inventory.\n";
  }

  // Validate Packaged Category
  if (!packagedCatSelect) {
    isValid = false;
    errorMsg += "Packaged Category is required.\n";
  } else if (!categoryPricing.find((c) => c.category === packagedCatSelect)) {
    isValid = false;
    errorMsg += "Selected Packaged Category does not exist.\n";
  }

  // Validate Quantity
  if (isNaN(quantityKg)) {
    isValid = false;
    errorMsg += "Quantity must be a number.\n";
  } else if (quantityKg <= 0) {
    isValid = false;
    errorMsg += "Quantity must be greater than zero.\n";
  } else {
    // Check sufficient raw inventory
    const rawInventoryItem = inventoryItems.find(
      (i) => i.category === rawCatSelect
    );
    if (!rawInventoryItem || rawInventoryItem.quantity < quantityKg) {
      isValid = false;
      errorMsg += `Insufficient raw inventory for category "${rawCatSelect}". Available: ${
        rawInventoryItem ? rawInventoryItem.quantity : 0
      } kg.\n`;
    }
  }

  // If invalid, display errors
  const errorDiv = document.getElementById("packageFormErrors");
  if (errorDiv) errorDiv.textContent = "";

  if (!isValid) {
    if (errorDiv) {
      errorDiv.textContent =
        "Please correct the following errors:\n" + errorMsg;
    } else {
      alert("Please correct the following errors:\n" + errorMsg);
    }
    return;
  }

  if (
    !rawCatSelect ||
    !packagedCatSelect ||
    isNaN(quantityKg) ||
    quantityKg <= 0
  ) {
    alert("All fields are required, and quantity must be greater than zero.");
    return;
  }

  const rawInventoryItem = inventoryItems.find(
    (i) => i.category.toLowerCase() === rawCatSelect.toLowerCase()
  );
  if (!rawInventoryItem) {
    alert(`No raw inventory found for category "${rawCatSelect}".`);
    return;
  }

  if (rawInventoryItem.quantity < quantityKg) {
    alert(
      `Insufficient raw inventory for category "${rawCatSelect}". Available: ${rawInventoryItem.quantity} kg.`
    );
    return;
  }

  // Deduct from raw inventory
  rawInventoryItem.quantity -= quantityKg;

  const packagedCatObj = categoryPricing.find(
    (c) => c.category === packagedCatSelect
  );
  const packagedInvObj = packagedInventory.find(
    (i) => i.category === packagedCatSelect
  );

  if (!packagedCatObj || !packagedInvObj) {
    alert("Selected packaged category not found.");
    return;
  }

  // Determine unit weight
  let unitWeight = parseFloat(packagedCatObj.weightInfo);
  let unitsToAdd;

  if (isNaN(unitWeight)) {
    // Handle "Varies"
    unitsToAdd = 1; // Treat entire quantity as one unit
    unitWeight = quantityKg;
  } else {
    unitsToAdd = Math.floor(quantityKg / unitWeight);
  }

  if (unitsToAdd <= 0) {
    alert("Quantity too low to form at least one unit.");
    return;
  }

  // Add to packaged inventory
  packagedInvObj.units += unitsToAdd;
  packagedInvObj.totalKg += unitsToAdd * unitWeight;

  saveInventoryItems();
  savePackagedInventory();

  renderInventoryTable();
  renderPackagedInventory();
  renderLowStockAlerts();

  alert(
    `Packaged ${unitsToAdd} unit(s) of "${packagedCatSelect}" from "${rawCatSelect}".`
  );
  document.getElementById("packageForm").reset();
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
  if (orderForm) {
    orderForm.addEventListener("submit", (e) => {
      e.preventDefault();
      addOrUpdateOrder();
    });
  }

  const orderStatusFilter = document.getElementById("orderStatusFilter");
  if (orderStatusFilter) {
    orderStatusFilter.addEventListener("change", renderOrdersTable);
  }

  const exportBtn = document.getElementById("exportOrdersCsv");
  if (exportBtn) {
    exportBtn.addEventListener("click", exportOrdersAsCsv);
  }

  const orderCategory = document.getElementById("orderCategory");
  if (orderCategory) {
    orderCategory.innerHTML =
      "<option value=''>-- Select Product Category --</option>";
    categoryPricing.forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat.category;
      option.textContent = cat.category;
      orderCategory.appendChild(option);
    });
  }
}

function addOrUpdateOrder() {
  const orderId = document.getElementById("orderId").value.trim();
  const customerName = document.getElementById("customerName").value.trim();
  const customerContact = document
    .getElementById("customerContact")
    .value.trim();
  const category = document.getElementById("orderCategory").value;
  const quantity = parseInt(document.getElementById("orderQuantity").value);
  const orderDate = document.getElementById("orderDate").value;

  // Validation Flags
  let isValid = true;
  let errorMsg = "";

  // Validate Order ID
  if (!orderId) {
    isValid = false;
    errorMsg += "Order ID is required.\n";
  } else if (!/^[a-zA-Z0-9]+$/.test(orderId)) {
    isValid = false;
    errorMsg += "Order ID must be alphanumeric.\n";
  } else if (orders.find((o) => o.orderId === orderId)) {
    isValid = false;
    errorMsg += "Order ID must be unique.\n";
  }

  // Validate Customer Name
  if (!customerName) {
    isValid = false;
    errorMsg += "Customer Name is required.\n";
  } else if (!/^[a-zA-Z\s]+$/.test(customerName)) {
    isValid = false;
    errorMsg += "Customer Name must contain only letters and spaces.\n";
  }

  // Validate Customer Contact
  if (!customerContact) {
    isValid = false;
    errorMsg += "Customer Contact is required.\n";
  } else if (!/^[0-9+\-]{7,15}$/.test(customerContact)) {
    isValid = false;
    errorMsg += "Customer Contact must be a valid phone number.\n";
  }

  // Validate Product Category
  if (!category) {
    isValid = false;
    errorMsg += "Product Category is required.\n";
  } else if (!categoryPricing.find((c) => c.category === category)) {
    isValid = false;
    errorMsg += "Selected Product Category does not exist.\n";
  }

  // Validate Quantity
  if (isNaN(quantity)) {
    isValid = false;
    errorMsg += "Quantity must be a number.\n";
  } else if (quantity <= 0) {
    isValid = false;
    errorMsg += "Quantity must be greater than zero.\n";
  } else {
    // Check availability in packaged inventory
    const packInvObj = packagedInventory.find((i) => i.category === category);
    if (!packInvObj || packInvObj.units < quantity) {
      isValid = false;
      errorMsg += `Insufficient packaged inventory for category "${category}". Available units: ${
        packInvObj ? packInvObj.units : 0
      }.\n`;
    }
  }

  // Validate Date
  if (!orderDate) {
    isValid = false;
    errorMsg += "Order Date is required.\n";
  } else {
    const oDate = new Date(orderDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (oDate > today) {
      isValid = false;
      errorMsg += "Order Date cannot be in the future.\n";
    }
  }

  // If invalid, display errors
  const errorDiv = document.getElementById("orderFormErrors");
  if (errorDiv) errorDiv.textContent = "";

  if (!isValid) {
    if (errorDiv) {
      errorDiv.textContent =
        "Please correct the following errors:\n" + errorMsg;
    } else {
      alert("Please correct the following errors:\n" + errorMsg);
    }
    return;
  }

  if (
    !orderId ||
    !customerName ||
    !customerContact ||
    !category ||
    isNaN(quantity) ||
    !orderDate
  ) {
    alert("All order fields are required and must be valid.");
    return;
  }

  const catObj = categoryPricing.find((c) => c.category === category);
  let totalPrice = 0;
  if (catObj) {
    totalPrice = catObj.price * quantity;
  }

  const existing = orders.find((o) => o.orderId === orderId);
  if (existing) {
    Object.assign(existing, {
      customerName,
      customerContact,
      category,
      quantity,
      totalPrice,
      date: orderDate,
      // status remains unchanged
    });
  } else {
    orders.push({
      orderId,
      customerName,
      customerContact,
      category,
      quantity,
      totalPrice,
      status: "Pending",
      date: orderDate,
    });
  }

  // Deduct from packaged inventory
  updateInventoryAfterSale(category, quantity);

  document.getElementById("orderForm").reset();
  saveOrders();
  renderOrdersTable();
  recalcTotalRevenue();
}

function updateInventoryAfterSale(category, quantity) {
  const packInvObj = packagedInventory.find((i) => i.category === category);
  if (!packInvObj) {
    alert(`Packaged category "${category}" not found.`);
    return;
  }

  if (packInvObj.units < quantity) {
    alert(
      `Insufficient packaged inventory for category "${category}". Available units: ${packInvObj.units}`
    );
    return;
  }

  // Deduct from packaged inventory
  packInvObj.units -= quantity;

  // Update totalKg based on unit weight
  const catObj = categoryPricing.find((c) => c.category === category);
  let unitWeight = parseFloat(catObj.weightInfo);
  if (isNaN(unitWeight)) {
    // For "Varies", estimate or handle differently
    unitWeight =
      packInvObj.units > 0 ? packInvObj.totalKg / packInvObj.units : 0;
  }
  packInvObj.totalKg -= quantity * unitWeight;

  savePackagedInventory();
  renderPackagedInventory();
  renderLowStockAlertsPackaged();
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
  const order = orders.find((o) => o.orderId === orderId);
  if (!order) return;

  document.getElementById("orderId").value = order.orderId;
  document.getElementById("customerName").value = order.customerName;
  document.getElementById("customerContact").value = order.customerContact;
  document.getElementById("orderCategory").value = order.category;
  document.getElementById("orderQuantity").value = order.quantity;
  document.getElementById("orderDate").value = order.date;
}

function deleteOrder(orderId) {
  if (!confirm(`Delete Order ID '${orderId}'?`)) return;
  orders = orders.filter((o) => o.orderId !== orderId);
  saveOrders();
  renderOrdersTable();
  recalcTotalRevenue();
}

function updateOrderStatus(orderId, newStatus) {
  const order = orders.find((o) => o.orderId === orderId);
  if (order) {
    order.status = newStatus;
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
    "date",
  ];
  const csvString = generateCSVStringFromArrayOfObjects(orders, headers);
  downloadCSV("orders.csv", csvString);
}

/****************************************
 *   REVENUE CALCULATION
 ****************************************/
function initRevenueSection() {
  const recalcBtn = document.getElementById("recalcRevenueBtn");
  if (recalcBtn) {
    recalcBtn.addEventListener("click", recalcTotalRevenue);
  }
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
  const analyzeBtn = document.getElementById("analyzeFinBtn");
  if (analyzeBtn) {
    analyzeBtn.addEventListener("click", analyzeFinancials);
  }
}

function analyzeFinancials() {
  const start = document.getElementById("finStart").value;
  const end = document.getElementById("finEnd").value;
  const taxRate = parseFloat(document.getElementById("taxRate").value) || 0;

  let income = 0;
  orders.forEach((o) => {
    const orderDate = new Date(o.date);
    if (start && orderDate < new Date(start)) return;
    if (end && orderDate > new Date(end)) return;
    income += o.totalPrice;
  });

  let expense = 0;
  purchases.forEach((p) => {
    const purchaseDate = new Date(p.date);
    if (start && purchaseDate < new Date(start)) return;
    if (end && purchaseDate > new Date(end)) return;
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
 *  INVENTORY MANAGEMENT MODULE
 ****************************************/
function initInventoryManagementModule() {
  const inventoryForm = document.getElementById("inventoryForm");
  if (inventoryForm) {
    inventoryForm.addEventListener("submit", (e) => {
      e.preventDefault();
      addOrUpdateInventoryItem();
    });
  }

  const exportBtn = document.getElementById("exportInventoryCsv");
  if (exportBtn) {
    exportBtn.addEventListener("click", exportInventoryCsv);
  }
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

  // Validation Flags
  let isValid = true;
  let errorMsg = "";

  // Validate Item ID
  if (!itemId) {
    isValid = false;
    errorMsg += "Item ID is required.\n";
  } else if (!/^[a-zA-Z0-9]+$/.test(itemId)) {
    isValid = false;
    errorMsg += "Item ID must be alphanumeric.\n";
  } else {
    const existingItem = inventoryItems.find((i) => i.itemId === itemId);
    if (!existingItem) {
      // If adding new, ensure uniqueness
      // Assuming update allows existing Item IDs
    }
  }

  // Validate Category
  if (!category) {
    isValid = false;
    errorMsg += "Category is required.\n";
  } else if (!categoryPricing.find((c) => c.category === category)) {
    isValid = false;
    errorMsg += "Selected category does not exist.\n";
  }

  // Validate Quantity
  if (isNaN(quantity)) {
    isValid = false;
    errorMsg += "Quantity must be a number.\n";
  } else if (quantity < 0) {
    isValid = false;
    errorMsg += "Quantity cannot be negative.\n";
  }

  // Validate Reorder Level
  if (isNaN(reorderLevel)) {
    isValid = false;
    errorMsg += "Reorder Level must be a number.\n";
  } else if (reorderLevel < 0) {
    isValid = false;
    errorMsg += "Reorder Level cannot be negative.\n";
  }

  // Validate Restock Date
  if (restockDate) {
    const rDate = new Date(restockDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (rDate < today) {
      isValid = false;
      errorMsg += "Restock Date cannot be in the past.\n";
    }
  }

  // Validate Storage Location
  if (!storageLocation) {
    isValid = false;
    errorMsg += "Storage Location is required.\n";
  } else if (!/^[a-zA-Z0-9\s]+$/.test(storageLocation)) {
    isValid = false;
    errorMsg += "Storage Location must be alphanumeric.\n";
  }

  // If invalid, display errors
  const errorDiv = document.getElementById("inventoryFormErrors");
  if (errorDiv) errorDiv.textContent = "";

  if (!isValid) {
    if (errorDiv) {
      errorDiv.textContent =
        "Please correct the following errors:\n" + errorMsg;
    } else {
      alert("Please correct the following errors:\n" + errorMsg);
    }
    return;
  }

  if (!itemId || !category || isNaN(quantity) || isNaN(reorderLevel)) {
    alert("All fields are required and must be valid.");
    return;
  }

  const existing = inventoryItems.find((i) => i.itemId === itemId);
  if (existing) {
    Object.assign(existing, {
      category,
      quantity,
      reorderLevel,
      restockDate,
      storageLocation,
    });
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
  renderLowStockAlerts();
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
  if (!confirm(`Delete Inventory Item ID '${itemId}'?`)) return;
  inventoryItems = inventoryItems.filter((i) => i.itemId !== itemId);
  saveInventoryItems();
  renderInventoryTable();
  renderLowStockAlerts();
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

  // Additionally, render packaged inventory low stock alerts
  renderLowStockAlertsPackaged();
}

function renderLowStockAlertsPackaged() {
  const alertUl = document.getElementById("lowStockAlertsPackaged");
  if (!alertUl) return;
  alertUl.innerHTML = "";

  // Define a reorder threshold for packaged inventory, e.g., 10 units
  const reorderThreshold = 10;

  packagedInventory.forEach((pi) => {
    if (pi.units < reorderThreshold) {
      const li = document.createElement("li");
      li.textContent = `${pi.category} is below ${reorderThreshold} units!`;
      alertUl.appendChild(li);
    }
  });
}

/****************************************
 *  COMPREHENSIVE REPORT
 ****************************************/
function initComprehensiveReportModule() {
  const generateBtn = document.getElementById("generateReportBtn");
  if (generateBtn) {
    generateBtn.addEventListener("click", generateComprehensiveReport);
  }

  const exportBtn = document.getElementById("exportComprehensiveCsv");
  if (exportBtn) {
    exportBtn.addEventListener("click", exportComprehensiveReportCsv);
  }
}

function generateComprehensiveReport() {
  const start = document.getElementById("reportStartDate").value;
  const end = document.getElementById("reportEndDate").value;

  // 1. Total Income
  let totalIncome = 0;
  orders.forEach((o) => {
    const orderDate = new Date(o.date);
    if (start && orderDate < new Date(start)) return;
    if (end && orderDate > new Date(end)) return;
    totalIncome += o.totalPrice;
  });

  // 2. Total Expenses (filtered by date)
  let totalExpenses = 0;
  purchases.forEach((p) => {
    const purchaseDate = new Date(p.date);
    if (start && purchaseDate < new Date(start)) return;
    if (end && purchaseDate > new Date(end)) return;
    totalExpenses += p.totalCost;
  });

  // 3. Tax
  const taxRate = 0.1; // Fixed 10%; adjust as needed
  const taxApplied = totalIncome * taxRate;

  // 4. Net Profit
  const netProfit = totalIncome - totalExpenses - taxApplied;

  // 5. Products Sold per Category
  let soldPerCategory = {};
  orders.forEach((o) => {
    const orderDate = new Date(o.date);
    if (start && orderDate < new Date(start)) return;
    if (end && orderDate > new Date(end)) return;

    if (!soldPerCategory[o.category]) {
      soldPerCategory[o.category] = 0;
    }
    soldPerCategory[o.category] += o.quantity;
  });

  // 6. Remaining Stock per Category (Packaged)
  const remainingStock = packagedInventory.map((pi) => ({
    category: pi.category,
    units: pi.units,
    totalKg: pi.totalKg,
  }));

  // Build HTML
  const outputDiv = document.getElementById("reportOutput");
  if (!outputDiv) return;

  let html = `
    <h3>Comprehensive Report (Start: ${start || "N/A"} - End: ${
    end || "N/A"
  })</h3>
    <p><strong>Total Income (Sales):</strong> $${totalIncome.toFixed(2)}</p>
    <p><strong>Total Expenses (Purchases):</strong> $${totalExpenses.toFixed(
      2
    )}</p>
    <p><strong>Tax Applied (10%):</strong> $${taxApplied.toFixed(2)}</p>
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

/****************************************
 *   DEMAND FORECASTING & ALERTS
 ****************************************/
function initForecastingSectionModule() {
  const forecastBtn = document.getElementById("forecastDemandBtn");
  if (forecastBtn) {
    forecastBtn.addEventListener("click", forecastDemand);
  }
}

function forecastDemand() {
  // Calculate average daily sales per category over the last 30 days
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  let salesData = {};

  orders.forEach((o) => {
    const orderDate = new Date(o.date);
    if (orderDate >= thirtyDaysAgo && orderDate <= today) {
      if (!salesData[o.category]) {
        salesData[o.category] = 0;
      }
      salesData[o.category] += o.quantity;
    }
  });

  let recommendations = "";

  Object.keys(salesData).forEach((cat) => {
    const averageDailySales = salesData[cat] / 30;
    const recommendedStock = Math.ceil(averageDailySales * 60); // Next 2 months
    recommendations += `<p>${cat}: Average Daily Sales = ${averageDailySales.toFixed(
      2
    )} units/day. Recommended Stock for Next 2 Months = ${recommendedStock} units.</p>`;
  });

  document.getElementById("forecastOutput").innerHTML =
    recommendations || "<p>No sales data available for forecasting.</p>";
}

/****************************************
 *  INITIALIZATION FUNCTIONS
 ****************************************/
window.addEventListener("DOMContentLoaded", () => {
  // Load data
  loadDataFromLocalStorage();

  // Initialize all sections
  initFarmersSection();
  initPurchasesSection();
  initExpenseCalculation();
  initPricingSection();
  initPackagingSection();
  initOrderSection();
  initRevenueSection();
  initFinancialAnalysis();
  initInventoryManagementModule();
  initComprehensiveReportModule();
  initForecastingSectionModule();

  // Render initial tables
  renderFarmersTable();
  renderPurchasesTable();
  renderOrdersTable();
  renderInventoryTable();
  renderPricingTable();
  renderPackagedInventory();
  recalcTotalRevenue();
});
