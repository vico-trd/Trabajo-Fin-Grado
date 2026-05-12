import { db } from '../main'
import {
  collection, addDoc, query, orderBy,
  onSnapshot, serverTimestamp, where, doc, setDoc
} from 'firebase/firestore'

// El ID del chat se crea ordenando los dos emails para que siempre sea el mismo
function getChatId(email1, email2) {
  return [email1, email2].sort().join('__')
}

export function escucharMensajes(email1, email2, callback) {
  const chatId = getChatId(email1, email2)
  const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc'))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export async function enviarMensaje(email1, email2, texto) {
  const chatId = getChatId(email1, email2)
  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    de: email1,
    para: email2,
    texto,
    tipo: 'texto',
    createdAt: serverTimestamp(),
  })
}

export async function enviarMensajeOferta(email1, email2, { ofertaId, obraTitulo, obraImagen, obraId, precio }) {
  const chatId = getChatId(email1, email2)
  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    de: email1,
    para: email2,
    texto: `Oferta por «${obraTitulo}»: ${precio}€`,
    tipo: 'oferta',
    ofertaId,
    obraTitulo,
    obraImagen: obraImagen || '',
    obraId,
    precio,
    createdAt: serverTimestamp(),
  })
}

export async function crearOActualizarChat(email1, email2) {
  const chatId = getChatId(email1, email2)
  await setDoc(doc(db, 'chats', chatId), {
    participantes: [email1, email2].sort(),
    ultimoMensaje: '',
    updatedAt: serverTimestamp(),
  }, { merge: true })
  return chatId
}

export function escucharConversaciones(miEmail, callback) {
  const q = query(collection(db, 'chats'), where('participantes', 'array-contains', miEmail))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}
