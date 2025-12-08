#!/usr/bin/env python3
"""Quick verification script for AgriChain deployment readiness"""

import os
import json
from pathlib import Path

def check_file(path, description):
    """Check if file exists"""
    exists = os.path.exists(path)
    status = "✅" if exists else "❌"
    print(f"{status} {description}: {path}")
    return exists

def check_env_file(path):
    """Check frontend .env configuration"""
    if not os.path.exists(path):
        print(f"❌ Missing: {path}")
        return False
    
    with open(path, 'r') as f:
        content = f.read()
    
    required_vars = [
        'VITE_RPC_URL',
        'VITE_CONTRACT_ADDRESS',
        'VITE_CHAIN_ID'
    ]
    
    missing = []
    for var in required_vars:
        if var not in content:
            missing.append(var)
    
    if missing:
        print(f"❌ Missing environment variables: {', '.join(missing)}")
        return False
    
    print(f"✅ Frontend .env configured")
    return True

def main():
    print("=" * 60)
    print("AgriChain Deployment Readiness Check")
    print("=" * 60)
    
    # Check contract files
    print("\n📄 Smart Contract Files:")
    contract_ok = check_file(
        "AgriChain/contracts/AgriChain.vy",
        "Contract source"
    )
    
    # Check deployment script
    print("\n🚀 Deployment Scripts:")
    deploy_ok = check_file(
        "AgriChain/scripts/deploy.py",
        "Deployment script"
    )
    
    # Check ABI
    print("\n📋 ABI Files:")
    abi_ok = check_file(
        "AgriChain/abi_cleaned.json",
        "Cleaned ABI"
    )
    
    # Check frontend files
    print("\n🎨 Frontend Files:")
    frontend_ok = True
    frontend_ok &= check_file(
        "frontend/src/web3/contractConfig.js",
        "Contract config"
    )
    frontend_ok &= check_file(
        "frontend/src/stores/useProductsStore.js",
        "Products store"
    )
    frontend_ok &= check_file(
        "frontend/src/stores/useProductSync.js",
        "Product sync"
    )
    
    # Check environment
    print("\n⚙️  Environment Configuration:")
    env_ok = check_env_file("frontend/.env")
    
    # Check tests
    print("\n🧪 Test Suite:")
    test_files = [
        "AgriChain/tests/test_01_roles_and_register.py",
        "AgriChain/tests/test_02_transfer.py",
        "AgriChain/tests/test_03_retail_process.py",
        "AgriChain/tests/test_04_recall_and_quarantine.py",
        "AgriChain/tests/test_05_batch_transfers.py",
        "AgriChain/tests/test_06_events_and_views.py",
        "AgriChain/tests/test_07_receiver_checks.py",
        "AgriChain/tests/test_08_negative_edges.py",
        "AgriChain/tests/test_09_smoke_e2e.py",
    ]
    
    tests_ok = all(check_file(f, f"Test {i+1}/9") for i, f in enumerate(test_files))
    
    # Summary
    print("\n" + "=" * 60)
    print("Summary:")
    print("=" * 60)
    
    all_checks = [
        ("Smart Contract", contract_ok),
        ("Deployment Script", deploy_ok),
        ("ABI Generated", abi_ok),
        ("Frontend Files", frontend_ok),
        ("Environment Config", env_ok),
        ("Test Suite", tests_ok),
    ]
    
    for name, status in all_checks:
        status_icon = "✅" if status else "❌"
        print(f"{status_icon} {name}")
    
    if all(status for _, status in all_checks):
        print("\n🎉 All checks passed! Ready for deployment.")
        print("\nNext steps:")
        print("  1. Start local blockchain: ape networks run ethereum:local:test")
        print("  2. Deploy contract: cd AgriChain && ape run scripts/deploy.py")
        print("  3. Update frontend .env with deployed address")
        print("  4. Start frontend: cd frontend && npm run dev")
    else:
        print("\n⚠️  Some checks failed. Fix issues above before deploying.")
    
    print("=" * 60)

if __name__ == "__main__":
    main()
