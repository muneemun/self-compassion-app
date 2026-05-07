import json
import os

log_path = "/Users/muneemun/.gemini/antigravity/brain/435dd9fb-6d9a-4683-a4d8-92c8813023c8/.system_generated/logs/overview.txt"

def extract_code():
    targets = [3162, 3091, 3149, 3172] # Added 3172 which is the fix
    results = {}
    with open(log_path, 'r') as f:
        for line in f:
            for t in targets:
                if f'"step_index":{t}' in line:
                    data = json.loads(line)
                    results[t] = data
    
    with open("extracted_steps.json", 'w') as out:
        json.dump(results, out, indent=2)
    print(f"Extracted steps: {list(results.keys())}")

extract_code()
