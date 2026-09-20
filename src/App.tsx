import { Routes, Route } from 'react-router'
import { RelayConfigProvider } from '@/hooks/useRelayConfig'
import Home from './pages/Home'

export default function App() {
  return (
    <RelayConfigProvider>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </RelayConfigProvider>
  )
}
