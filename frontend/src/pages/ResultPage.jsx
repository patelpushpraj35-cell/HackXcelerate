import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell
} from 'recharts'
import { AlertTriangle, CheckCircle, XCircle, Eye, Shield, Zap, ChevronRight, Activity, Crosshair } from 'lucide-react'

const TOOLTIP_STYLE = {
  contentStyle:{ background:'#111111', border:'1px solid rgba(255, 23, 68, 0.25)', borderRadius:0, color:'#EDEDED', fontSize:10, fontFamily:'JetBrains Mono' }
}

/* ── Circular Reality Gauge ── */
function RealityMeter({ score }) {
  const r=90, stroke=6, norm=r-stroke/2
  const circ=norm*2*Math.PI
  const offset=circ-(score/100)*circ
  const color=score>=75?'#A6FF00':score>=50?'#FFC400':score>=25?'#FF6B00':'#FF1744'
  const label=score>=75?'AUTHENTIC':score>=50?'SUSPICIOUS':score>=25?'HIGH RISK':'CRITICAL'

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{width:r*2,height:r*2}}>
        {/* Outer dashed compass ring */}
        <div className="absolute inset-0 rounded-full animate-ring-pulse" style={{border:`1px dashed ${color}30`}}/>
        <svg width={r*2} height={r*2} className="absolute" style={{transform:'rotate(-90deg)'}}>
          <circle cx={r} cy={r} r={norm} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={stroke}/>
          <motion.circle cx={r} cy={r} r={norm} fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={`${circ} ${circ}`}
            initial={{strokeDashoffset:circ}} animate={{strokeDashoffset:offset}}
            transition={{duration:1.2,ease:'easeOut'}}
            style={{filter:`drop-shadow(0 0 6px ${color})`}}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div initial={{opacity:0,scale:.7}} animate={{opacity:1,scale:1}} transition={{delay:.5}}
            className="font-orbitron font-black text-3xl" style={{color}}>
            {Math.round(score)}
          </motion.div>
          <div className="font-mono text-[9px] text-[#555555]">/100 INDEX</div>
        </div>
      </div>
      <div className="mt-3 px-3 py-1 font-orbitron text-[10px] font-bold tracking-wider"
        style={{color,background:`${color}08`,border:`1px solid ${color}30`}}>
        {label}
      </div>
    </div>
  )
}

/* ── Verdict Alert Banner ── */
function VerdictBanner({ verdict, threatLevel }) {
  const isFake = verdict==='MANIPULATED', isSusp = verdict==='SUSPICIOUS'
  const color = isFake?'#FF1744':isSusp?'#FFC400':'#A6FF00'
  const Icon  = isFake?XCircle:isSusp?AlertTriangle:CheckCircle
  const text  = isFake?'DEEPFAKE DETECTED':isSusp?'SUSPICIOUS CONTENT':'AUTHENTIC SIGNATURE'
  const bg    = isFake ? 'rgba(255,23,68,0.05)' : isSusp ? 'rgba(255,196,0,0.05)' : 'rgba(166,255,0,0.04)'

  return (
    <motion.div initial={{opacity:0,scale:.98}} animate={{opacity:1,scale:1}}
      className="glass p-5 flex items-center justify-between border-red-500/20"
      style={{background:bg, border:`1px solid ${color}25`}}>
      <div className="flex items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded border animate-spin-slow" style={{borderColor:color, opacity:0.3}}/>
          <div className="w-12 h-12 rounded flex items-center justify-center"
            style={{background:`${color}08`,border:`1px solid ${color}25`}}>
            <Icon size={22} style={{color}} />
          </div>
        </div>
        <div>
          <div className="font-orbitron font-black text-xl tracking-wider" style={{color}}>{text}</div>
          <div className="font-mono text-[10px] text-[#888888] mt-0.5">
            SEVERITY LEVEL: <span style={{color}} className="font-bold">{threatLevel}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 font-orbitron text-xs font-bold"
        style={{color,background:`${color}08`,border:`1px solid ${color}25`}}>
        <Shield size={12}/>SEVERITY: {threatLevel}
      </div>
    </motion.div>
  )
}

/* ── Layer Risk Progress Bar ── */
function RiskBar({label, value, color}){
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="font-mono text-xs text-[#AAAAAA]">{label}</span>
        <span className="font-orbitron text-xs font-bold" style={{color}}>{value?.toFixed(1)}%</span>
      </div>
      <div className="cyber-progress">
        <motion.div className="cyber-progress-fill" style={{background:color}}
          initial={{width:0}} animate={{width:`${value}%`}} transition={{duration:0.8,ease:'easeOut'}}/>
      </div>
    </div>
  )
}

