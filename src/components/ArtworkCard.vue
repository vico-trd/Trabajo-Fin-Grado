<script setup>
defineProps({
  artwork: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <RouterLink :to="`/obra/${artwork.id}`" class="artwork-card">
    <div class="card-img">
      <img v-if="artwork.imageUrl" :src="artwork.imageUrl" :alt="artwork.title" loading="lazy" />
      <div v-else class="img-placeholder">🎨</div>
      <span v-if="artwork.forSale" class="badge-sale">En venta</span>
    </div>
    <div class="card-body">
      <h3 class="card-title">{{ artwork.title }}</h3>
      <p class="card-artist">{{ artwork.artistName || artwork.artistEmail }}</p>
      <div class="card-meta">
        <span class="card-category">{{ artwork.category }}</span>
        <span v-if="artwork.forSale && artwork.price" class="card-price">{{ artwork.price }} €</span>
        <span class="card-likes">♥ {{ artwork.likesCount ?? 0 }}</span>
      </div>
    </div>
  </RouterLink>
</template>

<style scoped>
.artwork-card {
  display: flex;
  flex-direction: column;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--r-lg);
  overflow: hidden;
  text-decoration: none;
  transition: all 0.25s;
}
.artwork-card:hover {
  border-color: var(--c-border-hover);
  transform: translateY(-4px);
  box-shadow: var(--shadow-card);
}

.card-img {
  position: relative;
  width: 100%;
  aspect-ratio: 4/3;
  background: var(--c-bg-mute);
  overflow: hidden;
}
.card-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s;
}
.artwork-card:hover .card-img img { transform: scale(1.04); }

.img-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  color: var(--c-text-muted);
}

.badge-sale {
  position: absolute;
  top: 0.6rem;
  right: 0.6rem;
  background: var(--c-gold);
  color: #0d0f14;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.2rem 0.55rem;
  border-radius: var(--r-sm);
}

.card-body {
  padding: 1rem 1.1rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  flex: 1;
}

.card-title {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 600;
  color: var(--c-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-artist {
  font-size: 0.8rem;
  color: var(--c-text-muted);
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
  flex-wrap: wrap;
}

.card-category {
  font-size: 0.72rem;
  color: var(--c-gold);
  background: var(--c-gold-dim);
  padding: 0.15rem 0.5rem;
  border-radius: 99px;
}

.card-price {
  font-size: 0.8rem;
  color: var(--c-text-soft);
  font-weight: 500;
  margin-left: auto;
}

.card-likes {
  font-size: 0.75rem;
  color: var(--c-text-muted);
}
</style>
