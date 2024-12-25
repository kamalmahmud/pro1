/****************************************
 *     GLOBAL DATA STRUCTURES
 ****************************************/

// Data Arrays
let farmers = [];
let purchases = [];
let orders = [];
let inventoryItems = [];
let categoryPricing = []; // Pricing for product categories
let packagedInventory = [];
let packagedReorderLevels = {};
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

const ModuleEvents = {
  PURCHASE: "purchase",
  SALE: "sale",
  INVENTORY: "inventory",
  FINANCIAL: "financial",
};

function updateConnectedModules(eventType, data) {
  console.log(`Processing ${eventType} event:`, data);

  switch (eventType) {
    case ModuleEvents.PURCHASE:
      handlePurchaseUpdate(data);
      break;
    case ModuleEvents.SALE:
      handleSaleUpdate(data);
      break;
    case ModuleEvents.INVENTORY:
      handleInventoryUpdate(data);
      break;
    case ModuleEvents.FINANCIAL:
      handleFinancialUpdate(data);
      break;
  }

  // Trigger alerts check
  checkSystemAlerts();
}

function handlePurchaseUpdate(data) {
  // Update inventory
  const inventoryItem = inventoryItems.find(
    (i) => i.category === data.category
  );
  if (inventoryItem) {
    inventoryItem.quantity += data.quantity;
    saveInventoryItems();
    renderInventoryTable();
  }

  // Update financials
  calculateExpensesForPeriod();
  analyzeFinancials();

  // Update reports
  generateComprehensiveReport();
}

function handleSaleUpdate(data) {
  // Update inventory
  updateInventoryAfterSale(data.category, data.quantity);

  // Update revenue
  recalcTotalRevenue();

  // Check reorder points
  checkReorderPoints();

  // Update reports
  generateComprehensiveReport();
}

function handleInventoryUpdate(data) {
  renderInventoryTable();
  renderLowStockAlerts();
  renderPackagedInventory();

  // Update forecasting
  if (document.getElementById("forecastOutput")) {
    enhancedDemandForecast();
  }
}

function handleFinancialUpdate(data) {
  recalcTotalRevenue();
  analyzeFinancials();
  generateComprehensiveReport();
}

function checkSystemAlerts() {
  const alerts = [];

  // Check inventory levels
  inventoryItems.forEach((item) => {
    if (item.quantity < item.reorderLevel) {
      alerts.push({
        type: "inventory",
        severity: "high",
        message: `Low stock alert: ${item.category} (${item.quantity} units remaining)`,
      });
    }
  });

  // Check financial thresholds
  const currentRevenue = calculateCurrentRevenue();
  if (currentRevenue < getMinimumRevenueThreshold()) {
    alerts.push({
      type: "financial",
      severity: "medium",
      message: "Revenue below expected threshold for current period",
    });
  }

  displaySystemAlerts(alerts);
}

function displaySystemAlerts(alerts) {
  const alertContainer = document.getElementById("systemAlerts");
  if (!alertContainer) return;

  alertContainer.innerHTML = alerts
    .map(
      (alert) => `
      <div class="alert alert-${alert.severity}">
          <strong>${alert.type.toUpperCase()}:</strong> ${alert.message}
      </div>
  `
    )
    .join("");
}

// Helper functions
function calculateCurrentRevenue() {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  return orders
    .filter((order) => {
      const orderDate = new Date(order.date);
      return (
        orderDate.getMonth() === currentMonth &&
        orderDate.getFullYear() === currentYear
      );
    })
    .reduce((sum, order) => sum + order.totalPrice, 0);
}

function getMinimumRevenueThreshold() {
  // This could be made configurable
  return 10000; // Example threshold
}

