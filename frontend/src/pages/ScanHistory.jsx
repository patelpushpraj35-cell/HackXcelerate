import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock, XCircle, CheckCircle, AlertTriangle,
  Upload, ChevronRight, Search, Filter, TrendingUp,
} from 'lucide-react'
import axios from 'axios'

const DEMO_SCANS = [
  { scan_id:'demo-1', filename:'interview_clip.mp4',  verdict:'MANIPULATED', threat_level:'CRITICAL', reality_score:12.4, timestamp: new Date(Date.now()-1e6).toISOString() },
  { scan_id:'demo-2', filename:'news_footage.mp4',    verdict:'AUTHENTIC',   threat_level:'LOW',      reality_score:88.6, timestamp: new Date(Date.now()-2e6).toISOString() },
  { scan_id:'demo-3', filename:'selfie_vid.mov',      verdict:'SUSPICIOUS',  threat_level:'MEDIUM',   reality_score:51.2, timestamp: new Date(Date.now()-3e6).toISOString() },
  { scan_id:'demo-4', filename:'press_conf.mp4',      verdict:'MANIPULATED', threat_level:'HIGH',     reality_score:22.8, timestamp: new Date(Date.now()-5e6).toISOString() },
  { scan_id:'demo-5', filename:'portrait.jpg',        verdict:'AUTHENTIC',   threat_level:'LOW',      reality_score:91.3, timestamp: new Date(Date.now()-7e6).toISOString() },
]

const FILTERS = ['All', 'MANIPULATED', 'SUSPICIOUS', 'AUTHENTIC']

const vColor = v => v === 'MANIPULATED' ? '#EF4444' : v === 'SUSPICIOUS' ? '#F59E0B' : '#10B981'
const tColor = t => t === 'CRITICAL' ? '#EF4444' : t === 'HIGH' ? '#F97316' : t === 'MEDIUM' ? '#F59E0B' : '#10B981'

const VerdictBadge = ({ v }) => {
  const color = vColor(v)
  const Icon  = v === 'MANIPULATED' ? XCircle : v === 'SUSPICIOUS' ? AlertTriangle : CheckCircle
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: `${color}14`, color, border: `1px solid ${color}30` }}>
      <Icon size={11} />{v}
    </span>
  )
}

function SummaryCard({ label, value, color, bg }) {
  return (
    <div className="card p-4 text-center">
      <div className="text-2xl font-bold mb-0.5" style={{ color, letterSpacing: '-0.02em' }}>{value}</div>
      <div className="text-xs" style={{ color: '#6B7280' }}>{label}</div>
    </div>
  )
}

function ThreatBar({ label, pct, color }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span style={{ color: '#94A3B8' }}>{label}</span>
        <span className="font-semibold" style={{ color }}>{pct}%</span>
      </div>
      <div className="progress-track">
        <motion.div className="progress-fill"
          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ background: color }} />
      </div>
    </div>
  )
}

