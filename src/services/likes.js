import {
  collection, addDoc, getDocs, deleteDoc, doc,
  query, where, onSnapshot,
} from 'firebase/firestore'
import { db } from '../main'
import { incrementLikes, decrementLikes, getArtwork } from './artworks'

const COL = 'likes'

export async function getLike(artworkId, userEmail) {
  const q = query(
    collection(db, COL),
    where('artworkId', '==', artworkId),
    where('userEmail', '==', userEmail),
  )
  const snap = await getDocs(q)
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() }
}

export async function toggleLike(artworkId, userEmail) {
  const existing = await getLike(artworkId, userEmail)
  if (existing) {
    await deleteDoc(doc(db, COL, existing.id))
    await decrementLikes(artworkId)
    return false
  } else {
    await addDoc(collection(db, COL), { artworkId, userEmail })
    await incrementLikes(artworkId)
    return true
  }
}

export function escucharFavoritos(userEmail, callback) {
  const q = query(collection(db, COL), where('userEmail', '==', userEmail))
  return onSnapshot(q, async (snap) => {
    const ids = snap.docs.map((d) => d.data().artworkId)
    if (!ids.length) { callback([]); return }
    const artworks = await Promise.all(ids.map((id) => getArtwork(id)))
    callback(artworks.filter(Boolean))
  })
}
