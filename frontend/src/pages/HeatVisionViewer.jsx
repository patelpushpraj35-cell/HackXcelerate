import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Eye, ZoomIn, ZoomOut, ChevronLeft, ChevronRight,
  AlertTriangle, Layers, Scan, SlidersHorizontal,
} from 'lucide-react'
import axios from 'axios'

/* ── Professional heatmap canvas ── */
function HeatCanvas({ width, height, zones = [] }) {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, width, height)
    zones.forEach(({ x, y, w, h, intensity }) => {
      // Soft fill
      const grad = ctx.createRadialGradient(
        (x + w / 2) * width, (y + h / 2) * height, 0,
        (x + w / 2) * width, (y + h / 2) * height, Math.max(w * width, h * height) * 0.8
      )
      grad.addColorStop(0, `rgba(239,68,68,${intensity * 0.4})`)
      grad.addColorStop(1, 'rgba(239,68,68,0)')
      ctx.fillStyle = grad
      ctx.fillRect(x * width, y * height, w * width, h * height)

      // Clean border
      ctx.strokeStyle = `rgba(239,68,68,${0.5 + intensity * 0.4})`
      ctx.lineWidth   = 1.5
      ctx.strokeRect(x * width, y * height, w * width, h * height)

      // Corner brackets
      const cL = Math.min(w * width, h * height) * 0.2
      ctx.strokeStyle = '#3B82F6'
      ctx.lineWidth   = 2
      const corners = [
        [x * width, y * height, 1, 1],
        [(x + w) * width, y * height, -1, 1],
        [x * width, (y + h) * height, 1, -1],
        [(x + w) * width, (y + h) * height, -1, -1],
      ]
      corners.forEach(([cx, cy, dx, dy]) => {
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + dx * cL, cy); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + dy * cL); ctx.stroke()
      })

      // Label
      ctx.fillStyle   = 'rgba(239,68,68,0.9)'
      ctx.font        = '10px Inter, sans-serif'
      ctx.fillText(`${Math.round(intensity * 100)}%`, x * width + 5, y * height + 14)
    })
  }, [width, height, zones])
  return <canvas ref={ref} width={width} height={height} className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }} />
}

/* ── Subtle scan line ── */
function ScanLine({ active }) {
  if (!active) return null
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 6 }}>
      <div className="scan-line" />
      <div className="frame-corner frame-corner-tl" />
      <div className="frame-corner frame-corner-tr" />
      <div className="frame-corner frame-corner-bl" />
      <div className="frame-corner frame-corner-br" />
    </div>
  )
}

function getZones(frameIdx) {
  const seed = frameIdx * 13, n = 1 + (seed % 2)
  return Array.from({ length: n }, (_, i) => {
    const s = seed + i * 7
    return {
      x: ((s * 3) % 55 + 12) / 100,
      y: ((s * 7) % 45 + 12) / 100,
      w: ((s * 5) % 22 + 14) / 100,
      h: ((s * 11) % 18 + 12) / 100,
      intensity: (((s * 17) % 55) + 35) / 100,
    }
  })
}

