var apiKey = '';
var currentTaskId = '';
var histCount = 0;
var currentUserId = null;

var CAMPOS = {
  tipo: '94d83347-c7f5-45ec-a688-3b79951df20f',
  sub:  'cacda1ca-fb8c-4535-9098-4666471db1d4',
  pod:  'c404151f-af3d-450b-a43e-577c7101a6bb'
};

var WORKSPACE = '3058846';

// ─── AUTH ────────────────────────────────────────────────

async function doLogin() {
  var k = document.getElementById('login-key').value.trim();
  var err = document.getElementById('login-error');
  var btn = document.querySelector('.login-btn');
  if (!k.startsWith('pk_')) { err.textContent = 'La key debe empezar con pk_'; return; }
  err.textContent = '';
  btn.textContent = 'Conectando...'; btn.disabled = true;
  try {
    var data = await ck('/user', null, k);
    if (!data.user) { err.textContent = 'API key inválida'; return; }
    apiKey = k;
    currentUserId = data.user.id;
    localStorage.setItem('bm_key', k);
    localStorage.setItem('bm_user', JSON.stringify({ id: data.user.id, name: data.user.username || data.user.email }));
    setUserUI(data.user.username || data.user.email);
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    cargarListasDinamicas();
  } catch(e) {
    err.textContent = 'Error: ' + e.message;
  } finally {
    btn.textContent = 'Entrar'; btn.disabled = false;
  }
}

function doLogout() {
  localStorage.removeItem('bm_key');
  localStorage.removeItem('bm_user');
  apiKey = ''; currentUserId = null;
  document.getElementById('login-key').value = '';
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('main-app').classList.add('hidden');
}

function setUserUI(name) {
  document.getElementById('user-name').textContent = name;
  document.getElementById('user-initials').textContent = name.substring(0,2).toUpperCase();
}

window.addEventListener('load', function() {
  var saved = localStorage.getItem('bm_key');
  var savedUser = localStorage.getItem('bm_user');
  if (saved) {
    apiKey = saved;
    if (savedUser) { var u = JSON.parse(savedUser); currentUserId = u.id; setUserUI(u.name); }
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    cargarListasDinamicas();
  }
});

// ─── LISTAS DINÁMICAS ────────────────────────────────────

// Listas — carga lazy al primer tipeo
var todasLasListas = [];
var listasListas = false;
var cargandoListas = false;

function cargarListasDinamicas() { /* lazy — se carga al primer tipeo */ }

async function asegurarListasCargadas() {
  if (listasListas) return;
  if (cargandoListas) {
    while (cargandoListas) await new Promise(function(r) { setTimeout(r, 200); });
    return;
  }
  cargandoListas = true;
  var input = document.getElementById('c-lista-search');
  if (input) input.placeholder = 'Cargando listas...';
  try {
    var spacesData = await ck('/team/' + WORKSPACE + '/space?archived=false');
    var spaces = spacesData.spaces || [];
    todasLasListas = [];
    // De a 3 spaces con pausa para respetar rate limit
    for (var b = 0; b < spaces.length; b += 3) {
      var batch = spaces.slice(b, b + 3);
      for (var i = 0; i < batch.length; i++) {
        var space = batch[i];
        try {
          var r1 = await ck('/space/' + space.id + '/list?archived=false').catch(function() { return { lists: [] }; });
          (r1.lists || []).forEach(function(l) { todasLasListas.push({ id: l.id, name: l.name, spaceName: space.name }); });
          var r2 = await ck('/space/' + space.id + '/folder?archived=false').catch(function() { return { folders: [] }; });
          var folders = r2.folders || [];
          for (var j = 0; j < folders.length; j++) {
            var r3 = await ck('/folder/' + folders[j].id + '/list?archived=false').catch(function() { return { lists: [] }; });
            (r3.lists || []).forEach(function(l) { todasLasListas.push({ id: l.id, name: l.name, spaceName: space.name }); });
          }
        } catch(e) {}
      }
      if (b + 3 < spaces.length) await new Promise(function(r) { setTimeout(r, 500); });
    }
    listasListas = true;
    if (input) input.placeholder = 'Escribí para buscar: flybondi, frávega...';
  } catch(e) {
    if (input) input.placeholder = 'Error — intentá de nuevo';
  }
  cargandoListas = false;
}

