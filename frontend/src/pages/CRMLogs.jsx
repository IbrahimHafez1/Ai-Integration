import { useEffect, useState } from 'react';
import { getCRMLogs } from '../services/logService';
import './crmLogs.css'; // Import the new CSS file

export default function CRMLogs() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchLogs() {
      try {
        const data = await getCRMLogs();
        setLogs(data);
      } catch (err) {
        setError(err.message);
      }
    }
    fetchLogs();
  }, []);

  return (
    <div className="crm-logs-container">
      <div className="crm-logs-card">
        <h2 className="crm-logs-title">CRM Logs</h2>
        {error && <div className="crm-logs-error">{error}</div>}
        <div className="crm-logs-table-wrapper">
          <table className="crm-logs-table">
            <thead>
              <tr>
                <th>CRMLog ID</th>
                <th>LeadLog ID</th>
                <th>Status</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id}>
                  <td>{log._id}</td>
                  <td>{log.leadLogId}</td>
                  <td>{log.status}</td>
                  <td>{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan="4" className="crm-logs-empty">
                    No logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
