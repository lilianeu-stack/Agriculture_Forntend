import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'


export default function MoneyShifts() {
  const role = sessionStorage.getItem('role') || '';
  if (role === 'money') {
    return null;
  }
  const [shifts, setShifts] = useState([])
  const [parentEarnings, setParentEarnings] = useState([])
  const [detailedEarnings, setDetailedEarnings] = useState([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('2025-10-01')
  const [endDate, setEndDate] = useState('2025-10-31')
  const [totals, setTotals] = useState({ totalMoney: 0, totalFees: 0, totalEarnings: 0 })
  const [selectedParentDetails, setSelectedParentDetails] = useState(null)
  const [searchInput, setSearchInput] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchMoneyShifts()
  }, [startDate, endDate, appliedSearch])

  const fetchMoneyShifts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        startDate,
        endDate
      })
      if (appliedSearch.trim()) {
        params.append('search', appliedSearch.trim())
      }

      const response = await fetch(`http://localhost:3004/api/money-shifts?${params.toString()}`)
      const data = await response.json()
      setShifts(data.rawShifts || data.records || [])

      const earningsParams = new URLSearchParams({ startDate, endDate })
      if (appliedSearch.trim()) {
        earningsParams.append('search', appliedSearch.trim())
      }

      const earningsResponse = await fetch(`http://localhost:3004/api/money-shifts/earnings?${earningsParams.toString()}`)
      const earningsData = await earningsResponse.json()

      setDetailedEarnings(earningsData.detailedEarnings || [])
      if (earningsData.parentSummary) setParentEarnings(earningsData.parentSummary)
      if (earningsData.totals) setTotals(earningsData.totals)
    } catch (err) {
      console.error('Error fetching money shifts:', err)
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    sessionStorage.clear()
    navigate('/login')
  }

  const handleSearch = () => {
    setAppliedSearch(searchInput.trim())
  }

  const resetSearch = () => {
    setSearchInput('')
    setAppliedSearch('')
  }


  const getParentDailyDetails = (parent) => {
    const parentRows = detailedEarnings.filter((earning) => {
      const byId = parent.ParentID && earning.ParentID && String(parent.ParentID) === String(earning.ParentID)
      const byName = !byId &&
        String(parent.FullName || '').toLowerCase() === String(earning.FullName || '').toLowerCase()
      return byId || byName
    })

    const grouped = parentRows.reduce((acc, row) => {
      const dateKey = String(row.AccessDate || '')
      if (!dateKey) return acc

      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          shifts: 0,
          startTime: null,
          endTime: null,
          money: 0,
          fees: 0,
          total: 0,
          shiftNames: new Set()
        }
      }

      const shiftName = row.shift_name || row.shiftName || row.ShiftName || 'Unknown'
      acc[dateKey].shiftNames.add(shiftName)

      const matchingShiftLogs = shifts
        .filter((log) => {
          const sameDate = String(log.AccessDate || '') === dateKey
          if (!sameDate) return false

          const logById = parent.ParentID && log.ParentID && String(parent.ParentID) === String(log.ParentID)
          const logByName = !logById &&
            String(log.ParentName || log.ParentFullName || '').toLowerCase() === String(parent.FullName || '').toLowerCase()
          return logById || logByName
        })
        .sort((a, b) => String(a.AccessTime || '').localeCompare(String(b.AccessTime || '')))

      const firstLog = matchingShiftLogs[0]
      const lastLog = matchingShiftLogs[matchingShiftLogs.length - 1]
      const dayStart = firstLog?.AccessTime || null
      const dayEnd = lastLog?.AccessTime || null

      if (!acc[dateKey].startTime || (dayStart && dayStart < acc[dateKey].startTime)) {
        acc[dateKey].startTime = dayStart
      }
      if (!acc[dateKey].endTime || (dayEnd && dayEnd > acc[dateKey].endTime)) {
        acc[dateKey].endTime = dayEnd
      }

      acc[dateKey].shifts += 1
      acc[dateKey].money += Number(row.money_earned_rwf || 0)
      acc[dateKey].fees += Number(row.fee_earned_rwf || 0)
      acc[dateKey].total += Number(row.total_earned || 0)
      return acc
    }, {})

    const perDay = Object.values(grouped).sort((a, b) => String(b.date).localeCompare(String(a.date)))
      .map((day) => ({
        ...day,
        shiftNames: Array.from(day.shiftNames || []).join(', '),
        workType: day.money > 0 && day.fees > 0 ? 'Money + Fees' : day.money > 0 ? 'Money' : day.fees > 0 ? 'Fees' : 'Unknown'
      }))
    const totals = perDay.reduce((acc, day) => {
      acc.money += day.money
      acc.fees += day.fees
      acc.total += day.total
      acc.shifts += day.shifts
      return acc
    }, { money: 0, fees: 0, total: 0, shifts: 0 })

    return { perDay, totals }
  }

  const openParentDetails = (parent) => {
    const { perDay, totals } = getParentDailyDetails(parent)
    setSelectedParentDetails({
      parent,
      perDay,
      totals
    })
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Money Shifts</h1>
        <button onClick={logout} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">Logout</button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-white p-5 text-center shadow-sm">
          <h3 className="text-sm text-slate-500">Total Money</h3>
          <p className="mt-2 text-2xl font-semibold text-emerald-600">{totals.totalMoney.toLocaleString()} RWF</p>
        </div>
        <div className="rounded-xl bg-white p-5 text-center shadow-sm">
          <h3 className="text-sm text-slate-500">Total Fees</h3>
          <p className="mt-2 text-2xl font-semibold text-amber-500">{totals.totalFees.toLocaleString()} RWF</p>
        </div>
        <div className="rounded-xl bg-white p-5 text-center shadow-sm">
          <h3 className="text-sm text-slate-500">Total Earnings</h3>
          <p className="mt-2 text-2xl font-semibold text-blue-500">{totals.totalEarnings.toLocaleString()} RWF</p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch()
          }}
          placeholder="Search by Parent ID or Name"
          className="min-w-[240px] rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
        />
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100" />
        <span className="text-sm text-slate-500">to</span>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100" />
        <button onClick={handleSearch} className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700">
          Search
        </button>
        <button onClick={resetSearch} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
          Reset
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-green-600"></div></div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold">Parent Earnings (Combined with Shift Logs)</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th>Parent Name</th>
                    <th>Shifts</th>
                    <th>Days Worked</th>
                    <th>Money Earned</th>
                    <th>Fees Earned</th>
                    <th>Total Earnings</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {parentEarnings.length > 0 ? (
                    parentEarnings.map((parent, index) => (
                      <tr key={index}>
                        <td>{parent.FullName}</td>
                        <td>{parent.shiftsCount}</td>
                        <td>{parent.daysWorked}</td>
                        <td className="text-emerald-600">{parent.totalMoney.toLocaleString()} RWF</td>
                        <td className="text-amber-500">{parent.totalFees.toLocaleString()} RWF</td>
                        <td className="font-semibold">{parent.totalEarnings.toLocaleString()} RWF</td>
                        <td>
                          <button
                            type="button"
                            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                            onClick={() => openParentDetails(parent)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="7" className="py-12 text-center text-slate-500">No earnings data found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {selectedParentDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedParentDetails(null)}>
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-semibold">Parent Earnings Details</h3>
              <button className="text-2xl text-slate-400 hover:text-slate-700" onClick={() => setSelectedParentDetails(null)}>×</button>
            </div>

            <div className="space-y-5 px-6 py-5">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-lg border border-slate-200 p-3"><div className="text-xs text-slate-500">Parent</div><div className="font-semibold">{selectedParentDetails.parent?.FullName || '-'}</div></div>
                <div className="rounded-lg border border-slate-200 p-3"><div className="text-xs text-slate-500">Shifts</div><div className="font-semibold">{selectedParentDetails.totals?.shifts || 0}</div></div>
                <div className="rounded-lg border border-slate-200 p-3"><div className="text-xs text-slate-500">Total Money</div><div className="font-semibold text-emerald-600">{(selectedParentDetails.totals?.money || 0).toLocaleString()} RWF</div></div>
                <div className="rounded-lg border border-slate-200 p-3"><div className="text-xs text-slate-500">Total Fees</div><div className="font-semibold text-amber-500">{(selectedParentDetails.totals?.fees || 0).toLocaleString()} RWF</div></div>
                <div className="rounded-lg border border-slate-200 p-3"><div className="text-xs text-slate-500">Total Earnings</div><div className="font-semibold text-blue-600">{(selectedParentDetails.totals?.total || 0).toLocaleString()} RWF</div></div>
              </div>

              <h4 className="text-base font-semibold">Daily Earnings with Start/End Time</h4>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Shift Name</th>
                      <th>Work Type</th>
                      <th>Start Time</th>
                      <th>End Time</th>
                      <th>Shifts</th>
                      <th>Money</th>
                      <th>Fees</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedParentDetails.perDay?.length > 0 ? (
                      selectedParentDetails.perDay.map((row) => (
                        <tr key={row.date}>
                          <td>{row.date}</td>
                          <td>{row.shiftNames || '-'}</td>
                          <td>{row.workType || '-'}</td>
                          <td>{row.startTime || '-'}</td>
                          <td>{row.endTime || '-'}</td>
                          <td>{row.shifts}</td>
                          <td className="text-emerald-600">{row.money.toLocaleString()} RWF</td>
                          <td className="text-amber-500">{row.fees.toLocaleString()} RWF</td>
                          <td className="font-semibold text-blue-600">{row.total.toLocaleString()} RWF</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="9" className="py-10 text-center text-slate-500">No per-day data found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-200 px-6 py-4">
              <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100" onClick={() => setSelectedParentDetails(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
