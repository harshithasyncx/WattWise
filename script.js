
// =====================================
// WATTWISE - SMART ELECTRICITY MONITOR
// =====================================

// Load saved data
let usageRecords = JSON.parse(localStorage.getItem("usageRecords")) || [];
let appliances = JSON.parse(localStorage.getItem("appliances")) || [];
let alerts = JSON.parse(localStorage.getItem("alerts")) || [];

let usageChart = null;
let categoryChart = null;

// Save data
function saveData() {
    localStorage.setItem("usageRecords", JSON.stringify(usageRecords));
    localStorage.setItem("appliances", JSON.stringify(appliances));
    localStorage.setItem("alerts", JSON.stringify(alerts));
}

// Get element
function getElement(id) {
    return document.getElementById(id);
}

// Format rupees
function money(amount) {
    return "₹" + Number(amount || 0).toFixed(2);
}

// =====================================
// USAGE TRACKING
// =====================================

const usageForm = getElement("usageForm");

if (usageForm) {
    usageForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const date = getElement("usageDate").value;
        const units = Number(getElement("usageUnits").value);
        const category = getElement("usageCategory").value;
        const notes = getElement("usageNotes").value;

        if (!date || units <= 0 || !category) {
            alert("Please enter valid electricity details.");
            return;
        }

        usageRecords.push({
            id: Date.now(),
            date: date,
            units: units,
            category: category,
            notes: notes
        });

        saveData();
        usageForm.reset();

        displayUsage();
        updateDashboard();
        updateCharts();
        displayReports();
        checkAlerts();

        alert("Electricity usage added successfully!");
    });
}

// Display usage records
function displayUsage() {
    const table = getElement("usageTableBody");
    if (!table) return;

    table.innerHTML = "";

    if (usageRecords.length === 0) {
        table.innerHTML = "<tr><td colspan='5'>No usage records yet.</td></tr>";
        return;
    }

    usageRecords.slice().reverse().forEach(record => {
        const row = document.createElement("tr");

        [record.date, record.units + " kWh", record.category, record.notes || "-"]
            .forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value;
                row.appendChild(cell);
            });

        const actionCell = document.createElement("td");
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", function() {
            usageRecords = usageRecords.filter(item => item.id !== record.id);
            saveData();
            displayUsage();
            updateDashboard();
            updateCharts();
            displayReports();
            checkAlerts();
        });

        actionCell.appendChild(deleteButton);
        row.appendChild(actionCell);
        table.appendChild(row);
    });
}

// =====================================
// BILL CALCULATOR
// =====================================

const billForm = getElement("billForm");

if (billForm) {
    billForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const units = Number(getElement("billUnits").value);
        const rate = Number(getElement("ratePerUnit").value);
        const fixed = Number(getElement("fixedCharge").value);

        if (units < 0 || rate < 0 || fixed < 0) {
            alert("Please enter valid values.");
            return;
        }

        const energyCost = units * rate;
        const total = energyCost + fixed;

        if (getElement("billAmount")) {
            getElement("billAmount").textContent = money(total);
        }

        if (getElement("billBreakdown")) {
            getElement("billBreakdown").textContent =
                "Energy charge: " + money(energyCost) +
                " | Fixed charge: " + money(fixed);
        }
    });
}

// =====================================
// APPLIANCE CALCULATOR
// =====================================

const applianceForm = getElement("applianceForm");

if (applianceForm) {
    applianceForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const name = getElement("applianceName").value.trim();
        const power = Number(getElement("appliancePower").value);
        const hours = Number(getElement("applianceHours").value);
        const days = Number(getElement("applianceDays").value);

        if (!name || power <= 0 || hours <= 0 || days <= 0 || hours > 24 || days > 31) {
            alert("Please enter valid appliance details.");
            return;
        }

        const units = (power * hours * days) / 1000;
        const cost = units * 7;

        appliances.push({
            id: Date.now(),
            name: name,
            power: power,
            hours: hours,
            days: days,
            units: units,
            cost: cost
        });

        saveData();
        applianceForm.reset();
        displayAppliances();
        updateDashboard();

        if (getElement("applianceUnits")) {
            getElement("applianceUnits").textContent = units.toFixed(2) + " kWh";
        }

        if (getElement("applianceCost")) {
            getElement("applianceCost").textContent = money(cost);
        }

        alert("Appliance calculated successfully!");
    });
}

// Display appliances
function displayAppliances() {
    const table = getElement("applianceTableBody");
    if (!table) return;

    table.innerHTML = "";

    if (appliances.length === 0) {
        table.innerHTML = "<tr><td colspan='5'>No appliances added yet.</td></tr>";
        return;
    }

    appliances.forEach(item => {
        const row = document.createElement("tr");

        [
            item.name,
            item.power + " W",
            item.hours + " hours",
            item.units.toFixed(2) + " kWh",
            money(item.cost)
        ].forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        const actionCell = document.createElement("td");
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", function() {
            appliances = appliances.filter(app => app.id !== item.id);
            saveData();
            displayAppliances();
            updateDashboard();
        });

        actionCell.appendChild(deleteButton);
        row.appendChild(actionCell);
        table.appendChild(row);
    });
}

// =====================================
// DASHBOARD SUMMARY
// =====================================

function updateDashboard() {
    const totalUsage = usageRecords.reduce((sum, item) => sum + item.units, 0);

    const totalApplianceUnits = appliances.reduce((sum, item) => sum + item.units, 0);

    const totalBill = totalUsage * 7;

    if (getElement("totalUsage")) {
        getElement("totalUsage").textContent = totalUsage.toFixed(2) + " kWh";
    }

    if (getElement("estimatedBill")) {
        getElement("estimatedBill").textContent = money(totalBill);
    }

    if (getElement("activeAppliances")) {
        getElement("activeAppliances").textContent = appliances.length;
    }

    if (getElement("totalRecords")) {
        getElement("totalRecords").textContent = usageRecords.length;
    }
}

