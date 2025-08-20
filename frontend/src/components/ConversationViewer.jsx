import React, { useState, useEffect } from 'react';
import './ConversationViewer.css';

const ConversationViewer = ({ sessionId, onClose }) => {
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchConversationDetails();
  }, [sessionId]);

  const fetchConversationDetails = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/leads/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch conversation details');
      }

      const data = await response.json();
      setConversation(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#ff4444';
      case 'high': return '#ff8800';
      case 'medium': return '#ffaa00';
      case 'low': return '#00aa00';
      default: return '#666666';
    }
  };

  if (loading) {
    return (
      <div className="conversation-viewer-overlay">
        <div className="conversation-viewer">
          <div className="loading">Loading conversation details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="conversation-viewer-overlay">
        <div className="conversation-viewer">
          <div className="error">Error: {error}</div>
          <button onClick={onClose} className="close-btn">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="conversation-viewer-overlay">
      <div className="conversation-viewer">
        <div className="conversation-header">
          <h2>Conversation Details</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="conversation-content">
          {/* Lead Information */}
          <div className="lead-info-section">
            <h3>Lead Information</h3>
            <div className="lead-info-grid">
              <div className="info-item">
                <label>Name:</label>
                <span>{conversation.user_data?.user_name || 'Not provided'}</span>
              </div>
              <div className="info-item">
                <label>Email:</label>
                <span>{conversation.user_data?.user_email || 'Not provided'}</span>
              </div>
              <div className="info-item">
                <label>Phone:</label>
                <span>{conversation.user_data?.user_phone_number || 'Not provided'}</span>
              </div>
              <div className="info-item">
                <label>Intent:</label>
                <span className={`intent-badge ${conversation.user_data?.user_buying_or_selling}`}>
                  {conversation.user_data?.user_buying_or_selling || 'Unknown'}
                </span>
              </div>
              <div className="info-item">
                <label>Property Type:</label>
                <span>{conversation.user_data?.user_property_type || 'Not specified'}</span>
              </div>
              <div className="info-item">
                <label>Timeline:</label>
                <span>{conversation.user_data?.user_timeline || 'Not specified'}</span>
              </div>
            </div>
          </div>

          {/* Conversation Metrics */}
          <div className="metrics-section">
            <h3>Conversation Metrics</h3>
            <div className="metrics-grid">
              <div className="metric-item">
                <label>Total Messages:</label>
                <span>{conversation.conversation_metrics?.total_messages || 0}</span>
              </div>
              <div className="metric-item">
                <label>Completion:</label>
                <span>{Math.round(conversation.conversation_metrics?.completeness_percentage || 0)}%</span>
              </div>
              <div className="metric-item">
                <label>Engagement Score:</label>
                <span>{conversation.conversation_metrics?.engagement_score || 0}</span>
              </div>
              <div className="metric-item">
                <label>Status:</label>
                <span className={`status-badge ${conversation.conversation_complete ? 'complete' : 'incomplete'}`}>
                  {conversation.conversation_complete ? 'Complete' : 'In Progress'}
                </span>
              </div>
            </div>
          </div>

          {/* Recommended Actions */}
          {conversation.recommended_actions && conversation.recommended_actions.length > 0 && (
            <div className="actions-section">
              <h3>Recommended Actions</h3>
              <div className="actions-list">
                {conversation.recommended_actions.map((action, index) => (
                  <div key={index} className="action-item">
                    <div className="action-header">
                      <span 
                        className="priority-indicator" 
                        style={{ backgroundColor: getPriorityColor(action.priority) }}
                      ></span>
                      <h4>{action.title}</h4>
                      <span className="due-date">{action.due_date}</span>
                    </div>
                    <p>{action.description}</p>
                    {action.contact_info && (
                      <div className="contact-info">
                        <span>📧 {action.contact_info.email}</span>
                        <span>📞 {action.contact_info.phone}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conversation History */}
          <div className="conversation-history-section">
            <h3>Conversation History</h3>
            <div className="conversation-messages">
              {conversation.conversation_history?.map((message, index) => (
                <div key={index} className={`message ${message.role}`}>
                  <div className="message-header">
                    <span className="role">{message.role === 'user' ? '👤 User' : '🤖 AIREA'}</span>
                    <span className="timestamp">{formatTimestamp(message.timestamp)}</span>
                  </div>
                  <div className="message-content">
                    {message.message}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationViewer;
