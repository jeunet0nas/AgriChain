#!/usr/bin/env python3
"""Extract ABI from compiled AgriChain contract"""

from ape import project
import json

def serialize_abi(abi_list):
    """Convert Ape ABI objects to JSON-serializable format"""
    result = []
    for item in abi_list:
        # Convert to dict and handle nested objects
        item_dict = {}
        for key, value in item:
            if isinstance(value, list):
                item_dict[key] = [dict(v) if hasattr(v, '__iter__') and not isinstance(v, str) else v for v in value]
            else:
                item_dict[key] = value
        result.append(item_dict)
    return result

if __name__ == "__main__":
    try:
        abi = project.AgriChain.contract_type.abi
        serialized = serialize_abi(abi)
        
        with open('abi_export.json', 'w', encoding='utf-8') as f:
            json.dump(serialized, f, indent=2)
        
        print(f"✅ ABI exported successfully: {len(serialized)} entries")
        print(f"📄 File: abi_export.json")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
