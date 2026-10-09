import { useEffect, useState } from 'react'

export function useCooldown(initialDeadline = 0) {
  const [deadline, updateDeadline] = useState(initialDeadline)
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    if (deadline <= Date.now()) return
    const timer = window.setInterval(() => {
      const time = Date.now()
      setNow(time)
      if (time >= deadline) window.clearInterval(timer)
    }, 1000)
    return () => window.clearInterval(timer)
  }, [deadline])
  return {
    remaining: Math.max(0, Math.ceil((deadline - now) / 1000)),
    isCoolingDown: () => deadline > Date.now(),
    setDeadline: (value: number) => {
      setNow(Date.now())
      updateDeadline(value)
    },
  }
}
