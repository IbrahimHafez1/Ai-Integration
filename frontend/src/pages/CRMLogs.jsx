import { useContext, useEffect, useState } from 'react';
import { getCRMLogs } from '../services/logService';
import './crmLogs.css';
import { AuthContext } from '../contexts/AuthContext';

export default function CRMLogs() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');
  const { token } = useContext(AuthContext);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const response = await getCRMLogs(token);

        // Check if response is a valid array
        if (Array.isArray(response)) {
          setLogs(response);
        } else {
          throw new Error('Unexpected response format');
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch CRM logs');
        setLogs([]);
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
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log._id}>
                    <td>{log._id}</td>
                    <td>{log.leadLogId}</td>
                    <td>{log.status}</td>
                    <td>{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
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
