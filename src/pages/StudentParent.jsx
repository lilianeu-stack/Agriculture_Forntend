import { useEffect, useState } from 'react'

export default function StudentParent() {
  const [relations, setRelations] = useState([])
  const [students, setStudents] = useState([])
  const [parents, setParents] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingRelation, setEditingRelation] = useState(null)
  const [formData, setFormData] = useState({
    StudentID: '',
    ParentID: '',
    Relationship: ''
  })

  useEffect(() => {
    fetchRelations()
    fetchStudents()
    fetchParents()
  }, [])

  const fetchRelations = async () => {
    try {
      const response = await fetch('http://localhost:3004/api/relations')
      const data = await response.json()
      setRelations(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error fetching relations:', err)
      setRelations([])
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async () => {
    try {
      const response = await fetch('http://localhost:3004/api/students')
      const data = await response.json()
      setStudents(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error fetching students:', err)
      setStudents([])
    }
  }

  const fetchParents = async () => {
    try {
      const response = await fetch('http://localhost:3004/api/parents')
      const data = await response.json()
      setParents(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error fetching parents:', err)
      setParents([])
    }
  }

  const openAddModal = () => {
    setEditingRelation(null)
    setFormData({ StudentID: '', ParentID: '', Relationship: '' })
    setShowModal(true)
  }

  const openEditModal = (relation) => {
    setEditingRelation(relation)
    setFormData({
      StudentID: relation.StudentID,
      ParentID: relation.ParentID,
      Relationship: relation.Relationship || ''
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      if (editingRelation) {
        await fetch(
          `http://localhost:3004/api/relations/${editingRelation.StudentID}/${editingRelation.ParentID}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Relationship: formData.Relationship })
          }
        )
      } else {
        await fetch('http://localhost:3004/api/relations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            StudentID: Number(formData.StudentID),
            ParentID: Number(formData.ParentID),
            Relationship: formData.Relationship
          })
        })
      }

      setShowModal(false)
      setEditingRelation(null)
      setFormData({ StudentID: '', ParentID: '', Relationship: '' })
      fetchRelations()
    } catch (err) {
      console.error('Error saving relation:', err)
    }
  }

  const handleDelete = async (studentId, parentId) => {
    if (!confirm('Are you sure you want to delete this student-parent relation?')) return

    try {
      await fetch(`http://localhost:3004/api/relations/${studentId}/${parentId}`, {
        method: 'DELETE'
      })
      fetchRelations()
    } catch (err) {
      console.error('Error deleting relation:', err)
    }
  }

  const filteredRelations = relations.filter((item) => {
    const q = search.trim().toLowerCase()
    if (!q) return true

    return (
      String(item.StudentID).toLowerCase().includes(q) ||
      String(item.ParentID).toLowerCase().includes(q) ||
      `${item.StudentFirstName || ''} ${item.StudentLastName || ''}`.toLowerCase().includes(q) ||
      String(item.ParentFullName || '').toLowerCase().includes(q) ||
      String(item.Relationship || '').toLowerCase().includes(q)
    )
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">StudentParent</h1>
        <button
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700"
          onClick={openAddModal}
        >
          + Add Relation
        </button>
      </div>

      <div className="mb-4 flex gap-3">
        <input
          type="text"
          placeholder="Search by student ID/name, parent ID/name, relationship..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
        />
      </div>

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
                  <th>Student ID</th>
                  <th>Registration Number</th>
                  <th>Student Name</th>
                  <th>Parent ID</th>
                  <th>Parent Name</th>
                  <th>Relationship</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRelations.length > 0 ? (
                  filteredRelations.map((item) => (
                    <tr key={`${item.StudentID}-${item.ParentID}`}>
                      <td>{item.StudentID}</td>
                      <td>{item.Registration_Number || '-'}</td>
                      <td>{`${item.StudentFirstName || ''} ${item.StudentLastName || ''}`.trim()}</td>
                      <td>{item.ParentID}</td>
                      <td>{item.ParentFullName || '-'}</td>
                      <td>{item.Relationship || '-'}</td>
                      <td className="space-x-2">
                        <button
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                          onClick={() => openEditModal(item)}
                        >
                          Edit
                        </button>
                        <button
                          className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700"
                          onClick={() => handleDelete(item.StudentID, item.ParentID)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-500">
                      No relations found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowModal(false)}>
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-semibold">{editingRelation ? 'Edit Relation' : 'Add Relation'}</h3>
              <button className="text-2xl text-slate-400 hover:text-slate-700" onClick={() => setShowModal(false)}>
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4 px-6 py-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Student</label>
                  <select
                    value={formData.StudentID}
                    onChange={(e) => setFormData({ ...formData, StudentID: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                    disabled={Boolean(editingRelation)}
                    required
                  >
                    <option value="">Select student</option>
                    {students.map((student) => (
                      <option key={student.StudentID} value={student.StudentID}>
                        {student.StudentID} - {student.Registration_Number || 'No Reg'} - {student.FirstName} {student.LastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Parent</label>
                  <select
                    value={formData.ParentID}
                    onChange={(e) => setFormData({ ...formData, ParentID: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                    disabled={Boolean(editingRelation)}
                    required
                  >
                    <option value="">Select parent</option>
                    {parents.map((parent) => (
                      <option key={parent.ParentID} value={parent.ParentID}>
                        {parent.ParentID} - {parent.FullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Relationship</label>
                  <input
                    type="text"
                    value={formData.Relationship}
                    onChange={(e) => setFormData({ ...formData, Relationship: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                    placeholder="e.g. Mother, Father, Guardian"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                <button
                  type="button"
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700"
                >
                  {editingRelation ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
