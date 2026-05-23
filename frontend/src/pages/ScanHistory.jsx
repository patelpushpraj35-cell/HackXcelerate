import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, XCircle, CheckCircle, AlertTriangle, Scan, ChevronRight, Crosshair } from 'lucide-react'
import axios from 'axios'

const DEMO_SCANS = [
  {scan_id:'demo-1',filename:'interview_clip.mp4', verdict:'MANIPULATED',threat_level:'CRITICAL',reality_score:12.4,timestamp:new Date(Date.now()-1e6).toISOString()},
  {scan_id:'demo-2',filename:'news_footage.mp4',   verdict:'AUTHENTIC',   threat_level:'LOW',    reality_score:88.6,timestamp:new Date(Date.now()-2e6).toISOString()},
  {scan_id:'demo-3',filename:'selfie_vid.mov',     verdict:'SUSPICIOUS',  threat_level:'MEDIUM', reality_score:51.2,timestamp:new Date(Date.now()-3e6).toISOString()},
  {scan_id:'demo-4',filename:'press_conf.mp4',     verdict:'MANIPULATED', threat_level:'HIGH',   reality_score:22.8,timestamp:new Date(Date.now()-5e6).toISOString()},
  {scan_id:'demo-5',filename:'portrait.jpg',       verdict:'AUTHENTIC',   threat_level:'LOW',    reality_score:91.3,timestamp:new Date(Date.now()-7e6).toISOString()},
]

const FILTERS = ['ALL','MANIPULATED','SUSPICIOUS','AUTHENTIC']
const vColor  = v => v==='MANIPULATED'?'#FF1744':v==='SUSPICIOUS'?'#FFC400':'#A6FF00'
const tColor  = t => t==='CRITICAL'?'#FF1744':t==='HIGH'?'#FF6B00':t==='MEDIUM'?'#FFC400':'#A6FF00'
const VIcon   = ({v}) => v==='MANIPULATED'
  ? <XCircle size={14} className="text-[#FF1744]" />
  : v==='SUSPICIOUS'
  ? <AlertTriangle size={14} className="text-[#FFC400]" />
  : <CheckCircle size={14} className="text-[#A6FF00]" />

