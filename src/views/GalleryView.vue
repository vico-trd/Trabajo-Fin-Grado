<script setup>
import { ref, onMounted, computed } from 'vue'
import { getArtworks } from '../services/artworks'
import ArtworkCard from '../components/ArtworkCard.vue'

const CATEGORIAS = ['Pintura', 'Escultura', 'Fotografía', 'Ilustración', 'Arte digital', 'Cerámica', 'Otra']

const obras = ref([])
const cargando = ref(true)
const categoriaActiva = ref('')
const busqueda = ref('')
const mostrarFiltros = ref(false)

// Filtros avanzados
const filtros = ref({
  precioMin: '',
  precioMax: '',
  yearMin: '',
  yearMax: '',
  tecnica: '',
  ciudad: '',
})

onMounted(async () => {
  obras.value = await getArtworks({ max: 300 })
  cargando.value = false
})

function seleccionarCategoria(cat) {
  categoriaActiva.value = categoriaActiva.value === cat ? '' : cat
}

function limpiarFiltros() {
  filtros.value = { precioMin: '', precioMax: '', yearMin: '', yearMax: '', tecnica: '', ciudad: '' }
  categoriaActiva.value = ''
  busqueda.value = ''
}

const filtrosActivos = computed(() =>
  categoriaActiva.value ||
  busqueda.value ||
  filtros.value.precioMin || filtros.value.precioMax ||
  filtros.value.yearMin || filtros.value.yearMax ||
  filtros.value.tecnica || filtros.value.ciudad
)

// Técnicas y ciudades únicas extraídas de los datos
const tecnicasUnicas = computed(() => {
  const set = new Set(obras.value.map(o => o.technique).filter(Boolean))
  return [...set].sort()
})
const ciudadesUnicas = computed(() => {
  const set = new Set(obras.value.map(o => o.location).filter(Boolean))
  return [...set].sort()
})

const obrasFiltradas = computed(() => {
  // Solo obras en venta (oculta las vendidas y las no puestas a la venta)
  let resultado = obras.value.filter(o => o.forSale)

  if (categoriaActiva.value)
    resultado = resultado.filter(o => o.category === categoriaActiva.value)

  if (busqueda.value) {
    const texto = busqueda.value.toLowerCase()
    resultado = resultado.filter(o =>
      o.title?.toLowerCase().includes(texto) ||
      o.artistName?.toLowerCase().includes(texto)
    )
  }

  const { precioMin, precioMax, yearMin, yearMax, tecnica, ciudad } = filtros.value

  if (precioMin) resultado = resultado.filter(o => Number(o.price) >= Number(precioMin))
  if (precioMax) resultado = resultado.filter(o => Number(o.price) <= Number(precioMax))
  if (yearMin)   resultado = resultado.filter(o => Number(o.year) >= Number(yearMin))
  if (yearMax)   resultado = resultado.filter(o => Number(o.year) <= Number(yearMax))
  if (tecnica)   resultado = resultado.filter(o => o.technique === tecnica)
  if (ciudad)    resultado = resultado.filter(o => o.location === ciudad)

  return resultado
})
</script>

<template>
  <div class="galeria">
    <div class="galeria-header">
      <h1>Galería</h1>
      <div class="galeria-header-controles">
        <input
          v-model="busqueda"
          type="search"
          class="buscador"
          placeholder="Buscar obra o artista..."
        />
        <button
          class="btn-filtros"
          :class="{ activo: mostrarFiltros }"
          @click="mostrarFiltros = !mostrarFiltros"
        >
          ⚙ Filtros{{ filtrosActivos ? ' ●' : '' }}
        </button>
        <button v-if="filtrosActivos" class="btn-limpiar" @click="limpiarFiltros">✕ Limpiar</button>
      </div>
    </div>

    <!-- Categorías -->
    <div class="filtros">
      <button
        v-for="cat in CATEGORIAS"
        :key="cat"
        class="filtro-btn"
        :class="{ activo: categoriaActiva === cat }"
        @click="seleccionarCategoria(cat)"
      >{{ cat }}</button>
    </div>

    <!-- Panel filtros avanzados -->
    <div v-if="mostrarFiltros" class="filtros-avanzados">
      <div class="filtros-grid">
        <div class="filtro-campo">
          <label>Precio mín. (€)</label>
          <input v-model="filtros.precioMin" type="number" placeholder="0" min="0" />
        </div>
        <div class="filtro-campo">
          <label>Precio máx. (€)</label>
          <input v-model="filtros.precioMax" type="number" placeholder="9999" min="0" />
        </div>
        <div class="filtro-campo">
          <label>Año desde</label>
          <input v-model="filtros.yearMin" type="number" placeholder="2000" />
        </div>
        <div class="filtro-campo">
          <label>Año hasta</label>
          <input v-model="filtros.yearMax" type="number" :placeholder="new Date().getFullYear()" />
        </div>
        <div class="filtro-campo">
          <label>Técnica</label>
          <select v-model="filtros.tecnica">
            <option value="">Todas</option>
            <option v-for="t in tecnicasUnicas" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>
        <div class="filtro-campo">
          <label>Ciudad</label>
          <select v-model="filtros.ciudad">
            <option value="">Todas</option>
            <option v-for="c in ciudadesUnicas" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
      </div>
    </div>

    <div v-if="cargando" class="estado-vacio">Cargando obras...</div>
    <div v-else-if="!obrasFiltradas.length" class="estado-vacio">
      No hay obras con estos filtros.
      <button class="btn-limpiar" style="margin-left:0.5rem" @click="limpiarFiltros">Limpiar filtros</button>
    </div>
    <div v-else>
      <p class="resultado-count">{{ obrasFiltradas.length }} obra{{ obrasFiltradas.length !== 1 ? 's' : '' }}</p>
      <div class="grid-obras">
        <ArtworkCard v-for="obra in obrasFiltradas" :key="obra.id" :artwork="obra" />
      </div>
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

