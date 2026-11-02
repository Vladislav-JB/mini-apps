(() => {
  'use strict';
  const STORAGE_KEY = 'my-day-todo-v1';
  const form = document.querySelector('#task-form');
  const input = document.querySelector('#task-input');
  const list = document.querySelector('#task-list');
  const count = document.querySelector('#task-count');
  const remainingText = document.querySelector('#remaining-text');
  const emptyState = document.querySelector('#empty-state');
  const emptyTitle = document.querySelector('#empty-title');
  const emptyCopy = document.querySelector('#empty-copy');
  const clearCompletedButton = document.querySelector('#clear-completed');
  const announcer = document.querySelector('#announcer');
  const filterButtons = [...document.querySelectorAll('[data-filter]')];
  let filter = 'all';
  let tasks = loadTasks();

  function loadTasks() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (!Array.isArray(value)) return [];
      return value.filter(task => task && typeof task.id === 'string' && typeof task.text === 'string')
        .map(task => ({ id: task.id, text: task.text.slice(0, 180), completed: Boolean(task.completed) }));
    } catch {
      return [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      announce('Не удалось сохранить список в этом браузере.');
    }
  }

  function announce(message) { announcer.textContent = message; }

  function visibleTasks() {
    if (filter === 'active') return tasks.filter(task => !task.completed);
    if (filter === 'completed') return tasks.filter(task => task.completed);
    return tasks;
  }

  function makeTaskElement(task) {
    const item = document.createElement('li');
    item.className = `task-item${task.completed ? ' is-complete' : ''}`;

    const check = document.createElement('button');
    check.className = 'task-check';
    check.type = 'button';
    check.setAttribute('aria-label', task.completed ? `Вернуть задачу «${task.text}» в работу` : `Отметить задачу «${task.text}» выполненной`);
    check.setAttribute('aria-pressed', String(task.completed));
    if (task.completed) check.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 8.2 2.8 2.7 6.2-6.1"/></svg>';
    check.addEventListener('click', () => {
      task.completed = !task.completed;
      saveTasks();
      render();
      announce(task.completed ? 'Задача отмечена выполненной.' : 'Задача возвращена в работу.');
    });

    const text = document.createElement('p');
    text.className = 'task-text';
    text.textContent = task.text;

    const remove = document.createElement('button');
    remove.className = 'delete-button';
    remove.type = 'button';
    remove.setAttribute('aria-label', `Удалить задачу «${task.text}»`);
    remove.innerHTML = '<span aria-hidden="true">×</span>';
    remove.addEventListener('click', () => {
      tasks = tasks.filter(item => item.id !== task.id);
      saveTasks();
      render();
      announce('Задача удалена.');
    });

    item.append(check, text, remove);
    return item;
  }

  function render() {
    const visible = visibleTasks();
    const activeCount = tasks.filter(task => !task.completed).length;
    list.replaceChildren(...visible.map(makeTaskElement));
    count.textContent = String(tasks.length);
    remainingText.textContent = activeCount === 0
      ? (tasks.length ? 'Все дела выполнены' : 'Нет дел в работе')
      : `${activeCount} ${activeCount === 1 ? 'дело' : activeCount < 5 ? 'дела' : 'дел в работе'}`;
    clearCompletedButton.hidden = !tasks.some(task => task.completed);
    emptyState.classList.toggle('is-visible', visible.length === 0);
    if (tasks.length === 0) {
      emptyTitle.textContent = 'Пока всё чисто';
      emptyCopy.textContent = 'Добавьте первое дело — и вы уже сдвинулись с места.';
    } else if (filter === 'active' && visible.length === 0) {
      emptyTitle.textContent = 'Все дела выполнены';
      emptyCopy.textContent = 'Отличная работа. Можно выдохнуть.';
    } else if (filter === 'completed' && visible.length === 0) {
      emptyTitle.textContent = 'Здесь пока пусто';
      emptyCopy.textContent = 'Выполненные задачи появятся здесь.';
    }
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) { input.focus(); return; }
    tasks.unshift({ id: (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`), text, completed: false });
    saveTasks();
    filter = 'all';
    filterButtons.forEach(button => {
      const selected = button.dataset.filter === filter;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    render();
    input.value = '';
    input.focus();
    announce('Задача добавлена.');
  });

  filterButtons.forEach(button => button.addEventListener('click', () => {
    filter = button.dataset.filter;
    filterButtons.forEach(item => {
      const selected = item === button;
      item.classList.toggle('is-active', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    render();
  }));

  clearCompletedButton.addEventListener('click', () => {
    const completedCount = tasks.filter(task => task.completed).length;
    tasks = tasks.filter(task => !task.completed);
    saveTasks();
    render();
    announce(`Удалено выполненных задач: ${completedCount}.`);
  });

  render();
})();