function checkReorderPoints() {
  inventoryItems.forEach((item) => {
    if (item.quantity <= item.reorderLevel) {
      const alert = {
        type: "inventory",
        severity: "high",
        message: `Reorder Alert: ${item.category} has reached reorder level`,
      };
      displaySystemAlerts([alert]);
    }
  });
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
    // If updating an existing purchase, adjust inventory
    const oldQuantity = existing.quantity;
    const farmer = farmers.find((f) => f.farmerId === farmerId);

    if (farmer) {
      const inventoryItem = inventoryItems.find(
        (i) => i.category === farmer.region
      );

      if (inventoryItem) {
        // Subtract the old quantity
        inventoryItem.quantity -= oldQuantity;
        // Add new quantity
        inventoryItem.quantity += quantity;
      }
    }

    // Update existing purchase
    Object.assign(existing, {
      farmerId,
      date,
      quantity,
      pricePerKg,
      totalCost: quantity * pricePerKg,
    });
  } else {
    purchases.push({
      purchaseId,
      farmerId,
      date,
      quantity,
      pricePerKg,
      totalCost: quantity * pricePerKg,
    });

    // Get farmer's region (category)
    const farmer = farmers.find((f) => f.farmerId === farmerId);
    if (!farmer) {
      alert(`Farmer ID '${farmerId}' not found.`);
      return;
    }

    // Update Raw Inventory
    updateRawInventoryAfterPurchase({
      category: farmer.region,
      quantity: quantity,
    });
  }

  document.getElementById("purchaseForm").reset();
  savePurchases();
  renderPurchasesTable();
}

