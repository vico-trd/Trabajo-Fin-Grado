<script setup>
import { ref, onMounted, computed } from 'vue'
import { getArtworks } from '../services/artworks'

const obras = ref([])
const cargando = ref(true)

onMounted(async () => {
  obras.value = await getArtworks({ max: 200 })
  cargando.value = false
})

// Agrupa las obras por artistEmail y toma la primera como referencia del artista
const artistas = computed(() => {
  const mapa = new Map()
  for (const obra of obras.value) {
    if (!mapa.has(obra.artistEmail)) {
      mapa.set(obra.artistEmail, {
        email: obra.artistEmail,
        nombre: obra.artistName || obra.artistEmail,
        obras: [],
      })
    }
    mapa.get(obra.artistEmail).obras.push(obra)
  }
  return Array.from(mapa.values())
})
</script>

<template>
  <div class="artistas-page">
    <h1>Artistas</h1>
    <p class="subtitulo">Descubre los creadores detrás de las obras</p>

    <div v-if="cargando" class="estado-vacio">Cargando artistas...</div>
    <div v-else-if="!artistas.length" class="estado-vacio">Aún no hay artistas. ¡Sé el primero!</div>
    <div v-else class="grid-artistas">
      <RouterLink
        v-for="artista in artistas"
        :key="artista.email"
        :to="`/artista/${encodeURIComponent(artista.email)}`"
        class="artista-card"
      >
        <div class="artista-avatar">{{ artista.nombre[0].toUpperCase() }}</div>
        <div class="artista-info">
          <span class="artista-nombre">{{ artista.nombre }}</span>
          <span class="artista-obras">{{ artista.obras.length }} obra{{ artista.obras.length !== 1 ? 's' : '' }}</span>
        </div>
        <div class="artista-preview">
          <img
            v-for="(obra, i) in artista.obras.slice(0, 3)"
            :key="obra.id"
            v-if="obra.imageUrl"
            :src="obra.imageUrl"
            :alt="obra.title"
          />
        </div>
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.artistas-page { padding: 3rem 0 2rem; animation: fadeUp 0.5s ease-out both; }
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

h1 {
  font-family: var(--font-display);
  font-size: 2.2rem;
  font-weight: 700;
  color: var(--c-text);
  margin-bottom: 0.4rem;
}
.subtitulo { color: var(--c-text-muted); margin-bottom: 2rem; }

.grid-artistas {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.25rem;
}

.artista-card {
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--r-lg);
  padding: 1.25rem;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: all 0.25s;
}
.artista-card:hover {
  border-color: var(--c-border-hover);
  transform: translateY(-3px);
  box-shadow: var(--shadow-card);
}

.artista-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--c-gold-dim);
  color: var(--c-gold);
  font-family: var(--font-display);
  font-size: 1.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.artista-nombre { display: block; font-size: 1rem; font-weight: 600; color: var(--c-text); }
.artista-obras { font-size: 0.78rem; color: var(--c-text-muted); }

.artista-preview {
  display: flex;
  gap: 0.4rem;
}
.artista-preview img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: var(--r-sm);
  border: 1px solid var(--c-border);
}

.estado-vacio { text-align: center; padding: 4rem; color: var(--c-text-muted); }
</style>
