import { useState, useEffect } from 'react'

export default function Parents() {
  const [parents, setParents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingParent, setEditingParent] = useState(null)
  const [formData, setFormData] = useState({
    FullName: '',
    PhoneNumber: '',
    MomoVerify: '',
    Gender: '',
    NumberOfKids: ''
  })

  useEffect(() => {
    fetchParents()
  }, [search])

  const fetchParents = async () => {
    try {
      const url = search 
        ? `http://localhost:3004/api/parents?search=${encodeURIComponent(search)}`
        : 'http://localhost:3004/api/parents'
      const response = await fetch(url)
      const data = await response.json()
      setParents(data)
    } catch (err) {
      console.error('Error fetching parents:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const method = editingParent ? 'PUT' : 'POST'
      const url = editingParent 
        ? `http://localhost:3004/api/parents/${editingParent.ParentID}`
        : 'http://localhost:3004/api/parents'
      
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      setShowModal(false)
      setEditingParent(null)
      setFormData({ FullName: '', PhoneNumber: '', MomoVerify: '', Gender: '', NumberOfKids: '' })
      fetchParents()
    } catch (err) {
      console.error('Error saving parent:', err)
    }
  }

  const handleEdit = (parent) => {
    setEditingParent(parent)
    setFormData({
      FullName: parent.FullName,
      PhoneNumber: parent.PhoneNumber || '',
      MomoVerify: parent.MomoVerify || '',
      Gender: parent.Gender || '',
      NumberOfKids: parent.NumberOfKids || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this parent?')) return
    try {
      await fetch(`http://localhost:3004/api/parents/${id}`, { method: 'DELETE' })
      fetchParents()
    } catch (err) {
      console.error('Error deleting parent:', err)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Parents</h1>
        <button className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700" onClick={() => {
          setEditingParent(null)
          setFormData({ FullName: '', PhoneNumber: '', Gender: '', NumberOfKids: '' })
          setShowModal(true)
        }}>
          + Add Parent
        </button>
      </div>

      <div className="mb-4 flex gap-3">
        <input
          type="text"
          placeholder="Search by parent name, ID, or phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
                  <th>Full Name</th>
                  <th>Phone</th>
                  <th>MomoVerify</th>
                  <th>Gender</th>
                  <th>Kids</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {parents.length > 0 ? (
                  parents.map((parent) => (
                    <tr key={parent.ParentID}>
                      <td>{parent.ParentID}</td>
                      <td>{parent.FullName}</td>
                      <td>{parent.PhoneNumber || '-'}</td>
                      <td>{parent.MomoVerify || '-'}</td>
                      <td>{parent.Gender || '-'}</td>
                      <td>{parent.NumberOfKids || 0}</td>
                      <td className="space-x-2">
                        <button className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100" onClick={() => handleEdit(parent)}>Edit</button>
                        <button className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700" onClick={() => handleDelete(parent.ParentID)}>Delete</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-500">No parents found</td>
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
              <h3 className="text-lg font-semibold">{editingParent ? 'Edit Parent' : 'Add Parent'}</h3>
              <button className="text-2xl text-slate-400 hover:text-slate-700" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 px-6 py-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Full Name</label>
                  <input
                    type="text"
                    value={formData.FullName}
                    onChange={(e) => setFormData({ ...formData, FullName: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Phone Number</label>
                  <input
                    type="text"
                    value={formData.PhoneNumber}
                    onChange={(e) => setFormData({ ...formData, PhoneNumber: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">MomoVerify</label>
                  <input
                    type="text"
                    value={formData.MomoVerify}
                    onChange={(e) => setFormData({ ...formData, MomoVerify: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Gender</label>
                  <select value={formData.Gender} onChange={(e) => setFormData({ ...formData, Gender: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100">
                    <option value="">Select</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Number of Kids</label>
                  <input
                    type="number"
                    value={formData.NumberOfKids}
                    onChange={(e) => setFormData({ ...formData, NumberOfKids: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                <button type="button" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700">{editingParent ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
