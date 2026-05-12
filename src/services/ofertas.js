import {
  collection, addDoc, getDocs, updateDoc, doc,
  query, where, serverTimestamp, Timestamp, onSnapshot,
} from 'firebase/firestore'
import { db } from '../main'

const COL = 'ofertas'

export async function crearOferta({ obraId, obraTitulo, obraImagen, artEmail, buyerEmail, precioOferta }) {
  return addDoc(collection(db, COL), {
    obraId,
    obraTitulo,
    obraImagen: obraImagen || '',
    artEmail,
    buyerEmail,
    precioOferta,
    status: 'pending',
    createdAt: serverTimestamp(),
    expiresAt: null,
  })
}

export async function getOfertasRecibidas(artEmail) {
  const q = query(collection(db, COL), where('artEmail', '==', artEmail))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
}

export async function getOfertasEnviadas(buyerEmail) {
  const q = query(collection(db, COL), where('buyerEmail', '==', buyerEmail))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
}

export async function aceptarOferta(id) {
  const expiresAt = Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000))
  return updateDoc(doc(db, COL, id), { status: 'accepted', expiresAt })
}

export async function rechazarOferta(id) {
  return updateDoc(doc(db, COL, id), { status: 'rejected' })
}

export async function marcarOfertaPagada(id) {
  return updateDoc(doc(db, COL, id), { status: 'paid' })
}

export async function marcarOfertaExpirada(id) {
  return updateDoc(doc(db, COL, id), { status: 'expired' })
}

export function escucharOfertasRecibidas(artEmail, callback) {
  const q = query(collection(db, COL), where('artEmail', '==', artEmail))
  return onSnapshot(q, (snap) => {
    const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
    callback(docs)
  })
}

export function escucharOfertasEnviadas(buyerEmail, callback) {
  const q = query(collection(db, COL), where('buyerEmail', '==', buyerEmail))
  return onSnapshot(q, (snap) => {
    const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
    callback(docs)
  })
}

export function escucharOfertasDelChat(artEmail, buyerEmail, callback) {
  const q = query(
    collection(db, COL),
    where('artEmail', '==', artEmail),
    where('buyerEmail', '==', buyerEmail),
  )
  return onSnapshot(q, (snap) => {
    const map = {}
    snap.docs.forEach((d) => { map[d.id] = { id: d.id, ...d.data() } })
    callback(map)
  })
}
