import { createRouter, createWebHistory } from "vue-router";
import Layout from "../components/Layout.vue";
import LandingPage from "../views/LandingPage.vue";
import LoginView from "../views/LoginView.vue";
import GalleryView from "../views/GalleryView.vue";
import ArtworkDetailView from "../views/ArtworkDetailView.vue";
import ArtistsView from "../views/ArtistsView.vue";
import ArtistProfileView from "../views/ArtistProfileView.vue";
import UploadArtworkView from "../views/UploadArtworkView.vue";
import MyProfileView from "../views/MyProfileView.vue";

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
      { path: "subir-obra", component: UploadArtworkView, meta: { requiresAuth: true } },
      { path: "mi-perfil", component: MyProfileView, meta: { requiresAuth: true } },
    ],
  },
  { path: "/login", component: LoginView },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const logueado = localStorage.getItem("idUsuario");

  if (to.meta.requiresAuth && !logueado) return "/login";
  if (logueado && to.path === "/login") return "/mi-perfil";

  return true;
});

export default router;
