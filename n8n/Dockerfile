FROM n8nio/n8n:next
USER root
RUN <<EOR
	set -x
	apk update && apk add sudo shadow bash curl nano jq docker-cli docker-cli-compose deno
	npm install -g @go-task/cli mcp-proxy pm2@latest
	addgroup node root
	echo "node ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/node
	chmod 0440 /etc/sudoers.d/node 
	mkdir -p /backup && chown node:node /backup 
	rm /bin/sh && ln -s /bin/bash /bin/sh
EOR

USER node  
RUN	<<EOR
	bash -c "$(curl -fsSL https://raw.githubusercontent.com/ohmybash/oh-my-bash/master/tools/install.sh)"
	mkdir -p .n8n n8n
EOR
