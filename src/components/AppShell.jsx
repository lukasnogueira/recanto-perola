import { Outlet } from 'react-router-dom'
import AppHeader from './AppHeader.jsx'
import BottomNav from './BottomNav.jsx'
import InstallPrompt from './InstallPrompt.jsx'
import SyncManager from '../features/sync/SyncManager.jsx'

export default function AppShell() {
  return (
    <div className="app-shell">
      <SyncManager />
      <AppHeader />
      <InstallPrompt />
      <main className="app-main">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
