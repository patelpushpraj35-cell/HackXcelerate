import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Zap, ArrowRight, AlertTriangle, ChevronRight, Crosshair, Lock, Activity, Eye } from 'lucide-react'

/* ── Tactical Node Canvas ──────────────────────────────── */
function TacticalCanvas() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf
    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight
    const W = canvas.width, H = canvas.height
    const nodes = Array.from({ length: 45 }, () => ({
      x: Math.random()*W, y: Math.random()*H,
      vx:(Math.random()-.5)*.18, vy:(Math.random()-.5)*.18,
    }))
    let t = 0
    const draw = () => {
      ctx.clearRect(0,0,W,H); t+=.003
      nodes.forEach(n => {
        n.x+=n.vx; n.y+=n.vy
        if(n.x<0||n.x>W) n.vx*=-1
        if(n.y<0||n.y>H) n.vy*=-1
      })
      for (let i=0;i<nodes.length;i++) for(let j=i+1;j<nodes.length;j++){
        const d=Math.hypot(nodes[i].x-nodes[j].x,nodes[i].y-nodes[j].y)
        if(d<160){
          ctx.beginPath(); ctx.moveTo(nodes[i].x,nodes[i].y); ctx.lineTo(nodes[j].x,nodes[j].y)
          ctx.strokeStyle=`rgba(255, 23, 68, ${(1-d/160)*.14})`; ctx.lineWidth=.5; ctx.stroke()
        }
      }
      nodes.forEach((n,i)=>{
        const p=.3+.6*Math.abs(Math.sin(t+i*.4))
        ctx.beginPath(); ctx.arc(n.x,n.y,1.5,0,Math.PI*2)
        ctx.fillStyle=i%2===0?`rgba(255, 107, 0, ${p*.5})`:`rgba(166, 255, 0, ${p*.4})`; ctx.fill()
      })
      raf=requestAnimationFrame(draw)
    }
    draw()
    return ()=>cancelAnimationFrame(raf)
  },[])
  return <canvas ref={ref} className="fixed inset-0 pointer-events-none" style={{zIndex:0,opacity:.65}}/>
}

/* ── Radar Tactical Particles ────────────────────────── */
function Particles() {
  const list = Array.from({length:15},(_, i)=>({
    left:`${Math.random()*100}%`, dur:`${12+Math.random()*10}s`,
    delay:`${Math.random()*5}s`, size:`${1.5+Math.random()*1.5}px`,
    color:i%3===0?'#FF1744':i%3===1?'#FF6B00':'#A6FF00',
  }))
  return (
    <div className="particles-layer" style={{zIndex:1}}>
      {list.map((p,i)=>(
        <div key={i} className="particle" style={{
          left:p.left,width:p.size,height:p.size,background:p.color,
          boxShadow:`0 0 6px ${p.color}`,
          animationDuration:p.dur,animationDelay:p.delay,
          '--dx':`${(Math.random()-.5)*60}px`,'--op':0.4,
        }}/>
      ))}
    </div>
  )
}

const TERMINAL = [
  {t:'[SECURE] Initializing TruthLens Forensic Command...', c:'#FFC400'},
  {t:'[INTEL] Signal stream connected: COMM_SYS_INTAKE_1', c:'#EDEDED'},
  {t:'[SYS] Calibrating CNN ResNet & Xception neural cores...', c:'#EDEDED'},
  {t:'[SCAN] Target locks engaged on active media facial fields...', c:'#A6FF00'},
  {t:'[WARN] Chrominance noise misalignment detected on segment-6', c:'#FF1744'},
  {t:'[WARN] metadata header block stripped / modified', c:'#FF1744'},
  {t:'[ALERT] Generative adversarial patterns detected: 98.6%', c:'#FF1744'},
  {t:'[THREAT] Deepfake payload verification: POSITIVE', c:'#FF1744'},
]

const FEATURES = [
  {icon:Crosshair, title:'TACTICAL TARGET LOCK', desc:'Isolates facial coordinates to track spatial irregularities between video keyframes.', color:'#FF1744'},
  {icon:Shield,    title:'EXIF COMPLIANCE SEC', desc:'Inspects compiler headers, camera metadata signatures, and hash sequences for injection trace.', color:'#FFC400'},
  {icon:Zap,       title:'CHROMA CORRUPTIONS', desc:'Scans rgb subchannel noise distributions to catch generative artifacts and GAN residuals.', color:'#A6FF00'},
]

