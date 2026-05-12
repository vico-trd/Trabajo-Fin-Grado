<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { createArtwork } from "../services/artworks";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { supabase } from "../supabase";

const router = useRouter();
const usuario = ref(null);
const auth = getAuth();
onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    usuario.value = user ?? null;
  });
});

const CATEGORIAS = [
  "Pintura",
  "Escultura",
  "Fotografía",
  "Ilustración",
  "Arte digital",
  "Cerámica",
  "Otra",
];

const form = ref({
  title: "",
  category: "",
  description: "",
  technique: "",
  dimensions: "",
  year: new Date().getFullYear(),
  forSale: false,
  price: "",
  acceptsCommissions: false,
  location: "",
});

const imagenArchivo = ref(null);
const imagenPreview = ref(null);
const subiendo = ref(false);
const error = ref("");

function onImagenSeleccionada(e) {
  const file = e.target.files[0];
  if (!file) return;
  imagenArchivo.value = file;
  imagenPreview.value = URL.createObjectURL(file);
}

async function publicar() {
  if (!form.value.title || !form.value.category) {
    error.value = "El título y la categoría son obligatorios.";
    return;
  }
  subiendo.value = true;
  error.value = "";
  try {
    let imageUrl = "";
    if (imagenArchivo.value) {
      const ruta = `${usuario.value.uid}/${Date.now()}_${imagenArchivo.value.name}`;
      const { data, error: uploadError } = await supabase.storage
        .from("artworks")
        .upload(ruta, imagenArchivo.value);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage
        .from("artworks")
        .getPublicUrl(ruta);
      imageUrl = urlData.publicUrl;
    }
    await createArtwork({ ...form.value, imageUrl }, usuario.value);
    router.push("/mi-perfil");
  } catch (e) {
    error.value = "Error: " + e.message;
  } finally {
    subiendo.value = false;
  }
}
</script>

<template>
  <div class="upload-page">
    <h1>Subir obra</h1>

    <form class="upload-form" @submit.prevent="publicar">
      <!-- Imagen -->
      <div class="campo-imagen">
        <label for="imagen">Imagen de la obra</label>
        <div class="drop-zona" @click="$refs.inputImagen.click()">
          <img
            v-if="imagenPreview"
            :src="imagenPreview"
            alt="Preview"
            class="preview-img"
          />
          <span v-else>Haz clic para seleccionar imagen</span>
        </div>
        <input
          id="imagen"
          ref="inputImagen"
          type="file"
          accept="image/*"
          hidden
          @change="onImagenSeleccionada"
        />
      </div>

      <!-- Datos básicos -->
      <div class="campo">
        <label>Título *</label>
        <input v-model="form.title" placeholder="Nombre de la obra" required />
      </div>

      <div class="campo">
        <label>Categoría *</label>
        <select v-model="form.category" required>
          <option value="" disabled>Selecciona categoría</option>
          <option v-for="cat in CATEGORIAS" :key="cat" :value="cat">
            {{ cat }}
          </option>
        </select>
      </div>

      <div class="campo">
        <label>Descripción</label>
        <textarea
          v-model="form.description"
          placeholder="Cuéntanos sobre esta obra..."
          rows="4"
        />
      </div>

      <div class="fila-campos">
        <div class="campo">
          <label>Técnica</label>
          <input v-model="form.technique" placeholder="Óleo, acuarela..." />
        </div>
        <div class="campo">
          <label>Dimensiones</label>
          <input v-model="form.dimensions" placeholder="50x70 cm" />
        </div>
        <div class="campo">
          <label>Año</label>
          <input v-model="form.year" type="number" :min="1900" :max="2100" />
        </div>
      </div>

      <div class="campo">
        <label>Ubicación</label>
        <input
          v-model="form.location"
          placeholder="Ciudad donde se puede ver"
        />
      </div>

      <!-- Venta y encargos -->
      <div class="fila-checks">
        <label class="check-label">
          <input v-model="form.forSale" type="checkbox" />
          En venta
        </label>
        <label class="check-label">
          <input v-model="form.acceptsCommissions" type="checkbox" />
          Acepto encargos
        </label>
      </div>

      <div v-if="form.forSale" class="campo">
        <label>Precio (€)</label>
        <input v-model="form.price" type="number" min="0" placeholder="0" />
      </div>

      <p v-if="error" class="error">{{ error }}</p>

      <button type="submit" class="btn-primary" :disabled="subiendo">
        {{ subiendo ? "Publicando..." : "Publicar obra" }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.upload-page { padding: 3rem 0 2rem; animation: fadeUp 0.5s ease-out both; max-width: 660px; }
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

h1 {
  font-family: var(--font-display);
  font-size: 2.5rem; font-weight: 700; color: var(--c-text);
  letter-spacing: -0.02em; margin-bottom: 2rem;
}

.upload-form { display: flex; flex-direction: column; gap: 1.25rem; }

.campo { display: flex; flex-direction: column; gap: 0.4rem; }
.campo label {
  font-size: 0.75rem; color: var(--c-text-muted);
  font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;
}
.campo input, .campo select, .campo textarea {
  background: var(--c-bg-card);
  border: 1.5px solid var(--c-border);
  border-radius: var(--r-sm);
  padding: 0.7rem 1rem;
  color: var(--c-text); font-family: var(--font-body); font-size: 0.9rem;
  outline: none; resize: vertical;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.campo input:focus, .campo select:focus, .campo textarea:focus {
  border-color: var(--c-gold);
  box-shadow: 0 0 0 3px rgba(234,76,137,0.08);
}
.campo select option { background: var(--c-bg-card); }

.fila-campos { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem; }
@media (max-width: 500px) { .fila-campos { grid-template-columns: 1fr; } }

.campo-imagen label {
  font-size: 0.75rem; color: var(--c-text-muted);
  font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;
  display: block; margin-bottom: 0.4rem;
}
.drop-zona {
  background: var(--c-bg-card);
  border: 2px dashed var(--c-border);
  border-radius: var(--r-lg);
  height: 220px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: var(--c-text-muted); font-size: 0.875rem;
  overflow: hidden; transition: all 0.15s;
}
.drop-zona:hover { border-color: var(--c-gold); background: var(--c-gold-dim); }
.preview-img { width: 100%; height: 100%; object-fit: cover; }

.fila-checks { display: flex; gap: 1.5rem; }
.check-label {
  display: flex; align-items: center; gap: 0.5rem;
  font-size: 0.875rem; color: var(--c-text-soft); cursor: pointer; font-weight: 500;
}

.error { color: var(--c-danger); font-size: 0.85rem; }

.btn-primary {
  background: var(--c-gold); color: #fff; border: none;
  padding: 0.8rem 2.25rem; border-radius: var(--r-sm);
  font-family: var(--font-body); font-weight: 600; font-size: 0.95rem;
  cursor: pointer; transition: all 0.15s; align-self: flex-start;
}
.btn-primary:disabled { opacity: 0.5; cursor: default; }
.btn-primary:hover:not(:disabled) {
  background: var(--c-gold-light);
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(234,76,137,0.28);
}
</style>