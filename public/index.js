let reports = [];
let editId = null;

const reportForm = document.getElementById('reportForm');
const reportsBody = document.getElementById('reportsBody');
const submitBtn = document.getElementById('submitBtn');
const searchInput = document.getElementById('searchInput');

async function loadReports() {

    const response = await fetch('/api/reports');

    const data = await response.json();

    reports = data.data;

    render();
}

loadReports();

reportForm.addEventListener('submit', function(event) {
    event.preventDefault(); 

    const formData = {
        title: document.getElementById('title').value.trim(),
        severity: document.getElementById('severity').value,
        description: document.getElementById('description').value.trim(),
        reporter: document.getElementById('reporter').value.trim(),
        status: 'Open'
    };

    if (validateForm(formData)) {
        if (editId) {
            updateItem(editId, formData);
        } else {
            formData.id = Date.now();
            addItem(formData);
        }
        resetForm();
    }
});

reportsBody.addEventListener('click', (e) => {
    const id = Number(e.target.dataset.id);
    if (e.target.classList.contains('delete-btn')) {
        deleteItem(id);
    } else if (e.target.classList.contains('edit-btn')) {
        startEdit(id);
    }
});

searchInput.addEventListener('input', render);

async function addItem(item) {

    await fetch('/api/reports', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(item)
    });

    await loadReports();
}

async function updateItem(id, updatedData) {

    await fetch(`/api/reports/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData)
    });

    editId = null;

    submitBtn.textContent = 'Додати репорт';

    await loadReports();
}   

async function deleteItem(id) {

    await fetch(`/api/reports/${id}`, {
        method: 'DELETE'
    });

    await loadReports();
}

function startEdit(id) {
    const item = reports.find(r => r.id === id);
    if (item) {
        document.getElementById('title').value = item.title;
        document.getElementById('severity').value = item.severity;
        document.getElementById('description').value = item.description;
        document.getElementById('reporter').value = item.reporter;
        
        editId = id;
        submitBtn.textContent = 'Зберегти зміни';
        window.scrollTo(0, 0);
    }
}


function render() {
    const query = searchInput.value.toLowerCase();
    reportsBody.innerHTML = '';

    const filtered = reports.filter(r => r.title.toLowerCase().includes(query));

    filtered.forEach(report => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${report.title}</td>
            <td>${report.severity}</td>
            <td>${report.status}</td>
            <td>${report.reporter}</td>
            <td>
                <button class="edit-btn" data-id="${report.id}">Редагувати</button>
                <button class="delete-btn" data-id="${report.id}">Видалити</button>
            </td>
        `;
        reportsBody.appendChild(row);
    });
}

function resetForm() {
    reportForm.reset();
    clearErrors();
    editId = null;
    submitBtn.textContent = 'Додати репорт';
}

function validateForm(data) {
    let isValid = true;
    clearErrors();
    if (!data.title) { showError('title', 'Назва обов’язкова'); isValid = false; }
    if (!data.severity) { showError('severity', 'Оберіть рівень'); isValid = false; }
    if (!data.reporter) { showError('reporter', 'Вкажіть репортера'); isValid = false; }
    return isValid;
}

function showError(fieldId, message) {
    const input = document.getElementById(fieldId);
    const errorSpan = document.getElementById(fieldId + 'Error');
    input.classList.add('is-invalid');
    errorSpan.textContent = message;
}

function clearErrors() {
    document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    document.querySelectorAll('.error-msg').forEach(el => el.textContent = '');
}
