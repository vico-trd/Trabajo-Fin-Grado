<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  escucharMensajes,
  enviarMensaje,
  enviarMensajeOferta,
  crearOActualizarChat,
  escucharConversaciones,
} from "../services/mensajes";
import { getArtworksByArtist } from "../services/artworks";
import {
  crearOferta,
  aceptarOferta,
  rechazarOferta,
  escucharOfertasDelChat,
} from "../services/ofertas";
import socket from "../socket";
import { useRoute } from "vue-router";

const auth = getAuth();
const route = useRoute();
const usuario = ref(null);
const destinatario = ref(route.query.para || "");
const textoMensaje = ref("");
const mensajes = ref([]);
const conversaciones = ref([]);
const contenedorMensajes = ref(null);
// mapa ofertaId -> oferta (tiempo real)
const ofertasChat = ref({});
let unsubMensajes = null;
let unsubConversaciones = null;
let unsubOfertas = null;
let unsubOfertas2 = null;

// --- Estado online ---
const usuariosOnline = ref(new Set());
const destinatarioOnline = computed(() => usuariosOnline.value.has(destinatario.value));

socket.on("usuarioEstado", ({ email, online }) => {
  const nuevo = new Set(usuariosOnline.value);
  if (online) nuevo.add(email);
  else nuevo.delete(email);
  usuariosOnline.value = nuevo;
});
socket.on("listaOnline", (emails) => {
  usuariosOnline.value = new Set(emails);
});

// --- Productos ---
const productosDestinatario = ref([]);
const mostrarDropdownProductos = ref(false);
const productoElegido = ref(null);
const ofertaPrecio = ref("");
const mostrarFormOferta = ref(false);

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    usuario.value = user ?? null;
    if (user) {
      socket.emit("registrar", user.email);
      socket.emit("obtenerOnline");
      unsubConversaciones = escucharConversaciones(user.email, (chats) => {
        conversaciones.value = chats;
      });
      if (destinatario.value) abrirChat();
    }
  });
});

onUnmounted(() => {
  socket.off("mensajePrivado");
  socket.off("usuarioEstado");
  socket.off("listaOnline");
  if (unsubMensajes) unsubMensajes();
  if (unsubConversaciones) unsubConversaciones();
  if (unsubOfertas) unsubOfertas();
  if (unsubOfertas2) unsubOfertas2();
});

async function abrirChat(email) {
  if (email) destinatario.value = email;
  if (!destinatario.value || !usuario.value) return;
  if (unsubMensajes) unsubMensajes();
  if (unsubOfertas) unsubOfertas();
  if (unsubOfertas2) unsubOfertas2();
  mostrarDropdownProductos.value = false;
  productoElegido.value = null;
  ofertasChat.value = {};

  const todos = await getArtworksByArtist(destinatario.value);
  productosDestinatario.value = todos.filter((a) => a.forSale);

  // Escuchar ofertas en tiempo real para ambas direcciones
  const yo = usuario.value.email;
  const otro = destinatario.value;
  // Como comprador (artEmail=otro, buyerEmail=yo)
  unsubOfertas = escucharOfertasDelChat(otro, yo, (map) => {
    ofertasChat.value = { ...ofertasChat.value, ...map };
  });
  // Como vendedor (artEmail=yo, buyerEmail=otro)
  unsubOfertas2 = escucharOfertasDelChat(yo, otro, (map) => {
    ofertasChat.value = { ...ofertasChat.value, ...map };
  });

  await crearOActualizarChat(yo, otro);
  unsubMensajes = escucharMensajes(yo, otro, (msgs) => {
    mensajes.value = msgs;
    nextTick(() => {
      if (contenedorMensajes.value)
        contenedorMensajes.value.scrollTop = contenedorMensajes.value.scrollHeight;
    });
  });
}

async function enviar() {
  if (!textoMensaje.value.trim() || !destinatario.value || !usuario.value) return;
  const texto = textoMensaje.value.trim();
  textoMensaje.value = "";
  await enviarMensaje(usuario.value.email, destinatario.value, texto);
  socket.emit("mensajePrivado", { para: destinatario.value, de: usuario.value.email, texto });
}

function otroParticipante(chat) {
  return chat.participantes.find((p) => p !== usuario.value.email);
}

function seleccionarProducto(producto) {
  productoElegido.value = producto;
  mostrarFormOferta.value = false;
  ofertaPrecio.value = "";
}

