"use client";

import { squirclePath } from "@outpacelabs/squircle";
import { useSmoothCorners } from "@outpacelabs/squircle/react";
import { motion, useReducedMotion } from "motion/react";
import {
	type CSSProperties,
	type ReactNode,
	useEffect,
	useMemo,
	useState,
} from "react";
import { useScrollSpy } from "./use-scroll-spy";

/* ── entrance tokens (shared duration/curve; sequence via delays only) ── */
const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const REVEAL = { duration: 0.28, ease: EASE_OUT };

/* Comparison outline colors — Figma's selection red/blue, legible on both
   the white page and the ink shape. */
const OUTLINE_CIRCLE = "#f24822";
const OUTLINE_SQUIRCLE = "#0d99ff";

const INK = "var(--ink)";
const MUTED = "var(--muted)";

const OutpaceLogo = () => (
	<svg
		aria-hidden="true"
		width="33"
		height="12"
		viewBox="0 0 33 12"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			d="M16.5 6C16.5 2.68629 13.7298 0 10.3125 0H6.1875C2.77024 0 0 2.68629 0 6C0 9.31371 2.77024 12 6.1875 12H10.3125C13.7298 12 16.5 9.31371 16.5 6Z"
			fill="#171717"
			fillOpacity="0.92"
		/>
		<path
			d="M16.5 0H29.9062C31.6149 0 33 1.34315 33 3C33 4.65685 31.6149 6 29.9062 6H22.6875C19.2702 6 16.5 3.31371 16.5 0Z"
			fill="#171717"
			fillOpacity="0.92"
		/>
		<path
			d="M24.75 12C26.4586 12 27.8437 10.6569 27.8437 9C27.8437 7.34315 26.4586 6 24.75 6H22.6875C19.2702 6 16.5 8.68629 16.5 12H24.75Z"
			fill="#171717"
			fillOpacity="0.92"
		/>
	</svg>
);

const GithubMark = () => (
	<svg
		width="15"
		height="15"
		viewBox="0 0 24 24"
		fill="currentColor"
		aria-hidden="true"
		className="block shrink-0"
	>
		<path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.91 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
	</svg>
);

/* ── article primitives (glass reading column) ── */

function Col({ children }: { children: ReactNode }) {
	const reduced = useReducedMotion() ?? false;
	return (
		<motion.div
			style={{ maxWidth: 640, margin: "0 auto", padding: "0 24px" }}
			initial={reduced ? false : { opacity: 0, y: 12 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: "0px 0px -64px 0px" }}
			transition={reduced ? { duration: 0 } : REVEAL}
		>
			{children}
		</motion.div>
	);
}

function H2({ children }: { children: ReactNode }) {
	return (
		<h2 className="mt-20 text-[15px] font-[450] tracking-[-0.1px] text-(--ink) text-balance">
			{children}
		</h2>
	);
}

function P({ children }: { children: ReactNode }) {
	return (
		<p className="mt-4 text-sm leading-[1.72] tracking-[0.1px] text-(--body) text-pretty">
			{children}
		</p>
	);
}

function A({ href, children }: { href: string; children: ReactNode }) {
	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className="text-(--ink) underline underline-offset-2"
		>
			{children}
		</a>
	);
}

function C({ children }: { children: ReactNode }) {
	return (
		<code className="rounded-[6px] bg-(--chip) px-[5px] py-[3px] font-mono text-[0.84em] text-(--ink)">
			{children}
		</code>
	);
}

/* Borderless code surface with server-rendered Shiki highlighting. */
function Code({ html }: { html: string }) {
	const smoothRef = useSmoothCorners<HTMLDivElement>(16);
	return (
		<div
			ref={smoothRef}
			className="article-code mt-[22px] overflow-hidden rounded-[16px] bg-(--surface)"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: server-generated Shiki HTML
			dangerouslySetInnerHTML={{ __html: html }}
		/>
	);
}

