FROM n8nio/n8n:latest
USER root
RUN set -x; apk update && apk add sudo curl nano jq && \
    echo "node ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/node && \
    chmod 0440 /etc/sudoers.d/node
USER node  

RUN mkdir -p .n8n n8n /backup
COPY scripts n8n/scripts
COPY packages n8n/packages
COPY ./package*.json /home/node/n8n/
COPY communityNodes /home/node/.n8n/nodes
COPY customNodes /home/node/.n8n/custom 
RUN n8n/scripts/init.sh nodeModules communityNodes
