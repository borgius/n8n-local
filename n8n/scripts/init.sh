#!/bin/sh

has() { type "$1" &> /dev/null; }

init(){
  has sudo || {
    apk update 
    apk add sudo curl
  }
}

n8nImport(){
  n8n import:credentials --separate --input=/backup/credentials
  n8n import:workflow --separate --input=/backup/workflows
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

mountModules(){
  cd /home/node/n8n
  local n8nModules=/usr/local/lib/node_modules/n8n/node_modules
  echo "Create a links to local packages"
  ls -1 packages | while read pkg; do
    sudo ln -sv "/home/node/n8n/packages/$pkg" "$n8nModules/$pkg"
  done
}

entrypoint() {
  tini -- /docker-entrypoint.sh
}

for cmd in $@; do
  has $cmd && $cmd
done
