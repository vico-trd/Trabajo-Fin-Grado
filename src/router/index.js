import { createRouter, createWebHistory } from "vue-router";
import LandingPage from "../views/LandingPage.vue";
import LoginView from "../views/LoginView.vue";
import PanelPrivado from "../views/PanelPrivado.vue";

const routes = [
  { path: "/", component: LandingPage },
  { path: "/login", component: LoginView },
  { path: "/panel", component: PanelPrivado, meta: { requiresAuth: true } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const logueado = localStorage.getItem("idUsuario");

  if (to.meta.requiresAuth && !logueado) return "/login";
  if (logueado && to.path === "/login") return "/panel";

  return true;
});

export default router;
