import { useContext, useEffect, useState } from 'react';
import { getLeadLogs } from '../services/logService';
import './LeadLogs.css'; // Import the CSS file
import { AuthContext } from '../contexts/AuthContext';

export default function LeadLogs() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');
  const { token } = useContext(AuthContext);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const response = await getLeadLogs(token);

        if (Array.isArray(response)) {
          setLogs(response);
        } else {
          throw new Error('Unexpected response format');
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch logs');
        setLogs([]);
      }
    }

    fetchLogs();
  }, []);

  return (
    <div className="lead-logs-container">
      <div className="lead-logs-card">
        <h2 className="lead-logs-title">Lead Logs</h2>
        {error && <div className="lead-logs-error">{error}</div>}
        <div className="lead-logs-table-wrapper">
          <table className="lead-logs-table">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Slack User ID</th>
                <th>Channel ID</th>
                <th>Event Type</th>
                <th>Text</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log._id}>
                    <td>{log._id}</td>
                    <td>{log.slackUserId}</td>
                    <td>{log.channelId}</td>
                    <td>{log.eventType}</td>
                    <td>{log.text}</td>
                    <td>{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="lead-logs-empty">
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
