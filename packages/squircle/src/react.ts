"use client";

import { useEffect, useRef } from "react";
import { squirclePath } from "./index";

export interface SmoothCornersOptions {
	/**
	 * Reactive corners: smoothing (0-100) while the pointer is down. The
	 * generated paths share one command structure at any smoothing above
	 * zero, so the browser interpolates the clip-path natively on the
	 * compositor — the corners soften under the finger like physical give,
	 * and spring back on release. Values are clamped to at least 1 (a
	 * smoothing of exactly 0 emits plain arcs, a different path structure
	 * that cannot interpolate). Instant under prefers-reduced-motion.
	 */
	press?: number;
}

const PRESS_TRANSITION = "clip-path 180ms cubic-bezier(0.22, 1, 0.36, 1)";

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
 *
 * // Reactive: corners soften to 100% smoothing while pressed.
 * const ref = useSmoothCorners<HTMLButtonElement>(16, 60, { press: 100 });
 * ```
 */
export function useSmoothCorners<T extends HTMLElement>(
	radius: number,
	/** Corner smoothing, 0–100. 60 is the Apple/Figma target. */
	smoothing = 60,
	options?: SmoothCornersOptions,
) {
	const ref = useRef<T | null>(null);
	const press = options?.press;

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		if (
			typeof CSS === "undefined" ||
			!CSS.supports("clip-path", 'path("M0 0H1V1H0Z")')
		) {
			return;
		}

		let width = 0;
		let height = 0;
		let pressed = false;

		const pathFor = (s: number) =>
			`path("${squirclePath({
				width,
				height,
				radius,
				smoothing: Math.min(Math.max(s, 0), 100) / 100,
			})}")`;

		const apply = () => {
			if (!width || !height) return;
			// Interpolation needs identical path structure, so the pressed
			// state never drops to the plain-arc form (smoothing 0).
			const s = pressed && press != null ? Math.max(press, 1) : smoothing;
			el.style.clipPath = pathFor(press != null ? Math.max(s, 1) : s);
			el.style.borderRadius = "0px";
		};

		const observer = new ResizeObserver((entries) => {
			const box = entries[0]?.borderBoxSize?.[0];
			width = box ? box.inlineSize : el.offsetWidth;
			height = box ? box.blockSize : el.offsetHeight;
			apply();
		});
		observer.observe(el);

		let cleanupPress: (() => void) | undefined;
		if (press != null) {
			const reduced = window.matchMedia?.(
				"(prefers-reduced-motion: reduce)",
			).matches;
			if (!reduced) el.style.transition = PRESS_TRANSITION;
			const down = () => {
				pressed = true;
				apply();
			};
			const up = () => {
				pressed = false;
				apply();
			};
			el.addEventListener("pointerdown", down);
			el.addEventListener("pointerup", up);
			el.addEventListener("pointercancel", up);
			el.addEventListener("pointerleave", up);
			cleanupPress = () => {
				el.removeEventListener("pointerdown", down);
				el.removeEventListener("pointerup", up);
				el.removeEventListener("pointercancel", up);
				el.removeEventListener("pointerleave", up);
				el.style.transition = "";
			};
		}

		return () => {
			observer.disconnect();
			cleanupPress?.();
			el.style.clipPath = "";
			el.style.borderRadius = "";
		};
	}, [radius, smoothing, press]);

	return ref;
}