/* ── the naive superellipse, kept only to illustrate the trap ── */
function naiveSuperellipsePath(size: number, r: number, s: number): string {
	const exponent = 2 + s * 3.35;
	const steps = 22;
	const pts: [number, number][] = [];
	const corner = (cx: number, cy: number, a0: number, a1: number) => {
		for (let i = 0; i <= steps; i++) {
			const a = a0 + (a1 - a0) * (i / steps);
			const cos = Math.cos(a);
			const sin = Math.sin(a);
			pts.push([
				+(cx + r * Math.sign(cos) * Math.abs(cos) ** (2 / exponent)).toFixed(2),
				+(cy + r * Math.sign(sin) * Math.abs(sin) ** (2 / exponent)).toFixed(2),
			]);
		}
	};
	pts.push([r, 0], [size - r, 0]);
	corner(size - r, r, -Math.PI / 2, 0);
	pts.push([size, size - r]);
	corner(size - r, size - r, 0, Math.PI / 2);
	pts.push([r, size]);
	corner(r, size - r, Math.PI / 2, Math.PI);
	pts.push([0, r]);
	corner(r, r, Math.PI, Math.PI * 1.5);
	return `M${pts.map(([x, y]) => `${x} ${y}`).join("L")}Z`;
}

/* Figure: the same 32px radius drawn three ways, with the circular arc
   overlaid in red as the reference. */
function CornerFigure() {
	const SIZE = 108;
	const R = 32;
	const circle = squirclePath({
		width: SIZE,
		height: SIZE,
		radius: R,
		smoothing: 0,
	});
	const tiles: { label: string; d: string }[] = [
		{ label: "border-radius", d: circle },
		{ label: "naive superellipse", d: naiveSuperellipsePath(SIZE, R, 0.6) },
		{
			label: "corner smoothing",
			d: squirclePath({ width: SIZE, height: SIZE, radius: R, smoothing: 0.6 }),
		},
	];
	return (
		<div className="mt-[22px] flex flex-wrap justify-center gap-8 rounded-[16px] bg-(--surface) px-6 py-8">
			{tiles.map((t) => (
				<figure key={t.label} className="m-0 flex flex-col items-center gap-3">
					<div className="relative" style={{ width: SIZE, height: SIZE }}>
						<div
							aria-hidden="true"
							className="h-full w-full bg-(--shape)"
							style={{ clipPath: `path("${t.d}")` }}
						/>
						<svg
							aria-hidden="true"
							className="pointer-events-none absolute inset-0"
							viewBox={`0 0 ${SIZE} ${SIZE}`}
							width={SIZE}
							height={SIZE}
						>
							<title>Circular reference outline</title>
							<path
								d={circle}
								fill="none"
								stroke={OUTLINE_CIRCLE}
								strokeWidth="1.25"
							/>
						</svg>
					</div>
					<figcaption className="font-mono text-[11px] text-(--muted)">
						{t.label}
					</figcaption>
				</figure>
			))}
		</div>
	);
}

/* ── table of contents (glass, right gutter, dot hidden) ── */
const TOC: { id: string; label: string }[] = [
	{ id: "playground", label: "Playground" },
	{ id: "circular", label: "The circular corner" },
	{ id: "superellipse", label: "The superellipse trap" },
	{ id: "math", label: "The actual geometry" },
	{ id: "web", label: "On the web" },
	{ id: "caveats", label: "Caveats" },
];

const TOC_ITEM_H = 28;

