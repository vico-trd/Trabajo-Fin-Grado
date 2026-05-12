<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { getArtworksByArtist } from "../services/artworks";
import { getProfile } from "../services/profiles";
import { createCommission } from "../services/commissions";
import { getValoracionesArtista } from "../services/valoraciones";
import { seguirArtista, dejarDeSeguir, estaSiguiendo } from "../services/seguimientos";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import ArtworkCard from "../components/ArtworkCard.vue";

const route = useRoute();
const usuario = ref(null);
const auth = getAuth();
onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    usuario.value = user ?? null;
  });
});

const artistEmail = decodeURIComponent(route.params.email);
const obras = ref([]);
const perfil = ref(null);
const cargando = ref(true);
const valoraciones = ref({ media: null, total: 0 });
const siguiendo = ref(false);
const toggleandoSeguir = ref(false);

onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    usuario.value = user ?? null;
    if (user && user.email !== artistEmail) {
      siguiendo.value = await estaSiguiendo(user.email, artistEmail);
    }
  });
});

// Formulario de encargo
const mostrarFormEncargo = ref(false);
const enviandoEncargo = ref(false);
const encargo = ref({
  clientName: "",
  clientEmail: "",
  description: "",
  budget: "",
});
const encargoEnviado = ref(false);

onMounted(async () => {
  const [obrasCargadas, perfilCargado, valData] = await Promise.all([
    getArtworksByArtist(artistEmail),
    getProfile(artistEmail),
    getValoracionesArtista(artistEmail),
  ]);
  obras.value = obrasCargadas;
  perfil.value = perfilCargado;
  valoraciones.value = valData;
  cargando.value = false;
});

async function toggleSeguir() {
  if (!usuario.value) return;
  toggleandoSeguir.value = true;
  if (siguiendo.value) {
    await dejarDeSeguir(usuario.value.email, artistEmail);
    siguiendo.value = false;
  } else {
    await seguirArtista(usuario.value.email, artistEmail);
    siguiendo.value = true;
  }
  toggleandoSeguir.value = false;
}

async function enviarEncargo() {
  if (
    !encargo.value.clientName ||
    !encargo.value.clientEmail ||
    !encargo.value.description
  )
    return;
  enviandoEncargo.value = true;
  await createCommission({
    artistEmail,
    ...encargo.value,
  });
  enviandoEncargo.value = false;
  encargoEnviado.value = true;
  mostrarFormEncargo.value = false;
}
</script>

<template>
  <div class="perfil-page">
    <div v-if="cargando" class="estado-vacio">Cargando perfil...</div>
    <template v-else>
      <!-- Cabecera artista -->
      <div class="artista-header">
        <div class="artista-avatar">
          {{ (perfil?.nombre || artistEmail)[0].toUpperCase() }}
        </div>
        <div class="artista-meta">
          <h1>{{ perfil?.nombre || artistEmail }}</h1>
          <p v-if="perfil?.location" class="artista-ubicacion">
            📍 {{ perfil.location }}
          </p>
          <p v-if="valoraciones.media" class="artista-rating">
            <span class="rating-stars">★</span> {{ valoraciones.media }}
            <span class="rating-total">({{ valoraciones.total }} valoración{{ valoraciones.total !== 1 ? 'es' : '' }})</span>
          </p>
          <p v-if="perfil?.bio" class="artista-bio">{{ perfil.bio }}</p>
          <div v-if="perfil" class="artista-links">
            <a
              v-if="perfil.website"
              :href="perfil.website"
              target="_blank"
              rel="noopener"
              >Web</a
            >
            <a
              v-if="perfil.instagram"
              :href="`https://instagram.com/${perfil.instagram}`"
              target="_blank"
              rel="noopener"
              >Instagram</a
            >
          </div>
        </div>

        <div class="encargo-zona">
          <RouterLink
            v-if="usuario && usuario.email !== artistEmail"
            :to="`/mensajes?para=${artistEmail}`"
            class="btn-mensaje"
          >
            💬 Enviar mensaje
          </RouterLink>
          <button
            v-if="usuario && usuario.email !== artistEmail"
            class="btn-seguir"
            :class="{ siguiendo }"
            :disabled="toggleandoSeguir"
            @click="toggleSeguir"
          >
            {{ siguiendo ? '✓ Siguiendo' : '+ Seguir' }}
          </button>
          <button
            v-if="!encargoEnviado && usuario && usuario.email !== artistEmail && (perfil?.acceptsCommissions || obras.some(o => o.acceptsCommissions))"
            class="btn-primary"
            @click="mostrarFormEncargo = !mostrarFormEncargo"
          >
            {{ mostrarFormEncargo ? "Cancelar" : "Solicitar encargo" }}
          </button>
          <p v-else class="encargo-ok">✓ Solicitud enviada</p>
        </div>
      </div>

      <!-- Formulario encargo -->
      <div v-if="mostrarFormEncargo" class="form-encargo">
        <h3>Solicitar encargo</h3>
        <input v-model="encargo.clientName" placeholder="Tu nombre" />
        <input
          v-model="encargo.clientEmail"
          type="email"
          placeholder="Tu email"
        />
        <textarea
          v-model="encargo.description"
          placeholder="Describe lo que necesitas..."
          rows="4"
        />
        <input
          v-model="encargo.budget"
          placeholder="Presupuesto aproximado (€)"
        />
        <button
          class="btn-primary"
          :disabled="enviandoEncargo"
          @click="enviarEncargo"
        >
          {{ enviandoEncargo ? "Enviando..." : "Enviar solicitud" }}
        </button>
      </div>

      <!-- Obras del artista -->
      <section class="artista-obras">
        <h2>Obras ({{ obras.length }})</h2>
        <div v-if="!obras.length" class="estado-vacio">
          Este artista aún no ha subido obras.
        </div>
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
  gap: 2rem;
  align-items: flex-start;
  margin-bottom: 3rem;
  padding: 2rem;
  background: var(--c-bg-card);
  border: 1.5px solid var(--c-border);
  border-radius: var(--r-xl);
  box-shadow: var(--shadow-card);
  flex-wrap: wrap;
}

