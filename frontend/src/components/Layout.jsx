import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Upload, BarChart3, Clock, Shield, ChevronLeft, ChevronRight, LogOut } from 'lucide-react'

const NAV = [
  { path: '/scan',      icon: Upload,    label: 'Scan Media' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/history',   icon: Clock,     label: 'History' },
]

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F1F5F9' }}>

      {/* ── Blue Sidebar ── */}
      <div style={{
        width: collapsed ? 64 : 220,
        background: '#1E40AF',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        transition: 'width 0.25s ease',
        position: 'relative',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Shield size={18} color="white" />
            </div>
            {!collapsed && (
              <div>
                <div style={{ color: 'white', fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>TruthLens AI</div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 }}>Deepfake Detection</div>
              </div>
            )}
          </div>
        </div>

        {/* Collapse button */}
        <button
          onClick={() => setCollapsed(c => !c)}
          style={{
            position: 'absolute', top: 22, right: -12,
            width: 24, height: 24, borderRadius: '50%',
            background: 'white', border: '1.5px solid #E2E8F0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: 10,
          }}>
          {collapsed ? <ChevronRight size={11} color="#64748B" /> : <ChevronLeft size={11} color="#64748B" />}
        </button>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV.map(({ path, icon: Icon, label }) => (
            <NavLink key={path} to={path}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Icon size={17} style={{ flexShrink: 0 }} />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
          <button
            onClick={() => navigate('/')}
            className="nav-link"
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}>
            <LogOut size={17} style={{ flexShrink: 0 }} />
            {!collapsed && <span>Exit</span>}
          </button>
        </div>
      </div>

      {/* ── Right side ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* ── Blue Header ── */}
        <div style={{
          background: '#2563EB',
          padding: '0 28px',
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#4ADE80',
              boxShadow: '0 0 6px #4ADE80',
            }} />
            <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>
              All systems operational
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              background: 'rgba(255,255,255,0.15)',
              color: 'white', fontSize: 12, fontWeight: 600,
              padding: '4px 12px', borderRadius: 20,
            }}>
              Model Active
            </span>
          </div>
        </div>

        {/* ── Page content ── */}
        <main style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
