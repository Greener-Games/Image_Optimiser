# Image Optimiser

This repository is the home of [`@greener-games/image-optimiser`](./plugins/@greener-games/image-optimiser), a Vue 3 plugin that provides an optimized `<CacheImage>` component, composables, and services for caching and transforming images from Hygraph, other CDNs, or custom providers.

- **Plugin source & docs**: [`plugins/@greener-games/image-optimiser`](./plugins/@greener-games/image-optimiser) — see that package's [README](./plugins/@greener-games/image-optimiser/README.md) for installation, configuration, and usage.
- **Demo app**: The root `src/` folder is a small Vue app used to exercise the plugin during development (see `src/main.ts` for example wiring, including a custom `CustomCloudinaryOptimizer`).

This workspace was originally scaffolded from a shared Vue 3 + Vite plugin-development template, and comes with a unified CI/CD pipeline powered by `semantic-release` (see [`.supporting_docs/RELEASE_PROCESS.md`](./.supporting_docs/RELEASE_PROCESS.md) for how releases and commit prefixes work).

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
