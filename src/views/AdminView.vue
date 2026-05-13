<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import {
  esAdmin, getAllUsers, getAllArtworksAdmin,
  deleteArtworkAdmin, setAdminRole, getGlobalStats,
} from '../services/admin.js'

const router = useRouter()
const auth = getAuth()
const cargando = ref(true)
const autorizado = ref(false)
const pestana = ref('stats')

const stats = ref({ totalObras: 0, totalUsuarios: 0, totalVentas: 0 })
const usuarios = ref([])
const obras = ref([])
const busquedaObras = ref('')
const busquedaUsuarios = ref('')
const togglingAdmin = ref(null)

onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (!user) { router.replace('/login'); return }
    const admin = await esAdmin(user.email)
    if (!admin) { router.replace('/'); return }
    autorizado.value = true
    await cargarTodo()
    cargando.value = false
  })
})

async function cargarTodo() {
  const [s, u, o] = await Promise.all([
    getGlobalStats(),
    getAllUsers(),
    getAllArtworksAdmin(),
  ])
  stats.value = s
  usuarios.value = u.sort((a, b) => (a.email || '').localeCompare(b.email || ''))
  obras.value = o.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
}

async function borrarObra(id, titulo) {
  if (!confirm(`¿Eliminar la obra "${titulo}"? Esta acción no se puede deshacer.`)) return
  await deleteArtworkAdmin(id)
  obras.value = obras.value.filter(o => o.id !== id)
  stats.value.totalObras--
}

async function toggleAdmin(perfil) {
  togglingAdmin.value = perfil.id
  const nuevoRol = perfil.role === 'admin' ? false : true
  await setAdminRole(perfil.id, nuevoRol)
  perfil.role = nuevoRol ? 'admin' : 'user'
  togglingAdmin.value = null
}

function obrasFiltradas() {
  const txt = busquedaObras.value.toLowerCase()
  if (!txt) return obras.value
  return obras.value.filter(o =>
    o.title?.toLowerCase().includes(txt) ||
    o.artistName?.toLowerCase().includes(txt) ||
    o.artistEmail?.toLowerCase().includes(txt)
  )
}

function usuariosFiltrados() {
  const txt = busquedaUsuarios.value.toLowerCase()
  if (!txt) return usuarios.value
  return usuarios.value.filter(u =>
    u.email?.toLowerCase().includes(txt) ||
    u.nombre?.toLowerCase().includes(txt)
  )
}
</script>

