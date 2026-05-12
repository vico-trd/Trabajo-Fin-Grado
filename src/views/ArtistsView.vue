<script setup>
import { ref, onMounted } from "vue";
import { getArtworks } from "../services/artworks";

const artistas = ref([]);
const cargando = ref(true);

onMounted(async () => {
  const obras = await getArtworks({ max: 200 });
  cargando.value = false;

  // Agrupamos obras por artista
  const porArtista = {}
  for (const obra of obras) {
    if (!porArtista[obra.artistEmail]) {
      porArtista[obra.artistEmail] = {
        email: obra.artistEmail,
        nombre: obra.artistName || obra.artistEmail,
        obras: [],
      }
    }
    porArtista[obra.artistEmail].obras.push(obra)
  }
  artistas.value = Object.values(porArtista)
});
</script>

<template>
  <div class="artistas-page">
    <h1>Artistas</h1>
    <p class="subtitulo">Descubre los creadores detrás de las obras</p>

    <div v-if="cargando" class="estado-vacio">Cargando artistas...</div>
    <div v-else-if="!artistas.length" class="estado-vacio">
      Aún no hay artistas. ¡Sé el primero!
    </div>
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
          <span class="artista-obras"
            >{{ artista.obras.length }} obra{{
              artista.obras.length !== 1 ? "s" : ""
            }}</span
          >
        </div>
        <div class="artista-preview">
          <template v-for="obra in artista.obras" :key="obra.id">
            <img v-if="obra.imageUrl && artista.obras.indexOf(obra) < 3" :src="obra.imageUrl" :alt="obra.title" />
          </template>
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
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--c-text);
  letter-spacing: -0.02em;
  margin-bottom: 0.4rem;
}
.subtitulo { color: var(--c-text-muted); margin-bottom: 2rem; font-size: 0.95rem; }

.grid-artistas {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.25rem;
}

.artista-card {
  background: var(--c-bg-card);
  border: 1.5px solid var(--c-border);
  border-radius: var(--r-lg);
  padding: 1.5rem;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: all 0.2s;
}
.artista-card:hover {
  border-color: var(--c-border-hover);
  transform: translateY(-3px);
  box-shadow: var(--shadow-hover);
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
  border: 2px solid rgba(234,76,137,0.2);
}

.artista-nombre { display: block; font-size: 1rem; font-weight: 600; color: var(--c-text); }
.artista-obras { font-size: 0.78rem; color: var(--c-text-muted); font-weight: 500; }

.artista-preview { display: flex; gap: 0.4rem; }
.artista-preview img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: var(--r-sm);
  border: 1px solid var(--c-border);
}

.estado-vacio { text-align: center; padding: 5rem; color: var(--c-text-muted); }
</style>