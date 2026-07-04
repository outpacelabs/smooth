import { codeToHtml } from "shiki";
import { SmoothContent } from "./content";

// Server-highlighted snippets: no Shiki ships to the client, the article
// receives ready-made HTML (same pattern as the glass article).
const SNIPPETS = {
	generator: {
		lang: "ts",
		code: `import { squirclePath } from "@outpacelabs/squircle";

// SVG path data in border-box pixels. smoothing 0 to 1; 0.6 = Apple.
const d = squirclePath({ width: 320, height: 200, radius: 20, smoothing: 0.6 });

element.style.clipPath = \`path("\${d}")\`;`,
	},
	hook: {
		lang: "tsx",
		code: `import { useSmoothCorners } from "@outpacelabs/squircle/react";

function Card() {
  // radius in px, smoothing 0 to 100 (default 60)
  const ref = useSmoothCorners<HTMLDivElement>(20);
  return <div ref={ref} className="rounded-[20px]" />;
}`,
	},
} as const;

const CODE_THEME = "github-light";

export default async function Page() {
	const entries = await Promise.all(
		Object.entries(SNIPPETS).map(
			async ([key, s]) =>
				[key, await codeToHtml(s.code, { lang: s.lang, theme: CODE_THEME })] as const,
		),
	);
	const highlighted = Object.fromEntries(entries) as Record<string, string>;

	return <SmoothContent highlighted={highlighted} />;
}
