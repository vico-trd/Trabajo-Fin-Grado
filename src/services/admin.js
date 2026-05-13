import {
  collection, getDocs, doc, updateDoc, deleteDoc,
  query, where, getCountFromServer,
} from 'firebase/firestore'
import { db } from '../main'

// ── Comprobar si un email es admin ─────────────────────────────────────────
export async function esAdmin(email) {
  const q = query(collection(db, 'artistProfiles'), where('email', '==', email))
  const snap = await getDocs(q)
  if (snap.empty) return false
  return snap.docs[0].data().role === 'admin'
}

// ── Promover / degradar usuario ────────────────────────────────────────────
export async function setAdminRole(profileId, isAdmin) {
  return updateDoc(doc(db, 'artistProfiles', profileId), {
    role: isAdmin ? 'admin' : 'user',
  })
}

// ── Obtener todos los usuarios (profiles) ─────────────────────────────────
export async function getAllUsers() {
  const snap = await getDocs(collection(db, 'artistProfiles'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ── Obtener todas las obras ────────────────────────────────────────────────
export async function getAllArtworksAdmin() {
  const snap = await getDocs(collection(db, 'artworks'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ── Eliminar obra (admin) ──────────────────────────────────────────────────
export async function deleteArtworkAdmin(id) {
  return deleteDoc(doc(db, 'artworks', id))
}

// ── Estadísticas globales ──────────────────────────────────────────────────
export async function getGlobalStats() {
  const [artworksSnap, usersSnap, ventasSnap] = await Promise.all([
    getCountFromServer(collection(db, 'artworks')),
    getCountFromServer(collection(db, 'artistProfiles')),
    getCountFromServer(query(collection(db, 'ofertas'), where('status', '==', 'paid'))),
  ])
  return {
    totalObras: artworksSnap.data().count,
    totalUsuarios: usersSnap.data().count,
    totalVentas: ventasSnap.data().count,
  }
}
