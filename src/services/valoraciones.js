import {
  collection, addDoc, getDocs, query, where, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../main'

const COL = 'valoraciones'

/**
 * Crea una valoración. Un comprador solo puede valorar una vez por obra.
 */
export async function crearValoracion({ artEmail, buyerEmail, obraId, obraTitulo, puntuacion, comentario }) {
  // Evitar duplicados
  const q = query(
    collection(db, COL),
    where('artEmail', '==', artEmail),
    where('buyerEmail', '==', buyerEmail),
    where('obraId', '==', obraId),
  )
  const existing = await getDocs(q)
  if (!existing.empty) return null // Ya valoró

  return addDoc(collection(db, COL), {
    artEmail,
    buyerEmail,
    obraId,
    obraTitulo,
    puntuacion: Number(puntuacion),
    comentario: comentario || '',
    createdAt: serverTimestamp(),
  })
}

export async function getValoracionesArtista(artEmail) {
  const q = query(collection(db, COL), where('artEmail', '==', artEmail))
  const snap = await getDocs(q)
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
  const media = docs.length
    ? (docs.reduce((s, d) => s + d.puntuacion, 0) / docs.length).toFixed(1)
    : null
  return { valoraciones: docs, media, total: docs.length }
}

export async function getValoracionComprador(buyerEmail, obraId) {
  const q = query(
    collection(db, COL),
    where('buyerEmail', '==', buyerEmail),
    where('obraId', '==', obraId),
  )
  const snap = await getDocs(q)
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() }
}
