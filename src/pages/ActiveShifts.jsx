import { useEffect, useState } from 'react'

export default function ActiveShifts() {
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingShift, setEditingShift] = useState(null)
  const [form, setForm] = useState({ shift_name: '', start_time: '', end_time: '', status: 1 })
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchActiveShifts()
  }, [])

  const fetchActiveShifts = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('http://localhost:3004/api/shifts?active=1&limit=5')
      const data = await response.json()
      setShifts(data.slice(0, 5))
    } catch (err) {
      setError('Failed to fetch active shifts')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (shift) => {
    setEditingShift(shift)
    setForm({
      shift_name: shift.shift_name,
      start_time: shift.start_time,
      end_time: shift.end_time,
      status: shift.status
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this shift?')) return
    try {
      await fetch(`http://localhost:3004/api/shifts/${id}`, { method: 'DELETE' })
      fetchActiveShifts()
    } catch {
      setError('Failed to delete shift')
    }
  }

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingShift) {
        await fetch(`http://localhost:3004/api/shifts/${editingShift.shift_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        })
      } else {
        await fetch('http://localhost:3004/api/shifts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        })
      }
      setEditingShift(null)
      setForm({ shift_name: '', start_time: '', end_time: '', status: 1 })
      setShowForm(false)
      fetchActiveShifts()
    } catch {
      setError('Failed to save shift')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Active Shifts</h1>
      {error && <div className="mb-4 text-red-600">{error}</div>}
      <div className="mb-4">
        {!showForm && !editingShift && (
          <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={() => { setShowForm(true); setEditingShift(null); setForm({ shift_name: '', start_time: '', end_time: '', status: 1 }) }}>+ Add Shift</button>
        )}
      </div>
      {(showForm || editingShift) && (
        <form onSubmit={handleFormSubmit} className="mb-6 space-y-3 bg-white p-4 rounded-lg shadow-sm">
          <div>
            <label className="block text-sm font-medium">Shift Name</label>
            <input name="shift_name" value={form.shift_name} onChange={handleFormChange} className="w-full border rounded px-3 py-2" required />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium">Start Time</label>
              <input name="start_time" type="time" value={form.start_time} onChange={handleFormChange} className="w-full border rounded px-3 py-2" required />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium">End Time</label>
              <input name="end_time" type="time" value={form.end_time} onChange={handleFormChange} className="w-full border rounded px-3 py-2" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Status</label>
            <select name="status" value={form.status} onChange={handleFormChange} className="w-full border rounded px-3 py-2">
              <option value={1}>Active</option>
              <option value={0}>Inactive</option>
            </select>
          </div>
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">{editingShift ? 'Update' : 'Add'} Shift</button>
          <button type="button" className="ml-3 px-4 py-2 rounded bg-gray-300" onClick={() => { setEditingShift(null); setShowForm(false); setForm({ shift_name: '', start_time: '', end_time: '', status: 1 }) }}>
            Cancel
          </button>
        </form>
      )}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="w-full bg-white rounded shadow-sm">
          <thead>
            <tr>
              <th className="py-2 px-3">Name</th>
              <th className="py-2 px-3">Start</th>
              <th className="py-2 px-3">End</th>
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {shifts.map((shift) => (
              <tr key={shift.shift_id}>
                <td className="py-2 px-3">{shift.shift_name}</td>
                <td className="py-2 px-3">{shift.start_time}</td>
                <td className="py-2 px-3">{shift.end_time}</td>
                <td className="py-2 px-3">{shift.status === 1 ? 'Active' : 'Inactive'}</td>
                <td className="py-2 px-3">
                  <button className="mr-2 px-3 py-1 rounded bg-blue-500 text-white" onClick={() => handleEdit(shift)}>Edit</button>
                  <button className="px-3 py-1 rounded bg-red-500 text-white" onClick={() => handleDelete(shift.shift_id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
