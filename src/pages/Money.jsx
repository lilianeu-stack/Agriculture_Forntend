import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

export default function Money() {
    // Export to Excel
    const handleExportExcel = () => {
      if (!earnings.length) return;
      const exportData = earnings.map(row => ({
        ParentID: row.ParentID,
        'Full Name': row.FullName,
        'Phone Number': row.PhoneNumber,
        Shifts: row.shifts_completed || 0,
        'Total Money': Number(row.total_money) || 0,
        'Total Fees': Number(row.total_fees) || 0,
        'Total Earnings': Number(row.total_earnings) || (Number(row.total_money) + Number(row.total_fees))
      }));
      import('xlsx').then(XLSX => {
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Earnings');
        XLSX.writeFile(wb, `Parent_MoneyFees_Earnings_${startDate}_to_${endDate}.xlsx`);
      });
    };
  const [earnings, setEarnings] = useState([]);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('2025-10-01');
  const [endDate, setEndDate] = useState('2025-10-31');
  const [loading, setLoading] = useState(true);



  useEffect(() => {
    fetchEarnings();
    // eslint-disable-next-line
  }, [search, startDate, endDate]);

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ startDate, endDate });
      if (search.trim()) {
        params.append('search', search.trim());
      }
      const response = await fetch(`http://localhost:3004/api/parent-earnings/summary?${params.toString()}`);
      const data = await response.json();
      setEarnings(Array.isArray(data) ? data : []);
    } catch (err) {
      setEarnings([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate range in days
  const getRangeLabel = () => {
    if (!startDate || !endDate) return '';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.abs(end - start);
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
    if (days === 1) return '1 day';
    if (days < 30) return `${days} days`;
    if (days < 365) return `${Math.floor(days / 30)} months`;
    return `${Math.floor(days / 365)} years`;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Parent MoneyFees Earnings</h1>
      <div className="flex flex-wrap gap-3 mb-4">
        <button
          onClick={handleExportExcel}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700"
          disabled={loading || !earnings.length}
        >
          Generate Report (Excel)
        </button>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by parent name or ID"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
        />
        <input
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <span className="inline-block px-3 py-2 text-sm text-slate-600">Range: {getRangeLabel()}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th>ParentID</th>
              <th>Full Name</th>
              <th>Phone Number</th>
              <th>Shifts</th>
              <th>Total Money</th>
              <th>Total Fees</th>
              <th>Total Earnings</th>
              <th>Start Date</th>
              <th>End Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="py-8 text-center text-slate-500">Loading...</td></tr>
            ) : earnings.length > 0 ? (
              earnings.map(row => {
                const totalMoney = Number(row.total_money) || 0;
                const totalFees = Number(row.total_fees) || 0;
                const totalEarnings = Number(row.total_earnings) || (totalMoney + totalFees);
                return (
                  <tr key={row.ParentID}>
                    <td>{row.ParentID}</td>
                    <td>{row.FullName}</td>
                    <td>{row.PhoneNumber || '-'}</td>
                    <td>{row.shifts_completed || 0}</td>
                    <td>{totalMoney.toLocaleString()} RWF</td>
                    <td>{totalFees.toLocaleString()} RWF</td>
                    <td>{totalEarnings.toLocaleString()} RWF</td>
                    <td>{startDate}</td>
                    <td>{endDate}</td>
                  </tr>
                );
              })
            ) : (
              <tr><td colSpan={9} className="py-8 text-center text-slate-500">No data found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