function updateRawInventoryAfterPurchase(purchaseData) {
  const { category, quantity } = purchaseData;

  let inventoryItem = inventoryItems.find((item) => item.category === category);

  if (!inventoryItem) {
    inventoryItem = {
      itemId: generateUniqueId("RAW"),
      category: category,
      quantity: quantity,
      reorderLevel: 10,
      restockDate: "",
      storageLocation: "Main Warehouse",
    };
    inventoryItems.push(inventoryItem);
  } else {
    // Add to existing inventory
    inventoryItem.quantity += quantity;
  }

  console.log(`Updated inventory for ${category}:`, inventoryItem); // Debug log

  saveInventoryItems();
  updateCategorySelections();
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
      <td>
        <button onclick="editPurchase('${p.purchaseId}')">Edit</button>
        <button onclick="deletePurchase('${p.purchaseId}')">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function editPurchase(purchaseId) {
  const purchase = purchases.find((p) => p.purchaseId === purchaseId);
  if (!purchase) return;

  // Populate form with existing purchase details
  document.getElementById("purchaseId").value = purchase.purchaseId;
  document.getElementById("purchaseFarmerId").value = purchase.farmerId;
  document.getElementById("purchaseDate").value = purchase.date;
  document.getElementById("purchaseQuantity").value = purchase.quantity;
  document.getElementById("purchasePrice").value = purchase.pricePerKg;
}

function deletePurchase(purchaseId) {
  if (!confirm(`Are you sure you want to delete purchase ${purchaseId}?`))
    return;

  // Find the purchase to get its details for inventory adjustment
  const purchaseToDelete = purchases.find((p) => p.purchaseId === purchaseId);

  if (purchaseToDelete) {
    // Reverse the inventory update
    const farmer = farmers.find(
      (f) => f.farmerId === purchaseToDelete.farmerId
    );
    if (farmer) {
      // Find the inventory item for this farmer's region
      const inventoryItem = inventoryItems.find(
        (i) => i.category === farmer.region
      );

      if (inventoryItem) {
        // Subtract the quantity from inventory
        inventoryItem.quantity -= purchaseToDelete.quantity;

        // Ensure quantity doesn't go negative
        inventoryItem.quantity = Math.max(0, inventoryItem.quantity);
      }
    }
  }

  // Remove the purchase from the array
  purchases = purchases.filter((p) => p.purchaseId !== purchaseId);

  // Save and update UI
  savePurchases();
  renderPurchasesTable();
  renderInventoryTable();
  renderLowStockAlerts();
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

  try {
    // Validate packaging request
    if (
      !rawCatSelect ||
      !packagedCatSelect ||
      isNaN(quantityKg) ||
      quantityKg <= 0
    ) {
      throw new Error("Please fill in all fields with valid values");
    }

    const rawInventoryItem = inventoryItems.find(
      (i) => i.category === rawCatSelect
    );
    if (!rawInventoryItem || rawInventoryItem.quantity < quantityKg) {
      throw new Error(
        `Insufficient raw inventory for ${rawCatSelect}. Available: ${
          rawInventoryItem ? rawInventoryItem.quantity : 0
        }kg`
      );
    }

    // Proceed with packaging
    rawInventoryItem.quantity -= quantityKg;

    const packagedCatObj = categoryPricing.find(
      (c) => c.category === packagedCatSelect
    );
    const packagedInvObj = packagedInventory.find(
      (i) => i.category === packagedCatSelect
    );

    if (!packagedCatObj || !packagedInvObj) {
      throw new Error("Invalid packaged category");
    }

    // Calculate units based on package weight
    let unitWeight = parseFloat(packagedCatObj.weightInfo);
    let unitsToAdd = Math.floor(quantityKg / unitWeight);

    if (unitsToAdd <= 0) {
      throw new Error("Quantity too low to form at least one unit");
    }

    // Update packaged inventory
    packagedInvObj.units += unitsToAdd;
    packagedInvObj.totalKg += quantityKg;

    saveInventoryItems();
    savePackagedInventory();

    renderInventoryTable();
    renderPackagedInventory();
    renderLowStockAlerts();

    document.getElementById("packageForm").reset();
    alert(
      `Packaged ${unitsToAdd} unit(s) of "${packagedCatSelect}" from "${rawCatSelect}".`
    );
  } catch (error) {
    alert(error.message);
  }
}
function initPackagedReorderLevels() {
  packagedReorderLevels =
    JSON.parse(localStorage.getItem("packagedReorderLevels")) || {};
  // Set default values for any missing categories
  categoryPricing.forEach((cat) => {
    if (!(cat.category in packagedReorderLevels)) {
      packagedReorderLevels[cat.category] = 10;
    }
  });
  savePackagedReorderLevels();
}

function savePackagedReorderLevels() {
  localStorage.setItem(
    "packagedReorderLevels",
    JSON.stringify(packagedReorderLevels)
  );
}

// Modify the existing renderPackagedInventory function
function renderPackagedInventory() {
  const tbody = document.querySelector("#packagedInventoryTable tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  packagedInventory.forEach((item) => {
    const reorderLevel = packagedReorderLevels[item.category] || 10;
    const tr = document.createElement("tr");
    tr.innerHTML = `
          <td>${item.category}</td>
          <td>${item.units}</td>
          <td>${item.totalKg.toFixed(2)}</td>
          <td>
              <input type="number" 
                  class="reorder-level-input" 
                  value="${reorderLevel}" 
                  min="1" 
                  data-category="${item.category}"
                  style="width: 70px; padding: 4px;">
          </td>
      `;
    tbody.appendChild(tr);
  });

  // Add event listeners for the inputs
  const inputs = tbody.querySelectorAll(".reorder-level-input");
  inputs.forEach((input) => {
    input.addEventListener("change", (e) => {
      const category = e.target.dataset.category;
      const value = parseInt(e.target.value);
      if (value && value > 0) {
        packagedReorderLevels[category] = value;
        savePackagedReorderLevels();
        renderLowStockAlertsPackaged();
      }
    });
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

function enhancedTaxCalculation(taxableIncome, options = {}) {
  const {
    taxMethod = "standard",
    allowDeductions = true,
    minimumThreshold = 1000,
    manualTaxRate = 0.1,
  } = options;

  // Determine financial status
  const taxStatus =
    taxableIncome < 0 ? "Loss" : taxableIncome === 0 ? "Break-even" : "Profit";

  let taxAmount = 0;
  let effectiveRate = 0;

  // Only calculate tax if above minimum threshold and in profit
  if (taxableIncome > minimumThreshold) {
    if (taxMethod === "progressive") {
      taxAmount = calculateProgressiveTax(taxableIncome);
    } else {
      // Standard method uses manual tax rate
      taxAmount = taxableIncome * manualTaxRate;
    }

    // Prevent division by zero
    effectiveRate = taxableIncome > 0 ? (taxAmount / taxableIncome) * 100 : 0;
  }

  return {
    taxAmount,
    effectiveRate,
    deductions: 0,
    taxableIncome,
    taxStatus,
  };
}

function analyzeFinancials() {
  const start = document.getElementById("finStart").value;
  const end = document.getElementById("finEnd").value;
  const taxMethod = document.getElementById("taxMethod").value;
  const allowDeductions = document.getElementById("allowDeductions").checked;
  const minimumThreshold =
    parseFloat(document.getElementById("minimumThreshold").value) || 1000;
  const manualTaxRate =
    parseFloat(document.getElementById("taxRate").value) || 10;

  // Calculate income
  let filteredOrders = orders.filter((o) => {
    const orderDate = new Date(o.date);
    const startDate = start ? new Date(start) : null;
    const endDate = end ? new Date(end) : null;

    return (
      (!startDate || orderDate >= startDate) &&
      (!endDate || orderDate <= endDate)
    );
  });

  const income = filteredOrders.reduce(
    (sum, order) => sum + order.totalPrice,
    0
  );

  // Calculate expenses
  let filteredPurchases = purchases.filter((p) => {
    const purchaseDate = new Date(p.date);
    const startDate = start ? new Date(start) : null;
    const endDate = end ? new Date(end) : null;

    return (
      (!startDate || purchaseDate >= startDate) &&
      (!endDate || purchaseDate <= endDate)
    );
  });

  const expense = filteredPurchases.reduce(
    (sum, purchase) => sum + purchase.totalCost,
    0
  );

  // Calculate taxable income
  const taxableIncome = income - expense;

  // Calculate tax
  const taxResults = enhancedTaxCalculation(taxableIncome, {
    taxMethod,
    allowDeductions,
    minimumThreshold,
    manualTaxRate: manualTaxRate / 100,
  });

  // Update display elements
  document.getElementById("finIncomeDisplay").textContent = income.toFixed(2);
  document.getElementById("finExpenseDisplay").textContent = expense.toFixed(2);
  document.getElementById("finTaxDisplay").textContent =
    taxResults.taxAmount.toFixed(2);
  document.getElementById("finProfitDisplay").textContent =
    taxableIncome.toFixed(2);

  // Update tax details
  const taxDetailsDiv = document.getElementById("taxDetails");
  if (taxDetailsDiv) {
    taxDetailsDiv.innerHTML = `
      <h4>Detailed Financial Analysis</h4>
      <p>Total Income: $${income.toFixed(2)}</p>
      <p>Total Expenses: $${expense.toFixed(2)}</p>
      <p>Taxable Income: $${taxableIncome.toFixed(2)}</p>
      <p>Financial Status: ${taxResults.taxStatus}</p>
      <p>Tax Method: ${
        taxMethod === "progressive" ? "Progressive" : "Standard Rate"
      }</p>
      <p>Tax Amount: $${taxResults.taxAmount.toFixed(2)}</p>
      <p>Effective Tax Rate: ${taxResults.effectiveRate.toFixed(2)}%</p>
    `;
  }

  // Optional: Update deductions breakdown
  updateDeductionsBreakdown();
}

function calculateProgressiveTax(income) {
  const brackets = [
    { threshold: 5000, rate: 0.05 }, // 5% up to $5,000
    { threshold: 10000, rate: 0.1 }, // 10% from $5,001 to $10,000
    { threshold: 20000, rate: 0.15 }, // 15% from $10,001 to $20,000
    { threshold: Infinity, rate: 0.2 }, // 20% above $20,000
  ];

  let totalTax = 0;
  let remainingIncome = income;
  let previousThreshold = 0;

  for (const bracket of brackets) {
    const taxableInBracket = Math.min(
      remainingIncome,
      bracket.threshold - previousThreshold
    );

    if (taxableInBracket <= 0) break;

    totalTax += taxableInBracket * bracket.rate;
    remainingIncome -= taxableInBracket;
    previousThreshold = bracket.threshold;
  }

  return totalTax;
}
function calculateConfidence(dataPoints, slope, intercept) {
  // Simple R-squared calculation
  const yMean =
    dataPoints.reduce((sum, point) => sum + point.y, 0) / dataPoints.length;
  const ssTotal = dataPoints.reduce(
    (sum, point) => sum + Math.pow(point.y - yMean, 2),
    0
  );
  const ssResidual = dataPoints.reduce((sum, point) => {
    const predicted = slope * point.x + intercept;
    return sum + Math.pow(point.y - predicted, 2);
  }, 0);
  return ssTotal === 0 ? 0 : 1 - ssResidual / ssTotal;
}
const TaxRates = {
  STANDARD: 0.1,
  REDUCED: 0.05,
  SPECIAL: 0.15,
};

const DeductionTypes = {
  OPERATIONAL: "operational",
  CAPITAL: "capital",
  INVENTORY: "inventory",
};

function calculateDeductions() {
  let totalDeductions = 0;

  // Operational expenses deduction
  const operationalDeductions = purchases.reduce(
    (sum, purchase) => sum + purchase.totalCost,
    0
  );
  totalDeductions += operationalDeductions;

  // Inventory depreciation deduction
  const inventoryDeduction = calculateInventoryDepreciation();
  totalDeductions += inventoryDeduction;

  // Capital expenses deduction (if any)
  const capitalDeduction = calculateCapitalDeductions();
  totalDeductions += capitalDeduction;

  return totalDeductions;
}

function initTaxRateValidation() {
  const taxRateInput = document.getElementById("taxRate");
  if (taxRateInput) {
    taxRateInput.addEventListener("input", function () {
      const value = parseFloat(this.value);
      if (isNaN(value) || value < 0 || value > 100) {
        this.setCustomValidity("Tax rate must be between 0 and 100");
      } else {
        this.setCustomValidity("");
      }
    });
  }
}

function calculateInventoryDepreciation() {
  return inventoryItems.reduce((total, item) => {
    // Calculate depreciation based on storage time
    const depreciation = item.quantity * 0.1; // 10% depreciation rate
    return total + depreciation;
  }, 0);
}

function calculateCapitalDeductions() {
  // This could be expanded based on business requirements
  return 0;
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

  // Initialize categories based on farmers' regions
  initializeCategories();

  const exportBtn = document.getElementById("exportInventoryCsv");
  if (exportBtn) {
    exportBtn.addEventListener("click", exportInventoryCsv);
  }
}

function initializeCategories() {
  // Get unique categories from farmers' regions
  const uniqueCategories = [...new Set(farmers.map((farmer) => farmer.region))];

  // Ensure each category has an inventory entry
  uniqueCategories.forEach((category) => {
    const existingItem = inventoryItems.find(
      (item) => item.category === category
    );
    if (!existingItem) {
      inventoryItems.push({
        itemId: generateUniqueId("RAW"),
        category: category,
        quantity: 0,
        reorderLevel: 10,
        restockDate: "",
        storageLocation: "Main Warehouse",
      });
    }
  });

  saveInventoryItems();
  updateCategorySelections();
}

function updateCategorySelections() {
  // Update all category dropdowns in the application
  const categoryDropdowns = ["packagingRawCategory", "invCategory"];

  const categories = [...new Set(inventoryItems.map((item) => item.category))];

  categoryDropdowns.forEach((dropdownId) => {
    const dropdown = document.getElementById(dropdownId);
    if (dropdown) {
      const currentValue = dropdown.value;
      dropdown.innerHTML = '<option value="">-- Select Category --</option>';

      categories.forEach((category) => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        dropdown.appendChild(option);
      });

      if (currentValue && categories.includes(currentValue)) {
        dropdown.value = currentValue;
      }
    }
  });
}

function addOrUpdateInventoryItem() {
  // Collect form values
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
  const errorDiv = document.getElementById("inventoryFormErrors");
  errorDiv.textContent = ""; // Clear previous errors

  // Validate Item ID
  if (!itemId) {
    isValid = false;
    errorMsg += "Item ID is required.\n";
  } else if (!/^[a-zA-Z0-9]+$/.test(itemId)) {
    isValid = false;
    errorMsg += "Item ID must be alphanumeric.\n";
  } else if (inventoryItems.some((i) => i.itemId === itemId)) {
    isValid = false;
    errorMsg += "Item ID must be unique.\n";
  }

  // Validate Category
  if (!category) {
    isValid = false;
    errorMsg += "Category is required.\n";
  } else if (!/^[a-zA-Z\s]+$/.test(category)) {
    isValid = false;
    errorMsg += "Category must contain only letters and spaces.\n";
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

  // Validate Restock Date (optional, but if provided, should not be in the past)
  if (restockDate) {
    const selectedDate = new Date(restockDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      isValid = false;
      errorMsg += "Restock Date cannot be in the past.\n";
    }
  }

  // Validate Storage Location
  if (!storageLocation) {
    isValid = false;
    errorMsg += "Storage Location is required.\n";
  } else if (storageLocation.length < 3) {
    isValid = false;
    errorMsg += "Storage Location must be at least 3 characters long.\n";
  }

  // Display errors if validation fails
  if (!isValid) {
    errorDiv.textContent = errorMsg;
    return;
  }

  // Find existing inventory item
  const existing = inventoryItems.find((i) => i.itemId === itemId);

  if (existing) {
    // Update existing item
    if (
      confirm(
        `Inventory item ${itemId} already exists. Do you want to update its information?`
      )
    ) {
      // Preserve the original quantity when updating
      existing.category = category;
      existing.reorderLevel = reorderLevel;
      existing.restockDate = restockDate;
      existing.storageLocation = storageLocation;

      alert(`Inventory item ${itemId} updated successfully.`);
    } else {
      return;
    }
  } else {
    // Create new inventory item
    const newItem = {
      itemId,
      category,
      quantity: quantity, // Use the entered quantity
      reorderLevel,
      restockDate,
      storageLocation: storageLocation || "Main Warehouse",
    };

    inventoryItems.push(newItem);
    alert(`New inventory item ${itemId} added successfully.`);
  }

  // Save and update UI
  saveInventoryItems();
  renderInventoryTable();
  renderLowStockAlerts();
  updateCategorySelections();

  // Reset the form
  document.getElementById("inventoryForm").reset();
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
              <button onclick="editInventoryItem('${
                item.itemId
              }')">Edit</button>
              <button onclick="deleteInventoryItem('${
                item.itemId
              }')">Delete</button>
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

  packagedInventory.forEach((pi) => {
    const reorderLevel = packagedReorderLevels[pi.category] || 10;
    if (pi.units < reorderLevel) {
      const li = document.createElement("li");
      li.textContent = `${pi.category} is below ${reorderLevel} units!`;
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

// Add to app.js after the existing forecasting code

function calculateSeasonalFactors(orderData) {
  const monthlyTotals = {};
  const seasonalFactors = {};

  orderData.forEach((order) => {
    const orderDate = new Date(order.date);
    const monthKey = orderDate.getMonth();

    if (!monthlyTotals[monthKey]) {
      monthlyTotals[monthKey] = {
        totalQuantity: 0,
        count: 0,
      };
    }

    monthlyTotals[monthKey].totalQuantity += order.quantity;
    monthlyTotals[monthKey].count++;
  });

  // Calculate average for each month
  Object.keys(monthlyTotals).forEach((month) => {
    seasonalFactors[month] =
      monthlyTotals[month].totalQuantity / monthlyTotals[month].count;
  });

  return seasonalFactors;
}

function enhancedDemandForecast() {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const relevantOrders = orders.filter(
    (order) => new Date(order.date) >= ninetyDaysAgo
  );

  const seasonalFactors = calculateSeasonalFactors(orders);
  const categoryTrends = {};

  // Calculate trends by category
  categoryPricing.forEach((category) => {
    const categoryOrders = relevantOrders.filter(
      (order) => order.category === category.category
    );

    const trend = calculateCategoryTrend(categoryOrders);
    categoryTrends[category.category] = trend;
  });

  // Generate predictions
  const predictions = generatePredictions(categoryTrends, seasonalFactors);

  // Update the forecast display
  updateForecastDisplay(predictions);

  return predictions;
}

function calculateCategoryTrend(categoryOrders) {
  if (categoryOrders.length < 2) return { slope: 0, confidence: 0 };

  const dataPoints = categoryOrders.map((order, index) => ({
    x: index,
    y: order.quantity,
  }));

  // Simple linear regression
  const n = dataPoints.length;
  const sumX = dataPoints.reduce((sum, point) => sum + point.x, 0);
  const sumY = dataPoints.reduce((sum, point) => sum + point.y, 0);
  const sumXY = dataPoints.reduce((sum, point) => sum + point.x * point.y, 0);
  const sumXX = dataPoints.reduce((sum, point) => sum + point.x * point.x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return {
    slope,
    intercept,
    confidence: calculateConfidence(dataPoints, slope, intercept),
  };
}

function generatePredictions(trends, seasonalFactors) {
  const predictions = {};
  const currentMonth = new Date().getMonth();

  Object.keys(trends).forEach((category) => {
    const trend = trends[category];
    const seasonalFactor = seasonalFactors[currentMonth] || 1;

    const baselinePrediction = trend.intercept + trend.slope * 90; // 90 days forecast
    const seasonallyAdjusted = baselinePrediction * seasonalFactor;

    predictions[category] = {
      predicted: Math.max(0, Math.round(seasonallyAdjusted)),
      confidence: trend.confidence,
      trend:
        trend.slope > 0
          ? "Increasing"
          : trend.slope < 0
          ? "Decreasing"
          : "Stable",
    };
  });

  return predictions;
}

function updateForecastDisplay(predictions) {
  const forecastOutput = document.getElementById("forecastOutput");
  if (!forecastOutput) return;

  let html = "<h3>Enhanced Demand Forecast (90-Day Outlook)</h3>";

  Object.entries(predictions).forEach(([category, prediction]) => {
    const confidenceLevel =
      prediction.confidence > 0.7
        ? "High"
        : prediction.confidence > 0.4
        ? "Medium"
        : "Low";

    html += `
          <div class="forecast-card">
              <h4>${category}</h4>
              <p>Predicted Demand: ${prediction.predicted} units</p>
              <p>Trend: ${prediction.trend}</p>
              <p>Confidence Level: ${confidenceLevel}</p>
          </div>
      `;
  });

  forecastOutput.innerHTML = html;
}

// Update the event listener
document
  .getElementById("forecastDemandBtn")
  ?.addEventListener("click", enhancedDemandForecast);
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
  initEnhancedFinancialAnalysis();
  initPackagedReorderLevels();
  initTaxRateValidation();

  // Render initial tables
  renderFarmersTable();
  renderPurchasesTable();
  renderOrdersTable();
  renderInventoryTable();
  renderPricingTable();
  renderPackagedInventory();
  recalcTotalRevenue();
  renderLowStockAlertsPackaged();
});

// Dashboard functionality
function initDashboard() {
  updateDashboardStats();
  initCharts();
  updateRecentActivity();

  // Refresh dashboard every 30 seconds
  setInterval(updateDashboardStats, 30000);
}

function updateDashboardStats() {
  // Load data from localStorage
  const orders = JSON.parse(localStorage.getItem("orders")) || [];
  const farmers = JSON.parse(localStorage.getItem("farmers")) || [];
  const inventoryItems =
    JSON.parse(localStorage.getItem("inventoryItems")) || [];

  // Calculate stats
  const totalRevenue = orders.reduce(
    (sum, order) => sum + (order.totalPrice || 0),
    0
  );
  const activeOrders = orders.filter(
    (order) => order.status === "Pending"
  ).length;
  const lowStockItems = inventoryItems.filter(
    (item) => item.quantity < item.reorderLevel
  ).length;

  // Update DOM
  document.getElementById(
    "dashboardRevenue"
  ).textContent = `$${totalRevenue.toFixed(2)}`;
  document.getElementById("dashboardOrders").textContent = activeOrders;
  document.getElementById("dashboardLowStock").textContent = lowStockItems;
  document.getElementById("dashboardSuppliers").textContent = farmers.length;
}

function initCharts() {
  initSalesChart();
  initInventoryChart();
}

function initSalesChart() {
  const ctx = document.getElementById("salesChart").getContext("2d");
  const categoryPricing =
    JSON.parse(localStorage.getItem("categoryPricing")) || [];
  const packagedInventory =
    JSON.parse(localStorage.getItem("packagedInventory")) || [];

  const data = {
    labels: categoryPricing.map((cat) => cat.category),
    datasets: [
      {
        label: "Units Sold",
        data: categoryPricing.map((cat) => {
          const packaged = packagedInventory.find(
            (p) => p.category === cat.category
          );
          return packaged ? packaged.units : 0;
        }),
        backgroundColor: "#3b82f6",
      },
    ],
  };

  new Chart(ctx, {
    type: "bar",
    data: data,
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top",
        },
        title: {
          display: true,
          text: "Sales by Category",
        },
      },
    },
  });
}

function initInventoryChart() {
  const ctx = document.getElementById("inventoryChart").getContext("2d");
  const inventoryItems =
    JSON.parse(localStorage.getItem("inventoryItems")) || [];

  const data = {
    labels: inventoryItems.map((item) => item.category),
    datasets: [
      {
        label: "Current Stock (kg)",
        data: inventoryItems.map((item) => item.quantity),
        backgroundColor: "#10b981",
      },
    ],
  };

  new Chart(ctx, {
    type: "doughnut",
    data: data,
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top",
        },
      },
    },
  });
}