async function enviarMensajePredefinido(tipo) {
  if (!productoElegido.value) return;
  const prod = productoElegido.value;
  const titulo = prod.title;

  if (tipo === "disponible") {
    textoMensaje.value = `Hola, me interesa tu obra «${titulo}». ¿Sigue disponible?`;
    productoElegido.value = null;
    mostrarDropdownProductos.value = false;
    enviar();
  } else if (tipo === "mas_info") {
    textoMensaje.value = `¿Podrías contarme más detalles sobre «${titulo}»?`;
    productoElegido.value = null;
    mostrarDropdownProductos.value = false;
    enviar();
  } else if (tipo === "oferta") {
    if (!ofertaPrecio.value) return;
    const precio = ofertaPrecio.value;
    // Crear oferta en Firestore
    const docRef = await crearOferta({
      obraId: prod.id,
      obraTitulo: titulo,
      obraImagen: prod.imageUrl || "",
      artEmail: destinatario.value,
      buyerEmail: usuario.value.email,
      precioOferta: precio,
    });
    // Enviar mensaje tipo 'oferta' con referencia
    await enviarMensajeOferta(usuario.value.email, destinatario.value, {
      ofertaId: docRef.id,
      obraTitulo: titulo,
      obraImagen: prod.imageUrl || "",
      obraId: prod.id,
      precio,
    });
    socket.emit("mensajePrivado", {
      para: destinatario.value,
      de: usuario.value.email,
      texto: `Oferta por «${titulo}»: ${precio}€`,
    });
    ofertaPrecio.value = "";
    mostrarFormOferta.value = false;
    productoElegido.value = null;
    mostrarDropdownProductos.value = false;
  }
}

// Aceptar/rechazar oferta desde el chat (solo el vendedor)
async function responderOferta(ofertaId, accion) {
  if (accion === "aceptar") await aceptarOferta(ofertaId);
  else await rechazarOferta(ofertaId);
}

function estadoOferta(ofertaId) {
  return ofertasChat.value[ofertaId]?.status ?? "pending";
}

const ESTADO_LABEL = { pending: "Pendiente", accepted: "Aceptada ✓", rejected: "Rechazada ✗", paid: "Pagada 💳", expired: "Expirada" };
</script>

