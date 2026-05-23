import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle, XCircle, AlertTriangle,
  Search, Clock, Upload, ChevronRight
} from 'lucide-react'
import axios from 'axios'

const DEMO = [
  { scan_id: 'demo-1', filename: 'interview_clip.mp4', verdict: 'MANIPULATED', threat_level: 'CRITICAL', reality_score: 12.4, timestamp: new Date(Date.now()-1e6).toISOString() },
  { scan_id: 'demo-2', filename: 'news_footage.mp4',   verdict: 'AUTHENTIC',   threat_level: 'LOW',      reality_score: 88.6, timestamp: new Date(Date.now()-2e6).toISOString() },
  { scan_id: 'demo-3', filename: 'selfie_vid.mov',     verdict: 'SUSPICIOUS',  threat_level: 'MEDIUM',   reality_score: 51.2, timestamp: new Date(Date.now()-3e6).toISOString() },
  { scan_id: 'demo-4', filename: 'press_conf.mp4',     verdict: 'MANIPULATED', threat_level: 'HIGH',     reality_score: 22.8, timestamp: new Date(Date.now()-5e6).toISOString() },
  { scan_id: 'demo-5', filename: 'portrait.jpg',       verdict: 'AUTHENTIC',   threat_level: 'LOW',      reality_score: 91.3, timestamp: new Date(Date.now()-7e6).toISOString() },
]

const FILTERS = ['All', 'MANIPULATED', 'SUSPICIOUS', 'AUTHENTIC']
const vColor  = v => v === 'MANIPULATED' ? '#DC2626' : v === 'SUSPICIOUS' ? '#D97706' : '#059669'
const vBg     = v => v === 'MANIPULATED' ? '#FEE2E2' : v === 'SUSPICIOUS' ? '#FEF3C7' : '#D1FAE5'
const tColor  = t => t === 'CRITICAL' ? '#DC2626' : t === 'HIGH' ? '#EA580C' : t === 'MEDIUM' ? '#D97706' : '#059669'

export default function ScanHistory() {
  const navigate = useNavigate()
  const [scans, setScans]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]  = useState('All')
  const [search, setSearch]  = useState('')

  useEffect(() => {
    axios.get('/api/analytics/history')
      .then(r => setScans(r.data.scans || []))
      .catch(() => setScans(DEMO))
      .finally(() => setLoading(false))
  }, [])

  const filtered = scans
    .filter(s => filter === 'All' || s.verdict === filter)
    .filter(s => !search || s.filename.toLowerCase().includes(search.toLowerCase()))

  const total      = scans.length
  const fakes      = scans.filter(s => s.verdict === 'MANIPULATED').length
  const suspicious = scans.filter(s => s.verdict === 'SUSPICIOUS').length
  const authentic  = scans.filter(s => s.verdict === 'AUTHENTIC').length

  return (
    <div>
      {/* Page title */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>Scan History</h1>
        <p style={{ fontSize: 14, color: '#64748B' }}>Complete audit log of all analyzed media files.</p>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Scans', value: total,      color: '#2563EB', bg: '#EFF6FF' },
          { label: 'Deepfakes',   value: fakes,      color: '#DC2626', bg: '#FEE2E2' },
          { label: 'Suspicious',  value: suspicious,  color: '#D97706', bg: '#FEF3C7' },
          { label: 'Authentic',   value: authentic,   color: '#059669', bg: '#D1FAE5' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="card" style={{ textAlign: 'center', padding: 20 }}>
            <div style={{ fontSize: 28, fontWeight: 800, color, letterSpacing: '-0.02em' }}>{value}</div>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Main table card */}
      <div className="card" style={{ padding: 0 }}>
        {/* Toolbar */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input className="input" style={{ paddingLeft: 36, fontSize: 13 }}
              placeholder="Search by filename..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {/* Filter buttons */}
          <div style={{ display: 'flex', gap: 6 }}>
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{
                  padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  border: `1.5px solid ${filter === f ? '#2563EB' : '#E2E8F0'}`,
                  background: filter === f ? '#EFF6FF' : 'white',
                  color: filter === f ? '#2563EB' : '#64748B',
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1.2fr 1.5fr 48px', padding: '10px 20px', borderBottom: '1px solid #F1F5F9', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#94A3B8' }}>
          <span>Filename</span><span>Verdict</span><span>Threat</span><span>Reality Score</span><span>Scanned At</span><span />
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ padding: 24 }}>
            {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 48, marginBottom: 8 }} />)}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <Clock size={40} style={{ color: '#E2E8F0', margin: '0 auto 12px' }} />
            <div style={{ fontWeight: 600, color: '#1E293B', marginBottom: 6 }}>No records found</div>
            <div style={{ fontSize: 14, color: '#94A3B8', marginBottom: 20 }}>
              {search ? 'Try a different search term.' : 'Analyze your first file to see records here.'}
            </div>
            <button onClick={() => navigate('/scan')} className="btn btn-blue" style={{ margin: '0 auto', fontSize: 13, padding: '9px 20px' }}>
              <Upload size={14} /> Start Scanning
            </button>
          </div>
        )}

        {/* Rows */}
        {!loading && filtered.map((s, i) => {
          const Icon = s.verdict === 'MANIPULATED' ? XCircle : s.verdict === 'SUSPICIOUS' ? AlertTriangle : CheckCircle
          return (
            <div key={s.scan_id || i} className="table-row"
              style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1.2fr 1.5fr 48px', padding: '14px 20px', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => navigate(`/result/${s.scan_id}`)}>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingRight: 12 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: vBg(s.verdict), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={14} color={vColor(s.verdict)} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.filename}
                </span>
              </div>

              <span style={{ fontSize: 12, fontWeight: 700, color: vColor(s.verdict), background: vBg(s.verdict), padding: '4px 10px', borderRadius: 20, display: 'inline-block' }}>
                {s.verdict}
              </span>

              <span style={{ fontSize: 13, fontWeight: 700, color: tColor(s.threat_level) }}>
                {s.threat_level}
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="progress-track" style={{ width: 60 }}>
                  <div className="progress-fill" style={{ width: `${s.reality_score}%`, background: vColor(s.verdict) }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: vColor(s.verdict) }}>{s.reality_score?.toFixed(1)}</span>
              </div>

              <span style={{ fontSize: 12, color: '#94A3B8' }}>{new Date(s.timestamp).toLocaleString()}</span>

              <ChevronRight size={15} color="#CBD5E1" />
            </div>
          )
        })}

        {/* Footer count */}
        {!loading && filtered.length > 0 && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid #F1F5F9', fontSize: 12, color: '#94A3B8' }}>
            Showing {filtered.length} of {scans.length} records
          </div>
        )}
      </div>
    </div>
  )
}
