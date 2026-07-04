import { defineConfig } from "tsup";

export default defineConfig([
	{
		entry: { index: "src/index.ts", react: "src/react.ts" },
		format: ["esm", "cjs"],
		dts: true,
		clean: true,
		sourcemap: true,
		treeshake: true,
		// The core is dependency-free; only the ./react entry touches React.
		external: ["react", "react-dom"],
	},
	{
		// Demo bundle: a classic IIFE script so demo/index.html works when
		// double-clicked (file:// blocks module imports) and without a served
		// dist. Committed alongside the page; regenerated on every build.
		entry: { demo: "src/demo.ts" },
		format: ["iife"],
		outDir: "demo",
		outExtension: () => ({ js: ".js" }),
		dts: false,
		sourcemap: false,
		clean: false, // demo/ also holds index.html
	},
]);
