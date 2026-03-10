import { useEffect, useState } from 'react'

export default function TopEarners() {
  const TOP_EARNERS_MIN_RATE = '2000'
  const TOP_EARNERS_LIMIT = '24'

  const [topEarners, setTopEarners] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formMode, setFormMode] = useState('add')
  const [formParentId, setFormParentId] = useState('')
  const [formRate, setFormRate] = useState('')
  const [message, setMessage] = useState('')
  const [startDate, setStartDate] = useState('2025-10-01')
  const [endDate, setEndDate] = useState('2025-10-31')
  const [search, setSearch] = useState('')
  const [selectedEarner, setSelectedEarner] = useState(null)
  const [earnerDetails, setEarnerDetails] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')

  useEffect(() => {
    fetchTopEarners()
  }, [startDate, endDate, search])

  const fetchTopEarners = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        minRate: TOP_EARNERS_MIN_RATE,
        limit: TOP_EARNERS_LIMIT
      })

      if (search.trim()) {
        params.append('search', search.trim())
      }

      const response = await fetch(`http://localhost:3004/api/top-earners/dashboard?${params.toString()}`)
      const data = await response.json()
      setTopEarners(data.topEarners || [])
      setSummary(data.summary || null)
    } catch (err) {
      console.error('Error fetching top earners:', err)
    } finally {
      setLoading(false)
    }
  }

  const openAddForm = () => {
    setFormMode('add')
    setFormParentId('')
    setFormRate('')
    setShowForm(true)
  }

  const openEditForm = (item) => {
    setFormMode('edit')
    setFormParentId(String(item.ParentID || ''))
    setFormRate(String(item.custom_rate || item.effective_rate || ''))
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setFormMode('add')
    setFormParentId('')
    setFormRate('')
  }

  const handleSaveForm = async (e) => {
    e.preventDefault()

    const parentId = formParentId.trim()
    const rateNumber = Number(formRate)

    if (!parentId) {
      setMessage('Parent ID is required')
      return
    }

    if (!formRate || Number.isNaN(rateNumber) || rateNumber <= 0) {
      setMessage('Enter a valid rate greater than 0')
      return
    }

    setActionLoading(true)
    setMessage('')
    try {
      const response = await fetch(`http://localhost:3004/api/top-earners/${parentId}/rate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ MoneyRateOverrideRWF: rateNumber })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save rate')
      }

      setMessage(`Rate saved for parent ${parentId}`)
      if (formMode === 'add') {
        setFormParentId('')
        setFormRate('')
      }
      fetchTopEarners()
    } catch (err) {
      setMessage(err.message || 'Failed to save rate')
    } finally {
      setActionLoading(false)
    }
  }

  const deleteRate = async (parentId) => {
    if (!confirm(`Delete custom rate for parent ${parentId}?`)) return

    setActionLoading(true)
    setMessage('')
    try {
      const response = await fetch(`http://localhost:3004/api/top-earners/${parentId}/rate`, {
        method: 'DELETE'
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete rate')
      }

      setMessage(`Rate removed for parent ${parentId}`)
      if (formParentId === String(parentId)) {
        closeForm()
      }
      fetchTopEarners()
    } catch (err) {
      setMessage(err.message || 'Failed to delete rate')
    } finally {
      setActionLoading(false)
    }
  }

  const closeViewCard = () => {
    setSelectedEarner(null)
    setEarnerDetails(null)
    setDetailError('')
    setDetailLoading(false)
  }

  const openViewCard = async (item) => {
    setSelectedEarner(item)
    setDetailLoading(true)
    setEarnerDetails(null)
    setDetailError('')

    try {
      const params = new URLSearchParams({
        startDate,
        endDate
      })

      const response = await fetch(`http://localhost:3004/api/top-earners/${item.ParentID}/details?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load top earner details')
      }

      setEarnerDetails(data)
    } catch (err) {
      setDetailError(err.message || 'Failed to load top earner details')
    } finally {
      setDetailLoading(false)
    }
  }

  const formatTime = (timeValue) => {
    if (!timeValue) return '-'
    const safeText = String(timeValue)
    return safeText.length >= 5 ? safeText.slice(0, 5) : safeText
  }

  const formatDisplayDate = (dateValue) => {
    if (!dateValue) return '-'
    const parsedDate = new Date(`${dateValue}T00:00:00`)
    if (Number.isNaN(parsedDate.getTime())) {
      return dateValue
    }

    return parsedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Top Earners</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openAddForm}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700"
          >
            Add
          </button>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />
        </div>
      </div>

      <div className="mb-4 flex gap-3">
        <input
          type="text"
          placeholder="Search by Parent ID or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
        />
      </div>

      {message && (
        <div className="mb-4 rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-700">
          {message}
        </div>
      )}

      {showForm && (
      <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {formMode === 'edit' ? 'Edit Top Earner Rate' : 'Add Top Earner Rate'}
          </h2>
          <button
            type="button"
            onClick={closeForm}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSaveForm} className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto]">
          <input
            type="number"
            value={formParentId}
            onChange={(e) => setFormParentId(e.target.value)}
            placeholder="Parent ID"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
            required
          />
          <input
            type="number"
            min="1"
            value={formRate}
            onChange={(e) => setFormRate(e.target.value)}
            placeholder="Custom Rate (RWF)"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
            required
          />
          <button
            type="submit"
            disabled={actionLoading}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-60"
          >
            {actionLoading ? 'Saving...' : formMode === 'edit' ? 'Update Rate' : 'Add Rate'}
          </button>
        </form>
      </div>
      )}

      {summary && (
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <div className="mb-1 text-xs uppercase text-slate-500">Total Top Earners</div>
            <div className="text-3xl font-bold">{summary.totalTopEarners || 0}</div>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <div className="mb-1 text-xs uppercase text-slate-500">Total Earnings</div>
            <div className="text-3xl font-bold">{(summary.totalEarnings || 0).toLocaleString()} RWF</div>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <div className="mb-1 text-xs uppercase text-slate-500">Highest Earning</div>
            <div className="text-3xl font-bold">{(summary.highestEarning || 0).toLocaleString()} RWF</div>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <div className="mb-1 text-xs uppercase text-slate-500">High Earners</div>
            <div className="text-3xl font-bold">{summary.highEarnersCount || 0}</div>
          </div>
        </div>
      )}

      {selectedEarner && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-emerald-700 px-5 py-4">
            <div>
              <h2 className="text-lg font-bold text-white">Shifts for {selectedEarner.FullName || 'Top Earner'}</h2>
              <p className="text-xs text-emerald-100">
                Parent ID: <span className="font-semibold text-white">{selectedEarner.ParentID}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={closeViewCard}
              className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/30"
            >
              Close
            </button>
          </div>

          {detailLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-sky-600"></div>
            </div>
          ) : detailError ? (
            <div className="m-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{detailError}</div>
          ) : earnerDetails ? (
            <div className="space-y-4 bg-slate-50 p-5">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                <div className="grid grid-cols-1 gap-3 text-sm text-slate-700 md:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-500">Full Name</div>
                    <div className="mt-1 font-semibold text-slate-900">{selectedEarner.FullName || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-500">Parent ID</div>
                    <div className="mt-1 font-semibold text-slate-900">{selectedEarner.ParentID}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-500">Phone</div>
                    <div className="mt-1 font-semibold text-slate-900">{selectedEarner.PhoneNumber || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-500">Date Range</div>
                    <div className="mt-1 font-semibold text-slate-900">{startDate} to {endDate}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                  <div className="text-2xl font-bold text-emerald-600">{earnerDetails.totals?.totalShiftsDone || 0}</div>
                  <div className="mt-1 text-xs uppercase tracking-wide text-slate-500">All Shifts Done</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                  <div className="text-2xl font-bold text-blue-700">{earnerDetails.totals?.completedShifts || 0}</div>
                  <div className="mt-1 text-xs uppercase tracking-wide text-slate-500">Completed Shifts</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                  <div className="text-2xl font-bold text-slate-800">{earnerDetails.totals?.totalDaysWorked || 0}</div>
                  <div className="mt-1 text-xs uppercase tracking-wide text-slate-500">Days With Shifts</div>
                </div>
              </div>

              <div className="space-y-4">
                {earnerDetails.shiftsByDay?.length > 0 ? (
                  earnerDetails.shiftsByDay.map((dayItem) => (
                    <div key={dayItem.date} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 bg-emerald-50 px-4 py-3">
                        <span className="text-sm font-semibold text-slate-800">{formatDisplayDate(dayItem.date)}</span>
                        <span className="text-xs font-semibold text-emerald-700">
                          Shifts: {dayItem.totalShifts} | Completed: {dayItem.completedShifts}
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr>
                              <th>Shift Name</th>
                              <th>Start Time</th>
                              <th>End Time</th>
                              <th>Check In</th>
                              <th>Check Out</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dayItem.shifts.map((shift, index) => (
                              <tr key={`${dayItem.date}-${shift.shift_name}-${index}`}>
                                <td>{shift.shift_name || '-'}</td>
                                <td>{formatTime(shift.start_time)}</td>
                                <td>{formatTime(shift.end_time)}</td>
                                <td>{formatTime(shift.check_in_time)}</td>
                                <td>{formatTime(shift.check_out_time)}</td>
                                <td>
                                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                                    shift.check_out_time ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                  }`}>
                                    {shift.check_out_time ? 'Completed' : 'In Progress'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-slate-200 bg-white px-4 py-4 text-sm text-slate-500">
                    No shift details found for the selected date range.
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-green-600"></div>
        </div>
      ) : (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th>Parent ID</th>
                  <th>Parent Name</th>
                  <th>Phone</th>
                  <th>Days Worked</th>
                  <th>Shifts</th>
                  <th>Total Money</th>
                  <th>Total Fees</th>
                  <th>Total Earnings</th>
                  <th>Avg/Shift</th>
                  <th>Rate Applied</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {topEarners.length > 0 ? (
                  topEarners.map((item) => (
                    <tr key={item.ParentID}>
                      <td>{item.ParentID}</td>
                      <td>{item.FullName}</td>
                      <td>{item.PhoneNumber || '-'}</td>
                      <td>{item.days_worked || 0}</td>
                      <td>{item.shifts_completed || 0}</td>
                      <td className="text-emerald-600">{(item.total_money || 0).toLocaleString()} RWF</td>
                      <td className="text-amber-500">{(item.total_fees || 0).toLocaleString()} RWF</td>
                      <td className="font-semibold text-blue-600">{(item.total_earnings || 0).toLocaleString()} RWF</td>
                      <td>{(item.avg_per_shift || 0).toLocaleString()} RWF</td>
                      <td>{(item.effective_rate || 0).toLocaleString()} RWF</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditForm(item)}
                            className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => openViewCard(item)}
                            className="rounded-md border border-sky-300 bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700 transition hover:bg-sky-100"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteRate(item.ParentID)}
                            disabled={actionLoading}
                            className="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="11" className="py-12 text-center text-slate-500">
                      No top earners found for selected range
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
