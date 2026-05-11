import {
  collection, addDoc, getDocs, updateDoc, doc,
  query, where, orderBy, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

const COL = 'commissionRequests'

export async function getCommissionsForArtist(artistEmail) {
  const q = query(
    collection(db, COL),
    where('artistEmail', '==', artistEmail),
    orderBy('createdAt', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function createCommission({ artistEmail, clientName, clientEmail, description, budget }) {
  return addDoc(collection(db, COL), {
    artistEmail,
    clientName,
    clientEmail,
    description,
    budget,
    status: 'pending',
    createdAt: serverTimestamp(),
  })
}

export async function updateCommissionStatus(id, status) {
  return updateDoc(doc(db, COL, id), { status })
}
