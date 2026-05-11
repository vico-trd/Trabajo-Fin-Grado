<script setup>
import { ref } from "vue";
import {
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { auth } from "../firebase";
import { useRouter } from "vue-router";

const router = useRouter();

const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

const vista = ref("menu"); // menu | login | registro | olvide
const email = ref("");
const contra = ref("");
const correoReset = ref("");
const error = ref("");

function limpiar() {
  email.value = "";
  contra.value = "";
  error.value = "";
}

async function conGoogle() {
  try {
    await setPersistence(auth, browserSessionPersistence);
    const result = await signInWithPopup(auth, googleProvider);
    localStorage.setItem("idUsuario", result.user.uid);
    router.push("/panel");
  } catch (e) {
    error.value = "Error al conectar con Google";
  }
}

async function conGithub() {
  try {
    await setPersistence(auth, browserSessionPersistence);
    const result = await signInWithPopup(auth, githubProvider);
    localStorage.setItem("idUsuario", result.user.uid);
    router.push("/panel");
  } catch (e) {
    error.value = "Error al conectar con GitHub";
  }
}

async function iniciarEmail() {
  error.value = "";
  try {
    await setPersistence(auth, browserSessionPersistence);
    const result = await signInWithEmailAndPassword(auth, email.value, contra.value);
    localStorage.setItem("idUsuario", result.user.uid);
    router.push("/panel");
  } catch (e) {
    error.value = "Email o contraseña incorrectos";
  }
}

async function registrar() {
  error.value = "";
  try {
    await setPersistence(auth, browserSessionPersistence);
    const result = await createUserWithEmailAndPassword(auth, email.value, contra.value);
    localStorage.setItem("idUsuario", result.user.uid);
    router.push("/panel");
  } catch (e) {
    error.value = e.message;
  }
}

async function resetContrasena() {
  try {
    await sendPasswordResetEmail(auth, correoReset.value);
    alert("Correo enviado, revisa tu bandeja");
    vista.value = "menu";
  } catch (e) {
    error.value = "No se pudo enviar el correo";
  }
}
</script>

<template>
  <div class="auth-card">

    <!-- MENÚ PRINCIPAL -->
    <template v-if="vista === 'menu'">
      <h3>Acceder a ArteLocal</h3>
      <button class="btn-primary" @click="conGoogle">Continuar con Google</button>
      <button @click="conGithub">Continuar con GitHub</button>
      <hr />
      <button @click="() => { limpiar(); vista = 'login' }">Entrar con email</button>
      <button @click="() => { limpiar(); vista = 'registro' }">Crear cuenta</button>
    </template>

    <!-- LOGIN EMAIL -->
    <template v-else-if="vista === 'login'">
      <h3>Iniciar sesión</h3>
      <input v-model="email" type="email" placeholder="Email" />
      <input v-model="contra" type="password" placeholder="Contraseña" />
      <p v-if="error" class="error">{{ error }}</p>
      <button class="btn-primary" @click="iniciarEmail">Entrar</button>
      <button @click="vista = 'olvide'">Olvidé mi contraseña</button>
      <button @click="vista = 'menu'">← Volver</button>
    </template>

    <!-- REGISTRO -->
    <template v-else-if="vista === 'registro'">
      <h3>Crear cuenta</h3>
      <input v-model="email" type="email" placeholder="Email" />
      <input v-model="contra" type="password" placeholder="Contraseña (mín. 6 caracteres)" />
      <p v-if="error" class="error">{{ error }}</p>
      <button class="btn-primary" @click="registrar">Registrarse</button>
      <button @click="vista = 'menu'">← Volver</button>
    </template>

    <!-- RESET CONTRASEÑA -->
    <template v-else-if="vista === 'olvide'">
      <h3>Recuperar contraseña</h3>
      <input v-model="correoReset" type="email" placeholder="Tu email" />
      <p v-if="error" class="error">{{ error }}</p>
      <button class="btn-primary" @click="resetContrasena">Enviar correo</button>
      <button @click="vista = 'login'">← Volver</button>
    </template>

  </div>
</template>

<style scoped>
.auth-card {
  max-width: 400px;
  margin: 4rem auto;
  padding: 2.5rem;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  animation: fadeUp 0.4s ease-out both;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

h3 {
  font-family: var(--font-display);
  font-size: 1.5rem;
  color: var(--c-text);
  margin-bottom: 0.5rem;
  text-align: center;
}

hr {
  border: none;
  height: 1px;
  background: var(--c-border);
  margin: 0.25rem 0;
}

input {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--c-bg-soft);
  border: 1px solid var(--c-border);
  border-radius: var(--r-sm);
  color: var(--c-text);
  font-family: var(--font-body);
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
input::placeholder { color: var(--c-text-muted); }
input:focus {
  border-color: rgba(201,168,76,0.4);
  box-shadow: 0 0 0 3px rgba(201,168,76,0.07);
}

button {
  width: 100%;
  padding: 0.8rem 1rem;
  border: 1px solid var(--c-border);
  border-radius: var(--r-sm);
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--c-bg-mute);
  color: var(--c-text);
}
button:hover {
  border-color: var(--c-border-hover);
  background: rgba(255,255,255,0.05);
  transform: translateY(-1px);
}

.btn-primary {
  background: var(--c-gold);
  color: #0d0f14;
  border-color: transparent;
  font-weight: 600;
}
.btn-primary:hover {
  background: var(--c-gold-light);
  box-shadow: 0 4px 16px rgba(201,168,76,0.25);
}

.error {
  color: var(--c-danger);
  font-size: 0.85rem;
  text-align: center;
}
</style>
