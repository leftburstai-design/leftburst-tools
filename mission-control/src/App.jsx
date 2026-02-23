import { useEffect, useMemo, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'leftburst-mission-control-tasks'

const COLUMNS = [
  { key: 'ideas', label: 'Ideas' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'review', label: 'Review' },
  { key: 'done', label: 'Done' },
]

const PRIORITIES = ['High', 'Medium', 'Low']
const CATEGORIES = ['Video Idea', 'Research', 'Thumbnail', 'Software', 'Other']
const ASSIGNEES = ['Noah', 'Burst']

const createId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `task-${Date.now()}-${Math.random().toString(16).slice(2)}`

const defaultTaskValues = {
  title: '',
  description: '',
  priority: 'Medium',
  category: 'Video Idea',
  dueDate: '',
  assignee: 'Noah',
  status: 'ideas',
}

const seedTasks = [
  {
    id: createId(),
    title: 'Metal Fight nostalgia tournament concept',
    description: 'Draft episode structure and bracket for community battle concept.',
    priority: 'High',
    category: 'Video Idea',
    dueDate: '2026-02-27',
    assignee: 'Noah',
    status: 'ideas',
  },
  {
    id: createId(),
    title: 'UX-02 combo testing notes',
    description: 'Compile launch consistency data and finalize key talking points.',
    priority: 'Medium',
    category: 'Research',
    dueDate: '2026-02-25',
    assignee: 'Burst',
    status: 'in-progress',
  },
  {
    id: createId(),
    title: 'Thumbnail red streak pass',
    description: 'Test motion lines and face crop contrast for CTR improvement.',
    priority: 'High',
    category: 'Thumbnail',
    dueDate: '2026-02-24',
    assignee: 'Burst',
    status: 'review',
  },
  {
    id: createId(),
    title: 'Clip naming automation script',
    description: 'Added timestamp-based renaming presets for recording workflow.',
    priority: 'Low',
    category: 'Software',
    dueDate: '2026-02-20',
    assignee: 'Noah',
    status: 'done',
  },
]

function loadInitialTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return seedTasks
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed : seedTasks
  } catch {
    return seedTasks
  }
}