function updateRecentActivity() {
  const activityList = document.getElementById("recentActivity");
  const orders = JSON.parse(localStorage.getItem("orders")) || [];
  const recentOrders = orders.slice(-5).reverse(); // Get last 5 orders

  activityList.innerHTML = recentOrders
    .map(
      (order) => `
      <div class="activity-item">
          <div class="activity-icon">🛍️</div>
          <div>
              <strong>${order.customerName}</strong>
              <p>Ordered ${order.quantity} units of ${order.category}</p>
              <small>${new Date(order.date).toLocaleDateString()}</small>
          </div>
      </div>
  `
    )
    .join("");
}

// Initialize dashboard when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("dashboard")) {
    initDashboard();
  }
});

// Add to app.js in the initialization section

function initEnhancedFinancialAnalysis() {
  // Add event listeners for tax settings
  document
    .getElementById("taxMethod")
    ?.addEventListener("change", analyzeFinancials);
  document
    .getElementById("allowDeductions")
    ?.addEventListener("change", analyzeFinancials);
  document
    .getElementById("minimumThreshold")
    ?.addEventListener("change", analyzeFinancials);

  // Initialize breakdown display
  updateDeductionsBreakdown();
}

function updateDeductionsBreakdown() {
  const breakdownDiv = document.getElementById("deductionsBreakdown");
  if (!breakdownDiv) return;

  const deductions = {
    operational: calculateOperationalDeductions(),
    inventory: calculateInventoryDepreciation(),
    capital: calculateCapitalDeductions(),
  };

  const total = Object.values(deductions).reduce((sum, val) => sum + val, 0);

  breakdownDiv.innerHTML = `
      <h4>Deductions Breakdown</h4>
      <ul>
          <li>
              <span>Operational Expenses:</span>
              <span>$${deductions.operational.toFixed(2)}</span>
          </li>
          <li>
              <span>Inventory Depreciation:</span>
              <span>$${deductions.inventory.toFixed(2)}</span>
          </li>
          <li>
              <span>Capital Expenses:</span>
              <span>$${deductions.capital.toFixed(2)}</span>
          </li>
          <li class="total">
              <strong>Total Deductions:</strong>
              <strong>$${total.toFixed(2)}</strong>
          </li>
      </ul>
  `;
}

