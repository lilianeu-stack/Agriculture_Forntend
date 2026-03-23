import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'

export default function Layout() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const userData = sessionStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const handleLogout = () => {
    sessionStorage.clear()
    navigate('/login')
  }

  const closeMobileMenu = () => setMobileMenuOpen(false)

  const NavIcon = ({ name }) => {
    const iconClass = 'h-5 w-5 text-black'

    if (name === 'dashboard') {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass}>
          <rect x="3" y="3" width="8" height="8" />
          <rect x="13" y="3" width="8" height="5" />
          <rect x="13" y="10" width="8" height="11" />
          <rect x="3" y="13" width="8" height="8" />
        </svg>
      )
    }

    if (name === 'parents') {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass}>
          <circle cx="8" cy="8" r="3" />
          <circle cx="16" cy="8" r="3" />
          <path d="M3 19c0-2.8 2.2-5 5-5" />
          <path d="M21 19c0-2.8-2.2-5-5-5" />
          <path d="M8 19h8" />
        </svg>
      )
    }

    if (name === 'students' || name === 'school-fees') {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass}>
          <path d="M2 9l10-5 10 5-10 5-10-5z" />
          <path d="M6 11v4c0 1.7 2.7 3 6 3s6-1.3 6-3v-4" />
        </svg>
      )
    }

    if (name === 'shifts') {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v6l4 2" />
        </svg>
      )
    }

    if (name === 'earnings') {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass}>
          <path d="M12 3v18" />
          <path d="M17 7.5c0-1.9-2.2-3.5-5-3.5s-5 1.6-5 3.5 2.2 3.5 5 3.5 5 1.6 5 3.5-2.2 3.5-5 3.5-5-1.6-5-3.5" />
        </svg>
      )
    }

    if (name === 'top-earners') {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass}>
          <path d="M6 4h12v3a6 6 0 0 1-12 0V4z" />
          <path d="M9 14h6" />
          <path d="M12 14v6" />
          <path d="M8 20h8" />
        </svg>
      )
    }

    if (name === 'money-shifts') {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass}>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      )
    }

    if (name === 'student-parent') {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass}>
          <circle cx="7" cy="8" r="2.5" />
          <circle cx="17" cy="8" r="2.5" />
          <path d="M9.5 9.5l5 5" />
          <path d="M14.5 9.5l-5 5" />
          <path d="M4 19c0-2 1.6-3.5 3.5-3.5" />
          <path d="M20 19c0-2-1.6-3.5-3.5-3.5" />
        </svg>
      )
    }

    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass}>
        <path d="M4 18V8" />
        <path d="M10 18V4" />
        <path d="M16 18v-6" />
        <path d="M22 18v-9" />
      </svg>
    )
  }

  // Define all available navigation items with their allowed roles
  const allNavItems = [
    { path: '/', label: 'Dashboard', icon: 'dashboard', roles: ['admin', 'money', 'fees', 'shift'] },
    { path: '/parents', label: 'Parents', icon: 'parents', roles: ['admin'] },
    { path: '/student-parent', label: 'StudentParent', icon: 'student-parent', roles: ['admin'] },
    { path: '/students', label: 'Students', icon: 'students', roles: ['admin', 'fees'] },
    { path: '/shifts', label: 'Worked Shifts', icon: 'shifts', roles: ['admin', 'shift'] },
    { path: '/active-shifts', label: 'Active Shifts', icon: 'shifts', roles: ['admin', 'shift'] },
    { path: '/earnings', label: 'Parents Earnings', icon: 'earnings', roles: ['admin'] },
    { path: '/top-earners', label: 'Top Earners', icon: 'top-earners', roles: ['admin', 'money'] },
    // Removed 'money-shifts' for 'money' role
    { path: '/school-fees', label: 'School Fees', icon: 'school-fees', roles: ['admin', 'money', 'fees'] },
    { path: '/money', label: 'Money', icon: 'money-shifts', roles: ['admin', 'money', 'fees'] },
    { path: '/reports', label: 'Reports', icon: 'reports', roles: ['admin', 'money', 'fees', 'shift'] },
  ];

  // Custom nav filtering for 'money' role: only allow 'money', 'school-fees', 'top-earners', 'dashboard', 'reports'
  const role = (sessionStorage.getItem('role') || '').trim().toLowerCase();
  let navItems;
  if (role === 'money') {
    navItems = allNavItems.filter(item =>
      ['/','/money','/school-fees','/top-earners'].includes(item.path)
    );
  } else {
    navItems = allNavItems.filter(item => item.roles.includes(role));
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-[96px]">
      <div className="fixed inset-x-0 top-0 z-40 flex w-full items-center justify-between border-b border-green-700 bg-green-600 px-4 py-3 text-white">
        <div>
          <h1 className="text-3xl font-bold leading-tight ">Hope Haven EduLink System</h1>
          {/* <p className="text-2xl text-green-100 align-center">EduLink System</p> */}
        </div>
        <button
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="rounded-md border border-white/50 px-3 py-1.5 text-sm font-medium text-white md:hidden"
        >
          Menu
        </button>
      </div>

      <div className="min-h-[calc(100vh-96px)]">
        {mobileMenuOpen && (
          <button
            aria-label="Close menu overlay"
            onClick={closeMobileMenu}
            className="fixed inset-0 z-20 bg-black/30 md:hidden"
          />
        )}
      

        <aside
          className={`fixed bottom-0 left-0 top-[96px] z-30 flex w-[260px] flex-col border-r border-slate-200 bg-white py-6 text-black transition-transform duration-200 md:translate-x-0 ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
        <nav className="flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={closeMobileMenu}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-3 text-sm transition ${
                  isActive ? 'bg-slate-100 font-semibold text-black' : 'text-black hover:bg-slate-50'
                }`
              }
            >
              <span className="inline-flex items-center justify-center">
                <NavIcon name={item.icon} />
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-200 px-6 py-4">
          {user && (
            <div className="mb-3 text-sm">
              <p className="font-medium text-black">{user.name}</p>
              <p className="text-xs text-slate-600">{user.role}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-black transition hover:bg-slate-100"
          >
            Logout
          </button>
        </div>
      </aside>

        <main className="bg-slate-50 p-4 md:ml-[260px] md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
