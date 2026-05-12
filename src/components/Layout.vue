<script setup>
import { ref, onMounted } from 'vue'
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth'
import { useRouter } from 'vue-router'

const router = useRouter()
const usuario = ref(null)
const auth = getAuth()

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    usuario.value = user ?? null
  })
})

async function salir() {
  await signOut(auth)
  localStorage.removeItem('idUsuario')
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
          <RouterLink to="/mensajes">Mensajes</RouterLink>
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
      <div class="footer-inner">
        <div class="footer-marca">
          <span class="footer-logo">Arte<span>Local</span></span>
          <p>Conectando artistas locales con el mundo.</p>
        </div>
        <div class="footer-links">
          <RouterLink to="/galeria">Galería</RouterLink>
          <RouterLink to="/artistas">Artistas</RouterLink>
          <RouterLink to="/subir-obra">Subir obra</RouterLink>
        </div>
      </div>
      <p class="footer-copy">© 2026 ArteLocal · España</p>
    </footer>
  </div>
</template>

<style>
/* ── Header ─────────────────────────────────────────────────────── */
header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2.5rem;
  height: 68px;
  background: rgba(248, 248, 246, 0.92);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--c-border);
}

.logo {
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--c-text) !important;
  letter-spacing: -0.02em;
  text-decoration: none;
}
.logo span { color: var(--c-gold); }

nav {
  display: flex;
  align-items: center;
  gap: 0.1rem;
}

nav a {
  color: var(--c-text-soft);
  padding: 0.45rem 0.85rem;
  border-radius: var(--r-sm);
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.15s;
  text-decoration: none;
}
nav a:hover {
  color: var(--c-text);
  background: var(--c-bg-mute);
}
nav a.router-link-active { color: var(--c-gold); }
nav a.router-link-exact-active.logo { background: transparent; }

.btn-acceder {
  background: var(--c-gold) !important;
  color: #fff !important;
  font-weight: 600 !important;
  padding: 0.45rem 1.1rem !important;
  border-radius: var(--r-sm) !important;
  margin-left: 0.5rem;
  transition: all 0.2s !important;
}
.btn-acceder:hover {
  background: var(--c-gold-light) !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(234,76,137,0.25) !important;
}

.btn-salir {
  background: transparent;
  border: 1px solid var(--c-border);
  color: var(--c-text-soft);
  padding: 0.4rem 0.85rem;
  border-radius: var(--r-sm);
  font-family: var(--font-body);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  margin-left: 0.5rem;
}
.btn-salir:hover {
  color: var(--c-danger);
  border-color: var(--c-danger);
  background: var(--c-danger-dim);
}

/* ── Main ───────────────────────────────────────────────────────── */
main {
  max-width: 1140px;
  margin: 0 auto;
  padding: 0 2rem 5rem;
}

/* ── Footer ─────────────────────────────────────────────────────── */
footer {
  border-top: 1px solid var(--c-border);
  padding: 3rem 2.5rem 2rem;
  background: var(--c-bg-card);
}

.footer-inner {
  max-width: 1140px;
  margin: 0 auto 2rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
  flex-wrap: wrap;
}

.footer-logo {
  font-family: var(--font-display);
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--c-text);
  display: block;
  margin-bottom: 0.5rem;
}
.footer-logo span { color: var(--c-gold); }

.footer-marca p {
  color: var(--c-text-muted);
  font-size: 0.85rem;
  max-width: 220px;
  line-height: 1.6;
}

.footer-links {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.footer-links a {
  color: var(--c-text-muted);
  font-size: 0.85rem;
  font-weight: 500;
  transition: color 0.15s;
}
.footer-links a:hover { color: var(--c-gold); }

.footer-copy {
  text-align: center;
  border-top: 1px solid var(--c-border);
  padding-top: 1.5rem;
  color: var(--c-text-muted);
  font-size: 0.78rem;
  max-width: 1140px;
  margin: 0 auto;
}
</style>
