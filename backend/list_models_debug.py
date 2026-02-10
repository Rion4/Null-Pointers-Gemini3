
import os
import sys
from dotenv import load_dotenv
from google.genai import Client

# Load env from current directory
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'))

api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    print("Error: GOOGLE_API_KEY not found in .env")
    sys.exit(1)

client = Client(api_key=api_key)

print("Listing available models...")
try:
    # adjusting for the library version in use, based on traceback it uses google.genai
    # models.list might be the method
    for m in client.models.list():
        if 'gemini' in m.name:
            print(f"- {m.name}")
except Exception as e:
    print(f"Error listing models: {e}")
