<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter, useRoute } from "vue-router";
import { getArtworksByArtist, deleteArtwork } from "../services/artworks";
import { getProfile, upsertProfile } from "../services/profiles";
import { getValoracionesArtista } from "../services/valoraciones";
import {
  getCommissionsForArtist,
  updateCommissionStatus,
} from "../services/commissions";
import {
  aceptarOferta,
  rechazarOferta,
  marcarOfertaExpirada,
  escucharOfertasRecibidas,
  escucharOfertasEnviadas,
} from "../services/ofertas";
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
const ofertasRecibidas = ref([]);
const ofertasEnviadas = ref([]);
const pestana = ref("obras");
const guardandoPerfil = ref(false);
const perfilGuardado = ref(false);
const ahora = ref(Date.now());
const estadisticas = ref({ likes: 0, ventas: 0 });
const valoracionesData = ref({ valoraciones: [], media: null, total: 0 });
let tickInterval = null;
let unsubRecibidas = null;
let unsubEnviadas = null;
const router = useRouter();
const route = useRoute();

onMounted(() => {
  tickInterval = setInterval(() => { ahora.value = Date.now(); }, 30000);
  onAuthStateChanged(auth, async (user) => {
    usuario.value = user ?? null;
    if (!user) return;
    const [misObras, miPerfil, misEncargos] = await Promise.all([
      getArtworksByArtist(user.email),
      getProfile(user.email),
      getCommissionsForArtist(user.email),
    ]);
    obras.value = misObras;
    // Calcular estadísticas
    estadisticas.value.likes = misObras.reduce((s, o) => s + (o.likes || 0), 0);
    estadisticas.value.ventas = ofertasRecibidas.value.filter(o => o.status === 'paid').length;
    valoracionesData.value = await getValoracionesArtista(user.email);
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

    // Tiempo real para ofertas
    unsubRecibidas = escucharOfertasRecibidas(user.email, async (docs) => {
      for (const o of docs) {
        if (o.status === 'accepted' && o.expiresAt?.seconds * 1000 < Date.now()) {
          await marcarOfertaExpirada(o.id);
        }
      }
      ofertasRecibidas.value = docs;
    });
    unsubEnviadas = escucharOfertasEnviadas(user.email, async (docs) => {
      ofertasEnviadas.value = docs;
    });
  });
  // Si venimos con query ?tab=ofertas o similar, abrir esa pestaña
  if (route.query.tab) {
    pestana.value = route.query.tab;
  }
});

// React to query.tab changes (e.g., clicking the badge link)
watch(() => route.query.tab, (val) => {
  if (val) pestana.value = val;
});