<template>
  <div class="mensajes-page">
    <h1>Mensajes</h1>

    <div v-if="!usuario" class="estado-vacio">
      Inicia sesión para usar los mensajes.
    </div>

    <div v-else class="chat-layout">
      <!-- Lista conversaciones -->
      <div class="chat-lista">
        <div class="chat-lista-header">Conversaciones</div>
        <div v-if="!conversaciones.length" class="chat-lista-vacia">
          Sin conversaciones aún.
        </div>
        <div
          v-for="chat in conversaciones"
          :key="chat.id"
          class="chat-item"
          :class="{ activo: destinatario === otroParticipante(chat) }"
          @click="abrirChat(otroParticipante(chat))"
        >
          <div class="chat-item-avatar-wrap">
            <div class="chat-item-avatar">
              {{ otroParticipante(chat)[0].toUpperCase() }}
            </div>
            <span
              class="online-dot"
              :class="{ online: usuariosOnline.has(otroParticipante(chat)) }"
            ></span>
          </div>
          <span class="chat-item-email">{{ otroParticipante(chat) }}</span>
        </div>
      </div>

      <!-- Chat -->
      <div class="chat-box">
        <div class="chat-destinatario">
          <label>Para:</label>
          <input
            v-model="destinatario"
            placeholder="email del artista..."
            @keyup.enter="abrirChat()"
          />
          <span
            v-if="destinatario"
            class="estado-online-badge"
            :class="{ online: destinatarioOnline }"
          >
            {{ destinatarioOnline ? "En línea" : "Desconectado" }}
          </span>
          <button class="btn-buscar" @click="abrirChat()">Abrir</button>
          <RouterLink
            v-if="destinatario"
            :to="`/artista/${encodeURIComponent(destinatario)}`"
            class="btn-ver-perfil"
            title="Ver perfil"
          >👤 Perfil</RouterLink>
        </div>

        <div class="chat-mensajes" ref="contenedorMensajes">
          <div v-if="!mensajes.length" class="estado-vacio-chat">
            Selecciona una conversación o escribe un email para empezar.
          </div>

          <template v-for="msg in mensajes" :key="msg.id">
            <!-- Mensaje de oferta (tarjeta) -->
            <div
              v-if="msg.tipo === 'oferta'"
              class="mensaje-oferta-wrap"
              :class="msg.de === usuario.email ? 'propio' : 'ajeno'"
            >
              <span class="mensaje-de">{{ msg.de === usuario.email ? "Tú" : msg.de }}</span>
              <div class="oferta-card-chat">
                <img v-if="msg.obraImagen" :src="msg.obraImagen" class="oferta-card-img" />
                <div class="oferta-card-body">
                  <RouterLink :to="`/obra/${msg.obraId}`" class="oferta-card-titulo">
                    {{ msg.obraTitulo }}
                  </RouterLink>
                  <span class="oferta-card-precio">{{ msg.precio }}€</span>
                  <span
                    class="oferta-card-estado"
                    :class="estadoOferta(msg.ofertaId)"
                  >
                    {{ ESTADO_LABEL[estadoOferta(msg.ofertaId)] }}
                  </span>
                </div>
                <!-- Botones para el vendedor cuando está pendiente -->
                <div
                  v-if="msg.de !== usuario.email && estadoOferta(msg.ofertaId) === 'pending'"
                  class="oferta-card-acciones"
                >
                  <button class="btn-aceptar-oferta" @click="responderOferta(msg.ofertaId, 'aceptar')">
                    Aceptar
                  </button>
                  <button class="btn-rechazar-oferta" @click="responderOferta(msg.ofertaId, 'rechazar')">
                    Rechazar
                  </button>
                </div>
                <!-- Botón pagar para el comprador cuando está aceptada -->
                <div
                  v-if="msg.de === usuario.email && estadoOferta(msg.ofertaId) === 'accepted'"
                  class="oferta-card-acciones"
                >
                  <RouterLink to="/mi-perfil" class="btn-pagar-oferta">
                    💳 Ir a pagar
                  </RouterLink>
                </div>
              </div>
            </div>

            <!-- Mensaje normal de texto -->
            <div
              v-else
              class="mensaje"
              :class="msg.de === usuario.email ? 'propio' : 'ajeno'"
            >
              <span class="mensaje-de">{{ msg.de === usuario.email ? "Tú" : msg.de }}</span>
              <p class="mensaje-texto">{{ msg.texto }}</p>
            </div>
          </template>
        </div>

        <!-- Panel de productos -->
        <div
          v-if="mostrarDropdownProductos && productosDestinatario.length"
          class="productos-panel"
        >
          <div v-if="!productoElegido" class="productos-lista">
            <div class="productos-header">Obras en venta de {{ destinatario }}</div>
            <div
              v-for="p in productosDestinatario"
              :key="p.id"
              class="producto-item"
              @click="seleccionarProducto(p)"
            >
              <img v-if="p.imageUrl" :src="p.imageUrl" class="producto-thumb" />
              <div class="producto-info">
                <span class="producto-titulo">{{ p.title }}</span>
                <span v-if="p.price" class="producto-precio">{{ p.price }}€</span>
              </div>
            </div>
          </div>
          <div v-else class="mensajes-predefinidos">
            <div class="predefinidos-header">
              <button class="btn-volver" @click="productoElegido = null">← Volver</button>
              <span>«{{ productoElegido.title }}»</span>
            </div>
            <button class="btn-predefinido" @click="enviarMensajePredefinido('disponible')">
              ¿Sigue disponible?
            </button>
            <button class="btn-predefinido" @click="enviarMensajePredefinido('mas_info')">
              Pedir más información
            </button>
            <div class="oferta-row">
              <button class="btn-predefinido" @click="mostrarFormOferta = !mostrarFormOferta">
                💰 Hacer una oferta
              </button>
              <div v-if="mostrarFormOferta" class="oferta-form">
                <input
                  v-model="ofertaPrecio"
                  type="number"
                  placeholder="Precio en €"
                  class="oferta-input"
                  @keyup.enter="enviarMensajePredefinido('oferta')"
                />
                <button class="btn-oferta-enviar" @click="enviarMensajePredefinido('oferta')">
                  Enviar oferta
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="chat-input">
          <button
            v-if="destinatario && productosDestinatario.length"
            class="btn-productos"
            :class="{ activo: mostrarDropdownProductos }"
            @click="mostrarDropdownProductos = !mostrarDropdownProductos; productoElegido = null"
            title="Ver obras en venta"
          >🎨</button>
          <input
            v-model="textoMensaje"
            placeholder="Escribe un mensaje..."
            @keyup.enter="enviar"
          />
          <button @click="enviar">Enviar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mensajes-page { padding: 3rem 0 2rem; animation: fadeUp 0.5s ease-out both; }
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

