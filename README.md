<h1 align="center">smooth</h1>

<p align="center">
  Figma-style corner smoothing (Apple squircles) that keeps your corner radius.
</p>

## What's in this repo

| Path | What |
|------|------|
| [`packages/smooth`](./packages/smooth) | **`@outpacelabs/smooth`**, the published package: path generator + React hook. |
| [`src`](./src) | The Next.js configurator site: tune radius/smoothing, compare against plain `border-radius`, copy the code. |

## Local development

This repo is managed with **pnpm** (see `packageManager` in `package.json`).

```bash
pnpm install          # install deps (workspace)
pnpm packages:build   # build the package (the site imports it)
pnpm dev              # run the configurator → http://localhost:3000
pnpm typecheck        # site + package
```

## License

[MIT](./LICENSE), free to use. By [Outpace Studios](https://outpacestudios.com).
