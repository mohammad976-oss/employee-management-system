// ===========================================================
// Employee Management System — frontend app logic
// Vanilla JS, no build step. Talks to the Spring Boot API via api.js
// ===========================================================

const state = {
  departments: [],
  employees: [],
  attendance: [],
  payroll: [],
  editingEmployeeId: null,
  editingDepartmentId: null,
};

const MONTH_NAMES = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

// ---------- Toast ----------
function toast(message, isError = false) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.className = isError ? 'show error' : 'show';
  setTimeout(() => { el.className = ''; }, 3200);
}

// ---------- Navigation ----------
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(`view-${name}`).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.view === name));
  if (name === 'dashboard') renderDashboard();
}

// ---------- Bootstrapping ----------
async function loadAll() {
  try {
    const [departments, employees, attendance, payroll] = await Promise.all([
      api.getDepartments(), api.getEmployees(), api.getAttendance(), api.getPayroll(),
    ]);
    state.departments = departments;
    state.employees = employees;
    state.attendance = attendance;
    state.payroll = payroll;
    document.getElementById('conn-banner').classList.remove('show');
    renderAll();
  } catch (err) {
    document.getElementById('conn-banner').classList.add('show');
    console.error(err);
  }
}

function renderAll() {
  renderDashboard();
  renderDepartments();
  renderEmployees();
  populateEmployeeSelects();
  populateDepartmentSelect();
  renderAttendance();
  renderPayrollTable();
}

// ---------- Dashboard ----------
function renderDashboard() {
  const activeEmployees = state.employees.filter(e => e.status === 'ACTIVE').length;
  document.getElementById('stat-employees').textContent = activeEmployees;
  document.getElementById('stat-departments').textContent = state.departments.length;

  const today = new Date().toISOString().slice(0, 10);
  const presentToday = state.attendance.filter(a => a.attendanceDate === today && a.status === 'PRESENT').length;
  document.getElementById('stat-present-today').textContent = presentToday;

  const totalNet = state.payroll.reduce((sum, p) => sum + Number(p.netSalary || 0), 0);
  document.getElementById('stat-payroll-total').textContent = formatCurrency(totalNet);

  const tbody = document.getElementById('recent-payroll-body');
  const recent = [...state.payroll].sort((a, b) => b.id - a.id).slice(0, 5);
  tbody.innerHTML = recent.length ? recent.map(p => `
    <tr>
      <td>${employeeName(p.employee)}</td>
      <td>${MONTH_NAMES[p.payMonth]} ${p.payYear}</td>
      <td class="figure">${formatCurrency(p.grossSalary)}</td>
      <td class="figure">${formatCurrency(p.totalDeductions)}</td>
      <td class="figure" style="color:var(--present); font-weight:600;">${formatCurrency(p.netSalary)}</td>
    </tr>
  `).join('') : emptyRow(5, 'No payroll generated yet');
}

// ---------- Departments ----------
function renderDepartments() {
  const tbody = document.getElementById('departments-body');
  if (!state.departments.length) {
    tbody.innerHTML = emptyRow(5, 'No departments yet — add one above');
    return;
  }
  tbody.innerHTML = state.departments.map(d => {
    const count = state.employees.filter(e => e.department && e.department.id === d.id).length;
    return `
      <tr>
        <td><strong>${escapeHtml(d.name)}</strong></td>
        <td>${escapeHtml(d.headOfDepartment || '—')}</td>
        <td>${escapeHtml(d.location || '—')}</td>
        <td>${count}</td>
        <td class="row-actions">
          <button class="btn btn-ghost btn-sm" onclick="editDepartment(${d.id})">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="removeDepartment(${d.id})">Delete</button>
        </td>
      </tr>`;
  }).join('');
}

function populateDepartmentSelect() {
  const select = document.getElementById('emp-department');
  select.innerHTML = '<option value="">— No department —</option>' +
    state.departments.map(d => `<option value="${d.id}">${escapeHtml(d.name)}</option>`).join('');
}

document.getElementById('department-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    name: document.getElementById('dept-name').value.trim(),
    headOfDepartment: document.getElementById('dept-head').value.trim(),
    location: document.getElementById('dept-location').value.trim(),
    description: document.getElementById('dept-description').value.trim(),
  };
  try {
    if (state.editingDepartmentId) {
      await api.updateDepartment(state.editingDepartmentId, payload);
      toast('Department updated');
    } else {
      await api.createDepartment(payload);
      toast('Department added');
    }
    resetDepartmentForm();
    await loadAll();
  } catch (err) {
    toast(err.message, true);
  }
});

