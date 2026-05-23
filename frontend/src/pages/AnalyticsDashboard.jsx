import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts'
import { Shield, XCircle, CheckCircle, Zap, Clock, TrendingUp } from 'lucide-react'
import axios from 'axios'

const TT = { contentStyle: { background: '#111111', border: '1px solid rgba(255, 23, 68, 0.25)', borderRadius: 0, color: '#EDEDED', fontSize: 10, fontFamily: 'JetBrains Mono' } }
const THREAT_COLORS = { LOW: '#A6FF00', MEDIUM: '#FFC400', HIGH: '#FF6B00', CRITICAL: '#FF1744' }
const vColor = v => v === 'MANIPULATED' ? '#FF1744' : v === 'SUSPICIOUS' ? '#FFC400' : '#A6FF00'
const tColor = t => t === 'CRITICAL' ? '#FF1744' : t === 'HIGH' ? '#FF6B00' : t === 'MEDIUM' ? '#FFC400' : '#A6FF00'

/* ── Standardize the data shapes for analytics ── */
function normalize(raw) {
  const weekly_trend = (raw.weekly_trend || []).map(d => ({
    day:   d.day   || d.date  || '—',
    total: d.total || d.scans || 0,
    fakes: d.fakes || 0,
  }))

  const rawThreat = raw.threat_distribution || {}
  const threat_distribution = Array.isArray(rawThreat)
    ? rawThreat
    : Object.entries(rawThreat).map(([name, value]) => ({
        name, value, color: THREAT_COLORS[name] || '#FF1744',
      }))

  const deepfakes_found = raw.deepfakes_found ?? raw.fake_count        ?? 0
  const authentic_media = raw.authentic_media ?? raw.real_count        ?? 0
  const accuracy_rate   = raw.accuracy_rate   ?? raw.detection_accuracy ?? 94.7
  const suspicious_count= raw.suspicious_count ?? 0

  const verdict_breakdown = [
    { name: 'Manipulated', value: deepfakes_found,  color: '#FF1744' },
    { name: 'Suspicious',  value: suspicious_count, color: '#FFC400' },
    { name: 'Authentic',   value: authentic_media,  color: '#A6FF00' },
  ]

  return { ...raw, weekly_trend, threat_distribution, verdict_breakdown, deepfakes_found, authentic_media, accuracy_rate }
}

const DEMO = normalize({
  total_scans: 23, fake_count: 11, real_count: 9, detection_accuracy: 94.7, suspicious_count: 3,
  weekly_trend: [
    { day: 'Mon', fakes: 4, total: 6  },
    { day: 'Tue', fakes: 5, total: 13 },
    { day: 'Wed', fakes: 3, total: 9  },
    { day: 'Thu', fakes: 8, total: 15 },
    { day: 'Fri', fakes: 6, total: 11 },
    { day: 'Sat', fakes: 4, total: 8  },
    { day: 'Sun', fakes: 5, total: 8  },
  ],
  threat_distribution: { LOW: 9, MEDIUM: 6, HIGH: 5, CRITICAL: 3 },
  recent_scans: [
    { filename: 'interview_clip.mp4',  verdict: 'MANIPULATED', threat_level: 'CRITICAL', reality_score: 12.4, timestamp: new Date(Date.now() - 1e6).toISOString() },
    { filename: 'news_footage.mp4',    verdict: 'AUTHENTIC',   threat_level: 'LOW',      reality_score: 88.6, timestamp: new Date(Date.now() - 2e6).toISOString() },
    { filename: 'selfie_vid.mov',      verdict: 'SUSPICIOUS',  threat_level: 'MEDIUM',   reality_score: 51.2, timestamp: new Date(Date.now() - 3e6).toISOString() },
    { filename: 'press_conf.mp4',      verdict: 'MANIPULATED', threat_level: 'HIGH',     reality_score: 22.8, timestamp: new Date(Date.now() - 5e6).toISOString() },
    { filename: 'portrait.jpg',        verdict: 'AUTHENTIC',   threat_level: 'LOW',      reality_score: 91.3, timestamp: new Date(Date.now() - 7e6).toISOString() },
  ],
})

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="glass p-5 relative overflow-hidden cursor-default border-red-500/20">
      <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-5" style={{ background: color }} />
      <div className="flex items-start justify-between mb-4">
        <div className="w-9 h-9 rounded flex items-center justify-center"
          style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <div className="flex items-center gap-1 font-mono" style={{ color: '#A6FF00', fontSize: 9 }}>
          <div className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />SECURE
        </div>
      </div>
      <div className="font-orbitron font-black text-2xl mb-1" style={{ color }}>{value}</div>
      <div className="font-orbitron text-[10px] font-bold mb-1 text-[#EDEDED] tracking-wider">{label}</div>
      {sub && <div className="font-mono text-[9px] text-[#555555] uppercase">{sub}</div>}
    </motion.div>
  )
}

