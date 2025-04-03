# Browser Use Local Bridge for n8n

This is a local bridge service that enables n8n to communicate with the Browser Use Python library. It mimics the Browser Use Cloud API endpoints but runs locally, allowing you to execute browser automation tasks without relying on the cloud service.

## Features

- Compatible with the Browser Use Cloud API endpoints
- Supports both OpenAI and Anthropic language models
- Provides task management (run, pause, resume, stop)
- Exposes status tracking and result retrieval

## Prerequisites

- Python 3.10 or higher
- pip (Python package manager)
- Browser Use Python library
- API keys for OpenAI or Anthropic (depending on which LLM you want to use)

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/browser-n8n-local.git
   cd browser-n8n-local
   ```

2. Create a virtual environment (recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   # or if using pip3
   pip3 install -r requirements.txt
   ```
   Note: When using a virtual environment, do not use the `--user` flag as it's incompatible with virtualenvs.

4. Set up environment variables:
   ```bash
   cp .env-example .env
   ```
   Then edit the `.env` file to add your OpenAI and/or Anthropic API keys.

## Running the Service

1. Start the FastAPI server:
   ```bash
   python app.py
   ```

2. The server will start at http://localhost:8000 by default.

3. You can access the API documentation at http://localhost:8000/docs

## API Endpoints

| Method | Endpoint                      | Description                  |
|--------|-------------------------------|------------------------------|
| POST   | /api/v1/run-task              | Start a new browser task     |
| GET    | /api/v1/task/{task_id}        | Get task details             |
| GET    | /api/v1/task/{task_id}/status | Get task status              |
| PUT    | /api/v1/stop-task/{task_id}   | Stop a running task          |
| PUT    | /api/v1/pause-task/{task_id}  | Pause a running task         |
| PUT    | /api/v1/resume-task/{task_id} | Resume a paused task         |
| GET    | /api/v1/list-tasks            | List all tasks               |

## Usage Examples

### Starting a Task

```bash
curl -X POST http://localhost:8000/api/v1/run-task \
  -H "Content-Type: application/json" \
  -d '{"task": "Go to google.com and search for n8n automation", "ai_provider": "openai"}'
```

### Checking Task Status

```bash
curl -X GET http://localhost:8000/api/v1/task/{task_id}/status
```

### Stopping a Task

```bash
curl -X PUT http://localhost:8000/api/v1/stop-task/{task_id}
```

## Configuration Options

You can configure the service by editing the `.env` file.  Available options are grouped below:

### API Configuration

- `PORT`: The port the service will run on (default: 8000).

### LLM Provider Configuration

#### OpenAI

- `OPENAI_API_KEY`: Your OpenAI API key.
- `OPENAI_MODEL_ID`: The model to use (e.g., `gpt-4o`).
- `OPENAI_BASE_URL`: Optional custom endpoint for OpenAI compatible APIs.

#### Anthropic

- `ANTHROPIC_API_KEY`: Your Anthropic API key.
- `ANTHROPIC_MODEL_ID`: The model to use (e.g., `claude-3-opus-20240229`).

#### MistralAI

- `MISTRAL_API_KEY`: Your MistralAI API key.
- `MISTRAL_MODEL_ID`: The model to use (e.g., `mistral-large-latest`).

#### Google AI

- `GOOGLE_API_KEY`: Your Google AI API key.
- `GOOGLE_MODEL_ID`: The model to use (e.g., `gemini-1.5-pro`).

#### Ollama

- `OLLAMA_API_BASE`: The base URL for your Ollama instance.
- `OLLAMA_MODEL_ID`: The model to use (e.g., `llama3`).

#### Azure OpenAI

- `AZURE_API_KEY`: Your Azure OpenAI API key.
- `AZURE_ENDPOINT`: Your Azure OpenAI endpoint URL.
- `AZURE_DEPLOYMENT_NAME`: Your deployment name.
- `AZURE_API_VERSION`: API version to use.

### Optional Configuration

- `LOG_LEVEL`: Logging level (default: `INFO`).
- `BROWSER_USE_HEADFUL`: Set to `"true"` to run the browser in headful mode (default: `false`, runs in headless mode).

## Troubleshooting

- **ImportError with browser-use**: Make sure you have installed the browser-use package and its dependencies correctly.
- **API Key Issues**: Verify that your API keys are correctly set in the `.env` file.
- **Port Conflicts**: If port 8000 is already in use, set a different port in the `.env` file.
- **Pip Install Errors**: If you see an error about `--user` installs not being visible in a virtualenv, make sure you're not using the `--user` flag with pip when inside a virtual environment.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Browser Use](https://github.com/browser-use/browser-use) - The underlying browser automation library
- [FastAPI](https://fastapi.tiangolo.com/) - The web framework used
- [n8n](https://n8n.io/) - The workflow automation platform this bridge is designed for # browser-n8n-local
