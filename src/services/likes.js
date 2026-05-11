import {
  collection, addDoc, getDocs, deleteDoc, doc,
  query, where,
} from 'firebase/firestore'
import { db } from '../firebase'
import { incrementLikes, decrementLikes } from './artworks'

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
