import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

const scrollPositions = new Map<string, number>()

export function useScrollRestore() {
  const location = useLocation()
  const pageRef = useRef<HTMLDivElement>(null)

  // Save scroll position before leaving
  useEffect(() => {
    const el = pageRef.current
    if (!el) return

    const key = location.pathname
    // Restore saved position
    const saved = scrollPositions.get(key)
    if (saved) {
      el.scrollTop = saved
    } else {
      el.scrollTop = 0
    }

    return () => {
      // Save current position when leaving
      scrollPositions.set(key, el.scrollTop)
    }
  }, [location.pathname])

  return pageRef
}
