[Original README.md](./README_orig.md)

Please use `task` tool to run tasks (https://taskfile.dev/installation/)

```
docker compose up
```

Services

- N8N                http://localhost:5678
- litellm            http://localhost:4000 (Swagger API)
- langfuse           http://localhost:3001
- openweb            http://localhost:3000
- qdrant             http://localhost:6333 (API only)
- minio              http://localhost:9091
- clickhouse         http://localhost:8123
- redis              redis://localhost:6379
- postgres           postgres://localhost:5432
- steel-browser-ui   http://localhost:5173
