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
          <p>Portal de Filtros e Gestão</p>
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
          <div className="modal-title-info"><span className="modal-cat">{CATEGORY_ICONS[ticket.category]} {ticket.category}</span><h3>#T-00{ticket.id}: {ticket.title}</h3></div>
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
  const [filters, setFilters] = useState({ status: 'Todos', priority: 'Todas', tech: 'Todos', date: 'Tudo' })
  
  const [tickets, setTickets] = useState([
    { 
      id: 1, title: 'Erro ERP Financeiro', status: 'Aberto', priority: 'Urgente', category: 'Software',
      tags: ['Sistemas'], assignedTo: 'Ricardo Técnico', createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      interactions: [{ id: 101, author: 'Financeiro', role: 'Solicitante', text: 'Sem acesso.', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() }]
    },
    { 
      id: 2, title: 'Mouse quebrado', status: 'Em Andamento', priority: 'Baixa', category: 'Hardware',
      tags: ['Periféricos'], assignedTo: 'Ricardo Técnico', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
      interactions: [{ id: 102, author: 'RH', role: 'Solicitante', text: 'Não funciona.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString() }]
    },
    { 
      id: 4, title: 'DNS Instável', status: 'Aberto', priority: 'Alta', category: 'Rede',
      tags: ['Internet'], assignedTo: 'Não atribuído', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      interactions: [{ id: 104, author: 'Infra', role: 'Solicitante', text: 'Lento.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() }]
    },
    { 
      id: 5, title: 'Novo SSD Instalado', status: 'Concluído', priority: 'Média', category: 'Hardware',
      tags: ['Upgrade'], assignedTo: 'Ricardo Técnico', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      completedAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
      interactions: [{ id: 105, author: 'Marketing', role: 'Solicitante', text: 'Pedido de upgrade.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() }]
    },
  ])

  const notify = (m, t = 'info') => setToasts(prev => [...prev, { id: Date.now(), message: m, type: t }])

  const filteredTickets = tickets.filter(t => {
    const sMatch = filters.status === 'Todos' || t.status === filters.status
    const pMatch = filters.priority === 'Todas' || t.priority === filters.priority
    const tMatch = filters.tech === 'Todos' || t.assignedTo === filters.tech
    
    // Data (Simplificado p/ demo: Hoje, Semana, Mes)
    let dMatch = true
    const createdDate = new Date(t.createdAt)
    const now = new Date()
    if (filters.date === 'Hoje') {
      dMatch = createdDate.toDateString() === now.toDateString()
    } else if (filters.date === 'Semana') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      dMatch = createdDate >= weekAgo
    }
    
    return sMatch && pMatch && tMatch && dMatch
  })

  useEffect(() => {
    if (!currentUser) return
    const interval = setInterval(() => {
      tickets.forEach(ticket => {
        const deadline = new Date(ticket.createdAt).getTime() + (SLA_DURATIONS[ticket.priority] || 0)
        const diff = deadline - new Date().getTime()
        if (ticket.status !== 'Concluído' && diff > 0 && diff < 15 * 60 * 1000 && !ticket.slaNotified) {
          notify(`Chamado #T-00${ticket.id} próximo do vencimento!`, 'warning')
          ticket.slaNotified = true
        }
      })
    }, 30000)
    return () => clearInterval(interval)
  }, [tickets, currentUser])

  const addComment = (tId, c) => {
    setTickets(prev => prev.map(t => t.id === tId ? { ...t, interactions: [...t.interactions, c] } : t))
    notify(`Novo comentário no #T-00${tId}`, 'info')
  }

  if (!currentUser) return <Login onLogin={setCurrentUser} />

  return (
    <div className="layout">
      <div className="toast-container">{toasts.map(t => <Toast key={t.id} message={t.message} type={t.type} onClose={() => setToasts(p => p.filter(x => x.id !== t.id))} />)}</div>
      {selectedTicket && <TicketInteractionModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} onAddComment={addComment} currentUser={currentUser} />}
      <header className="header">
        <div className="logo"><h1>Service Desk <span className="pro">PRO</span></h1></div>
        <div className="header-right"><button className="logout-btn" onClick={() => setCurrentUser(null)}>Sair</button><div className="avatar">GS</div><div className="user-info"><span>{currentUser.name}</span></div></div>
      </header>

      <main className="main-content">
        <section className="title-bar">
          <div className="title-text"><h2>Gestão Operacional</h2><p className="subtitle">Relatórios e filtros inteligentes.</p></div>
          <button className="btn-primary">+ Criar Ticket</button>
        </section>

        <section className="filter-bar">
          <div className="filter-group">
            <label>Status</label>
            <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
              <option>Todos</option><option>Aberto</option><option>Em Andamento</option><option>Concluído</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Prioridade</label>
            <select value={filters.priority} onChange={e => setFilters({...filters, priority: e.target.value})}>
              <option>Todas</option><option>Urgente</option><option>Alta</option><option>Média</option><option>Baixa</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Técnico</label>
            <select value={filters.tech} onChange={e => setFilters({...filters, tech: e.target.value})}>
              <option>Todos</option><option>Ricardo Técnico</option><option>Não atribuído</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Período</label>
            <select value={filters.date} onChange={e => setFilters({...filters, date: e.target.value})}>
              <option>Tudo</option><option>Hoje</option><option>Semana</option>
            </select>
          </div>
          <button className="btn-reset" onClick={() => setFilters({ status: 'Todos', priority: 'Todas', tech: 'Todos', date: 'Tudo' })}>Limpar Filtros</button>
        </section>

        <div className="ticket-list-header"><h3>Resultados ({filteredTickets.length})</h3></div>
        <div className="ticket-grid">{filteredTickets.map(ticket => (<TicketCard key={ticket.id} ticket={ticket} onOpen={setSelectedTicket} />))}</div>
      </main>
    </div>
  )
}

export default App