.artista-avatar {
  width: 88px; height: 88px;
  border-radius: 50%;
  background: var(--c-gold-dim);
  color: var(--c-gold);
  font-family: var(--font-display);
  font-size: 2.2rem;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  border: 3px solid rgba(234,76,137,0.2);
}

.artista-meta { flex: 1; }
h1 {
  font-family: var(--font-display);
  font-size: 2rem; font-weight: 700; color: var(--c-text);
  letter-spacing: -0.02em; margin-bottom: 0.4rem;
}
.artista-ubicacion { color: var(--c-text-muted); font-size: 0.85rem; margin-bottom: 0.5rem; }
.artista-rating { font-size: 0.88rem; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.35rem; }
.rating-stars { color: #f59e0b; font-size: 1rem; }
.rating-total { color: var(--c-text-muted); font-size: 0.8rem; }
.artista-bio { color: var(--c-text-soft); line-height: 1.65; margin-bottom: 0.75rem; font-size: 0.925rem; }
.artista-links { display: flex; gap: 0.75rem; }
.artista-links a {
  font-size: 0.82rem; color: var(--c-gold); font-weight: 500;
  padding: 0.3rem 0.75rem;
  background: var(--c-gold-dim);
  border-radius: 99px;
  transition: all 0.15s;
}
.artista-links a:hover { background: rgba(234,76,137,0.15); }

.encargo-zona { margin-left: auto; display: flex; flex-direction: column; gap: 0.6rem; align-items: flex-end; }

.btn-primary {
  background: var(--c-gold); color: #fff; border: none;
  padding: 0.7rem 1.5rem; border-radius: var(--r-sm);
  font-family: var(--font-body); font-weight: 600; font-size: 0.875rem;
  cursor: pointer; transition: all 0.15s;
}
.btn-primary:disabled { opacity: 0.5; cursor: default; }
.btn-primary:hover:not(:disabled) {
  background: var(--c-gold-light);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(234,76,137,0.25);
}
.encargo-ok { color: #16a34a; font-size: 0.875rem; font-weight: 500; }

.btn-mensaje {
  display: inline-block;
  background: var(--c-bg-soft);
  border: 1.5px solid var(--c-border);
  color: var(--c-text-soft);
  padding: 0.6rem 1.25rem;
  border-radius: var(--r-sm);
  font-size: 0.875rem; font-weight: 500;
  text-decoration: none;
  transition: all 0.15s;
}
.btn-mensaje:hover { border-color: var(--c-gold); color: var(--c-gold); background: var(--c-gold-dim); }

.btn-seguir {
  display: inline-block;
  background: var(--c-bg-soft);
  border: 1.5px solid var(--c-border);
  color: var(--c-text-soft);
  padding: 0.6rem 1.25rem;
  border-radius: var(--r-sm);
  font-size: 0.875rem; font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  font-family: var(--font-body);
}
.btn-seguir:hover { border-color: var(--c-accent); color: var(--c-accent); }
.btn-seguir.siguiendo { background: var(--c-gold-dim); border-color: var(--c-gold); color: var(--c-gold); }
.btn-seguir.siguiendo:hover { background: rgba(234,76,137,0.08); color: #e44; border-color: #e44; }

.form-encargo {
  background: var(--c-bg-card);
  border: 1.5px solid var(--c-border);
  border-radius: var(--r-lg);
  padding: 1.75rem;
  margin-bottom: 2rem;
  display: flex; flex-direction: column; gap: 0.75rem;
  max-width: 560px;
  box-shadow: var(--shadow-card);
}
.form-encargo h3 {
  font-family: var(--font-display);
  font-size: 1.15rem; color: var(--c-text); margin-bottom: 0.25rem;
}
.form-encargo input, .form-encargo textarea {
  background: var(--c-bg-soft);
  border: 1.5px solid var(--c-border);
  border-radius: var(--r-sm);
  padding: 0.65rem 0.9rem;
  color: var(--c-text); font-family: var(--font-body); font-size: 0.875rem;
  outline: none; resize: vertical;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.form-encargo input:focus, .form-encargo textarea:focus {
  border-color: var(--c-gold);
  box-shadow: 0 0 0 3px rgba(234,76,137,0.08);
}

.artista-obras h2 {
  font-family: var(--font-display);
  font-size: 1.5rem; color: var(--c-text); margin-bottom: 1.5rem;
  letter-spacing: -0.01em;
}
.grid-obras {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1.5rem;
}
.estado-vacio { text-align: center; padding: 5rem; color: var(--c-text-muted); font-size: 0.9rem; }
</style>