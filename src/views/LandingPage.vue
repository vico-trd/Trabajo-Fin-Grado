<template>
  <div class="landing">
    <section class="hero">
      <h1>Arte<span>Local</span></h1>
      <p class="tagline">Descubre y apoya a artistas de tu ciudad</p>
      <RouterLink to="/login" class="btn-cta">Únete ahora</RouterLink>
    </section>
  </div>
</template>

<style scoped>
.landing {
  padding: 5rem 0;
  animation: fadeUp 0.6s ease-out both;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

.hero {
  text-align: center;
  padding: 4rem 1rem;
}

.hero h1 {
  font-family: var(--font-display);
  font-size: clamp(3rem, 8vw, 6rem);
  font-weight: 700;
  color: var(--c-text);
  letter-spacing: -0.03em;
  line-height: 1;
  margin-bottom: 1.25rem;
}

.hero h1 span {
  color: var(--c-gold);
}

.tagline {
  font-size: 1.15rem;
  color: var(--c-text-soft);
  margin-bottom: 2.5rem;
}

.btn-cta {
  display: inline-block;
  background: var(--c-gold);
  color: #0d0f14;
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 0.95rem;
  padding: 0.85rem 2.25rem;
  border-radius: var(--r-sm);
  text-decoration: none;
  transition: all 0.2s;
  letter-spacing: 0.02em;
}

.btn-cta:hover {
  background: var(--c-gold-light);
  color: #0d0f14;
  box-shadow: 0 6px 24px rgba(201,168,76,0.3);
  transform: translateY(-2px);
}
</style>
