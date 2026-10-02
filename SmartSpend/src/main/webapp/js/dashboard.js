/**
 * SmartSpend Dashboard Client Script
 * Handles asynchronous data loading, metric calculation, and Chart.js Circular Pie Chart rendering.
 */

let expensePieChartInstance = null;

// Palette for Circular Pie Chart categories
const categoryColors = {
  Food: '#f59e0b',          // Amber
  Transport: '#3b82f6',     // Blue
  Education: '#6366f1',     // Indigo
  Shopping: '#ec4899',      // Pink
  Entertainment: '#8b5cf6', // Purple
  Health: '#10b981',        // Emerald
  Bills: '#ef4444',         // Red
  Travel: '#06b6d4',        // Cyan
  Other: '#64748b'          // Slate
};

const defaultPalette = [
  '#f59e0b', '#3b82f6', '#6366f1', '#ec4899', '#8b5cf6',
  '#10b981', '#ef4444', '#06b6d4', '#64748b', '#84cc16'
];

document.addEventListener('DOMContentLoaded', () => {
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const currentYear = new Date().getFullYear();

  const monthSelect = document.getElementById('selectMonth');
  const yearSelect = document.getElementById('selectYear');

  if (monthSelect) monthSelect.value = String(currentMonth);
  if (yearSelect) yearSelect.value = String(currentYear);

  // Initial load
  loadDashboardData();

  // Event listener for filter button
  const filterBtn = document.getElementById('btnFilterPeriod');
  if (filterBtn) {
    filterBtn.addEventListener('click', () => {
      loadDashboardData();
    });
  }
});

/**
 * Loads dynamic financial statistics and circular pie chart data from Servlet API.
 */
async function loadDashboardData() {
  const month = document.getElementById('selectMonth').value;
  const year = document.getElementById('selectYear').value;

  try {
    const res = await fetch(`api/dashboard?month=${month}&year=${year}`);
    if (res.status === 401) {
      window.location.href = 'login.html';
      return;
    }
    const data = await res.json();

    // User details in topbar
    if (data.userName) {
      document.getElementById('userNameLabel').textContent = data.userName;
      document.getElementById('userInitial').textContent = data.userName.charAt(0).toUpperCase();
      document.getElementById('userEmailLabel').textContent = data.userEmail || 'Active User';
    }

    // 4 Summary Cards
    const budgetVal = Number(data.monthlyBudget || 0);
    const spentVal = Number(data.totalSpent || 0);
    const remainingVal = Number(data.remainingBudget || 0);
    const countVal = Number(data.expenseCount || 0);

    document.getElementById('valBudget').textContent = '₹' + budgetVal.toLocaleString('en-IN', {minimumFractionDigits: 2});
    document.getElementById('valSpent').textContent = '₹' + spentVal.toLocaleString('en-IN', {minimumFractionDigits: 2});
    
    const remElem = document.getElementById('valRemaining');
    remElem.textContent = '₹' + remainingVal.toLocaleString('en-IN', {minimumFractionDigits: 2});
    remElem.style.color = remainingVal < 0 ? 'var(--danger)' : 'var(--success)';
    
    document.getElementById('remainingMeta').textContent = remainingVal < 0 ? 'Budget deficit exceeded' : 'Remaining balance';
    document.getElementById('valCount').textContent = countVal;

    // Budget Status & Progress Bar
    const usage = data.usagePercent || 0;
    const status = data.budgetStatus || 'Normal';
    const fillPercent = Math.min(usage, 100);

    const progressFill = document.getElementById('budgetProgressFill');
    const statusBadge = document.getElementById('budgetStatusBadge');
    const usageText = document.getElementById('usagePercentText');

    progressFill.style.width = fillPercent + '%';
    progressFill.className = 'progress-bar-fill ' + status.toLowerCase();

    if (statusBadge) {
      statusBadge.textContent = status;
      statusBadge.className = 'badge badge-' + status.toLowerCase();
    }

    usageText.textContent = `${usage}% of budget utilized`;

    // Financial Tips Section: Display in 'Warning', 'Critical', or 'Exceeded' state
    const tipsSection = document.getElementById('financialTipsSection');
    if (tipsSection) {
      if (status === 'Warning' || status === 'Critical' || status === 'Exceeded') {
        tipsSection.style.display = 'block';
        const tipBadge = document.getElementById('tipStatusBadge');
        const tipDesc = document.getElementById('tipStatusDesc');
        const tipRem = document.getElementById('tipRemainingVal');
        const tipDaily = document.getElementById('tipDailyText');

        if (tipBadge) {
          tipBadge.textContent = status + ' State (' + usage + '%)';
          tipBadge.className = 'badge badge-' + status.toLowerCase();
        }
        if (tipDesc) {
          tipDesc.textContent = status === 'Exceeded'
            ? 'Emergency alert: You have exceeded 100% of your budget. Total freeze on all discretionary spending is required.'
            : status === 'Critical'
            ? 'Urgent advisory: You have exceeded 90% of your allocated monthly spending ceiling.'
            : 'Budget warning: You have consumed over 75% of your planned monthly expenditure.';
        }
        if (tipRem) {
          tipRem.textContent = '₹' + remainingVal.toLocaleString('en-IN', {minimumFractionDigits: 2});
        }
        if (tipDaily) {
          const daysLeft = 10;
          const safeDaily = remainingVal > 0 ? Math.floor(remainingVal / daysLeft) : 0;
          tipDaily.textContent = remainingVal <= 0 
            ? 'Budget exhausted (Deficit: ₹' + Math.abs(remainingVal).toLocaleString('en-IN') + '). Restrict spending strictly to zero discretionary purchases.'
            : `Restrict total purchases to no more than ₹${safeDaily.toLocaleString('en-IN')}/day to avoid exceeding your budget.`;
        }
      } else {
        tipsSection.style.display = 'none';
      }
    }

    // Render Circular Pie Chart with Chart.js
    renderCircularPieChart(data.categoryDistribution || {});

    // Render Recent Expenses Table
    renderRecentExpenses(data.recentExpenses || []);

  } catch (err) {
    console.error('Error fetching dashboard data:', err);
  }
}

