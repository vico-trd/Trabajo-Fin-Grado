import {
  collection, addDoc, getDocs, deleteDoc, doc,
  query, where, onSnapshot, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../main'

const COL = 'seguimientos'

// followerEmail sigue a artistEmail
export async function seguirArtista(followerEmail, artistEmail) {
  const existing = await _getDoc(followerEmail, artistEmail)
  if (existing) return // Ya sigue
  return addDoc(collection(db, COL), {
    follower: followerEmail,
    artista: artistEmail,
    createdAt: serverTimestamp(),
  })
}

export async function dejarDeSeguir(followerEmail, artistEmail) {
  const existing = await _getDoc(followerEmail, artistEmail)
  if (existing) await deleteDoc(doc(db, COL, existing.id))
}

export async function estaSiguiendo(followerEmail, artistEmail) {
  const existing = await _getDoc(followerEmail, artistEmail)
  return !!existing
}

// Devuelve la lista de emails de artistas que sigue el usuario
export async function getSeguidos(followerEmail) {
  const q = query(collection(db, COL), where('follower', '==', followerEmail))
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data().artista)
}

// Listener en tiempo real
export function escucharSeguidos(followerEmail, callback) {
  const q = query(collection(db, COL), where('follower', '==', followerEmail))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => d.data().artista))
  })
}

async function _getDoc(followerEmail, artistEmail) {
  const q = query(
    collection(db, COL),
    where('follower', '==', followerEmail),
    where('artista', '==', artistEmail),
  )
  const snap = await getDocs(q)
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() }
}
