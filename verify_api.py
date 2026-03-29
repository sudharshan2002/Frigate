import requests
import json

url = "http://127.0.0.1:8000/api/generate"
payload = {
    "prompt": "A futuristic Frigate workspace with glassmorphism and neon lime accents",
    "mode": "image"
}
headers = {"Content-Type": "application/json"}

try:
    response = requests.post(url, json=payload, headers=headers, timeout=90)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Provider: {data.get('provider')}")
        output = data.get('output', '')
        if output.startswith('data:image'):
            print(f"Success: Received Image Data URL (Length: {len(output)})")
        else:
            print(f"Warning: Output is not a data URL: {output[:100]}...")
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Exception: {e}")
