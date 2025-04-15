FROM n8nio/n8n:next
USER root
RUN <<EOR
	set -x
	apk update && apk add sudo shadow bash curl nano jq docker-cli docker-cli-compose
	echo "node ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/node
	chmod 0440 /etc/sudoers.d/node 
	mkdir -p /backup && chown node:node /backup 
	rm /bin/sh && ln -s /bin/bash /bin/sh
EOR


USER node  
RUN mkdir -p .n8n n8n

COPY scripts n8n/scripts
COPY packages n8n/packages
COPY ./package*.json /home/node/n8n/
COPY communityNodes /home/node/.n8n/nodes
COPY customNodes /home/node/.n8n/custom 
RUN n8n/scripts/init.sh nodeModules communityNodes
