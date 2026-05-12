<script setup>
import { ref, onMounted } from "vue";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import PerfilUsuario from "../components/PerfilUsuario.vue";

const usuario = ref(null);
const auth = getAuth();

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) usuario.value = user;
  });
});
</script>

<template>
  <div v-if="usuario" class="panel">
    <h2>Mi Panel</h2>
    <PerfilUsuario :usuario="usuario" />

    <!-- Aquí irán los componentes de ArteLocal: obras, eventos, etc. -->
    <div class="placeholder">
      <p>🎨 Aquí va el contenido del artista</p>
    </div>
  </div>
</template>

<style scoped>
.panel {
  padding: 3rem 0 2rem;
  animation: fadeUp 0.5s ease-out both;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

h2 {
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 700;
  color: var(--c-text);
  letter-spacing: -0.02em;
  margin-bottom: 1.75rem;
}

.placeholder {
  margin-top: 2rem;
  padding: 3rem;
  background: var(--c-bg-card);
  border: 1px dashed var(--c-border);
  border-radius: var(--r-lg);
  text-align: center;
  color: var(--c-text-muted);
}
</style>
