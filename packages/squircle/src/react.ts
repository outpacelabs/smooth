"use client";

import { useEffect, useRef } from "react";
import { squirclePath } from "./index";

/**
 * Applies Figma-style smoothed corners (Apple squircle) to an element via
 * `clip-path: path(...)`, regenerated on resize. Reads the border-box size
 * from the ResizeObserver entry, so transform-based entrance animations
 * (scale/translate) never skew the path.
 *
 * The element should keep its CSS border-radius: it is the no-JS /
 * unsupported-browser fallback. Once the clip applies, the inline
 * border-radius is zeroed — the circular arc and the squircle overlap at
 * the corner apex, and letting both paint would clip the smoothed edge
 * transition away. Layout is untouched; only painting is clipped.
 *
 * ```tsx
 * const ref = useSmoothCorners<HTMLDivElement>(20); // radius px, 60% smoothing
 * return <div ref={ref} className="rounded-[20px] …" />;
 * ```
 */
export function useSmoothCorners<T extends HTMLElement>(
	radius: number,
	/** Corner smoothing, 0–100. 60 is the Apple/Figma target. */
	smoothing = 60,
) {
	const ref = useRef<T | null>(null);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		if (
			typeof CSS === "undefined" ||
			!CSS.supports("clip-path", 'path("M0 0H1V1H0Z")')
		) {
			return;
		}

		const observer = new ResizeObserver((entries) => {
			const box = entries[0]?.borderBoxSize?.[0];
			const width = box ? box.inlineSize : el.offsetWidth;
			const height = box ? box.blockSize : el.offsetHeight;
			if (!width || !height) return;
			const d = squirclePath({
				width,
				height,
				radius,
				smoothing: Math.min(Math.max(smoothing, 0), 100) / 100,
			});
			el.style.clipPath = `path("${d}")`;
			el.style.borderRadius = "0px";
		});
		observer.observe(el);

		return () => {
			observer.disconnect();
			el.style.clipPath = "";
			el.style.borderRadius = "";
		};
	}, [radius, smoothing]);

	return ref;
}
