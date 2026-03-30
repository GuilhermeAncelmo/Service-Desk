import { useState, useEffect } from 'react'
import './App.css'

const API_BASE = 'http://localhost:3001/api'

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
      <div className="toast-icon">{type === 'success' ? '✅' : type === 'warning' ? '⚠️' : '📩'}</div>
      <div className="toast-content"><p>{message}</p></div>
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
          <p>Portal Corporativo</p>
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
  const [timeline, setTimeline] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const res = await fetch(`${API_BASE}/tickets/${ticket.id}/interactions`)
        const data = await res.json()
        setTimeline(data)
      } catch (err) { console.error('Erro na timeline:', err) }
      finally { setLoading(false) }
    }
    fetchTimeline()
  }, [ticket.id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    const interaction = { author: currentUser.name, role: currentUser.role, text: newComment }
    const res = await fetch(`${API_BASE}/tickets/${ticket.id}/interactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(interaction)
    })
    const saved = await res.json()
    setTimeline([...timeline, {...saved, timestamp: new Date().toISOString()}])
    onAddComment(ticket.id)
    setNewComment('')
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-info"><span className="modal-cat">{CATEGORY_ICONS[ticket.category]} {ticket.category}</span><h3>#T-00{ticket.id}: {ticket.title}</h3></div>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {loading ? <p>Carregando histórico...</p> : (
            <div className="timeline">
              {timeline.map(item => (
                <div key={item.id} className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-card">
                    <div className="timeline-meta"><span className="author">{item.author} ({item.role})</span><span className="time">{new Date(item.timestamp).toLocaleString()}</span></div>
                    <p className="text">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
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
      <div className="ticket-footer"><span className={`status-pill ${ticket.status.toLowerCase().replace(' ', '-')}`}>{ticket.status}</span></div>
    </div>
  )
}

function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [toasts, setToasts] = useState([])
  const [filters, setFilters] = useState({ status: 'Todos', priority: 'Todas', tech: 'Todos', date: 'Tudo' })
  const [tickets, setTickets] = useState([])
  
  const fetchTickets = async () => {
    try {
      const res = await fetch(`${API_BASE}/tickets`)
      const data = await res.json()
      setTickets(data)
    } catch (err) { console.error('Erro tickets:', err) }
  }

  useEffect(() => { if (currentUser) fetchTickets() }, [currentUser])

  const notify = (m, t = 'info') => setToasts(prev => [...prev, { id: Date.now() + Math.random(), message: m, type: t }])

  const filteredTickets = tickets.filter(t => {
    const sMatch = filters.status === 'Todos' || t.status === filters.status
    const pMatch = filters.priority === 'Todas' || t.priority === filters.priority
    const tMatch = filters.tech === 'Todos' || t.assignedTo === filters.tech
    const dMatch = filters.date === 'Hoje' ? new Date(t.createdAt).toDateString() === new Date().toDateString() : filters.date === 'Semana' ? new Date(t.createdAt) >= new Date(Date.now() - 7 * 86400000) : true
    return sMatch && pMatch && tMatch && dMatch
  })

  const stats = (() => {
    const closed = tickets.filter(t => t.status === 'Concluído' && t.completedAt)
    const breached = tickets.filter(t => {
      const deadline = new Date(t.createdAt).getTime() + (SLA_DURATIONS[t.priority] || 0)
      const finishTime = t.completedAt ? new Date(t.completedAt).getTime() : new Date().getTime()
      return finishTime > deadline
    }).length
    return {
      mttr: closed.length > 0 ? (closed.reduce((s, t) => s + (new Date(t.completedAt) - new Date(t.createdAt)), 0) / closed.length / 3600000).toFixed(1) : '12.4',
      slaRate: tickets.length > 0 ? (((tickets.length - breached) / tickets.length) * 100).toFixed(0) : '100'
    }
  })()

  const createTicket = async () => {
    const newT = { title: 'Novo Chamado de Teste', priority: 'Média', category: 'Software', tags: ['Geral'], assignedTo: 'Ricardo Técnico' }
    const res = await fetch(`${API_BASE}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newT)
    })
    if (res.ok) {
      notify('Novo chamado criado via Persistence API', 'success')
      fetchTickets()
    }
  }

  const handleInteractionAdded = (tId) => {
    notify(`Nova atualização no #T-00${tId}`, 'info')
    // No need to fetch all tickets unless we want to update the interaction count (if we had one)
  }

  if (!currentUser) return <Login onLogin={setCurrentUser} />

  return (
    <div className="layout">
      <div className="toast-container">{toasts.map(t => <Toast key={t.id} message={t.message} type={t.type} onClose={() => setToasts(p => p.filter(x => x.id !== t.id))} />)}</div>
      {selectedTicket && <TicketInteractionModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} onAddComment={handleInteractionAdded} currentUser={currentUser} />}
      <header className="header">
        <div className="logo"><h1>Service Desk <span className="pro">PRO</span></h1></div>
        <div className="header-right"><button className="logout-btn" onClick={() => setCurrentUser(null)}>Sair</button><div className="avatar">GS</div><div className="user-info"><span>{currentUser.name}</span></div></div>
      </header>

      <main className="main-content">
        <section className="title-bar">
          <div className="title-text"><h2>Gestão de Performance</h2><p className="subtitle">Visão Persistente em SQLite.</p></div>
          <button className="btn-primary" onClick={createTicket}>+ Novo Chamado</button>
        </section>

        <section className="metrics-grid">
          <div className="metric-card"><span className="metric-icon">⏱️</span><div className="metric-info"><span className="metric-label">MTTR Médio</span><span className="metric-value">{stats.mttr}h</span></div></div>
          <div className="metric-card"><span className="metric-icon">📊</span><div className="metric-info"><span className="metric-label">SLA Cumprido</span><span className={`metric-value ${stats.slaRate < 80 ? 'warning' : 'success'}`}>{stats.slaRate}%</span></div></div>
          <div className="metric-card"><span className="metric-icon">📂</span><div className="metric-info"><span className="metric-label">Chamados Ativos</span><span className="metric-value">{tickets.filter(t => t.status !== 'Concluído').length}</span></div></div>
        </section>

        <section className="filter-bar">
          <div className="filter-group"><label>Status</label><select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}><option>Todos</option><option>Aberto</option><option>Em Andamento</option><option>Concluído</option></select></div>
          <div className="filter-group"><label>Prioridade</label><select value={filters.priority} onChange={e => setFilters({...filters, priority: e.target.value})}><option>Todas</option><option>Urgente</option><option>Alta</option><option>Média</option><option>Baixa</option></select></div>
          <div className="filter-group"><label>Técnico</label><select value={filters.tech} onChange={e => setFilters({...filters, tech: e.target.value})}><option>Todos</option><option>Ricardo Técnico</option><option>Não atribuído</option></select></div>
          <div className="filter-group"><label>Período</label><select value={filters.date} onChange={e => setFilters({...filters, date: e.target.value})}><option>Tudo</option><option>Hoje</option><option>Semana</option></select></div>
          <button className="btn-reset" onClick={() => setFilters({ status: 'Todos', priority: 'Todas', tech: 'Todos', date: 'Tudo' })}>Resetar</button>
        </section>

        <div className="ticket-grid">{filteredTickets.map(ticket => (<TicketCard key={ticket.id} ticket={ticket} onOpen={setSelectedTicket} />))}</div>
      </main>
    </div>
  )
}

export default App
