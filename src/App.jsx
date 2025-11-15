import React, { useMemo, useState, useEffect, useRef } from 'react'
import Spline from '@splinetool/react-spline'

function useCelebrationSound() {
  const ctxRef = useRef(null)

  const play = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!ctxRef.current) ctxRef.current = new AudioCtx()
      const ctx = ctxRef.current

      const now = ctx.currentTime
      const notes = [523.25, 659.25, 783.99] // C5, E5, G5
      notes.forEach((freq, i) => {
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.type = 'triangle'
        o.frequency.value = freq
        o.connect(g)
        g.connect(ctx.destination)
        const start = now + i * 0.06
        const end = start + 0.25
        g.gain.setValueAtTime(0.0001, start)
        g.gain.exponentialRampToValueAtTime(0.4, start + 0.03)
        g.gain.exponentialRampToValueAtTime(0.0001, end)
        o.start(start)
        o.stop(end)
      })
    } catch (e) {
      // ignore if autoplay blocked
    }
  }

  return play
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
  const [built, setBuilt] = useState([]) // array of built buildings
  const [feedback, setFeedback] = useState(null) // 'right' | 'wrong'
  const [shakeKey, setShakeKey] = useState(0)
  const playCelebrate = useCelebrationSound()

  const totalRounds = 10

  const currentLevel = useMemo(() => levels.find(l => l.id === level) || null, [level])

  useEffect(() => {
    if (currentLevel) {
      startRound()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLevel?.id])

  const startRound = () => {
    if (!currentLevel) return
    const nextTarget = 1 + Math.floor(Math.random() * currentLevel.range)
    setTarget(nextTarget)
    setRound(r => r + 1)
    setFeedback(null)
  }

  const handleAnswer = (n) => {
    if (!currentLevel) return
    if (n === target) {
      setFeedback('right')
      playCelebrate()
      // add a new colorful building tile
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
      setTimeout(() => setFeedback(null), 600)
    }
  }

  const resetGame = () => {
    setBuilt([])
    setRound(0)
    setFeedback(null)
    if (currentLevel) startRound()
  }

  const progress = Math.min(1, round / totalRounds)

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50">
      {/* 3D Hero */}
      <div className="absolute inset-0 opacity-90">
        <Spline scene="https://prod.spline.design/95Gu7tsx2K-0F3oi/scene.splinecode" style={{ width: '100%', height: '100%' }} />
      </div>

      {/* Soft gradient overlay to improve contrast (won't block 3D interaction) */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/70 via-white/40 to-white/60" />

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
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${level===l.id? 'bg-orange-600 text-white' : 'bg-white/80 text-gray-800 hover:bg-white'} shadow`}
              >
                {l.title}
              </button>
            ))}
          </div>
        </header>

        {/* Intro when no level selected */}
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
                <div className="text-7xl">👦🏻👷🏻‍♀️</div>
                <p className="mt-2 text-gray-700">کارگرهای کوچک آماده‌اند تا ساختمان‌های تازه بسازند!</p>
              </div>
            </div>
          </div>
        )}

        {/* Game area */}
        {currentLevel && (
          <main className="mt-6 grid flex-1 grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left: City (built buildings) */}
            <section className="lg:col-span-2">
              <div className="rounded-2xl bg-white/70 p-4 shadow-xl backdrop-blur">
                <h3 className="mb-3 text-right text-lg font-bold text-gray-800">شهر رنگی تو</h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {built.length === 0 && (
                    <div className="col-span-full rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
                      هنوز ساختمانی ساخته نشده — جواب درست بده تا بسازیم! 🎉
                    </div>
                  )}
                  {built.map(b => (
                    <div key={b.id} className="group relative flex h-48 items-end overflow-hidden rounded-xl bg-gradient-to-t from-black/10 to-transparent">
                      <div
                        className="mx-auto w-11/12 rounded-t-md shadow-lg transition-transform duration-500 group-hover:-translate-y-1"
                        style={{ background: b.color, height: b.height }}
                      >
                        <div className="grid grid-cols-3 gap-1 p-2">
                          {Array.from({ length: b.windows }).map((_, i) => (
                            <span key={i} className="h-3 w-full rounded-sm bg-white/70 shadow-inner" />
                          ))}
                        </div>
                      </div>
                      <span className="absolute left-2 top-2 select-none rounded-full bg-white/80 px-2 py-0.5 text-xs font-bold text-gray-700 shadow">
                        +۱ ساختمان
                      </span>
                    </div>
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

              {/* Question Card */}
              <div key={shakeKey} className={`rounded-2xl p-5 shadow-xl backdrop-blur ${feedback==='wrong' ? 'animate-[shake_0.5s_ease-in-out]' : 'bg-white/90'}`} style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}>
                <style>{`@keyframes shake{10%,90%{transform:translateX(-1px)}20%,80%{transform:translateX(2px)}30%,50%,70%{transform:translateX(-4px)}40%,60%{transform:translateX(4px)}}`}</style>
                <div className="mb-2 text-right text-sm text-gray-600">عدد را بخوان و گزینهٔ درست را انتخاب کن</div>
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
                        className={`h-12 rounded-xl font-bold transition-all focus:outline-none focus:ring-2 focus:ring-orange-400 ${isCorrect ? 'bg-green-500 text-white' : 'bg-white text-gray-800 hover:bg-orange-50'} shadow`}
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
