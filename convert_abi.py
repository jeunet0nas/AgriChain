import json

# Load ABI from JSON
with open('AgriChain/abi_export.json', 'r') as f:
    abi = json.load(f)

# Remove null fields for cleaner output
def clean_abi_entry(entry):
    if isinstance(entry, dict):
        return {k: clean_abi_entry(v) for k, v in entry.items() if v is not None}
    elif isinstance(entry, list):
        return [clean_abi_entry(item) for item in entry]
    return entry

clean_abi = clean_abi_entry(abi)

# Generate JavaScript export
js_code = "export const CONTRACT_ABI = " + json.dumps(clean_abi, indent=2) + ";\n"

# Save to frontend
with open('frontend/src/web3/contractConfig.js', 'r') as f:
    config_content = f.read()

# Find and replace CONTRACT_ABI
import re

# Match the entire CONTRACT_ABI array definition
pattern = r'export const CONTRACT_ABI = \[[\s\S]*?\];\n'
new_abi_def = "export const CONTRACT_ABI = " + json.dumps(clean_abi, indent=2) + ";\n"

updated_content = re.sub(pattern, new_abi_def, config_content)

# Write back
with open('frontend/src/web3/contractConfig.js', 'w') as f:
    f.write(updated_content)

print(f"✅ Updated contractConfig.js with {len(clean_abi)} ABI entries")
print(f"ABI function count: {len([e for e in clean_abi if e.get('type') == 'function'])}")
print(f"ABI event count: {len([e for e in clean_abi if e.get('type') == 'event'])}")