// =====================================
// CHARTS
// =====================================

function updateCharts() {
    if (typeof Chart === "undefined") return;

    const usageCanvas = getElement("usageChart");

    if (usageCanvas) {
        const monthlyData = {};

        usageRecords.forEach(record => {
            const month = record.date.substring(0, 7);
            monthlyData[month] = (monthlyData[month] || 0) + record.units;
        });

        if (usageChart) usageChart.destroy();

        usageChart = new Chart(usageCanvas, {
            type: "bar",
            data: {
                labels: Object.keys(monthlyData),
                datasets: [{
                    label: "Electricity Usage (kWh)",
                    data: Object.values(monthlyData),
                    backgroundColor: "#8b5cf6",
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true
            }
        });
    }

    const categoryCanvas = getElement("categoryChart");

    if (categoryCanvas) {
        const categoryData = {};

        usageRecords.forEach(record => {
            categoryData[record.category] =
                (categoryData[record.category] || 0) + record.units;
        });

        if (categoryChart) categoryChart.destroy();

        categoryChart = new Chart(categoryCanvas, {
            type: "doughnut",
            data: {
                labels: Object.keys(categoryData),
                datasets: [{
                    data: Object.values(categoryData),
                    backgroundColor: [
                        "#8b5cf6",
                        "#06b6d4",
                        "#f59e0b",
                        "#10b981",
                        "#ec4899"
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true
            }
        });
    }
}

// =====================================
// MONTHLY REPORTS
// =====================================

function displayReports() {
    const table = getElement("monthlyReportBody");
    if (!table) return;

    table.innerHTML = "";

    const monthlyData = {};

    usageRecords.forEach(record => {
        const month = record.date.substring(0, 7);

        monthlyData[month] = (monthlyData[month] || 0) + record.units;
    });

    Object.keys(monthlyData).sort().reverse().forEach(month => {
        const row = document.createElement("tr");

        [month, monthlyData[month].toFixed(2) + " kWh", money(monthlyData[month] * 7)]
            .forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value;
                row.appendChild(cell);
            });

        table.appendChild(row);
    });

    if (Object.keys(monthlyData).length === 0) {
        table.innerHTML = "<tr><td colspan='3'>No reports available.</td></tr>";
    }
}

// =====================================
// CSV EXPORT
// =====================================

function downloadCSV(filename, rows) {
    const csv = rows.map(row =>
        row.map(value =>
            '"' + String(value ?? "").replace(/"/g, '""') + '"'
        ).join(",")
    ).join("\n");

    const blob = new Blob([csv], {
        type: "text/csv;charset=utf-8;"
    });

    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
}

// Export usage records
if (getElement("exportButton")) {
    getElement("exportButton").addEventListener("click", function() {
        const rows = [
            ["Date", "Units", "Category", "Notes"],
            ...usageRecords.map(item => [
                item.date, item.units, item.category, item.notes
            ])
        ];

        downloadCSV("WattWise_Usage_Report.csv", rows);
    });
}

// Export monthly report
if (getElement("reportExportButton")) {
    getElement("reportExportButton").addEventListener("click", function() {
        const rows = [["Month", "Units", "Estimated Bill"]];

        const monthlyData = {};

        usageRecords.forEach(record => {
            const month = record.date.substring(0, 7);
            monthlyData[month] = (monthlyData[month] || 0) + record.units;
        });

        Object.keys(monthlyData).forEach(month => {
            rows.push([
                month,
                monthlyData[month].toFixed(2),
                (monthlyData[month] * 7).toFixed(2)
            ]);
        });

        downloadCSV("WattWise_Monthly_Report.csv", rows);
    });
}

// =====================================
// USAGE ALERTS
// =====================================

const alertForm = getElement("alertForm");

if (alertForm) {
    alertForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const limit = Number(getElement("usageLimit").value);

        if (limit <= 0) {
            alert("Please enter a valid usage limit.");
            return;
        }

        alerts.push({
            id: Date.now(),
            limit: limit
        });

        saveData();
        alertForm.reset();
        displayAlerts();
        checkAlerts();
    });
}

function displayAlerts() {
    const list = getElement("alertList");
    if (!list) return;

    list.innerHTML = "";

    if (alerts.length === 0) {
        list.textContent = "No usage limits set.";
        return;
    }

    alerts.forEach(item => {
        const paragraph = document.createElement("p");
        paragraph.textContent = "Usage alert limit: " + item.limit + " kWh ";

        const button = document.createElement("button");
        button.textContent = "Delete";

        button.addEventListener("click", function() {
            alerts = alerts.filter(alertItem => alertItem.id !== item.id);
            saveData();
            displayAlerts();
        });

        paragraph.appendChild(button);
        list.appendChild(paragraph);
    });
}

function checkAlerts() {
    const totalUsage = usageRecords.reduce((sum, item) => sum + item.units, 0);

    alerts.forEach(item => {
        if (totalUsage >= item.limit) {
            alert("WARNING! Your electricity usage has reached your monthly limit of " + item.limit + " kWh.");
        }
    });
}

// =====================================
// START THE APPLICATION
// =====================================

function startWattWise() {
    displayUsage();
    displayAppliances();
    updateDashboard();
    updateCharts();
    displayReports();
    displayAlerts();
    checkAlerts();

    if (getElement("usageDate")) {
        getElement("usageDate").value =
            new Date().toISOString().split("T")[0];
    }
}

startWattWise();
