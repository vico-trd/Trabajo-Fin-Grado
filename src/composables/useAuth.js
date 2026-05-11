import { ref } from 'vue'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '../firebase'

// Estado singleton compartido entre todos los componentes
const usuario = ref(null)
const cargando = ref(true)

onAuthStateChanged(auth, (user) => {
  usuario.value = user ?? null
  cargando.value = false
  if (user) localStorage.setItem('idUsuario', user.uid)
  else localStorage.removeItem('idUsuario')
})

export function useAuth() {
  async function cerrarSesion() {
    await signOut(auth)
    localStorage.removeItem('idUsuario')
  }

  return { usuario, cargando, cerrarSesion }
}