async function filtrarListas(query) {
  var dd = document.getElementById('lista-dropdown');
  var hidden = document.getElementById('c-lista');
  dd.innerHTML = '';
  if (!query.trim()) { dd.classList.remove('open'); return; }
  // Cargar listas si es la primera vez
  if (!listasListas) {
    dd.innerHTML = '<div class="ac-option" style="color:#888;cursor:default">⏳ Cargando listas...</div>';
    dd.classList.add('open');
    await asegurarListasCargadas();
    dd.innerHTML = '';
  }

  var words = query.toLowerCase().split(/\s+/).filter(Boolean);
  var matches = todasLasListas.filter(function(l) {
    var full = (l.spaceName + ' ' + l.name).toLowerCase();
    return words.every(function(w) { return full.includes(w); });
  });

  if (!matches.length) {
    dd.innerHTML = '<div class="ac-option" style="color:#555;cursor:default">Sin resultados</div>';
    dd.classList.add('open');
    return;
  }

  // Agrupar por space
  var groups = {};
  matches.forEach(function(l) {
    if (!groups[l.spaceName]) groups[l.spaceName] = [];
    groups[l.spaceName].push(l);
  });

  Object.keys(groups).forEach(function(spaceName) {
    var gl = document.createElement('div'); gl.className = 'ac-group-label'; gl.textContent = spaceName;
    dd.appendChild(gl);
    groups[spaceName].forEach(function(l) {
      var opt = document.createElement('div'); opt.className = 'ac-option';
      opt.innerHTML = resaltarMatch(esc(l.name), words);
      opt.onmousedown = function(e) {
        e.preventDefault();
        seleccionarLista(l.id, l.name, l.spaceName);
      };
      dd.appendChild(opt);
    });
  });
  dd.classList.add('open');
}

function seleccionarLista(id, name, spaceName) {
  document.getElementById('c-lista').value = id;
  document.getElementById('c-lista-search').value = spaceName + ' — ' + name;
  document.getElementById('lista-dropdown').classList.remove('open');
}

function mostrarDropdown() {
  var q = document.getElementById('c-lista-search').value;
  if (q.trim()) filtrarListas(q);
}

function ocultarDropdown() {
  setTimeout(function() {
    document.getElementById('lista-dropdown').classList.remove('open');
  }, 150);
}

function resaltarMatch(text, words) {
  var result = text;
  words.forEach(function(w) {
    var re = new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    result = result.replace(re, '<mark>$1</mark>');
  });
  return result;
}

// ─── NAV ─────────────────────────────────────────────────

function switchTab(name, btn) {
  document.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.remove('active'); });
  document.querySelectorAll('.nav-item').forEach(function(b) { b.classList.remove('active'); });
  document.getElementById('tab-' + name).classList.add('active');
  if (btn) btn.classList.add('active');
}

// ─── API ─────────────────────────────────────────────────

function ck(path, opts, key) {
  var k = key || apiKey;
  opts = opts || {};
  opts.headers = Object.assign({ 'Authorization': k, 'Content-Type': 'application/json' }, opts.headers || {});
  return fetch('https://api.clickup.com/api/v2' + path, opts).then(function(r) { return r.json(); });
}

// ─── TIEMPO ──────────────────────────────────────────────

async function registrarTiempo(taskId, minutos) {
  var durMs = minutos * 60 * 1000;
  var start = Date.now() - durMs;
  // ClickUp time entries API: números, no strings
  var resp = await ck('/team/' + WORKSPACE + '/time_entries', {
    method: 'POST',
    body: JSON.stringify({
      tid: taskId,
      start: start,
      duration: durMs,
      billable: false,
      assignee: currentUserId
    })
  });
  if (resp.err) {
    console.error('Error time_entries:', resp.err);
  }
  return resp;
}

// ─── CREAR ───────────────────────────────────────────────

