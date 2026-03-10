import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function SchoolFees() {
  const role = sessionStorage.getItem('role') || ''
  const canImportClasses = role !== 'admin'
  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [studentPayments, setStudentPayments] = useState([])
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [totalFees, setTotalFees] = useState(0)
  const [importing, setImporting] = useState(false)
  const [studentSearch, setStudentSearch] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async (filters = {}) => {
    try {
      const params = new URLSearchParams()
      const effectiveSearch = (filters.studentSearch ?? studentSearch).trim()
      const effectiveClass = filters.classFilter ?? classFilter

      if (effectiveSearch) params.set('search', effectiveSearch)
      if (effectiveClass) params.set('classFilter', effectiveClass)

      const url = `http://localhost:3004/api/school-fees/students${params.toString() ? `?${params.toString()}` : ''}`
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch students')
      const data = await response.json()
      setStudents(data.students || [])
      setClasses(data.filters?.classes || [])
      setLoading(false)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleApplyFilters = () => {
    setLoading(true)
    fetchStudents()
  }

  const handleResetFilters = () => {
    setStudentSearch('')
    setClassFilter('')
    setLoading(true)
    fetchStudents({ studentSearch: '', classFilter: '' })
  }

  const viewStudentPayments = async (student) => {
    setSelectedStudent(student)
    await fetchStudentPayments(student.StudentID)
  }

  const fetchStudentPayments = async (studentId) => {
    try {
      let url = `http://localhost:3004/api/school-fees/student/${studentId}`
      if (dateRange.start && dateRange.end) {
        url += `?startDate=${dateRange.start}&endDate=${dateRange.end}`
      }
      const response = await fetch(url)
      const data = await response.json()
      setStudentPayments(data.fees || [])
      setTotalFees(data.totals?.total_paid || data.totals?.total_fees || 0)
    } catch (err) {
      console.error('Error fetching payments:', err)
    }
  }

  const handleRangeFilter = () => {
    if (selectedStudent) {
      fetchStudentPayments(selectedStudent.StudentID)
    }
  }

  const handleExcelImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setImporting(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('http://localhost:3004/api/fees/import-classes', {
        method: 'POST',
        body: formData
      })
      const data = await response.json()

      if (response.ok) {
        alert(`Successfully updated ${data.updated} student classes!`)
        fetchStudents()
      } else {
        alert('Error importing file: ' + data.error)
      }
    } catch (err) {
      alert('Error importing file: ' + err.message)
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  const logout = () => {
    sessionStorage.clear()
    navigate('/login')
  }

  if (loading) {
    return <div className="flex items-center justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-green-600"></div></div>
  }

  if (error) {
    return <div className="rounded-lg bg-red-100 px-4 py-3 text-sm text-red-800">{error}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">School Fees Management</h1>
        <button onClick={logout} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">Logout</button>
      </div>

      {canImportClasses && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-2 text-lg font-semibold">Import Student Classes (Excel)</h3>
          <p className="mb-4 text-sm text-slate-600">Upload an Excel file with StudentID and Class columns to update student classes automatically.</p>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleExcelImport}
              disabled={importing}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            {importing && <span className="text-sm text-slate-500">Importing...</span>}
            <a href="/template.xlsx" download className="text-sm font-medium text-green-700 hover:text-green-800">Download Template</a>
          </div>
        </div>
      )}

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Students & Fees</h2>
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <input
            type="text"
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
            placeholder="Search by student name"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
          >
            <option value="">All Classes</option>
            {classes.map((className) => (
              <option key={className} value={className}>{className}</option>
            ))}
          </select>
          <button
            onClick={handleApplyFilters}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700"
          >
            Search
          </button>
          <button
            onClick={handleResetFilters}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Reset
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th>ID</th>
                <th>Student Name</th>
                <th>Class</th>
                <th>Total Fees Paid</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student.StudentID}>
                  <td>{student.StudentID}</td>
                  <td>{student.FirstName} {student.LastName}</td>
                  <td>{student.Class}</td>
                  <td>{student.total_paid ? `${student.total_paid.toLocaleString()} RWF` : '0 RWF'}</td>
                  <td>
                    <button onClick={() => viewStudentPayments(student)} className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-green-700">
                      View Payments
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-semibold">{selectedStudent.StudentName || `${selectedStudent.FirstName || ''} ${selectedStudent.LastName || ''}`} - Fee Payments</h3>
              <button onClick={() => setSelectedStudent(null)} className="text-2xl text-slate-400 hover:text-slate-700">&times;</button>
            </div>

            <div className="space-y-5 px-6 py-5">
              <div className="rounded-lg border border-slate-200 p-4">
                <label className="mb-3 block text-sm font-medium text-slate-700">Filter by Date Range:</label>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                    placeholder="Start Date"
                  />
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                    placeholder="End Date"
                  />
                  <button onClick={handleRangeFilter} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700">Apply</button>
                </div>
              </div>

              <div className="rounded-lg bg-emerald-50 p-4">
                <h3 className="text-lg font-semibold text-emerald-700">Total Fees Paid: {totalFees.toLocaleString()} RWF</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Term</th>
                      <th>Year</th>
                      <th>Method</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentPayments.length > 0 ? (
                      studentPayments.map((payment, index) => (
                        <tr key={`${payment.id || payment.payment_date}-${index}`}>
                          <td>{new Date(payment.payment_date).toLocaleDateString()}</td>
                          <td>{payment.amount?.toLocaleString() || payment.amount_paid?.toLocaleString() || 0} RWF</td>
                          <td>{payment.term || 'N/A'}</td>
                          <td>{payment.year}</td>
                          <td>{payment.payment_method}</td>
                          <td>{payment.notes || '-'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="6" className="py-12 text-center text-slate-500">No payments found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
