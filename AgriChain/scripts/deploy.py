from ape import accounts, project

# Admin account configuration
ADMIN_ALIAS = "admin_1"
ADMIN_PASSPHRASE = "IS355"

# Test account addresses (update with your MetaMask addresses)
FARMER_ADDR = "0x4253975Fd3f7acDDa95E73C6D5ce257322070b98"
INSPECTOR_ADDR = "0x28c92AF6F35c19cDf729CaB77A24f24D3DadB89C"
LOGISTICS_ADDR = "0x02972D92efB79e3c7BDa58cBAAC316493F328D5a"
RETAILER_ADDR = "0xa96ff1610e474ca054ba849c902141eba191d8ec"


def main():
    """Deploy AgriChain ERC721 contract and initialize roles"""
    print("=" * 60)
    print("AgriChain ERC721 Deployment Script")
    print("=" * 60)
    
    # 1. Load admin account
    try:
        admin = accounts.load(ADMIN_ALIAS)
        print(f"✅ Loaded admin account: {admin.address}")
    except Exception as e:
        print(f"❌ Error: Cannot load account '{ADMIN_ALIAS}': {e}")
        print("\n💡 To create admin account, run:")
        print(f"   ape accounts import {ADMIN_ALIAS}")
        return

    admin.set_autosign(True, passphrase=ADMIN_PASSPHRASE)

    # 2. Deploy AgriChain contract
    print("\n📦 Deploying AgriChain ERC721 contract...")
    try:
        agri = project.AgriChain.deploy(sender=admin)
        print("✅ DEPLOYMENT SUCCESSFUL")
        print(f"📍 Contract Address: {agri.address}")
        print(f"\n💡 Update frontend .env with:")
        print(f"   VITE_CONTRACT_ADDRESS={agri.address}")
    except Exception as e:
        print(f"❌ Deployment failed: {e}")
        return
    
    print("\n" + "=" * 60)

    # 3. Get role identifiers from contract
    print("\n🔑 Reading role identifiers...")
    farmer_role = agri.get_FARMER_ROLE()
    inspector_role = agri.get_INSPECTOR_ROLE()
    logistics_role = agri.get_LOGISTICS_ROLE()
    retailer_role = agri.get_RETAILER_ROLE()
    print("✅ Role identifiers retrieved")

    # 4. Grant roles to test accounts
    print("\n👥 Granting roles to test accounts...")
    
    roles_granted = 0
    if FARMER_ADDR:
        try:
            agri.grantRole(farmer_role, FARMER_ADDR, sender=admin)
            print(f"  ✅ FARMER_ROLE → {FARMER_ADDR}")
            roles_granted += 1
        except Exception as e:
            print(f"  ❌ Failed to grant FARMER_ROLE: {e}")

    if INSPECTOR_ADDR:
        try:
            agri.grantRole(inspector_role, INSPECTOR_ADDR, sender=admin)
            print(f"  ✅ INSPECTOR_ROLE → {INSPECTOR_ADDR}")
            roles_granted += 1
        except Exception as e:
            print(f"  ❌ Failed to grant INSPECTOR_ROLE: {e}")

    if LOGISTICS_ADDR:
        try:
            agri.grantRole(logistics_role, LOGISTICS_ADDR, sender=admin)
            print(f"  ✅ LOGISTICS_ROLE → {LOGISTICS_ADDR}")
            roles_granted += 1
        except Exception as e:
            print(f"  ❌ Failed to grant LOGISTICS_ROLE: {e}")

    if RETAILER_ADDR:
        try:
            agri.grantRole(retailer_role, RETAILER_ADDR, sender=admin)
            print(f"  ✅ RETAILER_ROLE → {RETAILER_ADDR}")
            roles_granted += 1
        except Exception as e:
            print(f"  ❌ Failed to grant RETAILER_ROLE: {e}")

    print(f"\n✅ Roles granted: {roles_granted}/4")
    
    # 5. Verify deployment
    print("\n" + "=" * 60)
    print("🔍 Verifying deployment...")
    try:
        token_counter = agri.tokenCounter()
        print(f"  ✅ Token Counter: {token_counter}")
        
        # Test role verification
        has_farmer = agri.hasRole(farmer_role, FARMER_ADDR)
        print(f"  ✅ Farmer role verified: {has_farmer}")
        
        # Display vault addresses (constants, not getter functions)
        print(f"  ℹ️  ARCHIVE_VAULT: 0x000000000000000000000000000000000000aaaa")
        print(f"  ℹ️  QUARANTINE_VAULT: 0x000000000000000000000000000000000000dEaD")
        
        print("\n✅ Contract deployed and initialized successfully!")
    except Exception as e:
        print(f"❌ Verification failed: {e}")
    
    print("=" * 60)
    print("\n🎉 Deployment complete!")
    print("\n📋 Next steps:")
    print("  1. Update frontend/.env with contract address")
    print("  2. Start frontend: cd frontend && npm run dev")
    print("  3. Connect MetaMask with one of the role addresses")
    print("=" * 60)