function editDepartment(id) {
  const d = state.departments.find(x => x.id === id);
  if (!d) return;
  state.editingDepartmentId = id;
  document.getElementById('dept-name').value = d.name || '';
  document.getElementById('dept-head').value = d.headOfDepartment || '';
  document.getElementById('dept-location').value = d.location || '';
  document.getElementById('dept-description').value = d.description || '';
  document.getElementById('department-form-title').textContent = 'Edit department';
  document.getElementById('dept-submit-btn').textContent = 'Save changes';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetDepartmentForm() {
  state.editingDepartmentId = null;
  document.getElementById('department-form').reset();
  document.getElementById('department-form-title').textContent = 'Add a department';
  document.getElementById('dept-submit-btn').textContent = 'Add department';
}

async function removeDepartment(id) {
  if (!confirm('Delete this department? Employees in it will become unassigned.')) return;
  try {
    await api.deleteDepartment(id);
    toast('Department deleted');
    await loadAll();
  } catch (err) {
    toast(err.message, true);
  }
}

// ---------- Employees ----------
function renderEmployees() {
  const tbody = document.getElementById('employees-body');
  if (!state.employees.length) {
    tbody.innerHTML = emptyRow(7, 'No employees yet — add one above');
    return;
  }
  tbody.innerHTML = state.employees.map(e => `
    <tr>
      <td class="mono">${escapeHtml(e.employeeCode)}</td>
      <td><strong>${escapeHtml(e.firstName)} ${escapeHtml(e.lastName)}</strong><div style="color:var(--text-mute); font-size:12px;">${escapeHtml(e.email)}</div></td>
      <td>${escapeHtml(e.department ? e.department.name : '—')}</td>
      <td>${escapeHtml(e.designation || '—')}</td>
      <td class="figure">${formatCurrency(e.basicSalary)}</td>
      <td><span class="badge ${e.status === 'ACTIVE' ? 'present' : 'neutral'}">${escapeHtml(e.status)}</span></td>
      <td class="row-actions">
        <button class="btn btn-ghost btn-sm" onclick="editEmployee(${e.id})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="removeEmployee(${e.id})">Delete</button>
      </td>
    </tr>
  `).join('');
}

function populateEmployeeSelects() {
  const options = '<option value="">Select employee…</option>' +
    state.employees.map(e => `<option value="${e.id}">${escapeHtml(e.employeeCode)} — ${escapeHtml(e.firstName)} ${escapeHtml(e.lastName)}</option>`).join('');
  document.getElementById('att-employee').innerHTML = options;
  document.getElementById('pay-employee').innerHTML = options;
}

document.getElementById('employee-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const deptId = document.getElementById('emp-department').value;
  const payload = {
    firstName: document.getElementById('emp-first-name').value.trim(),
    lastName: document.getElementById('emp-last-name').value.trim(),
    email: document.getElementById('emp-email').value.trim(),
    phone: document.getElementById('emp-phone').value.trim(),
    dateOfBirth: document.getElementById('emp-dob').value || null,
    gender: document.getElementById('emp-gender').value,
    address: document.getElementById('emp-address').value.trim(),
    dateOfJoining: document.getElementById('emp-doj').value || null,
    designation: document.getElementById('emp-designation').value.trim(),
    department: deptId ? { id: Number(deptId) } : null,
    basicSalary: Number(document.getElementById('emp-salary').value),
    hourlyRate: document.getElementById('emp-hourly-rate').value ? Number(document.getElementById('emp-hourly-rate').value) : null,
    status: document.getElementById('emp-status').value,
  };
  try {
    if (state.editingEmployeeId) {
      await api.updateEmployee(state.editingEmployeeId, payload);
      toast('Employee updated');
    } else {
      await api.createEmployee(payload);
      toast('Employee added');
    }
    resetEmployeeForm();
    await loadAll();
  } catch (err) {
    toast(err.message, true);
  }
});