export default function LandingPage() {
  const navigate = useNavigate()
  const [termIdx, setTermIdx] = useState(0)

  useEffect(()=>{
    if(termIdx<TERMINAL.length){
      const t=setTimeout(()=>setTermIdx(i=>i+1),600)
      return ()=>clearTimeout(t)
    }
  },[termIdx])

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{background:'#050505'}}>
      <TacticalCanvas/>
      <Particles/>
      <div className="fixed inset-0 grid-overlay opacity-30 pointer-events-none" style={{zIndex:1}}/>
      
      {/* ── NAV BAR ── */}
      <nav className="relative z-20 flex items-center justify-between px-8 py-4"
        style={{borderBottom:'1px solid rgba(255, 23, 68, 0.15)',background:'#111111'}}>
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 rounded border animate-spin-slow" style={{borderColor:'rgba(255,23,68,0.4)'}}/>
            <div className="w-8 h-8 rounded flex items-center justify-center"
              style={{background:'rgba(255,23,68,0.08)',border:'1px solid rgba(255,23,68,0.3)'}}>
              <Crosshair size={16} className="text-[#FF1744] glow-red-sm" />
            </div>
          </div>
          <div>
            <span className="font-orbitron font-extrabold text-base text-[#EDEDED] tracking-wider">TRUTHLENS <span className="text-[#FF1744]">OS</span></span>
            <span className="font-mono text-[9px] text-[#A6FF00] ml-2 tracking-widest uppercase">COMSPEC v4.9</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 font-mono text-[10px] px-3 py-1 border border-red-500/20 text-[#FF1744] bg-[#FF1744]/5">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"/>SECURE NODE ACTIVE
          </div>
          <button onClick={()=>navigate('/analytics')} className="btn-cyber text-[10px] py-1.5 px-4 cursor-pointer">
            DASHBOARD
          </button>
          <button onClick={()=>navigate('/scan')} className="btn-primary-cyber text-[10px] cursor-pointer">
            LAUNCH INTAKE
          </button>
        </div>
      </nav>

      {/* ── HERO COMMAND PANEL ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-20 flex flex-col lg:flex-row items-center gap-16">
        
        {/* Left Side: Intimidating Militarized Headline */}
        <motion.div initial={{opacity:0,x:-30}} animate={{opacity:1,x:0}} transition={{duration:.7}} className="flex-1 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 font-mono text-[10px] border border-orange-500/25 text-[#FF6B00] bg-[#FF6B00]/5">
            <AlertTriangle size={11} className="text-[#FF6B00]"/>
            CLASSIFIED BRIEFING // ACTIVE DEEPFAKE DISRUPTION
          </div>

          <h1 className="font-orbitron font-black leading-none tracking-tight text-[#EDEDED]"
            style={{fontSize:'clamp(36px,5.5vw,70px)'}}>
            NEURAL <br />
            <span className="text-[#FF1744]">FORENSIC</span> <br />
            OVERRIDE.
          </h1>

          <p className="font-mono text-xs leading-relaxed max-w-lg text-[#AAAAAA]">
            TruthLens AI is a military-grade forensic operating command. Submit visual payloads to execute 6 layers of metadata, chroma noise, and temporal consistency scans. Locate and isolate target manipulation.
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <button onClick={()=>navigate('/scan')} className="btn-primary-cyber cursor-pointer">
              <span className="flex items-center gap-2 text-xs"><Crosshair size={14}/>SECURE SUBMIT<ArrowRight size={12}/></span>
            </button>
            <button onClick={()=>navigate('/analytics')} className="btn-cyber text-xs flex items-center gap-2 cursor-pointer">
              VIEW LEDGER STATUS
            </button>
          </div>

          {/* Core Telemetry Stats */}
          <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/5">
            {[
              {val:'3.1M+',label:'Signal Blocks Checked',color:'#FF1744'},
              {val:'982K+',label:'Manipulations Flagged',color:'#FF6B00'},
              {val:'99.4%',label:'Validation Index',color:'#A6FF00'},
            ].map(({val,label,color})=>(
              <div key={label}>
                <div className="font-orbitron font-black text-xl text-[#EDEDED]" style={{color}}>{val}</div>
                <div className="font-mono text-[9px] text-[#555555] uppercase mt-1 leading-tight">{label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right Side: Surveillance Screen & Live Terminal Logs */}
        <motion.div initial={{opacity:0,x:30}} animate={{opacity:1,x:0}} transition={{duration:.7,delay:.15}}
          className="flex-1 max-w-[520px] w-full space-y-4">
          
          {/* Mock CCTV Surveillance Feeds */}
          <div className="relative border border-red-500/25 bg-black/90 p-1.5 overflow-hidden">
            <div className="absolute top-2 left-3 font-mono text-[9px] text-[#FF1744] flex items-center gap-1.5 z-10">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"/>
              FEED_A: TARGET_SCAN_RECON
            </div>
            <div className="absolute bottom-2 right-3 font-mono text-[8px] text-[#A6FF00] z-10">
              LAT: 52.5200 // LONG: 13.4049
            </div>
            
            {/* Fine Reticle Grid Overlay */}
            <div className="absolute inset-0 grid-overlay-fine opacity-20 pointer-events-none" />
            
            {/* Scope Crosshair Lines */}
            <div className="absolute top-1/2 left-2 right-2 border-t border-red-500/10 pointer-events-none" />
            <div className="absolute left-1/2 top-2 bottom-2 border-l border-red-500/10 pointer-events-none" />

            {/* Target Box Overlay */}
            <motion.div 
              animate={{ x: [0, 80, -40, 0], y: [0, -30, 40, 0] }}
              transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
              className="absolute w-20 h-20 border border-[#A6FF00] pointer-events-none"
              style={{ top: '40%', left: '45%' }}
            >
              <span className="absolute -top-4 -left-1 font-mono text-[8px] text-[#A6FF00] font-bold">LOCK_ON</span>
            </motion.div>

            {/* Visual Signal Wave */}
            <div className="h-44 w-full bg-red-950/20 flex items-center justify-center relative">
              <div className="text-center space-y-1">
                <Activity size={24} className="mx-auto text-[#FF1744] animate-pulse" />
                <span className="block font-orbitron text-[10px] text-[#EDEDED] font-bold tracking-widest uppercase">SCANNING PAYLOAD WAVEFORM</span>
              </div>
            </div>
          </div>

          {/* Raw Terminal Feeds */}
          <div className="terminal-window overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2" style={{borderBottom:'1px solid rgba(255,23,68,0.15)',background:'#181818'}}>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-600"/>
                <span className="font-mono text-[9px] text-[#888888]">truthlens_override.sys</span>
              </div>
              <div className="flex items-center gap-1">
                <Activity size={9} className="text-[#FF6B00] animate-pulse"/>
                <span className="font-mono text-[8px] text-[#FF6B00] font-bold">MONITORING</span>
              </div>
            </div>
            <div className="p-4 min-h-44 space-y-1" style={{background:'#050505'}}>
              {TERMINAL.slice(0,termIdx).map((line,i)=>(
                <motion.div key={i} initial={{opacity:0,x:-4}} animate={{opacity:1,x:0}}
                  className="font-mono text-[10px]" style={{color:line.c}}>{line.t}</motion.div>
              ))}
              {termIdx < TERMINAL.length && <span className="animate-blink font-mono text-xs text-[#FF6B00]">█</span>}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── INTEL FEATURES PANEL ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 py-20 border-t border-red-500/10">
        <motion.div initial={{opacity:0,y:10}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="text-center mb-12">
          <div className="font-mono text-[10px] text-[#FF6B00] tracking-widest">— TARGET VERIFICATION STACK —</div>
          <h2 className="font-orbitron font-extrabold text-2xl text-[#EDEDED] mt-2">
            DETECTION PROTOCOLS
          </h2>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map(({icon:Icon,title,desc,color},i)=>(
            <motion.div key={title} initial={{opacity:0,y:16}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.07}}
              className="glass p-5 flex flex-col justify-between cursor-pointer border border-white/5 bg-neutral-900/40 hover:border-red-500/20">
              <div>
                <div className="w-9 h-9 rounded flex items-center justify-center mb-4"
                  style={{background:`${color}08`,border:`1px solid ${color}20`}}>
                  <Icon size={16} style={{color}}/>
                </div>
                <h3 className="font-orbitron font-bold text-xs tracking-wider text-[#EDEDED]">{title}</h3>
                <p className="font-mono text-[10px] text-[#AAAAAA] mt-2 leading-relaxed">{desc}</p>
              </div>
              <div className="mt-4 flex items-center gap-1 font-mono text-[9px] text-[#FF6B00]">
                EXECUTE MODULE<ChevronRight size={10}/>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── INTAKE SUBMIT ZONE CTA ── */}
      <section className="relative z-10 max-w-3xl mx-auto px-8 pb-20 text-center">
        <motion.div initial={{opacity:0,scale:.98}} whileInView={{opacity:1,scale:1}} viewport={{once:true}}
          className="glass p-12 border border-red-500/20 bg-neutral-950/80">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <div className="absolute inset-0 rounded border animate-spin-reverse" style={{borderColor:'rgba(255,23,68,0.4)'}}/>
            <div className="w-12 h-12 rounded flex items-center justify-center"
              style={{background:'rgba(255,23,68,0.08)',border:'1px solid rgba(255,23,68,0.3)'}}>
              <Crosshair size={22} className="text-[#FF1744] glow-red-sm" />
            </div>
          </div>
          <h2 className="font-orbitron font-bold text-lg text-[#EDEDED] tracking-wider">SUBMIT INTEL COMPONENT</h2>
          <p className="font-mono text-xs text-[#555555] mt-1 mb-8">Ready for Exif, temporal coherence and pixel verification sequence.</p>
          <button onClick={()=>navigate('/scan')} className="btn-primary-cyber cursor-pointer">
            <span className="flex items-center gap-2 text-xs"><Crosshair size={14}/>INITIALIZE FORENSIC INTAKE<ArrowRight size={12}/></span>
          </button>
        </motion.div>
      </section>

      <footer className="relative z-10 py-6 text-center border-t border-red-500/10" style={{background:'#111111'}}>
        <p className="font-mono text-[9px] text-[#555555]">TRUTHLENS COMMAND SYSTEM v4.9 · CLASSIFIED SECURITY NETWORK · LEVEL 4 FORENSICS</p>
      </footer>
    </div>
  )
}
