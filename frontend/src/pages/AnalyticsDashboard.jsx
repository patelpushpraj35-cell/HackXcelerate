import { useEffect, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts'
import { Shield, AlertTriangle, CheckCircle, Zap, TrendingUp, Activity } from 'lucide-react'
import axios from 'axios'

const TOOLTIP_STYLE = {
  contentStyle: { background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 12, color: '#1E293B', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' },
}

const DEMO = {
  total_scans: 23, deepfakes_found: 11, authentic_media: 9, accuracy_rate: 94.7, suspicious_count: 3,
  weekly_trend: [
    { day: 'Mon', total: 6,  fakes: 4  },
    { day: 'Tue', total: 13, fakes: 5  },
    { day: 'Wed', total: 9,  fakes: 3  },
    { day: 'Thu', total: 15, fakes: 8  },
    { day: 'Fri', total: 11, fakes: 6  },
    { day: 'Sat', total: 8,  fakes: 4  },
    { day: 'Sun', total: 8,  fakes: 5  },
  ],
  threat_distribution: [
    { name: 'LOW',      value: 9,  color: '#059669' },
    { name: 'MEDIUM',   value: 6,  color: '#D97706' },
    { name: 'HIGH',     value: 5,  color: '#EA580C' },
    { name: 'CRITICAL', value: 3,  color: '#DC2626' },
  ],
  verdict_breakdown: [
    { name: 'Authentic',   value: 9,  color: '#059669' },
    { name: 'Suspicious',  value: 3,  color: '#D97706' },
    { name: 'Manipulated', value: 11, color: '#DC2626' },
  ],
  recent_scans: [
    { filename: 'interview_clip.mp4', verdict: 'MANIPULATED', threat_level: 'CRITICAL', reality_score: 12.4, timestamp: new Date(Date.now()-1e6).toISOString() },
    { filename: 'news_footage.mp4',   verdict: 'AUTHENTIC',   threat_level: 'LOW',      reality_score: 88.6, timestamp: new Date(Date.now()-2e6).toISOString() },
    { filename: 'selfie_vid.mov',     verdict: 'SUSPICIOUS',  threat_level: 'MEDIUM',   reality_score: 51.2, timestamp: new Date(Date.now()-3e6).toISOString() },
    { filename: 'press_conf.mp4',     verdict: 'MANIPULATED', threat_level: 'HIGH',     reality_score: 22.8, timestamp: new Date(Date.now()-5e6).toISOString() },
    { filename: 'portrait.jpg',       verdict: 'AUTHENTIC',   threat_level: 'LOW',      reality_score: 91.3, timestamp: new Date(Date.now()-7e6).toISOString() },
  ],
}

const vColor = v => v === 'MANIPULATED' ? '#DC2626' : v === 'SUSPICIOUS' ? '#D97706' : '#059669'
const vBg    = v => v === 'MANIPULATED' ? '#FEE2E2' : v === 'SUSPICIOUS' ? '#FEF3C7' : '#D1FAE5'
const tColor = t => t === 'CRITICAL' ? '#DC2626' : t === 'HIGH' ? '#EA580C' : t === 'MEDIUM' ? '#D97706' : '#059669'

function StatCard({ icon: Icon, label, value, iconBg, iconColor }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 46, height: 46, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={20} color={iconColor} />
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>{value}</div>
        <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>{label}</div>
      </div>
    </div>
  )
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState(DEMO)

  useEffect(() => {
    axios.get('/api/analytics/dashboard').then(r => {
      const d = r.data
      setData({
        total_scans: d.total_scans ?? DEMO.total_scans,
        deepfakes_found: d.fake_count ?? DEMO.deepfakes_found,
        authentic_media: d.real_count ?? DEMO.authentic_media,
        accuracy_rate: d.detection_accuracy ?? DEMO.accuracy_rate,
        suspicious_count: d.suspicious_count ?? DEMO.suspicious_count,
        weekly_trend: d.weekly_trend || DEMO.weekly_trend,
        threat_distribution: d.threat_distribution || DEMO.threat_distribution,
        verdict_breakdown: DEMO.verdict_breakdown,
        recent_scans: d.recent_scans || DEMO.recent_scans,
      })
    }).catch(() => setData(DEMO))
  }, [])

  return (
    <div>
      {/* Page title */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>Analytics Dashboard</h1>
        <p style={{ fontSize: 14, color: '#64748B' }}>Forensic intelligence and detection metrics.</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard icon={Shield}        label="Total Scans"  value={data.total_scans}       iconBg="#EFF6FF" iconColor="#2563EB" />
        <StatCard icon={AlertTriangle} label="Deepfakes"    value={data.deepfakes_found}    iconBg="#FEE2E2" iconColor="#DC2626" />
        <StatCard icon={CheckCircle}   label="Authentic"    value={data.authentic_media}    iconBg="#D1FAE5" iconColor="#059669" />
        <StatCard icon={Zap}           label="Accuracy"     value={`${data.accuracy_rate}%`} iconBg="#FEF3C7" iconColor="#D97706" />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, marginBottom: 20 }}>

        {/* Area chart */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#0F172A' }}>Weekly Detection Trend</div>
              <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 3 }}>Total scans vs deepfakes detected</div>
            </div>
            <TrendingUp size={16} color="#CBD5E1" />
          </div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.weekly_trend}>
                <defs>
                  <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gFakes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#DC2626" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="total" name="Total Scans" stroke="#2563EB" fill="url(#gTotal)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="fakes" name="Deepfakes"   stroke="#DC2626" fill="url(#gFakes)"  strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut chart */}
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 15, color: '#0F172A', marginBottom: 4 }}>Verdict Breakdown</div>
          <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 16 }}>Classification results</div>
          <div style={{ height: 150 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.verdict_breakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value" strokeWidth={0}>
                  {data.verdict_breakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip {...TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {data.verdict_breakdown.map(({ name, value, color }) => (
              <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                  <span style={{ fontSize: 13, color: '#64748B' }}>{name}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bar + Recent scans row */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>

        {/* Bar chart */}
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 15, color: '#0F172A', marginBottom: 4 }}>Threat Levels</div>
          <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 16 }}>By severity</div>
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.threat_distribution} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                  {data.threat_distribution.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent scans */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#0F172A' }}>Recent Scans</div>
            <Activity size={15} color="#CBD5E1" />
          </div>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '10px 20px', borderBottom: '1px solid #F1F5F9', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#94A3B8' }}>
            <span>File</span><span>Verdict</span><span>Score</span><span>Time</span>
          </div>
          {data.recent_scans.map((s, i) => (
            <div key={i} className="table-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '12px 20px', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 12 }}>{s.filename}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: vColor(s.verdict), background: vBg(s.verdict), padding: '3px 8px', borderRadius: 20, display: 'inline-block' }}>{s.verdict}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: vColor(s.verdict) }}>{s.reality_score?.toFixed(1)}</span>
              <span style={{ fontSize: 12, color: '#94A3B8' }}>{new Date(s.timestamp).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
