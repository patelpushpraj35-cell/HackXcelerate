import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, BarChart3, Clock, ChevronLeft, ChevronRight,
  Shield, Activity, Zap, LogOut, Bell, Search
} from 'lucide-react'

const NAV = [
  { path: '/scan',      icon: Upload,    label: 'Scan Media',      sub: 'Upload & Analyze' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics',        sub: 'Forensic Intelligence' },
  { path: '/history',   icon: Clock,     label: 'Scan History',    sub: 'Audit Records' },
]

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate  = useNavigate()
  const location  = useLocation()

  return (
    <div className="flex min-h-screen" style={{ background: '#0B1220' }}>

      {/* ── Sidebar ── */}
      <motion.aside
        animate={{ width: collapsed ? 68 : 248 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative flex flex-col shrink-0 z-30 overflow-hidden"
        style={{
          background: 'rgba(17,24,39,0.98)',
          borderRight: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>
            <Shield size={16} className="text-blue-400" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18 }}
              >
                <div className="text-sm font-bold text-white leading-tight">TruthLens AI</div>
                <div className="text-xs mt-0.5" style={{ color: '#4B5563' }}>Deepfake Detection</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="absolute top-[22px] -right-3 w-6 h-6 rounded-full flex items-center justify-center z-40 cursor-pointer"
          style={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', color: '#94A3B8' }}
        >
          {collapsed ? <ChevronRight size={10} /> : <ChevronLeft size={10} />}
        </button>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {NAV.map(({ path, icon: Icon, label, sub }) => {
            const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path))
            return (
              <NavLink
                key={path}
                to={path}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={17} className="shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    >
                      <div className="text-sm font-medium leading-tight">{label}</div>
                      <div className="text-xs mt-0.5" style={{ color: isActive ? '#60A5FA' : '#4B5563' }}>{sub}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </NavLink>
            )
          })}
        </nav>

        {/* Version badge */}
        <div className="px-3 pb-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2 pt-4">
            <div className="status-dot online animate-pulse-soft shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-xs" style={{ color: '#4B5563' }}
                >
                  Model online · v2.4.1
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Topbar */}
        <header className="flex items-center justify-between px-6 py-3 shrink-0"
          style={{
            background: 'rgba(17,24,39,0.95)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            backdropFilter: 'blur(12px)',
          }}>
          <div className="flex items-center gap-2">
            <Activity size={13} style={{ color: '#10B981' }} />
            <span className="text-xs" style={{ color: '#4B5563' }}>
              All systems operational
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="badge badge-success text-xs">
              <Zap size={10} />Model Active
            </div>
            <button
              onClick={() => navigate('/')}
              className="btn btn-ghost btn-sm"
            >
              <LogOut size={13} />
              <span className="text-xs">Exit</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="p-6 lg:p-8"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
