import React, { useRef } from 'react'

export default function Tilt({ children, max = 12, glare = true, className = '' }) {
  const ref = useRef(null)

  const onMove = (e) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    const rx = (py - 0.5) * max
    const ry = (0.5 - px) * max
    el.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`
    if (glare) {
      const glow = el.querySelector('[data-tilt-glow]')
      if (glow) {
        glow.style.background = `radial-gradient(circle at ${px*100}% ${py*100}%, rgba(255,255,255,0.35), transparent 40%)`
      }
    }
  }
  const onLeave = () => {
    const el = ref.current
    if (!el) return
    el.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg)'
    const glow = el.querySelector('[data-tilt-glow]')
    if (glow) glow.style.background = 'transparent'
  }

  return (
    <div
      ref={ref}
      className={`relative will-change-transform transition-transform duration-200 ${className}`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {glare && <div data-tilt-glow className="pointer-events-none absolute inset-0 rounded-2xl" />}
      {children}
    </div>
  )
}
