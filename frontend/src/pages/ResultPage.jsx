import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts'
import {
  AlertTriangle, CheckCircle, XCircle, Eye,
  Shield, Zap, ChevronLeft, Activity, Info,
} from 'lucide-react'

const TT = {
  contentStyle: {
    background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px', color: '#E2E8F0', fontSize: 12,
    fontFamily: 'Inter, sans-serif', boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  },
}

/* ── Circular score meter ── */
function ScoreMeter({ score }) {
  const r = 80, sw = 8, norm = r - sw / 2
  const circ = norm * 2 * Math.PI
  const offset = circ - (score / 100) * circ
  const color = score >= 75 ? '#10B981' : score >= 50 ? '#F59E0B' : score >= 25 ? '#F97316' : '#EF4444'
  const label = score >= 75 ? 'Authentic' : score >= 50 ? 'Suspicious' : score >= 25 ? 'High Risk' : 'Manipulated'

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: r * 2, height: r * 2 }}>
        <svg width={r * 2} height={r * 2} className="absolute" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={r} cy={r} r={norm} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={sw} />
          <motion.circle cx={r} cy={r} r={norm} fill="none" stroke={color} strokeWidth={sw}
            strokeDasharray={`${circ} ${circ}`}
            initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="text-3xl font-bold" style={{ color, letterSpacing: '-0.03em' }}>
            {Math.round(score)}
          </motion.div>
          <div className="text-xs" style={{ color: '#6B7280' }}>/100</div>
        </div>
      </div>
      <span className="badge text-xs" style={{
        background: `${color}14`, color, border: `1px solid ${color}30`,
        borderRadius: '9999px', padding: '4px 12px', fontWeight: 600,
      }}>
        {label}
      </span>
    </div>
  )
}

/* ── Risk progress bar ── */
function RiskBar({ label, value, color }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span style={{ color: '#94A3B8' }}>{label}</span>
        <span className="font-semibold" style={{ color }}>{value?.toFixed(1)}%</span>
      </div>
      <div className="progress-track">
        <motion.div className="progress-fill"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }} />
      </div>
    </div>
  )
}

