#!/bin/bash
has() { type "$1" &>/dev/null; }
+() {
  echo "+ $@"
  "$@"
}

gitInit() {
  cd /home/node
  test -f .gitignore || {
    echo "Creating .gitignore"
    printf 'node_modules\n.pnpm-store\n.npm\n.cache'>.gitignore
    set -x
    git init
    git config --global user.name "n8n"
    git config --global user.email "n8n@localhost"
    git add .
    git commit -m "Initial commit"
    set +x
  }
}

fixPermissions() {
  echo "Fixing permissions"
  set -x
  mkdir -p /home/node/.n8n/nodes
  sudo chown -R node:node /home/node/.n8n/nodes
  set +x
}

n8nImport() {
  if [ -d "/backup/credentials" ] && [ -n "$(ls -A /backup/credentials 2>/dev/null)" ]; then
    echo "Found credentials to import"
    + n8n import:credentials --separate --input=/backup/credentials
  else
    echo "No credentials found in /backup/credentials, skipping credentials import"
  fi

  if [ -d "/backup/workflows" ] && [ -n "$(ls -A /backup/workflows 2>/dev/null)" ]; then
    echo "Found workflows to import"
    + n8n import:workflow --separate --input=/backup/workflows
  else
    echo "No workflows found in /backup/workflows, skipping workflows import"
  fi
}

extraPackages() {
  + cd /home/node/packages
  local n8nModules=/usr/local/lib/node_modules/n8n/node_modules
  echo "Create a links to local packages"
  find . -mindepth 1 -maxdepth 1 -type d -not -name "node_modules" | xargs -n1 basename | while read pkg; do
    if [ ! -L "$n8nModules/$pkg" ] && [ ! -d "$n8nModules/$pkg" ]; then
      sudo ln -sv "/home/node/packages/$pkg" "$n8nModules/$pkg"
    else
      echo "Link for $pkg already exists, skipping"
    fi
  done
  mkdir -p node_modules
  # Fix permissions for node_modules
  sudo chown -R node:node node_modules
  + npm install
  find node_modules -mindepth 1 -maxdepth 1 -type d -exec sudo mv -v {} $n8nModules/ \;
  + cd /home/node
}

communityNodes() {
  + mkdir -p /home/node/.n8n/nodes
  if [ -d "/home/node/_communityNodes" ]; then
    cp -rfv /home/node/_communityNodes/* /home/node/.n8n/nodes/
  fi
  + npm install
}

customNodes() {
  mkdir -p /home/node/.n8n/custom/node_modules
  + chown -R node:node node_modules
  + npm install
}

startMcpServers() {
  echo "Start MCP Servers"
  set -x
  cd ~/mcp
  sudo chown node:node /home/node/mcp/node_modules /home/node/mcp/.pnpm-store
  {
    pnpm i
    pm2 start
  } &
}

entrypoint() {
  exec tini -- /docker-entrypoint.sh
}

for cmd in $@; do
  has $cmd && + $cmd
done
