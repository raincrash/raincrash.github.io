---
layout: default
title: About
permalink: /about/
---

<style>
  .about-wrap {
    max-width: 620px;
  }

  .about-header {
    padding-bottom: 1.5rem;
    margin-bottom: 2rem;
    border-bottom: 1px solid #e8e8e8;
  }

  .about-header h1 {
    font-size: 2rem;
    font-weight: 700;
    letter-spacing: -0.03em;
    margin: 0 0 0.3rem;
  }

  .about-header .role {
    font-size: 0.95rem;
    color: #888;
    margin: 0;
  }

  .about-body {
    font-size: 1rem;
    line-height: 1.75;
    color: #222;
  }

  .about-body p { margin-bottom: 1.1rem; }

  .about-body a {
    color: #111;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .about-body code {
    font-size: 0.88em;
    background: #f4f4f4;
    border: 1px solid #eee;
    padding: 2px 6px;
    border-radius: 3px;
  }

  .contact-section {
    margin-top: 2.5rem;
    padding-top: 2rem;
    border-top: 1px solid #e8e8e8;
  }

  .contact-label {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #999;
    margin-bottom: 0.9rem;
  }

  .contact-links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
  }

  .contact-links a {
    display: inline-block;
    font-size: 0.82rem;
    font-weight: 500;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: #444;
    text-decoration: none;
    padding: 0.4rem 0.9rem;
    border: 1px solid #ddd;
    border-radius: 3px;
    transition: border-color 0.15s, color 0.15s;
  }

  .contact-links a:hover {
    border-color: #111;
    color: #111;
    text-decoration: none;
  }
</style>

<div class="about-wrap">
  <div class="about-header">
    <h1>Sricharan Chiruvolu</h1>
    <p class="role">AI Research Engineer · Munich, Germany</p>
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
