// The site mark: a wireframe icosahedron with accent-coloured vertices.
// Draws into every <canvas class="mesh">; size comes from the CSS width.
// Turns slowly; stays still for people who prefer reduced motion.
(function () {
  var canvases = Array.prototype.slice.call(document.querySelectorAll("canvas.mesh"));
  if (!canvases.length) return;

  // Icosahedron: 12 vertices, 30 edges (pairs at the shortest distance).
  var t = (1 + Math.sqrt(5)) / 2, s = Math.sqrt(1 + t * t);
  var V = [[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]]
    .map(function (v) { return [v[0] / s, v[1] / s, v[2] / s]; });
  var E = [];
  for (var i = 0; i < V.length; i++) for (var j = i + 1; j < V.length; j++) {
    var d = Math.hypot(V[i][0] - V[j][0], V[i][1] - V[j][1], V[i][2] - V[j][2]);
    if (d < 1.1) E.push([i, j]);
  }

  var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var tilt = 0.38, angle = 3.01; // start at the clearest pose (no overlapping vertices)

  function colours() {
    var cs = getComputedStyle(document.documentElement);
    return { ink: cs.getPropertyValue("--fg").trim() || "#18181b", dot: cs.getPropertyValue("--accent").trim() || "#d9480f" };
  }

  function draw(canvas, a, c) {
    var css = canvas.clientWidth || 24, dpr = window.devicePixelRatio || 1, px = Math.round(css * dpr);
    if (canvas.width !== px) { canvas.width = px; canvas.height = px; }
    var ctx = canvas.getContext("2d"), r = px * 0.43, cx = px / 2, cy = px / 2;
    var P = V.map(function (v) {
      var x = v[0] * Math.cos(a) + v[2] * Math.sin(a), z = -v[0] * Math.sin(a) + v[2] * Math.cos(a);
      var y = v[1] * Math.cos(tilt) - z * Math.sin(tilt), depth = v[1] * Math.sin(tilt) + z * Math.cos(tilt);
      return [cx + x * r, cy - y * r, depth];
    });
    var lw = Math.max(1, px / 80);
    ctx.clearRect(0, 0, px, px);
    ctx.strokeStyle = c.ink; ctx.lineWidth = lw; ctx.lineJoin = "round"; ctx.globalAlpha = 0.75;
    ctx.beginPath();
    E.forEach(function (e) { ctx.moveTo(P[e[0]][0], P[e[0]][1]); ctx.lineTo(P[e[1]][0], P[e[1]][1]); });
    ctx.stroke();
    ctx.globalAlpha = 1; ctx.fillStyle = c.dot;
    P.forEach(function (p) {
      ctx.beginPath(); ctx.arc(p[0], p[1], Math.max(1.1 * dpr, px / 42) * (0.75 + 0.5 * (p[2] + 1) / 2), 0, Math.PI * 2); ctx.fill();
    });
  }

  function frame() {
    var c = colours();
    canvases.forEach(function (cv) { draw(cv, angle, c); });
    if (!still) { angle += 0.004; requestAnimationFrame(frame); }
  }
  frame();

  // Redraw with the new colours when the theme is toggled (only needed when still).
  new MutationObserver(function () { if (still) frame(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
})();
