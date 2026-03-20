import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

export default function SchoolFees() {
  const role = sessionStorage.getItem('role') || '';
  const canImportClasses = role !== 'admin';
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [totalFees, setTotalFees] = useState(0);
  const [studentPayments, setStudentPayments] = useState([]);
  const [motherSearch, setMotherSearch] = useState('');
  // Parent earnings (fees) integration
  const [parentFees, setParentFees] = useState([]);
  const [parentFeesLoading, setParentFeesLoading] = useState(true);
  const [parentFeesError, setParentFeesError] = useState('');
  // Fix: Add importing state for Excel import
  const [importing, setImporting] = useState(false);

  // Add state for student-parent relations
  const [relations, setRelations] = useState([]);
  const [relationsLoading, setRelationsLoading] = useState(true);
  const [relationsError, setRelationsError] = useState('');

  // Fetch parent earnings (fees)
  const fetchParentFees = async () => {
    setParentFeesLoading(true);
    setParentFeesError('');
    try {
      const response = await fetch('http://localhost:3004/api/parent-earnings/summary');
      if (!response.ok) throw new Error('Failed to fetch parent earnings');
      const data = await response.json();
      // Only keep parents with non-zero fees
      setParentFees((Array.isArray(data) ? data : []).filter(p => Number(p.total_fees) > 0));
    } catch (err) {
      setParentFeesError(err.message);
    } finally {
      setParentFeesLoading(false);
    }
  };

  // Fetch families
  const fetchFamilies = async () => {
    try {
      const response = await fetch('http://localhost:3004/api/school-fees/families');
      if (!response.ok) throw new Error('Failed to fetch families');
      const data = await response.json();
      setFamilies(data.families || []);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Fetch student-parent relations
  const fetchRelations = async () => {
    setRelationsLoading(true);
    setRelationsError('');
    try {
      const response = await fetch('http://localhost:3004/api/relations');
      if (!response.ok) throw new Error('Failed to fetch student-parent relations');
      const data = await response.json();
      setRelations(Array.isArray(data) ? data : []);
    } catch (err) {
      setRelationsError(err.message);
    } finally {
      setRelationsLoading(false);
    }
  };

  // Merge parent earnings fees into families
  useEffect(() => {
    const fetchAll = async () => {
      await fetchFamilies();
      await fetchParentFees();
      await fetchRelations(); // fetch student-parent relations
    };
    fetchAll();
    // eslint-disable-next-line
  }, []);

  const viewStudentPayments = async (student) => {
    setSelectedStudent(student);
    await fetchStudentPayments(student.StudentID);
  };

  const fetchStudentPayments = async (studentId) => {
    try {
      let url = `http://localhost:3004/api/school-fees/student/${studentId}`;
      if (dateRange.start && dateRange.end) {
        url += `?startDate=${dateRange.start}&endDate=${dateRange.end}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      setStudentPayments(data.fees || []);
      setTotalFees(data.totals?.total_paid || data.totals?.total_fees || 0);
    } catch (err) {
      console.error('Error fetching payments:', err);
    }
  };

  const handleRangeFilter = () => {
    if (selectedStudent) {
      fetchStudentPayments(selectedStudent.StudentID);
    }
  };

  const handleExcelImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:3004/api/fees/import-classes', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();

      if (response.ok) {
        alert(`Successfully updated ${data.updated} student classes!`);
        fetchStudents();
      } else {
        alert('Error importing file: ' + data.error);
      }
    } catch (err) {
      alert('Error importing file: ' + err.message);
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  // Merge parent earnings fees into families for display
  const familiesWithEarnings = families.map(fam => {
    // Find parent earnings for father and mother
    const fatherEarnings = parentFees.find(p => String(p.ParentID) === String(fam.father_id));
    const motherEarnings = parentFees.find(p => String(p.ParentID) === String(fam.mother_id));
    const father_earnings_fee = fatherEarnings ? Number(fatherEarnings.total_fees) : 0;
    const mother_earnings_fee = motherEarnings ? Number(motherEarnings.total_fees) : 0;
    return {
      ...fam,
      father_earnings_fee,
      mother_earnings_fee,
      total_earnings_fee: father_earnings_fee + mother_earnings_fee
    };
  });

  // Group relations by StudentID and build FamilyID for the table
  const groupedRelations = Object.values(relations.reduce((acc, rel) => {
    if (!acc[rel.StudentID]) {
      acc[rel.StudentID] = {
        StudentID: rel.StudentID,
        Registration_Number: rel.Registration_Number,
        StudentName: `${rel.StudentFirstName} ${rel.StudentLastName}`,
        FatherID: '',
        FatherName: '',
        MotherID: '',
        MotherName: '',
      };
    }
    if (rel.Relationship === 'Father') {
      acc[rel.StudentID].FatherID = rel.ParentID;
      acc[rel.StudentID].FatherName = rel.ParentFullName;
    } else if (rel.Relationship === 'Mother') {
      acc[rel.StudentID].MotherID = rel.ParentID;
      acc[rel.StudentID].MotherName = rel.ParentFullName;
    }
    return acc;
  }, {}));

  // Add fatherFees and motherFees to groupedRelations
  const groupedRelationsWithFees = groupedRelations.map(rel => {
    const father = parentFees.find(p => String(p.ParentID) === String(rel.FatherID));
    const mother = parentFees.find(p => String(p.ParentID) === String(rel.MotherID));
    return {
      ...rel,
      FatherFees: father ? Number(father.total_fees) : 0,
      MotherFees: mother ? Number(mother.total_fees) : 0,
    };
  });

  // Add combined children for each family (father+mother) to groupedRelationsWithFees, including class
  const groupedRelationsWithChildren = groupedRelationsWithFees.map(rel => {
    // Find all students with the same father and mother
    const combinedStudents = groupedRelationsWithFees
      .filter(r => r.FatherID === rel.FatherID && r.MotherID === rel.MotherID)
      .map(r => `${r.StudentName} (${r.StudentClass || ''})`)
      .join(', ');
    return {
      ...rel,
      CombinedChildren: combinedStudents
    };
  });

  // Filtered data for search by parent name or ID
  const filteredRelations = groupedRelationsWithChildren.filter(rel => {
    if (!motherSearch) return true;
    const search = motherSearch.toLowerCase();
    return (
      (rel.FatherName && rel.FatherName.toLowerCase().includes(search)) ||
      (rel.MotherName && rel.MotherName.toLowerCase().includes(search)) ||
      (rel.FatherID && String(rel.FatherID).includes(search)) ||
      (rel.MotherID && String(rel.MotherID).includes(search))
    );
  });

  // Export Student-Parent Relations to Excel
  const exportToExcel = () => {
    const data = groupedRelationsWithChildren.map(rel => ({
      FamilyID: rel.FatherID && rel.MotherID ? `${rel.FatherID}_${rel.MotherID}` : rel.FatherID || rel.MotherID,
      StudentID: rel.StudentID,
      RegistrationNumber: rel.Registration_Number,
      StudentName: rel.StudentName,
      FatherID: rel.FatherID,
      FatherName: rel.FatherName,
      MotherID: rel.MotherID,
      MotherName: rel.MotherName,
      FatherFees: rel.FatherFees,
      MotherFees: rel.MotherFees,
      CombinedChildren: rel.CombinedChildren
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'StudentParentRelations');
    XLSX.writeFile(wb, 'StudentParentRelations.xlsx');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">School Fees Management</h1>
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
        <h2 className="mb-4 text-lg font-semibold">Student-Parent Relations</h2>
        <div className="flex items-center mb-4 gap-3">
          <input
            type="text"
            placeholder="Search by parent name or ID"
            value={motherSearch}
            onChange={e => setMotherSearch(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />
        </div>
        <button
          onClick={exportToExcel}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 ml-4"
        >
          Export to Excel
        </button>
        {relationsLoading ? (
          <div className="text-slate-500">Loading relations...</div>
        ) : relationsError ? (
          <div className="text-red-600">{relationsError}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th>FamilyID</th>
                  <th>Student ID</th>
                  <th>Registration Number</th>
                  <th>Student Name</th>
                  <th>Father ID</th>
                  <th>Father Name</th>
                  <th>Mother ID</th>
                  <th>Mother Name</th>
                  <th>Father Fees</th>
                  <th>Mother Fees</th>
                  <th>Combined Children</th>
                </tr>
              </thead>
              <tbody>
                {filteredRelations.map(rel => (
                  <tr key={rel.StudentID}>
                    <td>{rel.FatherID && rel.MotherID ? `${rel.FatherID}_${rel.MotherID}` : rel.FatherID || rel.MotherID}</td>
                    <td>{rel.StudentID}</td>
                    <td>{rel.Registration_Number}</td>
                    <td>{rel.StudentName}</td>
                    <td>{rel.FatherID}</td>
                    <td>{rel.FatherName}</td>
                    <td>{rel.MotherID}</td>
                    <td>{rel.MotherName}</td>
                    <td>{rel.FatherFees.toLocaleString()} RWF</td>
                    <td>{rel.MotherFees.toLocaleString()} RWF</td>
                    <td>{rel.CombinedChildren}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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

