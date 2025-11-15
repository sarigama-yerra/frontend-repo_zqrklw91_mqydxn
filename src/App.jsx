import React, { useMemo, useState, useEffect, useRef } from 'react'
import Spline from '@splinetool/react-spline'
import AvatarKid from './components/AvatarKid'
import CityBuilding from './components/CityBuilding'

// Sound manager: celebration, wrong, click + volume/mute
function useSoundFX() {
  const ctxRef = useRef(null)
  const gainRef = useRef(null)
  const [volume, setVolume] = useState(0.8)
  const [muted, setMuted] = useState(false)

  const ensure = () => {
    const AudioCtx = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)
    if (!AudioCtx) return null
    if (!ctxRef.current) {
      ctxRef.current = new AudioCtx()
      gainRef.current = ctxRef.current.createGain()
      gainRef.current.gain.value = muted ? 0 : volume
      gainRef.current.connect(ctxRef.current.destination)
    }
    return ctxRef.current
  }

  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.setTargetAtTime(muted ? 0 : volume, ctxRef.current?.currentTime || 0, 0.01)
    }
  }, [volume, muted])

  const playCelebrate = (level=1) => {
    const ctx = ensure(); if (!ctx) return
    const now = ctx.currentTime
    const base = level === 1 ? 523.25 : level === 2 ? 659.25 : 783.99 // base note shifts with level
    const chord = [base, base*1.25, base*1.5]
    chord.forEach((freq, i) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'triangle'
      o.frequency.value = freq
      o.connect(g)
      g.connect(gainRef.current)
      const start = now + i * 0.06
      const end = start + 0.25
      g.gain.setValueAtTime(0.0001, start)
      g.gain.exponentialRampToValueAtTime(0.45, start + 0.03)
      g.gain.exponentialRampToValueAtTime(0.0001, end)
      o.start(start)
      o.stop(end)
    })
  }

  const playWrong = () => {
    const ctx = ensure(); if (!ctx) return
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'square'
    o.frequency.setValueAtTime(200, ctx.currentTime)
    o.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.25)
    o.connect(g)
    g.connect(gainRef.current)
    g.gain.setValueAtTime(0.0001, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35)
    o.start()
    o.stop(ctx.currentTime + 0.36)
  }

  const playClick = () => {
    const ctx = ensure(); if (!ctx) return
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'triangle'
    o.frequency.value = 880
    o.connect(g)
    g.connect(gainRef.current)
    g.gain.setValueAtTime(0.0001, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.005)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.07)
    o.start()
    o.stop(ctx.currentTime + 0.08)
  }

  return {
    playCelebrate,
    playWrong,
    playClick,
    volume,
    setVolume,
    muted,
    setMuted,
  }
}

const levels = [
  { id: 1, title: 'سطح ۱', range: 5, workers: 5 },
  { id: 2, title: 'سطح ۲', range: 10, workers: 8 },
  { id: 3, title: 'سطح ۳', range: 20, workers: 10 },
]

