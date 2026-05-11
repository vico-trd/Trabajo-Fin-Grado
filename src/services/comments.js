import {
  collection, addDoc, getDocs, deleteDoc, doc,
  query, where, orderBy, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

const COL = 'comments'

export async function getComments(artworkId) {
  const q = query(
    collection(db, COL),
    where('artworkId', '==', artworkId),
    orderBy('createdAt', 'asc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
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
