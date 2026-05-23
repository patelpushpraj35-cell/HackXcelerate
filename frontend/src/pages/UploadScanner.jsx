import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Video, ImageIcon, X, Cpu, Zap, AlertTriangle, Loader2, Activity, Crosshair } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

/* ── Tactical Waveform Visualizer ── */
function Waveform({ active }) {
  const bars = Array.from({ length: 32 }, (_, i) => i)
  return (
    <div className="flex items-center gap-0.5 h-8">
      {bars.map(i => (
        <div
          key={i}
          className="w-1 waveform-bar"
          style={{
            background: active
              ? i % 3 === 0 ? '#FF1744' : i % 3 === 1 ? '#FF6B00' : '#A6FF00'
              : 'rgba(255,255,255,0.05)',
            height: active ? `${20 + Math.random() * 80}%` : '20%',
            animationDuration: active ? `${0.4 + Math.random() * 0.6}s` : '1.2s',
            animationDelay: `${i * 0.04}s`,
            filter: active ? 'drop-shadow(0 0 3px currentColor)' : 'none',
            transition: 'background 0.3s, filter 0.3s',
          }}
        />
      ))}
    </div>
  )
}

/* ── Circular Scan Gauge ── */
function ScanRing({ progress }) {
  const r = 60, stroke = 4
  const norm = r - stroke / 2
  const circ = norm * 2 * Math.PI
  const offset = circ - (progress / 100) * circ
  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      {/* Outer targeting bracket ring */}
      <div className="absolute inset-0 rounded-full animate-ring-pulse"
        style={{ border: '1px dashed rgba(255,23,68,0.4)' }} />
      <svg width={r*2} height={r*2} className="absolute" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={r} cy={r} r={norm} fill="none" stroke="rgba(255,23,68,0.06)" strokeWidth={stroke} />
        <circle cx={r} cy={r} r={norm} fill="none"
          stroke="url(#scanGrad)" strokeWidth={stroke}
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.4s ease', filter: 'drop-shadow(0 0 6px #FF1744)' }}
        />
        <defs>
          <linearGradient id="scanGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF1744" />
            <stop offset="100%" stopColor="#FF6B00" />
          </linearGradient>
        </defs>
      </svg>
      <div className="relative z-10 text-center">
        <div className="font-orbitron font-extrabold text-2xl text-[#FF6B00] tracking-tight">
          {Math.round(progress)}%
        </div>
        <div className="font-mono text-[9px] mt-0.5 text-[#555555]">INSPECTING</div>
      </div>
    </div>
  )
}

/* ── Infrared Scanning Target Scope Overlay ── */
function ScanOverlay({ active }) {
  if (!active) return null
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 10 }}>
      {/* Red scan beam */}
      <div className="scan-beam-line" />
      {/* Crimson Grid */}
      <div className="absolute inset-0 grid-overlay opacity-30" />
      {/* Corner target reticles */}
      <div className="scan-corner scan-corner-tl" />
      <div className="scan-corner scan-corner-tr" />
      <div className="scan-corner scan-corner-bl" />
      <div className="scan-corner scan-corner-br" />
      
      {/* Active lock on center scope */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded border border-red-500/40 opacity-40 animate-ring-pulse" />
          <div className="absolute inset-3 rounded border border-orange-500/20 opacity-20 animate-ring-pulse"
            style={{ animationDelay: '0.5s' }} />
          {/* Target Scope Crosshairs */}
          <div className="absolute top-1/2 left-0 right-0 h-px bg-red-500/30" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-red-500/30" />
        </div>
      </div>

      <div className="absolute bottom-3 left-0 right-0 flex justify-center">
        <div className="font-mono text-[9px] px-3 py-1 bg-black border border-red-500/30 text-[#FF1744]">
          [!] FORENSIC DEEP-SCAN ACTIVE
        </div>
      </div>
    </div>
  )
}

