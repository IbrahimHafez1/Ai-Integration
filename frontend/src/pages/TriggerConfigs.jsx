import React, { useEffect, useState, useContext } from 'react';
import {
  getTriggerConfigs,
  createTriggerConfig,
  updateTriggerConfig,
  deleteTriggerConfig,
} from '../services/triggerService';
import { AuthContext } from '../contexts/AuthContext';
import './TriggerConfigs.css';

export default function TriggerConfigs() {
  const { user, token } = useContext(AuthContext);
  const [configs, setConfigs] = useState([]);
  const [newChannel, setNewChannel] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editChannel, setEditChannel] = useState('');

  useEffect(() => {
    if (!user || !token) return;

    const fetchConfigs = async () => {
      try {
        const response = await getTriggerConfigs(token);
        if (!response.success) throw new Error(response.message || 'Failed to fetch');
        const formattedConfigs = response.data.map((cfg) => ({
          _id: cfg._id,
          userId: cfg.userId,
          channelId: cfg.settings?.channelId || 'No Channel',
          isActive: cfg.isActive,
          createdAt: cfg.createdAt,
        }));
        setConfigs(formattedConfigs);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchConfigs();
  }, [user, token]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    try {
      if (!newChannel.trim()) {
        setError('Channel ID is required');
        return;
      }

      const response = await createTriggerConfig({ channelId: newChannel.trim() }, token);

      if (!response.success) throw new Error(response.message);
      const newTrigger = response.data;

      setConfigs((prev) => [
        ...prev,
        {
          _id: newTrigger._id,
          userId: newTrigger.userId,
          channelId: newTrigger.settings?.channelId || 'No Channel',
          isActive: newTrigger.isActive,
          createdAt: newTrigger.createdAt,
        },
      ]);

      setNewChannel('');
      setSuccessMsg('Trigger created successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Open modal and preload channel ID to edit
  const openEditModal = (id, currentChannel) => {
    setEditId(id);
    setEditChannel(currentChannel);
    setIsEditOpen(true);
    setError('');
  };

  // Close modal and reset fields
  const closeEditModal = () => {
    setIsEditOpen(false);
    setEditId(null);
    setEditChannel('');
    setError('');
  };

  const handleUpdate = async () => {
    if (!editChannel.trim()) {
      setError('Channel ID cannot be empty');
      return;
    }
    try {
      const response = await updateTriggerConfig(
        editId,
        {
          settings: { channelId: editChannel.trim() },
          isActive: true,
        },
        token,
      );

      if (!response.success) throw new Error(response.message);

      setConfigs((prev) =>
        prev.map((cfg) => (cfg._id === editId ? { ...cfg, channelId: editChannel.trim() } : cfg)),
      );

      setSuccessMsg('Trigger updated successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
      closeEditModal();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this trigger?')) return;

    try {
      const response = await deleteTriggerConfig(id, token);
      if (!response.success) throw new Error(response.message);

      setConfigs((prev) => prev.filter((cfg) => cfg._id !== id));
      setSuccessMsg('Trigger deleted successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="trigger-container">
      <div className="trigger-card">
        <h2 className="trigger-heading">Your Trigger Configs</h2>

        {error && <div className="alert error">{error}</div>}
        {successMsg && <div className="alert success">{successMsg}</div>}

        <form onSubmit={handleCreate} className="trigger-form">
          <input
            type="text"
            placeholder="Channel ID"
            value={newChannel}
            onChange={(e) => setNewChannel(e.target.value)}
            required
            className="trigger-input"
          />
          <button type="submit" className="trigger-btn">
            Create Trigger
          </button>
        </form>

        <div className="trigger-table-wrapper">
          <table className="trigger-table">
            <thead>
              <tr>
                <th>Trigger ID</th>
                <th>User ID</th>
                <th>Channel ID</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {configs.length > 0 ? (
                configs.map((cfg) => (
                  <tr key={cfg._id}>
                    <td>{cfg._id}</td>
                    <td>{cfg.userId}</td>
                    <td>{cfg.channelId}</td>
                    <td>
                      <button
                        className="btn edit"
                        onClick={() => openEditModal(cfg._id, cfg.channelId)}
                      >
                        Edit
                      </button>
                      <button className="btn delete" onClick={() => handleDelete(cfg._id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="no-configs">
                    No triggers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditOpen && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="editModalTitle"
          >
            <h3 id="editModalTitle">Edit Channel ID</h3>
            {error && <div className="alert error">{error}</div>}
            <input
              type="text"
              value={editChannel}
              onChange={(e) => setEditChannel(e.target.value)}
              className="trigger-input"
              aria-label="Channel ID"
              autoFocus
            />
            <div className="modal-buttons">
              <button onClick={handleUpdate} className="trigger-btn">
                Save
              </button>
              <button onClick={closeEditModal} className="btn cancel">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
