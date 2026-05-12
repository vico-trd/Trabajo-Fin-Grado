<script setup>
import { useRoute } from 'vue-router'
const route = useRoute()
const obraId = route.query.obra
</script>

<template>
  <div class="pago-resultado">
    <div class="icono">❌</div>
    <h1>Pago cancelado</h1>
    <p>No se ha procesado ningún cobro. Puedes intentarlo de nuevo cuando quieras.</p>
    <div class="acciones">
      <RouterLink v-if="obraId" :to="`/obra/${obraId}`" class="btn-volver">Volver a la obra</RouterLink>
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
.btn-volver {
  background: var(--c-gold); color: #fff;
}
.btn-volver:hover { background: var(--c-gold-light); }
.btn-galeria {
  background: var(--c-bg-card); color: var(--c-text);
  border: 1.5px solid var(--c-border);
}
.btn-galeria:hover { border-color: var(--c-gold); color: var(--c-gold); }
</style>
