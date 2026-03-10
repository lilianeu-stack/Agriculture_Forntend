import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Parents from './pages/Parents'
import StudentParent from './pages/StudentParent'
import Students from './pages/Students'
import Shifts from './pages/Shifts'
import Earnings from './pages/Earnings'
import MoneyShifts from './pages/MoneyShifts'
import Reports from './pages/Reports'
import SchoolFees from './pages/SchoolFees'
import TopEarners from './pages/TopEarners'
import Layout from './components/Layout'

function App() {
  const getRole = () => (sessionStorage.getItem('role') || '').trim().toLowerCase()

  const isAuthenticated = () => {
    return sessionStorage.getItem('authenticated') === 'true'
  }

  const canAccessTopEarners = () => {
    const role = getRole()
    return role !== 'shift'
  }

  const canAccessMoneyShifts = () => {
    const role = getRole()
    return role === 'money'
  }

  const getDefaultRoute = () => {
    const role = getRole()
    switch (role) {
      case 'money':
        return '/money-shifts'
      case 'fees':
        return '/school-fees'
      case 'shift':
        return '/shifts'
      default:
        return '/'
    }
  }

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={isAuthenticated() ? <Layout /> : <Navigate to="/login" />}>
          <Route index element={<Dashboard />} />
          <Route path="parents" element={<Parents />} />
          <Route path="student-parent" element={<StudentParent />} />
          <Route path="students" element={<Students />} />
          <Route path="shifts" element={<Shifts />} />
          <Route path="earnings" element={<Earnings />} />
          <Route
            path="money-shifts"
            element={canAccessMoneyShifts() ? <MoneyShifts /> : <Navigate to={getDefaultRoute()} replace />}
          />
          <Route
            path="top-earners"
            element={canAccessTopEarners() ? <TopEarners /> : <Navigate to={getDefaultRoute()} replace />}
          />
          <Route path="reports" element={<Reports />} />
          <Route path="school-fees" element={<SchoolFees />} />
        </Route>
        <Route path="*" element={<Navigate to={getDefaultRoute()} />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
