/* ================================================================
   app.js — TaskFlow
   Works with Node.js backend (/api/tasks).
   If the server is unreachable, falls back to localStorage
   automatically so the app still works offline.
   ================================================================ */

const API = '/api/tasks';
let allTasks     = [];
let currentFilter = 'all';
let editingId     = null;
let nextId        = 200;
let useLocalMode  = false;   // flipped to true when server is unreachable

/* ── localStorage helpers ─────────────────────────────────────── */
function lsLoad() {
  try { return JSON.parse(localStorage.getItem('taskflow_tasks')) || []; } catch { return []; }
}
function lsSave() {
  localStorage.setItem('taskflow_tasks', JSON.stringify(allTasks));
}

/* ── Sample / seed data (matches server.js defaults) ─────────── */
const SEED_TASKS = [
  { id:1,  text:'Completed Python Course — Basics to OOP',           completed:true,  priority:'high',   category:'Learning', createdAt:new Date().toISOString(), dueDate:null },
  { id:2,  text:'Designed Portfolio UI in Figma',                    completed:true,  priority:'high',   category:'Work',     createdAt:new Date().toISOString(), dueDate:null },
  { id:3,  text:'Complete Internship Task 1 — Personal Portfolio',   completed:true,  priority:'high',   category:'Work',     createdAt:new Date().toISOString(), dueDate:null },
  { id:4,  text:'Build To-Do App with Node.js Backend',              completed:true,  priority:'high',   category:'Work',     createdAt:new Date().toISOString(), dueDate:null },
  { id:5,  text:'Learned JavaScript — ES6, DOM, Functions',          completed:true,  priority:'medium', category:'Learning', createdAt:new Date().toISOString(), dueDate:null },
  { id:6,  text:'Learned React — Components, Props, Hooks',          completed:true,  priority:'medium', category:'Learning', createdAt:new Date().toISOString(), dueDate:null },
  { id:7,  text:'Learn React Native — Mobile App Development',       completed:false, priority:'high',   category:'Learning', createdAt:new Date().toISOString(), dueDate: new Date(Date.now()+86400000*3).toISOString().split('T')[0] },
  { id:8,  text:'Learn Data Analytics — Excel, Pandas, NumPy',       completed:false, priority:'medium', category:'Learning', createdAt:new Date().toISOString(), dueDate: new Date(Date.now()+86400000*7).toISOString().split('T')[0] },
  { id:9,  text:'Learn Power BI — Dashboards and Data Visualization',completed:false, priority:'medium', category:'Learning', createdAt:new Date().toISOString(), dueDate:null },
  { id:10, text:'Learn Graphic Design — Canva and Adobe Illustrator',completed:false, priority:'low',    category:'Learning', createdAt:new Date().toISOString(), dueDate:null },
  { id:11, text:'Reading "The Fault in Our Stars" by John Green 📖', completed:false, priority:'low',    category:'Personal', createdAt:new Date().toISOString(), dueDate:null },
];

/* ── Dark mode ────────────────────────────────────────────────── */
function toggleDark() {
  const isDark = document.body.getAttribute('data-theme') === 'dark';
  document.body.setAttribute('data-theme', isDark ? '' : 'dark');
  document.getElementById('darkBtn').textContent = isDark ? '🌙' : '☀️';
  localStorage.setItem('taskflow_theme', isDark ? 'light' : 'dark');
}
if (localStorage.getItem('taskflow_theme') === 'dark') {
  document.body.setAttribute('data-theme', 'dark');
  document.getElementById('darkBtn').textContent = '☀️';
}

/* ── Tab switch ───────────────────────────────────────────────── */
function switchTab(tab, btn) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('tab-' + tab).classList.add('active');
  if (tab === 'analytics') renderAnalytics();
}

