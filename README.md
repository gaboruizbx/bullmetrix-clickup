# Bullmetrix — ClickUp Assistant

App web para crear, editar y buscar tareas en ClickUp sin fricción.

## Deploy en GitHub Pages (5 minutos)

### 1. Crear el repositorio
- Entrá a [github.com](https://github.com) y logueate
- Clic en **New repository**
- Nombre: `bullmetrix-clickup` (o el que quieras)
- Visibility: **Private** (recomendado, la app es interna)
- Clic en **Create repository**

### 2. Subir los archivos
Tenés dos opciones:

**Opción A — desde la web (más fácil):**
- En el repo recién creado, clic en **uploading an existing file**
- Arrastrá los 3 archivos: `index.html`, `styles.css`, `app.js`
- Clic en **Commit changes**

**Opción B — desde la terminal:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TU_USUARIO/bullmetrix-clickup.git
git push -u origin main
```

### 3. Activar GitHub Pages
- En el repo, ir a **Settings** → **Pages**
- Source: **Deploy from a branch**
- Branch: **main** → **/ (root)**
- Clic en **Save**

### 4. Tu URL
En 1-2 minutos la app estará disponible en:
```
https://TU_USUARIO.github.io/bullmetrix-clickup/
```

Compartí esa URL con tu equipo.

## Uso

1. Cada analista ingresa con su propia **API Key de ClickUp**
   - ClickUp → avatar abajo izquierda → Settings → Apps → API Token
2. La key se guarda en sessionStorage (se borra al cerrar el browser, no se envía a ningún servidor)

## Agregar más listas/clientes

Editá `index.html` y buscá los `<optgroup>` dentro de los selects `c-lista`. Agregá más opciones con el ID de lista de ClickUp.

Para obtener el ID de una lista: abrís la lista en ClickUp y copiás el número de la URL.

## Archivos
- `index.html` — estructura de la app
- `styles.css` — estilos
- `app.js` — lógica y llamadas a la API de ClickUp
