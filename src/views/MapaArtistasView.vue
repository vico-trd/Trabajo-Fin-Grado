<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getArtworks } from "../services/artworks";
import { getAllProfiles } from "../services/profiles";

// Fix leaflet's broken default icon paths when bundled with Vite
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const mapContainer = ref(null);
const cargando = ref(true);
const error = ref("");
const artistasSinUbicacion = ref(0);
let mapa = null;

// Cache de coordenadas para evitar llamadas repetidas a Nominatim
const geoCache = {};

async function geocodificar(ciudad) {
  if (geoCache[ciudad]) return geoCache[ciudad];
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(ciudad)}&format=json&limit=1`;
    const res = await fetch(url, {
      headers: { "Accept-Language": "es", "User-Agent": "ArteLocal-TFG/1.0" },
    });
    const data = await res.json();
    if (data.length) {
      const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      geoCache[ciudad] = coords;
      return coords;
    }
  } catch (_) {}
  return null;
}

onMounted(async () => {
  // Inicializar el mapa centrado en España
  mapa = L.map(mapContainer.value).setView([40.416775, -3.703790], 6);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 18,
  }).addTo(mapa);

  try {
    const [obras, perfiles] = await Promise.all([getArtworks({ max: 300 }), getAllProfiles()]);

    // Construir mapa email → perfil
    const perfilPorEmail = {};
    for (const p of perfiles) {
      if (p.email) perfilPorEmail[p.email] = p;
    }

    // Artistas únicos con al menos una obra
    const artistasMap = {};
    for (const obra of obras) {
      if (!artistasMap[obra.artistEmail]) {
        artistasMap[obra.artistEmail] = {
          email: obra.artistEmail,
          nombre: obra.artistName || obra.artistEmail,
          obras: [],
          perfil: perfilPorEmail[obra.artistEmail] || null,
        };
      }
      artistasMap[obra.artistEmail].obras.push(obra);
    }

    const artistas = Object.values(artistasMap);
    let sinUbicacion = 0;

    // Geocodificar y añadir marcadores (respetando el límite de 1 req/s de Nominatim)
    for (const artista of artistas) {
      const ciudad = artista.perfil?.location?.trim();
      if (!ciudad) { sinUbicacion++; continue; }

      const coords = await geocodificar(ciudad);
      if (!coords) { sinUbicacion++; continue; }

      // Ligero offset para que artistas de la misma ciudad no se superpongan exactamente
      const lat = coords.lat + (Math.random() - 0.5) * 0.01;
      const lng = coords.lng + (Math.random() - 0.5) * 0.01;

      const icono = L.divIcon({
        className: "",
        html: `<div class="marker-artista">${artista.nombre[0].toUpperCase()}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const imgHtml = artista.obras[0]?.imageUrl
        ? `<img src="${artista.obras[0].imageUrl}" style="width:100%;height:80px;object-fit:cover;border-radius:6px;margin-bottom:6px;" />`
        : "";

      const popup = `
        <div style="min-width:160px;">
          ${imgHtml}
          <strong style="font-size:0.95rem;">${artista.nombre}</strong><br>
          <span style="font-size:0.75rem;color:#888;">${ciudad}</span><br>
          <span style="font-size:0.75rem;">${artista.obras.length} obra${artista.obras.length !== 1 ? "s" : ""}</span><br>
          <a href="/artista/${encodeURIComponent(artista.email)}" style="font-size:0.8rem;color:#e44d7f;">Ver perfil →</a>
        </div>`;

      L.marker([lat, lng], { icon: icono }).addTo(mapa).bindPopup(popup);

      // Pausa breve para no saturar Nominatim
      await new Promise((r) => setTimeout(r, 250));
    }

    artistasSinUbicacion.value = sinUbicacion;
  } catch (e) {
    error.value = "Error cargando el mapa: " + e.message;
  } finally {
    cargando.value = false;
  }
});

onUnmounted(() => {
  if (mapa) { mapa.remove(); mapa = null; }
});
</script>

<template>
  <div class="mapa-page">
    <h1>Mapa de artistas</h1>
    <p class="subtitulo">
      Artistas geolocalizados por su ciudad. Especifica tu ciudad en
      <RouterLink to="/mi-perfil">Mi perfil</RouterLink> para aparecer aquí.
    </p>

    <div v-if="cargando" class="cargando-mapa">Cargando mapa y geocodificando ciudades…</div>
    <div v-if="error" class="error-mapa">{{ error }}</div>

    <div ref="mapContainer" class="mapa-contenedor"></div>

    <p v-if="!cargando && artistasSinUbicacion > 0" class="aviso-sin-ubicacion">
      {{ artistasSinUbicacion }} artista{{ artistasSinUbicacion !== 1 ? 's' : '' }} no aparece{{ artistasSinUbicacion !== 1 ? 'n' : '' }} por no tener ciudad definida.
    </p>
  </div>
</template>

<style scoped>
.mapa-page {
  padding: 3rem 0 2rem;
  animation: fadeUp 0.5s ease-out both;
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
h1 {
  font-family: var(--font-display);
  font-size: 2.5rem; font-weight: 700; color: var(--c-text);
  letter-spacing: -0.02em; margin-bottom: 0.5rem;
}
.subtitulo {
  color: var(--c-text-muted); font-size: 0.92rem; margin-bottom: 1.5rem;
}
.subtitulo a { color: var(--c-gold); }
.mapa-contenedor {
  width: 100%; height: 560px;
  border-radius: var(--r-xl);
  border: 1.5px solid var(--c-border);
  overflow: hidden;
  box-shadow: var(--shadow-card);
}
.cargando-mapa {
  text-align: center; padding: 1rem;
  color: var(--c-text-muted); font-size: 0.85rem; margin-bottom: 0.75rem;
}
.error-mapa { color: var(--c-danger); font-size: 0.85rem; margin-bottom: 0.75rem; }
.aviso-sin-ubicacion {
  margin-top: 0.75rem; font-size: 0.8rem; color: var(--c-text-muted);
}
</style>

<style>
/* Estilo del marcador personalizado (no scoped porque Leaflet lo inyecta fuera del shadow) */
.marker-artista {
  width: 36px; height: 36px;
  background: var(--c-gold, #e44d7f);
  color: #fff;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 0.95rem;
  border: 2px solid #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.25);
}
.marker-artista::before {
  display: block;
  transform: rotate(45deg);
}
</style>
