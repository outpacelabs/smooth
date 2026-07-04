/**
 * Property tests for squirclePath. Instead of comparing against another
 * implementation, these assert the geometric spec directly, per corner:
 *
 *  - the arc endpoints sit exactly on the circle of the configured radius
 *    around the plain corner's center (the apex keeps your radius)
 *  - the cubic meets the arc tangentially (G1) with curvature exactly 1/r
 *    (G2), and leaves the edge with zero curvature (B0, B1, B2 collinear
 *    on the edge)
 *  - smoothing 0 emits plain quarter arcs (border-radius parity)
 *  - the transition span is (1+s)·r, radius-first under a tight budget
 *  - the path closes and stays inside the border box
 */
import { squirclePath } from "../dist/index.js";

let failures = 0;
const check = (name, ok, detail = "") => {
	console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `  ${detail}`}`);
	if (!ok) failures++;
};
const near = (a, b, eps = 1e-3) => Math.abs(a - b) < eps;

// Parse "M .. L .. C .. A .. Z" into absolute-coordinate commands.
function parse(d) {
	const cmds = [];
	const re = /([MLCAZ])([^MLCAZ]*)/g;
	for (const m of d.matchAll(re)) {
		const nums = (m[2].trim().match(/-?\d*\.?\d+/g) ?? []).map(Number);
		cmds.push({ cmd: m[1], nums });
	}
	return cmds;
}

// Cubic curvature at t=1 for control points P0..P3.
function curvatureAtEnd(p0, p1, p2, p3) {
	const d1 = { x: p3.x - p2.x, y: p3.y - p2.y };
	const d2 = { x: p1.x - 2 * p2.x + p3.x, y: p1.y - 2 * p2.y + p3.y };
	const cross = Math.abs(d1.x * d2.y - d1.y * d2.x);
	const len = Math.hypot(d1.x, d1.y);
	return ((2 / 3) * cross) / len ** 3;
}

function cornersOf(w, h, r) {
	return [
		{ K: { x: w, y: 0 }, C: { x: w - r, y: r } },
		{ K: { x: w, y: h }, C: { x: w - r, y: h - r } },
		{ K: { x: 0, y: h }, C: { x: r, y: h - r } },
		{ K: { x: 0, y: 0 }, C: { x: r, y: r } },
	];
}

function verifyShape({ width: w, height: h, radius, smoothing: s }) {
	const label = `${w}x${h} r${radius} s${s}`;
	const d = squirclePath({ width: w, height: h, radius, smoothing: s });
	const cmds = parse(d);
	const budget = Math.min(w, h) / 2;
	const r = Math.min(radius, budget);
	const sEff = Math.max(0, Math.min(s, budget / r - 1, 1));
	const pExpected = (1 + sEff) * r;

	// Path closes: starts at (p, 0) and ends with Z.
	const m = cmds[0];
	check(`${label} · starts at (p, 0)`, near(m.nums[0], pExpected) && m.nums[1] === 0, `M ${m.nums}`);
	check(`${label} · closes`, cmds[cmds.length - 1].cmd === "Z");

	// Every coordinate stays inside the border box.
	const all = cmds.flatMap((c) =>
		c.cmd === "A"
			? [{ x: c.nums[5], y: c.nums[6] }]
			: c.cmd === "Z"
				? []
				: Array.from({ length: c.nums.length / 2 }, (_, i) => ({
						x: c.nums[2 * i],
						y: c.nums[2 * i + 1],
					})),
	);
	check(
		`${label} · inside border box`,
		all.every((pt) => pt.x >= -EPS_BOX && pt.x <= w + EPS_BOX && pt.y >= -EPS_BOX && pt.y <= h + EPS_BOX),
	);

	const corners = cornersOf(w, h, r);
	let cursor = { x: m.nums[0], y: m.nums[1] };
	let cornerIdx = 0;

	for (let i = 1; i < cmds.length; i++) {
		const c = cmds[i];
		if (c.cmd === "L") {
			cursor = { x: c.nums[0], y: c.nums[1] };
			continue;
		}
		if (c.cmd === "A") {
			// Arc radius is the configured radius; both endpoints on the circle
			// around the plain corner's center.
			const { C } = corners[cornerIdx];
			const end = { x: c.nums[5], y: c.nums[6] };
			check(`${label} · corner ${cornerIdx} arc radius`, near(c.nums[0], r) && near(c.nums[1], r));
			check(
				`${label} · corner ${cornerIdx} arc endpoints on the radius circle`,
				near(Math.hypot(cursor.x - C.x, cursor.y - C.y), r, 0.01) &&
					near(Math.hypot(end.x - C.x, end.y - C.y), r, 0.01),
			);
			cursor = end;
			// Plain corners have no cubics; the arc alone finishes the corner.
			if (sEff <= 1e-3) cornerIdx++;
			continue;
		}
		if (c.cmd === "C") {
			const p0 = cursor;
			const p1 = { x: c.nums[0], y: c.nums[1] };
			const p2 = { x: c.nums[2], y: c.nums[3] };
			const p3 = { x: c.nums[4], y: c.nums[5] };
			const { C } = corners[cornerIdx];
			const entering = near(Math.hypot(p3.x - C.x, p3.y - C.y), r, 0.01);
			if (entering) {
				// Edge → arc: B0, B1, B2 collinear (zero curvature at the edge)…
				const cross =
					(p1.x - p0.x) * (p2.y - p0.y) - (p1.y - p0.y) * (p2.x - p0.x);
				check(`${label} · corner ${cornerIdx} zero curvature at the edge`, near(cross, 0, 0.05), `cross ${cross}`);
				// …tangent to the circle at B3 (G1)…
				const radial = { x: p3.x - C.x, y: p3.y - C.y };
				const tangentDot =
					(p3.x - p2.x) * radial.x + (p3.y - p2.y) * radial.y;
				check(
					`${label} · corner ${cornerIdx} tangent to the arc`,
					near(tangentDot / (Math.hypot(p3.x - p2.x, p3.y - p2.y) * r), 0, 0.01),
				);
				// …with curvature exactly 1/r (G2).
				const k = curvatureAtEnd(p0, p1, p2, p3);
				check(`${label} · corner ${cornerIdx} curvature 1/r at the arc`, near(k, 1 / r, 0.01 / r), `κ ${k} vs ${1 / r}`);
			} else {
				// Arc → edge (mirror): corner finished.
				cornerIdx++;
			}
			cursor = p3;
		}
	}

	check(`${label} · visited 4 corners`, cornerIdx === 4, `saw ${cornerIdx}`);
}

const EPS_BOX = 0.01;

for (const shape of [
	{ width: 243.203, height: 243.203, radius: 20, smoothing: 0.6 },
	{ width: 494, height: 494, radius: 20, smoothing: 0.6 },
	{ width: 640, height: 120, radius: 16, smoothing: 0.6 },
	{ width: 48, height: 48, radius: 20, smoothing: 0.6 }, // tight budget
	{ width: 100, height: 100, radius: 80, smoothing: 0.6 }, // radius clamped
	{ width: 300, height: 300, radius: 20, smoothing: 0 }, // plain circular
	{ width: 300, height: 300, radius: 20, smoothing: 1 }, // max smoothing
	{ width: 300, height: 300, radius: 20, smoothing: 0.3 },
]) {
	verifyShape(shape);
}

// Budget policy: radius keeps priority, smoothing gets the remainder.
// 48x48 with r20 has budget 24, so p = 24 (s_eff 0.2), not (1+0.6)·20 = 32.
{
	const d = squirclePath({ width: 48, height: 48, radius: 20, smoothing: 0.6 });
	const p = Number(parse(d)[0].nums[0]);
	check("budget · radius-first clamp (p = 24)", near(p, 24, 0.01), `p ${p}`);
}

console.log(failures === 0 ? "\nALL PROPERTY CHECKS PASS" : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
