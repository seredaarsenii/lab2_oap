import { ApiError, authApi, referenceApi, reportApi } from './apiClient';
import type {
  Category,
  CreateReportDto,
  Report,
  ReportStatus,
  Severity,
  UpdateReportDto,
  User
} from './types';

const reportForm = getElement<HTMLFormElement>('reportForm');
const reportsBody = getElement<HTMLTableSectionElement>('reportsBody');
const submitBtn = getElement<HTMLButtonElement>('submitBtn');
const reloadBtn = getElement<HTMLButtonElement>('reloadBtn');
const cancelEditBtn = getElement<HTMLButtonElement>('cancelEditBtn');
const searchInput = getElement<HTMLInputElement>('searchInput');
const formTitle = getElement<HTMLHeadingElement>('formTitle');
const statusField = getElement<HTMLDivElement>('statusField');
const listState = getElement<HTMLDivElement>('listState');
const tableWrapper = getElement<HTMLDivElement>('tableWrapper');
const formNotice = getElement<HTMLDivElement>('formNotice');
const detailsDialog = getElement<HTMLDialogElement>('detailsDialog');
const detailsContent = getElement<HTMLDivElement>('detailsContent');
const closeDialogBtn = getElement<HTMLButtonElement>('closeDialogBtn');
const authSection = getElement<HTMLElement>('authSection');
const authForm = getElement<HTMLFormElement>('authForm');
const authNotice = getElement<HTMLDivElement>('authNotice');
const emailInput = getElement<HTMLInputElement>('loginEmail');
const passwordInput = getElement<HTMLInputElement>('loginPassword');
const appShell = getElement<HTMLElement>('appShell');
const logoutBtn = getElement<HTMLButtonElement>('logoutBtn');
const currentUserLabel = getElement<HTMLSpanElement>('currentUserLabel');

const userSelect = getElement<HTMLSelectElement>('userId');
const categorySelect = getElement<HTMLSelectElement>('categoryId');
const titleInput = getElement<HTMLInputElement>('title');
const severitySelect = getElement<HTMLSelectElement>('severity');
const statusSelect = getElement<HTMLSelectElement>('status');
const reporterInput = getElement<HTMLInputElement>('reporter');
const descriptionInput = getElement<HTMLTextAreaElement>('description');

let reports: Report[] = [];
let users: User[] = [];
let categories: Category[] = [];
let editId: number | null = null;
let currentUser: User | null = authApi.getSessionUser();

authForm.addEventListener('submit', handleLogin);
logoutBtn.addEventListener('click', logout);
reportForm.addEventListener('submit', handleSubmit);
reportsBody.addEventListener('click', handleTableClick);
reloadBtn.addEventListener('click', () => void loadInitialData());
cancelEditBtn.addEventListener('click', () => resetForm());
searchInput.addEventListener('input', renderReports);
closeDialogBtn.addEventListener('click', () => detailsDialog.close());
detailsDialog.addEventListener('click', (event) => {
  if (event.target === detailsDialog) {
    detailsDialog.close();
  }
});

if (currentUser) {
  showApplication(currentUser);
  void loadInitialData();
}

async function handleLogin(event: SubmitEvent): Promise<void> {
  event.preventDefault();
  authNotice.className = 'notice hidden';

  try {
    const response = await authApi.login(emailInput.value.trim(), passwordInput.value);
    currentUser = response.user;
    showApplication(response.user);
    await loadInitialData();
  } catch (error) {
    authNotice.className = 'notice error';
    authNotice.textContent = getErrorMessage(error);
  }
}

function logout(): void {
  authApi.logout();
  currentUser = null;
  reports = [];
  users = [];
  categories = [];
  appShell.classList.add('hidden');
  authSection.classList.remove('hidden');
  passwordInput.value = '';
}

function showApplication(user: User): void {
  currentUserLabel.textContent = `${user.username} (${user.email})`;
  authSection.classList.add('hidden');
  appShell.classList.remove('hidden');
}

