import { useState, useEffect } from 'react'
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
  const [feesSummary, setFeesSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboardStats()
  }, [role])

  const fetchDashboardStats = async () => {
    setLoading(true)
    setError('')

    const today = new Date()
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
    const todayStr = today.toISOString().split('T')[0]

    try {
      const dashboardPromise = fetch('http://localhost:3004/api/dashboard/stats')
      const topEarnersPromise = ['admin', 'money'].includes(role)
        ? fetch(`http://localhost:3004/api/top-earners/dashboard?startDate=${monthStart}&endDate=${todayStr}&minRate=2000&limit=8`)
        : Promise.resolve(null)

      const shiftReportPromise = ['admin', 'shift'].includes(role)
        ? fetch(`http://localhost:3004/api/reports/shift-performance?startDate=${monthStart}&endDate=${todayStr}`)
        : Promise.resolve(null)

      const shiftCardStatsPromise = role === 'shift'
        ? fetch(`http://localhost:3004/api/dashboard/shift-card-stats?year=${today.getFullYear()}&month=${today.getMonth() + 1}`)
        : Promise.resolve(null)

      const schoolFeesPromise = ['admin', 'fees', 'shift'].includes(role)
        ? fetch('http://localhost:3004/api/school-fees/students')
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

  const weeklyTrendChart = {
    labels: (stats?.monthlyTrend || stats?.weeklyTrend || []).map((d) => d.date),
    datasets: [
      {
        label: 'Daily Earnings This Month (RWF)',
        data: (stats?.monthlyTrend || stats?.weeklyTrend || []).map((d) => Number(d.daily_earnings) || 0),
        borderColor: '#16a34a',
        backgroundColor: 'rgba(22, 163, 74, 0.2)',
        tension: 0.3,
        fill: true
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
    money: [baseCards[2], baseCards[3], baseCards[4], { label: 'Top Earners (This Month)', value: topEarners.length }],
    shift: [
      { label: 'Shifts Per Month', value: shiftCardStats?.shiftsPerMonth ?? 0 },
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

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(roleCards[role] || roleCards.admin).map((card) => (
          <div key={card.label} className="rounded-xl bg-white p-5 shadow-sm">
            <div className="mb-1 text-xs uppercase text-slate-500">{card.label}</div>
            <div className="text-2xl font-bold md:text-3xl">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 border-b border-slate-200 pb-4">
            <h3 className="text-lg font-semibold">Monthly Earnings Trend</h3>
          </div>
          {(stats?.monthlyTrend?.length > 0 || stats?.weeklyTrend?.length > 0) ? (
            <div className="h-72 md:h-80">
              <Line data={weeklyTrendChart} options={chartOptions} />
            </div>
          ) : (
            <div className="flex h-72 items-center justify-center text-center text-slate-500 md:h-80">
              <h3>No data available</h3>
            </div>
          )}
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 border-b border-slate-200 pb-4">
            <h3 className="text-lg font-semibold">Attendance Snapshot</h3>
          </div>
          {stats?.totalParents ? (
            <div className="h-72 md:h-80">
              <Doughnut data={attendanceChart} options={chartOptions} />
            </div>
          ) : (
            <div className="flex h-72 items-center justify-center text-center text-slate-500 md:h-80">
              <h3>No data available</h3>
            </div>
          )}
        </div>
      </div>

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
            <h3 className="text-lg font-semibold">School Fees Status</h3>
          </div>
          {feesSummary ? (
            <div className="h-72 md:h-80">
              <Doughnut data={feesChart} options={chartOptions} />
            </div>
          ) : (
            <div className="flex h-72 items-center justify-center text-center text-slate-500 md:h-80">No school fees data available</div>
          )}
        </div>
      )}
    </div>
  )
}
