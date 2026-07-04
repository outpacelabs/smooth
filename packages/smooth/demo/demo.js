"use strict";
(() => {
  // src/index.ts
  var EPS = 1e-3;
  var fmt = (n) => {
    const r = +n.toFixed(4);
    return Object.is(r, -0) ? 0 : r;
  };
  function cornerGeometry(radius, s, budget) {
    const r = Math.min(radius, budget);
    const sEff = Math.max(0, Math.min(s, budget / r - 1, 1));
    if (sEff <= EPS) {
      return {
        p: r,
        b1x: r,
        b2x: r,
        arc: { x: r, y: 0 },
        radius: r,
        plain: true
      };
    }
    const sweep = Math.PI / 2 * (1 - sEff);
    const phi = -3 * Math.PI / 4 + sweep / 2;
    const arc = { x: r + r * Math.cos(phi), y: r + r * Math.sin(phi) };
    const t = { x: Math.sin(phi), y: -Math.cos(phi) };
    const l2 = arc.y / t.y;
    const b2x = arc.x - l2 * t.x;
    const b1x = b2x + 3 * l2 * l2 / (2 * r * t.y);
    const p = (1 + sEff) * r;
    return { p, b1x, b2x, arc, radius: r, plain: false };
  }
  function squirclePath({
    width,
    height,
    radius,
    smoothing = 0.6
  }) {
    const w = Math.max(0, width);
    const h = Math.max(0, height);
    if (!w || !h) return "";
    const budget = Math.min(w, h) / 2;
    const r = Math.min(Math.max(0, radius), budget);
    if (!r) return `M 0 0 L ${fmt(w)} 0 L ${fmt(w)} ${fmt(h)} L 0 ${fmt(h)} Z`;
    const s = Math.min(Math.max(0, smoothing), 1);
    const g = cornerGeometry(r, s, budget);
    const corner = (K, e1, e2) => {
      const at = (u, v) => `${fmt(K.x + u * e1.x + v * e2.x)} ${fmt(K.y + u * e1.y + v * e2.y)}`;
      if (g.plain) {
        return `A ${fmt(g.radius)} ${fmt(g.radius)} 0 0 1 ${at(0, g.p)}`;
      }
      return [
        // Ease off the entry edge: B1/B2 stay on the edge (zero curvature).
        `C ${at(g.b1x, 0)} ${at(g.b2x, 0)} ${at(g.arc.x, g.arc.y)}`,
        // The circular apex, radius intact.
        `A ${fmt(g.radius)} ${fmt(g.radius)} 0 0 1 ${at(g.arc.y, g.arc.x)}`,
        // Mirror of the entry ease, onto the exit edge.
        `C ${at(0, g.b2x)} ${at(0, g.b1x)} ${at(0, g.p)}`
      ].join(" ");
    };
    return [
      `M ${fmt(g.p)} 0`,
      `L ${fmt(w - g.p)} 0`,
      corner({ x: w, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }),
      `L ${fmt(w)} ${fmt(h - g.p)}`,
      corner({ x: w, y: h }, { x: 0, y: -1 }, { x: -1, y: 0 }),
      `L ${fmt(g.p)} ${fmt(h)}`,
      corner({ x: 0, y: h }, { x: 1, y: 0 }, { x: 0, y: -1 }),
      `L 0 ${fmt(g.p)}`,
      corner({ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 0 }),
      "Z"
    ].join(" ");
  }

  // src/demo.ts
  var $ = (id) => document.getElementById(id);
  var stage = $("stage");
  var overlay = $("overlay");
  var circleEl = $("circlePath");
  var squircleEl = $("squirclePathEl");
  var radiusIn = $("radius");
  var smoothingIn = $("smoothing");
  var radiusOut = $("radiusOut");
  var smoothingOut = $("smoothingOut");
  var outlinesIn = $("outlines");
  var legend = $("legend");
  function render() {
    const { width, height } = stage.getBoundingClientRect();
    const radius = +radiusIn.value;
    const smoothing = +smoothingIn.value / 100;
    stage.style.clipPath = `path("${squirclePath({ width, height, radius, smoothing })}")`;
    stage.style.borderRadius = "0px";
    overlay.setAttribute("viewBox", `0 0 ${width} ${height}`);
    overlay.setAttribute("width", String(width));
    overlay.setAttribute("height", String(height));
    circleEl.setAttribute(
      "d",
      squirclePath({ width, height, radius, smoothing: 0 })
    );
    squircleEl.setAttribute(
      "d",
      squirclePath({ width, height, radius, smoothing })
    );
    radiusOut.textContent = `${radius}px`;
    smoothingOut.textContent = `${Math.round(smoothing * 100)}%`;
  }
  radiusIn.addEventListener("input", render);
  smoothingIn.addEventListener("input", render);
  outlinesIn.addEventListener("change", () => {
    overlay.classList.toggle("on", outlinesIn.checked);
    legend.classList.toggle("on", outlinesIn.checked);
  });
  new ResizeObserver(render).observe(stage);
  render();
  var presets = $("presets");
  for (const s of [0, 30, 60, 100]) {
    const item = document.createElement("div");
    item.className = "preset";
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.style.clipPath = `path("${squirclePath({ width: 96, height: 96, radius: 24, smoothing: s / 100 })}")`;
    const label = document.createElement("span");
    label.textContent = s === 60 ? `${s}% \xB7 Apple` : `${s}%`;
    item.append(chip, label);
    presets.append(item);
  }
})();