function formatDueDate(dateString) {
  if (!dateString) return 'No due date'
  const date = new Date(`${dateString}T00:00:00`)
  if (Number.isNaN(date.getTime())) return 'No due date'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function App() {
  const [tasks, setTasks] = useState(loadInitialTasks)
  const [filters, setFilters] = useState({ category: 'All', assignee: 'All' })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [formData, setFormData] = useState(defaultTaskValues)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  }, [tasks])

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const categoryMatch =
        filters.category === 'All' || task.category === filters.category
      const assigneeMatch =
        filters.assignee === 'All' || task.assignee === filters.assignee
      return categoryMatch && assigneeMatch
    })
  }, [tasks, filters])

  const counts = useMemo(() => {
    return COLUMNS.reduce((acc, column) => {
      acc[column.key] = tasks.filter((task) => task.status === column.key).length
      return acc
    }, {})
  }, [tasks])

  const openCreateModal = () => {
    setEditingTaskId(null)
    setFormData(defaultTaskValues)
    setIsModalOpen(true)
  }

  const openEditModal = (task) => {
    setEditingTaskId(task.id)
    setFormData({
      title: task.title,
      description: task.description,
      priority: task.priority,
      category: task.category,
      dueDate: task.dueDate || '',
      assignee: task.assignee,
      status: task.status,
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingTaskId(null)
    setFormData(defaultTaskValues)
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const payload = {
      ...formData,
      title: formData.title.trim(),
      description: formData.description.trim(),
    }

    if (!payload.title) return

    if (editingTaskId) {
      setTasks((current) =>
        current.map((task) =>
          task.id === editingTaskId ? { ...task, ...payload } : task,
        ),
      )
    } else {
      setTasks((current) => [...current, { id: createId(), ...payload }])
    }

    closeModal()
  }

  const handleDelete = (taskId) => {
    setTasks((current) => current.filter((task) => task.id !== taskId))
  }

  const tasksByColumn = useMemo(() => {
    return COLUMNS.reduce((acc, column) => {
      acc[column.key] = filteredTasks.filter((task) => task.status === column.key)
      return acc
    }, {})
  }, [filteredTasks])

  return (
    <div className="mission-control">
      <header className="mc-header">
        <div>
          <p className="mc-kicker">LeftBurst Studio Ops</p>
          <h1>🎬 LeftBurst Mission Control</h1>
          <p className="mc-subtitle">
            Project manager for Noah&apos;s LeftBurst Beyblade channel pipeline
          </p>
        </div>
        <button className="primary-button" onClick={openCreateModal} type="button">
          + New Task
        </button>
      </header>

      <section className="stats-bar" aria-label="Task statistics">
        {COLUMNS.map((column) => (
          <div key={column.key} className="stat-card">
            <span className="stat-label">{column.label}</span>
            <span className="stat-value">{counts[column.key] ?? 0}</span>
          </div>
        ))}
      </section>

      <section className="filter-bar" aria-label="Task filters">
        <div className="filter-group">
          <label htmlFor="category-filter">Category</label>
          <select
            id="category-filter"
            value={filters.category}
            onChange={(event) =>
              setFilters((current) => ({ ...current, category: event.target.value }))
            }
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="assignee-filter">Assignee</label>
          <select
            id="assignee-filter"
            value={filters.assignee}
            onChange={(event) =>
              setFilters((current) => ({ ...current, assignee: event.target.value }))
            }
          >
            <option value="All">All Assignees</option>
            {ASSIGNEES.map((assignee) => (
              <option key={assignee} value={assignee}>
                {assignee}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-summary">
          Showing <strong>{filteredTasks.length}</strong> of <strong>{tasks.length}</strong>{' '}
          tasks
        </div>
      </section>

      <main className="kanban-board" aria-label="Kanban board">
        {COLUMNS.map((column) => (
          <section key={column.key} className="kanban-column" aria-labelledby={`col-${column.key}`}>
            <header className="column-header">
              <h2 id={`col-${column.key}`}>{column.label}</h2>
              <span className="column-count">{tasksByColumn[column.key]?.length ?? 0}</span>
            </header>

            <div className="column-cards">
              {(tasksByColumn[column.key] ?? []).length === 0 ? (
                <div className="empty-state">No tasks match current filters.</div>
              ) : (
                tasksByColumn[column.key].map((task) => (
                  <article
                    key={task.id}
                    className="task-card"
                    role="button"
                    tabIndex={0}
                    onClick={() => openEditModal(task)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        openEditModal(task)
                      }
                    }}
                  >
                    <div className="task-card-top">
                      <h3>{task.title}</h3>
                      <button
                        type="button"
                        className="delete-button"
                        aria-label={`Delete ${task.title}`}
                        onClick={(event) => {
                          event.stopPropagation()
                          handleDelete(task.id)
                        }}
                      >
                        ×
                      </button>
                    </div>

                    <p className="task-description">{task.description || 'No description.'}</p>

                    <div className="task-meta-row">
                      <span
                        className={`badge priority-badge priority-${task.priority.toLowerCase()}`}
                      >
                        {task.priority}
                      </span>
                      <span className="badge category-badge">{task.category}</span>
                    </div>

                    <div className="task-footer">
                      <span className="due-date">Due {formatDueDate(task.dueDate)}</span>
                      <span
                        className={`badge assignee-badge assignee-${task.assignee.toLowerCase()}`}
                      >
                        {task.assignee}
                      </span>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        ))}
      </main>

      {isModalOpen && (
        <TaskModal
          formData={formData}
          setFormData={setFormData}
          onClose={closeModal}
          onSubmit={handleSubmit}
          isEditing={Boolean(editingTaskId)}
        />
      )}
    </div>
  )
}

function TaskModal({ formData, setFormData, onClose, onSubmit, isEditing }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const updateField = (key, value) => {
    setFormData((current) => ({ ...current, [key]: value }))
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="task-modal-title">{isEditing ? 'Edit Task' : 'Add New Task'}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close modal">
            ×
          </button>
        </div>

        <form className="task-form" onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="task-title">Title</label>
            <input
              id="task-title"
              type="text"
              value={formData.title}
              onChange={(event) => updateField('title', event.target.value)}
              placeholder="Enter task title"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="task-description">Description</label>
            <textarea
              id="task-description"
              rows="4"
              value={formData.description}
              onChange={(event) => updateField('description', event.target.value)}
              placeholder="Add details for this task"
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="task-priority">Priority</label>
              <select
                id="task-priority"
                value={formData.priority}
                onChange={(event) => updateField('priority', event.target.value)}
              >
                {PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="task-category">Category</label>
              <select
                id="task-category"
                value={formData.category}
                onChange={(event) => updateField('category', event.target.value)}
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="task-due-date">Due Date</label>
              <input
                id="task-due-date"
                type="date"
                value={formData.dueDate}
                onChange={(event) => updateField('dueDate', event.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="task-assignee">Assignee</label>
              <select
                id="task-assignee"
                value={formData.assignee}
                onChange={(event) => updateField('assignee', event.target.value)}
              >
                {ASSIGNEES.map((assignee) => (
                  <option key={assignee} value={assignee}>
                    {assignee}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group form-group-full">
              <label htmlFor="task-status">Column</label>
              <select
                id="task-status"
                value={formData.status}
                onChange={(event) => updateField('status', event.target.value)}
              >
                {COLUMNS.map((column) => (
                  <option key={column.key} value={column.key}>
                    {column.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-button">
              {isEditing ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default App
