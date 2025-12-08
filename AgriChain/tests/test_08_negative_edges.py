import pytest
from ape.exceptions import ContractLogicError


# Negative/edge case tests

def test_cannot_mint_without_farmer_role(contract, admin, logistics):
    """Non-farmer cannot mint batches"""
    with pytest.raises(ContractLogicError, match="Missing required role"):
        contract.mintBatch("ipfs://test", sender=logistics)


def test_cannot_inspect_nonexistent_batch(deployed_contract, inspector):
    """Cannot inspect batch that doesn't exist"""
    with pytest.raises(ContractLogicError, match="Unknown batch"):
        deployed_contract.markBatchInspected(999, sender=inspector)


def test_cannot_transfer_nonexistent_batch(deployed_contract, farmer, logistics):
    """Cannot transfer batch that doesn't exist"""
    with pytest.raises(ContractLogicError):
        deployed_contract.transferFrom(farmer, logistics, 999, sender=farmer)


def test_owner_of_nonexistent_reverts(deployed_contract):
    """ownerOf non-existent token reverts"""
    with pytest.raises(ContractLogicError, match="Token does not exist"):
        deployed_contract.ownerOf(999)


def test_token_uri_nonexistent_reverts(deployed_contract):
    """tokenURI for non-existent token reverts"""
    with pytest.raises(ContractLogicError, match="Unknown batch"):
        deployed_contract.tokenURI(999)


def test_cannot_approve_token_you_dont_own(deployed_contract, farmer, inspector, logistics):
    """Cannot approve transfer for token you don't own"""
    sc = deployed_contract
    sc.mintBatch("ipfs://test", sender=farmer)
    batch_id = sc.tokenCounter()
    
    # Logistics tries to approve inspector for farmer's token
    with pytest.raises(ContractLogicError, match="Not owner nor operator"):
        sc.approve(inspector, batch_id, sender=logistics)


def test_cannot_approve_to_current_owner(deployed_contract, farmer):
    """Cannot approve current owner"""
    sc = deployed_contract
    sc.mintBatch("ipfs://test", sender=farmer)
    batch_id = sc.tokenCounter()
    
    with pytest.raises(ContractLogicError, match="Approval to current owner"):
        sc.approve(farmer, batch_id, sender=farmer)


def test_cannot_set_approval_for_self(deployed_contract, farmer):
    """Cannot set yourself as operator"""
    with pytest.raises(ContractLogicError, match="Approve to caller"):
        deployed_contract.setApprovalForAll(farmer, True, sender=farmer)


def test_recall_nonexistent_batch_reverts(deployed_contract, admin):
    """Cannot recall non-existent batch"""
    with pytest.raises(ContractLogicError, match="Unknown batch"):
        deployed_contract.markBatchRecalled(999, b"test", sender=admin)


def test_advance_retail_nonexistent_reverts(deployed_contract, retailer):
    """Cannot advance retail status of non-existent batch"""
    with pytest.raises(ContractLogicError):
        deployed_contract.advanceBatchRetailStatus(999, sender=retailer)


def test_update_uri_nonexistent_reverts(deployed_contract, inspector):
    """Cannot update URI of non-existent batch"""
    with pytest.raises(ContractLogicError, match="Unknown batch"):
        deployed_contract.updateBatchURI(999, "ipfs://new", sender=inspector)


def test_update_uri_requires_inspector_role(deployed_contract, farmer, inspector):
    """Only inspector can update batch URI"""
    sc = deployed_contract
    sc.mintBatch("ipfs://test", sender=farmer)
    batch_id = sc.tokenCounter()
    
    # Farmer cannot update URI
    with pytest.raises(ContractLogicError, match="Missing required role"):
        sc.updateBatchURI(batch_id, "ipfs://new", sender=farmer)
    
    # Inspector can update URI
    sc.updateBatchURI(batch_id, "ipfs://new", sender=inspector)
    assert sc.tokenURI(batch_id) == "ipfs://new"


def test_balance_of_zero_address_reverts(deployed_contract):
    """balanceOf zero address should revert"""
    ZERO = "0x0000000000000000000000000000000000000000"
    with pytest.raises(ContractLogicError, match="Zero address"):
        deployed_contract.balanceOf(ZERO)


def test_transfer_from_wrong_owner_reverts(deployed_contract, farmer, inspector, logistics):
    """Cannot transfer from address that doesn't own the token"""
    sc = deployed_contract
    sc.mintBatch("ipfs://test", sender=farmer)
    batch_id = sc.tokenCounter()
    sc.markBatchInspected(batch_id, sender=inspector)
    
    # Logistics tries to transfer from farmer without approval
    with pytest.raises(ContractLogicError, match="Not owner nor approved"):
        sc.transferFrom(farmer, logistics, batch_id, sender=logistics)


def test_cleared_approval_after_transfer(deployed_contract, farmer, inspector, logistics):
    """Approval is cleared after transfer"""
    sc = deployed_contract
    sc.mintBatch("ipfs://test", sender=farmer)
    batch_id = sc.tokenCounter()
    sc.markBatchInspected(batch_id, sender=inspector)
    
    # Approve inspector
    sc.approve(inspector, batch_id, sender=farmer)
    assert sc.getApproved(batch_id) == inspector.address
    
    # Transfer clears approval
    sc.transferFrom(farmer, logistics, batch_id, sender=farmer)
    
    # Approval is now zero address
    approved = sc.getApproved(batch_id)
    ZERO = "0x0000000000000000000000000000000000000000"
    assert approved == ZERO


def test_operator_approval_persists_after_transfer(deployed_contract, farmer, inspector, logistics, retailer):
    """Operator approval is per-owner, not per-token"""
    sc = deployed_contract
    
    # Farmer mints 2 batches
    sc.mintBatch("ipfs://a", sender=farmer)
    batch_a = sc.tokenCounter()
    sc.markBatchInspected(batch_a, sender=inspector)
    
    sc.mintBatch("ipfs://b", sender=farmer)
    batch_b = sc.tokenCounter()
    sc.markBatchInspected(batch_b, sender=inspector)
    
    # Farmer sets inspector as operator
    sc.setApprovalForAll(inspector, True, sender=farmer)
    
    # Inspector transfers batch_a
    sc.transferFrom(farmer, logistics, batch_a, sender=inspector)
    
    # Inspector still operator for farmer's remaining tokens
    assert sc.isApprovedForAll(farmer, inspector) is True
    
    # Can still transfer batch_b
    sc.transferFrom(farmer, logistics, batch_b, sender=inspector)
    assert sc.ownerOf(batch_b) == logistics.address