/* ── Infrared Threat Sweep Radar ── */
function ThreatRadar({ scanning }) {
  return (
    <div className="glass p-5 relative overflow-hidden flex flex-col items-center justify-center border-red-500/20" style={{ height: 168 }}>
      <div className="absolute top-3 left-4 font-mono text-[9px] tracking-widest text-[#FF1744] flex items-center gap-1.5">
        <Activity size={10} className={scanning ? 'animate-pulse' : ''} />
        FORENSIC RADAR
      </div>
      <div className="relative w-28 h-28 border border-red-500/20 rounded flex items-center justify-center">
        {/* conic scan sweep */}
        <div className={`absolute inset-0 rounded origin-center bg-[conic-gradient(from_0deg,transparent_50%,rgba(255,23,68,0.12))] pointer-events-none ${scanning ? 'animate-radar' : ''}`} />
        
        {/* Target grids */}
        <div className="w-20 h-20 border border-orange-500/10 rounded absolute" />
        <div className="w-12 h-12 border border-red-500/10 rounded absolute" />
        
        {/* Tactical lock signals */}
        <div className="absolute top-4 left-8 w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" style={{ animationDuration: '3s' }} />
        <div className="absolute bottom-6 right-8 w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" style={{ animationDuration: '4s', animationDelay: '1s' }} />
        {scanning && (
          <div className="absolute top-10 right-4 w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_#FF1744] animate-pulse" />
        )}
        
        <div className="absolute top-1/2 left-0 right-0 h-px bg-red-500/10" />
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-red-500/10" />
        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
      </div>
      <div className="absolute bottom-2 font-mono text-[9px] uppercase" style={{ color: scanning ? '#FF1744' : '#555555' }}>
        {scanning ? 'SCANNING RADIATION CORES' : 'RADAR STANDBY'}
      </div>
    </div>
  )
}