async function loadInitialData(): Promise<void> {
  setListState('loading', 'Завантаження звітів...');
  setReloadBusy(true);

  try {
    const [reportResponse, categoryResponse] = await Promise.all([
      reportApi.getList(),
      referenceApi.getCategories()
    ]);

    reports = reportResponse.data;
    users = currentUser ? [currentUser] : [];
    categories = categoryResponse.data;
    renderReferenceOptions();
    renderReports();
  } catch (error) {
    reports = [];
    tableWrapper.classList.add('hidden');
    setListState('error', getErrorMessage(error), true);
  } finally {
    setReloadBusy(false);
  }
}

async function handleSubmit(event: SubmitEvent): Promise<void> {
  event.preventDefault();
  clearFieldErrors();
  hideFormNotice();

  const data = readForm();
  if (!validateForm(data)) {
    showFormNotice('error', 'Перевірте позначені поля.');
    return;
  }

  setFormBusy(true);

  try {
    if (editId === null) {
      await reportApi.create(toCreateDto(data));
      showFormNotice('success', 'Звіт успішно створено.');
    } else {
      await reportApi.update(editId, toUpdateDto(data));
      showFormNotice('success', 'Зміни успішно збережено.');
    }

    resetForm(false);
    await loadReports();
  } catch (error) {
    showApiError(error);
  } finally {
    setFormBusy(false);
  }
}

async function loadReports(): Promise<void> {
  setListState('loading', 'Оновлення списку...');

  try {
    const response = await reportApi.getList();
    reports = response.data;
    renderReports();
  } catch (error) {
    tableWrapper.classList.add('hidden');
    setListState('error', getErrorMessage(error), true);
  }
}

function handleTableClick(event: MouseEvent): void {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-action]');
  if (!button) {
    return;
  }

  const id = Number(button.dataset.id);
  if (!Number.isInteger(id)) {
    return;
  }

  switch (button.dataset.action) {
    case 'details':
      void showDetails(id);
      break;
    case 'edit':
      startEdit(id);
      break;
    case 'delete':
      void deleteReport(id, button);
      break;
  }
}

async function showDetails(id: number): Promise<void> {
  detailsContent.replaceChildren(createStateMessage('loading', 'Завантаження деталей...'));
  detailsDialog.showModal();

  try {
    const report = await reportApi.getById(id);
    const user = users.find(item => item.id === report.user_id);
    const category = categories.find(item => item.id === report.category_id);
    detailsContent.replaceChildren(createDetails(report, user, category));
  } catch (error) {
    detailsContent.replaceChildren(createStateMessage('error', getErrorMessage(error)));
  }
}