function editEmployee(id) {
  const emp = state.employees.find(x => x.id === id);
  if (!emp) return;
  state.editingEmployeeId = id;
  document.getElementById('emp-first-name').value = emp.firstName || '';
  document.getElementById('emp-last-name').value = emp.lastName || '';
  document.getElementById('emp-email').value = emp.email || '';
  document.getElementById('emp-phone').value = emp.phone || '';
  document.getElementById('emp-dob').value = emp.dateOfBirth || '';
  document.getElementById('emp-gender').value = emp.gender || '';
  document.getElementById('emp-address').value = emp.address || '';
  document.getElementById('emp-doj').value = emp.dateOfJoining || '';
  document.getElementById('emp-designation').value = emp.designation || '';
  document.getElementById('emp-department').value = emp.department ? emp.department.id : '';
  document.getElementById('emp-salary').value = emp.basicSalary || '';
  document.getElementById('emp-hourly-rate').value = emp.hourlyRate || '';
  document.getElementById('emp-status').value = emp.status || 'ACTIVE';
  document.getElementById('employee-form-title').textContent = `Edit ${emp.firstName} ${emp.lastName}`;
  document.getElementById('emp-submit-btn').textContent = 'Save changes';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetEmployeeForm() {
  state.editingEmployeeId = null;
  document.getElementById('employee-form').reset();
  document.getElementById('employee-form-title').textContent = 'Add an employee';
  document.getElementById('emp-submit-btn').textContent = 'Add employee';
}

async function removeEmployee(id) {
  if (!confirm('Delete this employee? Their attendance and payroll history will also be removed.')) return;
  try {
    await api.deleteEmployee(id);
    toast('Employee deleted');
    await loadAll();
  } catch (err) {
    toast(err.message, true);
  }
}

// ---------- Attendance ----------
function renderAttendance() {
  const tbody = document.getElementById('attendance-body');
  const sorted = [...state.attendance].sort((a, b) => b.attendanceDate.localeCompare(a.attendanceDate));
  if (!sorted.length) {
    tbody.innerHTML = emptyRow(6, 'No attendance marked yet');
    return;
  }
  tbody.innerHTML = sorted.map(a => `
    <tr>
      <td>${a.attendanceDate}</td>
      <td>${employeeName(a.employee)}</td>
      <td>${statusBadge(a.status)}</td>
      <td class="figure">${a.hoursWorked ?? 0}</td>
      <td class="figure">${a.overtimeHours ?? 0}</td>
      <td class="row-actions">
        <button class="btn btn-danger btn-sm" onclick="removeAttendance(${a.id})">Delete</button>
      </td>
    </tr>
  `).join('');
}

document.getElementById('attendance-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    employeeId: Number(document.getElementById('att-employee').value),
    attendanceDate: document.getElementById('att-date').value,
    status: document.getElementById('att-status').value,
    hoursWorked: Number(document.getElementById('att-hours').value || 0),
    overtimeHours: Number(document.getElementById('att-overtime').value || 0),
    remarks: document.getElementById('att-remarks').value.trim(),
  };
  if (!payload.employeeId || !payload.attendanceDate) {
    toast('Choose an employee and date', true);
    return;
  }
  try {
    await api.markAttendance(payload);
    toast('Attendance saved');
    document.getElementById('attendance-form').reset();
    await loadAll();
  } catch (err) {
    toast(err.message, true);
  }
});

async function removeAttendance(id) {
  if (!confirm('Delete this attendance record?')) return;
  try {
    await api.deleteAttendance(id);
    toast('Attendance record deleted');
    await loadAll();
  } catch (err) {
    toast(err.message, true);
  }
}

// ---------- Payroll ----------
function renderPayrollTable() {
  const tbody = document.getElementById('payroll-body');
  const sorted = [...state.payroll].sort((a, b) => b.id - a.id);
  if (!sorted.length) {
    tbody.innerHTML = emptyRow(7, 'No payslips generated yet — use the form above');
    return;
  }
  tbody.innerHTML = sorted.map(p => `
    <tr>
      <td>${employeeName(p.employee)}</td>
      <td>${MONTH_NAMES[p.payMonth]} ${p.payYear}</td>
      <td class="figure">${p.daysPresent} present / ${p.daysAbsent} absent</td>
      <td class="figure">${p.overtimeHours ?? 0} hrs</td>
      <td class="figure">${formatCurrency(p.grossSalary)}</td>
      <td class="figure" style="color:var(--absent);">-${formatCurrency(p.totalDeductions)}</td>
      <td class="figure" style="font-weight:600; color:var(--present);">${formatCurrency(p.netSalary)}</td>
      <td class="row-actions">
        <button class="btn btn-ghost btn-sm" onclick='showPayslip(${p.id})'>View payslip</button>
        <button class="btn btn-danger btn-sm" onclick="removePayroll(${p.id})">Delete</button>
      </td>
    </tr>
  `).join('');
}

