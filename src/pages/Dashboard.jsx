import { useState, useEffect } from 'react'

// Utility to fetch active shifts for chart labels
async function fetchActiveShifts() {
  try {
    const res = await fetch('http://localhost:3004/api/shifts?active=1&limit=5')
    const data = await res.json()
    return data.slice(0, 5).map(s => s.shift_name)
  } catch {
    return []
  }
}
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend)


export default function Dashboard() {
  const role = sessionStorage.getItem('role') || 'admin'
  const [stats, setStats] = useState(null)
  const [topEarners, setTopEarners] = useState([])
  const [shiftReport, setShiftReport] = useState([])
  const [shiftCardStats, setShiftCardStats] = useState(null)
  const [activeShiftNames, setActiveShiftNames] = useState([])
  const [feesSummary, setFeesSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  // Date range and granularity for dashboard
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [granularity, setGranularity] = useState('day'); // 'day', 'month', 'year'

  useEffect(() => {
    fetchDashboardStats()
    fetchActiveShifts().then(setActiveShiftNames)
  }, [role, startDate, endDate, granularity])

  const fetchDashboardStats = async () => {
    setLoading(true)
    setError('')

    try {
      // Pass granularity as a query param if supported by backend
      const dashboardPromise = fetch(`http://localhost:3004/api/dashboard/stats?startDate=${startDate}&endDate=${endDate}&granularity=${granularity}`)
      const topEarnersPromise = ['admin', 'money'].includes(role)
        ? fetch(`http://localhost:3004/api/top-earners/dashboard?startDate=${startDate}&endDate=${endDate}&minRate=2000&limit=8&granularity=${granularity}`)
        : Promise.resolve(null)

      const shiftReportPromise = ['admin', 'shift'].includes(role)
        ? fetch(`http://localhost:3004/api/reports/shift-performance?startDate=${startDate}&endDate=${endDate}&granularity=${granularity}`)
        : Promise.resolve(null)

      const shiftCardStatsPromise = role === 'shift'
        ? fetch(`http://localhost:3004/api/dashboard/shift-card-stats?year=${new Date(startDate).getFullYear()}&month=${new Date(startDate).getMonth() + 1}`)
        : Promise.resolve(null)

      const schoolFeesPromise = ['admin', 'fees', 'shift'].includes(role)
        ? fetch(`http://localhost:3004/api/school-fees/students?startDate=${startDate}&endDate=${endDate}&granularity=${granularity}`)
        : Promise.resolve(null)

      const [dashboardRes, topEarnersRes, shiftReportRes, schoolFeesRes, shiftCardStatsRes] = await Promise.all([
        dashboardPromise,
        topEarnersPromise,
        shiftReportPromise,
        schoolFeesPromise,
        shiftCardStatsPromise
      ])

      if (!dashboardRes.ok) {
        throw new Error('Failed to load dashboard stats')
      }

      const dashboardData = await dashboardRes.json()
      setStats(dashboardData)

      if (topEarnersRes) {
        const topEarnersData = await topEarnersRes.json()
        setTopEarners(topEarnersData.topEarners || [])
      }

      if (shiftReportRes) {
        const shiftData = await shiftReportRes.json()
        setShiftReport(Array.isArray(shiftData) ? shiftData : [])
      }

      if (schoolFeesRes) {
        const feesData = await schoolFeesRes.json()
        setFeesSummary(feesData.filters || null)
      }

      if (shiftCardStatsRes) {
        const shiftCardData = await shiftCardStatsRes.json()
        setShiftCardStats(shiftCardData)
      }
    } catch (err) {
      setError('Failed to load role dashboard data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Grouped bar chart for money and fees per day in selected range
  const moneyFeesPerformanceChart = {
    labels: (stats?.monthlyTrend || stats?.weeklyTrend || []).map(d => d.date),
    datasets: [
      {
        label: 'Money Earnings (RWF)',
        data: (stats?.monthlyTrend || stats?.weeklyTrend || []).map(d => Number(d.money_earned) || 0),
        backgroundColor: '#16a34a'
      },
      {
        label: 'Fees Earnings (RWF)',
        data: (stats?.monthlyTrend || stats?.weeklyTrend || []).map(d => Number(d.fee_earned) || 0),
        backgroundColor: '#2563eb'
      }
    ]
  }

  const topEarnersChart = {
    labels: topEarners.map((e) => `${e.ParentID}`),
    datasets: [
      {
        label: 'Total Earnings (RWF)',
        data: topEarners.map((e) => Number(e.total_earnings) || 0),
        backgroundColor: '#f59e0b'
      }
    ]
  }

  const shiftEarningsChart = {
    labels: shiftReport.map((s) => s.shift_name),
    datasets: [
      {
        label: 'Shift Earnings (RWF)',
        data: shiftReport.map((s) => Number(s.total_earnings) || 0),
        backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']
      }
    ]
  }

  const feesChart = {
    labels: ['Paid', 'Balance'],
    datasets: [
      {
        data: [Number(feesSummary?.totalPaid || 0), Number(feesSummary?.totalBalance || 0)],
        backgroundColor: ['#16a34a', '#dc2626']
      }
    ]
  }

  const attendanceChart = {
    labels: ['Month Attendance', 'Others'],
    datasets: [
      {
        data: [
          Number((stats?.monthAttendance ?? stats?.todayAttendance) || 0),
          Math.max(0, Number(stats?.totalParents || 0) - Number((stats?.monthAttendance ?? stats?.todayAttendance) || 0))
        ],
        backgroundColor: ['#2563eb', '#e2e8f0']
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  }

  const baseCards = [
    { label: 'Total Parents', value: stats?.totalParents || 0 },
    { label: 'Total Students', value: stats?.totalStudents || 0 },
    { label: "Today's Attendance", value: stats?.todayAttendance || 0 },
    { label: 'Active Shifts', value: stats?.activeShifts || 0 },
    { label: "Today's Earnings", value: `${(stats?.todayEarnings || 0).toLocaleString()} RWF` },
    { label: 'Active Devices', value: stats?.activeDevices || 0 }
  ]

  const roleCards = {
    admin: baseCards,
    money: [baseCards[2], baseCards[3], { label: 'Top Earners (This Month)', value: topEarners.length }],
    shift: [
      { label: 'Active Devices', value: shiftCardStats?.activeDevices ?? 0 },
      { label: 'Active Shifts', value: shiftCardStats?.activeShifts ?? 0 }
    ],
    fees: [baseCards[1], { label: 'Total Fees', value: `${(feesSummary?.totalFees || 0).toLocaleString()} RWF` }, { label: 'Total Paid', value: `${(feesSummary?.totalPaid || 0).toLocaleString()} RWF` }, { label: 'Total Balance', value: `${(feesSummary?.totalBalance || 0).toLocaleString()} RWF` }]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-green-600"></div>
      </div>
    )
  }

  return (
    <div>
      {error && <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-800">{error}</div>}

      {/* Date range and granularity pickers for admin dashboard */}
      {role === 'admin' && (
        <div className="mb-4 flex gap-3 items-center">
          <label className="flex items-center gap-2 text-sm font-medium">From:
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100" />
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">To:
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100" />
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">View:
            <select value={granularity} onChange={e => setGranularity(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="day">Day</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
            </select>
          </label>
        </div>
      )}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(roleCards[role] || roleCards.admin).map((card) => (
          <div key={card.label} className="rounded-xl bg-white p-5 shadow-sm">
            <div className="mb-1 text-xs uppercase text-slate-500">{card.label}</div>
            <div className="text-2xl font-bold md:text-3xl">{card.value}</div>
          </div>
        ))}
      </div>

      {/* Admin: Money & Fees Performance (Per Day) */}
      {role === 'admin' && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-4 border-b border-slate-200 pb-4">
              <h3 className="text-lg font-semibold">Money & Fees Performance (Per Day)</h3>
            </div>
            {(stats?.monthlyTrend?.length > 0 || stats?.weeklyTrend?.length > 0) ? (
              <div className="h-72 md:h-80">
                <Bar data={moneyFeesPerformanceChart} options={chartOptions} />
              </div>
            ) : (
              <div className="flex h-72 items-center justify-center text-center text-slate-500 md:h-80">
                <h3>No data available</h3>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Shift: Shift Performance Chart with Date Pickers */}
      {role === 'shift' && (
        <div className="rounded-xl bg-white p-6 shadow-sm mt-6">
          <div className="mb-4 flex gap-3">
            <label className="flex items-center gap-2 text-sm font-medium">From:
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100" />
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">To:
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100" />
            </label>
          </div>
          <div className="mb-4 border-b border-slate-200 pb-4">
            <h3 className="text-lg font-semibold">Shift Performance (Per Shift)</h3>
          </div>
          {shiftReport.length > 0 && activeShiftNames.length > 0 ? (
            <div className="h-72 md:h-80">
              <Bar
                data={{
                  labels: activeShiftNames,
                  datasets: activeShiftNames.map((name, idx) => ({
                    label: name,
                    data: [
                      (() => { const found = shiftReport.find(s => s.shift_name === name); return found ? Number(found.total_money) || 0 : 0 })(),
                      (() => { const found = shiftReport.find(s => s.shift_name === name); return found ? Number(found.total_fees) || 0 : 0 })(),
                      (() => { const found = shiftReport.find(s => s.shift_name === name); return found ? Number(found.total_earnings) || 0 : 0 })()
                    ],
                    backgroundColor: ['#16a34a', '#2563eb', '#f59e0b'][idx % 3]
                  }))
                }}
                options={chartOptions}
              />
            </div>
          ) : (
            <div className="flex h-72 items-center justify-center text-center text-slate-500 md:h-80">
              <h3>No shift data available</h3>
            </div>
          )}
        </div>
      )}

      {['money'].includes(role) && (
        <div className="mt-6 rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 border-b border-slate-200 pb-4">
            <h3 className="text-lg font-semibold">Top Earners (Current Month)</h3>
          </div>
          {topEarners.length > 0 ? (
            <div className="h-72 md:h-80">
              <Bar data={topEarnersChart} options={chartOptions} />
            </div>
          ) : (
            <div className="flex h-72 items-center justify-center text-center text-slate-500 md:h-80">No top earner data available</div>
          )}
        </div>
      )}

      {['fees'].includes(role) && (
        <div className="mt-6 rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 border-b border-slate-200 pb-4">
            <h3 className="text-lg font-semibold">School Fees & Money Earnings</h3>
          </div>
          {feesSummary ? (
            <div className="h-72 md:h-80">
              <Bar
                data={{
                  labels: ['Money Earnings', 'Fees Earnings'],
                  datasets: [
                    {
                      label: 'Amount (RWF)',
                      data: [Number(feesSummary?.totalMoney || 0), Number(feesSummary?.totalFees || 0)],
                      backgroundColor: ['#16a34a', '#2563eb']
                    }
                  ]
                }}
                options={chartOptions}
              />
            </div>
          ) : (
            <div className="flex h-72 items-center justify-center text-center text-slate-500 md:h-80">No school fees data available</div>
          )}
        </div>
      )}
    </div>
  )
}
