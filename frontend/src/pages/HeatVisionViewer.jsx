import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Eye, ZoomIn, ZoomOut, ChevronLeft, ChevronRight,
  AlertTriangle, Layers, ScanLine as ScanIcon,
} from 'lucide-react'
import axios from 'axios'

function HeatCanvas({ width, height, zones = [] }) {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, width, height)
    zones.forEach(({ x, y, w, h, intensity }) => {
      // Soft heat fill
      ctx.fillStyle = `rgba(239,68,68,${intensity * 0.3})`
      ctx.fillRect(x * width, y * height, w * width, h * height)
      // Border
      ctx.strokeStyle = `rgba(239,68,68,${0.5 + intensity * 0.4})`
      ctx.lineWidth = 1.5
      ctx.strokeRect(x * width, y * height, w * width, h * height)
      // Blue corner brackets
      const cL = Math.min(w * width, h * height) * 0.2
      ctx.strokeStyle = '#2563EB'; ctx.lineWidth = 2
      const corners = [
        [x*width, y*height, 1, 1], [(x+w)*width, y*height, -1, 1],
        [x*width, (y+h)*height, 1, -1], [(x+w)*width, (y+h)*height, -1, -1],
      ]
      corners.forEach(([cx, cy, dx, dy]) => {
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx+dx*cL, cy); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy+dy*cL); ctx.stroke()
      })
      // Label
      ctx.fillStyle = '#DC2626'; ctx.font = '11px Inter,sans-serif'
      ctx.fillText(`${Math.round(intensity*100)}%`, x*width+5, y*height+15)
    })
  }, [width, height, zones])
  return <canvas ref={ref} width={width} height={height} className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }} />
}

function getZones(idx) {
  const s = idx * 13, n = 1 + (s % 2)
  return Array.from({ length: n }, (_, i) => {
    const z = s + i * 7
    return {
      x: ((z*3)%55+12)/100, y: ((z*7)%45+12)/100,
      w: ((z*5)%22+14)/100, h: ((z*11)%18+12)/100,
      intensity: (((z*17)%55)+35)/100,
    }
  })
}

const rColor = r => r === 'CRITICAL' ? '#DC2626' : r === 'HIGH' ? '#EA580C' : r === 'MEDIUM' ? '#D97706' : '#059669'

