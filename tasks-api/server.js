const express = require('express');
const cors = require('cors');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = 3001;
const TASKS_FILE = '/Users/noahpark/Desktop/leftburst-tools/tasks-api/tasks.json';

const ALLOWED_PRIORITIES = new Set(['High', 'Medium', 'Low']);
const ALLOWED_CATEGORIES = new Set([
  'Video Idea',
  'Research',
  'Thumbnail',
  'Software',
  'Other',
]);
const ALLOWED_ASSIGNEES = new Set(['Noah', 'Burst']);
const ALLOWED_STATUSES = new Set(['ideas', 'in-progress', 'review', 'done']);

app.use(cors());
app.use(express.json());

async function ensureTasksFile() {
  try {
    await fs.access(TASKS_FILE);
  } catch {
    await fs.mkdir(path.dirname(TASKS_FILE), { recursive: true });
    await fs.writeFile(TASKS_FILE, '[]', 'utf8');
  }
}

async function readTasks() {
  await ensureTasksFile();

  try {
    const content = await fs.readFile(TASKS_FILE, 'utf8');
    if (!content.trim()) return [];

    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) {
      throw new Error('tasks.json must contain an array');
    }

    return parsed;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('tasks.json contains invalid JSON');
    }
    throw error;
  }
}

async function writeTasks(tasks) {
  await fs.writeFile(TASKS_FILE, JSON.stringify(tasks, null, 2), 'utf8');
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateEnum(value, allowed, fieldName) {
  if (!allowed.has(value)) {
    return `${fieldName} must be one of: ${Array.from(allowed).join(', ')}`;
  }
  return null;
}

function normalizeNewTask(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { error: 'Each task must be an object' };
  }

  const task = {
    id: crypto.randomUUID(),
    title: input.title,
    description: input.description ?? '',
    priority: input.priority,
    category: input.category,
    dueDate: input.dueDate ?? null,
    assignee: input.assignee,
    status: input.status,
    createdAt: new Date().toISOString(),
  };

  const errors = [];

  if (!isNonEmptyString(task.title)) errors.push('title is required');
  if (typeof task.description !== 'string') errors.push('description must be a string');
  if (task.dueDate !== null && typeof task.dueDate !== 'string') {
    errors.push('dueDate must be a string or null');
  }

  const priorityError = validateEnum(task.priority, ALLOWED_PRIORITIES, 'priority');
  if (priorityError) errors.push(priorityError);

  const categoryError = validateEnum(task.category, ALLOWED_CATEGORIES, 'category');
  if (categoryError) errors.push(categoryError);

  const assigneeError = validateEnum(task.assignee, ALLOWED_ASSIGNEES, 'assignee');
  if (assigneeError) errors.push(assigneeError);

  const statusError = validateEnum(task.status, ALLOWED_STATUSES, 'status');
  if (statusError) errors.push(statusError);

  if (errors.length > 0) {
    return { error: errors.join('; ') };
  }

  task.title = task.title.trim();
  return { task };
}

function applyTaskUpdate(existingTask, updates) {
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    return { error: 'Request body must be an object' };
  }

  const nextTask = { ...existingTask };
  const errors = [];

  if ('title' in updates) {
    if (!isNonEmptyString(updates.title)) {
      errors.push('title must be a non-empty string');
    } else {
      nextTask.title = updates.title.trim();
    }
  }

  if ('description' in updates) {
    if (typeof updates.description !== 'string') {
      errors.push('description must be a string');
    } else {
      nextTask.description = updates.description;
    }
  }

  if ('priority' in updates) {
    const err = validateEnum(updates.priority, ALLOWED_PRIORITIES, 'priority');
    if (err) errors.push(err);
    else nextTask.priority = updates.priority;
  }

  if ('category' in updates) {
    const err = validateEnum(updates.category, ALLOWED_CATEGORIES, 'category');
    if (err) errors.push(err);
    else nextTask.category = updates.category;
  }

  if ('dueDate' in updates) {
    if (updates.dueDate !== null && typeof updates.dueDate !== 'string') {
      errors.push('dueDate must be a string or null');
    } else {
      nextTask.dueDate = updates.dueDate;
    }
  }

  if ('assignee' in updates) {
    const err = validateEnum(updates.assignee, ALLOWED_ASSIGNEES, 'assignee');
    if (err) errors.push(err);
    else nextTask.assignee = updates.assignee;
  }

  if ('status' in updates) {
    const err = validateEnum(updates.status, ALLOWED_STATUSES, 'status');
    if (err) errors.push(err);
    else nextTask.status = updates.status;
  }

  if (errors.length > 0) {
    return { error: errors.join('; ') };
  }

  return { task: nextTask };
}

function toArrayPayload(body) {
  if (Array.isArray(body)) return body;
  if (body && typeof body === 'object') return [body];
  return null;
}

app.get('/tasks', async (_req, res) => {
  try {
    const tasks = await readTasks();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to read tasks' });
  }
});

app.post('/tasks', async (req, res) => {
  try {
    const payload = toArrayPayload(req.body);
    if (!payload) {
      return res.status(400).json({ error: 'Body must be a task object or an array of task objects' });
    }

    const newTasks = [];
    for (const item of payload) {
      const result = normalizeNewTask(item);
      if (result.error) {
        return res.status(400).json({ error: result.error });
      }
      newTasks.push(result.task);
    }

    const tasks = await readTasks();
    tasks.push(...newTasks);
    await writeTasks(tasks);

    return res.status(201).json(Array.isArray(req.body) ? newTasks : newTasks[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to create task(s)' });
  }
});

app.post('/tasks/bulk', async (req, res) => {
  try {
    if (!Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Body must be an array of task objects' });
    }

    const newTasks = [];
    for (const item of req.body) {
      const result = normalizeNewTask(item);
      if (result.error) {
        return res.status(400).json({ error: result.error });
      }
      newTasks.push(result.task);
    }

    const tasks = await readTasks();
    tasks.push(...newTasks);
    await writeTasks(tasks);

    return res.status(201).json({ added: newTasks.length, tasks: newTasks });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to add tasks in bulk' });
  }
});

app.put('/tasks/:id', async (req, res) => {
  try {
    const tasks = await readTasks();
    const index = tasks.findIndex((task) => task.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const { task: updatedTask, error } = applyTaskUpdate(tasks[index], req.body);
    if (error) {
      return res.status(400).json({ error });
    }

    tasks[index] = {
      ...updatedTask,
      id: tasks[index].id,
      createdAt: tasks[index].createdAt,
    };

    await writeTasks(tasks);
    return res.json(tasks[index]);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to update task' });
  }
});

app.delete('/tasks/:id', async (req, res) => {
  try {
    const tasks = await readTasks();
    const index = tasks.findIndex((task) => task.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const [deletedTask] = tasks.splice(index, 1);
    await writeTasks(tasks);

    return res.json({ message: 'Task deleted', task: deletedTask });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to delete task' });
  }
});

app.use((err, _req, res, _next) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  return res.status(500).json({ error: 'Internal server error' });
});

async function startServer() {
  try {
    await ensureTasksFile();
    app.listen(PORT, () => {
      console.log(`Mission Control Tasks API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
