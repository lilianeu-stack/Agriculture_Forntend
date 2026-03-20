import { useEffect, useState } from 'react'

export default function Shifts() {
  const [rows, setRows] = useState([])
  // Group invalid shifts by parent
  const invalidShiftsByParent = {};
  if (Array.isArray(rows)) {
    rows.forEach((row) => {
      if (!row.valid) {
        if (!invalidShiftsByParent[row.ParentID]) {
          invalidShiftsByParent[row.ParentID] = [];
        }
        invalidShiftsByParent[row.ParentID].push(row);
      }
    });
  }
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('2025-10-01')
  const [endDate, setEndDate] = useState('2025-10-31')
  const [search, setSearch] = useState('')
  const [selectedPerson, setSelectedPerson] = useState(null)
  const [personDetails, setPersonDetails] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [detailStartDate, setDetailStartDate] = useState('2025-10-01')
  const [detailEndDate, setDetailEndDate] = useState('2025-10-31')

  useEffect(() => {
    fetchWorkedShifts()
  }, [startDate, endDate, search])

  const fetchWorkedShifts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ startDate, endDate })
      if (search.trim()) {
        params.append('search', search.trim())
      }

      const response = await fetch(`http://localhost:3004/api/money-shifts/earnings?${params.toString()}`)
      const data = await response.json()
      setRows(data.detailedEarnings || [])
    } catch (err) {
      console.error('Error fetching worked shifts:', err)
    } finally {
      setLoading(false)
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

  const openViewCard = async (item) => {
    const safePerson = {
      ParentID: item.ParentID,
      FullName: item.FullName,
      PhoneNumber: item.PhoneNumber || '-'
    }

    setSelectedPerson(safePerson)
    setDetailStartDate(startDate)
    setDetailEndDate(endDate)
    setPersonDetails(null)
    setDetailError('')
    setDetailLoading(true)

    try {
      const params = new URLSearchParams({ startDate, endDate })
      const response = await fetch(`http://localhost:3004/api/top-earners/${item.ParentID}/details?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load shift details')
      }

      setPersonDetails(data)
    } catch (err) {
      setDetailError(err.message || 'Failed to load shift details')
    } finally {
      setDetailLoading(false)
    }
  }

  const loadSelectedPersonShifts = async () => {
    if (!selectedPerson) return

    setPersonDetails(null)
    setDetailError('')
    setDetailLoading(true)
    try {
      const params = new URLSearchParams({ startDate: detailStartDate, endDate: detailEndDate })
      const response = await fetch(
        `http://localhost:3004/api/top-earners/${selectedPerson.ParentID}/details?${params.toString()}`
      )
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load shift details')
      }

      setPersonDetails(data)
    } catch (err) {
      setDetailError(err.message || 'Failed to load shift details')
    } finally {
      setDetailLoading(false)
    }
  }

  const closeViewCard = () => {
    setSelectedPerson(null)
    setPersonDetails(null)
    setDetailError('')
    setDetailLoading(false)
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Worked Shifts</h1>
        <div className="flex items-center gap-3">
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

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by Parent ID or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
        />
      </div>

      {selectedPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4">
          <div
            className="absolute inset-0"
            role="button"
            tabIndex={0}
            onClick={closeViewCard}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') closeViewCard()
            }}
          />

          <div className="relative z-10 max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-emerald-700 px-5 py-4">
            <div>
              <h2 className="text-lg font-bold text-white">Shifts for {selectedPerson.FullName || 'Parent'}</h2>
              <p className="text-xs text-emerald-100">
                Parent ID: <span className="font-semibold text-white">{selectedPerson.ParentID}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={closeViewCard}
              className="rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/30"
            >
              Close
            </button>
            </div>

            <div className="max-h-[calc(92vh-70px)] space-y-4 overflow-y-auto bg-slate-50 p-5">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                <div className="grid grid-cols-1 gap-3 text-sm text-slate-700 md:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-500">Full Name</div>
                    <div className="mt-1 font-semibold text-slate-900">{selectedPerson.FullName || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-500">Parent ID</div>
                    <div className="mt-1 font-semibold text-slate-900">{selectedPerson.ParentID || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-500">Phone Number</div>
                    <div className="mt-1 font-semibold text-slate-900">{selectedPerson.PhoneNumber || '-'}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="text-sm font-medium text-slate-700">Start Date:</label>
                  <input
                    type="date"
                    value={detailStartDate}
                    onChange={(e) => setDetailStartDate(e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  />
                  <label className="text-sm font-medium text-slate-700">End Date:</label>
                  <input
                    type="date"
                    value={detailEndDate}
                    onChange={(e) => setDetailEndDate(e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  />
                  <button
                    type="button"
                    onClick={loadSelectedPersonShifts}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700"
                  >
                    Load Shifts
                  </button>
                </div>
              </div>

              {detailLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-green-600"></div>
                </div>
              ) : detailError ? (
                <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{detailError}</div>
              ) : personDetails ? (
                <>
                  {/* Only shift summary, no money or school fees shown */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                      <div className="text-2xl font-bold text-emerald-600">{personDetails.totals?.totalShiftsDone || 0}</div>
                      <div className="mt-1 text-xs uppercase tracking-wide text-slate-500">Total Shifts</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                      <div className="text-2xl font-bold text-blue-700">{personDetails.totals?.completedShifts || 0}</div>
                      <div className="mt-1 text-xs uppercase tracking-wide text-slate-500">Completed Shifts</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {personDetails.shiftsByDay?.length > 0 ? (
                      personDetails.shiftsByDay.map((dayItem) => (
                        <div key={dayItem.date} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 bg-emerald-50 px-4 py-3">
                            <span className="text-sm font-semibold text-slate-800">{formatDisplayDate(dayItem.date)}</span>
                            <span className="text-xs font-semibold text-emerald-700">
                              Total Shifts: {dayItem.totalShifts} | Completed: {dayItem.completedShifts}
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
                                      <span
                                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                                          shift.check_out_time
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-amber-100 text-amber-700'
                                        }`}
                                      >
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
                </>
              ) : null}
            </div>
          </div>
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
                  <th> Start Date</th>
                  <th>End Date</th>
                  <th>Parent ID</th>
                  <th>Parent Name</th>
                  <th>Shift Name</th>
                  <th>Check-In</th>
                  <th>Check-Out</th>
                  <th>Device Type</th>
                  <th>Status</th>
                  <th>Valid</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Helper to determine shift period
                  function getShiftPeriod(time) {
                    if (!time) return '-';
                    const hour = parseInt(time.split(':')[0], 10);
                    if (hour < 12) return 'Morning';
                    if (hour < 17) return 'Afternoon';
                    return 'Evening';
                  }

                  // Deduplicate: key = ParentID + AccessDate + shift period
                  const seen = new Set();
                  const filteredRows = rows.filter(item => {
                    const period = getShiftPeriod(item.check_in_time || item.start_time);
                    const key = `${item.ParentID}-${item.AccessDate}-${period}`;
                    if (seen.has(key)) {
                      item.valid = false;
                      return false; // Don't show duplicate
                    }
                    seen.add(key);
                    return true;
                  });

                  return filteredRows.length > 0 ? (
                    filteredRows.map((item, index) => {
                      const period = getShiftPeriod(item.check_in_time || item.start_time);
                      return (
                        <tr key={`${item.ParentID}-${item.AccessDate}-${period}-${index}`}>
                          <td>{startDate}</td>
                          <td>{endDate}</td>
                          <td>{item.ParentID || '-'}</td>
                          <td>{item.FullName || '-'}</td>
                          <td>{period}</td>
                          <td>{item.check_in_time || '-'}</td>
                          <td>{item.check_out_time || '-'}</td>
                          <td>{item.device_type_for_calc || '-'}</td>
                          <td>
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                                item.check_out_time
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {item.check_out_time ? 'Completed' : 'In Progress'}
                            </span>
                          </td>
                          <td>
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${item.valid ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                              {item.valid ? 'Valid' : 'Invalid'}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => openViewCard(item)}
                              className="rounded-md border border-sky-300 bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700 transition hover:bg-sky-100"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="11" className="py-12 text-center text-slate-500">
                        No worked shifts found in this date range
                      </td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Show invalid shifts summary per parent */}
      {Object.keys(invalidShiftsByParent).length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-red-700 mb-4">Invalid Shifts Summary</h2>
          {Object.entries(invalidShiftsByParent).map(([parentId, shifts]) => {
            // Filter invalid shifts by selected date range
            const filteredShifts = shifts.filter(shift => {
              const date = shift.AccessDate || '';
              return date >= startDate && date <= endDate;
            });
            if (filteredShifts.length === 0) return null;
            return (
              <div key={parentId} className="mb-6 p-4 rounded-lg border border-red-200 bg-red-50">
                <div className="mb-2 font-semibold text-red-800">
                  Parent ID: {parentId} — This person has {filteredShifts.length} invalid shift{filteredShifts.length > 1 ? 's' : ''} in the selected date range.
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Date</th>
                        <th>Shift Name</th>
                        <th>Check-In</th>
                        <th>Check-Out</th>
                        <th>Device Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredShifts.map((shift, idx) => (
                        <tr key={idx}>
                          <td>{startDate}</td>
                          <td>{endDate}</td>
                          <td>{shift.AccessDate || '-'}</td>
                          <td>{shift.shift_name || '-'}</td>
                          <td>{shift.check_in_time || '-'}</td>
                          <td>{shift.check_out_time || '-'}</td>
                          <td>{shift.device_type_for_calc || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  )
}
