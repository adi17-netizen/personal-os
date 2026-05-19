import { useState, useCallback } from 'react'
import { useWidgetData } from '../lib/widgetHelpers'
import { fetchGoogle } from '../lib/googleApi'

const MOCK = import.meta.env.VITE_MOCK_MODE === 'true'

const MOCK_TASKS_KEY = 'personal-os-tasks'

function loadMockTasks() {
  try {
    const s = localStorage.getItem(MOCK_TASKS_KEY)
    if (s) return JSON.parse(s)
  } catch {}
  const today = new Date()
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 5)
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  return [
    { id: 't1', title: 'Review PRD for new feature', status: 'needsAction', due: today.toISOString() },
    { id: 't2', title: 'Send weekly update email', status: 'needsAction', due: today.toISOString() },
    { id: 't3', title: 'Book team offsite venue', status: 'needsAction', due: tomorrow.toISOString() },
    { id: 't4', title: 'Update roadmap slides', status: 'needsAction', due: nextWeek.toISOString() },
    { id: 't5', title: 'Submit expense report', status: 'completed', due: yesterday.toISOString(), completed: yesterday.toISOString() },
    { id: 't6', title: 'Draft blog post outline', status: 'needsAction' },
  ]
}

function saveMockTasks(tasks) {
  localStorage.setItem(MOCK_TASKS_KEY, JSON.stringify(tasks))
}

async function fetchTasks() {
  const listsData = await fetchGoogle('https://tasks.googleapis.com/tasks/v1/users/@me/lists?maxResults=1')
  const list = listsData.items?.[0]
  if (!list) return { listId: null, tasks: [] }
  const tasksData = await fetchGoogle(
    `https://tasks.googleapis.com/tasks/v1/lists/${list.id}/tasks?showCompleted=true&showHidden=true&maxResults=50`
  )
  return { listId: list.id, tasks: tasksData.items ?? [] }
}

export function useTasks() {
  const [mockTasks, setMockTasks] = useState(MOCK ? loadMockTasks : null)
  const { data, status, error, retry } = useWidgetData(
    MOCK ? () => Promise.resolve({ listId: 'mock', tasks: loadMockTasks() }) : fetchTasks
  )
  const [optimisticTasks, setOptimisticTasks] = useState(null)

  const tasks = MOCK ? (mockTasks ?? []) : (optimisticTasks ?? data?.tasks ?? [])
  const listId = MOCK ? 'mock' : data?.listId

  const completeTask = useCallback(async (taskId) => {
    const toggleStatus = (list) => {
      const t = list.find(t => t.id === taskId)
      if (!t) return list
      const newStatus = t.status === 'completed' ? 'needsAction' : 'completed'
      return list.map(t => t.id === taskId ? { ...t, status: newStatus, completed: newStatus === 'completed' ? new Date().toISOString() : null } : t)
    }

    if (MOCK) {
      const updated = toggleStatus(mockTasks ?? [])
      setMockTasks(updated)
      saveMockTasks(updated)
      return
    }
    if (!listId) return
    const currentTasks = optimisticTasks ?? data?.tasks ?? []
    const task = currentTasks.find(t => t.id === taskId)
    if (!task) return
    const newStatus = task.status === 'completed' ? 'needsAction' : 'completed'
    setOptimisticTasks(toggleStatus(currentTasks))
    try {
      const body = newStatus === 'completed'
        ? { status: 'completed' }
        : { status: 'needsAction', completed: null }
      await fetchGoogle(
        `https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks/${taskId}`,
        { method: 'PATCH', body: JSON.stringify(body) }
      )
    } catch {
      setOptimisticTasks(null)
    }
  }, [listId, data, mockTasks, optimisticTasks])

  const addTask = useCallback(async (title, due) => {
    if (!title.trim()) return
    const now = new Date().toISOString()
    if (MOCK) {
      const newTask = { id: `t-${Date.now()}`, title: title.trim(), status: 'needsAction', due: due || null, updated: now }
      const updated = [...(mockTasks ?? []), newTask]
      setMockTasks(updated)
      saveMockTasks(updated)
      return
    }
    if (!listId) return
    const newTask = { id: `temp-${Date.now()}`, title, status: 'needsAction', due: due || null, updated: now }
    setOptimisticTasks(prev => [...(prev ?? data?.tasks ?? []), newTask])
    try {
      const body = { title: title.trim() }
      if (due) body.due = due
      await fetchGoogle(
        `https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks`,
        { method: 'POST', body: JSON.stringify(body) }
      )
      setOptimisticTasks(null)
      retry()
    } catch {
      setOptimisticTasks(null)
    }
  }, [listId, data, retry, mockTasks])

  const updateTaskTitle = useCallback(async (taskId, newTitle) => {
    if (MOCK) {
      const updated = (mockTasks ?? []).map(t => t.id === taskId ? { ...t, title: newTitle } : t)
      setMockTasks(updated)
      saveMockTasks(updated)
      return
    }
    if (!listId) return
    try {
      await fetchGoogle(
        `https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks/${taskId}`,
        { method: 'PATCH', body: JSON.stringify({ title: newTitle }) }
      )
    } catch {
      retry()
    }
  }, [listId, retry, mockTasks])

  const deleteTask = useCallback(async (taskId) => {
    if (MOCK) {
      const updated = (mockTasks ?? []).filter(t => t.id !== taskId)
      setMockTasks(updated)
      saveMockTasks(updated)
      return
    }
    if (!listId) return
    setOptimisticTasks(prev => (prev ?? data?.tasks ?? []).filter(t => t.id !== taskId))
    try {
      await fetchGoogle(
        `https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks/${taskId}`,
        { method: 'DELETE' }
      )
    } catch {
      setOptimisticTasks(null)
    }
  }, [listId, data, mockTasks])

  const mockStatus = mockTasks !== null ? (mockTasks.length === 0 ? 'empty' : 'success') : 'loading'

  return {
    tasks,
    listId,
    status: MOCK ? mockStatus : status,
    error: MOCK ? null : error,
    retry: MOCK ? () => {} : retry,
    completeTask,
    addTask,
    updateTaskTitle,
    deleteTask,
  }
}
