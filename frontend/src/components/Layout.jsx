import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, BarChart3, Clock, ChevronLeft, ChevronRight, Zap, Shield, Activity, Crosshair } from 'lucide-react'

const NAV = [
  { path: '/scan',      icon: Upload,    label: 'FORENSIC INTAKE', sub: 'Evidence Scan' },
  { path: '/analytics', icon: BarChart3, label: 'TACTICAL HUB',    sub: 'Threat Intelligence' },
  { path: '/history',   icon: Clock,     label: 'AUDIT LEDGER',    sub: 'Classified Logs' },
]

// Animated tactical status messages
const STATUS_MSGS = [
  '[SYS] Neural engine online',
  '[OK] XceptionNet core active',
  '[SCAN] Grad-CAM visualizer ready',
  '[DB] Security ledger synced',
  '[ALERT] Target lock calibrated',
  '[TEMP] Core heat variance: 38°C',
]

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const [statusIdx, setStatusIdx]   = useState(0)
  const navigate  = useNavigate()
  const location  = useLocation()

  useEffect(() => {
    const t = setInterval(() => setStatusIdx(i => (i + 1) % STATUS_MSGS.length), 3000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="flex min-h-screen" style={{ background: '#050505' }}>

      {/* ── Sidebar ── */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ type: 'spring', stiffness: 350, damping: 35 }}
        className="relative flex flex-col shrink-0 z-30 overflow-hidden"
        style={{
          background: '#111111',
          borderRight: '1px solid rgba(255, 23, 68, 0.15)',
        }}
      >
        {/* Logo / Header */}
        <div className="flex items-center gap-3 px-4 py-5 border-b"
          style={{ borderColor: 'rgba(255, 23, 68, 0.15)' }}>
          <div className="relative w-9 h-9 shrink-0">
            {/* Target Ring */}
            <div className="absolute inset-0 rounded border animate-spin-slow"
              style={{ borderColor: 'rgba(255, 107, 0, 0.4)', borderWidth: '1px' }} />
            <div className="w-9 h-9 rounded flex items-center justify-center relative z-10"
              style={{ background: 'rgba(255, 23, 68, 0.08)', border: '1px solid rgba(255, 23, 68, 0.3)' }}>
              <Crosshair size={16} className="text-[#FF1744]" />
            </div>
          </div>

          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="font-orbitron font-extrabold text-sm leading-tight text-[#EDEDED] tracking-wider">
                  TRUTHLENS <span className="text-[#FF1744]">OS</span>
                </div>
                <div className="font-mono text-[9px] text-[#A6FF00] tracking-widest uppercase">
                  COMSPEC UNIT v4.9
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="absolute top-6 -right-3 w-6 h-6 rounded flex items-center justify-center z-40 cursor-pointer"
          style={{ background: '#111111', border: '1px solid rgba(255, 23, 68, 0.3)', color: '#FF1744' }}
        >
          {collapsed
            ? <ChevronRight size={10} />
            : <ChevronLeft size={10} />}
        </button>

        {/* Nav items */}
        <nav className="flex-1 py-6 space-y-1.5 px-2">
          {NAV.map(({ path, icon: Icon, label, sub }) => {
            const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path))
            return (
              <NavLink
                key={path}
                to={path}
                className={`flex items-center gap-3 px-3 py-3 rounded cursor-pointer transition-all duration-200 group relative overflow-hidden ${
                  isActive ? 'nav-item-active' : ''
                }`}
                style={{
                  color: isActive ? '#FF6B00' : '#888888',
                  background: isActive ? 'rgba(255, 107, 0, 0.05)' : 'transparent',
                  borderLeft: isActive ? '2px solid #FF1744' : '2px solid transparent'
                }}
              >
                <Icon size={16} className="shrink-0 relative z-10" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="relative z-10"
                    >
                      <div className="font-orbitron text-xs font-bold tracking-wider">{label}</div>
                      <div className="text-[9px] font-mono mt-0.5" style={{ color: isActive ? '#FFC400' : '#555555' }}>{sub}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </NavLink>
            )
          })}
        </nav>

        {/* System status */}
        <div className="px-3 pb-4 border-t pt-4" style={{ borderColor: 'rgba(255, 23, 68, 0.15)' }}>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full shrink-0 animate-ping"
              style={{ background: '#A6FF00' }} />
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.div
                  key={statusIdx}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 5 }}
                  className="font-mono text-[9px] truncate text-[#A6FF00]"
                >
                  {STATUS_MSGS[statusIdx]}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-3 shrink-0"
          style={{
            background: '#111111',
            borderBottom: '1px solid rgba(255, 23, 68, 0.15)',
          }}>
          <div className="flex items-center gap-3">
            <Activity size={13} className="text-[#FF1744] animate-pulse" />
            <span className="font-mono text-xs text-[#EDEDED] tracking-wide">
              SECURITY PROTOCOL ACTIVE // LEVEL 4 CLASSIFIED // THREAT DETECTOR ONLINE
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 font-mono text-xs text-[#A6FF00]">
              <Zap size={10} className="text-[#A6FF00]" />
              <span className="text-[10px] font-bold tracking-widest">COMSPEC SECURE</span>
            </div>
            <button onClick={() => navigate('/')} className="btn-cyber text-xs py-1 px-3 cursor-pointer">
              <Shield size={11} className="inline mr-1.5" />SECURE OUT
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="grid-overlay-fine min-h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="p-6"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  )
}
