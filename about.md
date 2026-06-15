---
layout: default
title: About
permalink: /about/
---

<style>
  .about-wrap { max-width: 640px; }

  /* ── Top section: photo + name ── */
  .about-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 2rem;
    padding-bottom: 2rem;
    margin-bottom: 2rem;
    border-bottom: 1px solid #ebebeb;
  }

  .about-top-text h1 {
    font-size: 1.85rem;
    font-weight: 700;
    letter-spacing: -0.03em;
    margin: 0 0 0.3rem;
    line-height: 1.15;
  }

  .about-role {
    font-size: 0.9rem;
    color: #888;
    margin: 0;
  }

  .about-photo {
    width: 96px;
    height: 96px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
    border: 1px solid #ebebeb;
  }

  @media (max-width: 480px) {
    .about-top { flex-direction: column-reverse; gap: 1rem; }
    .about-photo { width: 72px; height: 72px; }
  }

  /* ── Body ── */
  .about-body {
    font-size: 1rem;
    line-height: 1.8;
    color: #222;
    margin-bottom: 2.5rem;
  }

  .about-body p { margin-bottom: 1.1rem; }

  .about-body a {
    color: #0a0a0a;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  /* ── Contact ── */
  .contact-section {
    padding-top: 1.75rem;
    border-top: 1px solid #ebebeb;
  }

  .contact-label {
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #9a9a9a;
    margin-bottom: 0.75rem;
  }

  .contact-links {
    display: flex;
    flex-wrap: wrap;
    gap: 0 1.5rem;
  }

  .contact-links a {
    font-size: 0.9rem;
    color: #444;
    text-decoration: none;
    padding: 0.2rem 0;
    border-bottom: 1px solid #ddd;
    transition: border-color 0.15s, color 0.15s;
  }

  .contact-links a:hover {
    color: #0a0a0a;
    border-color: #0a0a0a;
    text-decoration: none;
  }
</style>

<div class="about-wrap">
  <div class="about-top">
    <div class="about-top-text">
      <h1>Sricharan Chiruvolu</h1>
      <p class="about-role">AI Research Engineer · Munich, Germany</p>
    </div>
    <img class="about-photo" src="{{ site.logo_url }}" alt="Sricharan Chiruvolu">
  </div>

  <div class="about-body">
    <p>
      I'm Sri — an AI Research Engineer specialising in computer vision, 3D reconstruction, and generative modeling. I build systems that bring people into digital spaces: avatars, virtual try-on, immersive media.
    </p>
    <p>
      I currently lead avatar research at <a href="https://www.beyondpresence.ai" target="_blank" rel="noopener">Beyond Presence</a>. Before that I was at Colossyan (AI video), Meshcapade (body shape models), Siemens, SAP, and Zomato across Europe and India.
    </p>
    <p>
      I hold a Master's in Computer Science from the <a href="https://www.tum.de" target="_blank" rel="noopener">Technical University of Munich</a>, specialising in computer vision and graphics.
    </p>
    <p>
      Outside of work I write occasionally on this blog, and I've recently picked up photography — shooting with a Fujifilm X-T50 around Munich and wherever I travel.
    </p>
  </div>

  <div class="contact-section">
    <p class="contact-label">Get in touch</p>
    <div class="contact-links">
      <a href="mailto:{{ site.email }}">Email</a>
      <a href="https://www.linkedin.com/in/sricharanchiruvolu/" target="_blank" rel="noopener">LinkedIn</a>
      <a href="https://github.com/raincrash" target="_blank" rel="noopener">GitHub</a>
      <a href="https://twitter.com/srchrn" target="_blank" rel="noopener">Twitter</a>
      <a href="https://speakerdeck.com/raincrash" target="_blank" rel="noopener">SpeakerDeck</a>
    </div>
  </div>
</div>
