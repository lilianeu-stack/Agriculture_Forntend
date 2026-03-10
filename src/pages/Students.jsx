import { useState, useEffect } from 'react'

export default function Students() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [formData, setFormData] = useState({
    Registration_Number: '',
    FirstName: '',
    LastName: '',
    Class: ''
  })

  useEffect(() => {
    fetchStudents()
  }, [search])

  const fetchStudents = async () => {
    try {
      const searchParam = search ? `?search=${encodeURIComponent(search)}` : ''
      const response = await fetch(`http://localhost:3004/api/students${searchParam}`)
      const data = await response.json()
      setStudents(data)
    } catch (err) {
      console.error('Error fetching students:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    setSearch(e.target.value)
  }

  
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const method = editingStudent ? 'PUT' : 'POST'
      const url = editingStudent 
        ? `http://localhost:3004/api/students/${editingStudent.StudentID}`
        : 'http://localhost:3004/api/students'
      
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      setShowModal(false)
      setEditingStudent(null)
      setFormData({ Registration_Number: '', FirstName: '', LastName: '', Class: '' })
      fetchStudents()
    } catch (err) {
      console.error('Error saving student:', err)
    }
  }

  const handleEdit = (student) => {
    setEditingStudent(student)
    setFormData({
      Registration_Number: student.Registration_Number || '',
      FirstName: student.FirstName || '',
      LastName: student.LastName || '',
      Class: student.Class || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this student?')) return
    try {
      await fetch(`http://localhost:3004/api/students/${id}`, { method: 'DELETE' })
      fetchStudents()
    } catch (err) {
      console.error('Error deleting student:', err)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Students</h1>
        <button className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700" onClick={() => {
          setEditingStudent(null)
          setFormData({ Registration_Number: '', FirstName: '', LastName: '', Class: '' })
          setShowModal(true)
        }}>
          + Add Student
        </button>
      </div>

      <div className="mb-4 flex gap-3">
        <input
          type="text"
          placeholder="Search by Student ID, reg number, or name..."
          value={search}
          onChange={handleSearch}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
        />
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
                  <th>Reg Number</th>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Class</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.length > 0 ? (
                  students.map((student) => (
                    <tr key={student.StudentID}>
                      <td>{student.StudentID}</td>
                      <td>{student.Registration_Number || '-'}</td>
                      <td>{student.FirstName}</td>
                      <td>{student.LastName}</td>
                      <td>{student.Class || '-'}</td>
                      <td className="space-x-2">
                        <button className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100" onClick={() => handleEdit(student)}>Edit</button>
                        <button className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700" onClick={() => handleDelete(student.StudentID)}>Delete</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-500">No students found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-semibold">{editingStudent ? 'Edit Student' : 'Add Student'}</h3>
              <button className="text-2xl text-slate-400 hover:text-slate-700" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 px-6 py-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Registration Number</label>
                  <input
                    type="text"
                    value={formData.Registration_Number}
                    onChange={(e) => setFormData({ ...formData, Registration_Number: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">First Name</label>
                  <input
                    type="text"
                    value={formData.FirstName}
                    onChange={(e) => setFormData({ ...formData, FirstName: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Last Name</label>
                  <input
                    type="text"
                    value={formData.LastName}
                    onChange={(e) => setFormData({ ...formData, LastName: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Class</label>
                  <input
                    type="text"
                    value={formData.Class}
                    onChange={(e) => setFormData({ ...formData, Class: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                <button type="button" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700">{editingStudent ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
