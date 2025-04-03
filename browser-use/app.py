from __future__ import annotations

import asyncio
import json
import logging
import os
import uuid
from typing import Dict, List, Optional, Union, Any
from datetime import datetime
from enum import Enum

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.encoders import jsonable_encoder
from langchain_anthropic import ChatAnthropic
from langchain_mistralai import ChatMistralAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_ollama import ChatOllama
from langchain_openai import AzureChatOpenAI, ChatOpenAI
from pydantic import BaseModel, Field

# This import will work once browser-use is installed
# For development, you may need to add the browser-use repo to your PYTHONPATH
from browser_use import Agent
from browser_use.agent.views import AgentHistoryList
from browser_use import BrowserConfig, Browser

# Define task status enum
class TaskStatus(str, Enum):
    CREATED = "created"  # Task is initialized but not yet started
    RUNNING = "running"  # Task is currently executing
    FINISHED = "finished"  # Task has completed successfully
    STOPPED = "stopped"  # Task was manually stopped
    PAUSED = "paused"  # Task execution is temporarily paused
    FAILED = "failed"  # Task encountered an error and could not complete
    STOPPING = "stopping"  # Task is in the process of stopping (transitional state)

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("browser-use-bridge")

app = FastAPI(title="Browser Use Bridge API")

# Custom JSON encoder for Enum serialization
class EnumJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Enum):
            return obj.value
        return super().default(obj)

# Configure FastAPI to use custom JSON serialization for responses
@app.middleware("http")
async def add_json_serialization(request: Request, call_next):
    response = await call_next(request)
    
    # Only attempt to modify JSON responses and check if body() method exists
    if response.headers.get("content-type") == "application/json" and hasattr(response, "body"):
        try:
            content = await response.body()
            content_str = content.decode("utf-8")
            content_dict = json.loads(content_str)
            # Convert any Enum values to their string representation
            content_str = json.dumps(content_dict, cls=EnumJSONEncoder)
            response = Response(
                content=content_str, 
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type="application/json"
            )
        except Exception as e:
            logger.error(f"Error serializing JSON response: {str(e)}")
    
    return response

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Task storage - in memory for now
tasks: Dict[str, Dict] = {}

# Models
class TaskRequest(BaseModel):
    task: str
    ai_provider: Optional[str] = "openai"  # Default to OpenAI
    save_browser_data: Optional[bool] = False  # Whether to save browser cookies
    headful: Optional[bool] = None  # Override BROWSER_USE_HEADFUL setting
    use_custom_chrome: Optional[bool] = None  # Whether to use custom Chrome from env vars

class TaskResponse(BaseModel):
    id: str
    status: str
    live_url: str
    
class TaskStatusResponse(BaseModel):
    status: str
    result: Optional[str] = None
    error: Optional[str] = None

# Utility functions
def get_llm(ai_provider: str):
    """Get LLM based on provider"""
    if ai_provider == "anthropic":
        return ChatAnthropic(model=os.environ.get("ANTHROPIC_MODEL_ID", "claude-3-opus-20240229"))
    elif ai_provider == "mistral":
        return ChatMistralAI(model=os.environ.get("MISTRAL_MODEL_ID", "mistral-large-latest"))
    elif ai_provider == "google":
        return ChatGoogleGenerativeAI(model=os.environ.get("GOOGLE_MODEL_ID", "gemini-1.5-pro"))
    elif ai_provider == "ollama":
        return ChatOllama(model=os.environ.get("OLLAMA_MODEL_ID", "llama3"))
    elif ai_provider == "azure":
        return AzureChatOpenAI(
            azure_deployment=os.environ.get("AZURE_DEPLOYMENT_NAME"),
            openai_api_version=os.environ.get("AZURE_API_VERSION", "2023-05-15"),
            azure_endpoint=os.environ.get("AZURE_ENDPOINT")
        )
    else:  # default to OpenAI
        base_url = os.environ.get("OPENAI_BASE_URL")
        kwargs = {"model": os.environ.get("OPENAI_MODEL_ID", "gpt-4o")}
        if base_url:
            kwargs["base_url"] = base_url
        return ChatOpenAI(**kwargs)