h1 {
  font-family: var(--font-display);
  font-size: 2.5rem; font-weight: 700; color: var(--c-text);
  letter-spacing: -0.02em; margin-bottom: 2rem;
}

.chat-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 1.25rem;
  height: 600px;
}

.chat-lista {
  background: var(--c-bg-card);
  border: 1.5px solid var(--c-border);
  border-radius: var(--r-xl);
  display: flex; flex-direction: column;
  overflow: hidden;
  box-shadow: var(--shadow-card);
}

.chat-lista-header {
  padding: 1.1rem 1.25rem;
  font-size: 0.72rem; font-weight: 700; color: var(--c-text-muted);
  border-bottom: 1px solid var(--c-border);
  text-transform: uppercase; letter-spacing: 0.08em;
}

.chat-lista-vacia {
  padding: 2rem 1.25rem;
  font-size: 0.82rem; color: var(--c-text-muted); text-align: center;
}

.chat-item {
  display: flex; align-items: center; gap: 0.85rem;
  padding: 0.9rem 1.25rem;
  cursor: pointer; transition: background 0.15s;
  border-bottom: 1px solid var(--c-border);
}
.chat-item:hover { background: var(--c-bg-mute); }
.chat-item.activo { background: var(--c-gold-dim); border-left: 3px solid var(--c-gold); }

.chat-item-avatar-wrap {
  position: relative; flex-shrink: 0;
}

.chat-item-avatar {
  width: 38px; height: 38px; border-radius: 50%;
  background: var(--c-gold-dim); color: var(--c-gold);
  font-family: var(--font-display); font-size: 1rem;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid rgba(234,76,137,0.2);
}

