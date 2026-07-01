import React from 'react';
import { Bot, X, Send } from 'lucide-react';

export default function AiAssistant({
  showAi,
  setShowAi,
  aiHistory,
  aiLoading,
  chatEndRef,
  handleSendAiMessage,
  aiMessage,
  setAiMessage
}) {
  return (
    <>
      {/* Floating chatbot bubble trigger */}
      <div className="ai-trigger" onClick={() => setShowAi(!showAi)}>
        <Bot size={24} />
      </div>

      {/* Slideout Chat Panel */}
      {showAi && (
        <div className="ai-panel glass-card">
          <div className="ai-panel-header">
            <div className="ai-title">
              <Bot size={18} style={{ color: 'var(--primary)' }} />
              <span>Operations Assistant</span>
            </div>
            <button style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => setShowAi(false)}>
              <X size={18} />
            </button>
          </div>

          <div className="ai-messages">
            {aiHistory.map((h, i) => (
              <div key={i} className={`ai-msg ${h.role === 'user' ? 'ai-msg-user' : 'ai-msg-assistant'}`}>
                {h.content.split('\n').map((para, index) => {
                  if (para.startsWith('###')) return <h4 key={index} style={{ marginTop: '8px', marginBottom: '6px' }}>{para.replace('###', '')}</h4>;
                  if (para.startsWith('-')) return <li key={index} style={{ marginLeft: '12px', fontSize: '13px' }}>{para.replace('-', '')}</li>;
                  return <p key={index} style={{ marginBottom: '6px', fontSize: '13px' }}>{para}</p>;
                })}
              </div>
            ))}
            {aiLoading && (
              <div className="ai-msg ai-msg-assistant" style={{ fontStyle: 'italic' }}>
                Analyzing workforce records...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form className="ai-input-box" onSubmit={handleSendAiMessage}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Ask about leaves, salary, policies..." 
              value={aiMessage}
              onChange={(e) => setAiMessage(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '12px' }}>
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
