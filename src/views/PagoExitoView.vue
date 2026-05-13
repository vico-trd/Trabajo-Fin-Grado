<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { marcarOfertaPagada } from '../services/ofertas'
import { crearValoracion } from '../services/valoraciones'
import { updateArtwork } from '../services/artworks'
import { getAuth } from 'firebase/auth'

const route = useRoute()
const obraId = route.query.obra
const ofertaId = route.query.oferta
const artEmail = route.query.art
const obraTitulo = route.query.titulo ? decodeURIComponent(route.query.titulo) : ''

const puntuacion = ref(0)
const comentario = ref('')
const valoracionEnviada = ref(false)
const enviando = ref(false)

onMounted(async () => {
  if (ofertaId) {
    await marcarOfertaPagada(ofertaId)
  }
  if (obraId) {
    await updateArtwork(obraId, { forSale: false })
  }
})

async function enviarValoracion() {
  if (!puntuacion.value || !artEmail) return
  enviando.value = true
  const auth = getAuth()
  const user = auth.currentUser
  await crearValoracion({
    artEmail,
    buyerEmail: user?.email || 'anon',
    obraId: obraId || '',
    obraTitulo,
    puntuacion: puntuacion.value,
    comentario: comentario.value,
  })
  enviando.value = false
  valoracionEnviada.value = true
}
</script>

<template>
  <div class="pago-resultado">
    <div class="icono">✅</div>
    <h1>¡Pago completado!</h1>
    <p>Tu compra se ha procesado correctamente. El artista se pondrá en contacto contigo para la entrega.</p>

    <!-- Formulario de valoración -->
    <div v-if="artEmail && !valoracionEnviada" class="valoracion-form">
      <h3>¿Qué te ha parecido? Valora al artista</h3>
      <div class="estrellas">
        <button
          v-for="n in 5"
          :key="n"
          class="estrella"
          :class="{ activa: n <= puntuacion }"
          @click="puntuacion = n"
        >★</button>
      </div>
      <textarea
        v-model="comentario"
        placeholder="Deja un comentario opcional..."
        rows="3"
        class="valoracion-textarea"
      />
      <button
        class="btn-valorar"
        :disabled="!puntuacion || enviando"
        @click="enviarValoracion"
      >
        {{ enviando ? 'Enviando...' : 'Enviar valoración' }}
      </button>
    </div>
    <div v-else-if="valoracionEnviada" class="valoracion-ok">
      ⭐ ¡Gracias por tu valoración!
    </div>

    <div class="acciones">
      <RouterLink v-if="obraId" :to="`/obra/${obraId}`" class="btn-volver">Ver la obra</RouterLink>
      <RouterLink to="/galeria" class="btn-galeria">Explorar galería</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.pago-resultado {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 60vh; text-align: center; gap: 1.25rem;
  animation: fadeUp 0.5s ease-out both;
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
.icono { font-size: 4rem; }
h1 {
  font-family: var(--font-display); font-size: 2rem; font-weight: 700;
  color: var(--c-text); letter-spacing: -0.02em;
}
p { color: var(--c-text-soft); font-size: 0.95rem; max-width: 420px; line-height: 1.7; }
.acciones { display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center; margin-top: 0.5rem; }
.btn-volver, .btn-galeria {
  padding: 0.65rem 1.5rem; border-radius: var(--r-sm);
  font-weight: 600; font-size: 0.875rem; text-decoration: none;
  transition: all 0.15s;
}
.btn-volver { background: var(--c-gold); color: #fff; }
.btn-volver:hover { background: var(--c-gold-light); }
.btn-galeria {
  background: var(--c-bg-card); color: var(--c-text);
  border: 1.5px solid var(--c-border);
}
.btn-galeria:hover { border-color: var(--c-gold); color: var(--c-gold); }

.valoracion-form {
  background: var(--c-bg-card);
  border: 1.5px solid var(--c-border);
  border-radius: var(--r-xl);
  padding: 1.5rem 2rem;
  max-width: 400px; width: 100%;
  box-shadow: var(--shadow-card);
}
.valoracion-form h3 {
  font-family: var(--font-display); font-size: 1.1rem; margin-bottom: 1rem;
}
.estrellas { display: flex; gap: 0.35rem; justify-content: center; margin-bottom: 1rem; }
.estrella {
  font-size: 2rem; background: none; border: none; cursor: pointer;
  color: var(--c-border); transition: color 0.15s; line-height: 1;
}
.estrella.activa { color: #f59e0b; }
.estrella:hover { color: #f59e0b; }
.valoracion-textarea {
  width: 100%; background: var(--c-bg-soft);
  border: 1.5px solid var(--c-border); border-radius: var(--r-sm);
  padding: 0.65rem 0.9rem; color: var(--c-text); font-family: var(--font-body);
  font-size: 0.875rem; resize: vertical; box-sizing: border-box; margin-bottom: 0.75rem;
}
.btn-valorar {
  background: var(--c-gold); color: #fff; border: none;
  padding: 0.6rem 1.5rem; border-radius: var(--r-sm);
  font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: all 0.15s;
}
.btn-valorar:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-valorar:not(:disabled):hover { background: var(--c-gold-light); }
.valoracion-ok { font-size: 1.1rem; color: #f59e0b; font-weight: 600; }
</style>