async function crearTarea() {
  var nombre = document.getElementById('c-nombre').value.trim();
  var lista  = document.getElementById('c-lista').value;
  if (!nombre) { showToast('toast-crear', 'err', 'El nombre es obligatorio'); return; }
  if (!lista)  { showToast('toast-crear', 'err', 'Seleccioná una lista'); return; }

  var body = {
    name: nombre,
    status: document.getElementById('c-estado').value,
    assignees: currentUserId ? [currentUserId] : [],
    custom_fields: [],
    start_date: Date.now(),
    start_date_time: true
  };

  var tipo = document.getElementById('c-tipo').value;
  var sub  = document.getElementById('c-sub').value;
  var pod  = document.getElementById('c-pod').value;
  if (tipo !== '') body.custom_fields.push({ id: CAMPOS.tipo, value: parseInt(tipo) });
  if (sub  !== '') body.custom_fields.push({ id: CAMPOS.sub,  value: parseInt(sub)  });
  if (pod  !== '') body.custom_fields.push({ id: CAMPOS.pod,  value: parseInt(pod)  });

  var btn = document.querySelector('#tab-crear .btn-primary');
  btn.disabled = true; btn.textContent = 'Creando...';
  try {
    var data = await ck('/list/' + lista + '/task', { method: 'POST', body: JSON.stringify(body) });
    if (!data.id) { showToast('toast-crear', 'err', 'Error: ' + (data.err || JSON.stringify(data))); return; }
    var minutos = parseInt(document.getElementById('c-tiempo').value) || 0;
    if (minutos > 0) await registrarTiempo(data.id, minutos);
    showToast('toast-crear', 'ok', '✓ Tarea creada: <a href="' + data.url + '" target="_blank">' + esc(data.name) + '</a>');
    addHist(data.name, data.url, 'creada');
    limpiarFormCrear();
  } catch(e) {
    showToast('toast-crear', 'err', 'Error: ' + e.message);
  } finally {
    btn.disabled = false; btn.textContent = 'Crear tarea';
  }
}

function limpiarFormCrear() {
  ['c-nombre','c-tiempo'].forEach(function(id) { document.getElementById(id).value = ''; });
  ['c-tipo','c-sub','c-pod','c-prioridad'].forEach(function(id) { document.getElementById(id).selectedIndex = 0; });
  document.getElementById('c-estado').value = 'to do';
}

// ─── EDITAR ──────────────────────────────────────────────

