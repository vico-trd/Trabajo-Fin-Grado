<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { escucharFavoritos } from '../services/likes'
import ArtworkCard from '../components/ArtworkCard.vue'

const usuario = ref(null)
const auth = getAuth()
const favoritos = ref([])
const cargando = ref(true)
let unsubFavoritos = null

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    usuario.value = user ?? null
    if (!user) { cargando.value = false; return }
    unsubFavoritos = escucharFavoritos(user.email, (obras) => {
      favoritos.value = obras
      cargando.value = false
    })
  })
})

onUnmounted(() => {
  if (unsubFavoritos) unsubFavoritos()
})
</script>

<template>
  <div class="favoritos-page">
    <h1>Mis Favoritos</h1>

    <div v-if="!usuario" class="estado-vacio">
      <RouterLink to="/login" class="btn-login">Inicia sesión</RouterLink> para ver tus favoritos.
    </div>
    <div v-else-if="cargando" class="estado-vacio">Cargando...</div>
    <div v-else-if="!favoritos.length" class="estado-vacio">
      Aún no has guardado ninguna obra como favorita.<br />
      <RouterLink to="/galeria" class="link-galeria">Explorar galería →</RouterLink>
    </div>
    <div v-else>
      <p class="subtitulo">{{ favoritos.length }} obra{{ favoritos.length !== 1 ? 's' : '' }} guardada{{ favoritos.length !== 1 ? 's' : '' }}</p>
      <div class="grid-obras">
        <ArtworkCard v-for="obra in favoritos" :key="obra.id" :artwork="obra" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.favoritos-page { padding: 3rem 0 2rem; animation: fadeUp 0.5s ease-out both; }
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

h1 {
  font-family: var(--font-display);
  font-size: 2.5rem; font-weight: 700; color: var(--c-text);
  letter-spacing: -0.02em; margin-bottom: 0.5rem;
}

.subtitulo {
  color: var(--c-text-muted); font-size: 0.875rem; margin-bottom: 1.75rem;
}

.estado-vacio {
  text-align: center; padding: 5rem;
  color: var(--c-text-muted); font-size: 0.95rem; line-height: 2;
}
.btn-login, .link-galeria {
  color: var(--c-gold); font-weight: 600; text-decoration: none;
}
.btn-login:hover, .link-galeria:hover { text-decoration: underline; }

.grid-obras {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1.5rem;
}
</style>
