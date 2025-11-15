import React from 'react'

// Simple, friendly SVG avatar with moods and gentle animation
export default function AvatarKid({ mood = 'idle', size = 72 }) {
  const moodFace = {
    idle: { mouth: 'M18 30 Q24 34 30 30', eyeY: 0 },
    happy: { mouth: 'M16 28 Q24 38 32 28', eyeY: -1 },
    sad: { mouth: 'M16 34 Q24 26 32 34', eyeY: 1 },
  }[mood] || { mouth: 'M18 30 Q24 34 30 30', eyeY: 0 }

  return (
    <div style={{ width: size, height: size }} className="select-none">
      <svg viewBox="0 0 48 48" width={size} height={size} className="drop-shadow-sm">
        {/* Head */}
        <defs>
          <linearGradient id="skin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFD6A0" />
            <stop offset="100%" stopColor="#FFC38B" />
          </linearGradient>
        </defs>
        <g className="origin-center animate-[float_3s_ease-in-out_infinite]">
          <circle cx="24" cy="24" r="16" fill="url(#skin)" stroke="#E0A56B" />
          {/* Hair */}
          <path d="M10 18 C14 8, 34 8, 38 18 L38 16 C34 10, 14 10, 10 16 Z" fill="#3B2A1A" />
          {/* Eyes */}
          <circle cx="18" cy={22 + moodFace.eyeY} r="2" fill="#1F2937" />
          <circle cx="30" cy={22 + moodFace.eyeY} r="2" fill="#1F2937" />
          {/* Blush */}
          <circle cx="14" cy="26" r="1.6" fill="#FCA5A5" opacity="0.7" />
          <circle cx="34" cy="26" r="1.6" fill="#FCA5A5" opacity="0.7" />
          {/* Mouth */}
          <path d={moodFace.mouth} stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* Helmet / worker hat */}
          <g className="animate-[tilt_4s_ease-in-out_infinite]">
            <path d="M12 14 Q24 6 36 14 L36 18 L12 18 Z" fill="#F59E0B" stroke="#C2410C" />
            <rect x="20" y="10" width="8" height="6" rx="2" fill="#FDE68A" stroke="#C2410C" />
          </g>
        </g>
        <style>{`
          @keyframes float { 0%,100%{ transform: translateY(0)} 50%{ transform: translateY(-2px)} }
          @keyframes tilt { 0%,100%{ transform: rotate(0deg)} 50%{ transform: rotate(-3deg)} }
        `}</style>
      </svg>
    </div>
  )
}
