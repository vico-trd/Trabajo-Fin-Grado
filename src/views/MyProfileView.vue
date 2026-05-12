<script setup>
import { ref, onMounted } from "vue";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getArtworksByArtist, deleteArtwork } from "../services/artworks";
import { getProfile, upsertProfile } from "../services/profiles";
import {
  getCommissionsForArtist,
  updateCommissionStatus,
} from "../services/commissions";
import ArtworkCard from "../components/ArtworkCard.vue";

const usuario = ref(null);
const auth = getAuth();
const obras = ref([]);
const perfil = ref({
  bio: "",
  location: "",
  website: "",
  instagram: "",
  acceptsCommissions: false,
});
const encargos = ref([]);
const pestana = ref("obras");
const guardandoPerfil = ref(false);
const perfilGuardado = ref(false);

onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    usuario.value = user ?? null;
    if (!user) return;
    const [misObras, miPerfil, misEncargos] = await Promise.all([
      getArtworksByArtist(user.email),
      getProfile(user.email),
      getCommissionsForArtist(user.email),
    ]);
    obras.value = misObras;
    if (miPerfil) {
      perfil.value = {
        bio: miPerfil.bio || "",
        location: miPerfil.location || "",
        website: miPerfil.website || "",
        instagram: miPerfil.instagram || "",
        acceptsCommissions: miPerfil.acceptsCommissions || false,
      };
    }
    encargos.value = misEncargos;
  });
});

async function guardarPerfil() {
  guardandoPerfil.value = true;
  await upsertProfile(usuario.value.email, perfil.value);
  guardandoPerfil.value = false;
  perfilGuardado.value = true;
  setTimeout(() => (perfilGuardado.value = false), 2500);
}

async function borrarObra(id) {
  await deleteArtwork(id);
  obras.value = obras.value.filter((o) => o.id !== id);
}

async function cambiarEstadoEncargo(id, estado) {
  await updateCommissionStatus(id, estado);
  const encargo = encargos.value.find((e) => e.id === id);
  if (encargo) encargo.status = estado;
}

const ESTADO_LABELS = {
  pending: "Pendiente",
  accepted: "Aceptado",
  rejected: "Rechazado",
};
</script>

