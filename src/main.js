import "./assets/main.css";
import { createApp } from "vue";
import App from "./App.vue";

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { createRouter, createWebHistory } from "vue-router";

import Layout from "./components/Layout.vue";
import LandingPage from "./views/LandingPage.vue";
import LoginView from "./views/LoginView.vue";
import GalleryView from "./views/GalleryView.vue";
import ArtworkDetailView from "./views/ArtworkDetailView.vue";
import ArtistsView from "./views/ArtistsView.vue";
import ArtistProfileView from "./views/ArtistProfileView.vue";
import UploadArtworkView from "./views/UploadArtworkView.vue";
import MyProfileView from "./views/MyProfileView.vue";
import MensajesView from "./views/MensajesView.vue";
import PagoExitoView from "./views/PagoExitoView.vue";
import PagoCanceladoView from "./views/PagoCanceladoView.vue";
import FavoritosView from "./views/FavoritosView.vue";
import MapaArtistasView from "./views/MapaArtistasView.vue";
import FeedView from "./views/FeedView.vue";

// ── Rutas ──────────────────────────────────────────────────────────────────
const routes = [
  {
    path: "/",
    component: Layout,
    children: [
      { path: "", component: LandingPage },
      { path: "galeria", component: GalleryView },
      { path: "obra/:id", component: ArtworkDetailView },
      { path: "artistas", component: ArtistsView },
      { path: "artista/:email", component: ArtistProfileView },
      {
        path: "mensajes",
        component: MensajesView,
        meta: { requiresAuth: true },
      },
      {
        path: "subir-obra",
        component: UploadArtworkView,
        meta: { requiresAuth: true },
      },
      {
        path: "editar-obra/:id",
        component: UploadArtworkView,
        meta: { requiresAuth: true },
      },
      {
        path: "mi-perfil",
        component: MyProfileView,
        meta: { requiresAuth: true },
      },
      { path: "pago-exito", component: PagoExitoView },
      { path: "pago-cancelado", component: PagoCanceladoView },
      { path: "favoritos", component: FavoritosView, meta: { requiresAuth: true } },
      { path: "mapa", component: MapaArtistasView },
      { path: "feed", component: FeedView, meta: { requiresAuth: true } },
    ],
  },
  { path: "/login", component: LoginView },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// ── Guard de autenticación ─────────────────────────────────────────────────
router.beforeEach((to) => {
  const logueado = localStorage.getItem("idUsuario");

  if (to.meta.requiresAuth && !logueado) return "/login";
  if (logueado && to.path === "/login") return "/mi-perfil";

  return true;
});

// ── Firebase ───────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyCwl584pjOiAjhRNoU3SSFYePN5lhlg2jQ",
  authDomain: "artelocal-60ad1.firebaseapp.com",
  projectId: "artelocal-60ad1",
  storageBucket: "artelocal-60ad1.firebasestorage.app",
  messagingSenderId: "924709481898",
  appId: "1:924709481898:web:a12a34259f3a63a8bc4fd3",
};

const firebaseApp = initializeApp(firebaseConfig);

export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);

// ── App ────────────────────────────────────────────────────────────────────
const vueApp = createApp(App);
vueApp.use(router);
vueApp.mount("#app");
