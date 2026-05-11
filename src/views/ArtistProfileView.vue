<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getArtworksByArtist } from '../services/artworks'
import { getProfile } from '../services/profiles'
import { createCommission } from '../services/commissions'
import { useAuth } from '../composables/useAuth'
import ArtworkCard from '../components/ArtworkCard.vue'

const route = useRoute()
const { usuario } = useAuth()

const artistEmail = decodeURIComponent(route.params.email)
const obras = ref([])
const perfil = ref(null)
const cargando = ref(true)

// Formulario de encargo
const mostrarFormEncargo = ref(false)
const enviandoEncargo = ref(false)
const encargo = ref({ clientName: '', clientEmail: '', description: '', budget: '' })
const encargoEnviado = ref(false)

onMounted(async () => {
  ;[obras.value, perfil.value] = await Promise.all([
    getArtworksByArtist(artistEmail),
    getProfile(artistEmail),
  ])
  cargando.value = false
})

async function enviarEncargo() {
  if (!encargo.value.clientName || !encargo.value.clientEmail || !encargo.value.description) return
  enviandoEncargo.value = true
  await createCommission({
    artistEmail,
    ...encargo.value,
  })
  enviandoEncargo.value = false
  encargoEnviado.value = true
  mostrarFormEncargo.value = false
}
</script>

<template>
  <div class="perfil-page">
    <div v-if="cargando" class="estado-vacio">Cargando perfil...</div>
    <template v-else>

      <!-- Cabecera artista -->
      <div class="artista-header">
        <div class="artista-avatar">{{ (perfil?.nombre || artistEmail)[0].toUpperCase() }}</div>
        <div class="artista-meta">
          <h1>{{ perfil?.nombre || artistEmail }}</h1>
          <p v-if="perfil?.location" class="artista-ubicacion">📍 {{ perfil.location }}</p>
          <p v-if="perfil?.bio" class="artista-bio">{{ perfil.bio }}</p>
          <div v-if="perfil" class="artista-links">
            <a v-if="perfil.website" :href="perfil.website" target="_blank" rel="noopener">Web</a>
            <a v-if="perfil.instagram" :href="`https://instagram.com/${perfil.instagram}`" target="_blank" rel="noopener">Instagram</a>
          </div>
        </div>

        <div v-if="perfil?.acceptsCommissions || obras.some(o => o.acceptsCommissions)" class="encargo-zona">
          <button v-if="!encargoEnviado" class="btn-primary" @click="mostrarFormEncargo = !mostrarFormEncargo">
            {{ mostrarFormEncargo ? 'Cancelar' : 'Solicitar encargo' }}
          </button>
          <p v-else class="encargo-ok">✓ Solicitud enviada</p>
        </div>
      </div>

      <!-- Formulario encargo -->
      <div v-if="mostrarFormEncargo" class="form-encargo">
        <h3>Solicitar encargo</h3>
        <input v-model="encargo.clientName" placeholder="Tu nombre" />
        <input v-model="encargo.clientEmail" type="email" placeholder="Tu email" />
        <textarea v-model="encargo.description" placeholder="Describe lo que necesitas..." rows="4" />
        <input v-model="encargo.budget" placeholder="Presupuesto aproximado (€)" />
        <button class="btn-primary" :disabled="enviandoEncargo" @click="enviarEncargo">
          {{ enviandoEncargo ? 'Enviando...' : 'Enviar solicitud' }}
        </button>
      </div>

      <!-- Obras del artista -->
      <section class="artista-obras">
        <h2>Obras ({{ obras.length }})</h2>
        <div v-if="!obras.length" class="estado-vacio">Este artista aún no ha subido obras.</div>
        <div v-else class="grid-obras">
          <ArtworkCard v-for="obra in obras" :key="obra.id" :artwork="obra" />
        </div>
      </section>

    </template>
  </div>
</template>

<style scoped>
.perfil-page { padding: 3rem 0 2rem; animation: fadeUp 0.5s ease-out both; }
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

.artista-header {
  display: flex;
  gap: 1.75rem;
  align-items: flex-start;
  margin-bottom: 2.5rem;
  flex-wrap: wrap;
}

.artista-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--c-gold-dim);
  color: var(--c-gold);
  font-family: var(--font-display);
  font-size: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 2px solid var(--c-border);
}

.artista-meta { flex: 1; }
h1 {
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 700;
  color: var(--c-text);
  margin-bottom: 0.4rem;
}
.artista-ubicacion { color: var(--c-text-muted); font-size: 0.85rem; margin-bottom: 0.5rem; }
.artista-bio { color: var(--c-text-soft); line-height: 1.65; margin-bottom: 0.75rem; }
.artista-links { display: flex; gap: 0.75rem; }
.artista-links a { font-size: 0.8rem; color: var(--c-gold); }

.encargo-zona { margin-left: auto; }
.btn-primary {
  background: var(--c-gold);
  color: #0d0f14;
  border: none;
  padding: 0.65rem 1.5rem;
  border-radius: var(--r-sm);
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-primary:disabled { opacity: 0.5; cursor: default; }
.btn-primary:hover:not(:disabled) { background: var(--c-gold-light); }
.encargo-ok { color: var(--c-gold); font-size: 0.875rem; }

.form-encargo {
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--r-lg);
  padding: 1.5rem;
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  max-width: 560px;
}
.form-encargo h3 {
  font-family: var(--font-display);
  font-size: 1.15rem;
  color: var(--c-text);
  margin-bottom: 0.25rem;
}
.form-encargo input, .form-encargo textarea {
  background: var(--c-bg-mute);
  border: 1px solid var(--c-border);
  border-radius: var(--r-sm);
  padding: 0.55rem 0.85rem;
  color: var(--c-text);
  font-family: var(--font-body);
  font-size: 0.875rem;
  outline: none;
  resize: vertical;
}
.form-encargo input:focus, .form-encargo textarea:focus { border-color: var(--c-gold); }

.artista-obras h2 {
  font-family: var(--font-display);
  font-size: 1.4rem;
  color: var(--c-text);
  margin-bottom: 1.25rem;
}
.grid-obras {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1.25rem;
}
.estado-vacio { text-align: center; padding: 4rem; color: var(--c-text-muted); }
</style>
