import { useState, useEffect, useCallback } from 'react'

let showToastFn: ((msg: string) => void) | null = null

export function toast(msg: string) {
  showToastFn?.(msg)
}

export function ToastProvider() {
  const [message, setMessage] = useState('')
  const [visible, setVisible] = useState(false)

  const show = useCallback((msg: string) => {
    setMessage(msg)
    setVisible(true)
    setTimeout(() => setVisible(false), 2000)
  }, [])

  useEffect(() => {
    showToastFn = show
    return () => { showToastFn = null }
  }, [show])

  if (!visible) return null

  return (
    <div className="toast">{message}</div>
  )
}