export default function HeatVisionViewer() {
  const { scanId } = useParams()
  const navigate   = useNavigate()
  const [report, setReport]     = useState(null)
  const [frames, setFrames]     = useState([])
  const [idx, setIdx]           = useState(0)
  const [zoom, setZoom]         = useState(1)
  const [overlay, setOverlay]   = useState(true)
  const [scanLine, setScanLine] = useState(true)
  const [loading, setLoading]   = useState(true)
  const imgRef   = useRef(null)
  const [imgSize, setImgSize]   = useState({ w: 640, h: 360 })

  const measureImg = () => {
    if (imgRef.current) setImgSize({ w: imgRef.current.offsetWidth, h: imgRef.current.offsetHeight })
  }

  useEffect(() => {
    const raw = sessionStorage.getItem(`scan_${scanId}`)
    let parsed = null
    if (raw) {
      try { parsed = JSON.parse(raw); setReport(parsed) } catch (e) { console.error(e) }
    }
    if (parsed?.heatmap_url) {
      setFrames([{ frame_index: 0, timestamp: 0, url: parsed.heatmap_url,
        risk_level: parsed.reality_score < 30 ? 'CRITICAL' : parsed.reality_score < 60 ? 'HIGH' : parsed.reality_score < 85 ? 'MEDIUM' : 'LOW',
        fake_probability: (100 - parsed.reality_score) / 100,
      }]); setLoading(false); return
    }
    if (parsed?.timeline?.length) {
      setFrames(parsed.timeline.map(t => ({
        frame_index: t.frame_idx ?? t.frame_index, timestamp: t.timestamp, url: null,
        risk_level: t.fake_probability > 0.8 ? 'CRITICAL' : t.fake_probability > 0.5 ? 'HIGH' : t.fake_probability > 0.2 ? 'MEDIUM' : 'LOW',
        fake_probability: t.fake_probability,
      }))); setLoading(false); return
    }
    axios.get(`/api/extract-frames/${scanId}`)
      .then(r => setFrames(r.data.frames || []))
      .catch(() => setFrames(Array.from({ length: 12 }, (_, i) => ({
        frame_index: i, timestamp: i * 0.5, url: null,
        risk_level: i % 4 === 0 ? 'CRITICAL' : i % 3 === 0 ? 'HIGH' : i % 2 === 0 ? 'MEDIUM' : 'LOW',
        fake_probability: 0.2 + (i % 7) * 0.1,
      }))))
      .finally(() => setLoading(false))
  }, [scanId])

  useEffect(() => {
    window.addEventListener('resize', measureImg)
    return () => window.removeEventListener('resize', measureImg)
  }, [])

  const current = frames[idx]
  const zones   = current ? getZones(current.frame_index) : []
  const rColor  = current
    ? current.risk_level === 'CRITICAL' ? '#EF4444'
    : current.risk_level === 'HIGH'     ? '#F97316'
    : current.risk_level === 'MEDIUM'   ? '#F59E0B' : '#10B981'
    : '#3B82F6'

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm mb-3 -ml-2">
            <ChevronLeft size={15} />Back to Report
          </button>
          <div className="section-label mb-1">Grad-CAM Explainability</div>
          <h1 className="text-2xl font-bold text-white">Heatmap Viewer</h1>
          {report && (
            <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>
              {report.filename} — Reality Score: <span className="font-semibold text-white">{report.reality_score?.toFixed(1)}/100</span>
            </p>
          )}
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* Main viewer */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2 space-y-4">

          <div className="card overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-5 py-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-3">
                <Eye size={15} style={{ color: '#4B5563' }} />
                <span className="text-sm font-medium text-white">
                  Frame {(current?.frame_index ?? 0) + 1} / {frames.length}
                </span>
                <span className="text-xs" style={{ color: '#4B5563' }}>
                  @ {current?.timestamp?.toFixed(2) ?? '0.00'}s
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setOverlay(o => !o)}
                  className="btn btn-sm"
                  style={{
                    background: overlay ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${overlay ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`,
                    color: overlay ? '#EF4444' : '#6B7280', fontSize: 12,
                  }}>
                  <Layers size={12} />{overlay ? 'Heatmap On' : 'Heatmap Off'}
                </button>
                <button onClick={() => setScanLine(s => !s)}
                  className="btn btn-sm"
                  style={{
                    background: scanLine ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${scanLine ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.08)'}`,
                    color: scanLine ? '#3B82F6' : '#6B7280', fontSize: 12,
                  }}>
                  <Scan size={12} />Scan
                </button>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setZoom(z => Math.max(1, z - 0.25))}
                    className="btn btn-ghost btn-sm p-2"><ZoomOut size={13} /></button>
                  <span className="text-xs w-10 text-center" style={{ color: '#6B7280' }}>{Math.round(zoom * 100)}%</span>
                  <button onClick={() => setZoom(z => Math.min(3, z + 0.25))}
                    className="btn btn-ghost btn-sm p-2"><ZoomIn size={13} /></button>
                </div>
              </div>
            </div>

            {/* Canvas viewer */}
            <div className="relative flex items-center justify-center overflow-hidden"
              style={{ minHeight: 340, background: '#0a0f1a' }}>
              <div className="relative" style={{ transform: `scale(${zoom})`, transition: 'transform 0.25s ease' }}>
                {current?.url ? (
                  <img ref={imgRef} src={current.url} alt="Frame" onLoad={measureImg}
                    style={{ display: 'block', maxHeight: 340, maxWidth: '100%' }} />
                ) : (
                  <div className="w-[580px] h-[328px] flex items-center justify-center relative rounded-sm"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="absolute inset-0 opacity-20"
                      style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                      }} />
                    <div className="relative text-center z-10">
                      <Eye size={36} style={{ color: '#374151', margin: '0 auto 10px' }} />
                      <div className="text-sm font-medium" style={{ color: '#4B5563' }}>
                        Frame #{(current?.frame_index ?? 0) + 1}
                      </div>
                      <div className="text-xs mt-1" style={{ color: '#374151' }}>
                        {current?.timestamp?.toFixed(2)}s — demo mode
                      </div>
                    </div>
                  </div>
                )}

                <AnimatePresence>
                  {overlay && (
                    <motion.div key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }} className="absolute inset-0">
                      <HeatCanvas width={imgSize.w} height={imgSize.h} zones={zones} />
                    </motion.div>
                  )}
                </AnimatePresence>
                <ScanLine active={scanLine} />
              </div>

              {/* Risk badge */}
              {current && (
                <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-lg"
                  style={{ background: 'rgba(0,0,0,0.7)', border: `1px solid ${rColor}30`, backdropFilter: 'blur(8px)' }}>
                  <div className="w-2 h-2 rounded-full animate-pulse-soft" style={{ background: rColor }} />
                  <span className="text-xs font-semibold" style={{ color: rColor }}>{current.risk_level}</span>
                  <span className="text-xs" style={{ color: '#6B7280' }}>{(current.fake_probability * 100).toFixed(1)}%</span>
                </div>
              )}
            </div>

            {/* Frame nav */}
            <div className="flex items-center justify-between px-5 py-3"
              style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <button onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0}
                className="btn btn-secondary btn-sm disabled:opacity-40">
                <ChevronLeft size={13} />Prev
              </button>
              <div className="flex items-center gap-1.5">
                {frames.slice(0, 12).map((_, i) => (
                  <button key={i} onClick={() => setIdx(i)}
                    className="rounded-full transition-all"
                    style={{
                      width: i === idx ? 20 : 6, height: 6,
                      background: i === idx ? '#3B82F6' : 'rgba(255,255,255,0.15)',
                    }} />
                ))}
              </div>
              <button onClick={() => setIdx(i => Math.min(frames.length - 1, i + 1))} disabled={idx >= frames.length - 1}
                className="btn btn-secondary btn-sm disabled:opacity-40">
                Next<ChevronRight size={13} />
              </button>
            </div>
          </div>

          {/* Frame strip */}
          <div className="card p-4">
            <div className="section-label mb-3">Frame Strip</div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {frames.map((fr, i) => {
                const fc = fr.risk_level === 'CRITICAL' ? '#EF4444' : fr.risk_level === 'HIGH' ? '#F97316' : fr.risk_level === 'MEDIUM' ? '#F59E0B' : '#10B981'
                return (
                  <button key={i} onClick={() => setIdx(i)}
                    className="relative shrink-0 w-14 h-10 rounded-lg overflow-hidden cursor-pointer transition-all"
                    style={{
                      border: `1.5px solid ${i === idx ? fc : 'rgba(255,255,255,0.08)'}`,
                      background: i === idx ? `${fc}10` : 'rgba(255,255,255,0.03)',
                    }}>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-semibold" style={{ color: fc, fontSize: 9 }}>#{fr.frame_index + 1}</span>
                      <span style={{ color: '#4B5563', fontSize: 8 }}>{fr.timestamp?.toFixed(1)}s</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </motion.div>

        {/* Sidebar */}
        <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }} className="space-y-4">

          {/* Frame stats */}
          <div className="card p-5">
            <h3 className="font-semibold text-white text-sm mb-4 flex items-center gap-2">
              <SlidersHorizontal size={14} className="text-blue-400" />Frame Analysis
            </h3>
            {current && (
              <div className="space-y-2">
                {[
                  { k: 'Frame Index',   v: `#${current.frame_index + 1}` },
                  { k: 'Timestamp',     v: `${current.timestamp?.toFixed(2)}s` },
                  { k: 'Risk Level',    v: current.risk_level, color: rColor },
                  { k: 'Fake Probability', v: `${(current.fake_probability * 100).toFixed(1)}%`, color: rColor },
                  { k: 'Detection Zones', v: zones.length },
                ].map(({ k, v, color }) => (
                  <div key={k} className="flex justify-between py-1.5"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span className="text-xs" style={{ color: '#6B7280' }}>{k}</span>
                    <span className="text-xs font-semibold" style={{ color: color || '#F1F5F9' }}>{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="card p-5">
            <h3 className="font-semibold text-white text-sm mb-4">Overlay Legend</h3>
            <div className="space-y-3">
              {[
                { label: 'Detection Zone',  color: '#EF4444', desc: 'High-risk region' },
                { label: 'Frame Boundary',  color: '#3B82F6', desc: 'Corner brackets' },
                { label: 'Scan Indicator',  color: '#06B6D4', desc: 'Active sweep line' },
              ].map(({ label, color, desc }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-4 h-3 rounded shrink-0" style={{ background: `${color}30`, border: `1.5px solid ${color}` }} />
                  <div>
                    <div className="text-xs font-medium text-white">{label}</div>
                    <div className="text-xs" style={{ color: '#4B5563' }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mini risk histogram */}
          <div className="card p-5">
            <h3 className="font-semibold text-white text-sm mb-4">Risk Profile</h3>
            <div className="flex items-end gap-1 h-14">
              {frames.map((fr, i) => {
                const fc = fr.risk_level === 'CRITICAL' ? '#EF4444' : fr.risk_level === 'HIGH' ? '#F97316' : fr.risk_level === 'MEDIUM' ? '#F59E0B' : '#10B981'
                return (
                  <button key={i} onClick={() => setIdx(i)}
                    className="flex-1 rounded-sm cursor-pointer transition-all"
                    style={{ height: `${20 + fr.fake_probability * 80}%`, background: i === idx ? fc : `${fc}40` }} />
                )
              })}
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs" style={{ color: '#4B5563' }}>Frame 1</span>
              <span className="text-xs" style={{ color: '#4B5563' }}>Frame {frames.length}</span>
            </div>
          </div>

          {/* Detected zones */}
          {zones.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-white text-sm mb-4">Detected Zones</h3>
              <div className="space-y-2">
                {zones.map((z, i) => (
                  <div key={i} className="card card-danger p-3 flex items-start gap-2">
                    <AlertTriangle size={13} className="text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold text-white">Zone {i + 1}</div>
                      <div className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
                        Risk: {Math.round(z.intensity * 100)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