function startEdit(id: number): void {
  const report = reports.find(item => item.id === id);
  if (!report) {
    showFormNotice('error', 'Звіт для редагування не знайдено.');
    return;
  }

  editId = id;
  userSelect.value = String(report.user_id);
  categorySelect.value = report.category_id === null ? '' : String(report.category_id);
  titleInput.value = report.title;
  severitySelect.value = report.severity;
  statusSelect.value = report.status;
  reporterInput.value = report.reporter;
  descriptionInput.value = report.description;

  formTitle.textContent = `Редагувати звіт #${report.id}`;
  submitBtn.textContent = 'Зберегти зміни';
  statusField.classList.remove('hidden');
  cancelEditBtn.classList.remove('hidden');
  hideFormNotice();
  clearFieldErrors();
  reportForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function deleteReport(id: number, button: HTMLButtonElement): Promise<void> {
  const report = reports.find(item => item.id === id);
  if (!report) {
    return;
  }

  const confirmed = window.confirm(`Видалити звіт «${report.title}»?`);
  if (!confirmed) {
    return;
  }

  button.disabled = true;
  button.textContent = 'Видалення...';

  try {
    await reportApi.remove(id);
    if (editId === id) {
      resetForm();
    }
    showFormNotice('success', 'Звіт видалено.');
    await loadReports();
  } catch (error) {
    showFormNotice('error', getErrorMessage(error));
    button.disabled = false;
    button.textContent = 'Видалити';
  }
}

function renderReports(): void {
  const query = searchInput.value.trim().toLocaleLowerCase('uk');
  const filteredReports = reports.filter(report =>
    report.title.toLocaleLowerCase('uk').includes(query)
    || report.reporter.toLocaleLowerCase('uk').includes(query)
  );

  reportsBody.replaceChildren();

  if (filteredReports.length === 0) {
    tableWrapper.classList.add('hidden');
    setListState(
      'empty',
      query ? 'За вашим запитом нічого не знайдено.' : 'Даних ще немає. Створіть перший звіт.'
    );
    return;
  }

  for (const report of filteredReports) {
    reportsBody.append(createReportRow(report));
  }

  listState.classList.add('hidden');
  tableWrapper.classList.remove('hidden');
}

function createReportRow(report: Report): HTMLTableRowElement {
  const row = document.createElement('tr');
  row.append(
    createCell(String(report.id)),
    createCell(report.title),
    createBadgeCell(report.severity, report.severity.toLowerCase()),
    createBadgeCell(report.status, report.status.toLowerCase().replace(' ', '-')),
    createCell(report.reporter)
  );

  const actionsCell = document.createElement('td');
  actionsCell.className = 'actions';
  actionsCell.append(
    createActionButton('Деталі', 'details', report.id, 'secondary'),
    createActionButton('Редагувати', 'edit', report.id, 'secondary'),
    createActionButton('Видалити', 'delete', report.id, 'danger')
  );
  row.append(actionsCell);
  return row;
}

function createDetails(report: Report, user?: User, category?: Category): HTMLElement {
  const grid = document.createElement('dl');
  grid.className = 'details-grid';

  const values: Array<[string, string]> = [
    ['ID', String(report.id)],
    ['Назва', report.title],
    ['Критичність', report.severity],
    ['Статус', report.status],
    ['Автор', user ? `${user.username} (${user.email})` : `ID ${report.user_id}`],
    ['Категорія', category?.name ?? 'Без категорії'],
    ['Репортер', report.reporter],
    ['Створено', report.created_at],
    ['Опис', report.description]
  ];

  for (const [label, value] of values) {
    const wrapper = document.createElement('div');
    const term = document.createElement('dt');
    const description = document.createElement('dd');
    term.textContent = label;
    description.textContent = value;
    wrapper.append(term, description);
    grid.append(wrapper);
  }

  return grid;
}

function renderReferenceOptions(): void {
  userSelect.replaceChildren(new Option('Оберіть автора', ''));
  for (const user of users) {
    userSelect.add(new Option(`${user.username} (${user.email})`, String(user.id)));
  }

  categorySelect.replaceChildren(new Option('Без категорії', ''));
  for (const category of categories) {
    categorySelect.add(new Option(category.name, String(category.id)));
  }
}

interface FormValues {
  userId: string;
  categoryId: string;
  title: string;
  severity: string;
  status: string;
  reporter: string;
  description: string;
}

function readForm(): FormValues {
  return {
    userId: userSelect.value,
    categoryId: categorySelect.value,
    title: titleInput.value.trim(),
    severity: severitySelect.value,
    status: statusSelect.value,
    reporter: reporterInput.value.trim(),
    description: descriptionInput.value.trim()
  };
}

function validateForm(data: FormValues): boolean {
  let valid = true;

  if (!data.userId) {
    setFieldError('userId', 'Оберіть автора.');
    valid = false;
  }
  if (data.title.length < 3) {
    setFieldError('title', 'Назва повинна містити щонайменше 3 символи.');
    valid = false;
  }
  if (!isSeverity(data.severity)) {
    setFieldError('severity', 'Оберіть рівень критичності.');
    valid = false;
  }
  if (data.reporter.length < 2) {
    setFieldError('reporter', 'Ім’я репортера повинно містити щонайменше 2 символи.');
    valid = false;
  }
  if (data.description.length < 5) {
    setFieldError('description', 'Опис повинен містити щонайменше 5 символів.');
    valid = false;
  }

  return valid;
}

function toCreateDto(data: FormValues): CreateReportDto {
  const dto: CreateReportDto = {
    userId: Number(data.userId),
    title: data.title,
    severity: data.severity as Severity,
    reporter: data.reporter,
    description: data.description
  };

  if (data.categoryId) {
    dto.categoryId = Number(data.categoryId);
  }

  return dto;
}

function toUpdateDto(data: FormValues): UpdateReportDto {
  return {
    userId: Number(data.userId),
    categoryId: data.categoryId ? Number(data.categoryId) : null,
    title: data.title,
    severity: data.severity as Severity,
    status: data.status as ReportStatus,
    reporter: data.reporter,
    description: data.description
  };
}

function showApiError(error: unknown): void {
  const message = getErrorMessage(error);
  showFormNotice('error', message);

  if (!(error instanceof ApiError) || !error.details) {
    return;
  }

  const field = error.details.field;
  if (typeof field === 'string' && document.getElementById(field)) {
    setFieldError(field, message);
  }
}

function getErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return 'Сталася неочікувана помилка.';
  }

  if (error.status === 404) {
    return `Запис не знайдено. ${error.message}`;
  }
  if (error.status >= 500) {
    return 'Помилка сервера. Спробуйте повторити запит пізніше.';
  }
  return error.message;
}

