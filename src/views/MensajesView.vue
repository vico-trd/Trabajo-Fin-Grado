<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from "vue";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  escucharMensajes,
  enviarMensaje,
  crearOActualizarChat,
  escucharConversaciones,
} from "../services/mensajes";
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
let unsubMensajes = null;
let unsubConversaciones = null;

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    usuario.value = user ?? null;
    if (user) {
      socket.emit("registrar", user.email);
      unsubConversaciones = escucharConversaciones(user.email, (chats) => {
        conversaciones.value = chats;
      });
      if (destinatario.value) abrirChat();
    }
  });
});

onUnmounted(() => {
  socket.off("mensajePrivado");
  if (unsubMensajes) unsubMensajes();
  if (unsubConversaciones) unsubConversaciones();
});

async function abrirChat(email) {
  if (email) destinatario.value = email;
  if (!destinatario.value || !usuario.value) return;
  if (unsubMensajes) unsubMensajes();
  await crearOActualizarChat(usuario.value.email, destinatario.value);
  unsubMensajes = escucharMensajes(
    usuario.value.email,
    destinatario.value,
    (msgs) => {
      mensajes.value = msgs;
      nextTick(() => {
        if (contenedorMensajes.value) {
          contenedorMensajes.value.scrollTop =
            contenedorMensajes.value.scrollHeight;
        }
      });
    },
  );
}

async function enviar() {
  if (!textoMensaje.value.trim() || !destinatario.value || !usuario.value)
    return;
  const texto = textoMensaje.value.trim();
  textoMensaje.value = "";
  await enviarMensaje(usuario.value.email, destinatario.value, texto);
  socket.emit("mensajePrivado", {
    para: destinatario.value,
    de: usuario.value.email,
    texto,
  });
}

function otroParticipante(chat) {
  return chat.participantes.find((p) => p !== usuario.value.email);
}
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
          <div class="chat-item-avatar">
            {{ otroParticipante(chat)[0].toUpperCase() }}
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
          <button class="btn-buscar" @click="abrirChat()">Abrir</button>
        </div>

        <div class="chat-mensajes" ref="contenedorMensajes">
          <div v-if="!mensajes.length" class="estado-vacio-chat">
            Selecciona una conversación o escribe un email para empezar.
          </div>
          <div
            v-for="msg in mensajes"
            :key="msg.id"
            class="mensaje"
            :class="msg.de === usuario.email ? 'propio' : 'ajeno'"
          >
            <span class="mensaje-de">{{
              msg.de === usuario.email ? "Tú" : msg.de
            }}</span>
            <p class="mensaje-texto">{{ msg.texto }}</p>
          </div>
        </div>

        <div class="chat-input">
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

.chat-item-avatar {
  width: 38px; height: 38px; border-radius: 50%;
  background: var(--c-gold-dim); color: var(--c-gold);
  font-family: var(--font-display); font-size: 1rem;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  border: 2px solid rgba(234,76,137,0.2);
}

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
</style>