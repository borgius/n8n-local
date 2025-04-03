PreReq:
```bash
brew install bitwarden-cli 
bw login
bw get template item | jq '.name = "localhost n8n"' | bw encode | bw create item
```

Fetch secrets:
```bash
bw list items --search "localhost n8n" | jq -r '.[0].notes' > .env
```

Update secrets:
```bash
item="$(bw list items --search "localhost n8n" | jq '.[0]' | base64)"
itemId=$(echo "$item" | base64 -d | jq -r '.id')
echo "$item" | base64 -d | jq --arg notes "$(cat .env)" '.notes=$notes' | bw encode | bw edit item $itemId | jq -r .notes
```
