/**
 * SmartSpend Reports Client Script
 * Computes and renders financial summary cards and category-wise spending breakdown.
 */

document.addEventListener('DOMContentLoaded', () => {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const mSel = document.getElementById('reportMonth');
  const ySel = document.getElementById('reportYear');
  if (mSel) mSel.value = String(currentMonth);
  if (ySel) ySel.value = String(currentYear);

  loadReport();

  document.getElementById('btnGenerateReport')?.addEventListener('click', loadReport);
});

async function loadReport() {
  const month = document.getElementById('reportMonth').value;
  const year = document.getElementById('reportYear').value;

  try {
    const res = await fetch(`api/reports?month=${month}&year=${year}`);
    if (res.status === 401) {
      window.location.href = 'login.html';
      return;
    }
    const data = await res.json();

    // Summary Cards
    const budgetVal = Number(data.monthlyBudget || 0);
    const expensesVal = Number(data.totalExpenses || 0);
    const remainingVal = Number(data.remainingBudget || 0);
    const countVal = Number(data.expenseCount || 0);

    document.getElementById('repBudget').textContent = '₹' + budgetVal.toLocaleString('en-IN', {minimumFractionDigits: 2});
    document.getElementById('repExpenses').textContent = '₹' + expensesVal.toLocaleString('en-IN', {minimumFractionDigits: 2});

    const remEl = document.getElementById('repRemaining');
    remEl.textContent = '₹' + remainingVal.toLocaleString('en-IN', {minimumFractionDigits: 2});
    remEl.style.color = remainingVal < 0 ? 'var(--danger)' : 'var(--success)';

    document.getElementById('repCount').textContent = countVal;

    // Highest Category & Daily Average
    document.getElementById('repHighestCat').textContent = data.highestCategory || 'None';
    document.getElementById('repHighestAmt').textContent = '₹' + Number(data.highestAmount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2}) + ' spent';

    document.getElementById('repAvgDaily').textContent = '₹' + Number(data.avgDailySpending || 0).toLocaleString('en-IN', {minimumFractionDigits: 2}) + ' / day';
    document.getElementById('repDaysInMonth').textContent = `Calculated across ${data.daysInMonth || 30} days in this month`;

    // Category-wise Breakdown Table
    renderCategoryTable(data.categoryBreakdown || [], expensesVal);

  } catch (err) {
    console.error('Error fetching report data:', err);
  }
}

function renderCategoryTable(breakdown, totalSpent) {
  const tbody = document.getElementById('categoryTableBody');
  if (!tbody) return;

  if (breakdown.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 2rem;">No expense transactions recorded in this period.</td></tr>';
    return;
  }

  tbody.innerHTML = breakdown.map(item => `
    <tr>
      <td><strong>${item.category}</strong></td>
      <td style="font-weight: 700; color: #1e293b;">₹${Number(item.amount).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
      <td><strong>${item.percentage}%</strong></td>
      <td style="min-width: 140px;">
        <div style="background: #e2e8f0; height: 10px; border-radius: 9999px; overflow: hidden;">
          <div style="background: var(--primary); height: 100%; width: ${Math.min(item.percentage, 100)}%;"></div>
        </div>
      </td>
    </tr>
  `).join('');
}