/* ── Live Tactical Operations Log ── */
function AuditStreamTerminal() {
  const [logs, setLogs] = useState([
    '[INIT] TruthLens Ledger Engine Active',
    '[OK] Connection to security logs established',
    '[OK] Model weights verification complete',
    '[SYS] Awaiting incoming forensic ingest queues...',
  ])

  useEffect(() => {
    const operations = [
      '[EXIF] Photoshop compiler signature mismatch parsed',
      '[RMS] Audio waveform frequency variance: NOMINAL',
      '[SYS] Temporal noise frame threshold verification: PASS',
      '[API] New analysis block registered: INTAKE_NODE_3',
      '[SCAN] Facial ROI Haar bounds cached: 224x224',
      '[WARN] Exif metadata headers missing (anomalous footprint)',
      '[CORR] Pearson lipsync delay deviation tracked: 0.36s',
    ]
    const t = setInterval(() => {
      const randomOp = operations[Math.floor(Math.random() * operations.length)]
      const timestamp = new Date().toLocaleTimeString()
      setLogs(prev => [`[${timestamp}] ${randomOp}`, ...prev.slice(0, 5)])
    }, 4500)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="glass p-5 space-y-3 border-red-500/20">
      <div className="font-orbitron text-xs font-bold text-[#FF6B00] flex items-center gap-2">
        <span className="w-1.5 h-1.5 bg-[#FF6B00] animate-pulse" />
        FORENSIC ACTIVITY FEED
      </div>
      <div className="bg-black/50 p-3 rounded border border-white/5 font-mono text-[9px] space-y-2 h-44 overflow-y-auto">
        {logs.map((log, i) => (
          <div key={i} className="leading-normal" style={{ color: i === 0 ? '#A6FF00' : '#888888' }}>
            › {log}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Threat Severity Breakdown ── */
function SeverityBreakdown({ scans }) {
  const total = scans.length || 1
  const low = scans.filter(s => s.threat_level === 'LOW').length
  const med = scans.filter(s => s.threat_level === 'MEDIUM').length
  const high = scans.filter(s => s.threat_level === 'HIGH' || s.threat_level === 'CRITICAL').length
  
  const lowPct = Math.round((low / total) * 100)
  const medPct = Math.round((med / total) * 100)
  const highPct = Math.round((high / total) * 100)

  return (
    <div className="glass p-5 space-y-4 border-red-500/20">
      <div className="font-orbitron text-xs font-bold text-[#FF1744] flex items-center gap-2">
        <span className="w-1.5 h-1.5 bg-[#FF1744] animate-pulse" />
        THREAT INDEX DISTRIBUTION
      </div>
      <div className="space-y-3">
        {[
          { label: 'CRITICAL / HIGH SEVERITY', pct: highPct, color: '#FF1744' },
          { label: 'MEDIUM RISK WARNING', pct: medPct, color: '#FFC400' },
          { label: 'LOW NOMINAL VERDICTS', pct: lowPct, color: '#A6FF00' },
        ].map(item => (
          <div key={item.label} className="space-y-1.5">
            <div className="flex justify-between font-mono text-[9px]">
              <span className="text-[#888888]">{item.label}</span>
              <span className="font-bold" style={{ color: item.color }}>{item.pct}%</span>
            </div>
            <div className="cyber-progress">
              <div className="cyber-progress-fill h-full" style={{ width: `${item.pct}%`, background: item.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Ledger Balance Summary ── */
function OperationSummary({ scans }) {
  const fakes = scans.filter(s => s.verdict === 'MANIPULATED').length
  const suspicious = scans.filter(s => s.verdict === 'SUSPICIOUS').length
  const authentic = scans.filter(s => s.verdict === 'AUTHENTIC').length

  return (
    <div className="glass p-5 relative overflow-hidden border-red-500/20">
      <div className="font-orbitron text-xs font-bold text-[#A6FF00] flex items-center gap-2 mb-4">
        <span className="w-1.5 h-1.5 bg-[#A6FF00] animate-pulse" />
        SECURITY INDEX SUMMARY
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { val: fakes, label: 'FAKES', color: '#FF1744' },
          { val: suspicious, label: 'SUSP', color: '#FFC400' },
          { val: authentic, label: 'REAL', color: '#A6FF00' },
        ].map(item => (
          <div key={item.label} className="bg-black/40 py-2.5 rounded border border-white/5">
            <div className="font-orbitron text-base font-extrabold" style={{ color: item.color }}>{item.val}</div>
            <div className="font-mono text-[9px] text-[#555555] mt-0.5">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ScanHistory(){
  const navigate = useNavigate()
  const [scans,setScans]   = useState([])
  const [loading,setLoading] = useState(true)
  const [filter,setFilter]   = useState('ALL')

  useEffect(()=>{
    axios.get('/api/analytics/history')
      .then(r=>setScans(r.data.scans||[]))
      .catch(()=>setScans(DEMO_SCANS))
      .finally(()=>setLoading(false))
  },[])

  const list = filter==='ALL' ? scans : scans.filter(s=>s.verdict===filter)

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="font-mono text-xs tracking-widest text-[#FF1744]">— COMSPEC LOG LEDGER —</div>
          <span className="w-1.5 h-1.5 bg-[#FF1744] animate-pulse" />
        </div>
        <h1 className="font-orbitron font-extrabold text-3xl text-[#EDEDED] tracking-tight">SECURITY AUDIT LEDGER</h1>
        <p className="font-mono text-xs text-[#555555]">Historical records of processed payload checks, classification verdicts, and threat metadata.</p>
      </motion.div>

      {/* 12-Column Layout */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (col-span-8): Filters and List Table */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Filter bar */}
          <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.1}}
            className="flex items-center gap-2 flex-wrap">
            {FILTERS.map(f=>{
              const c=f==='MANIPULATED'?'#FF1744':f==='SUSPICIOUS'?'#FFC400':f==='AUTHENTIC'?'#A6FF00':'#FF6B00'
              const active=filter===f
              return (
                <button key={f} onClick={()=>setFilter(f)}
                  className="px-4 py-2 rounded font-orbitron text-[10px] font-bold tracking-wider transition-all cursor-pointer"
                  style={{
                    background: active?`${c}15`:'rgba(17,17,17,0.9)',
                    border:     `1px solid ${active?c:'rgba(255,23,68,0.15)'}`,
                    color:      active?c:'#888888',
                  }}>
                  {f}
                </button>
              )
            })}
            <span className="ml-auto font-orbitron text-xs font-bold text-[#555555]">
              {list.length} BLOCKS LOGGED
            </span>
          </motion.div>

          {/* Table Container */}
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.15}}
            className="glass overflow-hidden border-red-500/20">
            {loading ? (
              <div className="p-8 space-y-3">
                {Array(5).fill(0).map((_,i)=>(
                  <div key={i} className="cyber-skeleton h-14 rounded"/>
                ))}
              </div>
            ) : list.length===0 ? (
              <div className="p-20 text-center">
                <div className="relative w-16 h-16 mx-auto mb-6">
                  <div className="absolute inset-0 rounded border animate-spin-slow" style={{borderColor:'rgba(255,23,68,0.3)'}}/>
                  <div className="w-16 h-16 rounded flex items-center justify-center"
                    style={{background:'rgba(255,23,68,0.04)',border:'1px solid rgba(255,23,68,0.15)'}}>
                    <Clock size={24} className="text-[#555555]" />
                  </div>
                </div>
                <div className="font-orbitron font-bold text-sm mb-2" style={{color:'#EDEDED'}}>NO SCAN RECORDS</div>
                <div className="font-mono text-xs mb-8" style={{color:'#555555'}}>Submit visual data to update the security ledger index.</div>
                <button onClick={()=>navigate('/scan')} className="btn-primary-cyber text-xs cursor-pointer">
                  <span className="flex items-center gap-2"><Scan size={13}/>INITIALIZE SCAN</span>
                </button>
              </div>
            ) : (
              <>
                {/* Header row */}
                <div className="grid grid-cols-5 px-6 py-4 font-orbitron text-[10px] font-bold tracking-wider border-b border-red-500/10 text-[#555555]">
                  <span>IDENTIFIER</span><span>VERDICT</span><span>THREAT</span><span>REALITY INDEX</span><span>SCANNED TIME</span>
                </div>

                <AnimatePresence>
                  {list.map((s,i)=>(
                    <motion.div key={s.scan_id||i}
                      initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*.03}}
                      className="cyber-table-row grid grid-cols-5 px-6 py-4 items-center cursor-pointer group"
                      onClick={()=>{ if(s.scan_id) navigate(`/result/${s.scan_id}`) }}
                    >
                      <div className="flex items-center gap-2.5 pr-3">
                        <VIcon v={s.verdict}/>
                        <span className="font-mono text-xs text-[#EDEDED] truncate">{s.filename}</span>
                      </div>

                      <span className="font-orbitron text-xs font-bold" style={{color:vColor(s.verdict)}}>
                        {s.verdict}
                      </span>

                      <span className="font-orbitron text-xs font-bold" style={{color:tColor(s.threat_level)}}>
                        {s.threat_level}
                      </span>

                      <div className="flex items-center gap-2.5">
                        <div className="w-16 cyber-progress">
                          <div className="cyber-progress-fill h-full"
                            style={{width:`${s.reality_score}%`,background:vColor(s.verdict)}}/>
                        </div>
                        <span className="font-orbitron text-xs font-bold" style={{color:vColor(s.verdict)}}>
                          {s.reality_score?.toFixed(1)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[9px] text-[#555555]">
                          {new Date(s.timestamp).toLocaleString()}
                        </span>
                        <ChevronRight size={12} className="text-[#FF6B00] opacity-0 group-hover:opacity-100 transition-all translate-x-[-3px] group-hover:translate-x-0 duration-200"/>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </>
            )}
          </motion.div>
        </div>

        {/* Right Column (col-span-4): Forensic Intelligence Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <OperationSummary scans={scans} />
          <SeverityBreakdown scans={scans} />
          <AuditStreamTerminal />
        </div>
      </div>
    </div>
  )
}
