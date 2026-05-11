<script setup>
import { useAuth } from '../composables/useAuth'
import { useRouter } from 'vue-router'

const { usuario, cerrarSesion } = useAuth()
const router = useRouter()

async function salir() {
  await cerrarSesion()
  router.push('/')
}
</script>

<template>
  <div class="app-layout">
    <header>
      <RouterLink to="/" class="logo">Arte<span>Local</span></RouterLink>
      <nav>
        <RouterLink to="/">Inicio</RouterLink>
        <RouterLink to="/galeria">Galería</RouterLink>
        <RouterLink to="/artistas">Artistas</RouterLink>
        <template v-if="usuario">
          <RouterLink to="/subir-obra">Subir obra</RouterLink>
          <RouterLink to="/mi-perfil">Mi Perfil</RouterLink>
          <button class="btn-salir" @click="salir">Salir</button>
        </template>
        <template v-else>
          <RouterLink to="/login" class="btn-acceder">Acceder</RouterLink>
        </template>
      </nav>
    </header>

    <main>
      <RouterView />
    </main>

    <footer>
      <p>© 2025 ArteLocal — Conectando artistas locales</p>
    </footer>
  </div>
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
  text-decoration: none;
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
nav a.router-link-exact-active.logo { background: transparent; }

.btn-acceder {
  background: var(--c-gold) !important;
  color: #0d0f14 !important;
  font-weight: 600;
  padding: 0.4rem 1rem !important;
  margin-left: 0.5rem;
}
.btn-acceder:hover { background: var(--c-gold-light) !important; }

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
  margin-left: 0.5rem;
}
.btn-salir:hover {
  color: var(--c-danger);
  border-color: var(--c-danger-dim);
  background: var(--c-danger-dim);
}

main {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 1.5rem 4rem;
}

footer {
  text-align: center;
  padding: 2rem;
  border-top: 1px solid var(--c-border);
  color: var(--c-text-muted);
  font-size: 0.8rem;
}
</style>
