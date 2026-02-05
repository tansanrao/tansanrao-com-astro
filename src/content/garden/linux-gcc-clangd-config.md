---
title: Linux GCC Clangd Config
description: ".clangd snippet to configure LSPs in IDEs when the Linux kernel is built using GCC."
pubDate: 2026-02-05T00:00:00.000Z
updatedDate: 2026-02-05T00:00:00.000Z 
topics:
  - Useful Snippets
draft: false
authors:
  - name: Tanuj Ravi Rao
    url: 'https://tansanrao.com'
---


```yaml
CompileFlags:
  Add: [-Wno-unknown-warning-option, -Wno-unused-command-line-argument]
  Remove: [-mpreferred-stack-boundary=*,
    -mindirect-branch=*,
    -mindirect-branch-register,
    -fno-allow-store-data-races,
    -fconserve-stack,
    -mrecord-mcount,
    -fno-allow-store-data-races,
    -mabi=*,
    -march=*,
    -fsanitize=bounds-strict]

Index:
  Background: Build
```