/* ── Hardware Core Telemetry ── */
function NeuralCoreStatus() {
  const [metrics, setMetrics] = useState({ cpu: 12, gpu: 24, temp: 41, delay: 14 })
  useEffect(() => {
    const t = setInterval(() => {
      setMetrics({
        cpu: Math.round(10 + Math.random() * 8),
        gpu: Math.round(20 + Math.random() * 12),
        temp: Math.round(38 + Math.random() * 4),
        delay: Math.round(11 + Math.random() * 4)
      })
    }, 2000)
    return () => clearInterval(t)
  }, [])
  
  return (
    <div className="glass p-5 space-y-3 relative overflow-hidden border-red-500/20" style={{ height: 168 }}>
      <div className="font-orbitron text-xs font-bold flex items-center gap-2 text-[#FF6B00]">
        <Cpu size={12} className="animate-spin-slow" />
        HARDWARE CORE
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'CPU Load', value: `${metrics.cpu}%`, color: '#FF1744' },
          { label: 'GPU Node', value: `${metrics.gpu}%`, color: '#FF6B00' },
          { label: 'Core Temp', value: `${metrics.temp}°C`, color: '#FFC400' },
          { label: 'Latency', value: `${metrics.delay}ms`, color: '#A6FF00' },
        ].map(m => (
          <div key={m.label} className="bg-black/40 p-2 rounded border border-white/5">
            <div className="font-mono text-[9px] text-[#555555]">{m.label}</div>
            <div className="font-orbitron text-xs font-bold mt-0.5" style={{ color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Tactical Scan Diagnostic Steps ── */
const LOG_MSGS = [
  { t: 'Initializing TruthLens Forensic Intake Command…', c: '#FFC400' },
  { t: 'Decoding container stream frames via OpenCV engine…', c: '#EDEDED' },
  { t: 'Mapping facial region boundaries using Haar Cascades…', c: '#EDEDED' },
  { t: 'Resizing regions to 224x224 neural matrix resolution…', c: '#EDEDED' },
  { t: 'Analyzing spatial Exif header block indicators…', c: '#EDEDED' },
  { t: 'Testing frame-to-frame temporal noise variance…', c: '#FF6B00' },
  { t: 'Evaluating lipsync speech phoneme sequence lags…', c: '#FF6B00' },
  { t: 'Running weighted neural inference models…', c: '#FF6B00' },
  { t: '[WARNING] Target chroma frequency mismatch detected', c: '#FF1744' },
  { t: 'Generating Grad-CAM pixel intensity map overlays…', c: '#EDEDED' },
  { t: 'Calculating global weighted confidence matrix…', c: '#EDEDED' },
  { t: 'Compiling secure cryptographic threat report…', c: '#FF1744' },
  { t: '[OK] Evidence verification sequence complete.', c: '#A6FF00' },
]

export default function UploadScanner() {
  const navigate = useNavigate()
  const [file, setFile]         = useState(null)
  const [preview, setPreview]   = useState(null)
  const [fileType, setFileType] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [logs, setLogs]         = useState([])
  const [progress, setProgress] = useState(0)
  const logRef = useRef(null)

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [logs])

  const onDrop = useCallback((accepted) => {
    const f = accepted[0]
    if (!f) return
    const isVid = f.type.startsWith('video/')
    const isImg = f.type.startsWith('image/')
    if (!isVid && !isImg) { toast.error('Unsupported file type'); return }
    setFile(f)
    setFileType(isVid ? 'video' : 'image')
    setPreview(URL.createObjectURL(f))
    setLogs([])
    setProgress(0)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'video/*': ['.mp4','.avi','.mov','.mkv'], 'image/*': ['.jpg','.jpeg','.png','.webp'] },
    maxFiles: 1, maxSize: 100 * 1024 * 1024,
  })

  const runScan = async () => {
    if (!file) return
    setScanning(true); setLogs([]); setProgress(0)

    let logIdx = 0
    const logInterval = setInterval(() => {
      if (logIdx < LOG_MSGS.length - 1) {
        setLogs(prev => [...prev, LOG_MSGS[logIdx]])
        setProgress(Math.round((logIdx / (LOG_MSGS.length - 1)) * 88))
        logIdx++
      }
    }, 500)

    try {
      const form = new FormData()
      form.append('file', file)
      const endpoint = fileType === 'video' ? '/api/predict-video' : '/api/predict-image'
      const res = await axios.post(endpoint, form)

      clearInterval(logInterval)
      setLogs(LOG_MSGS)
      setProgress(100)

      const report = {
        scan_id: res.data.scan_id || `scan-${Date.now()}`,
        timestamp: res.data.timestamp || new Date().toISOString(),
        ...res.data
      }
      sessionStorage.setItem(`scan_${report.scan_id}`, JSON.stringify(report))
      toast.success('Evidence ingestion complete!')
      setTimeout(() => navigate(`/result/${report.scan_id}`), 900)
    } catch (err) {
      clearInterval(logInterval)
      setScanning(false)
      const msg = err.response?.data?.detail || 'Analysis failed. Confirm backend server execution.'
      toast.error(msg)
    }
  }

  const clear = () => { setFile(null); setPreview(null); setFileType(null); setLogs([]); setProgress(0); setScanning(false) }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="font-mono text-xs tracking-widest text-[#FF1744]">— CLASSIFIED FORENSIC INTAKE v4.9 —</div>
          <span className="w-1.5 h-1.5 bg-[#FF1744] animate-pulse" />
        </div>
        <h1 className="font-orbitron font-extrabold text-3xl text-[#EDEDED] tracking-tight">MEDIA ANALYSIS CHAMBER</h1>
        <p className="font-mono text-xs text-[#555555]">
          Feed binary payloads or stream sequences to execute neural classification, artifact scanning, and EXIF target search.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Drop Zone / Active Target Preview */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: 0.1 }}
          className="lg:col-span-7 space-y-5"
        >
          {!file ? (
            <div
              {...getRootProps()}
              className={`drop-zone h-[380px] flex flex-col items-center justify-center gap-6 relative group overflow-hidden ${isDragActive ? 'active' : ''}`}
              style={{ border: '1px dashed rgba(255, 23, 68, 0.3)' }}
            >
              <input {...getInputProps()} />

              {/* Moving grid background */}
              <div className="absolute inset-0 moving-grid opacity-10 group-hover:opacity-20 transition-opacity" />
              
              {/* L-shaped corners */}
              <div className="scan-corner scan-corner-tl" />
              <div className="scan-corner scan-corner-tr" />
              <div className="scan-corner scan-corner-bl" />
              <div className="scan-corner scan-corner-br" />

              {/* Scanning Red Laser Line */}
              <div className="scan-beam-line" />

              {/* Glowing submit reticle */}
              <div className="relative">
                <div className="absolute inset-0 rounded border animate-ring-pulse"
                  style={{ borderColor: 'rgba(255,23,68,0.4)' }} />
                <div className="w-24 h-24 rounded flex items-center justify-center relative"
                  style={{ background: 'rgba(255,23,68,0.05)', border: '1px solid rgba(255,23,68,0.2)' }}>
                  <Upload size={36} className="text-[#FF6B00] glow-orange-sm" />
                </div>
              </div>

              <div className="text-center space-y-1.5 relative z-10 px-6">
                <p className="font-orbitron font-extrabold text-xs tracking-widest text-[#EDEDED]">
                  {isDragActive ? 'DEPOSIT PAYLOAD TO CHAMBER' : 'SUBMIT EVIDENCE PAYLOAD'}
                </p>
                <p className="font-mono text-[10px] text-[#555555] max-w-sm mx-auto leading-relaxed uppercase">
                  Acceptable streams: MP4, AVI, MOV, JPG, PNG, WEBP. Maximum payload limits: 100MB.
                </p>
              </div>
              
              <button className="btn-cyber text-[10px] px-5 py-2 relative z-10 cursor-pointer">SELECT SYSTEM FILE</button>
            </div>
          ) : (
            <div className="glass h-[380px] flex flex-col overflow-hidden relative border-red-500/20">
              {/* File header */}
              <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(255,23,68,0.15)' }}>
                <div className="flex items-center gap-2">
                  {fileType === 'video'
                    ? <Video size={14} className="text-[#FF1744]" />
                    : <ImageIcon size={14} className="text-[#FF6B00]" />}
                  <span className="font-mono text-xs text-[#EDEDED] truncate max-w-xs">{file.name}</span>
                </div>
                <button onClick={clear} className="w-7 h-7 rounded flex items-center justify-center hover:bg-[#FF1744]/10 text-[#555555] hover:text-[#FF1744] transition-colors cursor-pointer">
                  <X size={14} />
                </button>
              </div>

              {/* Preview frame with laser sweeps */}
              <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
                {fileType === 'video'
                  ? <video src={preview} controls className="w-full h-full object-contain" />
                  : <img src={preview} alt="Preview" className="w-full h-full object-contain" />}
                <ScanOverlay active={scanning} />
              </div>

              <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderTop: '1px solid rgba(255,23,68,0.1)' }}>
                <span className="font-mono text-xs text-[#555555]">{(file.size/1024/1024).toFixed(2)} MB</span>
                <span className="badge-fake text-xs">{fileType?.toUpperCase()}</span>
              </div>
            </div>
          )}

          {/* Format indicators */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Video, label: 'PAYLOAD CONTAINERS', formats: 'MP4, AVI, MOV, MKV', color: '#FF1744' },
              { icon: ImageIcon, label: 'STILL IMAGERY', formats: 'JPG, PNG, WEBP', color: '#FF6B00' },
            ].map(({ icon: Icon, label, formats, color }) => (
              <div key={label} className="glass p-4 flex items-center gap-3.5 border-red-500/10">
                <div className="w-9 h-9 rounded flex items-center justify-center shrink-0" style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
                  <Icon size={14} style={{ color }} />
                </div>
                <div>
                  <div className="font-orbitron text-xs font-bold text-[#EDEDED]">{label}</div>
                  <div className="font-mono text-[9px] mt-0.5 text-[#555555]">{formats}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right Side: Scan Trigger & Tactical Analytics */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: 0.15 }} 
          className="lg:col-span-5 space-y-6"
        >
          {/* Action Trigger button */}
          <button
            onClick={runScan}
            disabled={!file || scanning}
            className="w-full py-4 rounded font-orbitron font-bold text-xs tracking-widest flex items-center justify-center gap-3 transition-all duration-300 cursor-pointer"
            style={{
              background: !file || scanning
                ? 'rgba(255,23,68,0.04)'
                : 'var(--neon-orange)',
              color: !file || scanning ? '#555555' : '#050505',
              border: !file || scanning ? '1px solid rgba(255,23,68,0.15)' : 'none',
              boxShadow: file && !scanning ? '0 0 20px rgba(255,107,0,0.3)' : 'none',
            }}
          >
            {scanning ? (
              <><Loader2 size={16} className="animate-spin text-[#FF1744]" />CORE COGNITIVE SCANS RUNNING...</>
            ) : (
              <><Cpu size={16} />RUN DIAGNOSTIC CLASSIFICATION</>
            )}
          </button>

          {/* Subgrid: Radar + Sensors */}
          <div className="grid grid-cols-2 gap-4">
            <ThreatRadar scanning={scanning} />
            <NeuralCoreStatus />
          </div>

          {/* Calibrator Weights list */}
          <div className="glass p-5 border-red-500/20">
            <div className="font-orbitron text-xs font-bold mb-4 flex items-center gap-2 text-[#FF1744]">
              <Zap size={12} className="animate-pulse" />
              INTELLIGENCE LAYER RATIOS
            </div>
            <div className="space-y-1">
              {[
                { label: 'CNN Facial Texture Analysis (Xception)', weight: '40%', color: '#FF1744' },
                { label: 'Temporal Consistency Evaluation',     weight: '25%', color: '#FF6B00' },
                { label: 'Pearson LipSync Core',                weight: '20%', color: '#FFC400' },
                { label: 'Structural Exif Integrity Checks',    weight: '15%', color: '#A6FF00' },
              ].map(({ label, weight, color }) => (
                <div key={label} className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid rgba(255,23,68,0.06)' }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 5px ${color}` }} />
                    <span className="font-mono text-xs text-[#AAAAAA]">{label}</span>
                  </div>
                  <span className="font-orbitron text-xs font-bold" style={{ color }}>{weight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Waveform & system warnings */}
          <div className="grid grid-cols-1 gap-4">
            <div className="glass p-4.5 border-red-500/20">
              <div className="font-mono text-[9px] mb-3 text-[#555555] tracking-wider uppercase">Telemetry Signal Activity</div>
              <Waveform active={scanning} />
            </div>

            <div className="glass p-4 flex gap-3.5 border border-orange-500/10">
              <AlertTriangle size={15} className="text-[#FFC400] shrink-0 mt-0.5" />
              <p className="font-mono text-[10px] leading-relaxed text-[#555555] uppercase">
                FORENSIC SYSTEM INFORMATION: Targets are computed on deep probabilistic weights. Run Grad-CAM visualizer to examine specific focal points.
              </p>
            </div>
          </div>

          {/* Scan Diagnostic Logs console */}
          <AnimatePresence>
            {scanning && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="glass p-5 flex gap-5 items-start border border-red-500/25 bg-black/90"
              >
                <ScanRing progress={progress} />
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-[9px] mb-2 flex items-center gap-2 text-[#555555] uppercase font-bold">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    SURVEILLANCE CORE LOGS
                  </div>
                  <div ref={logRef} className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {logs.map((l, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="terminal-line"
                        style={{ color: l.c }}
                      >
                        › {l.t}
                      </motion.div>
                    ))}
                    <span className="animate-blink font-mono text-xs text-[#FF6B00]">█</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
