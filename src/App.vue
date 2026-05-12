<script setup>
import { ref, onMounted } from "vue";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const logueado = ref(false);
const auth = getAuth();

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      logueado.value = user;
      localStorage.setItem("idUsuario", user.uid);
    } else {
      logueado.value = null;
      localStorage.removeItem("idUsuario");
    }
  });
});
</script>

<template>
  <RouterView />
</template>