async def execute_task(task_id: str, instruction: str, ai_provider: str):
    """Execute browser task in background
    
    Chrome paths (CHROME_PATH and CHROME_USER_DATA) are only sourced from 
    environment variables for security reasons.
    """
    # Initialize browser variable outside the try block
    browser = None
    try:
        # Update task status
        tasks[task_id]["status"] = TaskStatus.RUNNING
        
        # Get LLM
        llm = get_llm(ai_provider)
        
        # Get task-specific browser configuration if available
        task_browser_config = tasks[task_id].get("browser_config", {})
        
        # Configure browser headless/headful mode (task setting overrides env var)
        task_headful = task_browser_config.get("headful")
        if task_headful is not None:
            headful = task_headful
        else:
            headful = os.environ.get("BROWSER_USE_HEADFUL", "false").lower() == "true"
        
        # Get Chrome path and user data directory (task settings override env vars)
        use_custom_chrome = task_browser_config.get("use_custom_chrome")
        
        if use_custom_chrome is False:
            # Explicitly disabled custom Chrome for this task
            chrome_path = None
            chrome_user_data = None
        else:
            # Only use environment variables for Chrome paths
            chrome_path = os.environ.get("CHROME_PATH")
            chrome_user_data = os.environ.get("CHROME_USER_DATA")
        
        # Configure agent options - start with basic configuration
        agent_kwargs = {
            "task": instruction,
            "llm": llm,
        }
        
        # Only configure and include browser if we need a custom browser setup
        if not headful or chrome_path:
            extra_chromium_args = []
            # Configure browser
            browser_config_args = {
                "headless": not headful,
            }
            # For older Chrome versions
            extra_chromium_args += ["--headless=new"]
            logger.info(f"Task {task_id}: Browser config args: {browser_config_args.get('headless')}")
            # Add Chrome executable path if provided
            if chrome_path:
                browser_config_args["chrome_instance_path"] = chrome_path
                logger.info(f"Task {task_id}: Using custom Chrome executable: {chrome_path}")
                
            
            # Add Chrome user data directory if provided
            if chrome_user_data:
                extra_chromium_args += [f"--user-data-dir={chrome_user_data}"]
                logger.info(f"Task {task_id}: Using Chrome user data directory: {chrome_user_data}")
            
            browser_config = BrowserConfig(**browser_config_args)
            browser = Browser(config=browser_config)
            
            # Add browser to agent kwargs
            agent_kwargs["browser"] = browser
        
        logger.info(f"Agent kwargs: {agent_kwargs}")
        # Pass the browser to Agent
        agent = Agent(**agent_kwargs)
        
        # Store agent in tasks
        tasks[task_id]["agent"] = agent
        
        # Create a step tracking callback
        async def step_callback(step_data):
            step_id = str(uuid.uuid4())
            step_num = len(tasks[task_id]["steps"]) + 1
            
            step = {
                "id": step_id,
                "step": step_num,
                "evaluation_previous_goal": step_data.get("evaluation", ""),
                "next_goal": step_data.get("goal", "")
            }
            
            tasks[task_id]["steps"].append(step)
        
        # Add callback to agent if available in this version
        if hasattr(agent, "add_callback"):
            agent.add_callback("on_step", step_callback)
        
        # Run agent
        result = await agent.run()
        
        # Update finished timestamp
        tasks[task_id]["finished_at"] = datetime.utcnow().isoformat() + "Z"
        
        # Update task status
        tasks[task_id]["status"] = TaskStatus.FINISHED
        
        # Extract result
        if isinstance(result, AgentHistoryList):
            final_result = result.final_result()
            tasks[task_id]["output"] = final_result
        else:
            tasks[task_id]["output"] = str(result)
        
        # Collect browser data if requested
        if tasks[task_id]["save_browser_data"] and hasattr(agent, "browser"):
            try:
                # Try multiple approaches to collect browser data
                if hasattr(agent.browser, "get_cookies"):
                    # Direct method if available
                    cookies = await agent.browser.get_cookies()
                    tasks[task_id]["browser_data"] = {"cookies": cookies}
                elif hasattr(agent.browser, "page") and hasattr(agent.browser.page, "cookies"):
                    # Try Playwright's page.cookies() method
                    cookies = await agent.browser.page.cookies()
                    tasks[task_id]["browser_data"] = {"cookies": cookies}
                elif hasattr(agent.browser, "context") and hasattr(agent.browser.context, "cookies"):
                    # Try Playwright's context.cookies() method
                    cookies = await agent.browser.context.cookies()
                    tasks[task_id]["browser_data"] = {"cookies": cookies}
                else:
                    logger.warning(f"No known method to collect cookies for task {task_id}")
                    tasks[task_id]["browser_data"] = {"cookies": [], "error": "No method available to collect cookies"}
            except Exception as e:
                logger.error(f"Failed to collect browser data: {str(e)}")
                tasks[task_id]["browser_data"] = {"cookies": [], "error": str(e)}
                
    except Exception as e:
        logger.exception(f"Error executing task {task_id}")
        tasks[task_id]["status"] = TaskStatus.FAILED
        tasks[task_id]["error"] = str(e)
        tasks[task_id]["finished_at"] = datetime.utcnow().isoformat() + "Z"
    finally:
        # Always close the browser, regardless of success or failure
        if browser is not None:
            logger.info(f"Closing browser for task {task_id}")
            try:
                await browser.close()
                logger.info(f"Browser closed successfully for task {task_id}")
            except Exception as e:
                logger.error(f"Error closing browser for task {task_id}: {str(e)}")

