#!/usr/bin/env python3
"""Clean ABI for frontend - remove null fields and format for JavaScript"""

import json

def clean_abi_item(item):
    """Recursively clean an ABI item"""
    if isinstance(item, dict):
        cleaned = {}
        for key, value in item.items():
            # Skip null/None values and internal fields
            if value is None or key in ['components', 'internal_type']:
                continue
            # Recursively clean nested items
            if isinstance(value, (dict, list)):
                cleaned[key] = clean_abi_item(value)
            else:
                cleaned[key] = value
        return cleaned
    elif isinstance(item, list):
        return [clean_abi_item(v) for v in item]
    else:
        return item

if __name__ == "__main__":
    with open('abi_export.json', 'r', encoding='utf-8') as f:
        abi = json.load(f)
    
    cleaned = clean_abi_item(abi)
    
    with open('abi_cleaned.json', 'w', encoding='utf-8') as f:
        json.dump(cleaned, f, indent=2)
    
    print(f"✅ Cleaned ABI: {len(cleaned)} entries")
    print(f"📄 Output: abi_cleaned.json")
    
    # Generate JavaScript format
    js_content = f"export const CONTRACT_ABI = {json.dumps(cleaned, indent=2)};\n"
    with open('abi_for_frontend.js', 'w', encoding='utf-8') as f:
        f.write(js_content)
    
    print(f"📄 JavaScript format: abi_for_frontend.js")