function App() {
  const [level, setLevel] = useState(null)
  const [target, setTarget] = useState(1)
  const [round, setRound] = useState(0)
  const [built, setBuilt] = useState([])
  const [feedback, setFeedback] = useState(null) // 'right' | 'wrong'
  const [shakeKey, setShakeKey] = useState(0)

  // Timed mode
  const [timedMode, setTimedMode] = useState(false)
  const [duration, setDuration] = useState(10) // seconds per question
  const [timeLeft, setTimeLeft] = useState(duration)
  const timerRef = useRef(null)

  // Sounds
  const { playCelebrate, playWrong, playClick, volume, setVolume, muted, setMuted } = useSoundFX()

  const totalRounds = 10
  const currentLevel = useMemo(() => levels.find(l => l.id === level) || null, [level])

  useEffect(() => {
    if (currentLevel) {
      startRound()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLevel?.id])

  // Timer effect
  useEffect(() => {
    if (!timedMode || !currentLevel) return
    if (feedback === 'right') return
    clearInterval(timerRef.current)
    setTimeLeft(duration)
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          // time up: mark wrong and move next
          setFeedback('wrong')
          setShakeKey(k => k + 1)
          playWrong()
          setTimeout(() => {
            setFeedback(null)
            if (round >= totalRounds) return
            startRound()
          }, 600)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, round, timedMode, duration, currentLevel, feedback])

  const startRound = () => {
    if (!currentLevel) return
    const nextTarget = 1 + Math.floor(Math.random() * currentLevel.range)
    setTarget(nextTarget)
    setRound(r => r + 1)
    setFeedback(null)
    if (timedMode) setTimeLeft(duration)
  }

  const handleAnswer = (n) => {
    if (!currentLevel) return
    playClick()
    if (n === target) {
      clearInterval(timerRef.current)
      setFeedback('right')
      playCelebrate(level)
      const hues = [16, 28, 40, 190, 220, 260, 300]
      const hue = hues[Math.floor(Math.random() * hues.length)]
      setBuilt(prev => [
        ...prev,
        {
          id: `${Date.now()}-${prev.length}`,
          color: `hsl(${hue}deg 90% 55%)`,
          windows: Math.max(3, Math.min(9, target)),
          height: 80 + Math.min(120, target * 8),
        },
      ])

      setTimeout(() => {
        if (round >= totalRounds) return
        startRound()
      }, 700)
    } else {
      setFeedback('wrong')
      setShakeKey(k => k + 1)
      playWrong()
      setTimeout(() => setFeedback(null), 600)
    }
  }

  const resetGame = () => {
    clearInterval(timerRef.current)
    setBuilt([])
    setRound(0)
    setFeedback(null)
    if (currentLevel) startRound()
  }

  const progress = Math.min(1, round / totalRounds)
  const timeProgress = Math.max(0, Math.min(1, timeLeft / duration))

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50">
      {/* 3D Hero */}
      <div className="absolute inset-0 opacity-90">
        <Spline scene="https://prod.spline.design/95Gu7tsx2K-0F3oi/scene.splinecode" style={{ width: '100%', height: '100%' }} />
      </div>

      {/* Layered gradient and depth */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/70 via-white/40 to-white/60" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,180,0,0.15),transparent_50%)]" />

      {/* Content */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white shadow-lg shadow-orange-500/30">🏗️</span>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-800">شهر اعداد</h1>
              <p className="text-sm text-gray-600">بازی تمرینی شمارش ویژهٔ پایهٔ دوم و سوم</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {levels.map(l => (
              <button
                key={l.id}
                onClick={() => { setLevel(l.id); setBuilt([]); setRound(0); setFeedback(null); }}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-transform hover:-translate-y-0.5 ${level===l.id? 'bg-orange-600 text-white shadow-lg' : 'bg-white/80 text-gray-800 hover:bg-white shadow'}`}
              >
                {l.title}
              </button>
            ))}
          </div>
        </header>

        {/* Intro */}
        {!currentLevel && (
          <div className="mt-12 grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
            <div className="order-2 lg:order-1">
              <div className="rounded-2xl bg-white/80 p-6 shadow-xl backdrop-blur">
                <h2 className="mb-4 text-2xl font-bold text-gray-800">به شهر اعداد خوش آمدید</h2>
                <p className="text-gray-700 leading-8">
                  یک سطح را انتخاب کن. عددی نمایش داده می‌شود؛ گزینهٔ درست را انتخاب کن تا یک ساختمان رنگی جدید ساخته شود! با هر پاسخ درست، صدای جشن پخش می‌شود و پیشرفت تو در نوار بالا نشان داده می‌شود.
                </p>
                <ul className="mt-4 list-disc pr-6 text-gray-700">
                  <li>سطح ۱: شمارش ۱ تا ۵</li>
                  <li>سطح ۲: شمارش ۱ تا ۱۰</li>
                  <li>سطح ۳: شمارش ۱ تا ۲۰</li>
                </ul>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="rounded-2xl bg-white/60 p-4 text-center shadow-xl backdrop-blur">
                <div className="mx-auto w-fit rounded-2xl bg-white/70 p-3 shadow">
                  <AvatarKid mood="idle" />
                </div>
                <p className="mt-2 text-gray-700">کارگرهای کوچک آماده‌اند تا ساختمان‌های تازه بسازند!</p>
              </div>
            </div>
          </div>
        )}

        {/* Game area */}
        {currentLevel && (
          <main className="mt-6 grid flex-1 grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left: City */}
            <section className="lg:col-span-2">
              <div className="rounded-2xl bg-white/70 p-4 shadow-xl backdrop-blur">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-right text-lg font-bold text-gray-800">شهر رنگی تو</h3>
                  {/* Sound controls */}
                  <div className="flex items-center gap-2 text-xs text-gray-700">
                    <button onClick={() => setMuted(m => !m)} className="rounded-full bg-white px-2 py-1 shadow hover:bg-gray-50">
                      {muted ? '🔇' : '🔊'}
                    </button>
                    <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume} onChange={(e)=>setVolume(parseFloat(e.target.value))} className="accent-orange-500"/>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {built.length === 0 && (
                    <div className="col-span-full rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
                      هنوز ساختمانی ساخته نشده — جواب درست بده تا بسازیم! 🎉
                    </div>
                  )}
                  {built.map(b => (
                    <CityBuilding key={b.id} color={b.color} height={b.height} windows={b.windows} />
                  ))}
                </div>
              </div>
            </section>

            {/* Right: HUD and Question */}
            <section className="flex flex-col gap-4">
              {/* Progress */}
              <div className="rounded-2xl bg-white/80 p-4 shadow-xl backdrop-blur">
                <div className="mb-2 flex items-center justify-between text-sm text-gray-600">
                  <span>پیشرفت</span>
                  <span>{Math.min(round, totalRounds)} / {totalRounds}</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-500 to-pink-500 transition-all"
                    style={{ width: `${progress*100}%` }}
                  />
                </div>
              </div>

              {/* Child avatar + timer controls */}
              <div className={`rounded-2xl bg-white/90 p-4 shadow-xl backdrop-blur`}>
                <div className="flex items-center justify-between">
                  {/* Child avatar */}
                  <div className="flex items-center gap-2">
                    <AvatarKid mood={feedback==='right' ? 'happy' : feedback==='wrong' ? 'sad' : 'idle'} />
                    <span className="text-sm text-gray-600">کارگر کوچولو همراه توست!</span>
                  </div>

                  {/* Timed mode toggle */}
                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <label className="inline-flex cursor-pointer items-center gap-2">
                      <input type="checkbox" className="h-4 w-4 accent-orange-500" checked={timedMode} onChange={(e)=>{setTimedMode(e.target.checked)}} />
                      <span>حالت زمان‌دار</span>
                    </label>
                    {timedMode && (
                      <div className="flex items-center gap-2">
                        <span>⏱</span>
                        <input type="range" min={5} max={20} step={1} value={duration} onChange={(e)=>setDuration(parseInt(e.target.value))} className="w-28 accent-orange-500" />
                        <span className="w-10 text-center">{duration}s</span>
                      </div>
                    )}
                  </div>
                </div>
                {/* Timer bar */}
                {timedMode && (
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div className={`h-full rounded-full ${timeProgress < 0.35 ? 'bg-rose-500' : 'bg-emerald-500'} transition-all`} style={{ width: `${timeProgress*100}%` }} />
                  </div>
                )}
                <style>{`@keyframes shake{10%,90%{transform:translateX(-2px)}20%,80%{transform:translateX(3px)}30%,50%,70%{transform:translateX(-6px)}40%,60%{transform:translateX(6px)}}`}</style>
              </div>

              {/* Question Card */}
              <div key={shakeKey} className={`rounded-2xl p-5 shadow-xl backdrop-blur ${feedback==='wrong' ? 'animate-[shake_0.5s_ease-in-out]' : 'bg-white/90'}`} style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}>
                <div className="mb-2 flex items-center justify-between text-sm text-gray-600">
                  <span>عدد را بخوان و گزینهٔ درست را انتخاب کن</span>
                  {timedMode && <span className={`font-bold ${timeProgress < 0.35 ? 'text-rose-600' : 'text-gray-700'}`}>{timeLeft}s</span>}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-2xl">
                    <span>👧🏻</span>
                    <span>👦🏻</span>
                    <span>👷🏻‍♂️</span>
                  </div>
                  <div className="text-5xl font-black text-gray-800">{target}</div>
                </div>

                {/* Answer choices */}
                <div className="mt-4 grid grid-cols-5 gap-2">
                  {Array.from({ length: currentLevel.range }).map((_, i) => {
                    const n = i + 1
                    const isCorrect = feedback === 'right' && n === target
                    return (
                      <button
                        key={n}
                        onClick={() => handleAnswer(n)}
                        className={`h-12 rounded-xl font-bold transition-all focus:outline-none focus:ring-2 focus:ring-orange-400 ${isCorrect ? 'bg-green-500 text-white' : 'bg-white text-gray-800 hover:-translate-y-0.5 hover:bg-orange-50 shadow'}`}
                      >
                        {n}
                      </button>
                    )
                  })}
                </div>

                {feedback === 'right' && (
                  <div className="mt-3 rounded-lg bg-green-50 p-2 text-center text-green-700">آفرین! یک ساختمان جدید ساخته شد 🎊</div>
                )}
                {feedback === 'wrong' && (
                  <div className="mt-3 rounded-lg bg-rose-50 p-2 text-center text-rose-600">دوباره تلاش کن ✋</div>
                )}
              </div>

              <div className="flex gap-2">
                <button onClick={resetGame} className="flex-1 rounded-xl bg-gray-800 px-4 py-3 font-semibold text-white shadow hover:bg-black">شروع دوباره</button>
                <button onClick={startRound} className="rounded-xl bg-white px-4 py-3 font-semibold text-gray-800 shadow hover:bg-gray-50">سؤال بعدی</button>
              </div>
            </section>
          </main>
        )}

        {/* Footer */}
        <footer className="mt-8 text-center text-xs text-gray-600">
          ساخته شده برای تمرین شمارش | وب و موبایل
        </footer>
      </div>
    </div>
  )
}

export default App