<template>
  <div v-if="cargando" class="estado-carga">Cargando panel...</div>

  <div v-else-if="autorizado" class="admin-panel">
    <div class="admin-header">
      <div>
        <h1>Panel de administración</h1>
        <p class="admin-sub">ArteLocal · Control total</p>
      </div>
      <span class="badge-admin">🛡 Admin</span>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button :class="{ activo: pestana === 'stats' }" @click="pestana = 'stats'">Estadísticas</button>
      <button :class="{ activo: pestana === 'obras' }" @click="pestana = 'obras'">
        Obras <span class="tab-count">{{ stats.totalObras }}</span>
      </button>
      <button :class="{ activo: pestana === 'usuarios' }" @click="pestana = 'usuarios'">
        Usuarios <span class="tab-count">{{ stats.totalUsuarios }}</span>
      </button>
    </div>

    <!-- Tab: Estadísticas -->
    <div v-if="pestana === 'stats'" class="stats-grid">
      <div class="stat-card">
        <span class="stat-icon">🖼</span>
        <span class="stat-valor">{{ stats.totalObras }}</span>
        <span class="stat-label">Obras publicadas</span>
      </div>
      <div class="stat-card">
        <span class="stat-icon">👥</span>
        <span class="stat-valor">{{ stats.totalUsuarios }}</span>
        <span class="stat-label">Usuarios registrados</span>
      </div>
      <div class="stat-card">
        <span class="stat-icon">💳</span>
        <span class="stat-valor">{{ stats.totalVentas }}</span>
        <span class="stat-label">Ventas completadas</span>
      </div>
    </div>

    <!-- Tab: Obras -->
    <div v-if="pestana === 'obras'">
      <input
        v-model="busquedaObras"
        class="buscador"
        placeholder="Buscar por título, artista..."
      />
      <div v-if="!obrasFiltradas().length" class="estado-vacio">No hay obras.</div>
      <table v-else class="tabla-admin">
        <thead>
          <tr>
            <th>Imagen</th>
            <th>Título</th>
            <th>Artista</th>
            <th>Precio</th>
            <th>En venta</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="obra in obrasFiltradas()" :key="obra.id">
            <td>
              <img
                v-if="obra.imageUrl"
                :src="obra.imageUrl"
                class="tabla-thumb"
                :alt="obra.title"
              />
              <span v-else class="tabla-thumb-ph">🖼</span>
            </td>
            <td>
              <RouterLink :to="`/obra/${obra.id}`" class="tabla-link">
                {{ obra.title || '(sin título)' }}
              </RouterLink>
            </td>
            <td class="tabla-muted">{{ obra.artistName || obra.artistEmail || '—' }}</td>
            <td class="tabla-muted">{{ obra.forSale ? obra.price + ' €' : '—' }}</td>
            <td>
              <span class="badge-estado" :class="obra.forSale ? 'venta' : 'no-venta'">
                {{ obra.forSale ? 'Sí' : 'No' }}
              </span>
            </td>
            <td>
              <button
                class="btn-eliminar"
                @click="borrarObra(obra.id, obra.title)"
                title="Eliminar obra"
              >✕ Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Tab: Usuarios -->
    <div v-if="pestana === 'usuarios'">
      <input
        v-model="busquedaUsuarios"
        class="buscador"
        placeholder="Buscar por email o nombre..."
      />
      <div v-if="!usuariosFiltrados().length" class="estado-vacio">No hay usuarios.</div>
      <table v-else class="tabla-admin">
        <thead>
          <tr>
            <th>Email</th>
            <th>Nombre</th>
            <th>Ciudad</th>
            <th>Rol</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in usuariosFiltrados()" :key="u.id">
            <td>
              <RouterLink :to="`/artista/${encodeURIComponent(u.email)}`" class="tabla-link">
                {{ u.email }}
              </RouterLink>
            </td>
            <td class="tabla-muted">{{ u.nombre || '—' }}</td>
            <td class="tabla-muted">{{ u.location || '—' }}</td>
            <td>
              <span class="badge-estado" :class="u.role === 'admin' ? 'admin' : 'user'">
                {{ u.role === 'admin' ? '🛡 Admin' : 'Usuario' }}
              </span>
            </td>
            <td>
              <button
                class="btn-rol"
                :class="u.role === 'admin' ? 'degradar' : 'promover'"
                :disabled="togglingAdmin === u.id"
                @click="toggleAdmin(u)"
              >
                {{ u.role === 'admin' ? 'Quitar admin' : 'Hacer admin' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.admin-panel { padding: 3rem 0 2rem; animation: fadeUp 0.4s ease both; }
@keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:none; } }

.estado-carga { padding: 6rem; text-align: center; color: var(--c-text-muted); }

.admin-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 2rem;
}
h1 {
  font-family: var(--font-display); font-size: 2.2rem; font-weight: 700;
  color: var(--c-text); letter-spacing: -0.02em; margin-bottom: 0.2rem;
}
.admin-sub { font-size: 0.85rem; color: var(--c-text-muted); }
.badge-admin {
  background: rgba(99,102,241,0.12); color: #4338ca;
  border: 1px solid rgba(99,102,241,0.25);
  padding: 0.35rem 0.85rem; border-radius: 99px;
  font-size: 0.78rem; font-weight: 700; white-space: nowrap;
}

/* Tabs */
.tabs {
  display: flex; gap: 0; border-bottom: 2px solid var(--c-border);
  margin-bottom: 1.75rem;
}
.tabs button {
  background: none; border: none; border-bottom: 2px solid transparent;
  margin-bottom: -2px; padding: 0.7rem 1.25rem;
  color: var(--c-text-muted); font-family: var(--font-body);
  font-size: 0.875rem; font-weight: 500; cursor: pointer;
  transition: all 0.15s; display: flex; align-items: center; gap: 0.4rem;
}
.tabs button:hover { color: var(--c-text); }
.tabs button.activo { color: var(--c-gold); border-bottom-color: var(--c-gold); }
.tab-count {
  background: var(--c-bg-soft); border-radius: 99px;
  font-size: 0.7rem; padding: 0.1rem 0.45rem; color: var(--c-text-muted);
}

