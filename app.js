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

// ─── LISTAS HARDCODEADAS ─────────────────────────────────
// Para agregar un cliente: agregá filas con { id, name, spaceName }
// y guardá el archivo en GitHub.
var todasLasListas = [
  // FLYBONDI
  {id:"901408387467",name:"Interno",spaceName:"BM - Flybondi"},
  {id:"901408387473",name:"Kick Off",spaceName:"BM - Flybondi"},
  {id:"901408387482",name:"Pedidos de clientes",spaceName:"BM - Flybondi"},
  {id:"901408387485",name:"Iniciativas",spaceName:"BM - Flybondi"},
  {id:"901408387491",name:"Optimización",spaceName:"BM - Flybondi"},
  {id:"901408387498",name:"Relación con clientes",spaceName:"BM - Flybondi"},
  {id:"901408387506",name:"Dashboards",spaceName:"BM - Flybondi"},
  {id:"901408387510",name:"Brainstorming",spaceName:"BM - Flybondi"},
  {id:"901408387512",name:"Auditoría",spaceName:"BM - Flybondi"},
  // FRÁVEGA
  {id:"900200176989",name:"Team Task",spaceName:"BM - Frávega"},
  {id:"900200176991",name:"Optimización DP / DV / YT",spaceName:"BM - Frávega"},
  {id:"900200176993",name:"Optimización Search",spaceName:"BM - Frávega"},
  {id:"900200176992",name:"Optimización Meta",spaceName:"BM - Frávega"},
  // CAMUZZI
  {id:"901408387121",name:"Kick Off",spaceName:"BM - CAMUZZI"},
  {id:"901408387127",name:"Pedidos de Clientes",spaceName:"BM - CAMUZZI"},
  {id:"901408387131",name:"Iniciativas",spaceName:"BM - CAMUZZI"},
  {id:"901408387136",name:"Optimización",spaceName:"BM - CAMUZZI"},
  {id:"901408387142",name:"Relación con clientes",spaceName:"BM - CAMUZZI"},
  {id:"901408387150",name:"Dashboards",spaceName:"BM - CAMUZZI"},
  {id:"901408387160",name:"Brainstorming",spaceName:"BM - CAMUZZI"},
  {id:"901408387168",name:"Auditoría",spaceName:"BM - CAMUZZI"},
  {id:"901408387175",name:"Interno",spaceName:"BM - CAMUZZI"},
  // EQUIFAX
  {id:"901408387348",name:"Kick Off",spaceName:"BM - Equifax"},
  {id:"901408387354",name:"Pedidos de clientes",spaceName:"BM - Equifax"},
  {id:"901408387359",name:"Iniciativas",spaceName:"BM - Equifax"},
  {id:"901408387365",name:"Optimización",spaceName:"BM - Equifax"},
  {id:"901408387373",name:"Relación con clientes",spaceName:"BM - Equifax"},
  {id:"901408387380",name:"Dashboards",spaceName:"BM - Equifax"},
  {id:"901408387385",name:"Brainstorming",spaceName:"BM - Equifax"},
  {id:"901408387388",name:"Auditoría",spaceName:"BM - Equifax"},
  {id:"901408387393",name:"Interno",spaceName:"BM - Equifax"},
  // BIND
  {id:"901412489402",name:"Kick off",spaceName:"BIND"},
  {id:"901412489394",name:"Pedidos Cliente",spaceName:"BIND"},
  {id:"901412489397",name:"Iniciativas",spaceName:"BIND"},
  {id:"901412489403",name:"Optimización",spaceName:"BIND"},
  {id:"901412489400",name:"Analisis | Experimentos",spaceName:"BIND"},
  {id:"901412489399",name:"Relación con clientes",spaceName:"BIND"},
  {id:"901412489396",name:"Dashboards",spaceName:"BIND"},
  {id:"901412489395",name:"Auditoria",spaceName:"BIND"},
  {id:"901412489401",name:"Brainstorming",spaceName:"BIND"},
  {id:"901412489428",name:"Minutas",spaceName:"BIND"},
  // PAGGO
  {id:"901415899217",name:"Interno",spaceName:"BM - Paggo"},
  {id:"901415899360",name:"Kick Off",spaceName:"BM - Paggo"},
  {id:"901415899392",name:"Pedidos de clientes",spaceName:"BM - Paggo"},
  {id:"901415899497",name:"Iniciativas",spaceName:"BM - Paggo"},
  {id:"901415899316",name:"Optimización",spaceName:"BM - Paggo"},
  {id:"901415899216",name:"Relación con clientes",spaceName:"BM - Paggo"},
  {id:"901415899589",name:"Dashboards",spaceName:"BM - Paggo"},
  {id:"901415899561",name:"Brainstorming",spaceName:"BM - Paggo"},
  {id:"901415899572",name:"Auditoría",spaceName:"BM - Paggo"},
  // SODIMAC UY
  {id:"901408247272",name:"Kick off",spaceName:"BM - Sodimac UY"},
  {id:"901403361479",name:"Pedidos Cliente",spaceName:"BM - Sodimac UY"},
  {id:"900200607086",name:"Iniciativas",spaceName:"BM - Sodimac UY"},
  {id:"901408357128",name:"Optimización",spaceName:"BM - Sodimac UY"},
  {id:"901408357151",name:"Relación con clientes",spaceName:"BM - Sodimac UY"},
  {id:"901408357161",name:"Dashboards",spaceName:"BM - Sodimac UY"},
  {id:"901408357179",name:"Auditoria",spaceName:"BM - Sodimac UY"},
  {id:"900200607089",name:"Brainstorming",spaceName:"BM - Sodimac UY"},
  {id:"901408357195",name:"Interno",spaceName:"BM - Sodimac UY"},
  // SODIMAC ARG
  {id:"901408357210",name:"Kick Off",spaceName:"BM - Sodimac ARG"},
  {id:"901401966048",name:"Pedidos Cliente",spaceName:"BM - Sodimac ARG"},
  {id:"901401966068",name:"Iniciativas",spaceName:"BM - Sodimac ARG"},
  {id:"901408357226",name:"Optimización",spaceName:"BM - Sodimac ARG"},
  {id:"901408357244",name:"Relación con clientes",spaceName:"BM - Sodimac ARG"},
  {id:"901408357318",name:"Dashboards",spaceName:"BM - Sodimac ARG"},
  {id:"901408357278",name:"Auditoria",spaceName:"BM - Sodimac ARG"},
  {id:"901403361650",name:"Brainstorming",spaceName:"BM - Sodimac ARG"},
  {id:"901408357304",name:"Interno",spaceName:"BM - Sodimac ARG"},
  // DESPEGAR
  {id:"900200611065",name:"Inbox",spaceName:"BM - Despegar"},
  {id:"900200611066",name:"Brainstorming",spaceName:"BM - Despegar"},
  {id:"900200611064",name:"Optimización",spaceName:"BM - Despegar"},
  {id:"900200611062",name:"Seguimiento",spaceName:"BM - Despegar"},
  {id:"900200611068",name:"Pedidos",spaceName:"BM - Despegar"},
  // LEMON
  {id:"900201309310",name:"Analisis | Experimentos",spaceName:"BM - LEMON"},
  {id:"900201309311",name:"Pedidos",spaceName:"BM - LEMON"},
  {id:"901407904394",name:"Optimización",spaceName:"BM - LEMON"},
  {id:"901407907085",name:"Auditoría",spaceName:"BM - LEMON"},
  {id:"901407907106",name:"Relación con clientes",spaceName:"BM - LEMON"},
  {id:"901409797063",name:"Interno",spaceName:"BM - LEMON"},
  // RAPPI
  {id:"901408374159",name:"Pedidos Cliente",spaceName:"BM - Rappi"},
  {id:"901408374175",name:"Iniciativas",spaceName:"BM - Rappi"},
  {id:"901408374189",name:"Optimización",spaceName:"BM - Rappi"},
  {id:"901408374217",name:"Relación con Clientes",spaceName:"BM - Rappi"},
  {id:"901408374276",name:"Dashboards",spaceName:"BM - Rappi"},
  {id:"901408374298",name:"Auditoría",spaceName:"BM - Rappi"},
  {id:"901408374321",name:"Brainstorming",spaceName:"BM - Rappi"},
  {id:"901408374330",name:"Interno",spaceName:"BM - Rappi"},
  // NALDO
  {id:"901408408831",name:"Pedidos cliente",spaceName:"BM - Naldo"},
  {id:"901408408873",name:"Optimización",spaceName:"BM - Naldo"},
  {id:"901408408904",name:"Iniciativas",spaceName:"BM - Naldo"},
  {id:"901408408920",name:"Relación con Clientes",spaceName:"BM - Naldo"},
  {id:"901408408933",name:"Dashboards",spaceName:"BM - Naldo"},
  {id:"901408408948",name:"Auditoría",spaceName:"BM - Naldo"},
  {id:"901408408970",name:"Brainstorming",spaceName:"BM - Naldo"},
  {id:"901408408984",name:"Interno",spaceName:"BM - Naldo"},
  // CINEMARK
  {id:"901408376032",name:"Kick Off",spaceName:"BM - CinemarkHoyts"},
  {id:"901408376141",name:"Iniciativas",spaceName:"BM - CinemarkHoyts"},
  {id:"901408376156",name:"Optimización",spaceName:"BM - CinemarkHoyts"},
  {id:"901408376193",name:"Relación con clientes",spaceName:"BM - CinemarkHoyts"},
  {id:"901408376216",name:"Auditoría",spaceName:"BM - CinemarkHoyts"},
  {id:"901408376244",name:"Brainstorming",spaceName:"BM - CinemarkHoyts"},
  {id:"901408376261",name:"Dashboards",spaceName:"BM - CinemarkHoyts"},
  {id:"901408376263",name:"Interno",spaceName:"BM - CinemarkHoyts"},
  {id:"901408391102",name:"Pedidos de clientes",spaceName:"BM - CinemarkHoyts"},
  // FORUS / UNDER ARMOUR AR
  {id:"901408409204",name:"Pedidos cliente",spaceName:"BM - Forus / Under AR"},
  {id:"901408409230",name:"Iniciativas",spaceName:"BM - Forus / Under AR"},
  {id:"901408409240",name:"Optimización",spaceName:"BM - Forus / Under AR"},
  {id:"901408409272",name:"Relación con cliente",spaceName:"BM - Forus / Under AR"},
  {id:"901408409286",name:"Dashboards",spaceName:"BM - Forus / Under AR"},
  {id:"901408409287",name:"Auditoría",spaceName:"BM - Forus / Under AR"},
  {id:"901408409300",name:"Brainstorming",spaceName:"BM - Forus / Under AR"},
  {id:"901408409321",name:"Interno",spaceName:"BM - Forus / Under AR"},
  // PEUGEOT
  {id:"901408247168",name:"Kick off",spaceName:"BM - Peugeot"},
  {id:"901408247166",name:"Pedidos Cliente",spaceName:"BM - Peugeot"},
  {id:"901408247172",name:"Iniciativas",spaceName:"BM - Peugeot"},
  {id:"901408247167",name:"Optimización",spaceName:"BM - Peugeot"},
  {id:"901408247173",name:"Relación con clientes",spaceName:"BM - Peugeot"},
  {id:"901408247171",name:"Dashboards",spaceName:"BM - Peugeot"},
  {id:"901408247175",name:"Auditoria",spaceName:"BM - Peugeot"},
  {id:"901408247174",name:"Brainstorming",spaceName:"BM - Peugeot"},
  {id:"901408247170",name:"Interno",spaceName:"BM - Peugeot"},
  // DAEWOO
  {id:"901408247213",name:"Kick off",spaceName:"BM - Daewoo"},
  {id:"901408247199",name:"Pedidos Cliente",spaceName:"BM - Daewoo"},
  {id:"901408247210",name:"Iniciativas",spaceName:"BM - Daewoo"},
  {id:"901408247209",name:"Optimización",spaceName:"BM - Daewoo"},
  {id:"901408247200",name:"Relación con clientes",spaceName:"BM - Daewoo"},
  {id:"901408247207",name:"Dashboards",spaceName:"BM - Daewoo"},
  {id:"901408247203",name:"Auditoria",spaceName:"BM - Daewoo"},
  {id:"901408247208",name:"Brainstorming",spaceName:"BM - Daewoo"},
  {id:"901408247211",name:"Interno",spaceName:"BM - Daewoo"},
  // FARMACITY
  {id:"901408294633",name:"Pedidos Cliente",spaceName:"BM - Grupo Farmacity"},
  {id:"901408294640",name:"Iniciativas",spaceName:"BM - Grupo Farmacity"},
  {id:"901408294634",name:"Optimización",spaceName:"BM - Grupo Farmacity"},
  {id:"901408294641",name:"Relación con clientes",spaceName:"BM - Grupo Farmacity"},
  {id:"901408294639",name:"Dashboards",spaceName:"BM - Grupo Farmacity"},
  {id:"901408294643",name:"Auditoria",spaceName:"BM - Grupo Farmacity"},
  {id:"901408294638",name:"Interno",spaceName:"BM - Grupo Farmacity"},
  // ICARO
  {id:"901409964304",name:"Kick off",spaceName:"BM - ICARO"},
  {id:"901409964538",name:"Pedidos Cliente",spaceName:"BM - ICARO"},
  {id:"901409964537",name:"Iniciativas",spaceName:"BM - ICARO"},
  {id:"901409964403",name:"Optimización",spaceName:"BM - ICARO"},
  {id:"901409964226",name:"Relación con Clientes",spaceName:"BM - ICARO"},
  {id:"901409964531",name:"Dashboards",spaceName:"BM - ICARO"},
  {id:"901409964273",name:"Auditoría",spaceName:"BM - ICARO"},
  {id:"901409964301",name:"Brainstorming",spaceName:"BM - ICARO"},
  {id:"901409964308",name:"Interno",spaceName:"BM - ICARO"},
  // GALICIA PYMES
  {id:"901410642764",name:"Analisis | Experimentos",spaceName:"BM - GALICIA PYMES"},
  {id:"901410642449",name:"Pedidos",spaceName:"BM - GALICIA PYMES"},
  {id:"901410643014",name:"Optimización",spaceName:"BM - GALICIA PYMES"},
  {id:"901410643088",name:"Auditoría",spaceName:"BM - GALICIA PYMES"},
  {id:"901410643190",name:"Relación con clientes",spaceName:"BM - GALICIA PYMES"},
  {id:"901410642957",name:"Interno",spaceName:"BM - GALICIA PYMES"},
  // FINVOI
  {id:"901412151282",name:"Kick Off",spaceName:"BM - Finvoi"},
  {id:"901412151281",name:"Pedidos Clientes",spaceName:"BM - Finvoi"},
  {id:"901412151244",name:"Iniciativas",spaceName:"BM - Finvoi"},
  {id:"901412151267",name:"Optimización",spaceName:"BM - Finvoi"},
  {id:"901412151272",name:"Relación con clientes",spaceName:"BM - Finvoi"},
  {id:"901412151286",name:"Dashboards",spaceName:"BM - Finvoi"},
  {id:"901412151287",name:"Brainstorming",spaceName:"BM - Finvoi"},
  {id:"901412151275",name:"Auditoría",spaceName:"BM - Finvoi"},
  {id:"901412151234",name:"Interno",spaceName:"BM - Finvoi"},
  // FORUS CHILE
  {id:"901412514274",name:"Kick off",spaceName:"BM - Forus Chile"},
  {id:"901412514267",name:"Pedidos Cliente",spaceName:"BM - Forus Chile"},
  {id:"901412514289",name:"Iniciativas",spaceName:"BM - Forus Chile"},
  {id:"901412514268",name:"Optimización",spaceName:"BM - Forus Chile"},
  {id:"901412514290",name:"Relación con clientes",spaceName:"BM - Forus Chile"},
  {id:"901412514288",name:"Dashboards",spaceName:"BM - Forus Chile"},
  {id:"901412514293",name:"Auditoria",spaceName:"BM - Forus Chile"},
  {id:"901412514291",name:"Brainstorming",spaceName:"BM - Forus Chile"},
  {id:"901412514287",name:"Interno",spaceName:"BM - Forus Chile"},
  // X-28
  {id:"901408386961",name:"Kick Off",spaceName:"BM - X-28"},
  {id:"901408386978",name:"Interno",spaceName:"BM - X-28"},
  {id:"901408386983",name:"Pedidos de Clientes",spaceName:"BM - X-28"},
  {id:"901408386987",name:"Iniciativas",spaceName:"BM - X-28"},
  {id:"901408386996",name:"Optimización",spaceName:"BM - X-28"},
  {id:"901408387005",name:"Relación con Clientes",spaceName:"BM - X-28"},
  {id:"901408387014",name:"Auditoría",spaceName:"BM - X-28"},
  {id:"901408387029",name:"Brainstorming",spaceName:"BM - X-28"},
  // KARVI
  {id:"901402957644",name:"Kick off",spaceName:"BM - Karvi"},
  {id:"901402957643",name:"Pedidos Cliente",spaceName:"BM - Karvi"},
  {id:"901402959434",name:"Iniciativas",spaceName:"BM - Karvi"},
  {id:"901402957637",name:"Optimización",spaceName:"BM - Karvi"},
  {id:"901402957642",name:"Analisis | Experimentos",spaceName:"BM - Karvi"},
  {id:"901402957633",name:"Relación con clientes",spaceName:"BM - Karvi"},
  {id:"901402957640",name:"Auditoria",spaceName:"BM - Karvi"},
  {id:"901402957646",name:"Brainstorming",spaceName:"BM - Karvi"},
  // RE-USE
  {id:"901409734985",name:"Pedidos Cliente",spaceName:"BM - Re-Use"},
  {id:"901409735175",name:"Iniciativas",spaceName:"BM - Re-Use"},
  {id:"901409735094",name:"Auditoría",spaceName:"BM - Re-Use"},
  {id:"901409735271",name:"Optimización",spaceName:"BM - Re-Use"},
  {id:"901409735302",name:"Relación con clientes",spaceName:"BM - Re-Use"},
  {id:"901409763894",name:"Interno",spaceName:"BM - Re-Use"},
  // KANSAI - TOYOTA
  {id:"901408375437",name:"Kick Off",spaceName:"Kansai - Toyota"},
  {id:"901408375452",name:"Pedidos Cliente",spaceName:"Kansai - Toyota"},
  {id:"901408375465",name:"Iniciativas",spaceName:"Kansai - Toyota"},
  {id:"901408375327",name:"Optimización",spaceName:"Kansai - Toyota"},
  {id:"901408375393",name:"Relacion con cliente",spaceName:"Kansai - Toyota"},
  {id:"901408375359",name:"Dashboard",spaceName:"Kansai - Toyota"},
  {id:"901408375263",name:"Auditoria",spaceName:"Kansai - Toyota"},
  {id:"901408375308",name:"Brainstorming",spaceName:"Kansai - Toyota"},
  {id:"901408375487",name:"Interno",spaceName:"Kansai - Toyota"},
  // CREDICUOTAS
  {id:"901408173298",name:"Kick Off",spaceName:"BM - Credicuotas"},
  {id:"901408173343",name:"Pedidos de Cliente",spaceName:"BM - Credicuotas"},
  {id:"901408173372",name:"Iniciativas",spaceName:"BM - Credicuotas"},
  {id:"901408173382",name:"Optimización",spaceName:"BM - Credicuotas"},
  {id:"901408173399",name:"Relación con Cliente",spaceName:"BM - Credicuotas"},
  {id:"901408174426",name:"Dashboards",spaceName:"BM - Credicuotas"},
  {id:"901408174379",name:"Auditoría",spaceName:"BM - Credicuotas"},
  {id:"901408174406",name:"Brainstorming",spaceName:"BM - Credicuotas"},
  {id:"901408174423",name:"Interno",spaceName:"BM - Credicuotas"},
  // HIDROAL
  {id:"901408772554",name:"Kick off",spaceName:"BM Hidroal"},
  {id:"901408772551",name:"Pedidos Cliente",spaceName:"BM Hidroal"},
  {id:"901408772558",name:"Iniciativas",spaceName:"BM Hidroal"},
  {id:"901408772552",name:"Optimización",spaceName:"BM Hidroal"},
  {id:"901408772559",name:"Relación con clientes",spaceName:"BM Hidroal"},
  {id:"901408772557",name:"Dashboards",spaceName:"BM Hidroal"},
  {id:"901408772563",name:"Auditoria",spaceName:"BM Hidroal"},
  {id:"901408772562",name:"Brainstorming",spaceName:"BM Hidroal"},
  {id:"901408772556",name:"Interno",spaceName:"BM Hidroal"},
  // MEDIA SERVICES
  {id:"901412689673",name:"Kick Off",spaceName:"BM - Media Services"},
  {id:"901412689677",name:"Pedidos de Clientes",spaceName:"BM - Media Services"},
  {id:"901412689729",name:"Iniciativas",spaceName:"BM - Media Services"},
  {id:"901412689691",name:"Optimización",spaceName:"BM - Media Services"},
  {id:"901412689707",name:"Relación con clientes",spaceName:"BM - Media Services"},
  {id:"901412689710",name:"Dashboards",spaceName:"BM - Media Services"},
  {id:"901412689715",name:"Auditoría",spaceName:"BM - Media Services"},
  // THE CHEMIST LOOK
  {id:"901413972491",name:"Kick off",spaceName:"BM - The Chemist Look"},
  {id:"901413972504",name:"Inbox",spaceName:"BM - The Chemist Look"},
  {id:"901413972503",name:"Pedidos Cliente",spaceName:"BM - The Chemist Look"},
  {id:"901413972490",name:"Iniciativas",spaceName:"BM - The Chemist Look"},
  {id:"901413972502",name:"Optimización",spaceName:"BM - The Chemist Look"},
  {id:"901413972501",name:"Analisis | Experimentos",spaceName:"BM - The Chemist Look"},
  {id:"901413972500",name:"Relación con clientes",spaceName:"BM - The Chemist Look"},
  {id:"901413972492",name:"Auditoria",spaceName:"BM - The Chemist Look"},
  {id:"901413972506",name:"Interno",spaceName:"BM - The Chemist Look"},
  // GWSTORE
  {id:"901414389885",name:"Analisis | Experimentos",spaceName:"BM - GWSTORE"},
  {id:"901414389847",name:"Pedidos",spaceName:"BM - GWSTORE"},
  {id:"901414389938",name:"Optimización",spaceName:"BM - GWSTORE"},
  {id:"901414389971",name:"Auditoría",spaceName:"BM - GWSTORE"},
  {id:"901414389994",name:"Relación con clientes",spaceName:"BM - GWSTORE"},
  {id:"901414389924",name:"Interno",spaceName:"BM - GWSTORE"}
];
var listasListas = true; // ya están cargadas
var cargandoListas = false;