.online-dot {
  position: absolute; bottom: 1px; right: 1px;
  width: 10px; height: 10px; border-radius: 50%;
  background: var(--c-border); border: 2px solid var(--c-bg-card);
}
.online-dot.online { background: #22c55e; }

.estado-online-badge {
  font-size: 0.7rem; font-weight: 600; padding: 0.2rem 0.65rem;
  border-radius: 999px; background: rgba(107,114,128,0.1);
  color: var(--c-text-muted); white-space: nowrap; flex-shrink: 0;
}
.estado-online-badge.online { background: rgba(34,197,94,0.12); color: #16a34a; }

.chat-item-email {
  font-size: 0.8rem; color: var(--c-text-soft); font-weight: 500;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.chat-box {
  background: var(--c-bg-card);
  border: 1.5px solid var(--c-border);
  border-radius: var(--r-xl);
  display: flex; flex-direction: column;
  overflow: hidden;
  box-shadow: var(--shadow-card);
}

.chat-destinatario {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.85rem 1.25rem;
  border-bottom: 1px solid var(--c-border);
  background: var(--c-bg-soft);
}
.chat-destinatario label { color: var(--c-text-muted); font-size: 0.82rem; font-weight: 600; white-space: nowrap; }
.chat-destinatario input {
  flex: 1; background: transparent; border: none;
  color: var(--c-text); font-family: var(--font-body); font-size: 0.875rem; outline: none;
}
.btn-buscar {
  background: var(--c-gold-dim); border: 1px solid rgba(234,76,137,0.2);
  color: var(--c-gold); padding: 0.3rem 0.85rem;
  border-radius: var(--r-sm); font-size: 0.8rem; font-weight: 500;
  cursor: pointer; transition: all 0.15s; white-space: nowrap;
}
.btn-buscar:hover { background: var(--c-gold); color: #fff; }

.btn-ver-perfil {
  background: var(--c-bg-soft); border: 1.5px solid var(--c-border);
  color: var(--c-text-soft); padding: 0.3rem 0.85rem;
  border-radius: var(--r-sm); font-size: 0.8rem; font-weight: 500;
  cursor: pointer; transition: all 0.15s; white-space: nowrap;
  text-decoration: none; flex-shrink: 0;
}
.btn-ver-perfil:hover { border-color: var(--c-gold); color: var(--c-gold); }

.chat-mensajes {
  flex: 1; overflow-y: auto; padding: 1.25rem;
  display: flex; flex-direction: column; gap: 0.85rem;
  background: var(--c-bg-soft);
}

.estado-vacio-chat {
  text-align: center; margin: auto;
  color: var(--c-text-muted); font-size: 0.875rem;
}

.mensaje { max-width: 72%; display: flex; flex-direction: column; gap: 0.2rem; }
.mensaje.propio { align-self: flex-end; align-items: flex-end; }
.mensaje.ajeno { align-self: flex-start; }
.mensaje-de { font-size: 0.7rem; color: var(--c-text-muted); font-weight: 500; }
.mensaje-texto {
  background: var(--c-bg-card);
  padding: 0.6rem 1rem;
  border-radius: var(--r-md);
  color: var(--c-text); font-size: 0.875rem; line-height: 1.55;
  box-shadow: var(--shadow-card);
}
.mensaje.propio .mensaje-texto { background: var(--c-gold); color: #fff; }

.chat-input {
  display: flex; gap: 0.6rem;
  padding: 0.85rem 1.25rem;
  border-top: 1px solid var(--c-border);
  background: var(--c-bg-card);
}
.chat-input input {
  flex: 1; background: var(--c-bg-soft);
  border: 1.5px solid var(--c-border);
  border-radius: var(--r-sm);
  padding: 0.6rem 1rem; color: var(--c-text);
  font-family: var(--font-body); font-size: 0.875rem; outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.chat-input input:focus {
  border-color: var(--c-gold);
  box-shadow: 0 0 0 3px rgba(234,76,137,0.08);
}
.chat-input button {
  background: var(--c-gold); color: #fff; border: none;
  padding: 0.6rem 1.4rem; border-radius: var(--r-sm);
  font-family: var(--font-body); font-weight: 600; font-size: 0.875rem;
  cursor: pointer; transition: all 0.15s;
}
.chat-input button:hover { background: var(--c-gold-light); }
.estado-vacio { text-align: center; padding: 4rem; color: var(--c-text-muted); }

/* --- Productos --- */
.productos-panel {
  border-top: 1px solid var(--c-border);
  background: var(--c-bg-card);
  max-height: 200px; overflow-y: auto;
}

.productos-header, .predefinidos-header {
  padding: 0.5rem 1rem;
  font-size: 0.72rem; font-weight: 700; color: var(--c-text-muted);
  text-transform: uppercase; letter-spacing: 0.06em;
  border-bottom: 1px solid var(--c-border);
  display: flex; align-items: center; gap: 0.75rem;
}

.producto-item {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.55rem 1rem; cursor: pointer;
  border-bottom: 1px solid var(--c-border); transition: background 0.12s;
}
.producto-item:hover { background: var(--c-bg-mute); }

.producto-thumb {
  width: 38px; height: 38px; border-radius: var(--r-sm);
  object-fit: cover; flex-shrink: 0;
}

.producto-info { display: flex; flex-direction: column; gap: 0.1rem; }
.producto-titulo { font-size: 0.82rem; color: var(--c-text); font-weight: 500; }
.producto-precio { font-size: 0.75rem; color: var(--c-gold); font-weight: 600; }

.mensajes-predefinidos {
  padding: 0.6rem 1rem 0.75rem;
  display: flex; flex-direction: column; gap: 0.4rem;
}

.btn-volver {
  background: none; border: none; color: var(--c-text-muted);
  font-size: 0.78rem; cursor: pointer; padding: 0;
  font-family: var(--font-body);
}
.btn-volver:hover { color: var(--c-gold); }

.btn-predefinido {
  background: var(--c-bg-soft); border: 1.5px solid var(--c-border);
  border-radius: var(--r-sm); padding: 0.4rem 0.9rem;
  font-size: 0.82rem; color: var(--c-text); cursor: pointer;
  text-align: left; font-family: var(--font-body); transition: all 0.12s;
}
.btn-predefinido:hover { border-color: var(--c-gold); color: var(--c-gold); }

.oferta-row { display: flex; flex-direction: column; gap: 0.4rem; }
.oferta-form { display: flex; gap: 0.5rem; align-items: center; }

.oferta-input {
  flex: 1; background: var(--c-bg-soft); border: 1.5px solid var(--c-border);
  border-radius: var(--r-sm); padding: 0.4rem 0.75rem;
  color: var(--c-text); font-size: 0.82rem; outline: none;
  font-family: var(--font-body); transition: border-color 0.15s;
}
.oferta-input:focus { border-color: var(--c-gold); }

.btn-oferta-enviar {
  background: var(--c-gold); color: #fff; border: none;
  padding: 0.4rem 0.9rem; border-radius: var(--r-sm);
  font-size: 0.82rem; font-weight: 600; cursor: pointer;
  font-family: var(--font-body); transition: all 0.15s; white-space: nowrap;
}
.btn-oferta-enviar:hover { background: var(--c-gold-light); }

.btn-productos {
  background: var(--c-bg-soft); border: 1.5px solid var(--c-border);
  border-radius: var(--r-sm); padding: 0.4rem 0.7rem;
  font-size: 1rem; cursor: pointer; transition: all 0.15s; flex-shrink: 0;
}
.btn-productos:hover, .btn-productos.activo {
  border-color: var(--c-gold); background: var(--c-gold-dim);
}

/* ---- Tarjeta de oferta en el chat ---- */
.mensaje-oferta-wrap {
  display: flex; flex-direction: column; gap: 0.2rem;
  max-width: 360px;
}
.mensaje-oferta-wrap.propio { align-self: flex-end; align-items: flex-end; }
.mensaje-oferta-wrap.ajeno  { align-self: flex-start; align-items: flex-start; }

.oferta-card-chat {
  background: var(--c-bg-card);
  border: 1.5px solid var(--c-border);
  border-radius: var(--r-lg);
  overflow: hidden;
  box-shadow: var(--shadow-card);
  width: 100%;
}
.oferta-card-img {
  width: 100%; height: 140px; object-fit: cover; display: block;
  border-bottom: 1px solid var(--c-border);
}
.oferta-card-body {
  padding: 0.75rem 1rem 0.5rem;
  display: flex; flex-direction: column; gap: 0.25rem;
}
.oferta-card-titulo {
  font-weight: 600; font-size: 0.85rem; color: var(--c-text); text-decoration: none;
}
.oferta-card-titulo:hover { color: var(--c-gold); text-decoration: underline; }
.oferta-card-precio {
  font-size: 1.05rem; font-weight: 700; color: var(--c-gold);
}
.oferta-card-estado {
  font-size: 0.72rem; font-weight: 700; padding: 0.18rem 0.55rem;
  border-radius: 999px; align-self: flex-start; text-transform: uppercase;
  letter-spacing: 0.06em;
}
.oferta-card-estado.pending  { background: rgba(234,179,8,0.15);  color: #a16207; }
.oferta-card-estado.accepted { background: rgba(34,197,94,0.12);  color: #15803d; }
.oferta-card-estado.rejected { background: rgba(239,68,68,0.1);   color: #b91c1c; }
.oferta-card-estado.paid     { background: rgba(99,102,241,0.1);  color: #4338ca; }
.oferta-card-estado.expired  { background: rgba(107,114,128,0.1); color: #4b5563; }

.oferta-card-acciones {
  display: flex; gap: 0.5rem; padding: 0.6rem 1rem 0.75rem;
  border-top: 1px solid var(--c-border);
}
.btn-aceptar-oferta, .btn-rechazar-oferta, .btn-pagar-oferta {
  flex: 1; border: none; border-radius: var(--r-sm);
  font-size: 0.8rem; font-weight: 600; padding: 0.4rem 0.6rem;
  cursor: pointer; transition: all 0.15s; text-align: center; text-decoration: none;
}
.btn-aceptar-oferta {
  background: rgba(34,197,94,0.15); color: #15803d;
}
.btn-aceptar-oferta:hover { background: rgba(34,197,94,0.3); }
.btn-rechazar-oferta {
  background: rgba(239,68,68,0.1); color: #b91c1c;
}
.btn-rechazar-oferta:hover { background: rgba(239,68,68,0.2); }
.btn-pagar-oferta {
  background: var(--c-gold-dim); color: var(--c-gold);
  border: 1px solid rgba(234,76,137,0.2);
  display: flex; align-items: center; justify-content: center; gap: 0.3rem;
}
.btn-pagar-oferta:hover { background: var(--c-gold-light); }
</style>