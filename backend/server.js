import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// DATABASE CONNECTION & INITIALIZATION
let db;
(async () => {
  db = await open({
    filename: './database.db',
    driver: sqlite3.Database
  });

  // Create Tickets Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      status TEXT DEFAULT 'Aberto',
      priority TEXT NOT NULL,
      category TEXT NOT NULL,
      assignedTo TEXT DEFAULT 'Não atribuído',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      completedAt DATETIME,
      tags TEXT
    );
  `);

  // Create Interactions (Comments/Timeline) Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS interactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticketId INTEGER,
      author TEXT NOT NULL,
      role TEXT NOT NULL,
      text TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(ticketId) REFERENCES tickets(id)
    );
  `);

  // Seed Data if empty
  const count = await db.get('SELECT COUNT(*) as count FROM tickets');
  if (count.count === 0) {
    const t1 = await db.run(`INSERT INTO tickets (title, priority, category, assignedTo, tags) VALUES (?, ?, ?, ?, ?)`, 
      ['Erro ERP Financeiro', 'Urgente', 'Software', 'Ricardo Técnico', 'Sistemas']);
    await db.run(`INSERT INTO interactions (ticketId, author, role, text) VALUES (?, ?, ?, ?)`,
      [t1.lastID, 'Financeiro', 'Solicitante', 'Sem acesso.']);
    
    await db.run(`INSERT INTO tickets (title, priority, category, assignedTo, tags) VALUES (?, ?, ?, ?, ?)`,
      ['Mouse quebrado', 'Baixa', 'Hardware', 'Ricardo Técnico', 'Periféricos']);
      
    console.log('Seed data inserted.');
  }

  console.log('Database connected and initialized.');
})();

// ENDPOINTS
// GET all tickets
app.get('/api/tickets', async (req, res) => {
  try {
    const tickets = await db.all('SELECT * FROM tickets ORDER BY createdAt DESC');
    // Map tags back to array
    const result = tickets.map(t => ({...t, tags: t.tags ? t.tags.split(',') : []}));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET interactions for a ticket
app.get('/api/tickets/:id/interactions', async (req, res) => {
  try {
    const data = await db.all('SELECT * FROM interactions WHERE ticketId = ? ORDER BY timestamp ASC', [req.params.id]);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE a ticket
app.post('/api/tickets', async (req, res) => {
  const { title, priority, category, tags, assignedTo } = req.body;
  try {
    const result = await db.run(
      `INSERT INTO tickets (title, priority, category, tags, assignedTo) VALUES (?, ?, ?, ?, ?)`,
      [title, priority, category, tags.join(','), assignedTo || 'Não atribuído']
    );
    res.status(201).json({ id: result.lastID, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADD interaction
app.post('/api/tickets/:id/interactions', async (req, res) => {
  const { author, role, text } = req.body;
  try {
    const result = await db.run(
      `INSERT INTO interactions (ticketId, author, role, text) VALUES (?, ?, ?, ?)`,
      [req.params.id, author, role, text]
    );
    res.status(201).json({ id: result.lastID, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE ticket (status, priority, assignment)
app.patch('/api/tickets/:id', async (req, res) => {
  const { status, completedAt, assignedTo } = req.body;
  try {
    if (status === 'Concluído' && !completedAt) {
      await db.run('UPDATE tickets SET status = ?, completedAt = CURRENT_TIMESTAMP WHERE id = ?', [status, req.params.id]);
    } else {
      await db.run('UPDATE tickets SET status = ?, assignedTo = ? WHERE id = ?', [status, assignedTo, req.params.id]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
