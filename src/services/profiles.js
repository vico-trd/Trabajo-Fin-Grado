import {
  collection, addDoc, getDocs, updateDoc, doc,
  query, where,
} from 'firebase/firestore'
import { db } from '../firebase'

const COL = 'artistProfiles'

export async function getProfile(userEmail) {
  const q = query(collection(db, COL), where('email', '==', userEmail))
  const snap = await getDocs(q)
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() }
}

export async function upsertProfile(userEmail, data) {
  const existing = await getProfile(userEmail)
  if (existing) {
    return updateDoc(doc(db, COL, existing.id), data)
  } else {
    return addDoc(collection(db, COL), { ...data, email: userEmail })
  }
}