async function cargarTarea() {
  var raw = document.getElementById('e-id').value.trim();
  var id  = raw.replace(/.*\/t\//, '').split('/')[0].trim();
  if (!id) { showToast('toast-editar', 'err', 'Ingresá un ID o URL válido'); return; }
  currentTaskId = id;
  document.getElementById('edit-form').classList.add('hidden');
  var btn = document.querySelector('#tab-editar .btn-secondary');
  btn.textContent = 'Cargando...'; btn.disabled = true;
  try {
    var t = await ck('/task/' + id);
    if (!t.id) { showToast('toast-editar', 'err', 'Tarea no encontrada'); return; }
    document.getElementById('e-nombre').value    = t.name || '';
    document.getElementById('e-estado').value    = (t.status && t.status.status) || 'to do';
    document.getElementById('e-prioridad').value = (t.priority && t.priority.priority) || '';
    document.getElementById('e-tiempo').value    = '';
    document.getElementById('e-link').href        = t.url || '#';
    ['e-tipo','e-sub','e-pod'].forEach(function(id) { document.getElementById(id).selectedIndex = 0; });
    (t.custom_fields || []).forEach(function(f) {
      if (f.value === null || f.value === undefined) return;
      if (f.id === CAMPOS.tipo) setSelect('e-tipo', String(f.value));
      if (f.id === CAMPOS.sub)  setSelect('e-sub',  String(f.value));
      if (f.id === CAMPOS.pod)  setSelect('e-pod',  String(f.value));
    });
    document.getElementById('edit-form').classList.remove('hidden');
  } catch(e) {
    showToast('toast-editar', 'err', 'Error: ' + e.message);
  } finally {
    btn.textContent = 'Cargar'; btn.disabled = false;
  }
}

async function guardarEdicion() {
  if (!currentTaskId) return;
  var body = {
    name: document.getElementById('e-nombre').value,
    status: document.getElementById('e-estado').value,
    custom_fields: []
  };
  var tipo = document.getElementById('e-tipo').value;
  var sub  = document.getElementById('e-sub').value;
  var pod  = document.getElementById('e-pod').value;
  if (tipo !== '') body.custom_fields.push({ id: CAMPOS.tipo, value: parseInt(tipo) });
  if (sub  !== '') body.custom_fields.push({ id: CAMPOS.sub,  value: parseInt(sub)  });
  if (pod  !== '') body.custom_fields.push({ id: CAMPOS.pod,  value: parseInt(pod)  });
  var btn = document.querySelector('#tab-editar .btn-primary');
  btn.disabled = true; btn.textContent = 'Guardando...';
  try {
    await ck('/task/' + currentTaskId, { method: 'PUT', body: JSON.stringify(body) });
    var minutos = parseInt(document.getElementById('e-tiempo').value) || 0;
    if (minutos > 0) await registrarTiempo(currentTaskId, minutos);
    showToast('toast-editar', 'ok', '✓ Cambios guardados. <a href="https://app.clickup.com/t/' + currentTaskId + '" target="_blank">Ver en ClickUp</a>');
    addHist(document.getElementById('e-nombre').value, 'https://app.clickup.com/t/' + currentTaskId, 'editada');
  } catch(e) {
    showToast('toast-editar', 'err', 'Error: ' + e.message);
  } finally {
    btn.disabled = false; btn.textContent = 'Guardar cambios';
  }
}

// ─── BUSCAR ──────────────────────────────────────────────

async function buscar() {
  var q = document.getElementById('search-q').value.trim();
  if (!q) return;
  var cont = document.getElementById('search-results');
  cont.innerHTML = '<div class="empty-state"><p>Buscando...</p></div>';
  var words = q.toLowerCase().split(/\s+/).filter(Boolean);
  try {
    var assigneeParam = currentUserId ? '&assignees[]=' + currentUserId : '';
    var data = await ck('/team/' + WORKSPACE + '/task?query=' + encodeURIComponent(q) + assigneeParam + '&page=0&subtasks=true&include_closed=true');
    var tasks = data.tasks || [];
    var filtered = tasks.filter(function(t) {
      var name = (t.name||'').toLowerCase();
      var list = (t.list&&t.list.name||'').toLowerCase();
      return words.every(function(w) { return name.includes(w) || list.includes(w); });
    });
    var toShow = filtered.length > 0 ? filtered : tasks;
    if (!toShow.length) { cont.innerHTML = '<div class="empty-state"><p>Sin resultados para "' + esc(q) + '"</p></div>'; return; }
    cont.innerHTML = '';
    toShow.slice(0,15).forEach(function(t) {
      var st = (t.status&&t.status.status)||'';
      var stClass = st.toLowerCase().replace(/\s/g,'');
      var card = document.createElement('div'); card.className = 'task-card';
      card.innerHTML = '<div class="tname">' + highlightMatch(esc(t.name), words) + '</div>' +
        '<div class="tmeta"><span class="status-pill ' + stClass + '">' + esc(st) + '</span>' +
        (t.list ? '<span>' + esc(t.list.name) + '</span>' : '') +
        '<a href="' + t.url + '" target="_blank">ver</a>' +
        '<button class="edit-link" onclick="cargarParaEditar(\'' + t.id + '\')">editar</button></div>';
      cont.appendChild(card);
    });
    if (toShow.length > 15) {
      var more = document.createElement('p');
      more.style.cssText = 'font-size:12px;color:#555;text-align:center;padding:8px';
      more.textContent = 'Mostrando 15 de ' + toShow.length + '. Refiná la búsqueda.';
      cont.appendChild(more);
    }
  } catch(e) { cont.innerHTML = '<div class="empty-state"><p>Error: ' + e.message + '</p></div>'; }
}

function highlightMatch(text, words) {
  var result = text;
  words.forEach(function(w) {
    var re = new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    result = result.replace(re, '<mark style="background:rgba(212,255,78,0.25);color:inherit;border-radius:2px">$1</mark>');
  });
  return result;
}

function cargarParaEditar(id) {
  document.getElementById('e-id').value = id;
  switchTab('editar', document.querySelector('[data-tab="editar"]'));
  cargarTarea();
}

// ─── HISTORIAL ───────────────────────────────────────────

function addHist(name, url, action) {
  var cont = document.getElementById('hist-list');
  if (histCount === 0) cont.innerHTML = '';
  histCount++;
  var now = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  var item = document.createElement('div'); item.className = 'hist-item';
  item.innerHTML = '<span class="hname">' + esc(name) + '<span class="haction">' + action + '</span></span>' +
    '<span class="hmeta"><span class="htime">' + now + '</span><a href="' + url + '" target="_blank">ver</a></span>';
  cont.insertBefore(item, cont.firstChild);
}

// ─── UTILS ───────────────────────────────────────────────

function showToast(id, type, html) {
  var el = document.getElementById(id);
  el.className = 'toast ' + type;
  el.innerHTML = html;
}

function setSelect(id, val) {
  var el = document.getElementById(id);
  for (var i = 0; i < el.options.length; i++) {
    if (el.options[i].value === val) { el.selectedIndex = i; return; }
  }
}

function esc(s) {
  return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

document.getElementById('login-key').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') doLogin();
});