# API Routes
@app.post("/api/v1/run-task", response_model=TaskResponse)
async def run_task(request: TaskRequest):
    """Start a browser automation task"""
    task_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat() + "Z"
    
    # Initialize task record
    tasks[task_id] = {
        "id": task_id,
        "task": request.task,
        "ai_provider": request.ai_provider,
        "status": TaskStatus.CREATED,
        "created_at": now,
        "finished_at": None,
        "output": None,  # Final result
        "error": None,
        "steps": [],  # Will store step information
        "agent": None,
        "save_browser_data": request.save_browser_data,
        "browser_data": None,  # Will store browser cookies if requested
        # Store browser configuration options
        "browser_config": {
            "headful": request.headful,
            "use_custom_chrome": request.use_custom_chrome,
        }
    }
    
    # Generate live URL
    live_url = f"/live/{task_id}"
    tasks[task_id]["live_url"] = live_url
    
    # Start task in background
    asyncio.create_task(execute_task(task_id, request.task, request.ai_provider))
    
    return TaskResponse(
        id=task_id,
        status=TaskStatus.CREATED,
        live_url=live_url
    )

@app.get("/api/v1/task/{task_id}/status", response_model=TaskStatusResponse)
async def get_task_status(task_id: str):
    """Get status of a task"""
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return TaskStatusResponse(
        status=tasks[task_id]["status"],
        result=tasks[task_id].get("output"),
        error=tasks[task_id].get("error")
    )

@app.get("/api/v1/task/{task_id}", response_model=dict)
async def get_task(task_id: str):
    """Get full task details"""
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Return task data excluding agent object
    task_data = {k: v for k, v in tasks[task_id].items() if k != "agent"}
    return task_data

@app.put("/api/v1/stop-task/{task_id}")
async def stop_task(task_id: str):
    """Stop a running task"""
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if tasks[task_id]["status"] in [TaskStatus.FINISHED, TaskStatus.FAILED, TaskStatus.STOPPED]:
        return {"message": f"Task already in terminal state: {tasks[task_id]['status']}"}
    
    # Get agent
    agent = tasks[task_id].get("agent")
    if agent:
        # Call agent's stop method
        agent.stop()
        tasks[task_id]["status"] = TaskStatus.STOPPING
        return {"message": "Task stopping"}
    else:
        tasks[task_id]["status"] = TaskStatus.STOPPED
        tasks[task_id]["finished_at"] = datetime.utcnow().isoformat() + "Z"
        return {"message": "Task stopped (no agent found)"}

