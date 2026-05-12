<template>
  <div class="landing">
    <section class="hero">
      <div class="hero-badge">✦ Plataforma de arte local</div>
      <h1>El arte de tu ciudad,<br /><span>en un solo lugar</span></h1>
      <p class="tagline">Descubre artistas locales, colecciona obras únicas y conecta con la escena creativa de tu ciudad.</p>
      <div class="hero-actions">
        <RouterLink to="/galeria" class="btn-cta">Explorar galería</RouterLink>
        <RouterLink to="/login" class="btn-secondary">Unirse gratis →</RouterLink>
      </div>
    </section>

    <section class="stats">
      <div class="stat">
        <span class="stat-num">100+</span>
        <span class="stat-label">Artistas</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat">
        <span class="stat-num">500+</span>
        <span class="stat-label">Obras</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat">
        <span class="stat-num">50+</span>
        <span class="stat-label">Ciudades</span>
      </div>
    </section>
  </div>
</template>

<style scoped>
.landing {
  padding: 4rem 0 2rem;
  animation: fadeUp 0.6s ease-out both;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

.hero {
  text-align: center;
  padding: 5rem 1rem 4rem;
  max-width: 760px;
  margin: 0 auto;
}

.hero-badge {
  display: inline-block;
  background: var(--c-gold-dim);
  color: var(--c-gold);
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  padding: 0.35rem 0.9rem;
  border-radius: 99px;
  margin-bottom: 1.75rem;
  border: 1px solid rgba(234,76,137,0.2);
}

h1 {
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  font-weight: 700;
  color: var(--c-text);
  letter-spacing: -0.03em;
  line-height: 1.1;
  margin-bottom: 1.5rem;
}
h1 span { color: var(--c-gold); }

.tagline {
  font-size: 1.1rem;
  color: var(--c-text-soft);
  line-height: 1.7;
  margin-bottom: 2.5rem;
  max-width: 520px;
  margin-left: auto;
  margin-right: auto;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-cta {
  display: inline-block;
  background: var(--c-gold);
  color: #fff;
  font-weight: 600;
  font-size: 0.95rem;
  padding: 0.85rem 2rem;
  border-radius: var(--r-sm);
  text-decoration: none;
  transition: all 0.2s;
}
.btn-cta:hover {
  background: var(--c-gold-light);
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(234,76,137,0.3);
}

.btn-secondary {
  display: inline-block;
  background: transparent;
  color: var(--c-text-soft);
  font-weight: 500;
  font-size: 0.95rem;
  padding: 0.85rem 1.5rem;
  border-radius: var(--r-sm);
  border: 1.5px solid var(--c-border);
  text-decoration: none;
  transition: all 0.2s;
}
.btn-secondary:hover {
  border-color: var(--c-border-hover);
  color: var(--c-text);
  background: var(--c-bg-mute);
}

.stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  padding: 2.5rem;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--r-xl);
  margin-top: 2rem;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.stat-num {
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 700;
  color: var(--c-text);
}

.stat-label {
  font-size: 0.8rem;
  color: var(--c-text-muted);
  font-weight: 500;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: var(--c-border);
}
</style>
