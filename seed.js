/**
 * seed.js - Pobla Firestore con artistas y obras de prueba
 * Uso: node seed.js
 * No necesita serviceAccountKey. Usa el SDK de cliente de Firebase.
 * Requiere que las reglas de Firestore permitan escritura (modo test).
 */

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, setDoc, doc, Timestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCwl584pjOiAjhRNoU3SSFYePN5lhlg2jQ",
  authDomain: "artelocal-60ad1.firebaseapp.com",
  projectId: "artelocal-60ad1",
  storageBucket: "artelocal-60ad1.firebasestorage.app",
  messagingSenderId: "924709481898",
  appId: "1:924709481898:web:a12a34259f3a63a8bc4fd3",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ── Datos de prueba ────────────────────────────────────────────────────────

const artistas = [
  {
    email: "lucia.martinez@artelocal.test",
    displayName: "Lucía Martínez",
    bio: "Pintora madrileña especializada en acuarelas urbanas. Capturo la luz de la ciudad en papel.",
    location: "Madrid",
    website: "https://luciamartinez.art",
    acceptsCommissions: true,
  },
  {
    email: "carlos.vega@artelocal.test",
    displayName: "Carlos Vega",
    bio: "Escultor con 15 años de experiencia trabajando la cerámica y el bronce.",
    location: "Barcelona",
    website: "",
    acceptsCommissions: false,
  },
  {
    email: "ana.ruiz@artelocal.test",
    displayName: "Ana Ruiz",
    bio: "Fotógrafa documental y retratista. Premio Nacional de Fotografía 2023.",
    location: "Sevilla",
    website: "",
    acceptsCommissions: true,
  },
  {
    email: "pablo.font@artelocal.test",
    displayName: "Pablo Font",
    bio: "Ilustrador digital y artista de cómic. Trabajo con marcas y editoriales.",
    location: "Valencia",
    website: "",
    acceptsCommissions: true,
  },
  {
    email: "marta.iglesias@artelocal.test",
    displayName: "Marta Iglesias",
    bio: "Cerámica artesanal hecha a mano. Cada pieza es única.",
    location: "Santiago de Compostela",
    website: "",
    acceptsCommissions: false,
  },
];