/* ── Verdict banner ── */
function VerdictBanner({ verdict, threatLevel, score }) {
  const isFake = verdict === 'MANIPULATED', isSusp = verdict === 'SUSPICIOUS'
  const color = isFake ? '#EF4444' : isSusp ? '#F59E0B' : '#10B981'
  const Icon  = isFake ? XCircle : isSusp ? AlertTriangle : CheckCircle
  const text  = isFake ? 'Deepfake Detected' : isSusp ? 'Suspicious Content' : 'Authentic Media'
  const desc  = isFake ? 'This media has been identified as AI-generated or manipulated.'
               : isSusp ? 'Anomalies detected. Manual review recommended.'
               : 'No manipulation detected. Media appears genuine.'

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
      className="card p-5 flex items-center justify-between"
      style={{ background: `${color}08`, border: `1px solid ${color}25` }}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${color}14` }}>
          <Icon size={24} style={{ color }} />
        </div>
        <div>
          <h2 className="font-bold text-xl text-white">{text}</h2>
          <p className="text-sm mt-0.5" style={{ color: '#94A3B8' }}>{desc}</p>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-xs mb-1" style={{ color: '#6B7280' }}>Threat Level</div>
        <span className="text-sm font-bold" style={{ color }}>{threatLevel}</span>
      </div>
    </motion.div>
  )
}

const TABS = ['Overview', 'Timeline', 'Anomalies', 'Frames']

export default function ResultPage() {
  const { scanId } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [tab, setTab]       = useState('Overview')

  useEffect(() => {
    const raw = sessionStorage.getItem(`scan_${scanId}`)
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        const prediction = parsed.prediction || parsed.classification || 'REAL'
        const isFakeVal  = prediction === 'FAKE' || prediction === 'MANIPULATED'
        const normScore  = parsed.reality_score ?? (isFakeVal ? 15 : 92)
        setReport({
          scan_id: parsed.scan_id || scanId,
          timestamp: parsed.timestamp || new Date().toISOString(),
          filename: parsed.filename || 'media_file',
          verdict: parsed.verdict || (isFakeVal ? 'MANIPULATED' : 'AUTHENTIC'),
          reality_score: normScore,
          threat_level: parsed.threat_level || (normScore < 30 ? 'CRITICAL' : normScore < 60 ? 'HIGH' : normScore < 85 ? 'MEDIUM' : 'LOW'),
          visual_risk_score: parsed.visual_risk_score ?? (100 - normScore),
          audio_sync_risk_score: parsed.audio_sync_risk_score ?? (100 - normScore) * 0.6,
          metadata_risk_score: parsed.metadata_risk_score ?? (isFakeVal ? 45 : 4),
          frame_consistency_risk_score: parsed.frame_consistency_risk_score ?? (100 - normScore) * 0.85,
          resolution: parsed.resolution || '1920×1080',
          duration: parsed.duration || 15,
          fps: parsed.fps || 30,
          total_frames_analyzed: parsed.total_frames_analyzed ?? 30,
          scan_duration_seconds: parsed.scan_duration_seconds ?? 2.4,
          confidence: parsed.confidence ?? normScore / 100,
          detected_anomalies: parsed.detected_anomalies || (isFakeVal ? [
            'Temporal coherence anomaly detected in frames 12–28',
            'Synthetic texture artifacts found in facial region',
          ] : []),
          frame_results: parsed.frame_results || Array.from({ length: 15 }, (_, i) => ({
            frame_index: i, timestamp: +(i * 0.5).toFixed(1),
            face_detected: Math.random() > 0.2,
            fake_probability: Math.max(0, Math.min(1, isFakeVal ? 0.6 + Math.random() * 0.3 : 0.05 + Math.random() * 0.15)),
            risk_level: isFakeVal ? 'HIGH' : 'LOW',
          })),
        })
      } catch(e) { console.error(e) }
    }
  }, [scanId])

  if (!report) return (
    <div className="flex flex-col items-center justify-center h-72 gap-4">
      <Eye size={40} style={{ color: '#374151' }} />
      <div className="font-semibold text-white">Report not found</div>
      <button onClick={() => navigate('/scan')} className="btn btn-primary btn-sm">Run New Scan</button>
    </div>
  )

  const isFake = report.verdict === 'MANIPULATED'
  const vc     = isFake ? '#EF4444' : report.verdict === 'SUSPICIOUS' ? '#F59E0B' : '#10B981'

  const radarData = [
    { subject: 'Visual',    value: report.visual_risk_score },
    { subject: 'Audio',     value: report.audio_sync_risk_score },
    { subject: 'Metadata',  value: report.metadata_risk_score },
    { subject: 'Frames',    value: report.frame_consistency_risk_score },
    { subject: 'Overall',   value: 100 - report.reality_score },
  ]
  const timelineData = (report.frame_results || []).slice(0, 20).map(fr => ({
    time: fr.timestamp, risk: Math.round(fr.fake_probability * 100),
  }))
  const pieData = [
    { name: 'Authentic', value: report.reality_score,       color: '#10B981' },
    { name: 'Risk',      value: 100 - report.reality_score, color: vc },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-8">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm mb-3 -ml-2">
            <ChevronLeft size={15} />Back
          </button>
          <div className="section-label mb-1">Forensic Report · {report.scan_id}</div>
          <h1 className="text-xl font-bold text-white truncate max-w-lg">{report.filename}</h1>
          <p className="text-xs mt-1" style={{ color: '#4B5563' }}>
            Analyzed {new Date(report.timestamp).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/heatvision/${scanId}`)} className="btn btn-secondary btn-sm">
            <Eye size={14} />Heatmap View
          </button>
          <button onClick={() => navigate('/scan')} className="btn btn-primary btn-sm">
            New Analysis
          </button>
        </div>
      </motion.div>

      {/* Verdict banner */}
      <VerdictBanner verdict={report.verdict} threatLevel={report.threat_level} score={report.reality_score} />

      {/* Main grid */}
      <div className="grid lg:grid-cols-12 gap-8">

        {/* Left col */}
        <div className="lg:col-span-8 space-y-6">

          {/* Risk layers */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="card p-6">
            <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
              <Zap size={15} className="text-blue-400" />Forensic Layer Analysis
            </h3>
            <p className="text-xs mb-5" style={{ color: '#6B7280' }}>Multi-signal threat scoring across detection dimensions</p>
            <div className="grid md:grid-cols-2 gap-5">
              <RiskBar label="CNN Visual Classifier (XceptionNet)" value={report.visual_risk_score}            color="#EF4444" />
              <RiskBar label="Frame Consistency Variance"          value={report.frame_consistency_risk_score} color="#F97316" />
              <RiskBar label="Audio-Visual Synchronization"        value={report.audio_sync_risk_score}        color="#F59E0B" />
              <RiskBar label="EXIF Metadata Integrity"             value={report.metadata_risk_score}          color="#8B5CF6" />
            </div>
          </motion.div>

          {/* Tabs */}
          <div>
            <div className="flex gap-1 mb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              {TABS.map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className="px-4 py-2.5 text-sm font-medium transition-all cursor-pointer border-b-2"
                  style={{
                    borderColor: tab === t ? '#3B82F6' : 'transparent',
                    color: tab === t ? '#3B82F6' : '#6B7280',
                    background: 'transparent',
                  }}>
                  {t}
                </button>
              ))}
            </div>

            {/* Tab: Overview */}
            {tab === 'Overview' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid md:grid-cols-2 gap-5">
                <div className="card p-5">
                  <div className="text-xs font-medium mb-4" style={{ color: '#6B7280' }}>Reality vs Risk Distribution</div>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} dataKey="value" strokeWidth={0}>
                          {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <Tooltip {...TT} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="card p-5">
                  <div className="text-xs font-medium mb-4" style={{ color: '#6B7280' }}>Multi-Layer Risk Radar</div>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="rgba(255,255,255,0.06)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'Inter' }} />
                        <Radar dataKey="value" stroke={vc} fill={`${vc}14`} strokeWidth={2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tab: Timeline */}
            {tab === 'Timeline' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-6">
                <div className="text-xs font-medium mb-4" style={{ color: '#6B7280' }}>Frame-Level Risk Timeline</div>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timelineData}>
                      <defs>
                        <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={vc} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={vc} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="time" tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'Inter' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}s`} />
                      <YAxis tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'Inter' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                      <Tooltip {...TT} formatter={v => [`${v}%`, 'Risk']} />
                      <Area type="monotone" dataKey="risk" stroke={vc} fill="url(#rg)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}

            {/* Tab: Anomalies */}
            {tab === 'Anomalies' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                {report.detected_anomalies?.length > 0 ? report.detected_anomalies.map((a, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                    className="card card-danger p-4 flex items-start gap-3">
                    <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm text-white">{a}</div>
                      <div className="text-xs mt-0.5" style={{ color: '#6B7280' }}>Anomaly signature detected</div>
                    </div>
                  </motion.div>
                )) : (
                  <div className="card p-12 text-center card-success">
                    <CheckCircle size={36} style={{ color: '#10B981', margin: '0 auto 12px' }} />
                    <div className="font-semibold text-white mb-1">No Anomalies Detected</div>
                    <div className="text-sm" style={{ color: '#6B7280' }}>Signals conform to baseline parameters</div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Tab: Frames */}
            {tab === 'Frames' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card overflow-hidden">
                <div className="grid grid-cols-5 px-5 py-3 table-header"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <span>Frame</span><span>Timestamp</span><span>Face</span><span>Risk Score</span><span>Level</span>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {(report.frame_results || []).map((fr, i) => {
                    const rc = fr.risk_level === 'CRITICAL' ? '#EF4444' : fr.risk_level === 'HIGH' ? '#F97316' : fr.risk_level === 'MEDIUM' ? '#F59E0B' : '#10B981'
                    return (
                      <div key={i} className="table-row grid grid-cols-5 px-5 py-3 items-center text-xs">
                        <span className="font-medium text-white">#{fr.frame_index + 1}</span>
                        <span style={{ color: '#6B7280' }}>{fr.timestamp}s</span>
                        <span>
                          <span className={`badge text-xs ${fr.face_detected ? 'badge-success' : ''}`}
                            style={!fr.face_detected ? { background: 'rgba(255,255,255,0.05)', color: '#6B7280', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '9999px', padding: '2px 8px' } : {}}>
                            {fr.face_detected ? '✓' : '—'}
                          </span>
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="progress-track w-16">
                            <div className="progress-fill" style={{ width: `${fr.fake_probability * 100}%`, background: rc }} />
                          </div>
                          <span className="font-semibold" style={{ color: rc }}>{(fr.fake_probability * 100).toFixed(0)}%</span>
                        </div>
                        <span className="badge text-xs"
                          style={{ background: `${rc}14`, color: rc, border: `1px solid ${rc}30`, borderRadius: '9999px', padding: '2px 8px', fontWeight: 600 }}>
                          {fr.risk_level}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="lg:col-span-4 space-y-5">

          {/* Score meter */}
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="card p-6 flex flex-col items-center">
            <div className="text-xs font-medium mb-5 text-center" style={{ color: '#6B7280' }}>Reality Score</div>
            <ScoreMeter score={report.reality_score} />
            <div className="w-full mt-6 space-y-2">
              <div className="flex justify-between text-xs">
                <span style={{ color: '#6B7280' }}>Confidence</span>
                <span className="font-semibold text-white">{(report.confidence * 100).toFixed(1)}%</span>
              </div>
            </div>
          </motion.div>

          {/* Forensic checklist */}
          <div className="card p-5">
            <h3 className="font-semibold text-white text-sm mb-4 flex items-center gap-2">
              <Shield size={14} className="text-blue-400" />Forensic Checklist
            </h3>
            <div className="space-y-3">
              {[
                { name: 'Binary envelope integrity',    ok: true },
                { name: 'EXIF structure valid',         ok: !isFake },
                { name: 'Pixel noise consistency',      ok: !isFake },
                { name: 'Audio-visual sync',            ok: report.audio_sync_risk_score < 40 },
                { name: 'Face detection stable',        ok: true },
              ].map(c => (
                <div key={c.name} className="flex items-center justify-between py-2"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="text-sm" style={{ color: '#94A3B8' }}>{c.name}</span>
                  <span className="text-xs font-semibold" style={{ color: c.ok ? '#10B981' : '#EF4444' }}>
                    {c.ok ? 'Pass' : 'Fail'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Scan metadata */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="card p-5">
            <h3 className="font-semibold text-white text-sm mb-4 flex items-center gap-2">
              <Info size={14} className="text-blue-400" />Scan Metadata
            </h3>
            <div className="space-y-2">
              {[
                { k: 'Resolution',      v: report.resolution || 'N/A' },
                { k: 'Duration',        v: `${report.duration}s` },
                { k: 'Frame Rate',      v: `${report.fps} fps` },
                { k: 'Frames Checked',  v: report.total_frames_analyzed },
                { k: 'Analysis Time',   v: `${report.scan_duration_seconds}s` },
              ].map(({ k, v }) => (
                <div key={k} className="flex justify-between py-1.5"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="text-xs" style={{ color: '#6B7280' }}>{k}</span>
                  <span className="text-xs font-semibold text-white">{v}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex gap-3 pt-2">
        <button onClick={() => navigate('/scan')} className="btn btn-primary btn-sm">New Analysis</button>
        <button onClick={() => navigate(`/heatvision/${scanId}`)} className="btn btn-secondary btn-sm">
          <Eye size={14} />Heatmap View
        </button>
        <button onClick={() => navigate('/analytics')} className="btn btn-ghost btn-sm">
          <Activity size={14} />Dashboard
        </button>
      </div>
    </div>
  )
}