@app.put("/api/v1/pause-task/{task_id}")
async def pause_task(task_id: str):
    """Pause a running task"""
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if tasks[task_id]["status"] != TaskStatus.RUNNING:
        return {"message": f"Task not running: {tasks[task_id]['status']}"}
    
    # Get agent
    agent = tasks[task_id].get("agent")
    if agent:
        # Call agent's pause method
        agent.pause()
        tasks[task_id]["status"] = TaskStatus.PAUSED
        return {"message": "Task paused"}
    else:
        return {"message": "Task could not be paused (no agent found)"}

@app.put("/api/v1/resume-task/{task_id}")
async def resume_task(task_id: str):
    """Resume a paused task"""
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if tasks[task_id]["status"] != TaskStatus.PAUSED:
        return {"message": f"Task not paused: {tasks[task_id]['status']}"}
    
    # Get agent
    agent = tasks[task_id].get("agent")
    if agent:
        # Call agent's resume method
        agent.resume()
        tasks[task_id]["status"] = TaskStatus.RUNNING
        return {"message": "Task resumed"}
    else:
        return {"message": "Task could not be resumed (no agent found)"}

@app.get("/api/v1/list-tasks")
async def list_tasks():
    """List all tasks"""
    task_list = []
    for task_id, task_data in tasks.items():
        # Return task data excluding agent object
        task_summary = {
            "id": task_data["id"],
            "status": task_data["status"],
            "task": task_data.get("task", ""),
            "created_at": task_data.get("created_at", ""),
            "finished_at": task_data.get("finished_at"),
            "live_url": task_data.get("live_url", f"/live/{task_id}")
        }
        task_list.append(task_summary)
    
    return {
        "tasks": task_list,
        "total": len(task_list),
        "page": 1,
        "per_page": 100
    }