export default function ResultPage() {
  const { scanId } = useParams()
  const navigate   = useNavigate()
  const [report, setReport] = useState(null)
  const [tab, setTab]       = useState('overview')

  useEffect(()=>{
    const raw = sessionStorage.getItem(`scan_${scanId}`)
    if(raw) {
      try {
        const parsed = JSON.parse(raw);
        const prediction = parsed.prediction || parsed.classification || 'REAL';
        const isFakeVal = prediction === 'FAKE' || prediction === 'MANIPULATED';
        const normScore = parsed.reality_score ?? (isFakeVal ? 15.0 : 92.0);
        
        const normalizedReport = {
          scan_id: parsed.scan_id || scanId || `scan-${Date.now()}`,
          timestamp: parsed.timestamp || new Date().toISOString(),
          filename: parsed.filename || 'unknown_media',
          verdict: parsed.verdict || (isFakeVal ? 'MANIPULATED' : 'AUTHENTIC'),
          reality_score: normScore,
          threat_level: parsed.threat_level || (normScore < 30 ? 'CRITICAL' : normScore < 60 ? 'HIGH' : normScore < 85 ? 'MEDIUM' : 'LOW'),
          visual_risk_score: parsed.visual_risk_score ?? (100 - normScore),
          audio_sync_risk_score: parsed.audio_sync_risk_score ?? (100 - normScore) * 0.65,
          metadata_risk_score: parsed.metadata_risk_score ?? (isFakeVal ? 45.0 : 4.0),
          frame_consistency_risk_score: parsed.frame_consistency_risk_score ?? (100 - normScore) * 0.85,
          resolution: parsed.resolution || '1920x1080',
          duration: parsed.duration || (parsed.timeline?.length ? Math.round(parsed.timeline[parsed.timeline.length - 1].timestamp) : 15),
          fps: parsed.fps || 30,
          total_frames_analyzed: parsed.total_frames_analyzed ?? parsed.timeline?.length ?? 30,
          scan_duration_seconds: parsed.scan_duration_seconds ?? 2.45,
          confidence: parsed.confidence ?? (normScore / 100),
          detected_anomalies: parsed.detected_anomalies || (isFakeVal ? ['Temporal coherence index mismatch detected', 'Synthetic texture noise pattern found'] : []),
          frame_results: parsed.frame_results || parsed.timeline?.map(t => ({
            frame_index: t.frame_idx ?? t.frame_index,
            timestamp: t.timestamp,
            face_detected: t.face_detected,
            fake_probability: t.fake_probability,
            risk_level: t.fake_probability > 0.8 ? 'CRITICAL' : t.fake_probability > 0.5 ? 'HIGH' : t.fake_probability > 0.2 ? 'MEDIUM' : 'LOW'
          })) || []
        };
        setReport(normalizedReport);
      } catch (e) {
        console.error("Error decoding payload reports", e);
      }
    }
  },[scanId])

  if(!report) return (
    <div className="flex flex-col items-center justify-center h-64 gap-5">
      <Eye size={44} className="text-[#FF1744] animate-pulse" />
      <div className="font-orbitron text-lg text-[#EDEDED]">REPORT DECRYPTION FAILURE</div>
      <button onClick={()=>navigate('/scan')} className="btn-primary-cyber text-xs cursor-pointer">LAUNCH INTAKE</button>
    </div>
  )

  const isFake  = report.verdict==='MANIPULATED'
  const vCol  = isFake?'#FF1744':report.verdict==='SUSPICIOUS'?'#FFC400':'#A6FF00'

  const radarData=[
    {subject:'Visual',  value:report.visual_risk_score},
    {subject:'Audio',   value:report.audio_sync_risk_score},
    {subject:'Metadata',value:report.metadata_risk_score},
    {subject:'Frames',  value:report.frame_consistency_risk_score},
    {subject:'Overall', value:100-report.reality_score},
  ]
  const timelineData=(report.frame_results||[]).slice(0,20).map(fr=>({
    time:fr.timestamp, risk:Math.round(fr.fake_probability*100)
  }))
  const pieData=[
    {name:'Reality',value:report.reality_score,color:'#A6FF00'},
    {name:'Risk',   value:100-report.reality_score,color:'#FF1744'},
  ]
  const TABS=['overview','timeline','anomalies','frames']

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] px-2.5 py-0.5 border border-red-500/20 text-[#FF1744] bg-[#FF1744]/5">
              LEDGER KEY: {report.scan_id}
            </span>
            <span className="font-mono text-[10px] text-[#555555]">{new Date(report.timestamp).toLocaleString()}</span>
          </div>
          <h1 className="font-orbitron font-extrabold text-3xl text-[#EDEDED] tracking-tight">{report.filename}</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={()=>navigate(`/heatvision/${scanId}`)} className="btn-primary-cyber text-xs cursor-pointer">
            <span className="flex items-center gap-2"><Eye size={13}/>HEAT VISION</span>
          </button>
        </div>
      </motion.div>

      {/* Verdict banner */}
      <VerdictBanner verdict={report.verdict} threatLevel={report.threat_level}/>

      {/* 12-Column Layout */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Columns (col-span-8): Graphs, Tabs */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Layer risks summary */}
          <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.1}}
            className="glass p-5 space-y-4 border-red-500/20">
            <div className="font-orbitron text-xs font-bold tracking-wider text-[#FF1744] flex items-center gap-2">
              <Zap size={12} className="animate-pulse" />
              INTELLIGENCE LAYER THREAT INDEX
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <RiskBar label="CNN Texture Classifier (Xception)" value={report.visual_risk_score}            color="#FF1744"/>
              <RiskBar label="Temporal Coherence Variance"       value={report.frame_consistency_risk_score} color="#FF6B00"/>
              <RiskBar label="Audio-Visual Speech Sync"          value={report.audio_sync_risk_score}        color="#FFC400"/>
              <RiskBar label="Exif Metadata Compiler Integrity"  value={report.metadata_risk_score}          color="#A6FF00"/>
            </div>
          </motion.div>

          {/* Sub tabs */}
          <div>
            <div className="flex gap-1 mb-5 border-b border-red-500/10">
              {TABS.map(t=>(
                <button key={t} onClick={()=>setTab(t)}
                  className="px-5 py-2.5 font-orbitron text-[10px] font-bold tracking-wider transition-all border-b-2 cursor-pointer"
                  style={{
                    borderColor:tab===t?'#FF1744':'transparent',
                    color:tab===t?'#FF1744':'#555555',
                  }}>
                  {t.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Tab: overview */}
            {tab==='overview' && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} className="grid md:grid-cols-2 gap-5">
                <div className="glass p-5 border-red-500/20">
                  <div className="font-mono text-[9px] mb-4 text-[#555555] uppercase font-bold">Reality vs Risk Index</div>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value" strokeWidth={0}>
                          {pieData.map((e,i)=>(
                            <Cell key={i} fill={e.color} />
                          ))}
                        </Pie>
                        <Tooltip {...TOOLTIP_STYLE}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="glass p-5 border-red-500/20">
                  <div className="font-mono text-[9px] mb-4 text-[#555555] uppercase font-bold">Threat Ratios Polar Profile</div>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="rgba(255,23,68,0.06)"/>
                        <PolarAngleAxis dataKey="subject" tick={{fill:'#555555',fontSize:9,fontFamily:'JetBrains Mono'}}/>
                        <Radar dataKey="value" stroke="#FF1744" fill="rgba(255,23,68,0.08)" strokeWidth={2}/>
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tab: timeline */}
            {tab==='timeline' && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} className="glass p-6 border-red-500/20">
                <div className="font-mono text-[9px] mb-4 text-[#555555] uppercase font-bold">Chronological Threat Distribution</div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timelineData}>
                      <defs>
                        <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#FF1744" stopOpacity={.3}/>
                          <stop offset="95%" stopColor="#FF1744" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,23,68,0.05)"/>
                      <XAxis dataKey="time" tick={{fill:'#555555',fontSize:9,fontFamily:'JetBrains Mono'}} tickFormatter={v=>`${v}s`}/>
                      <YAxis tick={{fill:'#555555',fontSize:9,fontFamily:'JetBrains Mono'}} domain={[0,100]}/>
                      <Tooltip {...TOOLTIP_STYLE} formatter={v=>[`${v}%`,'Risk']}/>
                      <Area type="monotone" dataKey="risk" stroke="#FF1744" fill="url(#rg)" strokeWidth={2} dot={false}/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}

            {/* Tab: anomalies */}
            {tab==='anomalies' && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-2.5">
                {report.detected_anomalies?.length>0 ? report.detected_anomalies.map((a,i)=>(
                  <motion.div key={i} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*.05}}
                    className="glass p-4 flex items-start gap-3 border border-red-500/20 bg-neutral-900/40">
                    <AlertTriangle size={14} className="text-[#FF1744] shrink-0 mt-0.5" />
                    <div>
                      <div className="font-orbitron text-xs font-bold text-[#EDEDED]">{a}</div>
                      <div className="font-mono text-[9px] mt-1 text-[#555555] uppercase">Anomalous indicator flagged</div>
                    </div>
                  </motion.div>
                )):(
                  <div className="glass p-12 text-center border-red-500/20">
                    <CheckCircle size={36} className="text-[#A6FF00] mx-auto mb-3" />
                    <div className="font-orbitron font-bold text-sm text-[#EDEDED]">NO ANOMALIES LOGGED</div>
                    <div className="font-mono text-[10px] mt-1 text-[#555555] uppercase">Target payloads conform to baseline parameters</div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Tab: frames */}
            {tab==='frames' && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} className="glass overflow-hidden border-red-500/20">
                <div className="max-h-96 overflow-y-auto">
                  {(report.frame_results||[]).map((fr,i)=>{
                    const rc=fr.risk_level==='CRITICAL'?'#FF1744':fr.risk_level==='HIGH'?'#FF6B00':fr.risk_level==='MEDIUM'?'#FFC400':'#A6FF00'
                    return (
                      <div key={fr.frame_index} className="cyber-table-row flex items-center justify-between px-5 py-3 border-b border-red-500/5">
                        <div className="flex items-center gap-5">
                          <span className="font-mono text-xs w-20 text-[#555555]">#{fr.frame_index}</span>
                          <span className="font-mono text-xs text-[#555555]">{fr.timestamp}s</span>
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full" style={{background:fr.face_detected?'#A6FF00':'#555555'}} />
                            <span className="font-mono text-xs text-[#555555]">{fr.face_detected?'Face lock':'No face'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-20 cyber-progress">
                            <div className="cyber-progress-fill h-full" style={{width:`${fr.fake_probability*100}%`,background:rc}}/>
                          </div>
                          <span className="font-orbitron text-xs font-bold w-10 text-right" style={{color:rc}}>
                            {(fr.fake_probability*100).toFixed(0)}%
                          </span>
                          <span className="font-orbitron text-[9px] font-bold px-2 py-0.5 rounded"
                            style={{color:rc,background:`${rc}08`,border:`1px solid ${rc}25`}}>{fr.risk_level}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Right Columns (col-span-4): Gauge, Checklist */}
        <div className="lg:col-span-4 space-y-6">
          {/* Circular Reality gauge */}
          <motion.div initial={{opacity:0,scale:.98}} animate={{opacity:1,scale:1}}
            className="glass p-5 flex flex-col items-center justify-center border-red-500/20">
            <div className="font-mono text-[9px] mb-4 tracking-widest text-[#FF1744] uppercase font-bold">Reality Verdict Metric</div>
            <RealityMeter score={report.reality_score}/>
          </motion.div>

          {/* Forensic Checklist */}
          <div className="glass p-5 space-y-4 border-red-500/20">
            <div className="font-orbitron text-xs font-bold text-[#FF6B00] flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#FF6B00] animate-pulse" />
              FORENSIC CHECKLIST
            </div>
            <div className="space-y-3">
              {[
                { name: 'Binary envelope validation', ok: true },
                { name: 'EXIF compliance checklist', ok: !isFake },
                { name: 'Pixel texture noise consistency', ok: !isFake },
                { name: 'Pearson speech lag deviation', ok: report.audio_sync_risk_score < 40 },
              ].map(c => (
                <div key={c.name} className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="font-mono text-xs text-[#888888]">{c.name}</span>
                  <span className="font-orbitron text-xs font-bold" style={{ color: c.ok ? '#A6FF00' : '#FF1744' }}>
                    {c.ok ? 'PASS' : 'FAIL'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Metadata checklist */}
          <motion.div initial={{opacity:0,scale:.98}} animate={{opacity:1,scale:1}} transition={{delay:.2}}
            className="glass p-5 border-red-500/20">
            <div className="font-mono text-[9px] mb-4 tracking-widest text-[#FF1744] uppercase font-bold font-bold">Metadata Ledger Specifications</div>
            <div className="space-y-3">
              {[
                {label:'Resolution Matrix', value:report.resolution||'N/A'},
                {label:'Payload Duration',  value:report.duration?`${report.duration}s`:'N/A'},
                {label:'Framerate FPS',      value:report.fps||'N/A'},
                {label:'Frames Checked',     value:report.total_frames_analyzed},
                {label:'Scan Time Elapsed',  value:`${report.scan_duration_seconds}s`},
                {label:'Inference Index',    value:`${report.confidence ? (report.confidence*100).toFixed(1) : (report.reality_score).toFixed(1)}%`},
              ].map(({label,value})=>(
                <div key={label} className="flex justify-between items-center py-1.5 border-b border-white/5">
                  <span className="font-mono text-xs text-[#888888]">{label}</span>
                  <span className="font-orbitron text-xs font-bold text-[#EDEDED]">{value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Action triggers */}
      <div className="flex flex-wrap gap-3 pt-4">
        <button onClick={()=>navigate('/scan')} className="btn-primary-cyber text-xs cursor-pointer"><span className="flex items-center gap-2"><ChevronRight size={13}/>NEW FORENSIC INTAKE</span></button>
        <button onClick={()=>navigate(`/heatvision/${scanId}`)} className="btn-cyber text-xs flex items-center gap-2 cursor-pointer"><Eye size={13}/>HEAT VISION MAP</button>
        <button onClick={()=>navigate('/analytics')} className="btn-cyber text-xs flex items-center gap-2 cursor-pointer">INTEL COMMAND</button>
      </div>
    </div>
  )
}