export default function ScanHistory() {
  const navigate = useNavigate()
  const [scans, setScans]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]  = useState('All')
  const [search, setSearch]  = useState('')

  useEffect(() => {
    axios.get('/api/analytics/history')
      .then(r => setScans(r.data.scans || []))
      .catch(() => setScans(DEMO_SCANS))
      .finally(() => setLoading(false))
  }, [])

  const filtered = scans
    .filter(s => filter === 'All' || s.verdict === filter)
    .filter(s => !search || s.filename.toLowerCase().includes(search.toLowerCase()))

  const fakes      = scans.filter(s => s.verdict === 'MANIPULATED').length
  const suspicious = scans.filter(s => s.verdict === 'SUSPICIOUS').length
  const authentic  = scans.filter(s => s.verdict === 'AUTHENTIC').length
  const total      = scans.length || 1

  return (
    <div className="max-w-7xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <div className="section-label mb-1">Audit Ledger</div>
        <h1 className="text-2xl font-bold text-white">Scan History</h1>
        <p className="mt-1 text-sm" style={{ color: '#94A3B8' }}>
          Complete record of all analyzed media files and forensic verdicts.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">

        {/* Left: Table */}
        <div className="lg:col-span-8 space-y-5">

          {/* Toolbar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#4B5563' }} />
              <input
                className="input pl-9"
                placeholder="Search by filename..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-1.5">
              {FILTERS.map(f => {
                const active = filter === f
                return (
                  <button key={f} onClick={() => setFilter(f)}
                    className="btn btn-sm"
                    style={{
                      background: active ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${active ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.08)'}`,
                      color: active ? '#60A5FA' : '#94A3B8',
                      fontSize: '12px', padding: '6px 12px',
                    }}>
                    {f}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Table */}
          <div className="card overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-5 px-6 py-3 table-header"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <span className="col-span-2">Filename</span>
              <span>Verdict</span>
              <span>Reality Score</span>
              <span>Scanned</span>
            </div>

            {loading ? (
              <div className="p-6 space-y-3">
                {Array(5).fill(0).map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-16 text-center">
                <Clock size={36} style={{ color: '#374151', margin: '0 auto 12px' }} />
                <div className="font-semibold text-white mb-1">No records found</div>
                <div className="text-sm mb-6" style={{ color: '#4B5563' }}>
                  {search ? 'Try a different search term' : 'Analyze your first media file to get started'}
                </div>
                <button onClick={() => navigate('/scan')} className="btn btn-primary btn-sm mx-auto">
                  <Upload size={14} />Start Scanning
                </button>
              </div>
            ) : (
              <AnimatePresence>
                {filtered.map((s, i) => (
                  <motion.div key={s.scan_id || i}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="table-row grid grid-cols-5 px-6 py-4 items-center cursor-pointer group"
                    onClick={() => navigate(`/result/${s.scan_id}`)}>

                    <div className="col-span-2 flex items-center gap-3 pr-4">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `${vColor(s.verdict)}12` }}>
                        {s.verdict === 'MANIPULATED' ? <XCircle size={13} style={{ color: vColor(s.verdict) }} />
                          : s.verdict === 'SUSPICIOUS' ? <AlertTriangle size={13} style={{ color: vColor(s.verdict) }} />
                          : <CheckCircle size={13} style={{ color: vColor(s.verdict) }} />}
                      </div>
                      <span className="font-medium text-sm text-white truncate">{s.filename}</span>
                    </div>

                    <VerdictBadge v={s.verdict} />

                    <div className="flex items-center gap-2.5">
                      <div className="progress-track w-16">
                        <div className="progress-fill" style={{ width: `${s.reality_score}%`, background: vColor(s.verdict) }} />
                      </div>
                      <span className="text-xs font-semibold" style={{ color: vColor(s.verdict) }}>
                        {s.reality_score?.toFixed(1)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: '#6B7280' }}>
                        {new Date(s.timestamp).toLocaleString()}
                      </span>
                      <ChevronRight size={13} style={{ color: '#374151' }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}

            {filtered.length > 0 && (
              <div className="px-6 py-3 text-xs" style={{ borderTop: '1px solid rgba(255,255,255,0.07)', color: '#4B5563' }}>
                Showing {filtered.length} of {scans.length} records
              </div>
            )}
          </div>
        </div>

        {/* Right: Sidebar */}
        <div className="lg:col-span-4 space-y-5">

          {/* Summary counts */}
          <div className="grid grid-cols-3 gap-3">
            <SummaryCard label="Fakes"      value={fakes}      color="#EF4444" />
            <SummaryCard label="Suspicious" value={suspicious}  color="#F59E0B" />
            <SummaryCard label="Authentic"  value={authentic}   color="#10B981" />
          </div>

          {/* Threat distribution */}
          <div className="card p-5">
            <h3 className="font-semibold text-white text-sm mb-4 flex items-center gap-2">
              <TrendingUp size={14} className="text-blue-400" />Threat Distribution
            </h3>
            <div className="space-y-4">
              <ThreatBar label="Critical / High" pct={Math.round(((scans.filter(s => ['CRITICAL','HIGH'].includes(s.threat_level)).length) / total) * 100)} color="#EF4444" />
              <ThreatBar label="Medium Risk"      pct={Math.round(((scans.filter(s => s.threat_level === 'MEDIUM').length) / total) * 100)} color="#F59E0B" />
              <ThreatBar label="Low / Safe"       pct={Math.round(((scans.filter(s => s.threat_level === 'LOW').length) / total) * 100)} color="#10B981" />
            </div>
          </div>

          {/* Activity feed */}
          <div className="card p-5">
            <h3 className="font-semibold text-white text-sm mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {DEMO_SCANS.slice(0, 4).map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: vColor(s.verdict) }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white truncate">{s.filename}</div>
                    <div className="text-xs mt-0.5" style={{ color: vColor(s.verdict) }}>{s.verdict}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
