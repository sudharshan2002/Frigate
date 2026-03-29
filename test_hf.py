import sys
import os
from huggingface_hub import InferenceClient
from dotenv import load_dotenv

load_dotenv('backend/.env')
api_token = os.getenv('HF_TOKEN')

if not api_token:
    print("No HF_API_TOKEN found")
    sys.exit(1)

client = InferenceClient(api_key=api_token)

try:
    print("Testing Text Generation...")
    result = client.chat_completion(
        model="Qwen/Qwen2.5-7B-Instruct",
        messages=[{"role": "user", "content": "Hello"}],
        max_tokens=10
    )
    print(f"Success: {result.choices[0].message.content}")
except Exception as e:
    print(f"Text Error: {e}")

try:
    print("\nTesting Image Generation...")
    image = client.text_to_image("A futuristic city", model="black-forest-labs/FLUX.1-schnell")
    print(f"Success: Image object type {type(image)}")
except Exception as e:
    print(f"Image Error: {e}")
