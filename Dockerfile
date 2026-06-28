# Use a Node.js base image supporting OpenClaw (Node 22+)
FROM node:22-slim

# Install system dependencies (needed to download/install Bun and build gbrain)
RUN apt-get update && apt-get install -y \
    curl \
    unzip \
    git \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

# Clone and install official gbrain globally
WORKDIR /usr/src
RUN git clone https://github.com/garrytan/gbrain.git
WORKDIR /usr/src/gbrain
RUN bun install
RUN bun run build

# Set up global and local compatibility symlinks pointing directly to the compiled standalone binary
RUN mkdir -p /root/.bun/bin && ln -s /usr/src/gbrain/bin/gbrain /root/.bun/bin/gbrain
RUN mkdir -p /home/radesh/.bun/bin && ln -s /usr/src/gbrain/bin/gbrain /home/radesh/.bun/bin/gbrain

# Install OpenClaw globally (standard method)
RUN npm install -g openclaw@latest

# Set up the main app directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy application source code
COPY . .

# Copy OpenClaw configuration templates
# Note: User must copy ~/.openclaw/ contents into openclaw-config/ in their local repository
COPY openclaw-config /root/.openclaw

# Copy database seed files
COPY gbrain-seed /usr/src/gbrain-seed

# Expose ports (Railway web port and OpenClaw Gateway port)
EXPOSE 3002
EXPOSE 18789

# Startup command
CMD ["npm", "start"]
