import { useState, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend)

export default function Reports() {
  const TOP_EARNERS_MIN_RATE = '2000'
  const TOP_EARNERS_LIMIT = '24'

  const role = sessionStorage.getItem('role') || 'admin'
  const [reportData, setReportData] = useState([])
  const [dashboardData, setDashboardData] = useState(null)
  const [topEarnersData, setTopEarnersData] = useState([])
  const [loading, setLoading] = useState(true)
  const [reportType, setReportType] = useState('shift-performance')
  const [startDate, setStartDate] = useState('2025-10-01')
  const [endDate, setEndDate] = useState('2025-10-31')

  useEffect(() => {
    fetchReport()
  }, [reportType, startDate, endDate])

  const fetchReport = async () => {
    setLoading(true)
    try {
      if (reportType === 'shift-performance') {
        const response = await fetch(`http://localhost:3004/api/reports/shift-performance?startDate=${startDate}&endDate=${endDate}`)
        const data = await response.json()
        setReportData(Array.isArray(data) ? data : [])
      } else if (reportType === 'dashboard') {
        const response = await fetch('http://localhost:3004/api/dashboard/stats')
        const data = await response.json()
        setDashboardData(data)
      } else {
        const response = await fetch(
          `http://localhost:3004/api/top-earners/dashboard?startDate=${startDate}&endDate=${endDate}&minRate=${TOP_EARNERS_MIN_RATE}&limit=${TOP_EARNERS_LIMIT}`
        )
        const data = await response.json()
        setTopEarnersData(data.topEarners || [])
      }
    } catch (err) {
      console.error('Error fetching report:', err)
    } finally {
      setLoading(false)
    }
  }

  const reportOptions = [
    { value: 'shift-performance', label: 'Shift Performance', roles: ['admin', 'shift'] },
    { value: 'dashboard', label: 'Dashboard Overview', roles: ['admin', 'money', 'fees', 'shift'] },
    { value: 'top-earners', label: 'Top Earners', roles: ['admin', 'money'] }
  ]

  const allowedOptions = reportOptions.filter((opt) => opt.roles.includes(role))

  useEffect(() => {
    if (!allowedOptions.some((opt) => opt.value === reportType) && allowedOptions.length > 0) {
      setReportType(allowedOptions[0].value)
    }
  }, [role, reportType])

  const shiftChartData = {
    labels: reportData.map((item) => item.shift_name),
    datasets: [
      {
        label: 'Total Earnings (RWF)',
        data: reportData.map((item) => Number(item.total_earnings) || 0),
        backgroundColor: ['#16a34a', '#2563eb', '#f59e0b', '#ef4444', '#8b5cf6']
      }
    ]
  }

  const dashboardTrendData = {
    labels: (dashboardData?.weeklyTrend || []).map((item) => item.date),
    datasets: [
      {
        label: 'Daily Earnings (RWF)',
        data: (dashboardData?.weeklyTrend || []).map((item) => Number(item.daily_earnings) || 0),
        borderColor: '#16a34a',
        backgroundColor: 'rgba(22, 163, 74, 0.2)',
        tension: 0.3,
        fill: true
      }
    ]
  }

  const topEarnersChartData = {
    labels: topEarnersData.map((item) => String(item.ParentID)),
    datasets: [
      {
        label: 'Earnings (RWF)',
        data: topEarnersData.map((item) => Number(item.total_earnings) || 0),
        backgroundColor: '#f97316'
      }
    ]
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Reports</h1>
        <div className="flex flex-wrap items-center gap-3">
          <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100">
            {allowedOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100" />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-green-600"></div></div>
      ) : reportType === 'shift-performance' ? (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-6">
            {reportData.length > 0 ? (
              <Bar data={shiftChartData} options={{ responsive: true, maintainAspectRatio: false }} height={240} />
            ) : null}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th>Shift Name</th>
                  <th>Total Parents</th>
                  <th>Total Shifts</th>
                  <th>Total Money</th>
                  <th>Total Fees</th>
                  <th>Total Earnings</th>
                  <th>Avg per Parent</th>
                </tr>
              </thead>
              <tbody>
                {reportData.length > 0 ? (
                  reportData.map((item, index) => (
                    <tr key={index}>
                      <td>{item.shift_name}</td>
                      <td>{item.total_parents || 0}</td>
                      <td>{item.total_shifts || 0}</td>
                      <td>{(item.total_money || 0).toLocaleString()} RWF</td>
                      <td>{(item.total_fees || 0).toLocaleString()} RWF</td>
                      <td>{(item.total_earnings || 0).toLocaleString()} RWF</td>
                      <td>{(item.avg_per_parent || 0).toLocaleString()} RWF</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="7" className="py-12 text-center text-slate-500">No report data found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : reportType === 'top-earners' ? (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-6">
            {topEarnersData.length > 0 ? (
              <Bar data={topEarnersChartData} options={{ responsive: true, maintainAspectRatio: false }} height={260} />
            ) : (
              <div className="py-10 text-center text-slate-500">No top earners data found</div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th>Parent ID</th>
                  <th>Name</th>
                  <th>Total Earnings</th>
                  <th>Days Worked</th>
                  <th>Avg/Shift</th>
                </tr>
              </thead>
              <tbody>
                {topEarnersData.length > 0 ? (
                  topEarnersData.map((item) => (
                    <tr key={item.ParentID}>
                      <td>{item.ParentID}</td>
                      <td>{item.FullName}</td>
                      <td>{(Number(item.total_earnings) || 0).toLocaleString()} RWF</td>
                      <td>{item.days_worked || 0}</td>
                      <td>{(Number(item.avg_per_shift) || 0).toLocaleString()} RWF</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5" className="py-12 text-center text-slate-500">No report data found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            {dashboardData?.weeklyTrend?.length > 0 ? (
              <Line data={dashboardTrendData} options={{ responsive: true, maintainAspectRatio: false }} height={260} />
            ) : (
              <div className="py-10 text-center text-slate-500">No trend data found</div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <div className="mb-1 text-xs uppercase text-slate-500">Total Parents</div>
              <div className="text-3xl font-bold">{dashboardData?.totalParents || 0}</div>
            </div>
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <div className="mb-1 text-xs uppercase text-slate-500">Total Students</div>
              <div className="text-3xl font-bold">{dashboardData?.totalStudents || 0}</div>
            </div>
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <div className="mb-1 text-xs uppercase text-slate-500">Today's Attendance</div>
              <div className="text-3xl font-bold">{dashboardData?.todayAttendance || 0}</div>
            </div>
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <div className="mb-1 text-xs uppercase text-slate-500">Active Shifts</div>
              <div className="text-3xl font-bold">{dashboardData?.activeShifts || 0}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
