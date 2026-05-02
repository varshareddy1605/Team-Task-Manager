// ===== STATE =====
let currentUser = null;
let currentProjectId = null;
let currentProject = null;
let allProjects = [];

// ===== INIT =====
(async () => {
  api.loadToken();
  if (api.token) {
    try {
      const { user } = await api.me();
      currentUser = user;
      showApp();
      navigate('dashboard');
    } catch {
      api.setToken(null);
      showAuth();
    }
  } else {
    showAuth();
  }
})();

// ===== AUTH =====
function showAuth() { 
  document.getElementById('auth-page').classList.remove('hidden'); 
  document.getElementById('main-app').classList.add('hidden'); 
}
function showApp() {
  document.getElementById('auth-page').classList.add('hidden');
  document.getElementById('main-app').classList.remove('hidden');
  document.getElementById('sidebar-name').textContent = currentUser.name.split(' ')[0];
  document.getElementById('sidebar-role').textContent = currentUser.role;
  document.getElementById('sidebar-avatar').textContent = currentUser.name[0].toUpperCase();
}

function switchTab(tab) {
  document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
  document.getElementById('signup-form').classList.toggle('hidden', tab !== 'signup');
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-signup').classList.toggle('active', tab === 'signup');
}

async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  const errEl = document.getElementById('login-error');
  errEl.classList.add('hidden');
  btn.disabled = true; btn.innerHTML = '<span>Signing in…</span>';
  try {
    const { user, token } = await api.login({
      email: document.getElementById('login-email').value,
      password: document.getElementById('login-password').value,
    });
    api.setToken(token);
    currentUser = user;
    showApp();
    navigate('dashboard');
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove('hidden');
  } finally {
    btn.disabled = false; btn.innerHTML = '<span>Sign In</span>';
  }
}

async function handleSignup(e) {
  e.preventDefault();
  const btn = document.getElementById('signup-btn');
  const errEl = document.getElementById('signup-error');
  errEl.classList.add('hidden');
  btn.disabled = true; btn.innerHTML = '<span>Creating account…</span>';
  try {
    const { user, token } = await api.signup({
      name: document.getElementById('signup-name').value,
      email: document.getElementById('signup-email').value,
      password: document.getElementById('signup-password').value,
      role: document.getElementById('signup-role').value,
    });
    api.setToken(token);
    currentUser = user;
    showApp();
    navigate('dashboard');
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove('hidden');
  } finally {
    btn.disabled = false; btn.innerHTML = '<span>Create Account</span>';
  }
}

function handleLogout() {
  api.setToken(null);
  currentUser = null;
  showAuth();
  showToast('Logged out successfully', 'success');
}

// ===== NAVIGATION =====
function navigate(page, e) {
  if (e) e.preventDefault();
  // Remove active AND ensure hidden is cleared on all pages
  document.querySelectorAll('.content-page').forEach(p => {
    p.classList.remove('active');
    p.classList.add('hidden');
  });
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const pageEl = document.getElementById(`page-${page}`);
  if (pageEl) { pageEl.classList.remove('hidden'); pageEl.classList.add('active'); }

  const navEl = document.querySelector(`[data-page="${page}"]`);
  if (navEl) navEl.classList.add('active');

  const titles = { dashboard: 'Dashboard', projects: 'Projects', tasks: 'My Tasks', team: 'Team', 'project-detail': 'Project Detail' };
  document.getElementById('page-title').textContent = titles[page] || page;

  const actionBtn = document.getElementById('topbar-action-btn');
  if (page === 'dashboard') { actionBtn.textContent = '+ New Project'; actionBtn.onclick = () => openModal('project-modal'); }
  else if (page === 'projects') { actionBtn.textContent = '+ New Project'; actionBtn.onclick = () => openModal('project-modal'); }
  else if (page === 'tasks') { actionBtn.textContent = '+ New Task'; actionBtn.onclick = () => openCreateTaskFromTopbar(); }
  else { actionBtn.textContent = ''; actionBtn.onclick = null; }

  if (page === 'dashboard') loadDashboard();
  else if (page === 'projects') loadProjects();
  else if (page === 'tasks') loadTasks();
  else if (page === 'team') loadTeam();

  // Close sidebar on mobile
  if (window.innerWidth <= 768) document.getElementById('sidebar').classList.remove('open');
}

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }

// ===== DASHBOARD =====
async function loadDashboard() {
  try {
    const { stats, recentTasks } = await api.dashboard();
    document.getElementById('stat-total-val').textContent = stats.totalTasks;
    document.getElementById('stat-progress-val').textContent = stats.inProgressTasks;
    document.getElementById('stat-done-val').textContent = stats.doneTasks;
    document.getElementById('stat-overdue-val').textContent = stats.overdueTasks;
    document.getElementById('stat-projects-val').textContent = stats.projectCount;
    document.getElementById('stat-mine-val').textContent = stats.myTasks;

    const tbody = document.getElementById('recent-tasks-body');
    if (!recentTasks.length) { tbody.innerHTML = '<tr><td colspan="6" class="empty-row">No tasks yet. Create a project to get started!</td></tr>'; return; }
    tbody.innerHTML = recentTasks.map(t => `
      <tr>
        <td><span style="font-weight:600">${esc(t.title)}</span></td>
        <td><span style="color:var(--text-muted)">${esc(t.project?.name || '—')}</span></td>
        <td>${t.assignee ? esc(t.assignee.name) : '<span style="color:var(--text-faint)">Unassigned</span>'}</td>
        <td>${statusBadge(t.status)}</td>
        <td>${priorityBadge(t.priority)}</td>
        <td>${t.dueDate ? `<span class="${isPast(t.dueDate) && t.status !== 'DONE' ? 'overdue-date' : ''}">${fmtDate(t.dueDate)}</span>` : '<span style="color:var(--text-faint)">—</span>'}</td>
      </tr>`).join('');
  } catch (err) { showToast(err.message, 'error'); }
}

// ===== PROJECTS =====
async function loadProjects() {
  const grid = document.getElementById('projects-grid');
  grid.innerHTML = '<div class="loading-state">Loading projects…</div>';
  try {
    const { projects } = await api.getProjects();
    allProjects = projects;
    if (!projects.length) { grid.innerHTML = '<div class="loading-state">No projects yet. Create your first one!</div>'; return; }
    grid.innerHTML = projects.map(p => {
      const done = p.tasks.filter(t => t.status === 'DONE').length;
      const total = p.tasks.length;
      const pct = total ? Math.round((done / total) * 100) : 0;
      return `
      <div class="project-card" onclick="openProject('${p.id}')">
        <div class="project-card-name">${esc(p.name)}</div>
        <div class="project-card-desc">${esc(p.description || 'No description')}</div>
        <div class="project-card-meta">
          <span>👥 ${p._count.members} member${p._count.members !== 1 ? 's' : ''}</span>
          <span>📋 ${p._count.tasks} task${p._count.tasks !== 1 ? 's' : ''}</span>
        </div>
        <div class="project-progress">
          <div class="progress-label"><span>Progress</span><span>${pct}%</span></div>
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        </div>
      </div>`;
    }).join('');
  } catch (err) { grid.innerHTML = '<div class="loading-state">Failed to load projects.</div>'; showToast(err.message, 'error'); }
}

async function openProject(id) {
  currentProjectId = id;
  navigate('project-detail');
  document.getElementById('page-project-detail').classList.add('active');
  document.getElementById('page-title').textContent = 'Project Detail';
  try {
    const { project } = await api.getProject(id);
    currentProject = project;
    document.getElementById('detail-project-name').textContent = project.name;
    document.getElementById('detail-project-desc').textContent = project.description || '';
    renderMembers(project.members);
    renderKanban(project.tasks);
    populateAssigneeSelect(project.members);
    document.getElementById('task-project-id').value = id;
  } catch (err) { showToast(err.message, 'error'); }
}

function renderMembers(members) {
  const isAdmin = currentUser.role === 'ADMIN' || (currentProject && currentProject.ownerId === currentUser.id);
  document.getElementById('add-member-btn').style.display = isAdmin ? '' : 'none';
  document.getElementById('members-list').innerHTML = members.map(m => `
    <div class="member-chip">
      <div class="member-chip-avatar">${m.user.name[0].toUpperCase()}</div>
      <span>${esc(m.user.name)}</span>
      <span class="badge badge-${m.role.toLowerCase()}">${m.role}</span>
      ${isAdmin && m.user.id !== currentUser.id ? `<span class="member-chip-remove" onclick="removeMember('${m.user.id}')" title="Remove">×</span>` : ''}
    </div>`).join('') || '<span style="color:var(--text-muted);font-size:13px">No members yet.</span>';
}

