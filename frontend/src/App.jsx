import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import LandingPage from './pages/LandingPage'
import UploadScanner from './pages/UploadScanner'
import ResultPage from './pages/ResultPage'
import AnalyticsDashboard from './pages/AnalyticsDashboard'
import HeatVisionViewer from './pages/HeatVisionViewer'
import ScanHistory from './pages/ScanHistory'
import './index.css'

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1E293B',
            color: '#F1F5F9',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            fontFamily: '"Inter", sans-serif',
            fontSize: '13px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          },
          success: { iconTheme: { primary: '#10B981', secondary: '#1E293B' } },
          error:   { iconTheme: { primary: '#EF4444', secondary: '#1E293B' } },
        }}
      />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route element={<Layout />}>
          <Route path="/scan" element={<UploadScanner />} />
          <Route path="/result/:scanId" element={<ResultPage />} />
          <Route path="/analytics" element={<AnalyticsDashboard />} />
          <Route path="/heatvision/:scanId" element={<HeatVisionViewer />} />
          <Route path="/history" element={<ScanHistory />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