/* Stats */
.stats-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem;
}
.stat-card {
  background: var(--c-bg-card); border: 1.5px solid var(--c-border);
  border-radius: var(--r-xl); padding: 1.75rem 1.5rem;
  display: flex; flex-direction: column; align-items: center; gap: 0.4rem;
  transition: border-color 0.15s;
}
.stat-card:hover { border-color: var(--c-border-hover); }
.stat-icon { font-size: 1.75rem; }
.stat-valor { font-size: 2.25rem; font-weight: 800; color: var(--c-text); font-family: var(--font-display); }
.stat-label { font-size: 0.78rem; color: var(--c-text-muted); font-weight: 500; }

/* Buscador */
.buscador {
  width: 100%; max-width: 360px; margin-bottom: 1.25rem;
  background: var(--c-bg-card); border: 1.5px solid var(--c-border);
  border-radius: var(--r-sm); padding: 0.6rem 1rem;
  color: var(--c-text); font-family: var(--font-body); font-size: 0.875rem;
  outline: none; display: block;
}
.buscador:focus { border-color: var(--c-gold); }

/* Tabla */
.tabla-admin {
  width: 100%; border-collapse: collapse; font-size: 0.85rem;
}
.tabla-admin thead tr {
  border-bottom: 2px solid var(--c-border);
}
.tabla-admin th {
  text-align: left; padding: 0.6rem 0.75rem;
  font-size: 0.7rem; font-weight: 700; color: var(--c-text-muted);
  text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap;
}
.tabla-admin tbody tr {
  border-bottom: 1px solid var(--c-border); transition: background 0.1s;
}
.tabla-admin tbody tr:hover { background: var(--c-bg-soft); }
.tabla-admin td { padding: 0.65rem 0.75rem; vertical-align: middle; }
.tabla-muted { color: var(--c-text-muted); }
.tabla-link { color: var(--c-text); text-decoration: none; font-weight: 500; }
.tabla-link:hover { color: var(--c-gold); }

.tabla-thumb {
  width: 44px; height: 44px; object-fit: cover;
  border-radius: var(--r-sm); display: block;
}
.tabla-thumb-ph {
  width: 44px; height: 44px; background: var(--c-bg-soft);
  border-radius: var(--r-sm); display: flex; align-items: center;
  justify-content: center; font-size: 1.2rem;
}

/* Badges */
.badge-estado {
  display: inline-block; padding: 0.2rem 0.65rem;
  border-radius: 99px; font-size: 0.72rem; font-weight: 600; white-space: nowrap;
}
.badge-estado.venta   { background: rgba(34,197,94,0.1);  color: #16a34a; }
.badge-estado.no-venta{ background: rgba(107,114,128,0.1); color: var(--c-text-muted); }
.badge-estado.admin   { background: rgba(99,102,241,0.12); color: #4338ca; }
.badge-estado.user    { background: var(--c-bg-soft);      color: var(--c-text-muted); }

/* Botones acción */
.btn-eliminar {
  background: var(--c-danger-dim); border: 1px solid rgba(224,90,78,0.3);
  color: var(--c-danger); padding: 0.35rem 0.85rem;
  border-radius: var(--r-sm); font-size: 0.78rem; font-weight: 600;
  cursor: pointer; transition: all 0.15s; font-family: var(--font-body);
  white-space: nowrap;
}
.btn-eliminar:hover { background: rgba(224,90,78,0.2); }

.btn-rol {
  padding: 0.35rem 0.85rem; border-radius: var(--r-sm);
  font-size: 0.78rem; font-weight: 600; cursor: pointer;
  transition: all 0.15s; font-family: var(--font-body);
  white-space: nowrap; border: 1px solid transparent;
}
.btn-rol.promover {
  background: rgba(99,102,241,0.1); border-color: rgba(99,102,241,0.25); color: #4338ca;
}
.btn-rol.promover:hover { background: rgba(99,102,241,0.2); }
.btn-rol.degradar {
  background: var(--c-bg-soft); border-color: var(--c-border); color: var(--c-text-muted);
}
.btn-rol.degradar:hover { border-color: var(--c-danger); color: var(--c-danger); }
.btn-rol:disabled { opacity: 0.5; cursor: default; }

.estado-vacio { text-align: center; padding: 4rem; color: var(--c-text-muted); }
</style>
