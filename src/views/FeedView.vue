<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { escucharSeguidos } from '../services/seguimientos'
import { getArtworksByArtist } from '../services/artworks'
import ArtworkCard from '../components/ArtworkCard.vue'

const auth = getAuth()
const usuario = ref(null)
const obras = ref([])
const cargando = ref(true)
let unsubSeguidos = null

onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    usuario.value = user
    if (!user) { cargando.value = false; return }

    // Escuchar cambios en la lista de seguidos
    if (unsubSeguidos) unsubSeguidos()
    unsubSeguidos = escucharSeguidos(user.email, async (seguidos) => {
      cargando.value = true
      if (!seguidos.length) { obras.value = []; cargando.value = false; return }
      const promesas = seguidos.map(email => getArtworksByArtist(email))
      const resultados = await Promise.all(promesas)
      const todas = resultados.flat()
      todas.sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() ?? 0
        const tb = b.createdAt?.toMillis?.() ?? 0
        return tb - ta
      })
      obras.value = todas
      cargando.value = false
    })
  })
})

onUnmounted(() => { if (unsubSeguidos) unsubSeguidos() })
</script>

<template>
  <div class="feed">
    <div class="feed-header">
      <h1>Feed</h1>
      <p class="feed-subtitle">Obras nuevas de los artistas que sigues</p>
    </div>

    <div v-if="!usuario" class="estado-vacio">
      <p>Inicia sesión para ver el feed de artistas que sigues.</p>
    </div>
    <div v-else-if="cargando" class="estado-vacio">Cargando feed…</div>
    <div v-else-if="!obras.length" class="estado-vacio">
      <p class="vacio-titulo">Tu feed está vacío</p>
      <p>Sigue artistas desde sus perfiles para ver sus obras aquí.</p>
      <RouterLink to="/artistas" class="btn-explorar">Explorar artistas</RouterLink>
    </div>
    <div v-else>
      <p class="resultado-count">{{ obras.length }} obra{{ obras.length !== 1 ? 's' : '' }}</p>
      <div class="grid-obras">
        <ArtworkCard v-for="obra in obras" :key="obra.id" :artwork="obra" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.feed { padding: 3rem 0 2rem; animation: fadeUp 0.5s ease-out both; }
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

.feed-header { margin-bottom: 2rem; }

h1 {
  font-family: var(--font-display);
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--c-text);
  letter-spacing: -0.02em;
  margin-bottom: 0.25rem;
}

.feed-subtitle { color: var(--c-text-muted); font-size: 0.9rem; }

.estado-vacio {
  text-align: center;
  padding: 5rem 2rem;
  color: var(--c-text-muted);
  font-size: 0.9rem;
}
.vacio-titulo {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--c-text);
  margin-bottom: 0.5rem;
}
.btn-explorar {
  display: inline-block;
  margin-top: 1.25rem;
  background: var(--c-gold);
  color: #fff;
  padding: 0.65rem 1.5rem;
  border-radius: var(--r-sm);
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  transition: opacity 0.15s;
}
.btn-explorar:hover { opacity: 0.85; }

.resultado-count { font-size: 0.8rem; color: var(--c-text-muted); margin-bottom: 1rem; }

.grid-obras {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.5rem;
}
</style>
