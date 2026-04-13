FROM mcr.microsoft.com/devcontainers/javascript-node:24

RUN apt-get update \
    && export DEBIAN_FRONTEND=noninteractive \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        git \
        ripgrep \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable \
    && npm install -g @openai/codex @anthropic-ai/claude-code