/* ── Due date helper ──────────────────────────────────────────── */
function getDueStatus(dueDate, completed) {
  if (!dueDate || completed) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due   = new Date(dueDate);
  const diff  = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  if (diff < 0)   return { label: `Overdue by ${Math.abs(diff)}d`, cls: 'overdue' };
  if (diff === 0) return { label: 'Due Today',                      cls: 'soon' };
  if (diff <= 3)  return { label: `Due in ${diff}d`,                cls: 'soon' };
  return { label: `Due ${due.toLocaleDateString('en-US',{month:'short',day:'numeric'})}`, cls: 'ok' };
}

/* ── Reminders ────────────────────────────────────────────────── */
function checkReminders() {
  const soon = allTasks.filter(t => {
    if (t.completed || !t.dueDate) return false;
    const diff = Math.ceil((new Date(t.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff <= 1;
  });
  if (soon.length > 0) showToast(`🔔 ${soon.length} task(s) due soon!`, 'coral');
}

/* ── INIT ─────────────────────────────────────────────────────── */
async function fetchTasks() {
  try {
    const res  = await fetch(API);
    if (!res.ok) throw new Error('Server error');
    const data = await res.json();
    allTasks   = data.tasks.sort((a, b) => a.completed - b.completed);
    useLocalMode = false;
  } catch {
    /* Server not running — switch to localStorage */
    useLocalMode = true;
    const saved  = lsLoad();
    if (saved.length > 0) {
      allTasks = saved;
      nextId   = Math.max(...allTasks.map(t => t.id), 99) + 1;
    } else {
      allTasks = SEED_TASKS.map(t => ({ ...t }));
      nextId   = 200;
      lsSave();
    }
    allTasks.sort((a, b) => a.completed - b.completed);
  }
  updateStats();
  renderTasks();
  setTimeout(checkReminders, 1500);
}

/* ── ADD ──────────────────────────────────────────────────────── */
async function addTask() {
  const inp      = document.getElementById('taskInput');
  const text     = inp.value.trim();
  const priority = document.getElementById('prioritySelect').value;
  const category = document.getElementById('categorySelect').value;
  const dueDate  = document.getElementById('dueDateInput').value || null;
  if (!text) { showToast('⚠️ Enter a task first!'); return; }

  if (useLocalMode) {
    const task = { id: nextId++, text, priority, category, dueDate, completed: false, createdAt: new Date().toISOString() };
    allTasks.push(task);
    allTasks.sort((a, b) => a.completed - b.completed);
    lsSave();
  } else {
    try {
      const data = await (await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, priority, category, dueDate })
      })).json();
      if (!data.success) return;
      allTasks.push(data.task);
      allTasks.sort((a, b) => a.completed - b.completed);
    } catch { showToast('❌ Server error'); return; }
  }

  inp.value = '';
  document.getElementById('dueDateInput').value = '';
  updateStats();
  renderTasks();
  showToast('✅ Task added!', 'coral');
}

/* ── TOGGLE ───────────────────────────────────────────────────── */
async function toggleTask(id) {
  const t = allTasks.find(t => t.id === id); if (!t) return;

  if (useLocalMode) {
    t.completed = !t.completed;
    lsSave();
  } else {
    try {
      const data = await (await fetch(`${API}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !t.completed })
      })).json();
      if (!data.success) return;
      t.completed = data.task.completed;
    } catch { showToast('❌ Server error'); return; }
  }

  allTasks.sort((a, b) => a.completed - b.completed);
  updateStats();
  renderTasks();
  showToast(t.completed ? '🎉 Done!' : '↩️ Pending', 'teal');
}

/* ── EDIT ─────────────────────────────────────────────────────── */
function startEdit(id) {
  editingId = id;
  renderTasks();
  setTimeout(() => { const i = document.getElementById(`e-${id}`); if (i) { i.focus(); i.select(); } }, 50);
}
function cancelEdit() { editingId = null; renderTasks(); }

async function saveEdit(id) {
  const text = document.getElementById(`e-${id}`)?.value.trim();
  if (!text) { showToast('⚠️ Cannot be empty!'); return; }

  if (useLocalMode) {
    const t = allTasks.find(t => t.id === id);
    if (t) t.text = text;
    lsSave();
  } else {
    try {
      const data = await (await fetch(`${API}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })).json();
      if (!data.success) return;
      const t = allTasks.find(t => t.id === id);
      if (t) t.text = data.task.text;
    } catch { showToast('❌ Server error'); return; }
  }

  editingId = null;
  renderTasks();
  showToast('✏️ Updated!', 'coral');
}