/**
 * Initializes or updates the Chart.js circular pie chart.
 * Uses exact query data from MySQL.
 */
function renderCircularPieChart(distribution) {
  const canvas = document.getElementById('expensePieChart');
  const noDataMsg = document.getElementById('noChartDataMsg');
  if (!canvas) return;

  const categories = Object.keys(distribution);
  const values = Object.values(distribution).map(v => Number(v));

  if (categories.length === 0 || values.every(v => v === 0)) {
    canvas.style.display = 'none';
    noDataMsg.style.display = 'block';
    if (expensePieChartInstance) {
      expensePieChartInstance.destroy();
      expensePieChartInstance = null;
    }
    return;
  }

  canvas.style.display = 'block';
  noDataMsg.style.display = 'none';

  const backgroundColors = categories.map((cat, idx) => {
    return categoryColors[cat] || defaultPalette[idx % defaultPalette.length];
  });

  if (expensePieChartInstance) {
    expensePieChartInstance.destroy();
  }

  const ctx = canvas.getContext('2d');
  expensePieChartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: categories,
      datasets: [{
        label: 'Spent (₹)',
        data: values,
        backgroundColor: backgroundColors,
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 14,
            padding: 14,
            font: {
              size: 12,
              family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const val = context.raw || 0;
              const total = values.reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
              return ` ${label}: ₹${Number(val).toLocaleString('en-IN')} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

/**
 * Renders the recent transactions table.
 */
function renderRecentExpenses(expenses) {
  const tbody = document.getElementById('recentExpensesTableBody');
  if (!tbody) return;

  if (expenses.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No recent expenses found for this user.</td></tr>';
    return;
  }

  tbody.innerHTML = expenses.map(e => `
    <tr>
      <td>${e.expenseDate}</td>
      <td><span class="badge" style="background:#e0e7ff; color:#3730a3;">${e.categoryName}</span></td>
      <td>${escapeHtml(e.description)}</td>
      <td style="font-weight: 700; color: #1e293b;">₹${Number(e.amount).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
    </tr>
  `).join('');
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
