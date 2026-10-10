# tansanrao-com-astro

This repository contains the source and theme for my personal website, [tansanrao.com](https://tansanrao.com/).

## Attribution

This site is based on [ThoughtLite](https://github.com/tuyuritio/astro-theme-thought-lite), an Astro theme created by [tuyuritio](https://github.com/tuyuritio). This repository is a derived work adapted for my personal site and is not the upstream ThoughtLite project.

## Local Development

```sh
pnpm install
pnpm dev
```

To create a production build:

```sh
pnpm build
```

## Amp Orbs

`.agents/setup` installs the Node version in `.nvmrc`, the pnpm version in
`package.json`, and dependencies from the frozen lockfile. Amp snapshots the prepared
environment for reuse; rerunning setup reuses installed tools and dependencies.
The pinned tools are available in repository-scoped login shells, including
supervised services. No application secrets, database, or resume hook are required.

Start the supervised Astro dev server and obtain its portal link with:

```sh
amp orb services ensure
```

## License

This repository remains licensed under [GPLv3](./LICENSE). ThoughtLite, the base theme this work is derived from, is also distributed under GPLv3.
