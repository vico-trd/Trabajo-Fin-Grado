<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getArtwork } from '../services/artworks'
import { getComments, addComment } from '../services/comments'
import { getLike, toggleLike } from '../services/likes'
import { useAuth } from '../composables/useAuth'

const route = useRoute()
const { usuario } = useAuth()

const obra = ref(null)
const comentarios = ref([])
const meGusta = ref(false)
const cargando = ref(true)
const textoComentario = ref('')
const enviandoComentario = ref(false)

onMounted(async () => {
  const id = route.params.id
  obra.value = await getArtwork(id)
  comentarios.value = await getComments(id)
  if (usuario.value) {
    const like = await getLike(id, usuario.value.email)
    meGusta.value = !!like
  }
  cargando.value = false
})

async function darLike() {
  if (!usuario.value) return
  meGusta.value = await toggleLike(obra.value.id, usuario.value.email)
  // Actualizar contador local sin recargar
  obra.value.likesCount += meGusta.value ? 1 : -1
}

async function enviarComentario() {
  if (!textoComentario.value.trim() || !usuario.value) return
  enviandoComentario.value = true
  await addComment(obra.value.id, textoComentario.value.trim(), usuario.value)
  comentarios.value = await getComments(obra.value.id)
  textoComentario.value = ''
  enviandoComentario.value = false
}
</script>

<template>
  <div class="detalle">
    <div v-if="cargando" class="estado-vacio">Cargando...</div>
    <div v-else-if="!obra" class="estado-vacio">Obra no encontrada.</div>
    <template v-else>

      <div class="detalle-grid">
        <!-- Imagen -->
        <div class="detalle-imagen">
          <img v-if="obra.imageUrl" :src="obra.imageUrl" :alt="obra.title" />
          <div v-else class="img-placeholder">🎨</div>
        </div>

        <!-- Info -->
        <div class="detalle-info">
          <span class="categoria-tag">{{ obra.category }}</span>
          <h1>{{ obra.title }}</h1>
          <RouterLink :to="`/artista/${encodeURIComponent(obra.artistEmail)}`" class="artista-link">
            {{ obra.artistName || obra.artistEmail }}
          </RouterLink>

          <p v-if="obra.description" class="descripcion">{{ obra.description }}</p>

          <dl class="ficha">
            <template v-if="obra.technique">
              <dt>Técnica</dt><dd>{{ obra.technique }}</dd>
            </template>
            <template v-if="obra.dimensions">
              <dt>Dimensiones</dt><dd>{{ obra.dimensions }}</dd>
            </template>
            <template v-if="obra.year">
              <dt>Año</dt><dd>{{ obra.year }}</dd>
            </template>
            <template v-if="obra.location">
              <dt>Ubicación</dt><dd>{{ obra.location }}</dd>
            </template>
          </dl>

          <div class="acciones">
            <button
              class="btn-like"
              :class="{ activo: meGusta }"
              :disabled="!usuario"
              @click="darLike"
              :title="usuario ? '' : 'Inicia sesión para dar like'"
            >
              ♥ {{ obra.likesCount ?? 0 }}
            </button>
            <span v-if="obra.forSale" class="precio">{{ obra.price }} €</span>
          </div>

          <div v-if="obra.acceptsCommissions" class="encargo-aviso">
            Este artista acepta encargos.
            <RouterLink :to="`/artista/${encodeURIComponent(obra.artistEmail)}`">Solicitar →</RouterLink>
          </div>
        </div>
      </div>

      <!-- Comentarios -->
      <section class="comentarios">
        <h2>Comentarios ({{ comentarios.length }})</h2>

        <div v-if="usuario" class="nuevo-comentario">
          <textarea
            v-model="textoComentario"
            placeholder="Escribe un comentario..."
            rows="3"
          />
          <button class="btn-primary" :disabled="enviandoComentario || !textoComentario.trim()" @click="enviarComentario">
            {{ enviandoComentario ? 'Enviando...' : 'Comentar' }}
          </button>
        </div>
        <p v-else class="aviso-login">
          <RouterLink to="/login">Inicia sesión</RouterLink> para comentar.
        </p>

        <div v-if="!comentarios.length" class="estado-vacio">Sé el primero en comentar.</div>
        <div v-else class="lista-comentarios">
          <div v-for="c in comentarios" :key="c.id" class="comentario">
            <span class="autor">{{ c.authorName }}</span>
            <p>{{ c.text }}</p>
          </div>
        </div>
      </section>

    </template>
  </div>
