<script setup>
import { ref, onMounted } from "vue";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import { useRouter } from "vue-router";

const router = useRouter();
const logueado = ref(null);

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      logueado.value = user;
      localStorage.setItem("idUsuario", user.uid);
    } else {
      logueado.value = null;
      localStorage.removeItem("idUsuario");
    }
  });
});

function cerrarSesion() {
  signOut(auth).then(() => router.push("/"));
}
</script>

<template>
  <header>
    <RouterLink to="/" class="logo">ArteLocal</RouterLink>
    <nav>
      <RouterLink to="/">Inicio</RouterLink>
      <RouterLink v-if="!logueado" to="/login">Acceder</RouterLink>
      <RouterLink v-if="logueado" to="/panel">Mi Panel</RouterLink>
      <button v-if="logueado" @click="cerrarSesion" class="btn-salir">Salir</button>
    </nav>
  </header>

  <main>
    <RouterView />
  </main>
</template>

<style>
header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  height: 64px;
  background: rgba(13, 15, 20, 0.9);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--c-border);
}

.logo {
  font-family: var(--font-display);
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--c-gold) !important;
  letter-spacing: 0.02em;
}

nav {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

nav a {
  color: var(--c-text-soft);
  padding: 0.45rem 0.9rem;
  border-radius: var(--r-sm);
  font-size: 0.875rem;
  transition: all 0.2s;
  text-decoration: none;
}

nav a:hover { color: var(--c-text); background: var(--c-bg-mute); }
nav a.router-link-active { color: var(--c-gold); }

.btn-salir {
  background: transparent;
  border: 1px solid var(--c-border);
  color: var(--c-text-soft);
  padding: 0.4rem 0.9rem;
  border-radius: var(--r-sm);
  font-family: var(--font-body);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-salir:hover {
  color: var(--c-danger);
  border-color: var(--c-danger-dim);
  background: var(--c-danger-dim);
}

main {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 1.5rem 4rem;
}
</style>
