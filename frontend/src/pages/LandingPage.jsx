import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Shield, Zap, ArrowRight, Eye, Lock,
  CheckCircle, BarChart3, Globe, Upload
} from 'lucide-react'

/* ── Subtle Particle Canvas ── */
function ParticleCanvas() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf
    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)
    const particles = Array.from({ length: 55 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.2 + 0.3,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
    }))
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(59,130,246,0.25)'
        ctx.fill()
      })
      // Lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const d = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y)
          if (d < 120) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(59,130,246,${(1 - d / 120) * 0.08})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={ref} className="absolute inset-0 pointer-events-none" style={{ opacity: 1 }} />
}

const FEATURES = [
  {
    icon: Zap,
    color: '#3B82F6',
    bg: 'rgba(59,130,246,0.1)',
    title: 'Real-Time Detection',
    desc: 'CNN-powered XceptionNet model analyzes media in seconds with frame-level precision.',
  },
  {
    icon: Eye,
    color: '#06B6D4',
    bg: 'rgba(6,182,212,0.1)',
    title: 'Grad-CAM Visualization',
    desc: 'Visual explainability through heatmap overlays showing exact manipulation regions.',
  },
  {
    icon: BarChart3,
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,0.1)',
    title: 'Forensic Analytics',
    desc: 'Comprehensive dashboards with threat intelligence, history logs, and confidence metrics.',
  },
  {
    icon: Lock,
    color: '#10B981',
    bg: 'rgba(16,185,129,0.1)',
    title: 'Multi-Layer Analysis',
    desc: 'Audio sync, metadata inspection, and visual forensics combined into a unified threat score.',
  },
]

const STATS = [
  { value: '99.2%', label: 'Detection Accuracy' },
  { value: '<2s',   label: 'Analysis Speed' },
  { value: '50+',   label: 'Forensic Signals' },
  { value: '4K',    label: 'Resolution Support' },
]

const TRUSTED = ['CNN Architecture', 'XceptionNet', 'Grad-CAM XAI', 'FastAPI Backend', 'TensorFlow 2.x']

export default function LandingPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0B1220' }}>

      {/* ── Navbar ── */}
      <nav className="relative z-20 flex items-center justify-between px-8 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(11,18,32,0.9)', backdropFilter: 'blur(16px)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>
            <Shield size={16} className="text-blue-400" />
          </div>
          <span className="font-bold text-white text-sm">TruthLens AI</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="badge badge-success text-xs"><div className="status-dot online" />Live</span>
          <button onClick={() => navigate('/scan')} className="btn btn-primary btn-sm">
            Start Analysis <ArrowRight size={14} />
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative flex-1 flex items-center justify-center overflow-hidden"
        style={{ minHeight: '88vh' }}>
        <ParticleCanvas />

        {/* Gradient orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full opacity-[0.06]"
            style={{ background: 'radial-gradient(circle, #2563EB, transparent 70%)', filter: 'blur(60px)' }} />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-[0.04]"
            style={{ background: 'radial-gradient(circle, #06B6D4, transparent 70%)', filter: 'blur(50px)' }} />
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>

            {/* Tag */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-xs font-medium"
              style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(59,130,246,0.25)', color: '#60A5FA' }}>
              <Zap size={11} />AI-Powered Media Forensics Platform
            </div>

            {/* Headline */}
            <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight" style={{ letterSpacing: '-0.03em' }}>
              Detect Deepfakes with{' '}
              <span style={{
                background: 'linear-gradient(135deg, #3B82F6, #06B6D4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                AI Precision
              </span>
            </h1>

            <p className="text-lg mb-10 max-w-2xl mx-auto leading-relaxed" style={{ color: '#94A3B8' }}>
              Enterprise-grade deepfake detection and digital media verification.
              Analyze images and videos with XceptionNet CNN, Grad-CAM explainability,
              and multi-layer forensic intelligence.
            </p>

            {/* CTAs */}
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <button onClick={() => navigate('/scan')} className="btn btn-primary btn-lg">
                <Upload size={16} /> Analyze Media
              </button>
              <button onClick={() => navigate('/analytics')} className="btn btn-secondary btn-lg">
                <BarChart3 size={16} /> View Dashboard
              </button>
            </div>

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-2 mt-10 flex-wrap">
              {TRUSTED.map(t => (
                <span key={t} className="badge badge-blue text-xs">
                  <CheckCircle size={10} />{t}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <motion.section
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className="py-12 px-8"
        style={{ background: 'rgba(17,24,39,0.7)', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-3xl font-bold mb-1"
                style={{ color: '#3B82F6', letterSpacing: '-0.03em' }}>{value}</div>
              <div className="text-sm" style={{ color: '#6B7280' }}>{label}</div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ── Features ── */}
      <section className="py-20 px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="section-label mb-3">Capabilities</div>
            <h2 className="text-3xl font-bold text-white" style={{ letterSpacing: '-0.02em' }}>
              Built for forensic professionals
            </h2>
            <p className="mt-3 text-base max-w-xl mx-auto" style={{ color: '#94A3B8' }}>
              A complete media verification toolkit combining deep learning with interpretable AI.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {FEATURES.map(({ icon: Icon, color, bg, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i + 0.3 }}
                className="card card-hover p-6"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: bg }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#94A3B8' }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-16 px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="card p-10" style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-5"
              style={{ background: 'rgba(37,99,235,0.15)' }}>
              <Shield size={24} className="text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Ready to verify media?</h2>
            <p className="mb-6 text-sm" style={{ color: '#94A3B8' }}>
              Upload any image or video for immediate AI forensic analysis.
            </p>
            <button onClick={() => navigate('/scan')} className="btn btn-primary btn-lg mx-auto">
              Start Free Analysis <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-6 text-center"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-xs" style={{ color: '#374151' }}>
          TruthLens AI · Enterprise Deepfake Detection · Powered by XceptionNet & TensorFlow
        </p>
      </footer>
    </div>
  )
}