// Add this to the existing window.addEventListener('DOMContentLoaded', ...) block
function calculateOperationalDeductions() {
  // Calculate operational expenses from purchases
  const operationalDeductions = purchases.reduce((total, purchase) => {
    // You can customize the calculation logic here
    // For example, consider different types of operational expenses
    return total + purchase.totalCost;
  }, 0);

  // Optionally, apply a cap or additional logic to operational deductions
  const MAX_OPERATIONAL_DEDUCTION = 50000; // Example cap
  return Math.min(operationalDeductions, MAX_OPERATIONAL_DEDUCTION);
}

function clearLocalStorage() {
  // Confirm before clearing
  if (
    confirm("Are you sure you want to clear ALL data? This cannot be undone.")
  ) {
    // Clear all local storage
    localStorage.clear();

    // Reset global data arrays
    farmers = [];
    purchases = [];
    orders = [];
    inventoryItems = [];
    categoryPricing = [
      { category: "Small (100g)", weightInfo: "0.1 kg", price: 5 },
      { category: "Medium (250g)", weightInfo: "0.25 kg", price: 10 },
      { category: "Large (500g)", weightInfo: "0.5 kg", price: 18 },
      { category: "Extra Large (1kg)", weightInfo: "1.0 kg", price: 30 },
      { category: "Family Pack (2kg)", weightInfo: "2.0 kg", price: 55 },
      { category: "Bulk Pack (5kg)", weightInfo: "5.0 kg", price: 120 },
      { category: "Premium (custom)", weightInfo: "Varies", price: 0 },
    ];
    packagedInventory = categoryPricing.map((cat) => ({
      category: cat.category,
      units: 0,
      totalKg: 0,
    }));

    // Re-render all tables and sections
    renderFarmersTable();
    renderPurchasesTable();
    renderOrdersTable();
    renderInventoryTable();
    renderPricingTable();
    renderPackagedInventory();
    recalcTotalRevenue();
    renderLowStockAlertsPackaged();

    // Alert user
    alert("All data has been cleared. The system has been reset to default.");
  }
}
