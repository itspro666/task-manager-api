const API = '/api';
const STATUS_LABELS = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' };

let currentFilter = '';
let categories = [];

// ---------- helpers ----------

async function request(path, options = {}) {
    const response = await fetch(API + path, {
        headers: { 'Content-Type': 'application/json' },
        ...options
    });

    if (!response.ok) {
        let message = 'Something went wrong';
        try {
            const error = await response.json();
            message = error.message || message;
            if (error.details) {
                message += ': ' + Object.values(error.details).join(', ');
            }
        } catch (e) { /* response had no JSON body */ }
        throw new Error(message);
    }
    return response.status === 204 ? null : response.json();
}

function el(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined && text !== null) element.textContent = text;
    return element;
}

let messageTimer;
function showMessage(text, type = 'error') {
    const box = document.getElementById('message');
    box.textContent = text;
    box.className = 'message ' + type;
    clearTimeout(messageTimer);
    messageTimer = setTimeout(() => box.classList.add('hidden'), 4000);
}

// ---------- categories ----------

async function loadCategories() {
    categories = await request('/categories');
    renderCategories();
    fillCategorySelect();
}

function fillCategorySelect() {
    const select = document.getElementById('categoryId');
    const selected = select.value;
    select.replaceChildren(new Option('No category', ''));
    categories.forEach(c => select.add(new Option(c.name, c.id)));
    select.value = selected;
}

function renderCategories() {
    const list = document.getElementById('category-list');
    list.replaceChildren();

    if (categories.length === 0) {
        list.appendChild(el('li', 'empty', 'No categories yet'));
        return;
    }

    categories.forEach(category => {
        const item = el('li', 'category');
        item.appendChild(el('span', '', category.name));

        const deleteBtn = el('button', 'delete', 'Delete');
        deleteBtn.addEventListener('click', () => deleteCategory(category));
        item.appendChild(deleteBtn);

        list.appendChild(item);
    });
}

async function deleteCategory(category) {
    if (!confirm(`Delete category "${category.name}"?`)) return;
    try {
        await request('/categories/' + category.id, { method: 'DELETE' });
        await loadCategories();
        showMessage('Category deleted', 'success');
    } catch (error) {
        showMessage(error.message);
    }
}

// ---------- tasks ----------

async function loadTasks() {
    const query = currentFilter ? '?status=' + currentFilter : '';
    const tasks = await request('/tasks' + query);
    renderTasks(tasks);
}

function renderTasks(tasks) {
    const list = document.getElementById('task-list');
    list.replaceChildren();

    if (tasks.length === 0) {
        list.appendChild(el('li', 'empty', 'No tasks found'));
        return;
    }

    tasks.forEach(task => {
        const item = el('li', 'task' + (task.status === 'DONE' ? ' done' : ''));

        const info = el('div', 'task-info');
        info.appendChild(el('div', 'task-title', task.title));
        if (task.description) {
            info.appendChild(el('div', 'task-desc', task.description));
        }
        const meta = [];
        if (task.categoryName) meta.push('Category: ' + task.categoryName);
        if (task.dueDate) meta.push('Due: ' + task.dueDate);
        if (meta.length) info.appendChild(el('div', 'task-meta', meta.join('  |  ')));
        item.appendChild(info);

        const actions = el('div', 'task-actions');

        const statusSelect = el('select');
        Object.entries(STATUS_LABELS).forEach(([value, label]) => {
            statusSelect.add(new Option(label, value));
        });
        statusSelect.value = task.status;
        statusSelect.addEventListener('change', () => changeStatus(task, statusSelect.value));
        actions.appendChild(statusSelect);

        const deleteBtn = el('button', 'delete', 'Delete');
        deleteBtn.addEventListener('click', () => deleteTask(task));
        actions.appendChild(deleteBtn);

        item.appendChild(actions);
        list.appendChild(item);
    });
}

async function changeStatus(task, status) {
    try {
        await request('/tasks/' + task.id, {
            method: 'PUT',
            body: JSON.stringify({
                title: task.title,
                description: task.description,
                status: status,
                dueDate: task.dueDate,
                categoryId: task.categoryId
            })
        });
        await loadTasks();
    } catch (error) {
        showMessage(error.message);
        await loadTasks();
    }
}

async function deleteTask(task) {
    if (!confirm(`Delete task "${task.title}"?`)) return;
    try {
        await request('/tasks/' + task.id, { method: 'DELETE' });
        await loadTasks();
        showMessage('Task deleted', 'success');
    } catch (error) {
        showMessage(error.message);
    }
}

// ---------- events ----------

document.getElementById('task-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const body = {
        title: document.getElementById('title').value.trim(),
        description: document.getElementById('description').value.trim() || null,
        status: document.getElementById('status').value,
        dueDate: document.getElementById('dueDate').value || null,
        categoryId: document.getElementById('categoryId').value
            ? Number(document.getElementById('categoryId').value)
            : null
    };

    try {
        await request('/tasks', { method: 'POST', body: JSON.stringify(body) });
        event.target.reset();
        await loadTasks();
        showMessage('Task added', 'success');
    } catch (error) {
        showMessage(error.message);
    }
});

document.getElementById('category-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = document.getElementById('category-name').value.trim();

    try {
        await request('/categories', { method: 'POST', body: JSON.stringify({ name }) });
        event.target.reset();
        await loadCategories();
        showMessage('Category added', 'success');
    } catch (error) {
        showMessage(error.message);
    }
});

document.getElementById('filters').addEventListener('click', async (event) => {
    const button = event.target.closest('.filter');
    if (!button) return;

    currentFilter = button.dataset.status;
    document.querySelectorAll('.filter').forEach(b => b.classList.toggle('active', b === button));
    try {
        await loadTasks();
    } catch (error) {
        showMessage(error.message);
    }
});

// ---------- start ----------

(async function init() {
    try {
        await Promise.all([loadCategories(), loadTasks()]);
    } catch (error) {
        showMessage('Could not reach the API: ' + error.message);
    }
})();
