/**
 * SmartSpend Expenses Client Script
 * Handles expense CRUD, search, multi-criteria filtering, and deletion confirmation.
 */

let allCategories = [];

document.addEventListener('DOMContentLoaded', () => {
  loadCategories();
  loadExpenses();

  const filterForm = document.getElementById('filterForm');
  if (filterForm) {
    filterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      loadExpenses();
    });
  }

  const resetBtn = document.getElementById('btnResetFilters');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      filterForm.reset();
      loadExpenses();
    });
  }

  // Edit modal close handlers
  document.getElementById('closeEditModal')?.addEventListener('click', closeEditModal);
  document.getElementById('cancelEdit')?.addEventListener('click', closeEditModal);
  document.getElementById('editExpenseForm')?.addEventListener('submit', handleEditSubmit);
});

/**
 * Loads categories for filter dropdowns.
 */
async function loadCategories() {
  try {
    const res = await fetch('api/categories');
    allCategories = await res.json();

    const filterSelect = document.getElementById('categoryFilter');
    const editSelect = document.getElementById('editCategory');

    if (filterSelect) {
      filterSelect.innerHTML = '<option value="">All Categories</option>';
      allCategories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.categoryId;
        opt.textContent = cat.categoryName;
        filterSelect.appendChild(opt);
      });
    }

    if (editSelect) {
      editSelect.innerHTML = '';
      allCategories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.categoryId;
        opt.textContent = cat.categoryName;
        editSelect.appendChild(opt);
      });
    }
  } catch (err) {
    console.error('Error fetching categories:', err);
  }
}

/**
 * Loads expenses from server using current filters.
 */
async function loadExpenses() {
  const search = document.getElementById('searchInput')?.value || '';
  const categoryId = document.getElementById('categoryFilter')?.value || '';
  const month = document.getElementById('monthFilter')?.value || '';
  const year = document.getElementById('yearFilter')?.value || '';
  const date = document.getElementById('dateFilter')?.value || '';

  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (categoryId) params.append('categoryId', categoryId);
  if (month) params.append('month', month);
  if (year) params.append('year', year);
  if (date) params.append('date', date);

  try {
    const res = await fetch(`api/expenses?${params.toString()}`);
    if (res.status === 401) {
      window.location.href = 'login.html';
      return;
    }
    const expenses = await res.json();
    renderExpenseTable(expenses);
  } catch (err) {
    console.error('Error fetching expenses:', err);
  }
}

/**
 * Renders the expense table rows.
 */
function renderExpenseTable(expenses) {
  const tbody = document.getElementById('expenseTableBody');
  const countBadge = document.getElementById('expenseCountBadge');
  if (!tbody) return;

  countBadge.textContent = `${expenses.length} records`;

  if (expenses.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">No matching expenses found.</td></tr>';
    return;
  }

  tbody.innerHTML = expenses.map(e => `
    <tr>
      <td>${e.expenseDate}</td>
      <td><span class="badge" style="background:#e0e7ff; color:#3730a3;">${e.categoryName}</span></td>
      <td>${escapeHtml(e.description)}</td>
      <td style="font-weight: 700; color: #1e293b;">₹${Number(e.amount).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
      <td style="text-align: right; white-space: nowrap;">
        <button class="btn btn-secondary" style="padding: 0.35rem 0.65rem; font-size: 0.8rem; margin-right: 0.4rem;" onclick="openEditModal(${e.expenseId})">
          ✏️ Edit
        </button>
        <button class="btn btn-danger" style="padding: 0.35rem 0.65rem; font-size: 0.8rem;" onclick="confirmDelete(${e.expenseId})">
          🗑️ Delete
        </button>
      </td>
    </tr>
  `).join('');
}

/**
 * Handles expense deletion with required confirmation prompt.
 */
async function confirmDelete(expenseId) {
  const confirmed = confirm("Are you sure you want to delete this expense?");
  if (!confirmed) return;

  const alertBox = document.getElementById('statusAlert');
  const params = new URLSearchParams();
  params.append('action', 'delete');
  params.append('expenseId', expenseId);

  try {
    const res = await fetch('api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    const data = await res.json();
    if (data.success) {
      alertBox.className = 'alert alert-success';
      alertBox.textContent = 'Expense deleted successfully.';
      alertBox.style.display = 'block';
      loadExpenses();
      setTimeout(() => { alertBox.style.display = 'none'; }, 3000);
    } else {
      alertBox.className = 'alert alert-danger';
      alertBox.textContent = data.error || 'Failed to delete expense.';
      alertBox.style.display = 'block';
    }
  } catch (err) {
    alertBox.className = 'alert alert-danger';
    alertBox.textContent = 'Network error while attempting deletion.';
    alertBox.style.display = 'block';
  }
}

/**
 * Opens modal populated with selected expense details.
 */
async function openEditModal(expenseId) {
  try {
    const res = await fetch(`api/expenses?id=${expenseId}`);
    const exp = await res.json();
    if (exp) {
      document.getElementById('editExpenseId').value = exp.expenseId;
      document.getElementById('editAmount').value = exp.amount;
      document.getElementById('editCategory').value = exp.categoryId;
      document.getElementById('editDescription').value = exp.description;
      document.getElementById('editDate').value = exp.expenseDate;

      const modal = document.getElementById('editModal');
      modal.style.display = 'flex';
    }
  } catch (err) {
    console.error('Error fetching expense for edit:', err);
  }
}

function closeEditModal() {
  const modal = document.getElementById('editModal');
  if (modal) modal.style.display = 'none';
}

/**
 * Saves edited expense.
 */
async function handleEditSubmit(e) {
  e.preventDefault();
  const alertBox = document.getElementById('statusAlert');

  const expenseId = document.getElementById('editExpenseId').value;
  const amount = document.getElementById('editAmount').value;
  const categoryId = document.getElementById('editCategory').value;
  const description = document.getElementById('editDescription').value;
  const expenseDate = document.getElementById('editDate').value;

  if (parseFloat(amount) <= 0) {
    alert("Amount must be greater than 0");
    return;
  }

  const params = new URLSearchParams();
  params.append('action', 'edit');
  params.append('expenseId', expenseId);
  params.append('amount', amount);
  params.append('categoryId', categoryId);
  params.append('description', description);
  params.append('expenseDate', expenseDate);

  try {
    const res = await fetch('api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    const data = await res.json();
    if (data.success) {
      closeEditModal();
      alertBox.className = 'alert alert-success';
      alertBox.textContent = 'Expense updated successfully.';
      alertBox.style.display = 'block';
      loadExpenses();
      setTimeout(() => { alertBox.style.display = 'none'; }, 3000);
    } else {
      alert(data.error || 'Failed to update expense');
    }
  } catch (err) {
    alert('Network error while updating expense.');
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