document.getElementById('payroll-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    employeeId: Number(document.getElementById('pay-employee').value),
    payMonth: Number(document.getElementById('pay-month').value),
    payYear: Number(document.getElementById('pay-year').value),
    otherDeduction: Number(document.getElementById('pay-other-deduction').value || 0),
    taxRate: document.getElementById('pay-tax-rate').value ? Number(document.getElementById('pay-tax-rate').value) / 100 : null,
  };
  if (!payload.employeeId || !payload.payMonth || !payload.payYear) {
    toast('Choose an employee, month, and year', true);
    return;
  }
  try {
    const result = await api.generatePayroll(payload);
    toast('Payslip generated');
    await loadAll();
    showPayslip(result.id);
  } catch (err) {
    toast(err.message, true);
  }
});

function showPayslip(id) {
  const p = state.payroll.find(x => x.id === id) || {};
  const container = document.getElementById('payslip-container');
  container.innerHTML = `
    <div class="payslip">
      <div class="payslip-top">
        <div class="who">
          <div class="name">${employeeName(p.employee)}</div>
          <div class="role">${escapeHtml(p.employee?.designation || '')} ${p.employee?.department ? '· ' + escapeHtml(p.employee.department.name) : ''}</div>
        </div>
        <div class="period">${MONTH_NAMES[p.payMonth]} ${p.payYear}<br>${p.employee?.employeeCode || ''}</div>
      </div>
      <div class="payslip-line"><span>Days present</span><span>${p.daysPresent}</span></div>
      <div class="payslip-line"><span>Days absent</span><span>${p.daysAbsent}</span></div>
      <div class="payslip-line credit"><span>Basic pay (pro-rated)</span><span>${formatCurrency(p.basicSalary)}</span></div>
      <div class="payslip-line credit"><span>Overtime pay (${p.overtimeHours ?? 0} hrs)</span><span>${formatCurrency(p.overtimePay)}</span></div>
      <div class="payslip-line"><span>Gross salary</span><span>${formatCurrency(p.grossSalary)}</span></div>
      <div class="payslip-line deduction"><span>Tax deduction</span><span>-${formatCurrency(p.taxDeduction)}</span></div>
      <div class="payslip-line deduction"><span>Other deductions</span><span>-${formatCurrency(p.otherDeduction)}</span></div>
      <div class="payslip-net">
        <span class="label">Net pay</span>
        <span class="amount">${formatCurrency(p.netSalary)}</span>
      </div>
      <div class="payslip-torn"></div>
    </div>
  `;
  container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function removePayroll(id) {
  if (!confirm('Delete this payslip?')) return;
  try {
    await api.deletePayroll(id);
    toast('Payslip deleted');
    document.getElementById('payslip-container').innerHTML = '';
    await loadAll();
  } catch (err) {
    toast(err.message, true);
  }
}

// ---------- Helpers ----------
function employeeName(emp) {
  if (!emp) return '—';
  const full = state.employees.find(e => e.id === emp.id) || emp;
  return `${escapeHtml(full.firstName || '')} ${escapeHtml(full.lastName || '')}`.trim() || '—';
}

function statusBadge(status) {
  const map = { PRESENT: 'present', HALF_DAY: 'overtime', ABSENT: 'absent', LEAVE: 'absent', HOLIDAY: 'neutral' };
  const cls = map[status] || 'neutral';
  return `<span class="badge ${cls}">${status.replace('_', ' ')}</span>`;
}

function formatCurrency(value) {
  const n = Number(value || 0);
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function emptyRow(colspan, message) {
  return `<tr><td colspan="${colspan}"><div class="empty-state"><div class="glyph">— — —</div>${message}</div></td></tr>`;
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

// ---------- Init ----------
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => showView(btn.dataset.view));
});

document.getElementById('dept-cancel-btn').addEventListener('click', resetDepartmentForm);
document.getElementById('emp-cancel-btn').addEventListener('click', resetEmployeeForm);

// Default the attendance/payroll date fields to today/this month
document.getElementById('att-date').value = new Date().toISOString().slice(0, 10);
document.getElementById('pay-month').value = new Date().getMonth() + 1;
document.getElementById('pay-year').value = new Date().getFullYear();

loadAll();
