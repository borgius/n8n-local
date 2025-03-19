FROM n8nio/n8n:latest
USER root
RUN set -x; apk update && apk add sudo curl nano jq && \
    echo "node ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/node && \
    chmod 0440 /etc/sudoers.d/node
USER node  

COPY n8n /home/node/n8n 
RUN n8n/scripts/init.sh nodeModules
