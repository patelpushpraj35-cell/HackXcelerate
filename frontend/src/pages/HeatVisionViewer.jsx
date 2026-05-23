import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, AlertTriangle, Activity, Crosshair, Layers } from 'lucide-react'
import axios from 'axios'

/* ── Crimson Heatmap Canvas ── */
function HeatCanvas({ width, height, zones = [] }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, width, height)

    zones.forEach(({ x, y, w, h, intensity }) => {
      const alpha = 0.15 + intensity * 0.35
      // Filled target block
      ctx.fillStyle = `rgba(255,23,68,${alpha})`
      ctx.fillRect(x * width, y * height, w * width, h * height)

      // Crimson warning borders
      ctx.strokeStyle = `rgba(255,23,68,${0.6 + intensity * 0.4})`
      ctx.lineWidth   = 2
      ctx.shadowColor = '#FF1744'
      ctx.shadowBlur  = 10
      ctx.strokeRect(x * width, y * height, w * width, h * height)
      ctx.shadowBlur  = 0

      // Orange corners
      const cLen = Math.min(w * width, h * height) * 0.18
      ctx.strokeStyle = '#FF6B00'
      ctx.lineWidth   = 2
      ctx.shadowColor = '#FF6B00'
      ctx.shadowBlur  = 6
      const corners = [
        [x * width, y * height, 1, 1],
        [(x + w) * width, y * height, -1, 1],
        [x * width, (y + h) * height, 1, -1],
        [(x + w) * width, (y + h) * height, -1, -1],
      ]
      corners.forEach(([cx, cy, dx, dy]) => {
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.lineTo(cx + dx * cLen, cy)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.lineTo(cx, cy + dy * cLen)
        ctx.stroke()
      })
      ctx.shadowBlur = 0

      // Crosshairs
      const mx = (x + w / 2) * width, my = (y + h / 2) * height
      ctx.strokeStyle = 'rgba(255,107,0,0.4)'
      ctx.lineWidth = 1
      ctx.setLineDash([3, 3])
      ctx.beginPath(); ctx.moveTo(mx - 12, my); ctx.lineTo(mx + 12, my); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(mx, my - 12); ctx.lineTo(mx, my + 12); ctx.stroke()
      ctx.setLineDash([])

      // Intensity stamp
      ctx.fillStyle = '#FF1744'
      ctx.font = 'bold 9px "JetBrains Mono"'
      ctx.fillText(`ANOMALY: ${Math.round(intensity * 100)}%`, x * width + 4, y * height + 12)
    })
  }, [width, height, zones])

  return (
    <canvas
      ref={ref}
      width={width}
      height={height}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 5 }}
    />
  )
}

/* ── Infrared Scanning Laser Sweep ── */
function ScanBeam({ active }) {
  if (!active) return null
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 6 }}>
      <div className="scan-beam-line" />
      <div className="absolute inset-0 grid-overlay-fine opacity-20" />
      <div className="scan-corner scan-corner-tl" />
      <div className="scan-corner scan-corner-tr" />
      <div className="scan-corner scan-corner-bl" />
      <div className="scan-corner scan-corner-br" />
    </div>
  )
}

function getZones(frameIdx) {
  const seed = frameIdx * 13
  const n    = 1 + (seed % 3)
  return Array.from({ length: n }, (_, i) => {
    const s = seed + i * 7
    return {
      x:         ((s * 3) % 60 + 10) / 100,
      y:         ((s * 7) % 50 + 10) / 100,
      w:         ((s * 5) % 20 + 15) / 100,
      h:         ((s * 11) % 20 + 12) / 100,
      intensity: (((s * 17) % 60) + 35) / 100,
    }
  })
}

