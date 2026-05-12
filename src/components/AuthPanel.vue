<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  browserSessionPersistence,
} from 'firebase/auth'

const auth = getAuth()
const router = useRouter()
const googleProvider = new GoogleAuthProvider()
const githubProvider = new GithubAuthProvider()

const vista = ref('menu')
const email = ref('')
const contra = ref('')
const correoReset = ref('')
const error = ref('')

function limpiar() {
  email.value = ''
  contra.value = ''
  error.value = ''
}

async function conGoogle() {
  try {
    await setPersistence(auth, browserSessionPersistence)
    const result = await signInWithPopup(auth, googleProvider)
    localStorage.setItem('idUsuario', result.user.uid)
    router.push('/mi-perfil')
  } catch (e) {
    error.value = 'Error al conectar con Google'
  }
}

async function conGithub() {
  try {
    await setPersistence(auth, browserSessionPersistence)
    const result = await signInWithPopup(auth, githubProvider)
    localStorage.setItem('idUsuario', result.user.uid)
    router.push('/mi-perfil')
  } catch (e) {
    error.value = 'Error al conectar con GitHub'
  }
}

async function iniciarEmail() {
  error.value = ''
  try {
    await setPersistence(auth, browserSessionPersistence)
    const result = await signInWithEmailAndPassword(auth, email.value, contra.value)
    localStorage.setItem('idUsuario', result.user.uid)
    router.push('/mi-perfil')
  } catch (e) {
    error.value = 'Email o contraseña incorrectos'
  }
}

async function registrar() {
  error.value = ''
  try {
    await setPersistence(auth, browserSessionPersistence)
    const result = await createUserWithEmailAndPassword(auth, email.value, contra.value)
    localStorage.setItem('idUsuario', result.user.uid)
    router.push('/mi-perfil')
  } catch (e) {
    error.value = e.message
  }
}

async function resetContrasena() {
  try {
    await sendPasswordResetEmail(auth, correoReset.value)
    alert('Correo enviado, revisa tu bandeja')
    vista.value = 'menu'
  } catch (e) {
    error.value = 'No se pudo enviar el correo'
  }
}
</script>

<template>
  <div class="auth-wrap">
    <div class="auth-card">
      <div class="auth-logo">Arte<span>Local</span></div>

      <template v-if="vista === 'menu'">
        <h3>Bienvenido</h3>
        <p class="auth-sub">Accede a tu cuenta para continuar</p>
        <button class="btn-social google" @click="conGoogle">
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continuar con Google
        </button>
        <button class="btn-social github" @click="conGithub">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
          Continuar con GitHub
        </button>
        <div class="divider"><span>o</span></div>
        <button class="btn-outline" @click="() => { limpiar(); vista = 'login' }">Entrar con email</button>
        <button class="btn-outline" @click="() => { limpiar(); vista = 'registro' }">Crear cuenta</button>
      </template>

      <template v-else-if="vista === 'login'">
        <h3>Iniciar sesión</h3>
        <p class="auth-sub">Introduce tus credenciales</p>
        <input v-model="email" type="email" placeholder="Email" />
        <input v-model="contra" type="password" placeholder="Contraseña" />
        <p v-if="error" class="error">{{ error }}</p>
        <button class="btn-primary" @click="iniciarEmail">Entrar</button>
        <button class="btn-link" @click="vista = 'olvide'">¿Olvidaste tu contraseña?</button>
        <button class="btn-outline" @click="vista = 'menu'">← Volver</button>
      </template>

      <template v-else-if="vista === 'registro'">
        <h3>Crear cuenta</h3>
        <p class="auth-sub">Únete a la comunidad</p>
        <input v-model="email" type="email" placeholder="Email" />
        <input v-model="contra" type="password" placeholder="Contraseña (mín. 6 caracteres)" />
        <p v-if="error" class="error">{{ error }}</p>
        <button class="btn-primary" @click="registrar">Registrarse</button>
        <button class="btn-outline" @click="vista = 'menu'">← Volver</button>
      </template>

      <template v-else-if="vista === 'olvide'">
        <h3>Recuperar contraseña</h3>
        <p class="auth-sub">Te enviaremos un correo</p>
        <input v-model="correoReset" type="email" placeholder="Tu email" />
        <p v-if="error" class="error">{{ error }}</p>
        <button class="btn-primary" @click="resetContrasena">Enviar correo</button>
        <button class="btn-outline" @click="vista = 'login'">← Volver</button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.auth-wrap {
  min-height: calc(100vh - 68px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: var(--c-bg);
}

.auth-card {
  width: 100%;
  max-width: 420px;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--r-xl);
  padding: 2.5rem;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  animation: fadeUp 0.35s ease-out both;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

.auth-logo {
  font-family: var(--font-display);
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--c-text);
  margin-bottom: 0.25rem;
}
.auth-logo span { color: var(--c-gold); }

h3 {
  font-family: var(--font-display);
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--c-text);
  line-height: 1.2;
}

.auth-sub {
  font-size: 0.875rem;
  color: var(--c-text-muted);
  margin-bottom: 0.5rem;
}

input {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--c-bg-soft);
  border: 1.5px solid var(--c-border);
  border-radius: var(--r-sm);
  color: var(--c-text);
  font-family: var(--font-body);
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
input::placeholder { color: var(--c-text-muted); }
input:focus {
  border-color: var(--c-gold);
  box-shadow: 0 0 0 3px rgba(234,76,137,0.1);
}

.btn-primary {
  width: 100%;
  padding: 0.8rem;
  background: var(--c-gold);
  color: #fff;
  border: none;
  border-radius: var(--r-sm);
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-primary:hover {
  background: var(--c-gold-light);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(234,76,137,0.3);
}

.btn-outline {
  width: 100%;
  padding: 0.75rem;
  background: transparent;
  border: 1.5px solid var(--c-border);
  border-radius: var(--r-sm);
  color: var(--c-text-soft);
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-outline:hover {
  border-color: var(--c-border-hover);
  color: var(--c-text);
  background: var(--c-bg-mute);
}

.btn-social {
  width: 100%;
  padding: 0.75rem;
  background: var(--c-bg-soft);
  border: 1.5px solid var(--c-border);
  border-radius: var(--r-sm);
  color: var(--c-text);
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
}
.btn-social:hover {
  border-color: var(--c-border-hover);
  background: var(--c-bg-mute);
  transform: translateY(-1px);
}

.btn-link {
  background: none;
  border: none;
  color: var(--c-gold);
  font-family: var(--font-body);
  font-size: 0.85rem;
  cursor: pointer;
  padding: 0;
  text-align: center;
}
.btn-link:hover { color: var(--c-gold-light); }

.divider {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--c-text-muted);
  font-size: 0.8rem;
  margin: 0.25rem 0;
}
.divider::before, .divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--c-border);
}

.error {
  color: var(--c-danger);
  font-size: 0.82rem;
  text-align: center;
}
</style>