/* ── DELETE ───────────────────────────────────────────────────── */
async function deleteTask(id) {
  const el = document.getElementById(`task-${id}`);
  if (el) el.classList.add('removing');
  await new Promise(r => setTimeout(r, 280));

  if (useLocalMode) {
    allTasks = allTasks.filter(t => t.id !== id);
    lsSave();
  } else {
    try {
      await fetch(`${API}/${id}`, { method: 'DELETE' });
      allTasks = allTasks.filter(t => t.id !== id);
    } catch { showToast('❌ Server error'); return; }
  }

  updateStats();
  renderTasks();
  showToast('🗑️ Deleted');
}

/* ── CLEAR COMPLETED ──────────────────────────────────────────── */
async function clearCompleted() {
  const done = allTasks.filter(t => t.completed);
  if (!done.length) { showToast('No completed tasks!'); return; }

  if (useLocalMode) {
    allTasks = allTasks.filter(t => !t.completed);
    lsSave();
  } else {
    try {
      for (const t of done) await fetch(`${API}/${t.id}`, { method: 'DELETE' });
      allTasks = allTasks.filter(t => !t.completed);
    } catch { showToast('❌ Server error'); return; }
  }

  updateStats();
  renderTasks();
  showToast(`🧹 Cleared ${done.length} task(s)`, 'teal');
}

/* ── FILTER ───────────────────────────────────────────────────── */
function setFilter(f, btn) {
  currentFilter = f;
  document.querySelectorAll('.ftab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderTasks();
}

/* ── RENDER TASKS ─────────────────────────────────────────────── */
function renderTasks() {
  const search = document.getElementById('searchInp')?.value.toLowerCase() || '';
  const today  = new Date(); today.setHours(0, 0, 0, 0);
  let tasks    = allTasks;

  if (currentFilter === 'pending')   tasks = tasks.filter(t => !t.completed);
  if (currentFilter === 'completed') tasks = tasks.filter(t =>  t.completed);
  if (currentFilter === 'overdue')   tasks = tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < today);
  if (search) tasks = tasks.filter(t => t.text.toLowerCase().includes(search));

  const c = document.getElementById('tasksList');

  if (!tasks.length) {
    const icon = currentFilter === 'completed' ? '🏆' : currentFilter === 'overdue' ? '⚠️' : '📋';
    const msg  = search ? 'No results found'
               : currentFilter === 'completed' ? 'No completed tasks'
               : currentFilter === 'overdue'   ? 'No overdue tasks!'
               : 'No tasks yet!';
    const hint = (!search && currentFilter === 'all') ? 'Add your first task above' : '';
    c.innerHTML = `<div class="empty"><span class="ei">${icon}</span><p>${msg}</p><small>${hint}</small></div>`;
    return;
  }

  const pIcon = { high: '🔴', medium: '🟡', low: '🟢' };
  c.innerHTML = tasks.map(t => {
    const isEdit    = editingId === t.id;
    const date      = new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const dueStatus = getDueStatus(t.dueDate, t.completed);
    const isOverdue = dueStatus && dueStatus.cls === 'overdue';

    return `<div class="task-item p-${t.priority} ${t.completed ? 'done' : ''} ${isOverdue ? 'overdue' : ''}" id="task-${t.id}">
      <div class="cbx ${t.completed ? 'on' : ''}" onclick="toggleTask(${t.id})"></div>
      <div class="task-body">
        ${isEdit
          ? `<input class="edit-inp" id="e-${t.id}" value="${t.text.replace(/"/g,'&quot;')}"
               onkeydown="if(event.key==='Enter')saveEdit(${t.id});if(event.key==='Escape')cancelEdit();"/>`
          : `<div class="task-text">${t.text}</div>`}
        <div class="task-meta">
          <span class="badge b-${t.priority}">${pIcon[t.priority]} ${t.priority}</span>
          <span class="badge b-cat">${t.category}</span>
          ${dueStatus ? `<span class="b-due ${dueStatus.cls}">📅 ${dueStatus.label}</span>` : ''}
          <span class="b-date">${date}</span>
        </div>
      </div>
      <div class="task-actions">
        ${isEdit
          ? `<button class="ico-btn save" onclick="saveEdit(${t.id})">✓</button>
             <button class="ico-btn del"  onclick="cancelEdit()">✕</button>`
          : `<button class="ico-btn edit" onclick="startEdit(${t.id})">✏️</button>
             <button class="ico-btn del"  onclick="deleteTask(${t.id})">🗑️</button>`}
      </div>
    </div>`;
  }).join('');
}

