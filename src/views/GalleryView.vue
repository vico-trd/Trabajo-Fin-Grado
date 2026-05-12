<script setup>
import { ref, onMounted, computed } from 'vue'
import { getArtworks } from '../services/artworks'
import ArtworkCard from '../components/ArtworkCard.vue'

const CATEGORIAS = ['Pintura', 'Escultura', 'Fotografía', 'Ilustración', 'Arte digital', 'Cerámica', 'Otra']

const obras = ref([])
const cargando = ref(true)
const categoriaActiva = ref('')
const busqueda = ref('')

async function cargar() {
  cargando.value = true
  obras.value = await getArtworks({ categoria: categoriaActiva.value || undefined })
  cargando.value = false
}

onMounted(cargar)

function seleccionarCategoria(cat) {
  categoriaActiva.value = categoriaActiva.value === cat ? '' : cat
  cargar()
}

const obrasFiltradas = computed(() => {
  const texto = busqueda.value.toLowerCase()
  if (!texto) return obras.value
  return obras.value.filter(
    (o) => o.title?.toLowerCase().includes(texto) || o.artistName?.toLowerCase().includes(texto),
  )
})
</script>

<template>
  <div class="galeria">
    <div class="galeria-header">
      <h1>Galería</h1>
      <input
        v-model="busqueda"
        type="search"
        class="buscador"
        placeholder="Buscar obra o artista..."
      />
    </div>

    <div class="filtros">
      <button
        v-for="cat in CATEGORIAS"
        :key="cat"
        class="filtro-btn"
        :class="{ activo: categoriaActiva === cat }"
        @click="seleccionarCategoria(cat)"
      >
        {{ cat }}
      </button>
    </div>

    <div v-if="cargando" class="estado-vacio">Cargando obras...</div>
    <div v-else-if="!obrasFiltradas.length" class="estado-vacio">No hay obras en esta categoría.</div>
    <div v-else class="grid-obras">
      <ArtworkCard v-for="obra in obrasFiltradas" :key="obra.id" :artwork="obra" />
    </div>
  </div>
</template>

<style scoped>
.galeria { padding: 3rem 0 2rem; animation: fadeUp 0.5s ease-out both; }
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

.galeria-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.75rem;
}

h1 {
  font-family: var(--font-display);
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--c-text);
  letter-spacing: -0.02em;
}

.buscador {
  background: var(--c-bg-card);
  border: 1.5px solid var(--c-border);
  border-radius: var(--r-sm);
  padding: 0.6rem 1rem;
  color: var(--c-text);
  font-family: var(--font-body);
  font-size: 0.875rem;
  width: 280px;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.buscador:focus {
  border-color: var(--c-gold);
  box-shadow: 0 0 0 3px rgba(234,76,137,0.08);
}

.filtros {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.filtro-btn {
  background: var(--c-bg-card);
  border: 1.5px solid var(--c-border);
  color: var(--c-text-soft);
  padding: 0.4rem 1rem;
  border-radius: 99px;
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  font-family: var(--font-body);
}
.filtro-btn:hover { border-color: var(--c-border-hover); color: var(--c-text); }
.filtro-btn.activo {
  background: var(--c-gold);
  border-color: var(--c-gold);
  color: #fff;
}

.grid-obras {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.5rem;
}

.estado-vacio { text-align: center; padding: 5rem; color: var(--c-text-muted); font-size: 0.9rem; }
</style>