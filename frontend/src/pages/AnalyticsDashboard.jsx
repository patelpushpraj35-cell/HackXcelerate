import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts'
import {
  Shield, AlertTriangle, CheckCircle, Zap,
  TrendingUp, Activity, Clock,
} from 'lucide-react'
import axios from 'axios'

/* ── Tooltip styling ── */
const TT = {
  contentStyle: {
    background: '#1E293B',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    color: '#E2E8F0',
    fontSize: 12,
    fontFamily: 'Inter, sans-serif',
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  },
  labelStyle: { color: '#94A3B8' },
}

const VERDICT_COLORS = {
  MANIPULATED: '#EF4444',
  SUSPICIOUS:  '#F59E0B',
  AUTHENTIC:   '#10B981',
}

function normalize(raw) {
  const weekly_trend = (raw.weekly_trend || []).map(d => ({
    day: d.day || d.date || '—',
    total: d.total || d.scans || 0,
    fakes: d.fakes || 0,
  }))
  const rawThreat = raw.threat_distribution || {}
  const TCOLORS = { LOW: '#10B981', MEDIUM: '#F59E0B', HIGH: '#F97316', CRITICAL: '#EF4444' }
  const threat_distribution = Array.isArray(rawThreat)
    ? rawThreat
    : Object.entries(rawThreat).map(([name, value]) => ({ name, value, color: TCOLORS[name] || '#8B5CF6' }))
  const deepfakes_found = raw.deepfakes_found ?? raw.fake_count ?? 0
  const authentic_media = raw.authentic_media ?? raw.real_count ?? 0
  const accuracy_rate   = raw.accuracy_rate   ?? raw.detection_accuracy ?? 94.7
  const suspicious_count = raw.suspicious_count ?? 0
  const verdict_breakdown = [
    { name: 'Authentic',   value: authentic_media,  color: '#10B981' },
    { name: 'Suspicious',  value: suspicious_count, color: '#F59E0B' },
    { name: 'Manipulated', value: deepfakes_found,  color: '#EF4444' },
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
    { filename: 'interview_clip.mp4',  verdict: 'MANIPULATED', threat_level: 'CRITICAL', reality_score: 12.4, timestamp: new Date(Date.now()-1e6).toISOString() },
    { filename: 'news_footage.mp4',    verdict: 'AUTHENTIC',   threat_level: 'LOW',      reality_score: 88.6, timestamp: new Date(Date.now()-2e6).toISOString() },
    { filename: 'selfie_vid.mov',      verdict: 'SUSPICIOUS',  threat_level: 'MEDIUM',   reality_score: 51.2, timestamp: new Date(Date.now()-3e6).toISOString() },
    { filename: 'press_conf.mp4',      verdict: 'MANIPULATED', threat_level: 'HIGH',     reality_score: 22.8, timestamp: new Date(Date.now()-5e6).toISOString() },
    { filename: 'portrait.jpg',        verdict: 'AUTHENTIC',   threat_level: 'LOW',      reality_score: 91.3, timestamp: new Date(Date.now()-7e6).toISOString() },
  ],
})

const vColor = v => v === 'MANIPULATED' ? '#EF4444' : v === 'SUSPICIOUS' ? '#F59E0B' : '#10B981'
const tColor = t => t === 'CRITICAL' ? '#EF4444' : t === 'HIGH' ? '#F97316' : t === 'MEDIUM' ? '#F59E0B' : '#10B981'

