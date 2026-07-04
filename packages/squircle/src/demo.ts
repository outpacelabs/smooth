/**
 * Demo page logic (demo/index.html). Bundled by tsup into demo/demo.js as a
 * classic IIFE script — module imports fail over file:// and require a built
 * dist to import from, so a plain script keeps the demo double-clickable.
 */
import { squirclePath } from "./index";

const $ = <T extends HTMLElement>(id: string) =>
	document.getElementById(id) as T;

const stage = $<HTMLDivElement>("stage");
const overlay = $("overlay") as unknown as SVGSVGElement;
const circleEl = $("circlePath") as unknown as SVGPathElement;
const squircleEl = $("squirclePathEl") as unknown as SVGPathElement;
const radiusIn = $<HTMLInputElement>("radius");
const smoothingIn = $<HTMLInputElement>("smoothing");
const radiusOut = $<HTMLOutputElement>("radiusOut");
const smoothingOut = $<HTMLOutputElement>("smoothingOut");
const outlinesIn = $<HTMLInputElement>("outlines");
const legend = $<HTMLDivElement>("legend");

function render() {
	const { width, height } = stage.getBoundingClientRect();
	const radius = +radiusIn.value;
	const smoothing = +smoothingIn.value / 100;

	stage.style.clipPath = `path("${squirclePath({ width, height, radius, smoothing })}")`;
	// The CSS border-radius is only the no-JS fallback; letting it paint under
	// the clip would intersect back to the plain circle.
	stage.style.borderRadius = "0px";

	overlay.setAttribute("viewBox", `0 0 ${width} ${height}`);
	overlay.setAttribute("width", String(width));
	overlay.setAttribute("height", String(height));
	// smoothing 0 reproduces plain circular border-radius exactly.
	circleEl.setAttribute(
		"d",
		squirclePath({ width, height, radius, smoothing: 0 }),
	);
	squircleEl.setAttribute(
		"d",
		squirclePath({ width, height, radius, smoothing }),
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

// Presets: same radius, increasing smoothing. 60% is the Apple target.
const presets = $<HTMLDivElement>("presets");
for (const s of [0, 30, 60, 100]) {
	const item = document.createElement("div");
	item.className = "preset";
	const chip = document.createElement("div");
	chip.className = "chip";
	chip.style.clipPath = `path("${squirclePath({ width: 96, height: 96, radius: 24, smoothing: s / 100 })}")`;
	const label = document.createElement("span");
	label.textContent = s === 60 ? `${s}% · Apple` : `${s}%`;
	item.append(chip, label);
	presets.append(item);
}
