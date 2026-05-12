import {
  collection, addDoc, getDocs, getDoc, doc,
  updateDoc, deleteDoc, query, where, orderBy, limit,
  serverTimestamp, increment,
} from 'firebase/firestore'
import { db } from '../main'

const COL = 'artworks'

export async function getArtworks({ categoria, max = 50 } = {}) {
  let q = categoria
    ? query(collection(db, COL), where('category', '==', categoria), orderBy('createdAt', 'desc'), limit(max))
    : query(collection(db, COL), orderBy('createdAt', 'desc'), limit(max))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function getArtwork(id) {
  const snap = await getDoc(doc(db, COL, id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function getArtworksByArtist(artistEmail) {
  const q = query(
    collection(db, COL),
    where('artistEmail', '==', artistEmail),
    orderBy('createdAt', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function createArtwork(data, user) {
  return addDoc(collection(db, COL), {
    ...data,
    artistEmail: user.email,
    artistName: user.displayName || user.email,
    createdBy: user.uid,
    likesCount: 0,
    createdAt: serverTimestamp(),
  })
}

export async function updateArtwork(id, data) {
  return updateDoc(doc(db, COL, id), data)
}

export async function deleteArtwork(id) {
  return deleteDoc(doc(db, COL, id))
}

export async function incrementLikes(id) {
  return updateDoc(doc(db, COL, id), { likesCount: increment(1) })
}

export async function decrementLikes(id) {
  return updateDoc(doc(db, COL, id), { likesCount: increment(-1) })
}