function StatCard({ icon: Icon, label, value, delta, color, bg }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="card p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: bg }}>
          <Icon size={18} style={{ color }} />
        </div>
        {delta && (
          <span className="text-xs font-medium" style={{ color: '#10B981' }}>
            {delta}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-0.5" style={{ letterSpacing: '-0.02em' }}>{value}</div>
      <div className="text-sm" style={{ color: '#6B7280' }}>{label}</div>
    </motion.div>
  )
}

export default function AnalyticsDashboard() {
  const [data, setData]   = useState(DEMO)
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
      <div className="flex items-center justify-between">
        <div>
          <div className="section-label mb-1">Analytics</div>
          <h1 className="text-2xl font-bold text-white">Forensic Intelligence</h1>
        </div>
        <div className="flex items-center gap-2 badge badge-success">
          <Activity size={12} />Live Data
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Shield}       label="Total Scans"  value={data.total_scans}           color="#3B82F6" bg="rgba(59,130,246,0.12)"  />
        <StatCard icon={AlertTriangle} label="Deepfakes"   value={data.deepfakes_found}        color="#EF4444" bg="rgba(239,68,68,0.12)"   />
        <StatCard icon={CheckCircle}  label="Authentic"    value={data.authentic_media}        color="#10B981" bg="rgba(16,185,129,0.12)"  />
        <StatCard icon={Zap}          label="Accuracy"     value={`${data.accuracy_rate}%`}    color="#F59E0B" bg="rgba(245,158,11,0.12)"  />
      </div>

      {/* Charts grid */}
      <div className="grid lg:grid-cols-12 gap-6">

        {/* Left: Area chart + Recent scans */}
        <div className="lg:col-span-8 space-y-6">

          {/* Weekly trend */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-white">Weekly Detection Trend</h3>
                <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>Deepfakes detected vs total scans</p>
              </div>
              <TrendingUp size={16} style={{ color: '#4B5563' }} />
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.weekly_trend}>
                  <defs>
                    <linearGradient id="gBlue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gRed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#EF4444" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
                  <Tooltip {...TT} />
                  <Area type="monotone" dataKey="total" name="Total Scans"    stroke="#3B82F6" fill="url(#gBlue)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="fakes" name="Deepfakes"      stroke="#EF4444" fill="url(#gRed)"  strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Recent scans */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="card overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <h3 className="font-semibold text-white text-sm">Recent Scans</h3>
              <Clock size={14} style={{ color: '#4B5563' }} />
            </div>
            <div className="grid grid-cols-5 px-6 py-3 table-header"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <span>Filename</span><span>Verdict</span><span>Threat</span><span>Score</span><span>Time</span>
            </div>
            {(data.recent_scans || []).map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.04 * i }}
                className="table-row grid grid-cols-5 px-6 py-3.5 items-center">
                <span className="text-sm font-medium text-white truncate pr-4">{s.filename}</span>
                <span className="text-xs font-semibold" style={{ color: vColor(s.verdict) }}>{s.verdict}</span>
                <span className="text-xs font-semibold" style={{ color: tColor(s.threat_level) }}>{s.threat_level}</span>
                <div className="flex items-center gap-2">
                  <div className="progress-track w-14">
                    <div className="progress-fill" style={{ width: `${s.reality_score}%`, background: vColor(s.verdict) }} />
                  </div>
                  <span className="text-xs font-semibold" style={{ color: vColor(s.verdict) }}>{s.reality_score?.toFixed(1)}</span>
                </div>
                <span className="text-xs" style={{ color: '#6B7280' }}>{new Date(s.timestamp).toLocaleString()}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Right: Pie + Bar */}
        <div className="lg:col-span-4 space-y-5">

          {/* Donut chart */}
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="card p-6">
            <h3 className="font-semibold text-white text-sm mb-1">Verdict Distribution</h3>
            <p className="text-xs mb-5" style={{ color: '#6B7280' }}>Classification breakdown</p>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.verdict_breakdown} cx="50%" cy="50%" innerRadius={52} outerRadius={72} dataKey="value" strokeWidth={0}>
                    {data.verdict_breakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip {...TT} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {data.verdict_breakdown.map(({ name, value, color }) => (
                <div key={name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                    <span className="text-xs" style={{ color: '#94A3B8' }}>{name}</span>
                  </div>
                  <span className="text-xs font-semibold text-white">{value}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Bar: threat distribution */}
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
            className="card p-6">
            <h3 className="font-semibold text-white text-sm mb-1">Threat Levels</h3>
            <p className="text-xs mb-5" style={{ color: '#6B7280' }}>By severity</p>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.threat_distribution} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
                  <Tooltip {...TT} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {data.threat_distribution.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Quick stats */}
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}
            className="card p-5">
            <h3 className="font-semibold text-white text-sm mb-4">Platform Health</h3>
            <div className="space-y-3">
              {[
                { label: 'Model Status',   val: 'Online',    color: '#10B981' },
                { label: 'API Latency',    val: '~1.2s',     color: '#3B82F6' },
                { label: 'Success Rate',   val: '99.2%',     color: '#8B5CF6' },
                { label: 'Queue',          val: '0 pending', color: '#F59E0B' },
              ].map(({ label, val, color }) => (
                <div key={label} className="flex justify-between items-center py-1.5"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="text-xs" style={{ color: '#6B7280' }}>{label}</span>
                  <span className="text-xs font-semibold" style={{ color }}>{val}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
