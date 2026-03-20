// ...existing code...
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

import { useEffect as useEffectActiveShifts, useState as useStateActiveShifts } from 'react';

export default function Reports() {
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().slice(0, 10);

  // Active shifts state
  const [activeShifts, setActiveShifts] = useStateActiveShifts([]);
  useEffectActiveShifts(() => {
    // Fetch active shifts for mapping shift_name
    fetch('http://localhost:3004/api/shifts?active=1')
      .then(res => res.json())
      .then(data => setActiveShifts(Array.isArray(data) ? data : []))
      .catch(() => setActiveShifts([]));
  }, []);

  // Helper to download CSV/Excel for reportData
  function downloadExcel() {
    if (!Array.isArray(reportData) || reportData.length === 0) return;
    const headers = [
      'Shift Name', 'Parent ID', 'Parent Name', 'Check-In', 'Check-Out', 'Device Type', 'Status', 'Valid'
    ];
    const rows = reportData.map(item => [
      item.shift_name,
      item.ParentID,
      item.FullName,
      item.check_in_time,
      item.check_out_time,
      item.device_type_for_calc,
      item.check_out_time ? 'Completed' : 'In Progress',
      item.valid ? 'Valid' : 'Invalid'
    ]);
    const csvContent = [headers, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shifts_worked_report_${startDate}_to_${endDate}.csv`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }
  const TOP_EARNERS_MIN_RATE = '2000'
  const TOP_EARNERS_LIMIT = '24'

  const role = sessionStorage.getItem('role') || 'admin'
  const [reportData, setReportData] = useState([])
  const [dashboardData, setDashboardData] = useState(null)
  const [topEarnersData, setTopEarnersData] = useState([])
  const [loading, setLoading] = useState(true)
  const [reportType, setReportType] = useState('shift-worked')
  const [startDate, setStartDate] = useState('2025-10-01')
  const [endDate, setEndDate] = useState('2025-10-31')

  useEffect(() => {
    fetchReport()
  }, [reportType, startDate, endDate])

  const fetchReport = async () => {
    setLoading(true)
    try {
      if (reportType === 'shift-worked') {
        const response = await fetch(`http://localhost:3004/api/reports/shift-worked?startDate=${startDate}&endDate=${endDate}`)
        const data = await response.json()
        setReportData(Array.isArray(data) ? data : [])
      } else if (reportType === 'top-earners') {
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
    { value: 'shift-worked', label: 'Shifts Worked', roles: ['admin', 'shift'] },
    { value: 'top-earners', label: 'Top Earners', roles: ['admin', 'money'] }
  ]

  const allowedOptions = reportOptions.filter((opt) => opt.roles.includes(role))

  useEffect(() => {
    if (!allowedOptions.some((opt) => opt.value === reportType) && allowedOptions.length > 0) {
      setReportType(allowedOptions[0].value)
    }
  }, [role, reportType])

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
      {/* Display today's date at the top */}
      <div className="mb-4 text-right text-sm text-slate-500">Today's Date: {today}</div>
      <div className="flex flex-wrap items-center gap-3">
        <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100">
          {allowedOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100" />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-green-600"></div></div>
      ) : reportType === 'shift-worked' ? (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4 text-center">SHIFT WORKED</h2>
          <div className="mb-4 flex justify-end">
            <button
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700"
              onClick={downloadExcel}
              disabled={reportData.length === 0}
            >
              Generate Report
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th>Shift Name</th>
                  <th>Parent ID</th>
                  <th>Parent Name</th>
                  <th>Check-In</th>
                  <th>Check-Out</th>
                  <th>Device Type</th>
                  <th>Status</th>
                  <th>Valid</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                </tr>
              </thead>
              <tbody>
                {reportData.length > 0 ? (
                  reportData.map((item, index) => (
                    <tr key={index}>
                      <td>{
                        (() => {
                          // Try to match by shift_id if available, else by shift_name
                          const found = activeShifts.find(s => (item.shift_id && s.shift_id === item.shift_id) || s.shift_name === item.shift_name);
                          return found ? found.shift_name : item.shift_name;
                        })()
                      }</td>
                      <td>{item.ParentID}</td>
                      <td>{item.FullName}</td>
                      <td>{item.check_in_time}</td>
                      <td>{item.check_out_time}</td>
                      <td>{item.device_type_for_calc}</td>
                      <td>{item.check_out_time ? 'Completed' : 'In Progress'}</td>
                      <td>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${item.valid ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                          {item.valid ? 'Valid' : 'Invalid'}
                        </span>
                        {!item.valid && (
                          <span className="ml-2 text-xs text-red-700 font-semibold">{item.FullName}</span>
                        )}
                      </td>
                      <td>{startDate}</td>
                      <td>{endDate}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="10" className="py-12 text-center text-slate-500">No report data found</td></tr>
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
      ) : null}
    </div>
  )
}
