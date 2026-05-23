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
            background: '#111111',
            color: '#EDEDED',
            border: '1px solid rgba(255, 23, 68, 0.25)',
            borderRadius: '0px',
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '11px',
          },
          success: { iconTheme: { primary: '#A6FF00', secondary: '#050505' } },
          error:   { iconTheme: { primary: '#FF1744', secondary: '#050505' } },
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