function setFormBusy(busy: boolean): void {
  for (const element of Array.from(reportForm.elements)) {
    if (element instanceof HTMLInputElement
      || element instanceof HTMLSelectElement
      || element instanceof HTMLTextAreaElement
      || element instanceof HTMLButtonElement) {
      element.disabled = busy;
    }
  }
  submitBtn.textContent = busy
    ? 'Збереження...'
    : editId === null
      ? 'Створити звіт'
      : 'Зберегти зміни';
}

function setReloadBusy(busy: boolean): void {
  reloadBtn.disabled = busy;
  reloadBtn.textContent = busy ? 'Завантаження...' : 'Оновити список';
}

function resetForm(clearNotice = true): void {
  reportForm.reset();
  editId = null;
  formTitle.textContent = 'Створити звіт';
  submitBtn.textContent = 'Створити звіт';
  statusField.classList.add('hidden');
  cancelEditBtn.classList.add('hidden');
  clearFieldErrors();
  if (clearNotice) {
    hideFormNotice();
  }
}

function setListState(type: 'loading' | 'empty' | 'error', message: string, retry = false): void {
  listState.className = `state ${type}`;
  listState.replaceChildren();

  if (type === 'loading') {
    const spinner = document.createElement('span');
    spinner.className = 'spinner';
    spinner.setAttribute('aria-hidden', 'true');
    listState.append(spinner);
  }

  const text = document.createElement('span');
  text.textContent = message;
  listState.append(text);

  if (retry) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'button secondary compact';
    button.textContent = 'Спробувати ще раз';
    button.addEventListener('click', () => void loadInitialData());
    listState.append(button);
  }
}

function createStateMessage(type: 'loading' | 'error', message: string): HTMLElement {
  const element = document.createElement('div');
  element.className = `state ${type}`;
  element.textContent = message;
  return element;
}

function showFormNotice(type: 'success' | 'error', message: string): void {
  formNotice.className = `notice ${type}`;
  formNotice.textContent = message;
}

function hideFormNotice(): void {
  formNotice.className = 'notice hidden';
  formNotice.textContent = '';
}

function setFieldError(fieldId: string, message: string): void {
  const field = document.getElementById(fieldId);
  const error = document.getElementById(`${fieldId}Error`);
  field?.classList.add('invalid');
  if (error) {
    error.textContent = message;
  }
}

function clearFieldErrors(): void {
  document.querySelectorAll('.invalid').forEach(element => element.classList.remove('invalid'));
  document.querySelectorAll('.field-error').forEach(element => {
    element.textContent = '';
  });
}

function createCell(value: string): HTMLTableCellElement {
  const cell = document.createElement('td');
  cell.textContent = value;
  return cell;
}

function createBadgeCell(value: string, modifier: string): HTMLTableCellElement {
  const cell = document.createElement('td');
  const badge = document.createElement('span');
  badge.className = `badge ${modifier}`;
  badge.textContent = value;
  cell.append(badge);
  return cell;
}

function createActionButton(
  label: string,
  action: 'details' | 'edit' | 'delete',
  id: number,
  style: 'secondary' | 'danger'
): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `button ${style} compact`;
  button.dataset.action = action;
  button.dataset.id = String(id);
  button.textContent = label;
  return button;
}

function isSeverity(value: string): value is Severity {
  return value === 'Low' || value === 'Medium' || value === 'High';
}

function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Element #${id} not found`);
  }
  return element as T;
}
