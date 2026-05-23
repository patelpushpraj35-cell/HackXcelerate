import { useNavigate } from 'react-router-dom'
import { Shield, Upload, BarChart3, CheckCircle, Zap, Eye, Lock, ArrowRight } from 'lucide-react'

const FEATURES = [
  { icon: Zap,         color: '#2563EB', label: 'Real-Time Detection',   desc: 'XceptionNet CNN analyzes frames in under 2 seconds.' },
  { icon: Eye,         color: '#7C3AED', label: 'Grad-CAM Heatmaps',     desc: 'Visualize exactly which regions triggered detection.' },
  { icon: BarChart3,   color: '#059669', label: 'Forensic Dashboard',     desc: 'Full analytics with charts, history, and confidence scores.' },
  { icon: Lock,        color: '#DC2626', label: 'Multi-Layer Analysis',   desc: 'Visual, audio, and metadata forensic signals combined.' },
]

const STATS = [
  { v: '99.2%', l: 'Accuracy' },
  { v: '<2s',   l: 'Analysis Speed' },
  { v: '50+',   l: 'Forensic Signals' },
  { v: '4K',    l: 'Max Resolution' },
]

export default function LandingPage() {
  const nav = useNavigate()
  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>

      {/* ── Header ── */}
      <div style={{ background: '#1E40AF', padding: '0 40px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={18} color="white" />
          </div>
          <span style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>TruthLens AI</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => nav('/analytics')} className="btn btn-white" style={{ fontSize: 13, padding: '8px 18px' }}>
            Dashboard
          </button>
          <button onClick={() => nav('/scan')} className="btn btn-blue" style={{ fontSize: 13, padding: '8px 18px' }}>
            Start Analysis
          </button>
        </div>
      </div>

      {/* ── Hero ── */}
      <div style={{ background: 'white', padding: '70px 40px', textAlign: 'center', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EFF6FF', color: '#2563EB', borderRadius: 20, padding: '5px 14px', fontSize: 13, fontWeight: 600, marginBottom: 24 }}>
          <Zap size={13} /> AI-Powered Media Forensics
        </div>
        <h1 style={{ fontSize: 44, fontWeight: 800, color: '#0F172A', lineHeight: 1.15, maxWidth: 700, margin: '0 auto 18px', letterSpacing: '-0.02em' }}>
          Detect Deepfakes with <span style={{ color: '#2563EB' }}>AI Precision</span>
        </h1>
        <p style={{ fontSize: 17, color: '#64748B', maxWidth: 560, margin: '0 auto 36px', lineHeight: 1.65 }}>
          Enterprise-grade deepfake detection using XceptionNet CNN, Grad-CAM explainability, and multi-layer forensic intelligence.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => nav('/scan')} className="btn btn-blue" style={{ padding: '14px 32px', fontSize: 15 }}>
            <Upload size={17} /> Analyze Media <ArrowRight size={16} />
          </button>
          <button onClick={() => nav('/analytics')} className="btn btn-outline" style={{ padding: '14px 32px', fontSize: 15 }}>
            <BarChart3 size={17} /> View Dashboard
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ background: '#2563EB', padding: '36px 40px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
          {STATS.map(({ v, l }, i) => (
            <div key={l} style={{ textAlign: 'center', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.2)' : 'none' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>{v}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features ── */}
      <div style={{ padding: '64px 40px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: 10 }}>Capabilities</div>
          <h2 style={{ fontSize: 30, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em' }}>Built for forensic professionals</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
          {FEATURES.map(({ icon: Icon, color, label, desc }) => (
            <div key={label} className="card" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={20} color={color} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#0F172A', marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 14, color: '#64748B', lineHeight: 1.55 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA ── */}
      <div style={{ background: '#1E40AF', padding: '60px 40px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: 'white', marginBottom: 12 }}>Ready to verify media?</h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 28, fontSize: 15 }}>Upload any image or video for immediate AI forensic analysis.</p>
        <button onClick={() => nav('/scan')} className="btn" style={{ background: 'white', color: '#1E40AF', fontWeight: 700, padding: '14px 32px', fontSize: 15, borderRadius: 8 }}>
          Start Analysis <ArrowRight size={16} />
        </button>
      </div>

      {/* Footer */}
      <div style={{ background: '#0F172A', padding: '20px 40px', textAlign: 'center' }}>
        <p style={{ color: '#475569', fontSize: 13 }}>TruthLens AI · Deepfake Detection Platform · Powered by XceptionNet & TensorFlow</p>
      </div>
    </div>
  )
}