<template>
  <div class="mi-perfil">
    <!-- Cabecera usuario -->
    <div class="perfil-header">
      <img
        v-if="usuario?.photoURL"
        :src="usuario.photoURL"
        alt="avatar"
        class="avatar-img"
      />
      <div v-else class="avatar-placeholder">
        {{ usuario?.email?.[0].toUpperCase() }}
      </div>
      <div>
        <h1>{{ usuario?.displayName || usuario?.email }}</h1>
        <p class="email">{{ usuario?.email }}</p>
      </div>
      <RouterLink to="/subir-obra" class="btn-primary" style="margin-left: auto"
        >+ Subir obra</RouterLink
      >
    </div>

    <!-- Pestañas -->
    <div class="tabs">
      <button
        :class="{ activo: pestana === 'obras' }"
        @click="pestana = 'obras'"
      >
        Mis obras ({{ obras.length }})
      </button>
      <button
        :class="{ activo: pestana === 'perfil' }"
        @click="pestana = 'perfil'"
      >
        Perfil artístico
      </button>
      <button
        :class="{ activo: pestana === 'encargos' }"
        @click="pestana = 'encargos'"
      >
        Encargos ({{ encargos.length }})
      </button>
    </div>

    <!-- Tab: Obras -->
    <div v-if="pestana === 'obras'">
      <div v-if="!obras.length" class="estado-vacio">
        Aún no has subido ninguna obra.
        <RouterLink to="/subir-obra">Subir la primera →</RouterLink>
      </div>
      <div v-else class="grid-obras">
        <div v-for="obra in obras" :key="obra.id" class="obra-wrapper">
          <ArtworkCard :artwork="obra" />
          <button
            class="btn-borrar"
            @click="borrarObra(obra.id)"
            title="Eliminar obra"
          >
            ✕
          </button>
        </div>
      </div>
    </div>

    <!-- Tab: Perfil artístico -->
    <div v-if="pestana === 'perfil'" class="form-perfil">
      <div class="campo">
        <label>Bio</label>
        <textarea
          v-model="perfil.bio"
          placeholder="Cuéntanos quién eres y qué haces..."
          rows="4"
        />
      </div>
      <div class="campo">
        <label>Ubicación</label>
        <input v-model="perfil.location" placeholder="Ciudad, país..." />
      </div>
      <div class="fila-campos">
        <div class="campo">
          <label>Sitio web</label>
          <input v-model="perfil.website" placeholder="https://..." />
        </div>
        <div class="campo">
          <label>Instagram</label>
          <input v-model="perfil.instagram" placeholder="@usuario" />
        </div>
      </div>
      <label class="check-label">
        <input v-model="perfil.acceptsCommissions" type="checkbox" />
        Acepto encargos personalizados
      </label>
      <button
        class="btn-primary"
        :disabled="guardandoPerfil"
        @click="guardarPerfil"
      >
        {{
          guardandoPerfil
            ? "Guardando..."
            : perfilGuardado
              ? "✓ Guardado"
              : "Guardar perfil"
        }}
      </button>
    </div>

    <!-- Tab: Encargos -->
    <div v-if="pestana === 'encargos'">
      <div v-if="!encargos.length" class="estado-vacio">
        No tienes solicitudes de encargo.
      </div>
      <div v-else class="lista-encargos">
        <div v-for="e in encargos" :key="e.id" class="encargo-card">
          <div class="encargo-info">
            <span class="encargo-cliente"
              >{{ e.clientName }} — {{ e.clientEmail }}</span
            >
            <p class="encargo-desc">{{ e.description }}</p>
            <span v-if="e.budget" class="encargo-budget"
              >Presupuesto: {{ e.budget }} €</span
            >
          </div>
          <div class="encargo-acciones">
            <span class="badge-estado" :class="e.status">{{
              ESTADO_LABELS[e.status]
            }}</span>
            <template v-if="e.status === 'pending'">
              <button
                class="btn-aceptar"
                @click="cambiarEstadoEncargo(e.id, 'accepted')"
              >
                Aceptar
              </button>
              <button
                class="btn-rechazar"
                @click="cambiarEstadoEncargo(e.id, 'rejected')"
              >
                Rechazar
              </button>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mi-perfil { padding: 3rem 0 2rem; animation: fadeUp 0.5s ease-out both; }
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

.perfil-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2.5rem;
  flex-wrap: wrap;
  padding: 2rem;
  background: var(--c-bg-card);
  border: 1.5px solid var(--c-border);
  border-radius: var(--r-xl);
  box-shadow: var(--shadow-card);
}
.avatar-img, .avatar-placeholder {
  width: 72px; height: 72px;
  border-radius: 50%;
  border: 3px solid var(--c-border);
  flex-shrink: 0;
}
.avatar-placeholder {
  background: var(--c-gold-dim);
  color: var(--c-gold);
  font-family: var(--font-display);
  font-size: 1.8rem;
  display: flex; align-items: center; justify-content: center;
}
h1 {
  font-family: var(--font-display);
  font-size: 1.8rem; font-weight: 700; color: var(--c-text);
  letter-spacing: -0.02em;
}
.email { font-size: 0.85rem; color: var(--c-text-muted); margin-top: 0.2rem; }

.tabs {
  display: flex; gap: 0;
  margin-bottom: 2rem;
  border-bottom: 2px solid var(--c-border);
}
.tabs button {
  background: transparent; border: none;
  padding: 0.75rem 1.25rem;
  color: var(--c-text-muted);
  font-family: var(--font-body); font-size: 0.875rem; font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all 0.15s;
}
.tabs button:hover { color: var(--c-text); }
.tabs button.activo { color: var(--c-gold); border-bottom-color: var(--c-gold); }

