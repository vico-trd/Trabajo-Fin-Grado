<script setup>
import { useRouter } from 'vue-router'
import { getAuth, signOut } from 'firebase/auth'

const auth = getAuth()
const router = useRouter()

defineProps({
  usuario: Object,
})

async function cerrarSesion() {
  await signOut(auth)
  localStorage.removeItem('idUsuario')
  router.push('/')
}
</script>

<template>
  <div class="perfil">
    <img v-if="usuario.photoURL" :src="usuario.photoURL" alt="avatar" />
    <div v-else class="avatar-placeholder">{{ usuario.email[0].toUpperCase() }}</div>
    <div class="info">
      <span class="nombre">{{ usuario.displayName || usuario.email }}</span>
      <span class="uid">{{ usuario.email }}</span>
    </div>
    <button @click="cerrarSesion">Cerrar sesión</button>
  </div>
</template>

<style scoped>
.perfil {
  display: flex; align-items: center; gap: 1rem;
  padding: 1rem 1.5rem;
  background: var(--c-bg-card);
  border: 1.5px solid var(--c-border);
  border-radius: var(--r-lg);
  margin-bottom: 1.5rem;
  box-shadow: var(--shadow-card);
}

img, .avatar-placeholder {
  width: 42px; height: 42px; border-radius: 50%;
  object-fit: cover; border: 2px solid var(--c-border); flex-shrink: 0;
}
.avatar-placeholder {
  background: var(--c-gold-dim); color: var(--c-gold);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-display); font-size: 1.1rem;
}

.info { display: flex; flex-direction: column; gap: 0.1rem; }
.nombre { font-size: 0.95rem; color: var(--c-text); font-weight: 600; }
.uid { font-size: 0.78rem; color: var(--c-text-muted); }

button {
  margin-left: auto;
  background: transparent; color: var(--c-text-muted);
  border: 1.5px solid var(--c-border);
  padding: 0.4rem 1rem; border-radius: var(--r-sm);
  font-family: var(--font-body); font-size: 0.8rem; font-weight: 500;
  cursor: pointer; transition: all 0.15s; white-space: nowrap;
}
button:hover { color: var(--c-danger); border-color: var(--c-danger); background: var(--c-danger-dim); }
</style>