const obras = [
  {
    title: "Amanecer en Gran Vía",
    category: "Pintura",
    description: "Acuarela sobre papel de la Gran Vía madrileña al amanecer. Colores cálidos y atmósfera tranquila.",
    technique: "Acuarela",
    dimensions: "50x70 cm",
    year: 2024,
    forSale: true,
    price: "380",
    acceptsCommissions: true,
    location: "Madrid",
    artistEmail: "lucia.martinez@artelocal.test",
    artistName: "Lucía Martínez",
    likesCount: 14,
    imageUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800",
  },
  {
    title: "Reflejos en el Retiro",
    category: "Pintura",
    description: "Vista del estanque del Retiro en otoño. Técnica mixta sobre lienzo.",
    technique: "Técnica mixta",
    dimensions: "60x80 cm",
    year: 2025,
    forSale: true,
    price: "520",
    acceptsCommissions: true,
    location: "Madrid",
    artistEmail: "lucia.martinez@artelocal.test",
    artistName: "Lucía Martínez",
    likesCount: 9,
    imageUrl: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800",
  },
  {
    title: "Torso I",
    category: "Escultura",
    description: "Figura humana abstracta tallada en mármol blanco de Carrara.",
    technique: "Talla en mármol",
    dimensions: "40x20x15 cm",
    year: 2023,
    forSale: true,
    price: "1200",
    acceptsCommissions: false,
    location: "Barcelona",
    artistEmail: "carlos.vega@artelocal.test",
    artistName: "Carlos Vega",
    likesCount: 22,
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
  },
  {
    title: "Máscara Ibérica",
    category: "Escultura",
    description: "Cerámica inspirada en las máscaras de la cultura ibérica. Pieza única.",
    technique: "Cerámica esmaltada",
    dimensions: "25x20x10 cm",
    year: 2024,
    forSale: true,
    price: "650",
    acceptsCommissions: false,
    location: "Barcelona",
    artistEmail: "carlos.vega@artelocal.test",
    artistName: "Carlos Vega",
    likesCount: 17,
    imageUrl: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800",
  },
  {
    title: "Mirada",
    category: "Fotografía",
    description: "Retrato en blanco y negro. La mirada como ventana al alma.",
    technique: "Fotografía analógica",
    dimensions: "30x40 cm (impresión)",
    year: 2025,
    forSale: true,
    price: "180",
    acceptsCommissions: true,
    location: "Sevilla",
    artistEmail: "ana.ruiz@artelocal.test",
    artistName: "Ana Ruiz",
    likesCount: 31,
    imageUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800",
  },
  {
    title: "Barrio Triana",
    category: "Fotografía",
    description: "Callejuela típica de Triana, Sevilla. Luz natural de mediodía.",
    technique: "Fotografía digital",
    dimensions: "40x60 cm (impresión)",
    year: 2024,
    forSale: true,
    price: "220",
    acceptsCommissions: true,
    location: "Sevilla",
    artistEmail: "ana.ruiz@artelocal.test",
    artistName: "Ana Ruiz",
    likesCount: 26,
    imageUrl: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800",
  },
  {
    title: "Dragón Urbano",
    category: "Ilustración",
    description: "Ilustración digital de un dragón integrado en el skyline de una ciudad futurista.",
    technique: "Digital (Procreate)",
    dimensions: "Impresión bajo demanda",
    year: 2025,
    forSale: true,
    price: "95",
    acceptsCommissions: true,
    location: "Valencia",
    artistEmail: "pablo.font@artelocal.test",
    artistName: "Pablo Font",
    likesCount: 42,
    imageUrl: "https://images.unsplash.com/photo-1549490349-8643362247b5?w=800",
  },
  {
    title: "Portada Novela Gráfica",
    category: "Ilustración",
    description: "Arte de portada para novela gráfica de ciencia ficción. Sin texto, versión limpia.",
    technique: "Digital",
    dimensions: "A4",
    year: 2025,
    forSale: false,
    price: "",
    acceptsCommissions: true,
    location: "Valencia",
    artistEmail: "pablo.font@artelocal.test",
    artistName: "Pablo Font",
    likesCount: 19,
    imageUrl: "https://images.unsplash.com/photo-1596262800486-6dce7c4e5e2a?w=800",
  },
  {
    title: "Bol Océano",
    category: "Cerámica",
    description: "Bol de cerámica artesanal con esmalte azul océano. Apto para uso alimentario.",
    technique: "Torno y esmaltado",
    dimensions: "Ø 16 cm",
    year: 2025,
    forSale: true,
    price: "65",
    acceptsCommissions: false,
    location: "Santiago de Compostela",
    artistEmail: "marta.iglesias@artelocal.test",
    artistName: "Marta Iglesias",
    likesCount: 8,
    imageUrl: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800",
  },
  {
    title: "Jarrón Tierra",
    category: "Cerámica",
    description: "Jarrón alto con texturas naturales inspiradas en la corteza del árbol. Tono arcilla.",
    technique: "Modelado manual",
    dimensions: "30 cm de alto",
    year: 2024,
    forSale: true,
    price: "110",
    acceptsCommissions: false,
    location: "Santiago de Compostela",
    artistEmail: "marta.iglesias@artelocal.test",
    artistName: "Marta Iglesias",
    likesCount: 12,
    imageUrl: "https://images.unsplash.com/photo-1493106641515-5d37f5d438be?w=800",
  },
  {
    title: "La Ciudad Duerme",
    category: "Arte digital",
    description: "Paisaje nocturno urbano generado con técnica digital. Luces de neón reflejadas en el asfalto mojado.",
    technique: "Arte digital",
    dimensions: "Impresión bajo demanda",
    year: 2025,
    forSale: true,
    price: "75",
    acceptsCommissions: true,
    location: "Madrid",
    artistEmail: "lucia.martinez@artelocal.test",
    artistName: "Lucía Martínez",
    likesCount: 5,
    imageUrl: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800",
  },
  {
    title: "Sin título #3",
    category: "Pintura",
    description: "Abstracto. Capas de óleo en distintas densidades. 3 meses de trabajo.",
    technique: "Óleo sobre lienzo",
    dimensions: "100x100 cm",
    year: 2023,
    forSale: true,
    price: "900",
    acceptsCommissions: false,
    location: "Barcelona",
    artistEmail: "carlos.vega@artelocal.test",
    artistName: "Carlos Vega",
    likesCount: 33,
    imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800",
  },
];

// ── Inserción ──────────────────────────────────────────────────────────────

async function seed() {
  console.log("Insertando perfiles de artistas...");
  for (const artista of artistas) {
    await setDoc(doc(db, "profiles", artista.email), {
      ...artista,
      createdAt: Timestamp.now(),
    }, { merge: true });
    console.log("  ✓ Perfil:", artista.displayName);
  }

  console.log("\nInsertando obras...");
  for (const obra of obras) {
    await addDoc(collection(db, "artworks"), {
      ...obra,
      createdAt: Timestamp.now(),
    });
    console.log("  ✓ Obra:", obra.title);
  }

  console.log("\n✅ Seed completado: " + artistas.length + " artistas y " + obras.length + " obras.");
  process.exit(0);
}

seed().catch(console.error);
