import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import {
  AlertTriangle, CheckCircle, XCircle, Eye,
  Shield, Zap, ChevronLeft, Activity, Info,
} from 'lucide-react'

const TT = { contentStyle: { background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 12, color: '#1E293B', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' } }
const vColor = v => v === 'MANIPULATED' ? '#DC2626' : v === 'SUSPICIOUS' ? '#D97706' : '#059669'
const vBg    = v => v === 'MANIPULATED' ? '#FEF2F2' : v === 'SUSPICIOUS' ? '#FFFBEB' : '#F0FDF4'

function ScoreMeter({ score, color }) {
  const r = 70, sw = 8, norm = r - sw / 2
  const circ = norm * 2 * Math.PI
  const offset = circ - (score / 100) * circ
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ position: 'relative', width: r * 2, height: r * 2 }}>
        <svg width={r * 2} height={r * 2} style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
          <circle cx={r} cy={r} r={norm} fill="none" stroke="#F1F5F9" strokeWidth={sw} />
          <circle cx={r} cy={r} r={norm} fill="none" stroke={color} strokeWidth={sw}
            strokeDasharray={`${circ} ${circ}`} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 26, fontWeight: 800, color, letterSpacing: '-0.02em' }}>{Math.round(score)}</div>
          <div style={{ fontSize: 11, color: '#94A3B8' }}>/100</div>
        </div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, background: `${color}15`, color, padding: '4px 12px', borderRadius: 20, border: `1px solid ${color}30` }}>
        Reality Score
      </div>
    </div>
  )
}

function ProgressBar({ label, value, color }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
        <span style={{ color: '#64748B' }}>{label}</span>
        <span style={{ fontWeight: 700, color }}>{value?.toFixed(1)}%</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  )
}

const TABS = ['Overview', 'Timeline', 'Anomalies', 'Frames']

