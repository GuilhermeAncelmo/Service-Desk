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
          <p>Portal de Gestão</p>
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
                  {item.fileName && <div className="attachment">📎 {item.fileName}</div>}
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
      id: 3, title: 'Wi-Fi instável', status: 'Concluído', priority: 'Baixa', category: 'Rede',
      tags: ['Infra'], assignedTo: 'Ricardo Técnico', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
      completedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      interactions: [{ id: 103, author: 'Marketing', role: 'Solicitante', text: 'Sinal cai toda hora.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString() }]
    },
    { 
      id: 4, title: 'VPN Lenta', status: 'Aberto', priority: 'Urgente', category: 'Rede',
      tags: ['Sinal'], assignedTo: 'Não atribuído', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
      interactions: [{ id: 104, author: 'Comercial', role: 'Solicitante', text: 'Lentidão absurda.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString() }]
    },
  ])

  const calculateAdvancedStats = () => {
    // MTTR (Mean Time To Resolution)
    const completedTickets = tickets.filter(t => t.status === 'Concluído' && t.completedAt)
    const totalResolutionTime = completedTickets.reduce((sum, t) => {
      return sum + (new Date(t.completedAt).getTime() - new Date(t.createdAt).getTime())
    }, 0)
    const mttrHours = completedTickets.length > 0 ? (totalResolutionTime / completedTickets.length / (1000 * 60 * 60)).toFixed(1) : '0'

    // Tickets by Category
    const byCategory = tickets.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1
      return acc
    }, {})

    // Tickets by Technician
    const byTech = tickets.reduce((acc, t) => {
      const tech = t.assignedTo === 'Não atribuído' ? 'Aguardando' : t.assignedTo
      acc[tech] = (acc[tech] || 0) + 1
      return acc
    }, {})

    // SLA Compliance Rate (%)
    const totalFinishedOrCurrent = tickets.length
    const breached = tickets.filter(t => {
      const deadline = new Date(t.createdAt).getTime() + (SLA_DURATIONS[t.priority] || 0)
      if (t.status === 'Concluído' && t.completedAt) {
        return new Date(t.completedAt).getTime() > deadline
      }
      return new Date().getTime() > deadline
    }).length
    const slaRate = totalFinishedOrCurrent > 0 ? (((totalFinishedOrCurrent - breached) / totalFinishedOrCurrent) * 100).toFixed(0) : '100'

    return { mttrHours, byCategory, byTech, slaRate }
  }

  const stats = calculateAdvancedStats()

  const addComment = (ticketId, comment) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, interactions: [...t.interactions, comment] } : t))
    if (selectedTicket && selectedTicket.id === ticketId) setSelectedTicket(prev => ({ ...prev, interactions: [...prev.interactions, comment] }))
  }

  if (!currentUser) return <Login onLogin={setCurrentUser} />

  return (
    <div className="layout">
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
          <div className="title-text"><h2>Relatórios e Desempenho</h2><p className="subtitle">Métricas avançadas de Service Desk.</p></div>
          <button className="btn-primary">+ Novo Ticket</button>
        </section>

        <section className="metrics-grid">
          <div className="metric-card">
            <span className="metric-icon">⏱️</span>
            <div className="metric-info">
              <span className="metric-label">MTTR Médio</span>
              <span className="metric-value">{stats.mttrHours}h</span>
            </div>
          </div>
          <div className="metric-card">
            <span className="metric-icon">📊</span>
            <div className="metric-info">
              <span className="metric-label">SLA Cumprido</span>
              <span className={`metric-value ${stats.slaRate < 80 ? 'warning' : 'success'}`}>{stats.slaRate}%</span>
            </div>
          </div>
          <div className="metric-card">
            <span className="metric-icon">🔌</span>
            <div className="metric-info">
              <span className="metric-label">Por Categoria</span>
              <div className="metric-list">
                {Object.entries(stats.byCategory).map(([cat, count]) => (
                  <div key={cat} className="list-item"><span>{cat}:</span> <strong>{count}</strong></div>
                ))}
              </div>
            </div>
          </div>
          <div className="metric-card">
            <span className="metric-icon">👨‍🔧</span>
            <div className="metric-info">
              <span className="metric-label">Por Técnico</span>
              <div className="metric-list">
                {Object.entries(stats.byTech).map(([name, count]) => (
                  <div key={name} className="list-item"><span>{name.split(' ')[0]}:</span> <strong>{count}</strong></div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="ticket-list-header"><h3>Chamados Ativos</h3><p>Lista detalhada de tickets em fila.</p></div>
        
        <div className="ticket-grid">
          {tickets.map(ticket => (
            <TicketCard key={ticket.id} ticket={ticket} onOpen={setSelectedTicket} />
          ))}
        </div>
      </main>
    </div>
  )
}

export default App
