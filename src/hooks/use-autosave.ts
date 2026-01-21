import { useEffect, useRef } from 'react'

export function useAutosave<T>(
  data: T,
  onSave: (data: T) => Promise<void>,
  delay = 2000
) {
  const timeoutRef = useRef<NodeJS.Timeout>()
  const lastSavedRef = useRef<T>()

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Don't save if data hasn't changed
    if (JSON.stringify(data) === JSON.stringify(lastSavedRef.current)) {
      return
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      onSave(data).then(() => {
        lastSavedRef.current = data
      })
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [data, onSave, delay])
}