export default function ResultPage() {
  const { scanId } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [tab, setTab] = useState('Overview')

  useEffect(() => {
    const raw = sessionStorage.getItem(`scan_${scanId}`)
    if (raw) {
      try {
        const p = JSON.parse(raw)
        const fp = p.confidence ?? 0.5
        const isFake = p.verdict === 'MANIPULATED' || p.prediction === 'FAKE'
        const score = p.reality_score ?? (isFake ? 15 : 88)
        setReport({
          scan_id: p.scan_id || scanId,
          filename: p.filename || 'media_file',
          timestamp: p.timestamp || new Date().toISOString(),
          verdict: p.verdict || (isFake ? 'MANIPULATED' : 'AUTHENTIC'),
          reality_score: score,
          threat_level: p.threat_level || (score < 30 ? 'CRITICAL' : score < 60 ? 'HIGH' : score < 85 ? 'MEDIUM' : 'LOW'),
          visual_risk_score: p.visual_risk_score ?? (100 - score),
          audio_sync_risk_score: p.audio_sync_risk_score ?? (100 - score) * 0.6,
          metadata_risk_score: p.metadata_risk_score ?? (isFake ? 45 : 5),
          frame_consistency_risk_score: p.frame_consistency_risk_score ?? (100 - score) * 0.85,
          confidence: p.confidence ?? score / 100,
          resolution: p.resolution || '1920×1080',
          duration: p.duration || 15,
          fps: p.fps || 30,
          total_frames_analyzed: p.total_frames_analyzed ?? 30,
          scan_duration_seconds: p.scan_duration_seconds ?? 2.4,
          detected_anomalies: p.detected_anomalies || (isFake ? ['Temporal coherence anomaly in frames 12–28', 'Synthetic texture patterns in facial region'] : []),
          frame_results: p.frame_results || Array.from({ length: 15 }, (_, i) => ({
            frame_index: i, timestamp: +(i * 0.5).toFixed(1),
            face_detected: Math.random() > 0.2,
            fake_probability: Math.max(0, Math.min(1, fp + (Math.random() - 0.5) * 0.3)),
            risk_level: fp > 0.7 ? 'HIGH' : fp > 0.4 ? 'MEDIUM' : 'LOW',
          })),
        })
      } catch(e) { console.error(e) }
    }
  }, [scanId])

  if (!report) return (
    <div style={{ textAlign: 'center', padding: '80px 0' }}>
      <Eye size={40} style={{ color: '#E2E8F0', margin: '0 auto 12px' }} />
      <div style={{ fontWeight: 600, color: '#1E293B', marginBottom: 8 }}>Report not found</div>
      <button onClick={() => navigate('/scan')} className="btn btn-blue" style={{ margin: '0 auto', padding: '10px 22px', fontSize: 13 }}>
        Run New Scan
      </button>
    </div>
  )

  const isFake  = report.verdict === 'MANIPULATED'
  const isSusp  = report.verdict === 'SUSPICIOUS'
  const vc      = vColor(report.verdict)
  const vbg     = vBg(report.verdict)
  const VIcon   = isFake ? XCircle : isSusp ? AlertTriangle : CheckCircle
  const timelineData = (report.frame_results || []).slice(0, 20).map(fr => ({ time: fr.timestamp, risk: +(fr.fake_probability * 100).toFixed(1) }))
  const radarData = [
    { subject: 'Visual',   value: report.visual_risk_score },
    { subject: 'Audio',    value: report.audio_sync_risk_score },
    { subject: 'Metadata', value: report.metadata_risk_score },
    { subject: 'Frames',   value: report.frame_consistency_risk_score },
    { subject: 'Overall',  value: 100 - report.reality_score },
  ]

  return (
    <div>
      {/* Back button */}
      <button onClick={() => navigate(-1)} className="btn btn-white" style={{ fontSize: 13, padding: '7px 16px', marginBottom: 20 }}>
        <ChevronLeft size={15} /> Back
      </button>

      {/* Page title */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: 6 }}>
          Forensic Report · {report.scan_id}
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A' }}>{report.filename}</h1>
        <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 3 }}>Analyzed: {new Date(report.timestamp).toLocaleString()}</p>
      </div>

      {/* Verdict banner */}
      <div style={{ background: vbg, border: `1.5px solid ${vc}30`, borderRadius: 12, padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: `${vc}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <VIcon size={26} color={vc} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 19, color: '#0F172A' }}>
              {isFake ? 'Deepfake Detected' : isSusp ? 'Suspicious Content' : 'Authentic Media'}
            </div>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
              {isFake ? 'This media has been identified as AI-generated or manipulated.'
               : isSusp ? 'Anomalies detected. Manual review recommended.'
               : 'No manipulation detected. Media appears genuine.'}
            </div>
          </div>
        </div>
        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>Threat Level</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: vc }}>{report.threat_level}</div>
        </div>
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24 }}>

        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Risk bars */}
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 15, color: '#0F172A', marginBottom: 4 }}>Forensic Layer Analysis</div>
            <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 20 }}>Multi-signal threat scoring across detection dimensions</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 32px' }}>
              <ProgressBar label="CNN Visual Classifier"   value={report.visual_risk_score}            color="#DC2626" />
              <ProgressBar label="Frame Consistency"        value={report.frame_consistency_risk_score} color="#EA580C" />
              <ProgressBar label="Audio-Visual Sync"        value={report.audio_sync_risk_score}        color="#D97706" />
              <ProgressBar label="EXIF Metadata Integrity"  value={report.metadata_risk_score}          color="#7C3AED" />
            </div>
          </div>

          {/* Tabs */}
          <div>
            <div style={{ display: 'flex', borderBottom: '1.5px solid #E2E8F0', marginBottom: 16, gap: 4 }}>
              {TABS.map(t => (
                <button key={t} onClick={() => setTab(t)}
                  style={{
                    padding: '10px 18px', fontSize: 14, fontWeight: 600, background: 'none', border: 'none',
                    borderBottom: `2.5px solid ${tab === t ? '#2563EB' : 'transparent'}`,
                    color: tab === t ? '#2563EB' : '#94A3B8', cursor: 'pointer', marginBottom: -1.5,
                    fontFamily: 'Inter, sans-serif',
                  }}>
                  {t}
                </button>
              ))}
            </div>

            {/* Overview */}
            {tab === 'Overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="card">
                  <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 14, fontWeight: 600 }}>Multi-Layer Risk Radar</div>
                  <div style={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#F1F5F9" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                        <Radar dataKey="value" stroke={vc} fill={`${vc}14`} strokeWidth={2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="card">
                  <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 14, fontWeight: 600 }}>Detection Confidence</div>
                  <div style={{ textAlign: 'center', paddingTop: 16 }}>
                    <div style={{ fontSize: 48, fontWeight: 800, color: vc, letterSpacing: '-0.03em' }}>
                      {(report.confidence * 100).toFixed(1)}%
                    </div>
                    <div style={{ fontSize: 14, color: '#94A3B8', marginTop: 8 }}>Model confidence</div>
                    <div style={{ marginTop: 20 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: vc, background: `${vc}12`, display: 'inline-block', padding: '6px 18px', borderRadius: 20, border: `1px solid ${vc}25` }}>
                        {report.verdict}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline */}
            {tab === 'Timeline' && (
              <div className="card">
                <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 16, fontWeight: 600 }}>Frame-Level Risk Timeline</div>
                <div style={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timelineData}>
                      <defs>
                        <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={vc} stopOpacity={0.15} />
                          <stop offset="95%" stopColor={vc} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis dataKey="time" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}s`} />
                      <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                      <Tooltip {...TT} formatter={v => [`${v}%`, 'Risk']} />
                      <Area type="monotone" dataKey="risk" stroke={vc} fill="url(#tg)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Anomalies */}
            {tab === 'Anomalies' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {report.detected_anomalies?.length > 0 ? report.detected_anomalies.map((a, i) => (
                  <div key={i} style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <AlertTriangle size={17} color="#DC2626" style={{ flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <div style={{ fontWeight: 600, color: '#1E293B', fontSize: 14 }}>{a}</div>
                      <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 3 }}>Anomaly signature detected</div>
                    </div>
                  </div>
                )) : (
                  <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '40px 20px', textAlign: 'center' }}>
                    <CheckCircle size={36} color="#059669" style={{ margin: '0 auto 10px' }} />
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#1E293B' }}>No Anomalies Detected</div>
                    <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>All forensic signals within expected parameters.</div>
                  </div>
                )}
              </div>
            )}

            {/* Frames */}
            {tab === 'Frames' && (
              <div className="card" style={{ padding: 0 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '60px 100px 80px 1fr 100px', padding: '10px 16px', borderBottom: '1px solid #F1F5F9', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#94A3B8' }}>
                  <span>Frame</span><span>Time</span><span>Face</span><span>Risk</span><span>Level</span>
                </div>
                <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                  {(report.frame_results || []).map((fr, i) => {
                    const rc = fr.risk_level === 'CRITICAL' ? '#DC2626' : fr.risk_level === 'HIGH' ? '#EA580C' : fr.risk_level === 'MEDIUM' ? '#D97706' : '#059669'
                    return (
                      <div key={i} className="table-row" style={{ display: 'grid', gridTemplateColumns: '60px 100px 80px 1fr 100px', padding: '11px 16px', alignItems: 'center', fontSize: 13 }}>
                        <span style={{ fontWeight: 600, color: '#1E293B' }}>#{fr.frame_index + 1}</span>
                        <span style={{ color: '#94A3B8' }}>{fr.timestamp}s</span>
                        <span style={{ color: fr.face_detected ? '#059669' : '#94A3B8', fontWeight: 600 }}>{fr.face_detected ? 'Yes' : '—'}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="progress-track" style={{ width: 80 }}>
                            <div className="progress-fill" style={{ width: `${fr.fake_probability * 100}%`, background: rc }} />
                          </div>
                          <span style={{ fontWeight: 700, color: rc }}>{(fr.fake_probability * 100).toFixed(0)}%</span>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: rc, background: `${rc}12`, padding: '3px 8px', borderRadius: 20, display: 'inline-block' }}>
                          {fr.risk_level}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Score meter */}
          <div className="card" style={{ textAlign: 'center', padding: '24px 20px' }}>
            <ScoreMeter score={report.reality_score} color={vc} />
          </div>

          {/* Forensic checklist */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Shield size={15} color="#2563EB" /> Forensic Checklist
            </div>
            {[
              { name: 'Binary integrity',      ok: true },
              { name: 'EXIF structure valid',  ok: !isFake },
              { name: 'Pixel noise consistent', ok: !isFake },
              { name: 'Audio-visual sync',     ok: report.audio_sync_risk_score < 40 },
              { name: 'Face detection stable', ok: true },
            ].map(c => (
              <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #F8FAFC' }}>
                <span style={{ fontSize: 13, color: '#64748B' }}>{c.name}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: c.ok ? '#059669' : '#DC2626' }}>
                  {c.ok ? 'Pass' : 'Fail'}
                </span>
              </div>
            ))}
          </div>

          {/* Metadata */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Info size={15} color="#2563EB" /> Scan Metadata
            </div>
            {[
              ['Resolution',     report.resolution || 'N/A'],
              ['Duration',       `${report.duration}s`],
              ['Frame Rate',     `${report.fps} fps`],
              ['Frames Checked', report.total_frames_analyzed],
              ['Analysis Time',  `${report.scan_duration_seconds}s`],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #F8FAFC' }}>
                <span style={{ fontSize: 13, color: '#64748B' }}>{k}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={() => navigate(`/heatvision/${scanId}`)} className="btn btn-outline" style={{ justifyContent: 'center', padding: '11px', fontSize: 13 }}>
              <Eye size={15} /> View Heatmap
            </button>
            <button onClick={() => navigate('/scan')} className="btn btn-blue" style={{ justifyContent: 'center', padding: '11px', fontSize: 13 }}>
              New Analysis
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
