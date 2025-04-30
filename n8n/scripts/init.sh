#!/bin/bash
has() { type "$1" &>/dev/null; }
+() {
  echo "+ $@"
  "$@"
}

gitInit() {
  cd /home/node
  test -d .git || {
    git config --global init.defaultBranch main
    git init
    git config --global user.name "n8n"
    git config --global user.email "n8n@localhost"
    git add .
    git commit -m "Initial commit"
  }
}

fixDockerPermissions() {
  echo "Fixing docker permissions"
  if [ -e /var/run/docker.sock ]; then
    DOCKER_GID=$(stat -c '%g' /var/run/docker.sock)
    if [ "$DOCKER_GID" != "0" ]; then
      echo "Docker socket belongs to group ID: $DOCKER_GID"
      # Check if the group already exists with this GID
      if ! getent group $DOCKER_GID > /dev/null; then
        echo "Creating docker group with GID: $DOCKER_GID"
        sudo groupadd -g $DOCKER_GID docker
      fi
      
      # Add current user to the docker group
      echo "Adding $(whoami) user to docker group"
      sudo usermod -aG $DOCKER_GID $(whoami)
      
      echo "Docker permissions fixed. You may need to log out and back in for changes to take effect."
    else
      echo "Docker socket belongs to root group, no need to adjust permissions"
    fi
  else
    echo "Docker socket not found at /var/run/docker.sock"
  fi
}

fixPermissions() {
  echo "Fixing permissions"
  mkdir -p /home/node/.n8n/nodes
  sudo chown -R node:node /home/node/.n8n/nodes
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
  + mkdir -p /home/node/.n8n/nodes/node_modules
  cd /home/node/.n8n/nodes
  if [ -d "/home/node/_communityNodes" ]; then
    cp -rfv /home/node/_communityNodes/* /home/node/.n8n/nodes/
  fi
  + chown -R node:node node_modules
  + npm install
  cd /home/node
}

customNodes() {
  mkdir -p /home/node/.n8n/custom/node_modules
  + chown -R node:node node_modules
  + npm install
}

startMcpServers() {
  echo "Start MCP Servers"
  cd ~/mcp
  sudo chown node:node /home/node/mcp/node_modules /home/node/mcp/.pnpm-store
  {
    + pnpm i
    + pm2 start
    + pm2 log
  } &
  cd /home/node
  echo "MCP Servers started"
}

entrypoint() {
  exec tini -- /docker-entrypoint.sh
}

for cmd in $@; do
  has $cmd && + $cmd
done