.grid-obras {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1.5rem;
}
.obra-wrapper { position: relative; }
.btn-borrar {
  position: absolute; top: 0.6rem; left: 0.6rem;
  background: rgba(255,255,255,0.9);
  border: 1.5px solid var(--c-border);
  color: var(--c-text-muted);
  width: 30px; height: 30px;
  border-radius: 50%; cursor: pointer; font-size: 0.7rem;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
  box-shadow: var(--shadow-card);
}
.btn-borrar:hover { color: var(--c-danger); border-color: var(--c-danger); }

.form-perfil { display: flex; flex-direction: column; gap: 1.1rem; max-width: 560px; }
.campo { display: flex; flex-direction: column; gap: 0.4rem; }
.campo label { font-size: 0.78rem; color: var(--c-text-muted); font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; }
.campo input, .campo textarea {
  background: var(--c-bg-soft);
  border: 1.5px solid var(--c-border);
  border-radius: var(--r-sm);
  padding: 0.65rem 0.9rem;
  color: var(--c-text);
  font-family: var(--font-body); font-size: 0.875rem;
  outline: none; resize: vertical;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.campo input:focus, .campo textarea:focus {
  border-color: var(--c-gold);
  box-shadow: 0 0 0 3px rgba(234,76,137,0.08);
}
.fila-campos { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
.check-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: var(--c-text-soft); cursor: pointer; }

.lista-encargos { display: flex; flex-direction: column; gap: 1rem; }
.encargo-card {
  background: var(--c-bg-card);
  border: 1.5px solid var(--c-border);
  border-radius: var(--r-lg);
  padding: 1.25rem;
  display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap;
  transition: box-shadow 0.15s;
}
.encargo-card:hover { box-shadow: var(--shadow-card); }
.encargo-cliente { font-weight: 600; color: var(--c-text); font-size: 0.9rem; display: block; margin-bottom: 0.3rem; }
.encargo-desc { color: var(--c-text-soft); font-size: 0.875rem; margin-bottom: 0.3rem; }
.encargo-budget { font-size: 0.8rem; color: var(--c-gold); font-weight: 600; }
.encargo-acciones { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }
.badge-estado { font-size: 0.72rem; font-weight: 600; padding: 0.25rem 0.65rem; border-radius: 99px; }
.badge-estado.pending { background: rgba(234,76,137,0.1); color: var(--c-gold); }
.badge-estado.accepted { background: rgba(80,200,120,0.12); color: #16a34a; }
.badge-estado.rejected { background: var(--c-danger-dim); color: var(--c-danger); }
.btn-aceptar, .btn-rechazar {
  padding: 0.35rem 0.85rem; border-radius: var(--r-sm);
  font-size: 0.8rem; font-family: var(--font-body); font-weight: 500;
  cursor: pointer; transition: all 0.15s; border: 1.5px solid;
}
.btn-aceptar { background: rgba(80,200,120,0.08); border-color: rgba(80,200,120,0.3); color: #16a34a; }
.btn-rechazar { background: var(--c-danger-dim); border-color: rgba(224,90,78,0.3); color: var(--c-danger); }

.btn-primary {
  background: var(--c-gold); color: #fff; border: none;
  padding: 0.7rem 1.75rem; border-radius: var(--r-sm);
  font-family: var(--font-body); font-weight: 600; font-size: 0.9rem;
  cursor: pointer; transition: all 0.15s; align-self: flex-start;
  text-decoration: none; display: inline-block;
}
.btn-primary:disabled { opacity: 0.5; cursor: default; }
.btn-primary:hover:not(:disabled) {
  background: var(--c-gold-light);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(234,76,137,0.25);
}

.estado-vacio { text-align: center; padding: 5rem; color: var(--c-text-muted); font-size: 0.9rem; }
</style>