function renderKanban(tasks) {
  const groups = { TODO: [], IN_PROGRESS: [], DONE: [] };
  tasks.forEach(t => groups[t.status]?.push(t));
  const isAdmin = currentUser.role === 'ADMIN';

  [['todo', 'TODO'], ['inprogress', 'IN_PROGRESS'], ['done', 'DONE']].forEach(([key, status]) => {
    document.getElementById(`count-${key}`).textContent = groups[status].length;
    document.getElementById(`cards-${key}`).innerHTML = groups[status].map(t => `
      <div class="kanban-card">
        <div class="kanban-card-title">${esc(t.title)}</div>
        ${t.description ? `<div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">${esc(t.description)}</div>` : ''}
        <div class="kanban-card-meta">
          <div class="kanban-card-assignee">
            ${t.assignee ? `<div style="width:18px;height:18px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--purple));display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:700">${t.assignee.name[0]}</div>${esc(t.assignee.name)}` : '<span style="color:var(--text-faint)">Unassigned</span>'}
          </div>
          ${priorityBadge(t.priority)}
        </div>
        <div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn btn-primary btn-sm" onclick="editTask(${JSON.stringify(t).split('"').join('&quot;')})">✏ Edit</button>
          ${status !== 'TODO' ? `<button class="btn btn-ghost btn-sm" onclick="quickStatus('${t.id}','TODO','${currentProjectId}')">← Todo</button>` : ''}
          ${status !== 'IN_PROGRESS' ? `<button class="btn btn-ghost btn-sm" onclick="quickStatus('${t.id}','IN_PROGRESS','${currentProjectId}')">▶ Progress</button>` : ''}
          ${status !== 'DONE' ? `<button class="btn btn-ghost btn-sm" onclick="quickStatus('${t.id}','DONE','${currentProjectId}')">✓ Done</button>` : ''}
          ${isAdmin || t.createdById === currentUser.id ? `<button class="btn btn-danger btn-sm" onclick="deleteTask('${t.id}','${currentProjectId}')">Delete</button>` : ''}
        </div>
        ${t.dueDate ? `<div style="margin-top:8px;font-size:11px;color:${isPast(t.dueDate) && status !== 'DONE' ? 'var(--danger)' : 'var(--text-muted)'}">Due: ${fmtDate(t.dueDate)}</div>` : ''}
      </div>`).join('') || '<div style="color:var(--text-faint);font-size:13px;text-align:center;padding:20px">No tasks</div>';
  });
}

function populateAssigneeSelect(members) {
  const sel = document.getElementById('task-assignee');
  sel.innerHTML = '<option value="">Unassigned</option>' +
    members.map(m => `<option value="${m.user.id}">${esc(m.user.name)}</option>`).join('');
}

async function quickStatus(taskId, status, projectId) {
  try {
    await api.updateTask(taskId, { status });
    await openProject(projectId);
    showToast('Task updated', 'success');
  } catch (err) { showToast(err.message, 'error'); }
}

async function deleteTask(taskId, projectId) {
  if (!confirm('Delete this task?')) return;
  try {
    await api.deleteTask(taskId);
    if (projectId) await openProject(projectId); else loadTasks();
    showToast('Task deleted', 'success');
  } catch (err) { showToast(err.message, 'error'); }
}

// ===== TASKS PAGE =====
async function loadTasks(params = {}) {
  const tbody = document.getElementById('tasks-body');
  tbody.innerHTML = '<tr><td colspan="7" class="empty-row">Loading…</td></tr>';
  try {
    const { tasks } = await api.getTasks(params);
    if (!tasks.length) { tbody.innerHTML = '<tr><td colspan="7" class="empty-row">No tasks found.</td></tr>'; return; }
    const isAdmin = currentUser.role === 'ADMIN';
    tbody.innerHTML = tasks.map(t => `
      <tr>
        <td><span style="font-weight:600">${esc(t.title)}</span>${t.description ? `<div style="font-size:12px;color:var(--text-muted)">${esc(t.description.substring(0, 60))}${t.description.length > 60 ? '…' : ''}</div>` : ''}</td>
        <td><span style="color:var(--text-muted)">${esc(t.project?.name || '—')}</span></td>
        <td>${t.assignee ? esc(t.assignee.name) : '<span style="color:var(--text-faint)">Unassigned</span>'}</td>
        <td>
          <select onchange="quickStatusTable('${t.id}', this.value)" style="width:auto;padding:4px 8px;font-size:12px">
            <option value="TODO" ${t.status==='TODO'?'selected':''}>To Do</option>
            <option value="IN_PROGRESS" ${t.status==='IN_PROGRESS'?'selected':''}>In Progress</option>
            <option value="DONE" ${t.status==='DONE'?'selected':''}>Done</option>
          </select>
        </td>
        <td>${priorityBadge(t.priority)}</td>
        <td>${t.dueDate ? `<span style="color:${isPast(t.dueDate)&&t.status!=='DONE'?'var(--danger)':'inherit'}">${fmtDate(t.dueDate)}</span>` : '<span style="color:var(--text-faint)">—</span>'}</td>
        <td style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn btn-primary btn-sm" onclick='editTask(${JSON.stringify(t)})'>✏ Edit</button>
          ${isAdmin || t.createdById === currentUser.id ? `<button class="btn btn-danger btn-sm" onclick="deleteTask('${t.id}')">Delete</button>` : ''}
        </td>
      </tr>`).join('');
  } catch (err) { tbody.innerHTML = '<tr><td colspan="7" class="empty-row">Failed to load tasks.</td></tr>'; showToast(err.message, 'error'); }
}

async function quickStatusTable(taskId, status) {
  try {
    await api.updateTask(taskId, { status });
    showToast('Status updated', 'success');
  } catch (err) { showToast(err.message, 'error'); loadTasks(); }
}

function filterTasks() {
  loadTasks({
    status: document.getElementById('filter-status').value,
    priority: document.getElementById('filter-priority').value,
  });
}

// ===== TEAM =====
async function loadTeam() {
  const grid = document.getElementById('team-grid');
  grid.innerHTML = '<div class="loading-state">Loading team…</div>';
  try {
    // Get all members across all projects from signup (use a shared users approach via projects)
    const { projects } = await api.getProjects();
    const seen = new Set();
    const users = [];
    for (const p of projects) {
      const { members } = await api.getMembers(p.id);
      members.forEach(m => { if (!seen.has(m.user.id)) { seen.add(m.user.id); users.push(m.user); } });
    }
    if (!users.length) { grid.innerHTML = '<div class="loading-state">No team members found.</div>'; return; }
    grid.innerHTML = users.map(u => `
      <div class="team-card">
        <div class="team-avatar">${u.name[0].toUpperCase()}</div>
        <div class="team-name">${esc(u.name)}</div>
        <div class="team-email">${esc(u.email)}</div>
        <span class="badge badge-${u.role.toLowerCase()}">${u.role}</span>
      </div>`).join('');
  } catch (err) { grid.innerHTML = '<div class="loading-state">Failed to load team.</div>'; showToast(err.message, 'error'); }
}

// ===== MODALS =====
function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.add('hidden'); });
});

function handleTopbarAction() { openModal('project-modal'); }

async function openCreateTaskFromTopbar() {
  if (!allProjects.length) {
    try { const { projects } = await api.getProjects(); allProjects = projects; } catch {}
  }
  if (!allProjects.length) { showToast('Create a project first', 'error'); return; }
  // Use first project as default
  document.getElementById('task-project-id').value = allProjects[0].id;
  document.getElementById('task-edit-id').value = '';
  document.getElementById('task-modal-title').textContent = 'New Task';
  document.getElementById('task-submit-btn').textContent = 'Create Task';
  document.getElementById('task-title').value = '';
  document.getElementById('task-desc').value = '';
  const { members } = await api.getMembers(allProjects[0].id);
  populateAssigneeSelect(members);
  openModal('task-modal');
}

function openCreateTaskModal() {
  document.getElementById('task-edit-id').value = '';
  document.getElementById('task-modal-title').textContent = 'New Task';
  document.getElementById('task-submit-btn').textContent = 'Create Task';
  document.getElementById('task-title').value = '';
  document.getElementById('task-desc').value = '';
  document.getElementById('task-due').value = '';
  document.getElementById('task-priority').value = 'MEDIUM';
  document.getElementById('task-status').value = 'TODO';
  document.getElementById('task-assignee').value = '';
  openModal('task-modal');
}

function editTask(task) {
  // task may be passed as object or JSON string
  const t = typeof task === 'string' ? JSON.parse(task) : task;
  document.getElementById('task-edit-id').value = t.id;
  document.getElementById('task-modal-title').textContent = 'Edit Task';
  document.getElementById('task-submit-btn').textContent = 'Save Changes';
  document.getElementById('task-title').value = t.title || '';
  document.getElementById('task-desc').value = t.description || '';
  document.getElementById('task-priority').value = t.priority || 'MEDIUM';
  document.getElementById('task-status').value = t.status || 'TODO';
  document.getElementById('task-due').value = t.dueDate ? t.dueDate.split('T')[0] : '';
  document.getElementById('task-project-id').value = t.projectId || currentProjectId || '';
  // Pre-select assignee if set
  const sel = document.getElementById('task-assignee');
  // Populate members if empty
  if (sel.options.length <= 1 && currentProject) {
    populateAssigneeSelect(currentProject.members);
  }
  sel.value = t.assigneeId || '';
  openModal('task-modal');
}

async function handleProjectSubmit(e) {
  e.preventDefault();
  const errEl = document.getElementById('project-modal-error');
  errEl.classList.add('hidden');
  try {
    await api.createProject({ name: document.getElementById('proj-name').value, description: document.getElementById('proj-desc').value });
    closeModal('project-modal');
    document.getElementById('proj-name').value = '';
    document.getElementById('proj-desc').value = '';
    showToast('Project created!', 'success');
    loadProjects();
    navigate('projects');
  } catch (err) { errEl.textContent = err.message; errEl.classList.remove('hidden'); }
}

async function handleTaskSubmit(e) {
  e.preventDefault();
  const errEl = document.getElementById('task-modal-error');
  errEl.classList.add('hidden');
  const editId = document.getElementById('task-edit-id').value;
  const data = {
    title: document.getElementById('task-title').value,
    description: document.getElementById('task-desc').value,
    projectId: document.getElementById('task-project-id').value,
    assigneeId: document.getElementById('task-assignee').value || null,
    priority: document.getElementById('task-priority').value,
    status: document.getElementById('task-status').value,
    dueDate: document.getElementById('task-due').value || null,
  };
  try {
    if (editId) await api.updateTask(editId, data); else await api.createTask(data);
    closeModal('task-modal');
    showToast(editId ? 'Task updated!' : 'Task created!', 'success');
    if (currentProjectId) await openProject(currentProjectId); else loadTasks();
  } catch (err) { errEl.textContent = err.message; errEl.classList.remove('hidden'); }
}

async function handleAddMember(e) {
  e.preventDefault();
  const errEl = document.getElementById('member-modal-error');
  errEl.classList.add('hidden');
  try {
    await api.addMember(currentProjectId, {
      email: document.getElementById('member-email').value,
      role: document.getElementById('member-role').value,
    });
    closeModal('member-modal');
    document.getElementById('member-email').value = '';
    showToast('Member added!', 'success');
    await openProject(currentProjectId);
  } catch (err) { errEl.textContent = err.message; errEl.classList.remove('hidden'); }
}

async function removeMember(userId) {
  if (!confirm('Remove this member?')) return;
  try {
    await api.removeMember(currentProjectId, userId);
    showToast('Member removed', 'success');
    await openProject(currentProjectId);
  } catch (err) { showToast(err.message, 'error'); }
}

// ===== HELPERS =====
function esc(str) { const d = document.createElement('div'); d.textContent = str || ''; return d.innerHTML; }
function fmtDate(d) { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
function isPast(d) { return new Date(d) < new Date(); }

function statusBadge(s) {
  const map = { TODO: ['todo', 'To Do'], IN_PROGRESS: ['inprogress', 'In Progress'], DONE: ['done', 'Done'] };
  const [cls, label] = map[s] || ['todo', s];
  return `<span class="badge badge-${cls}">${label}</span>`;
}
function priorityBadge(p) {
  const map = { LOW: 'low', MEDIUM: 'medium', HIGH: 'high' };
  return `<span class="badge badge-${map[p] || 'medium'}">${p}</span>`;
}

// ===== TOAST =====
let toastTimer;
function showToast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 3500);
}