.galeria-header-controles { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }

.buscador {
  background: var(--c-bg-card);
  border: 1.5px solid var(--c-border);
  border-radius: var(--r-sm);
  padding: 0.6rem 1rem;
  color: var(--c-text);
  font-family: var(--font-body);
  font-size: 0.875rem;
  width: 240px;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.buscador:focus { border-color: var(--c-gold); box-shadow: 0 0 0 3px rgba(234,76,137,0.08); }

.btn-filtros {
  background: var(--c-bg-card); border: 1.5px solid var(--c-border);
  color: var(--c-text-soft); padding: 0.55rem 1rem;
  border-radius: var(--r-sm); font-size: 0.82rem; font-weight: 500;
  cursor: pointer; transition: all 0.15s; font-family: var(--font-body);
}
.btn-filtros:hover, .btn-filtros.activo { border-color: var(--c-gold); color: var(--c-gold); }

.btn-limpiar {
  background: transparent; border: 1.5px solid var(--c-border);
  color: var(--c-text-muted); padding: 0.5rem 0.85rem;
  border-radius: var(--r-sm); font-size: 0.78rem; font-weight: 500;
  cursor: pointer; transition: all 0.15s; font-family: var(--font-body);
}
.btn-limpiar:hover { border-color: var(--c-danger); color: var(--c-danger); }

.filtros { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.25rem; }
.filtro-btn {
  background: var(--c-bg-card); border: 1.5px solid var(--c-border);
  color: var(--c-text-soft); padding: 0.4rem 1rem;
  border-radius: 99px; font-size: 0.82rem; font-weight: 500;
  cursor: pointer; transition: all 0.15s; font-family: var(--font-body);
}
.filtro-btn:hover { border-color: var(--c-border-hover); color: var(--c-text); }
.filtro-btn.activo { background: var(--c-gold); border-color: var(--c-gold); color: #fff; }

/* Panel filtros avanzados */
.filtros-avanzados {
  background: var(--c-bg-card);
  border: 1.5px solid var(--c-border);
  border-radius: var(--r-xl);
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.75rem;
  box-shadow: var(--shadow-card);
}
.filtros-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}
.filtro-campo { display: flex; flex-direction: column; gap: 0.3rem; }
.filtro-campo label { font-size: 0.72rem; font-weight: 700; color: var(--c-text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
.filtro-campo input, .filtro-campo select {
  background: var(--c-bg-soft); border: 1.5px solid var(--c-border);
  border-radius: var(--r-sm); padding: 0.5rem 0.75rem;
  color: var(--c-text); font-family: var(--font-body); font-size: 0.85rem;
  outline: none; transition: border-color 0.15s;
}
.filtro-campo input:focus, .filtro-campo select:focus { border-color: var(--c-gold); }
.check-venta { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: var(--c-text-soft); cursor: pointer; }
.check-venta input { accent-color: var(--c-gold); }

.resultado-count { font-size: 0.8rem; color: var(--c-text-muted); margin-bottom: 1rem; }

.grid-obras {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.5rem;
}
.estado-vacio { text-align: center; padding: 5rem; color: var(--c-text-muted); font-size: 0.9rem; }
</style>