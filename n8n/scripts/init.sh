#!/bin/sh

has() { type "$1" &> /dev/null; }

init(){
  has sudo || {
    sudo apk update 
    sudo apk add sudo curl
  }
}

n8nImport(){
  if [ -d "/backup/credentials" ] && [ -n "$(ls -A /backup/credentials 2>/dev/null)" ]; then
    echo "Found credentials to import"
    n8n import:credentials --separate --pretty --input=/backup/credentials
  else
    echo "No credentials found in /backup/credentials, skipping credentials import"
  fi

  if [ -d "/backup/workflows" ] && [ -n "$(ls -A /backup/workflows 2>/dev/null)" ]; then
    echo "Found workflows to import"
    n8n import:workflow --separate --pretty --input=/backup/workflows
  else
    echo "No workflows found in /backup/workflows, skipping workflows import"
  fi
}

nodeModules(){
  set -x
  sudo chown -R node:node /home/node/n8n
  cd /home/node/n8n
  npm install
  local n8nModules=/usr/local/lib/node_modules/n8n/node_modules
  find node_modules -mindepth 1 -maxdepth 1 -type d -exec sudo mv -v {} $n8nModules/ \;
  set +x
}

mountModules() {
  cd /home/node/n8n
  local n8nModules=/usr/local/lib/node_modules/n8n/node_modules
  echo "Create a links to local packages"
  ls -1 packages | while read pkg; do
    sudo ln -sv "/home/node/n8n/packages/$pkg" "$n8nModules/$pkg"
  done
}

communityNodes() {
  mkdir -p /home/node/.n8n/nodes
  npm install
}

customNodes() {
  mkdir -p /home/node/.n8n/custom
  npm install
}

entrypoint() {
  tini -- /docker-entrypoint.sh
}

for cmd in $@; do
  has $cmd && $cmd
done