/* ── UPDATE STATS ─────────────────────────────────────────────── */
function updateStats() {
  const total   = allTasks.length;
  const done    = allTasks.filter(t => t.completed).length;
  const today   = new Date(); today.setHours(0, 0, 0, 0);
  const overdue = allTasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < today).length;
  const pct     = total ? Math.round((done / total) * 100) : 0;

  document.getElementById('totalCount').textContent   = total;
  document.getElementById('pendingCount').textContent = total - done;
  document.getElementById('doneCount').textContent    = done;
  document.getElementById('overdueCount').textContent = overdue;
  document.getElementById('progressPct').textContent  = pct + '%';
  document.getElementById('progressBar').style.width  = pct + '%';
}

/* ── ANALYTICS ────────────────────────────────────────────────── */
function renderAnalytics() {
  const total   = allTasks.length;
  const done    = allTasks.filter(t => t.completed).length;
  const today   = new Date(); today.setHours(0, 0, 0, 0);
  const overdue = allTasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < today).length;

  const cats      = { Work:0, Learning:0, Personal:0, General:0 };
  allTasks.forEach(t => { if (cats[t.category] !== undefined) cats[t.category]++; });
  const catColors = { Work:'#FF6B6B', Learning:'#4ECDC4', Personal:'#FFE66D', General:'#a29bfe' };

  document.getElementById('catBars').innerHTML = Object.entries(cats).map(([cat, count]) => `
    <div class="cat-bar">
      <div class="cat-bar-label"><span>${cat}</span><span>${count}</span></div>
      <div class="cat-bar-track">
        <div class="cat-bar-fill" style="width:${total ? (count/total*100) : 0}%;background:${catColors[cat]}"></div>
      </div>
    </div>`).join('');

  const pri = { high:0, medium:0, low:0 };
  allTasks.forEach(t => pri[t.priority]++);
  document.getElementById('priorityDots').innerHTML = Object.entries(pri).map(([p, c]) => `
    <div class="p-dot-row">
      <div class="p-dot-label"><div class="p-dot ${p}"></div><span style="text-transform:capitalize">${p}</span></div>
      <span class="p-dot-count">${c}</span>
    </div>`).join('');

  document.getElementById('completionRate').textContent = total ? Math.round((done/total)*100)+'%' : '0%';
  document.getElementById('overdueNum').textContent     = overdue;
}

/* ── TOAST ────────────────────────────────────────────────────── */
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className   = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 2600);
}

/* ── BOOT ─────────────────────────────────────────────────────── */
document.getElementById('taskInput').addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });
fetchTasks();