</template>

<style scoped>
.detalle { padding: 3rem 0 2rem; animation: fadeUp 0.5s ease-out both; }
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

.detalle-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  margin-bottom: 3rem;
}
@media (max-width: 700px) { .detalle-grid { grid-template-columns: 1fr; } }

.detalle-imagen img, .img-placeholder {
  width: 100%;
  aspect-ratio: 4/3;
  object-fit: cover;
  border-radius: var(--r-lg);
  background: var(--c-bg-mute);
}
.img-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 4rem;
  color: var(--c-text-muted);
}

.categoria-tag {
  font-size: 0.75rem;
  color: var(--c-gold);
  background: var(--c-gold-dim);
  padding: 0.2rem 0.6rem;
  border-radius: 99px;
}

h1 {
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 700;
  color: var(--c-text);
  margin: 0.75rem 0 0.25rem;
}

.artista-link {
  font-size: 0.9rem;
  color: var(--c-gold);
  display: block;
  margin-bottom: 1rem;
}

.descripcion {
  color: var(--c-text-soft);
  line-height: 1.7;
  margin-bottom: 1.25rem;
}

.ficha {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.3rem 1rem;
  margin-bottom: 1.5rem;
}
dt { color: var(--c-text-muted); font-size: 0.8rem; }
dd { color: var(--c-text-soft); font-size: 0.875rem; }

.acciones {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.btn-like {
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  color: var(--c-text-muted);
  padding: 0.5rem 1.1rem;
  border-radius: var(--r-sm);
  font-family: var(--font-body);
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-like:hover:not(:disabled) { border-color: var(--c-danger); color: var(--c-danger); }
.btn-like.activo { border-color: var(--c-danger); color: var(--c-danger); background: rgba(224,90,78,0.08); }
.btn-like:disabled { opacity: 0.5; cursor: default; }

.precio {
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--c-gold);
}

.encargo-aviso {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: var(--c-gold-dim);
  border-radius: var(--r-sm);
  font-size: 0.85rem;
  color: var(--c-text-soft);
}

.comentarios { margin-top: 3rem; }
h2 {
  font-family: var(--font-display);
  font-size: 1.4rem;
  color: var(--c-text);
  margin-bottom: 1.25rem;
}

.nuevo-comentario {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}
.nuevo-comentario textarea {
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--r-md);
  padding: 0.75rem;
  color: var(--c-text);
  font-family: var(--font-body);
  font-size: 0.875rem;
  resize: vertical;
  outline: none;
}
.nuevo-comentario textarea:focus { border-color: var(--c-gold); }

.btn-primary {
  background: var(--c-gold);
  color: #0d0f14;
  border: none;
  padding: 0.6rem 1.5rem;
  border-radius: var(--r-sm);
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  align-self: flex-end;
  transition: all 0.2s;
}
.btn-primary:disabled { opacity: 0.5; cursor: default; }
.btn-primary:hover:not(:disabled) { background: var(--c-gold-light); }

.aviso-login { color: var(--c-text-muted); font-size: 0.875rem; margin-bottom: 1.5rem; }

.lista-comentarios { display: flex; flex-direction: column; gap: 1rem; }
.comentario {
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--r-md);
  padding: 0.85rem 1rem;
}
.autor { font-size: 0.8rem; font-weight: 600; color: var(--c-gold); display: block; margin-bottom: 0.3rem; }
.comentario p { font-size: 0.875rem; color: var(--c-text-soft); }

.estado-vacio { text-align: center; padding: 3rem; color: var(--c-text-muted); }
</style>
