import React from 'react'
import Tilt from './Tilt'

export default function CityBuilding({ color, height, windows = 6, label = '+۱ ساختمان' }) {
  return (
    <Tilt className="group relative flex h-48 items-end overflow-hidden rounded-xl bg-gradient-to-t from-black/10 to-transparent">
      <div
        className="mx-auto w-11/12 rounded-t-md shadow-xl ring-1 ring-black/10 transition-transform duration-500 group-hover:-translate-y-1"
        style={{ background: color, height }}
      >
        {/* depth layers */}
        <div className="absolute left-0 top-0 h-full w-1/2 opacity-20" style={{ background: 'linear-gradient(90deg, #0000, #0003)' }} />
        <div className="grid grid-cols-3 gap-1 p-2">
          {Array.from({ length: windows }).map((_, i) => (
            <span key={i} className="h-3 w-full rounded-sm bg-white/70 shadow-inner" />
          ))}
        </div>
      </div>
      <span className="absolute left-2 top-2 select-none rounded-full bg-white/90 px-2 py-0.5 text-xs font-bold text-gray-700 shadow">
        {label}
      </span>
    </Tilt>
  )
}