function cargarListasDinamicas() { /* listas hardcodeadas, carga instantánea */ }
async function asegurarListasCargadas() { /* no-op */ }

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
  if (name === 'myday') renderMyday();
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
    addHist(data.name, data.url, 'creada', document.getElementById('c-lista-search') ? document.getElementById('c-lista-search').value : '');
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
    addHist(document.getElementById('e-nombre').value, 'https://app.clickup.com/t/' + currentTaskId, 'editada', '');
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

function getTareasHoy() {
  var hoy = new Date().toDateString();
  var data = localStorage.getItem('bm_myday');
  if (!data) return [];
  try { var p = JSON.parse(data); return p.fecha === hoy ? (p.tareas || []) : []; } catch(e) { return []; }
}

function saveTareasHoy(tareas) {
  localStorage.setItem('bm_myday', JSON.stringify({ fecha: new Date().toDateString(), tareas: tareas }));
}

function renderMyday() {
  var tareas = getTareasHoy();
  var cont = document.getElementById('myday-list');
  var count = document.getElementById('myday-count');
  if (count) count.textContent = tareas.length + (tareas.length === 1 ? ' tarea' : ' tareas');
  if (!tareas.length) { cont.innerHTML = '<div class="empty-state"><p>Todavía no registraste tareas hoy</p></div>'; return; }
  cont.innerHTML = '';
  tareas.slice().reverse().forEach(function(t) {
    var item = document.createElement('div'); item.className = 'myday-item';
    item.innerHTML = '<div><div class="mname">' + esc(t.name) + '</div>' +
      '<div style="font-size:11px;color:var(--text-muted);margin-top:2px">' + esc(t.lista || '') + '</div></div>' +
      '<div class="mmeta"><span class="maction">' + t.action + '</span>' +
      '<span class="mtime">' + t.time + '</span>' +
      '<a href="' + t.url + '" target="_blank">ver en ClickUp →</a></div>';
    cont.appendChild(item);
  });
}

function addHist(name, url, action, listaNombre) {
  var cont = document.getElementById('hist-list');
  if (histCount === 0) cont.innerHTML = '';
  histCount++;
  var now = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  var item = document.createElement('div'); item.className = 'hist-item';
  item.innerHTML = '<span class="hname">' + esc(name) + '<span class="haction">' + action + '</span></span>' +
    '<span class="hmeta"><span class="htime">' + now + '</span><a href="' + url + '" target="_blank">ver</a></span>';
  cont.insertBefore(item, cont.firstChild);
  var tareas = getTareasHoy();
  tareas.push({ name: name, url: url, action: action, time: now, lista: listaNombre || '' });
  saveTareasHoy(tareas);
  var count = document.getElementById('myday-count');
  if (count) count.textContent = tareas.length + (tareas.length === 1 ? ' tarea' : ' tareas');
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
