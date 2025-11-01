import { useState, useCallback, useRef } from 'react'

interface HistoryState<T> {
  past: T[]
  present: T
  future: T[]
}

export function useHistory<T>(initialState: T, maxHistory = 50) {
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
  })

  const isUndoingRef = useRef(false)

  const set = useCallback((newState: T | ((prev: T) => T)) => {
    if (isUndoingRef.current) return

    setHistory((current) => {
      const newPresent = typeof newState === 'function'
        ? (newState as (prev: T) => T)(current.present)
        : newState

      // Don't add to history if nothing changed
      if (JSON.stringify(newPresent) === JSON.stringify(current.present)) {
        return current
      }

      const newPast = [...current.past, current.present]

      // Limit history size
      if (newPast.length > maxHistory) {
        newPast.shift()
      }

      return {
        past: newPast,
        present: newPresent,
        future: [],
      }
    })
  }, [maxHistory])

  const undo = useCallback(() => {
    setHistory((current) => {
      if (current.past.length === 0) return current

      isUndoingRef.current = true
      setTimeout(() => { isUndoingRef.current = false }, 0)

      const previous = current.past[current.past.length - 1]
      const newPast = current.past.slice(0, current.past.length - 1)

      return {
        past: newPast,
        present: previous,
        future: [current.present, ...current.future],
      }
    })
  }, [])

  const redo = useCallback(() => {
    setHistory((current) => {
      if (current.future.length === 0) return current

      isUndoingRef.current = true
      setTimeout(() => { isUndoingRef.current = false }, 0)

      const next = current.future[0]
      const newFuture = current.future.slice(1)

      return {
        past: [...current.past, current.present],
        present: next,
        future: newFuture,
      }
    })
  }, [])

  const reset = useCallback((newState: T) => {
    setHistory({
      past: [],
      present: newState,
      future: [],
    })
  }, [])

  const canUndo = history.past.length > 0
  const canRedo = history.future.length > 0

  return {
    state: history.present,
    set,
    undo,
    redo,
    reset,
    canUndo,
    canRedo,
  }
}
