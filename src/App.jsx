import { useState, useEffect } from 'react'
import './App.css'

// Períodos de SLA por Prioridade
const SLA_DURATIONS = {
  'Urgente': 2 * 60 * 60 * 1000,
  'Alta': 2 * 60 * 60 * 1000,
  'Média': 8 * 60 * 60 * 1000,
  'Baixa': 24 * 60 * 60 * 1000
}

const CATEGORY_ICONS = {
  'Hardware': '💻',
  'Software': '💿',
  'Rede': '🌐'
}

const USERS = [
  { id: 'admin', username: 'admin', password: '123', name: 'Administrador', role: 'Admin' },
  { id: 'tech', username: 'tech', password: '123', name: 'Ricardo Técnico', role: 'Técnico' },
  { id: 'user', username: 'user', password: '123', name: 'Guilherme Solicitante', role: 'Solicitante' }
]

const formatTime = (ms) => {
  if (ms <= 0) return "SLA ESTOURADO"
  const seconds = Math.floor((ms / 1000) % 60)
  const minutes = Math.floor((ms / (1000 * 60)) % 60)
  const hours = Math.floor(ms / (1000 * 60 * 60))
  return `${hours}h ${minutes}m ${seconds}s`
}

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`toast ${type}`}>
      <div className="toast-icon">
        {type === 'success' ? '✅' : type === 'warning' ? '⚠️' : '📩'}
      </div>
      <div className="toast-content">
        <p>{message}</p>
      </div>
      <button className="toast-close" onClick={onClose}>&times;</button>
    </div>
  )
}

function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const user = USERS.find(u => u.username === username && u.password === password)
    if (user) onLogin(user)
    else setError('Usuário ou senha inválidos.')
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-orb">🛠️</div>
          <h1>Service Desk <span className="pro">PRO</span></h1>
          <p>Login seguro</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group"><label>Usuário</label><input type="text" value={username} onChange={e => setUsername(e.target.value)} required /></div>
          <div className="form-group"><label>Senha</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></div>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="login-btn">Entrar</button>
        </form>
      </div>
    </div>
  )
}