function TableOfContents() {
	const reduced = useReducedMotion() ?? false;
	const [wide, setWide] = useState(false);
	const { active, scrollToId } = useScrollSpy({
		ids: TOC.map((it) => it.id),
		topOffset: 96,
	});

	useEffect(() => {
		const setW = () => setWide(window.innerWidth >= 1080);
		setW();
		window.addEventListener("resize", setW);
		return () => window.removeEventListener("resize", setW);
	}, []);

	if (!wide) return null;

	return (
		<aside
			aria-label="Contents"
			style={{ position: "absolute", top: 0, right: 0, height: "100%", width: 196 }}
		>
			<motion.nav
				// Opacity-only fade-in (a transform would break the sticky nav).
				initial={reduced ? false : { opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={reduced ? { duration: 0 } : { duration: 0.4, delay: 0.15 }}
				style={{
					position: "sticky",
					top: 96,
					marginTop: 76,
					paddingLeft: 13,
					display: "flex",
					flexDirection: "column",
				}}
			>
				<style>{`.toc-link:hover{color:rgba(23,23,23,0.74) !important}`}</style>
				{TOC.map((it, i) => (
					<a
						key={it.id}
						href={`#${it.id}`}
						className="toc-link"
						aria-current={i === active ? "true" : undefined}
						onClick={(e) => {
							e.preventDefault();
							scrollToId(it.id);
						}}
						style={{
							display: "flex",
							alignItems: "center",
							height: TOC_ITEM_H,
							textDecoration: "none",
							fontSize: 14,
							letterSpacing: "0.1px",
							cursor: "pointer",
							color: i === active ? INK : MUTED,
							transition: "color 200ms ease",
						}}
					>
						{it.label}
					</a>
				))}
			</motion.nav>
		</aside>
	);
}

/* ── control row: label / range / tabular readout ── */
function Slider({
	label,
	min,
	max,
	value,
	unit,
	onChange,
}: {
	label: string;
	min: number;
	max: number;
	value: number;
	unit: string;
	onChange: (v: number) => void;
}) {
	return (
		<label className="flex items-center gap-4">
			<span className="w-24 text-sm text-(--muted)">{label}</span>
			<input
				type="range"
				min={min}
				max={max}
				value={value}
				onChange={(e) => onChange(+e.target.value)}
				className="flex-1"
			/>
			<output className="w-16 text-right font-mono text-[13px] tabular-nums text-(--ink)">
				{value}
				{unit}
			</output>
		</label>
	);
}

const SECTION: CSSProperties = { scrollMarginTop: 96 };

type Tab = "css" | "react" | "path";

export function SmoothContent({
	highlighted,
}: {
	highlighted: Record<string, string>;
}) {
	const reduced = useReducedMotion() ?? false;
	const [width, setWidth] = useState(320);
	const [height, setHeight] = useState(320);
	const [radius, setRadius] = useState(40);
	const [smoothing, setSmoothing] = useState(60);
	const [outlines, setOutlines] = useState(false);
	const [tab, setTab] = useState<Tab>("css");
	const [copied, setCopied] = useState(false);

	const stageRef = useSmoothCorners<HTMLDivElement>(20);
	const panelRef = useSmoothCorners<HTMLDivElement>(20);
	const codeRef = useSmoothCorners<HTMLDivElement>(16);

	const d = useMemo(
		() => squirclePath({ width, height, radius, smoothing: smoothing / 100 }),
		[width, height, radius, smoothing],
	);
	const circleD = useMemo(
		() => squirclePath({ width, height, radius, smoothing: 0 }),
		[width, height, radius],
	);

	const snippets: Record<Tab, string> = {
		css: `clip-path: path("${d}");`,
		react: `import { useSmoothCorners } from "@outpacelabs/squircle/react";

// radius in px, smoothing 0-100 (60 = Apple)
const ref = useSmoothCorners<HTMLDivElement>(${radius}${smoothing === 60 ? "" : `, ${smoothing}`});

<div ref={ref} className="rounded-[${radius}px]" />`,
		path: d,
	};

	const copy = () => {
		void navigator.clipboard?.writeText(snippets[tab]).then(() => {
			setCopied(true);
			window.setTimeout(() => setCopied(false), 1400);
		});
	};

	const reveal = (delay: number) => ({
		initial: reduced ? false : { opacity: 0, y: 12 },
		animate: { opacity: 1, y: 0 },
		transition: reduced ? { duration: 0 } : { ...REVEAL, delay },
	});

	return (
		<div className="flex min-h-screen flex-col items-center px-4 pb-24 pt-3">
			{/* Shiki blocks: our flat surface owns the background. */}
			<style>{`.article-code .shiki{margin:0;padding:16px 18px;overflow-x:auto;line-height:1.65;background:transparent !important;font-family:var(--font-mono);font-size:13px}
.article-code .shiki code{font-family:inherit;background:transparent;padding:0}`}</style>

			{/* Header — brand mark left, GitHub pill right (glass nav type). */}
			<header className="sticky top-4 z-10 flex w-full items-center justify-between rounded-[10px] bg-white/80 px-2 backdrop-blur-[12px]">
				<a
					href="https://outpacestudios.com"
					target="_blank"
					rel="noopener noreferrer"
					aria-label="Outpace Studios"
					className="flex items-center transition-opacity hover:opacity-70"
				>
					<OutpaceLogo />
				</a>
				<a
					href="https://github.com/outpacelabs/smooth"
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex items-center gap-1.5 rounded-full bg-(--chip) py-2.5 pl-3 pr-3.5 text-sm font-[550] leading-none text-(--ink) transition hover:bg-[rgba(23,23,23,0.08)] motion-safe:active:scale-[0.97]"
				>
					<GithubMark />
					GitHub
				</a>
			</header>

			{/* Hero */}
			<motion.div
				className="flex flex-col items-center gap-3 px-4 pb-12 pt-14 text-center sm:pt-20"
				{...reveal(0)}
			>
				<h1 className="text-2xl font-[550] leading-[1.2] tracking-[-0.4px] text-(--ink) text-balance">
					Corner smoothing that keeps your radius
				</h1>
				<p className="max-w-[520px] text-sm leading-[1.72] tracking-[0.1px] text-(--body) text-pretty">
					Figma and Apple corners keep the circular arc at the apex and soften
					only the edge transition. Tune it, compare it against plain{" "}
					<C>border-radius</C>, and copy the code.
				</p>
				<button
					type="button"
					title="Copy install command"
					onClick={() => {
						void navigator.clipboard?.writeText(
							"pnpm add @outpacelabs/squircle",
						);
					}}
					className="mt-3 flex h-12 items-center gap-3 rounded-full bg-(--chip) px-5 transition hover:bg-[rgba(23,23,23,0.08)] motion-safe:active:scale-[0.98]"
				>
					<span className="select-none font-mono text-[13px] leading-5 text-(--muted)">
						$
					</span>
					<span className="font-mono text-[13px] leading-5 text-(--ink)">
						pnpm add @outpacelabs/squircle
					</span>
				</button>
			</motion.div>

			{/* Configurator */}
			<motion.section
				id="playground"
				style={SECTION}
				className="grid w-full max-w-[1080px] gap-2 lg:grid-cols-[1fr_360px]"
				{...reveal(0.08)}
			>
				{/* Stage */}
				<div
					ref={stageRef}
					className="relative flex min-h-[460px] items-center justify-center overflow-hidden rounded-[20px] bg-(--surface) p-8"
				>
					<div className="relative" style={{ width, height }}>
						<div
							aria-hidden="true"
							className="h-full w-full bg-(--shape)"
							style={{ clipPath: `path("${d}")` }}
						/>
						{outlines && (
							<svg
								aria-hidden="true"
								className="pointer-events-none absolute inset-0"
								viewBox={`0 0 ${width} ${height}`}
								width={width}
								height={height}
							>
								<title>Outline comparison</title>
								<path
									d={circleD}
									fill="none"
									stroke={OUTLINE_CIRCLE}
									strokeWidth="1.5"
								/>
								<path
									d={d}
									fill="none"
									stroke={OUTLINE_SQUIRCLE}
									strokeWidth="1.5"
								/>
							</svg>
						)}
					</div>
					{outlines && (
						<div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-4 font-mono text-[11px] text-(--muted)">
							<span className="flex items-center gap-1.5">
								<i
									className="inline-block h-[2px] w-3.5 rounded-[1px]"
									style={{ background: OUTLINE_CIRCLE }}
								/>
								border-radius
							</span>
							<span className="flex items-center gap-1.5">
								<i
									className="inline-block h-[2px] w-3.5 rounded-[1px]"
									style={{ background: OUTLINE_SQUIRCLE }}
								/>
								squircle
							</span>
						</div>
					)}
				</div>

				{/* Controls */}
				<div
					ref={panelRef}
					className="flex flex-col gap-5 rounded-[20px] bg-(--surface) p-6"
				>
					<Slider
						label="width"
						min={120}
						max={420}
						value={width}
						unit="px"
						onChange={setWidth}
					/>
					<Slider
						label="height"
						min={120}
						max={396}
						value={height}
						unit="px"
						onChange={setHeight}
					/>
					<Slider
						label="radius"
						min={0}
						max={198}
						value={radius}
						unit="px"
						onChange={setRadius}
					/>
					<Slider
						label="smoothing"
						min={0}
						max={100}
						value={smoothing}
						unit="%"
						onChange={setSmoothing}
					/>
					<label className="flex cursor-pointer select-none items-center gap-2.5 text-sm text-(--muted)">
						<input
							type="checkbox"
							checked={outlines}
							onChange={(e) => setOutlines(e.target.checked)}
						/>
						compare against border-radius
					</label>

					{/* Presets — same radius, increasing smoothing. */}
					<div className="mt-1 flex flex-col gap-2.5">
						<span className="text-sm text-(--muted)">presets</span>
						<div className="flex gap-2">
							{[0, 30, 60, 100].map((s) => (
								<button
									key={s}
									type="button"
									onClick={() => setSmoothing(s)}
									className="group flex flex-col items-center gap-1.5"
								>
									<span
										aria-hidden="true"
										className="block size-14 bg-(--shape) transition-transform motion-safe:group-active:scale-95"
										style={{
											clipPath: `path("${squirclePath({ width: 56, height: 56, radius: 14, smoothing: s / 100 })}")`,
											opacity: smoothing === s ? 1 : 0.25,
											transition: "opacity 150ms ease",
										}}
									/>
									<span
										className={`font-mono text-[11px] transition-colors ${
											smoothing === s ? "text-(--ink)" : "text-(--muted)"
										}`}
									>
										{s === 60 ? "60% · Apple" : `${s}%`}
									</span>
								</button>
							))}
						</div>
					</div>
				</div>
			</motion.section>

			{/* Code output */}
			<motion.div className="mt-2 w-full max-w-[1080px]" {...reveal(0.16)}>
				<div ref={codeRef} className="rounded-[16px] bg-(--surface)">
					<div className="flex items-center gap-0.5 px-[13px] pb-[5px] pt-[13px]">
						{(["css", "react", "path"] as const).map((t) => (
							<button
								key={t}
								type="button"
								onClick={() => setTab(t)}
								className={`rounded-[6px] px-[7px] py-[3px] font-mono text-[11.76px] leading-[1.28] transition-colors ${
									tab === t
										? "bg-(--chip) text-(--ink)"
										: "text-(--muted) hover:bg-(--chip) hover:text-[rgba(23,23,23,0.74)]"
								}`}
							>
								{t}
							</button>
						))}
						<button
							type="button"
							onClick={copy}
							className={`ml-auto rounded-[6px] px-[7px] py-[3px] font-mono text-[11.76px] leading-[1.28] transition-colors ${
								copied ? "text-(--ink)" : "text-(--muted) hover:text-(--ink)"
							}`}
						>
							{copied ? "copied" : "copy"}
						</button>
					</div>
					<pre className="overflow-x-auto whitespace-pre-wrap break-all px-[18px] pb-4 pt-2 font-mono text-[13px] leading-[1.65] text-[rgba(23,23,23,0.85)]">
						{snippets[tab]}
					</pre>
				</div>
			</motion.div>

			{/* ── the article: 1080 container holding the 640 column + TOC ── */}
			<div className="relative mx-auto mt-8 w-full max-w-[1080px]">
				<TableOfContents />
				<main>
					<section id="circular" style={SECTION}>
						<Col>
							<H2>The circular corner</H2>
							<P>
								<C>border-radius</C> rounds a corner with a quarter of a
								circle. The edge runs perfectly straight, at zero curvature,
								and at the exact point where the arc begins the curvature
								jumps to <C>1/r</C>. Your eye reads that jump as a faint
								crease: the outline stops feeling like one continuous line.
							</P>
							<P>
								Apple has been sanding that crease off for years, on hardware,
								on iOS icons, on the Dynamic Island. Figma shipped the same
								idea as a slider called corner smoothing. The corner stays a
								corner; the curvature just ramps up gradually instead of
								switching on.
							</P>
						</Col>
					</section>

					<section id="superellipse" style={SECTION}>
						<Col>
							<H2>The superellipse trap</H2>
							<P>
								The usual first attempt is a superellipse,{" "}
								<C>|x/r|&#8319; + |y/r|&#8319; = 1</C>, sampled into the
								corner box. It produces a perfectly continuous curve, and it
								quietly changes your design: inside the same r-by-r corner
								box, a superellipse hugs the corner tighter than the circle
								does. The apex creeps outward and a 20px radius reads closer
								to 12.
							</P>
							<P>
								We shipped that version first. Every corner on the site came
								back visibly squarer, at the same nominal radius. The red
								outline below is the plain circular arc; watch what each curve
								does at the apex.
							</P>
							<CornerFigure />
						</Col>
					</section>

					<section id="math" style={SECTION}>
						<Col>
							<H2>The actual geometry</H2>
							<P>
								The shape everyone is converging on, the one Figma describes
								in{" "}
								<A href="https://www.figma.com/blog/desperately-seeking-squircles/">
									Desperately seeking squircles
								</A>
								, keeps the circular arc at your radius. What changes is its
								sweep: 90&deg; with no smoothing, shrinking to{" "}
								<C>90&deg;&nbsp;&middot;&nbsp;(1&nbsp;&minus;&nbsp;s)</C> at
								smoothing <C>s</C>, while the transition into the edge
								stretches to{" "}
								<C>(1&nbsp;+&nbsp;s)&nbsp;&middot;&nbsp;r</C>. At 60%, the
								value Figma equates with iOS, the arc keeps 36&deg; and the
								ease consumes 1.6r of edge on either side. The apex sits
								exactly on the circle, which is why the radius you chose is
								the radius you see.
							</P>
							<P>
								Our transition curve is an original construction: a single
								cubic b&eacute;zier per side, solved in closed form from two
								continuity constraints. Its first three control points stay
								collinear on the edge, so the curve leaves the straight line
								with zero curvature; at the other end its curvature is exactly{" "}
								<C>1/r</C>, matching the circle it lands on. Both junctions are
								G2-continuous, a step smoother than <C>border-radius</C>{" "}
								itself, which is only G1. The geometry is enforced by property
								tests: apex on the radius circle, tangency and curvature at
								every junction, and a radius-first clamp when a small element
								runs out of room.
							</P>
						</Col>
					</section>

					<section id="web" style={SECTION}>
						<Col>
							<H2>On the web</H2>
							<P>
								There is no CSS property for any of this. <C>border-radius</C>{" "}
								only draws elliptical arcs, so the shape has to arrive as a
								path: <C>clip-path: path()</C> on HTML, <C>d</C> on SVG,{" "}
								<C>Path2D</C> on canvas. Paths are written in absolute pixels,
								which means responsive elements need theirs regenerated
								whenever they resize.
							</P>
							<Code html={highlighted.generator} />
							<P>
								The React hook handles that with a ResizeObserver, reading the
								border-box size from the observer entry so scale and translate
								animations never skew the geometry. Keep the element&apos;s{" "}
								<C>border-radius</C> in CSS as the no-JS fallback; the hook
								zeroes it once the clip applies, because the circular arc sits
								inside the squircle along the transition and painting both
								would intersect the shape back to the plain circle.
							</P>
							<Code html={highlighted.hook} />
						</Col>
					</section>

					<section id="caveats" style={SECTION}>
						<Col>
							<H2>Caveats</H2>
							<P>
								Smoothing only means something on rounded rectangles. A
								capsule or a circle has no straight edge left to ease into, so
								smoothing would square a pill&apos;s semicircular ends; Apple
								keeps capsules true capsules, and so should you. Below roughly
								8px of radius the circular-versus-smoothed deviation is
								subpixel and not worth a ResizeObserver.
							</P>
							<P>
								And because <C>clip-path</C> clips everything the element
								paints, including its own <C>outline</C> and{" "}
								<C>box-shadow</C>, draw focus rings on a child element, or
								accept a little clipping at the corners.
							</P>
							<div className="h-14" />
						</Col>
					</section>
				</main>
			</div>

			{/* Footer — the sign-off, glass exact. */}
			<div
				aria-hidden="true"
				className="mx-auto mt-16 h-px w-10 bg-[rgba(0,0,0,0.12)]"
			/>
			<footer className="px-6 pb-8 pt-16 text-center">
				<div className="inline-flex flex-col items-center gap-6">
					<div className="flex flex-col items-center gap-2">
						<p className="text-sm font-[450] leading-[1.3] tracking-[-0.1px] text-(--ink)">
							By Outpace Studios
						</p>
						<p className="text-sm leading-[1.45] tracking-[0.1px] text-(--body)">
							Brands, interfaces, and motion for
							<br />
							venture-backed companies
						</p>
					</div>
					<div className="flex gap-4 text-sm">
						<a
							href="https://outpacestudios.com"
							target="_blank"
							rel="noopener noreferrer"
							className="text-(--ink) underline underline-offset-2"
						>
							Website
						</a>
						<a
							href="https://x.com/outpacestudios"
							target="_blank"
							rel="noopener noreferrer"
							className="text-(--ink) underline underline-offset-2"
						>
							X / Twitter
						</a>
					</div>
				</div>
			</footer>
		</div>
	);
}
