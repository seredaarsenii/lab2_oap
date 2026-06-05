let reports = [];
let editId = null;

const reportForm = document.getElementById('reportForm');
const reportsBody = document.getElementById('reportsBody');
const submitBtn = document.getElementById('submitBtn');
const cancelBtn = document.getElementById('cancelBtn');
const searchInput = document.getElementById('searchInput');
const formTitle = document.getElementById('formTitle');
const formMessage = document.getElementById('formMessage');

loadReports();

reportForm.addEventListener('submit', async event => {
    event.preventDefault();

    const formData = readForm();

    if (!validateForm(formData)) return;

    if (editId) {
        await updateItem(editId, formData);
    } else {
        await addItem(formData);
    }
});

cancelBtn.addEventListener('click', resetForm);
searchInput.addEventListener('input', render);

reportsBody.addEventListener('click', event => {
    const button = event.target.closest('button[data-id]');
    if (!button) return;

    const id = button.dataset.id;

    if (button.classList.contains('delete-btn')) {
        deleteItem(id);
    }

    if (button.classList.contains('edit-btn')) {
        startEdit(id);
    }
});

async function loadReports() {
    try {
        const data = await request('/api/reports');
        reports = data.items;
        render();
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

async function addItem(item) {
    try {
        await request('/api/reports', {
            method: 'POST',
            body: JSON.stringify(item)
        });

        showMessage('Репорт успішно додано.', 'success');
        resetForm();
        await loadReports();
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

async function updateItem(id, updatedData) {
    try {
        await request(`/api/reports/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updatedData)
        });

        showMessage('Зміни збережено.', 'success');
        resetForm();
        await loadReports();
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

async function deleteItem(id) {
    try {
        await request(`/api/reports/${id}`, { method: 'DELETE' });
        await loadReports();
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

function startEdit(id) {
    const item = reports.find(report => report.id === id);
    if (!item) return;

    document.getElementById('title').value = item.title;
    document.getElementById('severity').value = item.severity;
    document.getElementById('status').value = item.status;
    document.getElementById('description').value = item.description;
    document.getElementById('reporter').value = item.reporter;

    editId = id;
    formTitle.textContent = 'Редагувати репорт';
    submitBtn.textContent = 'Зберегти зміни';
    cancelBtn.hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function render() {
    const query = searchInput.value.trim().toLowerCase();
    reportsBody.innerHTML = '';

    const filtered = reports.filter(report => report.title.toLowerCase().includes(query));

    if (filtered.length === 0) {
        reportsBody.innerHTML = '<tr><td colspan="5" class="empty-row">Репортів не знайдено</td></tr>';
        return;
    }

    filtered.forEach(report => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${escapeHtml(report.title)}</td>
            <td><span class="badge severity-${report.severity.toLowerCase()}">${report.severity}</span></td>
            <td>${report.status}</td>
            <td>${escapeHtml(report.reporter)}</td>
            <td class="actions">
                <button class="edit-btn" data-id="${report.id}">Редагувати</button>
                <button class="delete-btn" data-id="${report.id}">Видалити</button>
            </td>
        `;
        reportsBody.appendChild(row);
    });
}

function readForm() {
    return {
        title: document.getElementById('title').value.trim(),
        severity: document.getElementById('severity').value,
        status: document.getElementById('status').value,
        description: document.getElementById('description').value.trim(),
        reporter: document.getElementById('reporter').value.trim()
    };
}

function resetForm() {
    reportForm.reset();
    document.getElementById('status').value = 'Open';
    clearErrors();
    editId = null;
    formTitle.textContent = 'Додати репорт';
    submitBtn.textContent = 'Додати репорт';
    cancelBtn.hidden = true;
}

function validateForm(data) {
    let isValid = true;
    clearErrors();

    if (data.title.length < 3) {
        showError('title', 'Мінімум 3 символи');
        isValid = false;
    }

    if (!data.severity) {
        showError('severity', 'Оберіть важливість');
        isValid = false;
    }

    if (!data.status) {
        showError('status', 'Оберіть статус');
        isValid = false;
    }

    if (data.description.length < 3) {
        showError('description', 'Мінімум 3 символи');
        isValid = false;
    }

    if (data.reporter.length < 2) {
        showError('reporter', 'Мінімум 2 символи');
        isValid = false;
    }

    return isValid;
}

async function request(url, options = {}) {
    const response = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    });

    if (response.status === 204) return null;

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Помилка запиту');
    }

    return data;
}

function showError(fieldId, message) {
    const input = document.getElementById(fieldId);
    const errorSpan = document.getElementById(`${fieldId}Error`);
    input.classList.add('is-invalid');
    errorSpan.textContent = message;
}

function clearErrors() {
    formMessage.textContent = '';
    formMessage.className = 'form-message';
    document.querySelectorAll('.is-invalid').forEach(element => element.classList.remove('is-invalid'));
    document.querySelectorAll('.error-msg').forEach(element => {
        element.textContent = '';
    });
}

function showMessage(message, type) {
    formMessage.textContent = message;
    formMessage.className = `form-message ${type}`;
}

function escapeHtml(value) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}