function TicketInteractionModal({ ticket, onClose, onAddComment, currentUser }) {
  const [newComment, setNewComment] = useState('')
  const handleSubmit = (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    onAddComment(ticket.id, { id: Date.now(), author: currentUser.name, role: currentUser.role, text: newComment, timestamp: new Date().toISOString() })
    setNewComment('')
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-info">
            <span className="modal-cat">{CATEGORY_ICONS[ticket.category]} {ticket.category}</span>
            <h3>#T-00{ticket.id}: {ticket.title}</h3>
          </div>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="timeline">
            {ticket.interactions.map(item => (
              <div key={item.id} className="timeline-item">
                <div className="timeline-dot"></div>
                <div className="timeline-card">
                  <div className="timeline-meta"><span className="author">{item.author} ({item.role})</span><span className="time">{new Date(item.timestamp).toLocaleString()}</span></div>
                  <p className="text">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="modal-footer">
          <form className="comment-form" onSubmit={handleSubmit}>
            <textarea placeholder="Responder..." value={newComment} onChange={e => setNewComment(e.target.value)} />
            <div className="form-footer"><button type="submit" className="btn-primary">Enviar</button></div>
          </form>
        </div>
      </div>
    </div>
  )
}

function TicketCard({ ticket, onOpen }) {
  const [timeLeft, setTimeLeft] = useState(0)
  const [isBreached, setIsBreached] = useState(false)

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime()
      const deadline = new Date(ticket.createdAt).getTime() + (SLA_DURATIONS[ticket.priority] || 0)
      const difference = deadline - now
      setTimeLeft(difference)
      setIsBreached(difference <= 0)
    }
    calculateTime()
    const timer = setInterval(calculateTime, 1000)
    return () => clearInterval(timer)
  }, [ticket])

  return (
    <div className={`ticket-card ${isBreached && ticket.status !== 'Concluído' ? 'breached' : ''}`} onClick={() => onOpen(ticket)}>
      <div className="ticket-header">
        <span className="category-label">{CATEGORY_ICONS[ticket.category]} {ticket.category}</span>
        <span className="priority-tag"><span className={`priority-text ${ticket.priority.toLowerCase()}`}>{ticket.priority}</span></span>
      </div>
      <h4>{ticket.title}</h4>
      <div className="tags-container">{ticket.tags.map((tag, idx) => (<span key={idx} className="tag">#{tag}</span>))}</div>
      {ticket.status !== 'Concluído' && (
        <div className={`sla-timer ${isBreached ? 'urgent' : ''}`}>
          <span className="sla-value">{formatTime(timeLeft)}</span>
          <div className="sla-progress-bar"><div className={`sla-progress-fill ${isBreached ? 'full' : ''}`} style={{ width: isBreached ? '100%' : `${Math.max(0, (timeLeft / (SLA_DURATIONS[ticket.priority] || 1)) * 100)}%` }}></div></div>
        </div>
      )}
      <div className="ticket-assignment"><span className="assignee-name">👤 {ticket.assignedTo}</span></div>
      <div className="ticket-footer"><span className={`status-pill ${ticket.status.toLowerCase().replace(' ', '-')}`}>{ticket.status}</span><span className="interactions-count">💬 {ticket.interactions.length}</span></div>
    </div>
  )
}

function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [toasts, setToasts] = useState([])
  const [tickets, setTickets] = useState([
    { 
      id: 1, title: 'Erro de Login ERP', status: 'Aberto', priority: 'Urgente', category: 'Software',
      tags: ['Sistemas'], assignedTo: 'Ricardo Técnico', createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      interactions: [{ id: 101, author: 'Guilherme Solicitante', role: 'Solicitante', text: 'Tela branca ao abrir.', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() }]
    },
    { 
      id: 2, title: 'Monitor piscando', status: 'Em Andamento', priority: 'Média', category: 'Hardware',
      tags: ['Manutenção'], assignedTo: 'Ricardo Técnico', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      interactions: [{ id: 102, author: 'Financeiro', role: 'Solicitante', text: 'O PC está piscando.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() }]
    },
    { 
      id: 4, title: 'VPN Lenta', status: 'Aberto', priority: 'Urgente', category: 'Rede',
      tags: ['Sinal'], assignedTo: 'Não atribuído', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
      interactions: [{ id: 104, author: 'Comercial', role: 'Solicitante', text: 'Lentidão absurda.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString() }]
    },
  ])

  const notify = (message, type = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
  }

  // Monitorar SLA próximo de estourar
  useEffect(() => {
    if (!currentUser) return
    const checkSLA = () => {
      tickets.forEach(ticket => {
        if (ticket.status !== 'Concluído') {
          const deadline = new Date(ticket.createdAt).getTime() + (SLA_DURATIONS[ticket.priority] || 0)
          const timeLeft = deadline - new Date().getTime()
          // Avisar se faltar 15 min ou menos
          if (timeLeft > 0 && timeLeft < 15 * 60 * 1000 && !ticket.slaNotified) {
            notify(`Atenção: SLA do chamado #T-00${ticket.id} está próximo de estourar!`, 'warning')
            ticket.slaNotified = true // Flag temporária para não repetir
          }
        }
      })
    }
    const interval = setInterval(checkSLA, 30000)
    return () => clearInterval(interval)
  }, [tickets, currentUser])

  const addComment = (ticketId, comment) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, interactions: [...t.interactions, comment] } : t))
    if (selectedTicket && selectedTicket.id === ticketId) setSelectedTicket(prev => ({ ...prev, interactions: [...prev.interactions, comment] }))
    notify(`Nova atualização no chamado #T-00${ticketId}`, 'info')
  }

  const createTicket = () => {
    const newT = {
      id: tickets.length + 1,
      title: 'Novo pedido de suporte extra',
      status: 'Aberto',
      priority: 'Média',
      category: 'Software',
      tags: ['Instalação'],
      assignedTo: 'Não atribuído',
      createdAt: new Date().toISOString(),
      interactions: [{ id: Date.now(), author: currentUser.name, role: currentUser.role, text: 'Preciso de ajuda urgente.', timestamp: new Date().toISOString() }]
    }
    setTickets([newT, ...tickets])
    notify('Um novo chamado foi aberto no seu setor!', 'success')
  }

  if (!currentUser) return <Login onLogin={setCurrentUser} />

  const stats = (() => {
    const completed = tickets.filter(t => t.status === 'Concluído')
    const totalFinishedOrCurrent = tickets.length
    const breached = tickets.filter(t => {
      const deadline = new Date(t.createdAt).getTime() + (SLA_DURATIONS[t.priority] || 0)
      return (t.status === 'Concluído' ? new Date(t.completedAt).getTime() : new Date().getTime()) > deadline
    }).length
    return { 
      mttr: completed.length > 0 ? (completed.reduce((s, t) => s + (new Date(t.completedAt) - new Date(t.createdAt)), 0) / completed.length / 3600000).toFixed(1) : '0',
      slaRate: totalFinishedOrCurrent > 0 ? (((totalFinishedOrCurrent - breached) / totalFinishedOrCurrent) * 100).toFixed(0) : '100'
    }
  })()

  return (
    <div className="layout">
      <div className="toast-container">
        {toasts.map(toast => (
          <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} />
        ))}
      </div>
      
      {selectedTicket && <TicketInteractionModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} onAddComment={addComment} currentUser={currentUser} />}
      
      <header className="header">
        <div className="logo"><h1>Service Desk <span className="pro">PRO</span></h1></div>
        <div className="header-right">
          <button className="logout-btn" onClick={() => setCurrentUser(null)}>Sair</button>
          <div className="user-profile"><div className="avatar">GS</div><div className="user-info"><span>{currentUser.name}</span></div></div>
        </div>
      </header>

      <main className="main-content">
        <section className="title-bar">
          <div className="title-text"><h2>Gestão Operacional</h2><p className="subtitle">Relatórios e alertas em tempo real.</p></div>
          <button className="btn-primary" onClick={createTicket}>+ Novo Chamado</button>
        </section>

        <section className="metrics-grid">
          <div className="metric-card"><span className="metric-icon">⏱️</span><div className="metric-info"><span className="metric-label">MTTR Médio</span><span className="metric-value">{stats.mttr}h</span></div></div>
          <div className="metric-card"><span className="metric-icon">📊</span><div className="metric-info"><span className="metric-label">SLA Cumprido</span><span className={`metric-value ${stats.slaRate < 80 ? 'warning' : 'success'}`}>{stats.slaRate}%</span></div></div>
        </section>

        <div className="ticket-list-header"><h3>Fila de Chamados Ativos</h3></div>
        <div className="ticket-grid">{tickets.map(ticket => (<TicketCard key={ticket.id} ticket={ticket} onOpen={setSelectedTicket} />))}</div>
      </main>
    </div>
  )
}

export default App
