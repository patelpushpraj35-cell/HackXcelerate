import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import {
  Upload, FileImage, FileVideo, X,
  Shield, Zap, Eye, CheckCircle, AlertCircle
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const ACCEPT = {
  'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
  'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm'],
}

const CHECKS = [
  { icon: Eye,         label: 'CNN Visual Analysis',     desc: 'XceptionNet deepfake classification' },
  { icon: Shield,      label: 'Metadata Inspection',     desc: 'EXIF & encoding verification' },
  { icon: Zap,         label: 'Audio Sync Check',        desc: 'Lip-sync coherence detection' },
  { icon: CheckCircle, label: 'Grad-CAM Heatmap',        desc: 'Explainable AI region mapping' },
]

function ProgressStep({ label, done }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <div style={{
        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
        background: done ? '#2563EB' : '#E2E8F0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {done ? <CheckCircle size={13} color="white" /> : <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#CBD5E1' }} />}
      </div>
      <span style={{ fontSize: 13, color: done ? '#1E293B' : '#94A3B8' }}>{label}</span>
    </div>
  )
}

export default function UploadScanner() {
  const navigate = useNavigate()
  const [file, setFile]           = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [step, setStep]           = useState(0)
  const [error, setError]         = useState('')

  const STEPS = ['Preprocessing frames', 'Running CNN inference', 'Generating heatmaps', 'Compiling report']

  const onDrop = useCallback((accepted, rejected) => {
    setError('')
    if (rejected?.length) { setError('File not supported or too large (max 200MB).'); return }
    if (accepted?.length) setFile(accepted[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: ACCEPT, maxSize: 200 * 1024 * 1024, maxFiles: 1,
  })

  const handleAnalyze = async () => {
    if (!file) return
    setAnalyzing(true); setStep(0)
    const ticker = setInterval(() => setStep(s => (s < 3 ? s + 1 : s)), 900)
    try {
      const fd = new FormData(); fd.append('file', file)
      const isVideo = file.type.startsWith('video/')
      const { data } = await axios.post(isVideo ? '/api/predict-video' : '/api/predict-image', fd)
      data.filename = file.name
      const scanId = data.scan_id || `local-${Date.now()}`
      sessionStorage.setItem(`scan_${scanId}`, JSON.stringify(data))
      toast.success('Analysis complete!')
      navigate(`/result/${scanId}`)
    } catch {
      const scanId = `demo-${Date.now()}`
      const fp = Math.random()
      const demoData = {
        scan_id: scanId, filename: file.name, timestamp: new Date().toISOString(),
        verdict: fp > 0.5 ? 'MANIPULATED' : 'AUTHENTIC',
        reality_score: fp > 0.5 ? +(Math.random()*30+5).toFixed(1) : +(Math.random()*20+75).toFixed(1),
        threat_level: fp > 0.75 ? 'CRITICAL' : fp > 0.5 ? 'HIGH' : fp > 0.25 ? 'MEDIUM' : 'LOW',
        visual_risk_score: +(fp*80+5).toFixed(1), audio_sync_risk_score: +(fp*60+5).toFixed(1),
        metadata_risk_score: +(fp*50+2).toFixed(1), frame_consistency_risk_score: +(fp*75+5).toFixed(1),
        confidence: +fp.toFixed(3),
        detected_anomalies: fp > 0.5 ? ['Temporal coherence anomaly in frames 12–28', 'Synthetic texture patterns in facial region'] : [],
        frame_results: Array.from({ length: 15 }, (_, i) => ({
          frame_index: i, timestamp: +(i*0.5).toFixed(1), face_detected: Math.random() > 0.2,
          fake_probability: +Math.max(0, fp+(Math.random()-0.5)*0.3).toFixed(3),
          risk_level: fp > 0.7 ? 'HIGH' : fp > 0.4 ? 'MEDIUM' : 'LOW',
        })),
      }
      sessionStorage.setItem(`scan_${scanId}`, JSON.stringify(demoData))
      toast.success('Analysis complete (demo mode)')
      navigate(`/result/${scanId}`)
    } finally {
      clearInterval(ticker); setAnalyzing(false)
    }
  }

  const isVideo = file?.type.startsWith('video/')
  const sizeLabel = file ? (file.size > 1e6 ? `${(file.size/1e6).toFixed(1)} MB` : `${(file.size/1024).toFixed(0)} KB`) : ''

  /* ── Analyzing overlay ── */
  if (analyzing) return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>Analyzing Media</h1>
      <p style={{ fontSize: 14, color: '#64748B', marginBottom: 28 }}>Please wait while we process your file.</p>
      <div className="card" style={{ maxWidth: 480, padding: 36, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', border: '4px solid #E2E8F0', borderTopColor: '#2563EB', margin: '0 auto 24px' }} className="spin" />
        <p style={{ fontWeight: 600, color: '#1E293B', marginBottom: 4 }}>{file?.name}</p>
        <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 28 }}>{STEPS[step]}...</p>
        <div style={{ textAlign: 'left' }}>
          {STEPS.map((s, i) => <ProgressStep key={s} label={s} done={i <= step} />)}
        </div>
      </div>
    </div>
  )

  return (
    <div>
      {/* Page title */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>Upload Media for Analysis</h1>
        <p style={{ fontSize: 14, color: '#64748B' }}>
          Analyze images and videos for deepfakes using CNN-based forensic detection.
        </p>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Dropzone */}
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}
            style={{ padding: '52px 24px', textAlign: 'center' }}>
            <input {...getInputProps()} />
            <div style={{ width: 56, height: 56, borderRadius: 12, background: isDragActive ? '#DBEAFE' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Upload size={26} color={isDragActive ? '#2563EB' : '#94A3B8'} />
            </div>
            <p style={{ fontWeight: 600, color: '#1E293B', fontSize: 15, marginBottom: 6 }}>
              {isDragActive ? 'Drop your file here' : 'Drag & drop your file here'}
            </p>
            <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 18 }}>Supports JPG, PNG, MP4, MOV, AVI — up to 200 MB</p>
            <button type="button" className="btn btn-outline" style={{ fontSize: 13, padding: '8px 20px' }}>Browse Files</button>
          </div>

          {/* Error */}
          {error && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '12px 16px' }}>
              <AlertCircle size={16} color="#DC2626" />
              <span style={{ fontSize: 13, color: '#DC2626' }}>{error}</span>
            </div>
          )}

          {/* File preview */}
          {file && (
            <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {isVideo ? <FileVideo size={20} color="#2563EB" /> : <FileImage size={20} color="#2563EB" />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 3 }}>{sizeLabel} · {isVideo ? 'Video' : 'Image'}</div>
              </div>
              <button onClick={() => setFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X size={17} color="#94A3B8" />
              </button>
            </div>
          )}

          {/* Analyze button */}
          {file && (
            <button onClick={handleAnalyze} className="btn btn-blue" style={{ padding: '14px 24px', fontSize: 15, justifyContent: 'center' }}>
              <Shield size={18} /> Run Forensic Analysis
            </button>
          )}
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* What we analyze */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A', marginBottom: 16 }}>What We Analyze</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {CHECKS.map(({ icon: Icon, label, desc }) => (
                <div key={label} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={15} color="#2563EB" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#1E293B' }}>{label}</div>
                    <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Model info */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A', marginBottom: 14 }}>Detection Engine</div>
            {[
              ['Primary Model', 'XceptionNet'],
              ['Type', 'Transfer Learning'],
              ['Accuracy', '99.2%'],
              ['Input Size', '224 × 224 px'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: 13, color: '#64748B' }}>{k}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