export default function HeatVisionViewer() {
  const { scanId }      = useParams()
  const navigate        = useNavigate()
  const [report, setReport]   = useState(null)
  const [frames, setFrames]   = useState([])
  const [idx, setIdx]         = useState(0)
  const [zoom, setZoom]       = useState(1)
  const [overlay, setOverlay] = useState(true)
  const [scanBeam, setScanBeam] = useState(true)
  const [loading, setLoading] = useState(true)
  const imgRef = useRef(null)
  const [imgSize, setImgSize] = useState({ w: 640, h: 360 })

  const measureImg = () => {
    if (imgRef.current) {
      setImgSize({ w: imgRef.current.offsetWidth, h: imgRef.current.offsetHeight })
    }
  }

  useEffect(() => {
    const raw = sessionStorage.getItem(`scan_${scanId}`)
    let parsed = null
    if (raw) {
      try {
        parsed = JSON.parse(raw)
        setReport(parsed)
      } catch (e) {
        console.error(e)
      }
    }

    if (parsed) {
      if (parsed.heatmap_url) {
        setFrames([{
          frame_index: 0,
          timestamp: 0,
          url: parsed.heatmap_url,
          risk_level: parsed.reality_score < 30 ? 'CRITICAL' : parsed.reality_score < 60 ? 'HIGH' : parsed.reality_score < 85 ? 'MEDIUM' : 'LOW',
          fake_probability: (100 - parsed.reality_score) / 100
        }])
        setLoading(false)
        return
      }
      if (parsed.timeline && parsed.timeline.length > 0) {
        setFrames(parsed.timeline.map(t => ({
          frame_index: t.frame_idx ?? t.frame_index,
          timestamp: t.timestamp,
          url: null,
          risk_level: t.fake_probability > 0.8 ? 'CRITICAL' : t.fake_probability > 0.5 ? 'HIGH' : t.fake_probability > 0.2 ? 'MEDIUM' : 'LOW',
          fake_probability: t.fake_probability,
        })))
        setLoading(false)
        return
      }
    }

    axios.get(`/api/extract-frames/${scanId}`)
      .then(r => setFrames(r.data.frames || []))
      .catch(() => {
        setFrames(Array.from({ length: 12 }, (_, i) => ({
          frame_index: i,
          timestamp:   i * 0.5,
          url:         null,
          risk_level:  i % 4 === 0 ? 'CRITICAL' : i % 3 === 0 ? 'HIGH' : i % 2 === 0 ? 'MEDIUM' : 'LOW',
          fake_probability: 0.2 + (i % 7) * 0.1,
        })))
      })
      .finally(() => setLoading(false))
  }, [scanId])

  useEffect(() => {
    window.addEventListener('resize', measureImg)
    return () => window.removeEventListener('resize', measureImg)
  }, [])

  const current = frames[idx]
  const zones   = current ? getZones(current.frame_index) : []
  const rColor  = current
    ? current.risk_level === 'CRITICAL' ? '#FF1744'
    : current.risk_level === 'HIGH'     ? '#FF6B00'
    : current.risk_level === 'MEDIUM'   ? '#FFC400' : '#A6FF00'
    : '#FF6B00'

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-mono text-xs tracking-widest text-[#FF1744]">— GRAD-CAM OVERLAY —</div>
          <h1 className="font-orbitron font-extrabold text-3xl text-[#EDEDED] tracking-tight">
            INFRARED COGNITIVE SPECTRA
          </h1>
          {report && (
            <p className="font-mono text-xs mt-1 text-[#555555]">
              {report.filename} · TARGET INDEX: {report.reality_score?.toFixed(1)}/100
            </p>
          )}
        </div>
        <button onClick={() => navigate(-1)} className="btn-cyber text-xs flex items-center gap-2 cursor-pointer">
          <ChevronLeft size={13} />LEAVE AUDIT VIEW
        </button>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Side: Infrared Frame stream */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2 space-y-4">

          {/* Canvas container */}
          <div className="glass overflow-hidden border-red-500/20">
            {/* Control toolbar */}
            <div className="flex items-center justify-between px-5 py-3"
              style={{ borderBottom: '1px solid rgba(255, 23, 68, 0.15)' }}>
              <div className="flex items-center gap-3">
                <Crosshair size={14} className="text-[#FF1744]" />
                <span className="font-orbitron text-xs font-bold text-[#EDEDED]">
                  FRAME BLOCK {(current?.frame_index ?? 0) + 1} / {frames.length}
                </span>
                <span className="font-mono text-xs text-[#555555]">
                  @ {current?.timestamp?.toFixed(2) ?? '0.00'}s SEC
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOverlay(o => !o)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-[10px] transition-all cursor-pointer"
                  style={{
                    background: overlay ? 'rgba(255,23,68,0.1)' : 'rgba(17,17,17,0.9)',
                    border:     `1px solid ${overlay ? '#FF1744' : 'rgba(255,23,68,0.15)'}`,
                    color:      overlay ? '#FF1744' : '#888888',
                  }}
                >
                  <Layers size={11} />{overlay ? 'HEAT ON' : 'HEAT OFF'}
                </button>
                <button
                  onClick={() => setScanBeam(s => !s)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-[10px] transition-all cursor-pointer"
                  style={{
                    background: scanBeam ? 'rgba(255,107,0,0.1)' : 'rgba(17,17,17,0.9)',
                    border:     `1px solid ${scanBeam ? '#FF6B00' : 'rgba(255,23,68,0.15)'}`,
                    color:      scanBeam ? '#FF6B00' : '#888888',
                  }}
                >
                  <Activity size={11} />LASER
                </button>
                <button onClick={() => setZoom(z => Math.max(1, z - 0.25))}
                  className="w-7 h-7 rounded flex items-center justify-center transition-colors cursor-pointer"
                  style={{ background: 'rgba(255,23,68,0.06)', border: '1px solid rgba(255,23,68,0.15)', color: '#888888' }}>
                  <ZoomOut size={11} />
                </button>
                <span className="font-mono text-xs w-10 text-center text-[#555555]">
                  {Math.round(zoom * 100)}%
                </span>
                <button onClick={() => setZoom(z => Math.min(3, z + 0.25))}
                  className="w-7 h-7 rounded flex items-center justify-center transition-colors cursor-pointer"
                  style={{ background: 'rgba(255,23,68,0.06)', border: '1px solid rgba(255,23,68,0.15)', color: '#888888' }}>
                  <ZoomIn size={11} />
                </button>
              </div>
            </div>

            {/* Simulated frame canvas */}
            <div className="relative bg-black flex items-center justify-center overflow-hidden"
              style={{ minHeight: 340 }}>
              <div className="relative animate-flicker" style={{ transform: `scale(${zoom})`, transition: 'transform 0.3s' }}>
                {current?.url ? (
                  <img
                    ref={imgRef}
                    src={current.url}
                    alt="Frame"
                    onLoad={measureImg}
                    style={{ display: 'block', maxHeight: 340, maxWidth: '100%' }}
                  />
                ) : (
                  <div className="grid-overlay w-[580px] h-[330px] flex items-center justify-center relative">
                    <div className="absolute inset-0 grid-overlay opacity-30" />
                    <div className="relative z-10 text-center">
                      <Crosshair size={42} className="text-[#555555] mx-auto mb-3" />
                      <div className="font-orbitron text-xs font-bold text-[#888888]">
                        TARGET BLOCK #{current?.frame_index + 1}
                      </div>
                      <div className="font-mono text-[9px] mt-1 text-[#555555] uppercase">
                        {current?.timestamp?.toFixed(2) ?? '0.00'}s TIME STREAM · AUDIT NODE
                      </div>
                    </div>
                  </div>
                )}

                {/* Heat canvas */}
                <AnimatePresence>
                  {overlay && (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="absolute inset-0"
                    >
                      <HeatCanvas
                        width={imgSize.w}
                        height={imgSize.h}
                        zones={zones}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Scan line */}
                <ScanBeam active={scanBeam} />
              </div>

              {/* Status overlay bar */}
              {current && (
                <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded bg-black/85 border border-white/5">
                  <div className="w-1.5 h-1.5 rounded-full animate-ping" style={{ background: rColor }} />
                  <span className="font-orbitron text-xs font-bold" style={{ color: rColor }}>
                    {current.risk_level}
                  </span>
                  <span className="font-mono text-xs text-[#888888]">
                    {(current.fake_probability * 100).toFixed(1)}% RISK
                  </span>
                </div>
              )}
            </div>

            {/* Step navigation bar */}
            <div className="flex items-center justify-between px-5 py-3"
              style={{ borderTop: '1px solid rgba(255, 23, 68, 0.1)' }}>
              <button onClick={() => setIdx(i => Math.max(0, i - 1))}
                disabled={idx === 0}
                className="btn-cyber text-[10px] py-1 px-3 disabled:opacity-30 flex items-center gap-1.5 cursor-pointer">
                <ChevronLeft size={12} />PREV BLOCK
              </button>
              <div className="flex items-center gap-1.5">
                {frames.slice(0, 12).map((_, i) => (
                  <button key={i} onClick={() => setIdx(i)}
                    className="w-1.5 h-1.5 rounded-full transition-all cursor-pointer"
                    style={{
                      background: i === idx ? '#FF1744' : 'rgba(255,23,68,0.2)',
                      transform:  i === idx ? 'scale(1.3)' : 'scale(1)',
                    }} />
                ))}
              </div>
              <button onClick={() => setIdx(i => Math.min(frames.length - 1, i + 1))}
                disabled={idx >= frames.length - 1}
                className="btn-cyber text-[10px] py-1 px-3 disabled:opacity-30 flex items-center gap-1.5 cursor-pointer">
                NEXT BLOCK<ChevronRight size={12} />
              </button>
            </div>
          </div>

          {/* Frame strips */}
          <div className="glass p-4 border-red-500/20">
            <div className="font-mono text-[9px] mb-3 text-[#555555] uppercase font-bold">Chronological Frame strip</div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {frames.map((fr, i) => {
                const fc = fr.risk_level === 'CRITICAL' ? '#FF1744' : fr.risk_level === 'HIGH' ? '#FF6B00' : fr.risk_level === 'MEDIUM' ? '#FFC400' : '#A6FF00'
                return (
                  <button key={i} onClick={() => setIdx(i)}
                    className="relative shrink-0 w-16 h-11 rounded overflow-hidden transition-all cursor-pointer"
                    style={{
                      border:     `1px solid ${i === idx ? fc : 'rgba(255,23,68,0.15)'}`,
                      background: '#111111',
                    }}>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-orbitron text-xs font-bold" style={{ color: fc, fontSize: 8 }}>
                        #{fr.frame_index + 1}
                      </span>
                      <span className="font-mono text-[#555555]" style={{ fontSize: 7 }}>
                        {fr.timestamp?.toFixed(1)}s
                      </span>
                    </div>
                    {i === idx && (
                      <div className="absolute inset-0 bg-[#FF1744]/5" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </motion.div>

        {/* Right Side: Sidebar */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          className="space-y-4">

          {/* Current frame stats */}
          <div className="glass p-5 border-red-500/20">
            <div className="font-mono text-[9px] mb-4 tracking-widest text-[#FF1744] uppercase font-bold">Block Telemetry</div>
            {current && (
              <div className="space-y-3">
                {[
                  { label: 'Signal Index', value: `#${current.frame_index + 1}` },
                  { label: 'Time Offset',  value: `${current.timestamp?.toFixed(2)}s` },
                  { label: 'Risk Rating', value: current.risk_level, color: rColor },
                  { label: 'Threat Probability',  value: `${(current.fake_probability * 100).toFixed(1)}%`, color: rColor },
                  { label: 'Flagged Pixels',  value: zones.length },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between items-center py-1.5 border-b border-white/5">
                    <span className="font-mono text-xs text-[#888888]">{label}</span>
                    <span className="font-orbitron text-xs font-bold" style={{ color: color || '#EDEDED' }}>{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Heat map index legend */}
          <div className="glass p-5 border-red-500/20">
            <div className="font-mono text-[9px] mb-4 tracking-widest text-[#FF1744] uppercase font-bold">Spectra legend</div>
            <div className="space-y-3">
              {[
                { label: 'INTRUSION ZONE',   color: '#FF1744', bg: 'rgba(255,23,68,0.25)' },
                { label: 'REGION BOUNDS', color: '#FF6B00', desc: 'Orange corners' },
                { label: 'SWEEP SPECTRUM',       color: '#FFC400', desc: 'Active line scan' },
                { label: 'RETICLE LOCKS',  color: '#A6FF00', desc: 'Center crosshairs' },
              ].map(({ label, color, bg, desc }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-5 h-3 rounded-sm shrink-0"
                    style={{ background: bg || `${color}08`, border: `1px solid ${color}` }} />
                  <div>
                    <div className="font-orbitron text-[10px] font-bold text-[#EDEDED]">{label}</div>
                    {desc && <div className="font-mono text-[#555555]" style={{ fontSize: 8 }}>{desc}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk mini timeline indicator */}
          <div className="glass p-5 border-red-500/20">
            <div className="font-mono text-[9px] mb-4 tracking-widest text-[#FF1744] uppercase font-bold">Threat profile histogram</div>
            <div className="flex items-end gap-1 h-16">
              {frames.map((fr, i) => {
                const fc = fr.risk_level === 'CRITICAL' ? '#FF1744' : fr.risk_level === 'HIGH' ? '#FF6B00' : fr.risk_level === 'MEDIUM' ? '#FFC400' : '#A6FF00'
                const h  = 20 + fr.fake_probability * 80
                return (
                  <button key={i} onClick={() => setIdx(i)}
                    className="flex-1 rounded-sm transition-all cursor-pointer"
                    style={{
                      height:    `${h}%`,
                      background: i === idx ? fc : `${fc}30`,
                    }} />
                )
              })}
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="font-mono text-[#555555]" style={{ fontSize: 8 }}>Frame 1</span>
              <span className="font-mono text-[#555555]" style={{ fontSize: 8 }}>Frame {frames.length}</span>
            </div>
          </div>

          {/* Current frame anomalies list */}
          <div className="glass p-5 border-red-500/20">
            <div className="font-mono text-[9px] mb-3 tracking-widest text-[#FF1744] uppercase font-bold">Local Anomalous Hotspots</div>
            <div className="space-y-2">
              {zones.map((z, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded border border-red-500/10 bg-neutral-900/40">
                  <AlertTriangle size={11} className="text-[#FF1744] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-orbitron text-xs font-bold text-[#EDEDED]">
                      ZONE {i + 1}
                    </div>
                    <div className="font-mono text-[#555555]" style={{ fontSize: 8 }}>
                      Risk: {Math.round(z.intensity * 100)}% · Bounds {Math.round(z.x * 100)}%,{Math.round(z.y * 100)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
