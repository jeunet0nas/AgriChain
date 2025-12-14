import pytest
from ape.exceptions import ContractLogicError


# ERC721: No batch transfers (each token is unique NFT)
# This file tests edge cases around multiple sequential transfers

def _full_flow_to_delivered(sc, farmer, inspector, logistics, retailer):
    """Helper: mint and progress to DELIVERED state"""
    sc.mintBatch("ipfs://cid/meta.json", sender=farmer)
    batch_id = sc.tokenCounter()
    sc.markBatchInspected(batch_id, "ipfs://cid/inspected.json", sender=inspector)
    sc.transferFrom(farmer, logistics, batch_id, sender=farmer)
    sc.transferFrom(logistics, retailer, batch_id, sender=logistics)
    return batch_id


# 1) Sequential transfers work correctly
def test_sequential_transfers_update_ownership(deployed_contract, farmer, inspector, logistics, retailer):
    sc = deployed_contract
    
    # Create multiple batches
    batch_ids = []
    for i in range(3):
        batch_id = _full_flow_to_delivered(sc, farmer, inspector, logistics, retailer)
        batch_ids.append(batch_id)
    
    # All batches owned by retailer
    for batch_id in batch_ids:
        assert sc.ownerOf(batch_id) == retailer.address
        assert sc.getBatchStatus(batch_id) == sc.get_DELIVERED_STATE()


# 2) Each batch has independent status tracking
def test_independent_batch_status(deployed_contract, admin, farmer, inspector, logistics, retailer):
    sc = deployed_contract
    
    # Batch 1: DELIVERED
    batch1 = _full_flow_to_delivered(sc, farmer, inspector, logistics, retailer)
    
    # Batch 2: IN_TRANSIT
    sc.mintBatch("ipfs://cid2", sender=farmer)
    batch2 = sc.tokenCounter()
    sc.markBatchInspected(batch2, "ipfs://cid2/inspected.json", sender=inspector)
    sc.transferFrom(farmer, logistics, batch2, sender=farmer)
    
    # Batch 3: RECALLED
    batch3 = _full_flow_to_delivered(sc, farmer, inspector, logistics, retailer)
    sc.markBatchRecalled(batch3, b"recall", sender=admin)
    
    # Check independent states
    assert sc.getBatchStatus(batch1) == sc.get_DELIVERED_STATE()
    assert sc.getBatchStatus(batch2) == sc.get_IN_TRANSIT_STATE()
    assert sc.getBatchStatus(batch3) == sc.get_RECALLED_STATE()


# 3) Farmer can own multiple batches simultaneously
def test_farmer_owns_multiple_batches(deployed_contract, farmer):
    sc = deployed_contract
    
    initial_balance = sc.balanceOf(farmer.address)
    
    # Mint 5 batches
    batch_ids = []
    for i in range(5):
        sc.mintBatch(f"ipfs://cid-{i}", sender=farmer)
        batch_ids.append(sc.tokenCounter())
    
    # Farmer balance increased by 5
    assert sc.balanceOf(farmer.address) == initial_balance + 5
    
    # Farmer owns all minted batches
    for batch_id in batch_ids:
        assert sc.ownerOf(batch_id) == farmer.address


# 4) Transfer doesn't affect other batches owned by same address
def test_transfer_one_batch_doesnt_affect_others(deployed_contract, farmer, inspector, logistics):
    sc = deployed_contract
    
    # Farmer mints and inspects 2 batches
    sc.mintBatch("ipfs://batch-a", sender=farmer)
    batch_a = sc.tokenCounter()
    sc.markBatchInspected(batch_a, "ipfs://batch-a/inspected.json", sender=inspector)
    
    sc.mintBatch("ipfs://batch-b", sender=farmer)
    batch_b = sc.tokenCounter()
    sc.markBatchInspected(batch_b, "ipfs://batch-b/inspected.json", sender=inspector)
    
    # Transfer only batch_a
    sc.transferFrom(farmer, logistics, batch_a, sender=farmer)
    
    # batch_a transferred, batch_b still with farmer
    assert sc.ownerOf(batch_a) == logistics.address
    assert sc.ownerOf(batch_b) == farmer.address
    assert sc.getBatchStatus(batch_a) == sc.get_IN_TRANSIT_STATE()
    assert sc.getBatchStatus(batch_b) == sc.get_INSPECTING_STATE()


# 5) Approval works independently for each batch
# Note: Actor-role enforcement requires msg.sender to have FARMER_ROLE
def test_approval_per_token(deployed_contract, admin, farmer, inspector, logistics):
    sc = deployed_contract
    
    # Grant FARMER_ROLE to inspector so they can act as farmer
    sc.grantRole(sc.get_FARMER_ROLE(), inspector, sender=admin)
    
    # Mint 2 batches
    sc.mintBatch("ipfs://a", sender=farmer)
    batch_a = sc.tokenCounter()
    sc.markBatchInspected(batch_a, "ipfs://a/inspected.json", sender=inspector)
    
    sc.mintBatch("ipfs://b", sender=farmer)
    batch_b = sc.tokenCounter()
    sc.markBatchInspected(batch_b, "ipfs://b/inspected.json", sender=inspector)
    
    # Farmer approves inspector for batch_a only
    sc.approve(inspector, batch_a, sender=farmer)
    
    # Inspector (with FARMER_ROLE) can transfer batch_a
    # Actor check: msg.sender (inspector) has FARMER_ROLE ✓
    sc.transferFrom(farmer, logistics, batch_a, sender=inspector)
    assert sc.ownerOf(batch_a) == logistics.address
    
    # Inspector cannot transfer batch_b (not approved)
    with pytest.raises(ContractLogicError, match="Not owner nor approved"):
        sc.transferFrom(farmer, logistics, batch_b, sender=inspector)


# 6) Operator approval works for all tokens
# Note: Actor-role enforcement requires msg.sender to have FARMER_ROLE
def test_operator_approval_all_tokens(deployed_contract, admin, farmer, inspector, logistics):
    sc = deployed_contract
    
    # Grant FARMER_ROLE to inspector so they can act as farmer
    sc.grantRole(sc.get_FARMER_ROLE(), inspector, sender=admin)
    
    # Mint 3 batches
    batch_ids = []
    for i in range(3):
        sc.mintBatch(f"ipfs://{i}", sender=farmer)
        batch_id = sc.tokenCounter()
        sc.markBatchInspected(batch_id, f"ipfs://{i}/inspected.json", sender=inspector)
        batch_ids.append(batch_id)
    
    # Farmer sets inspector as operator for all farmer's tokens
    sc.setApprovalForAll(inspector, True, sender=farmer)
    
    # Inspector (with FARMER_ROLE) can transfer all batches
    # Actor check: msg.sender (inspector) has FARMER_ROLE ✓
    for batch_id in batch_ids:
        sc.transferFrom(farmer, logistics, batch_id, sender=inspector)
        assert sc.ownerOf(batch_id) == logistics.address
