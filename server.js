const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

let tasks = [
  { id: 1,  text: 'Completed Python Course — Basics to OOP',            completed: true,  priority: 'high',   category: 'Learning', createdAt: new Date().toISOString() },
  { id: 2,  text: 'Designed Portfolio UI in Figma',                     completed: true,  priority: 'high',   category: 'Work',     createdAt: new Date().toISOString() },
  { id: 3,  text: 'Complete Internship Task 1 — Personal Portfolio',    completed: true,  priority: 'high',   category: 'Work',     createdAt: new Date().toISOString() },
  { id: 4,  text: 'Build To-Do App with Node.js Backend',               completed: true,  priority: 'high',   category: 'Work',     createdAt: new Date().toISOString() },
  { id: 5,  text: 'Learned JavaScript — ES6, DOM, Functions',           completed: true,  priority: 'medium', category: 'Learning', createdAt: new Date().toISOString() },
  { id: 6,  text: 'Learned React — Components, Props, Hooks',           completed: true,  priority: 'medium', category: 'Learning', createdAt: new Date().toISOString() },
  { id: 7,  text: 'Learn React Native — Mobile App Development',        completed: false, priority: 'high',   category: 'Learning', createdAt: new Date().toISOString() },
  { id: 8,  text: 'Learn Data Analytics — Excel, Pandas, NumPy',        completed: false, priority: 'medium', category: 'Learning', createdAt: new Date().toISOString() },
  { id: 9,  text: 'Learn Power BI — Dashboards and Data Visualization', completed: false, priority: 'medium', category: 'Learning', createdAt: new Date().toISOString() },
  { id: 10, text: 'Learn Graphic Design — Canva and Adobe Illustrator', completed: false, priority: 'low',    category: 'Learning', createdAt: new Date().toISOString() },
  { id: 11, text: 'Reading "The Fault in Our Stars" by John Green 📖',  completed: false, priority: 'low',    category: 'Personal', createdAt: new Date().toISOString() },
];
let nextId = 12;

app.get('/api/tasks', (req, res) => {
  res.json({ success: true, tasks });
});

app.post('/api/tasks', (req, res) => {
  const { text, priority = 'medium', category = 'General' } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ success: false, message: 'Task text is required' });
  }
  const newTask = { id: nextId++, text: text.trim(), completed: false, priority, category, dueDate: req.body.dueDate||null, createdAt: new Date().toISOString() };
  tasks.push(newTask);
  res.status(201).json({ success: true, task: newTask });
});

app.put('/api/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const idx = tasks.findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Task not found' });
  const { text, completed, priority, category } = req.body;
  if (text      !== undefined) tasks[idx].text      = text.trim();
  if (completed !== undefined) tasks[idx].completed = completed;
  if (priority  !== undefined) tasks[idx].priority  = priority;
  if (category  !== undefined) tasks[idx].category  = category;
  res.json({ success: true, task: tasks[idx] });
});

app.delete('/api/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const idx = tasks.findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Task not found' });
  tasks.splice(idx, 1);
  res.json({ success: true, message: 'Task deleted successfully' });
});

app.delete('/api/tasks/clear/completed', (req, res) => {
  tasks = tasks.filter(t => !t.completed);
  res.json({ success: true, message: 'Completed tasks cleared' });
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(PORT, () => console.log(`✅ Server running → http://localhost:${PORT}`));