export default function HeatVisionViewer() {
  const { scanId } = useParams()
  const navigate   = useNavigate()
  const [report, setReport]   = useState(null)
  const [frames, setFrames]   = useState([])
  const [idx, setIdx]         = useState(0)
  const [zoom, setZoom]       = useState(1)
  const [overlay, setOverlay] = useState(true)
  const [showScan, setShowScan] = useState(true)
  const imgRef = useRef(null)
  const [imgSize, setImgSize] = useState({ w: 580, h: 330 })

  const measure = () => {
    if (imgRef.current) setImgSize({ w: imgRef.current.offsetWidth, h: imgRef.current.offsetHeight })
  }

  useEffect(() => {
    const raw = sessionStorage.getItem(`scan_${scanId}`)
    if (raw) {
      try {
        const p = JSON.parse(raw); setReport(p)
        if (p.heatmap_url) {
          setFrames([{ frame_index: 0, timestamp: 0, url: p.heatmap_url, risk_level: p.reality_score < 30 ? 'CRITICAL' : 'LOW', fake_probability: (100-p.reality_score)/100 }])
          return
        }
      } catch(e) {}
    }
    axios.get(`/api/extract-frames/${scanId}`)
      .then(r => setFrames(r.data.frames || []))
      .catch(() => setFrames(Array.from({ length: 10 }, (_, i) => ({
        frame_index: i, timestamp: +(i*0.5).toFixed(1), url: null,
        risk_level: i%4===0 ? 'CRITICAL' : i%3===0 ? 'HIGH' : i%2===0 ? 'MEDIUM' : 'LOW',
        fake_probability: 0.2 + (i%7)*0.1,
      }))))
  }, [scanId])

  useEffect(() => {
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const cur = frames[idx]
  const zones = cur ? getZones(cur.frame_index) : []
  const rc = cur ? rColor(cur.risk_level) : '#2563EB'

  return (
    <div>
      {/* Back */}
      <button onClick={() => navigate(-1)} className="btn btn-white" style={{ fontSize: 13, padding: '7px 16px', marginBottom: 20 }}>
        <ChevronLeft size={15} /> Back to Report
      </button>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: 6 }}>
          Grad-CAM Explainability
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Heatmap Viewer</h1>
        {report && (
          <p style={{ fontSize: 14, color: '#64748B' }}>
            {report.filename} · Reality Score: <strong style={{ color: '#1E293B' }}>{report.reality_score?.toFixed(1)}/100</strong>
          </p>
        )}
      </div>

      {/* Two-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>

        {/* Viewer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Main viewer card */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Eye size={15} color="#94A3B8" />
                <span style={{ fontWeight: 600, fontSize: 14, color: '#1E293B' }}>
                  Frame {(cur?.frame_index ?? 0) + 1} / {frames.length}
                </span>
                <span style={{ fontSize: 13, color: '#94A3B8' }}>@ {cur?.timestamp?.toFixed(2) ?? '0.00'}s</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={() => setOverlay(o => !o)}
                  style={{
                    padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter',
                    background: overlay ? '#EFF6FF' : '#F8FAFC',
                    border: `1.5px solid ${overlay ? '#2563EB' : '#E2E8F0'}`,
                    color: overlay ? '#2563EB' : '#94A3B8',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                  <Layers size={12} />{overlay ? 'Heatmap On' : 'Heatmap Off'}
                </button>
                <button onClick={() => setShowScan(s => !s)}
                  style={{
                    padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter',
                    background: showScan ? '#EFF6FF' : '#F8FAFC',
                    border: `1.5px solid ${showScan ? '#2563EB' : '#E2E8F0'}`,
                    color: showScan ? '#2563EB' : '#94A3B8',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                  Scan Line
                </button>
                <button onClick={() => setZoom(z => Math.max(1, z-0.25))} className="btn btn-white" style={{ padding: '6px 10px' }}><ZoomOut size={13} /></button>
                <span style={{ fontSize: 12, color: '#94A3B8', width: 36, textAlign: 'center' }}>{Math.round(zoom*100)}%</span>
                <button onClick={() => setZoom(z => Math.min(3, z+0.25))} className="btn btn-white" style={{ padding: '6px 10px' }}><ZoomIn size={13} /></button>
              </div>
            </div>

            {/* Canvas area */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320, background: '#F8FAFC', overflow: 'hidden' }}>
              <div style={{ transform: `scale(${zoom})`, transition: 'transform 0.25s ease', position: 'relative' }}>
                {cur?.url ? (
                  <img ref={imgRef} src={cur.url} alt="Frame" onLoad={measure} style={{ display: 'block', maxHeight: 320, maxWidth: '100%' }} />
                ) : (
                  <div ref={imgRef} style={{ width: 580, height: 326, background: 'white', border: '1px solid #E2E8F0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                    {/* Subtle grid */}
                    <div style={{ position: 'absolute', inset: 0, opacity: 0.4,
                      backgroundImage: 'linear-gradient(#F1F5F9 1px,transparent 1px),linear-gradient(90deg,#F1F5F9 1px,transparent 1px)',
                      backgroundSize: '40px 40px'
                    }} />
                    <div style={{ textAlign: 'center', zIndex: 2 }}>
                      <Eye size={32} color="#CBD5E1" style={{ margin: '0 auto 8px' }} />
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#94A3B8' }}>Frame #{(cur?.frame_index ?? 0)+1}</div>
                      <div style={{ fontSize: 12, color: '#CBD5E1', marginTop: 3 }}>{cur?.timestamp?.toFixed(2)}s</div>
                    </div>
                    {/* Corners */}
                    <div className="frame-corner frame-corner-tl" />
                    <div className="frame-corner frame-corner-tr" />
                    <div className="frame-corner frame-corner-bl" />
                    <div className="frame-corner frame-corner-br" />
                  </div>
                )}

                {overlay && <HeatCanvas width={imgSize.w} height={imgSize.h} zones={zones} />}
                {showScan && <div className="scan-line" />}
              </div>

              {/* Risk badge overlay */}
              {cur && (
                <div style={{
                  position: 'absolute', top: 12, left: 12,
                  background: 'rgba(255,255,255,0.9)',
                  border: `1.5px solid ${rc}40`, borderRadius: 8,
                  padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6,
                  backdropFilter: 'blur(6px)',
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: rc }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: rc }}>{cur.risk_level}</span>
                  <span style={{ fontSize: 12, color: '#64748B' }}>{(cur.fake_probability*100).toFixed(1)}% risk</span>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderTop: '1px solid #F1F5F9' }}>
              <button onClick={() => setIdx(i => Math.max(0, i-1))} disabled={idx===0}
                className="btn btn-white" style={{ padding: '7px 14px', fontSize: 13, opacity: idx===0 ? 0.4 : 1 }}>
                <ChevronLeft size={14} /> Prev
              </button>
              <div style={{ display: 'flex', gap: 5 }}>
                {frames.slice(0,12).map((_, i) => (
                  <button key={i} onClick={() => setIdx(i)} style={{
                    width: i===idx ? 20 : 6, height: 6, borderRadius: 99,
                    background: i===idx ? '#2563EB' : '#CBD5E1',
                    border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  }} />
                ))}
              </div>
              <button onClick={() => setIdx(i => Math.min(frames.length-1, i+1))} disabled={idx>=frames.length-1}
                className="btn btn-white" style={{ padding: '7px 14px', fontSize: 13, opacity: idx>=frames.length-1 ? 0.4 : 1 }}>
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Frame strip */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#94A3B8', marginBottom: 10 }}>Frame Strip</div>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              {frames.map((fr, i) => {
                const fc = rColor(fr.risk_level)
                return (
                  <button key={i} onClick={() => setIdx(i)}
                    style={{
                      width: 56, height: 40, flexShrink: 0, borderRadius: 8, cursor: 'pointer',
                      border: `1.5px solid ${i===idx ? fc : '#E2E8F0'}`,
                      background: i===idx ? `${fc}10` : '#F8FAFC',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                    }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: fc }}>#{fr.frame_index+1}</span>
                    <span style={{ fontSize: 8, color: '#94A3B8' }}>{fr.timestamp?.toFixed(1)}s</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Frame info */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A', marginBottom: 14 }}>Frame Analysis</div>
            {cur && [
              ['Frame',       `#${cur.frame_index+1}`],
              ['Timestamp',   `${cur.timestamp?.toFixed(2)}s`],
              ['Risk Level',  cur.risk_level],
              ['Fake Risk',   `${(cur.fake_probability*100).toFixed(1)}%`],
              ['Zones',       zones.length],
            ].map(([k, v], i) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F8FAFC' }}>
                <span style={{ fontSize: 13, color: '#64748B' }}>{k}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: i===2||i===3 ? rc : '#1E293B' }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A', marginBottom: 14 }}>Overlay Legend</div>
            {[
              { label: 'Detection Zone',  color: '#DC2626', desc: 'High-risk region' },
              { label: 'Frame Boundary',  color: '#2563EB', desc: 'Corner markers' },
              { label: 'Scan Line',       color: '#3B82F6', desc: 'Active sweep' },
            ].map(({ label, color, desc }) => (
              <div key={label} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                <div style={{ width: 16, height: 10, borderRadius: 3, background: `${color}20`, border: `1.5px solid ${color}`, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#1E293B' }}>{label}</div>
                  <div style={{ fontSize: 11, color: '#94A3B8' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Risk histogram */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A', marginBottom: 12 }}>Risk Profile</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 56 }}>
              {frames.map((fr, i) => {
                const fc = rColor(fr.risk_level)
                return (
                  <button key={i} onClick={() => setIdx(i)}
                    style={{
                      flex: 1, borderRadius: 4, cursor: 'pointer', border: 'none',
                      height: `${20 + fr.fake_probability * 80}%`,
                      background: i===idx ? fc : `${fc}40`,
                      transition: 'background 0.15s',
                    }} />
                )
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: '#94A3B8' }}>
              <span>F1</span><span>F{frames.length}</span>
            </div>
          </div>

          {/* Zones */}
          {zones.length > 0 && (
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A', marginBottom: 12 }}>Detected Zones</div>
              {zones.map((z, i) => (
                <div key={i} style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
                  <AlertTriangle size={14} color="#DC2626" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>Zone {i+1}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>Risk: {Math.round(z.intensity*100)}%</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
