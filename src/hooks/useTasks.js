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
  return [
    { id: 't1', title: 'Review PRD for new feature', status: 'needsAction' },
    { id: 't2', title: 'Send weekly update email', status: 'needsAction' },
    { id: 't3', title: 'Book team offsite venue', status: 'needsAction' },
    { id: 't4', title: 'Update roadmap slides', status: 'needsAction' },
  ]
}

function saveMockTasks(tasks) {
  localStorage.setItem(MOCK_TASKS_KEY, JSON.stringify(tasks))
}

async function fetchTasks() {
  const listsData = await fetchGoogle('https://tasks.googleapis.com/tasks/v1/users/@me/lists?maxResults=1')
  const list = listsData.items?.[0]
  if (!list) return []
  const tasksData = await fetchGoogle(
    `https://tasks.googleapis.com/tasks/v1/lists/${list.id}/tasks?showCompleted=false&maxResults=50`
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
        { method: 'PATCH', body: JSON.stringify({ status: 'completed' }) }
      )
    } catch {
      setOptimisticTasks(null)
    }
  }, [listId, data, mockTasks])

  const addTask = useCallback(async (title) => {
    if (!title.trim()) return
    if (MOCK) {
      const newTask = { id: `t-${Date.now()}`, title: title.trim(), status: 'needsAction' }
      const updated = [...(mockTasks ?? []), newTask]
      setMockTasks(updated)
      saveMockTasks(updated)
      return
    }
    if (!listId) return
    const newTask = { id: `temp-${Date.now()}`, title, status: 'needsAction' }
    setOptimisticTasks(prev => [...(prev ?? data?.tasks ?? []), newTask])
    try {
      await fetchGoogle(
        `https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks`,
        { method: 'POST', body: JSON.stringify({ title: title.trim() }) }
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
  }
}
