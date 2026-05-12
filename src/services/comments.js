import {
  collection, addDoc, getDocs, deleteDoc, doc,
  query, where, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../main'

const COL = 'comments'

export async function getComments(artworkId) {
  const q = query(
    collection(db, COL),
    where('artworkId', '==', artworkId),
  )
  const snap = await getDocs(q)
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  return docs.sort((a, b) => (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0))
}

export async function addComment(artworkId, text, user) {
  return addDoc(collection(db, COL), {
    artworkId,
    text,
    authorName: user.displayName || user.email,
    authorEmail: user.email,
    createdAt: serverTimestamp(),
  })
}

export async function deleteComment(id) {
  return deleteDoc(doc(db, COL, id))
}
