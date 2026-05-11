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
  margin-bottom: 1.5rem;
}

h1 {
  font-family: var(--font-display);
  font-size: 2.2rem;
  font-weight: 700;
  color: var(--c-text);
}

.buscador {
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--r-sm);
  padding: 0.5rem 1rem;
  color: var(--c-text);
  font-family: var(--font-body);
  font-size: 0.875rem;
  width: 260px;
  outline: none;
}
.buscador:focus { border-color: var(--c-gold); }

.filtros {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.filtro-btn {
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  color: var(--c-text-soft);
  padding: 0.35rem 0.85rem;
  border-radius: 99px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  font-family: var(--font-body);
}
.filtro-btn:hover { border-color: var(--c-border-hover); color: var(--c-text); }
.filtro-btn.activo { background: var(--c-gold-dim); border-color: var(--c-gold); color: var(--c-gold); }

.grid-obras {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1.25rem;
}

.estado-vacio {
  text-align: center;
  padding: 4rem;
  color: var(--c-text-muted);
}
</style>
