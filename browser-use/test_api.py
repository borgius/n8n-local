#!/usr/bin/env python3
"""
Simple test script to verify the Browser Use Bridge API is working correctly.
"""

import argparse
import json
import requests
import time
import sys

def test_api(base_url, task, ai_provider, headful):
    print(f"Testing Browser Use Bridge API at {base_url}")
    
    # 1. Start a task
    print("\n1. Starting a new task...")
    response = requests.post(
        f"{base_url}/api/v1/run-task",
        json={"task": task, "ai_provider": ai_provider, "headful": headful}
    )
    
    if response.status_code != 200:
        print(f"Error starting task: {response.status_code} {response.text}")
        sys.exit(1)
        
    task_data = response.json()
    task_id = task_data.get("id")
    print(f"Task started with ID: {task_id}")
    print(f"Initial status: {task_data.get('status')}")
    
    # 2. Poll for task status
    print("\n2. Polling for task status...")
    max_polls = 60  # Maximum number of status checks
    for i in range(max_polls):
        print(f"Checking status ({i+1}/{max_polls})...")
        response = requests.get(f"{base_url}/api/v1/task/{task_id}/status")
        
        if response.status_code != 200:
            print(f"Error checking status: {response.status_code} {response.text}")
            sys.exit(1)
            
        status_data = response.json()
        status = status_data.get("status")
        print(f"Current status: {status}")
        
        # If the task is completed or failed, break out of the loop
        if status in ["completed", "failed"]:
            break
            
        # Wait before checking again
        time.sleep(5)
    
    # 3. Get full task details
    print("\n3. Getting full task details...")
    response = requests.get(f"{base_url}/api/v1/task/{task_id}")
    
    if response.status_code != 200:
        print(f"Error getting task details: {response.status_code} {response.text}")
        sys.exit(1)
        
    task_details = response.json()
    print(json.dumps(task_details, indent=2))
    
    print("\nAPI test completed successfully!")
    return 0

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test the Browser Use Bridge API")
    parser.add_argument("--url", default="http://localhost:8000/api/v1", help="Base URL for the API")
    parser.add_argument("--task", default="Go to google.com and search for 'n8n automation'", help="Task to perform")
    parser.add_argument("--provider", default="openai", choices=["openai", "anthropic", "mistral", "google", "ollama", "azure"], help="AI provider to use")
    parser.add_argument("--headful", action="store_true", help="Run the browser in headful mode")
    args = parser.parse_args()
    sys.exit(test_api(args.url, args.task, args.provider, args.headful)) 