onUnmounted(() => {
  if (tickInterval) clearInterval(tickInterval);
  if (unsubRecibidas) unsubRecibidas();
  if (unsubEnviadas) unsubEnviadas();
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

async function aceptar(oferta) {
  await aceptarOferta(oferta.id);
  oferta.status = 'accepted';
  oferta.expiresAt = { seconds: Math.floor(Date.now() / 1000) + 24 * 3600 };
}

async function rechazar(oferta) {
  await rechazarOferta(oferta.id);
  oferta.status = 'rejected';
}

function tiempoRestante(oferta) {
  if (!oferta.expiresAt) return '';
  const ms = oferta.expiresAt.seconds * 1000 - ahora.value;
  if (ms <= 0) return 'Expirada';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m restantes`;
}

async function pagarOferta(oferta) {
  try {
    const res = await fetch('http://localhost:9999/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: oferta.obraTitulo,
        precio: oferta.precioOferta,
        imagen: oferta.obraImagen,
        obraId: oferta.obraId,
        ofertaId: oferta.id,
        artEmail: oferta.artEmail || '',
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    window.location.href = data.url;
  } catch (e) {
    alert('Error al iniciar el pago: ' + e.message);
  }
}

const totalOfertas = () => ofertasRecibidas.value.filter(o => o.status === 'pending').length
  + ofertasEnviadas.value.filter(o => o.status === 'accepted').length;

function tieneOfertaAceptada(obraId) {
  return ofertasRecibidas.value.some(o => o.obraId === obraId && o.status === 'accepted');
}

async function cerrarSesion() {
  const auth = getAuth();
  await signOut(auth);
  localStorage.removeItem('idUsuario');
  router.push('/');
}

const ESTADO_LABELS = {
  pending: "Pendiente",
  accepted: "Aceptada",
  rejected: "Rechazada",
  paid: "Pagada",
  expired: "Expirada",
};
const OFERTA_ESTADO_CLASS = {
  pending: "pending",
  accepted: "accepted",
  rejected: "rejected",
  paid: "paid",
  expired: "expired",
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
      <div style="margin-left:auto;display:flex;gap:0.75rem;align-items:center;">
        <RouterLink to="/subir-obra" class="btn-primary">+ Subir obra</RouterLink>
        <button class="btn-salir-perfil" @click="cerrarSesion">Cerrar sesión</button>
      </div>
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
      <button
        :class="{ activo: pestana === 'ofertas' }"
        @click="pestana = 'ofertas'"
        class="tab-ofertas"
      >
        Ofertas
      </button>
      <button
        :class="{ activo: pestana === 'pedidos' }"
        @click="pestana = 'pedidos'"
      >
        Pedidos
      </button>
      <button
        :class="{ activo: pestana === 'estadisticas' }"
        @click="pestana = 'estadisticas'"
      >
        Estadísticas
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
          <div class="obra-acciones">
            <RouterLink
              :to="`/editar-obra/${obra.id}`"
              class="btn-editar"
              :class="{ disabled: tieneOfertaAceptada(obra.id) }"
              :title="tieneOfertaAceptada(obra.id) ? 'Hay una oferta aceptada pendiente de pago' : 'Editar obra'"
              @click.prevent="tieneOfertaAceptada(obra.id) ? null : $router.push(`/editar-obra/${obra.id}`)"
            >✏️</RouterLink>
            <button
              class="btn-borrar"
              @click="borrarObra(obra.id)"
              title="Eliminar obra"
            >✕</button>
          </div>
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
    <!-- Tab: Ofertas -->
    <div v-if="pestana === 'ofertas'" class="ofertas-layout">

      <!-- Recibidas (soy el vendedor) -->
      <section class="ofertas-seccion">
        <h3 class="ofertas-titulo">Ofertas recibidas</h3>
        <div v-if="!ofertasRecibidas.length" class="estado-vacio">No has recibido ofertas aún.</div>
        <div v-else class="lista-ofertas">
          <div v-for="o in ofertasRecibidas" :key="o.id" class="oferta-card">
            <img v-if="o.obraImagen" :src="o.obraImagen" class="oferta-thumb" />
            <div class="oferta-info">
              <RouterLink :to="`/obra/${o.obraId}`" class="oferta-obra-titulo">{{ o.obraTitulo }}</RouterLink>
              <span class="oferta-comprador">{{ o.buyerEmail }}</span>
              <span class="oferta-precio-ofrecido">Ofrece: <strong>{{ o.precioOferta }}€</strong></span>
              <span v-if="o.status === 'accepted' && o.expiresAt" class="oferta-countdown">
                ⏱ {{ tiempoRestante(o) }}
              </span>
            </div>
            <div class="oferta-acciones">
              <span class="badge-oferta" :class="OFERTA_ESTADO_CLASS[o.status]">
                {{ ESTADO_LABELS[o.status] }}
              </span>
              <template v-if="o.status === 'pending'">
                <button class="btn-aceptar" @click="aceptar(o)">Aceptar</button>
                <button class="btn-rechazar" @click="rechazar(o)">Rechazar</button>
              </template>
            </div>
          </div>
        </div>
      </section>

      <!-- Enviadas (soy el comprador) -->
      <section class="ofertas-seccion">
        <h3 class="ofertas-titulo">Mis ofertas enviadas</h3>
        <div v-if="!ofertasEnviadas.length" class="estado-vacio">No has enviado ofertas aún.</div>
        <div v-else class="lista-ofertas">
          <div v-for="o in ofertasEnviadas" :key="o.id" class="oferta-card">
            <img v-if="o.obraImagen" :src="o.obraImagen" class="oferta-thumb" />
            <div class="oferta-info">
              <RouterLink :to="`/obra/${o.obraId}`" class="oferta-obra-titulo">{{ o.obraTitulo }}</RouterLink>
              <span class="oferta-comprador">Vendedor: {{ o.artEmail }}</span>
              <span class="oferta-precio-ofrecido">Tu oferta: <strong>{{ o.precioOferta }}€</strong></span>
              <span v-if="o.status === 'accepted' && o.expiresAt" class="oferta-countdown">
                ⏱ {{ tiempoRestante(o) }}
              </span>
            </div>
            <div class="oferta-acciones">
              <span class="badge-oferta" :class="OFERTA_ESTADO_CLASS[o.status]">
                {{ ESTADO_LABELS[o.status] }}
              </span>
              <button
                v-if="o.status === 'accepted' && o.expiresAt?.seconds * 1000 > ahora"
                class="btn-pagar"
                @click="pagarOferta(o)"
              >
                💳 Pagar ahora
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Tab: Pedidos -->
    <div v-if="pestana === 'pedidos'" class="pedidos-layout">
      <div v-if="!ofertasEnviadas.filter(o => o.status === 'paid').length" class="estado-vacio">
        Aún no has realizado ninguna compra.
      </div>
      <div v-else class="lista-pedidos">
        <div
          v-for="o in ofertasEnviadas.filter(p => p.status === 'paid')"
          :key="o.id"
          class="pedido-card"
        >
          <RouterLink :to="`/obra/${o.obraId}`">
            <img v-if="o.obraImagen" :src="o.obraImagen" class="pedido-thumb" />
            <div v-else class="pedido-thumb pedido-thumb-placeholder">🖼</div>
          </RouterLink>
          <div class="pedido-info">
            <RouterLink :to="`/obra/${o.obraId}`" class="pedido-titulo">{{ o.obraTitulo }}</RouterLink>
            <span class="pedido-artista">Artista: <RouterLink :to="`/artista/${encodeURIComponent(o.artEmail)}`">{{ o.artEmail }}</RouterLink></span>
            <span class="pedido-precio">Pagado: <strong>{{ o.precioOferta }} €</strong></span>
            <span v-if="o.paidAt" class="pedido-fecha">
              {{ new Date(o.paidAt.seconds * 1000).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) }}
            </span>
          </div>
          <span class="badge-oferta paid">✓ Comprado</span>
        </div>
      </div>
    </div>

    <!-- Tab: Estadísticas -->
    <div v-if="pestana === 'estadisticas'" class="estadisticas-layout">
      <!-- Métricas rápidas -->
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-valor">{{ obras.length }}</span>
          <span class="stat-label">Obras publicadas</span>
        </div>
        <div class="stat-card">
          <span class="stat-valor">{{ estadisticas.likes }}</span>
          <span class="stat-label">Likes totales</span>
        </div>
        <div class="stat-card">
          <span class="stat-valor">{{ ofertasRecibidas.filter(o => o.status === 'paid').length }}</span>
          <span class="stat-label">Obras vendidas</span>
        </div>
        <div class="stat-card">
          <span class="stat-valor">
            {{ valoracionesData.media ? `${valoracionesData.media} ⭐` : '—' }}
          </span>
          <span class="stat-label">Valoración media ({{ valoracionesData.total }})</span>
        </div>
      </div>

      <!-- Tabla por obra -->
      <h3 class="stats-seccion-titulo">Detalle por obra</h3>
      <div class="stats-tabla">
        <div class="stats-fila stats-cabecera">
          <span>Obra</span><span>Likes</span><span>En venta</span>
        </div>
        <div v-for="obra in obras" :key="obra.id" class="stats-fila">
          <span class="stats-obra-titulo">{{ obra.title }}</span>
          <span>{{ obra.likes || 0 }} ♥</span>
          <span>{{ obra.forSale ? `${obra.price}€` : '—' }}</span>
        </div>
      </div>

      <!-- Valoraciones recibidas -->
      <h3 class="stats-seccion-titulo" style="margin-top:2rem;">Valoraciones recibidas</h3>
      <div v-if="!valoracionesData.valoraciones.length" class="estado-vacio">
        Aún no tienes valoraciones.
      </div>
      <div v-else class="valoraciones-lista">
        <div v-for="v in valoracionesData.valoraciones" :key="v.id" class="valoracion-item">
          <div class="val-estrellas">
            <span v-for="n in 5" :key="n" :class="['val-estrella', n <= v.puntuacion ? 'activa' : '']">★</span>
          </div>
          <div class="val-meta">
            <span class="val-comprador">{{ v.buyerEmail }}</span>
            <span class="val-obra">{{ v.obraTitulo }}</span>
          </div>
          <p v-if="v.comentario" class="val-comentario">{{ v.comentario }}</p>
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
.obra-acciones {
  position: absolute; top: 0.6rem; left: 0.6rem;
  display: flex; gap: 0.35rem;
}
.btn-borrar, .btn-editar {
  background: rgba(255,255,255,0.9);
  border: 1.5px solid var(--c-border);
  color: var(--c-text-muted);
  width: 30px; height: 30px;
  border-radius: 50%; cursor: pointer; font-size: 0.7rem;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
  box-shadow: var(--shadow-card);
  text-decoration: none;
}
.btn-editar:hover { color: var(--c-gold); border-color: var(--c-gold); }
.btn-editar.disabled { opacity: 0.4; cursor: not-allowed; pointer-events: none; }
.btn-borrar:hover { color: var(--c-danger); border-color: var(--c-danger); }

.form-perfil { display: flex; flex-direction: column; gap: 1.1rem; max-width: 560px; }

.btn-salir-perfil {
  background: transparent; border: 1.5px solid var(--c-border);
  color: var(--c-text-muted); padding: 0.45rem 1rem;
  border-radius: var(--r-sm); font-size: 0.8rem; font-weight: 500;
  cursor: pointer; transition: all 0.15s;
}
.btn-salir-perfil:hover { border-color: var(--c-danger); color: var(--c-danger); }

/* ── Estadísticas ── */
.estadisticas-layout { display: flex; flex-direction: column; gap: 1.5rem; }
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1rem;
}
.stat-card {
  background: var(--c-bg-card); border: 1.5px solid var(--c-border);
  border-radius: var(--r-xl); padding: 1.25rem 1.5rem;
  display: flex; flex-direction: column; align-items: center; gap: 0.35rem;
  box-shadow: var(--shadow-card); text-align: center;
}
.stat-valor { font-size: 1.9rem; font-weight: 700; color: var(--c-gold); font-family: var(--font-display); }
.stat-label { font-size: 0.75rem; color: var(--c-text-muted); font-weight: 500; }
.stats-seccion-titulo { font-size: 1rem; font-weight: 700; color: var(--c-text-soft); margin-bottom: 0.5rem; }
.stats-tabla { background: var(--c-bg-card); border: 1.5px solid var(--c-border); border-radius: var(--r-lg); overflow: hidden; }
.stats-fila {
  display: grid; grid-template-columns: 1fr 80px 80px;
  padding: 0.7rem 1rem; border-bottom: 1px solid var(--c-border); font-size: 0.85rem;
}
.stats-fila:last-child { border-bottom: none; }
.stats-cabecera { background: var(--c-bg-soft); font-size: 0.72rem; font-weight: 700; color: var(--c-text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
.stats-obra-titulo { font-weight: 500; color: var(--c-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* Valoraciones */
.valoraciones-lista { display: flex; flex-direction: column; gap: 0.85rem; }
.valoracion-item {
  background: var(--c-bg-card); border: 1.5px solid var(--c-border);
  border-radius: var(--r-lg); padding: 1rem 1.25rem;
  display: flex; flex-direction: column; gap: 0.35rem;
}
.val-estrellas { display: flex; gap: 0.15rem; }
.val-estrella { font-size: 1.1rem; color: var(--c-border); }
.val-estrella.activa { color: #f59e0b; }
.val-meta { display: flex; gap: 1rem; flex-wrap: wrap; }
.val-comprador { font-size: 0.78rem; color: var(--c-text-muted); }
.val-obra { font-size: 0.78rem; color: var(--c-gold); }
.val-comentario { font-size: 0.85rem; color: var(--c-text-soft); line-height: 1.55; margin: 0; }
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

/* --- Ofertas --- */
.tab-ofertas { position: relative; }
.badge-notif { display: none; }

.ofertas-layout { display: flex; flex-direction: column; gap: 2rem; margin-top: 0.5rem; }
.ofertas-seccion { display: flex; flex-direction: column; gap: 0.75rem; }
.ofertas-titulo {
  font-family: var(--font-display); font-size: 1.1rem; font-weight: 700;
  color: var(--c-text); letter-spacing: -0.01em;
}

.lista-ofertas { display: flex; flex-direction: column; gap: 0.75rem; }

.oferta-card {
  display: flex; align-items: center; gap: 1rem;
  background: var(--c-bg-card); border: 1.5px solid var(--c-border);
  border-radius: var(--r-xl); padding: 1rem 1.25rem;
  box-shadow: var(--shadow-card);
}

.oferta-thumb {
  width: 56px; height: 56px; border-radius: var(--r-md);
  object-fit: cover; flex-shrink: 0;
}

.oferta-info {
  flex: 1; display: flex; flex-direction: column; gap: 0.2rem; min-width: 0;
}
.oferta-obra-titulo {
  font-weight: 600; font-size: 0.9rem; color: var(--c-text);
  text-decoration: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.oferta-obra-titulo:hover { color: var(--c-gold); }
.oferta-comprador { font-size: 0.75rem; color: var(--c-text-muted); }
.oferta-precio-ofrecido { font-size: 0.82rem; color: var(--c-text-soft); }
.oferta-countdown { font-size: 0.75rem; color: var(--c-gold); font-weight: 600; }

.oferta-acciones {
  display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem; flex-shrink: 0;
}

.badge-oferta {
  font-size: 0.7rem; font-weight: 700; padding: 0.2rem 0.65rem;
  border-radius: 999px; white-space: nowrap;
}
.badge-oferta.pending { background: rgba(234,179,8,0.12); color: #b45309; }
.badge-oferta.accepted { background: rgba(34,197,94,0.12); color: #16a34a; }
.badge-oferta.rejected { background: var(--c-danger-dim); color: var(--c-danger); }
.badge-oferta.paid { background: rgba(99,102,241,0.12); color: #4338ca; }
.badge-oferta.expired { background: rgba(107,114,128,0.1); color: var(--c-text-muted); }

.btn-pagar {
  background: var(--c-gold); color: #fff; border: none;
  padding: 0.45rem 1rem; border-radius: var(--r-sm);
  font-size: 0.82rem; font-weight: 700; cursor: pointer;
  font-family: var(--font-body); transition: all 0.15s;
}
.btn-pagar:hover { background: var(--c-gold-light); }

/* Pedidos */
.pedidos-layout { display: flex; flex-direction: column; gap: 1rem; }
.lista-pedidos { display: flex; flex-direction: column; gap: 0.75rem; }
.pedido-card {
  display: flex; align-items: center; gap: 1rem;
  background: var(--c-bg-card); border: 1.5px solid var(--c-border);
  border-radius: var(--r-lg); padding: 1rem 1.25rem;
  transition: border-color 0.15s;
}
.pedido-card:hover { border-color: var(--c-border-hover); }
.pedido-thumb {
  width: 72px; height: 72px; object-fit: cover;
  border-radius: var(--r-sm); flex-shrink: 0;
}
.pedido-thumb-placeholder {
  display: flex; align-items: center; justify-content: center;
  background: var(--c-bg-soft); font-size: 1.5rem;
}
.pedido-info { display: flex; flex-direction: column; gap: 0.25rem; flex: 1; min-width: 0; }
.pedido-titulo {
  font-weight: 600; color: var(--c-text); text-decoration: none;
  font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.pedido-titulo:hover { color: var(--c-gold); }
.pedido-artista { font-size: 0.8rem; color: var(--c-text-muted); }
.pedido-artista a { color: var(--c-text-soft); text-decoration: none; }
.pedido-artista a:hover { color: var(--c-gold); }
.pedido-precio { font-size: 0.85rem; color: var(--c-text-soft); }
.pedido-fecha { font-size: 0.75rem; color: var(--c-text-muted); }
</style>