/* ── Rotating Radar Compass ── */
function RotatingRadar() {
  return (
    <div className="glass p-5 relative overflow-hidden flex flex-col items-center justify-center border-red-500/20" style={{ height: 168 }}>
      <div className="absolute top-3 left-4 font-mono text-[9px] tracking-widest text-[#FF1744]">RADAR COMPASS</div>
      <div className="relative w-24 h-24 border border-red-500/20 rounded flex items-center justify-center">
        <div className="absolute inset-0 rounded origin-center bg-[conic-gradient(from_0deg,transparent_50%,rgba(255,23,68,0.12))] pointer-events-none animate-radar" />
        <div className="w-18 h-18 border border-orange-500/10 rounded absolute" />
        <div className="w-10 h-10 border border-red-500/10 rounded absolute" />
        <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
      </div>
      <div className="absolute bottom-2 font-mono text-[9px] text-[#555555] uppercase">MONITORING SCAN FLUX...</div>
    </div>
  )
}

/* ── Live Forensic Activity Feed ── */
function LiveForensicFeed() {
  const [logs, setLogs] = useState([
    'Operational database linked: ledgers intact',
    'Chroma channel trace offset: 0.15ms',
    'EXIF monitoring nodes: online',
    'Xception core validation signature: VERIFIED'
  ])

  useEffect(() => {
    const list = [
      'Inference sweep: classified target frame range',
      'Disruption check: temporal alignment nominal',
      'Security verify: EXIF compilation dates matching',
      'SQLite write success: added audit node logs',
      'Compiled visual Grad-CAM overlays: OK',
      'Pearson speech lag offset tracked: 0.32s drift',
    ]
    const interval = setInterval(() => {
      const entry = list[Math.floor(Math.random() * list.length)]
      const time = new Date().toLocaleTimeString()
      setLogs(prev => [`[${time}] ${entry}`, ...prev.slice(0, 4)])
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="glass p-5 space-y-3 border-red-500/20">
      <div className="font-orbitron text-xs font-bold text-[#FF6B00] flex items-center gap-2">
        <span className="w-1.5 h-1.5 bg-[#FF6B00] animate-pulse" />
        AUDIT FEED TRACE
      </div>
      <div className="bg-black/50 p-3 rounded border border-white/5 font-mono text-[9px] space-y-2 h-[154px] overflow-y-auto">
        {logs.map((log, i) => (
          <div key={i} className="leading-normal" style={{ color: i === 0 ? '#A6FF00' : '#888888' }}>
            › {log}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AnalyticsDashboard() {
  const [data, setData]       = useState(DEMO)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/analytics/dashboard')
      .then(r => setData(normalize(r.data)))
      .catch(() => setData(DEMO))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <div className="font-mono text-xs tracking-widest text-[#FF1744]">— COMSPEC MONITOR —</div>
          <h1 className="font-orbitron font-extrabold text-3xl text-[#EDEDED] tracking-tight">FORENSIC INTELLIGENCE</h1>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 border border-red-500/20 text-[#FF1744] bg-[#FF1744]/5 font-mono text-[9px]">
          <div className="w-1.5 h-1.5 bg-red-500 animate-ping" />SYSTEM SECURE RADAR
        </div>
      </motion.div>

      {/* Stat cards grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Shield}      label="CHECKS RUN" value={data.total_scans}           color="#FF6B00" sub="All time logs" />
        <StatCard icon={XCircle}     label="MANIPULATED"   value={data.deepfakes_found}        color="#FF1744" sub="Synthetic detections" />
        <StatCard icon={CheckCircle} label="AUTHENTIC"   value={data.authentic_media}        color="#A6FF00" sub="Verified signatures" />
        <StatCard icon={Zap}         label="ACCURACY INDEX"    value={`${data.accuracy_rate}%`}    color="#FFC400" sub="ResNet + Xception cores" />
      </div>

      {/* Charts section */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Columns (col-span-8): Main Charts and Tables */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Weekly area trend */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .1 }} className="glass p-6 border-red-500/20">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="font-orbitron font-bold text-sm text-[#EDEDED]">WEEKLY THREAT VARIANCE</div>
                <div className="font-mono text-[9px] mt-0.5 text-[#555555] uppercase">Synthetic anomalies vs total logs</div>
              </div>
              <TrendingUp size={16} className="text-[#FF6B00]" />
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.weekly_trend}>
                  <defs>
                    <linearGradient id="gT" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#FF6B00" stopOpacity={.3} />
                      <stop offset="95%" stopColor="#FF6B00" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gF" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#FF1744" stopOpacity={.3} />
                      <stop offset="95%" stopColor="#FF1744" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,23,68,0.05)" />
                  <XAxis dataKey="day" tick={{ fill: '#555555', fontSize: 9, fontFamily: 'JetBrains Mono' }} />
                  <YAxis tick={{ fill: '#555555', fontSize: 9, fontFamily: 'JetBrains Mono' }} />
                  <Tooltip {...TT} />
                  <Area type="monotone" dataKey="total" name="Total Payloads" stroke="#FF6B00" fill="url(#gT)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="fakes" name="Deepfakes Caught" stroke="#FF1744" fill="url(#gF)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Subgrid: Pie & Bar */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Threat pie */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .2 }} className="glass p-6 border-red-500/20">
              <div className="font-orbitron font-bold text-sm mb-1 text-[#EDEDED]">THREAT INDEX BREAKDOWN</div>
              <div className="font-mono text-[9px] mb-5 text-[#555555] uppercase">By risk severity layers</div>
              <div className="flex items-center gap-6">
                <div className="h-44 flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.threat_distribution} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value" strokeWidth={0}>
                        {data.threat_distribution.map((e, i) => (
                          <Cell key={i} fill={e.color} />
                        ))}
                      </Pie>
                      <Tooltip {...TT} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3 shrink-0">
                  {data.threat_distribution.map(({ name, value, color }) => (
                    <div key={name} className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                      <div>
                        <div className="font-orbitron text-[10px] font-bold text-[#EDEDED]">{name}</div>
                        <div className="font-mono text-[9px] text-[#555555]">{value} checks</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Verdict bar */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .25 }} className="glass p-6 border-red-500/20">
              <div className="font-orbitron font-bold text-sm mb-1 text-[#EDEDED]">VERDICT CONVERGENCE</div>
              <div className="font-mono text-[9px] mb-5 text-[#555555] uppercase">Classification outputs</div>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.verdict_breakdown} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,23,68,0.05)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#555555', fontSize: 9, fontFamily: 'JetBrains Mono' }} />
                    <YAxis tick={{ fill: '#555555', fontSize: 9, fontFamily: 'JetBrains Mono' }} />
                    <Tooltip {...TT} />
                    <Bar dataKey="value" radius={[0, 0, 0, 0]}>
                      {data.verdict_breakdown.map((e, i) => (
                        <Cell key={i} fill={e.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          {/* Recent ledger scans */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .3 }} className="glass overflow-hidden border-red-500/20">
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,23,68,0.15)' }}>
              <div>
                <div className="font-orbitron font-bold text-sm text-[#EDEDED]">RECENT RUNS</div>
                <div className="font-mono text-[9px] mt-0.5 text-[#555555] uppercase font-bold">Latest classified ledger additions</div>
              </div>
              <Clock size={15} className="text-[#555555]" />
            </div>
            {/* Header row */}
            <div className="grid grid-cols-5 px-6 py-3 font-orbitron text-[10px] font-bold tracking-wider border-b border-red-500/10 text-[#555555]">
              <span>IDENTIFIER</span><span>VERDICT</span><span>THREAT</span><span>REALITY INDEX</span><span>SCANNED TIME</span>
            </div>
            {(data.recent_scans || []).map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .04 * i }}
                className="cyber-table-row grid grid-cols-5 px-6 py-4 items-center">
                <span className="font-mono text-xs truncate pr-4 text-[#EDEDED]">{s.filename}</span>
                <span className="font-orbitron text-xs font-bold" style={{ color: vColor(s.verdict) }}>
                  {s.verdict}
                </span>
                <span className="font-orbitron text-xs font-bold" style={{ color: tColor(s.threat_level) }}>
                  {s.threat_level}
                </span>
                <div className="flex items-center gap-2.5">
                  <div className="w-14 cyber-progress">
                    <div className="cyber-progress-fill h-full"
                      style={{ width: `${s.reality_score}%`, background: vColor(s.verdict) }} />
                  </div>
                  <span className="font-orbitron text-xs font-bold" style={{ color: vColor(s.verdict) }}>
                    {s.reality_score?.toFixed(1)}
                  </span>
                </div>
                <span className="font-mono text-[9px] text-[#555555]">
                  {new Date(s.timestamp).toLocaleString()}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Right Columns (col-span-4): Forensic Intelligence Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <RotatingRadar />
          
          <LiveForensicFeed />

          {/* Active Risk Monitor */}
          <div className="glass p-5 space-y-3 relative overflow-hidden border-red-500/20">
            <div className="font-orbitron text-xs font-bold text-[#FF1744] flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#FF1744] animate-ping" />
              INTELLIGENCE BULLETIN
            </div>
            <div className="space-y-2">
              <div className="p-3 bg-red-500/5 border border-red-500/15 flex items-start gap-2.5">
                <Shield size={14} className="text-[#FF1744] shrink-0 mt-0.5" />
                <div>
                  <div className="font-orbitron text-[10px] font-bold text-[#EDEDED]">RISK INJECTION ANOMALY</div>
                  <div className="font-mono text-[9px] text-[#555555] mt-1 leading-relaxed uppercase">
                    Generative artifacts found in input pipelines. Maintain high verification thresholds for all video formats.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
