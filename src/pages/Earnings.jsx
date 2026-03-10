import { useState, useEffect } from 'react'

export default function Earnings() {
  const [earnings, setEarnings] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('summary')
  const [startDate, setStartDate] = useState('2025-10-01')
  const [endDate, setEndDate] = useState('2025-10-31')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDetails, setSelectedDetails] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState('')

  useEffect(() => {
    fetchEarnings()
  }, [startDate, endDate, searchTerm])

  const fetchEarnings = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ startDate, endDate })
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim())
      }

      const response = await fetch(`http://localhost:3004/api/parent-earnings/summary?${params.toString()}`)
      const data = await response.json()
      setEarnings(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error fetching earnings:', err)
    } finally {
      setLoading(false)
    }
  }

  const toNumber = (value) => Number(value || 0)
  const totalEarnings = earnings?.reduce((sum, e) => sum + toNumber(e.total_earnings), 0) || 0
  const totalMoney = earnings?.reduce((sum, e) => sum + toNumber(e.total_money), 0) || 0
  const totalFees = earnings?.reduce((sum, e) => sum + toNumber(e.total_fees), 0) || 0

  const formatDate = (value) => new Date(value).toLocaleDateString()
  const formatTime = (value) => (value ? String(value).slice(0, 5) : '-')

  const openDetails = async (parentId) => {
    setDetailsLoading(true)
    setDetailsError('')
    setSelectedDetails(null)

    try {
      const params = new URLSearchParams({
        parentId: String(parentId),
        startDate,
        endDate
      })
      const response = await fetch(`http://localhost:3004/api/parent-earnings/detailed?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to load parent details')
      }

      setSelectedDetails(data)
    } catch (err) {
      setDetailsError(err.message || 'Failed to load parent details')
    } finally {
      setDetailsLoading(false)
    }
  }

  const closeDetails = () => {
    setSelectedDetails(null)
    setDetailsError('')
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Parents Earnings</h1>
        <div className="flex gap-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by parent name or ID"
            className="w-56 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100" />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100" />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="mb-1 text-xs uppercase text-slate-500">Total Earnings</div>
          <div className="text-3xl font-bold">{totalEarnings.toLocaleString()} RWF</div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="mb-1 text-xs uppercase text-slate-500">Total Money</div>
          <div className="text-3xl font-bold">{totalMoney.toLocaleString()} RWF</div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="mb-1 text-xs uppercase text-slate-500">Total Fees</div>
          <div className="text-3xl font-bold">{totalFees.toLocaleString()} RWF</div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="mb-1 text-xs uppercase text-slate-500">Total Parents</div>
          <div className="text-3xl font-bold">{earnings?.length || 0}</div>
        </div>
      </div>

      <div className="mb-6 flex border-b border-slate-200">
        <button className={`px-4 py-3 text-sm font-medium ${activeTab === 'summary' ? 'border-b-2 border-green-600 text-green-600' : 'text-slate-500 hover:text-slate-700'}`} onClick={() => setActiveTab('summary')}>Summary</button>
        <button className={`px-4 py-3 text-sm font-medium ${activeTab === 'detailed' ? 'border-b-2 border-green-600 text-green-600' : 'text-slate-500 hover:text-slate-700'}`} onClick={() => setActiveTab('detailed')}>Detailed</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-green-600"></div></div>
      ) : (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Parent Name</th>
                  <th>Phone</th>
                  <th>Days Worked</th>
                  <th>Shifts</th>
                  <th>Money</th>
                  <th>Fees</th>
                  <th>Total</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {earnings?.length > 0 ? (
                  earnings.map((item, index) => (
                    <tr key={index}>
                      <td>{item.ParentID}</td>
                      <td>{item.FullName}</td>
                      <td>{item.PhoneNumber || '-'}</td>
                      <td>{item.days_worked || 0}</td>
                      <td>{item.shifts_completed || 0}</td>
                      <td>{toNumber(item.total_money).toLocaleString()} RWF</td>
                      <td>{toNumber(item.total_fees).toLocaleString()} RWF</td>
                      <td>{toNumber(item.total_earnings).toLocaleString()} RWF</td>
                      <td>
                        <button
                          onClick={() => openDetails(item.ParentID)}
                          className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-green-700"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="9" className="py-12 text-center text-slate-500">No earnings data found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(detailsLoading || detailsError || selectedDetails) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Parent Earnings Details</h2>
                {selectedDetails?.parent && (
                  <p className="text-sm text-slate-600">
                    {selectedDetails.parent.FullName} (ID: {selectedDetails.parent.ParentID})
                  </p>
                )}
              </div>
              <button onClick={closeDetails} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
                Close
              </button>
            </div>

            {detailsLoading && (
              <div className="py-8 text-center text-sm text-slate-500">Loading details...</div>
            )}

            {detailsError && !detailsLoading && (
              <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-800">{detailsError}</div>
            )}

            {selectedDetails && !detailsLoading && (
              <>
                <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-lg bg-slate-50 p-3 text-sm">
                    <p className="text-slate-500">Total Money</p>
                    <p className="text-lg font-semibold">{toNumber(selectedDetails.summary?.total_money).toLocaleString()} RWF</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 text-sm">
                    <p className="text-slate-500">Total Fees</p>
                    <p className="text-lg font-semibold">{toNumber(selectedDetails.summary?.total_fees).toLocaleString()} RWF</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 text-sm">
                    <p className="text-slate-500">Total Earnings</p>
                    <p className="text-lg font-semibold">{toNumber(selectedDetails.summary?.total_earnings).toLocaleString()} RWF</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {(selectedDetails.data || []).map((day) => (
                    <div key={day.AccessDate} className="rounded-lg border border-slate-200 p-4">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-slate-900">{formatDate(day.AccessDate)}</p>
                        <p className="text-sm text-slate-600">
                          Total: {toNumber(day.total_earnings).toLocaleString()} RWF
                        </p>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr>
                              <th>Shift</th>
                              <th>Start Time</th>
                              <th>End Time</th>
                              <th>Money</th>
                              <th>Fees</th>
                              <th>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(day.shifts || []).map((shift, shiftIndex) => (
                              <tr key={`${day.AccessDate}-${shiftIndex}`}>
                                <td>{shift.shift_name || '-'}</td>
                                <td>{formatTime(shift.check_in)}</td>
                                <td>{formatTime(shift.check_out)}</td>
                                <td>{toNumber(shift.money_earned).toLocaleString()} RWF</td>
                                <td>{toNumber(shift.fee_earned).toLocaleString()} RWF</td>
                                <td>{toNumber(shift.total).toLocaleString()} RWF</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