@app.get("/live/{task_id}", response_class=HTMLResponse)
async def live_view(task_id: str):
    """Get a live view of a task that can be embedded in an iframe"""
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Browser Use Task {task_id}</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; }}
            .container {{ max-width: 1200px; margin: 0 auto; }}
            .status {{ padding: 10px; border-radius: 4px; margin-bottom: 20px; }}
            .{TaskStatus.RUNNING} {{ background-color: #e3f2fd; }}
            .{TaskStatus.FINISHED} {{ background-color: #e8f5e9; }}
            .{TaskStatus.FAILED} {{ background-color: #ffebee; }}
            .{TaskStatus.PAUSED} {{ background-color: #fff8e1; }}
            .{TaskStatus.STOPPED} {{ background-color: #eeeeee; }}
            .{TaskStatus.CREATED} {{ background-color: #f3e5f5; }}
            .{TaskStatus.STOPPING} {{ background-color: #fce4ec; }}
            .controls {{ margin-bottom: 20px; }}
            button {{ padding: 8px 16px; margin-right: 10px; cursor: pointer; }}
            pre {{ background-color: #f5f5f5; padding: 15px; border-radius: 4px; overflow: auto; }}
            .step {{ margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Browser Use Task</h1>
            <div id="status" class="status">Loading...</div>
            
            <div class="controls">
                <button id="pauseBtn">Pause</button>
                <button id="resumeBtn">Resume</button>
                <button id="stopBtn">Stop</button>
            </div>
            
            <h2>Result</h2>
            <pre id="result">Loading...</pre>
            
            <h2>Steps</h2>
            <div id="steps">Loading...</div>
            
            <script>
                const taskId = '{task_id}';
                const FINISHED = '{TaskStatus.FINISHED}';
                const FAILED = '{TaskStatus.FAILED}';
                const STOPPED = '{TaskStatus.STOPPED}';
                
                // Update status function
                function updateStatus() {{
                    fetch(`/api/v1/task/${{taskId}}/status`)
                        .then(response => response.json())
                        .then(data => {{
                            // Update status element
                            const statusEl = document.getElementById('status');
                            statusEl.textContent = `Status: ${{data.status}}`;
                            statusEl.className = `status ${{data.status}}`;
                            
                            // Update result if available
                            if (data.result) {{
                                document.getElementById('result').textContent = data.result;
                            }} else if (data.error) {{
                                document.getElementById('result').textContent = `Error: ${{data.error}}`;
                            }}
                            
                            // Continue polling if not in terminal state
                            if (![FINISHED, FAILED, STOPPED].includes(data.status)) {{
                                setTimeout(updateStatus, 2000);
                            }}
                        }})
                        .catch(error => {{
                            console.error('Error fetching status:', error);
                            setTimeout(updateStatus, 5000);
                        }});
                        
                    // Also fetch full task to get steps
                    fetch(`/api/v1/task/${{taskId}}`)
                        .then(response => response.json())
                        .then(data => {{
                            if (data.steps && data.steps.length > 0) {{
                                const stepsHtml = data.steps.map(step => `
                                    <div class="step">
                                        <strong>Step ${{step.step}}</strong>
                                        <p>Next Goal: ${{step.next_goal || 'N/A'}}</p>
                                        <p>Evaluation: ${{step.evaluation_previous_goal || 'N/A'}}</p>
                                    </div>
                                `).join('');
                                document.getElementById('steps').innerHTML = stepsHtml;
                            }} else {{
                                document.getElementById('steps').textContent = 'No steps recorded yet.';
                            }}
                        }})
                        .catch(error => {{
                            console.error('Error fetching task details:', error);
                        }});
                }}
                
                // Setup control buttons
                document.getElementById('pauseBtn').addEventListener('click', () => {{
                    fetch(`/api/v1/pause-task/${{taskId}}`, {{ method: 'PUT' }})
                        .then(response => response.json())
                        .then(data => alert(data.message))
                        .catch(error => console.error('Error pausing task:', error));
                }});
                
                document.getElementById('resumeBtn').addEventListener('click', () => {{
                    fetch(`/api/v1/resume-task/${{taskId}}`, {{ method: 'PUT' }})
                        .then(response => response.json())
                        .then(data => alert(data.message))
                        .catch(error => console.error('Error resuming task:', error));
                }});
                
                document.getElementById('stopBtn').addEventListener('click', () => {{
                    if (confirm('Are you sure you want to stop this task? This action cannot be undone.')) {{
                        fetch(`/api/v1/stop-task/${{taskId}}`, {{ method: 'PUT' }})
                            .then(response => response.json())
                            .then(data => alert(data.message))
                            .catch(error => console.error('Error stopping task:', error));
                    }}
                }});
                
                // Start status updates
                updateStatus();
                
                // Refresh every 5 seconds
                setInterval(updateStatus, 5000);
            </script>
        </div>
    </body>
    </html>
    """
    
    return HTMLResponse(content=html_content)

@app.get("/api/v1/ping")
async def ping():
    """Health check endpoint"""
    return {"status": "success", "message": "API is running"}

@app.get("/api/v1/browser-config")
async def browser_config():
    """Get current browser configuration
    
    Note: Chrome paths (CHROME_PATH and CHROME_USER_DATA) can only be set via
    environment variables for security reasons and cannot be overridden in task requests.
    """
    headful = os.environ.get("BROWSER_USE_HEADFUL", "false").lower() == "true"
    chrome_path = os.environ.get("CHROME_PATH", None)
    chrome_user_data = os.environ.get("CHROME_USER_DATA", None)
    
    return {
        "headful": headful,
        "headless": not headful,
        "chrome_path": chrome_path,
        "chrome_user_data": chrome_user_data,
        "using_custom_chrome": chrome_path is not None,
        "using_user_data": chrome_user_data is not None
    }

# Run server if executed directly
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port) 
