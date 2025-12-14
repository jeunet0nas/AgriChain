import pytest
from ape.exceptions import ContractLogicError


def _mint_attest_and_to_retailer(sc, farmer, inspector, logistics, retailer):
    """Full flow: mint -> inspect -> logistics -> retailer (DELIVERED)"""
    sc.mintBatch("ipfs://cid-demo/meta.json", sender=farmer)
    batch_id = sc.tokenCounter()

    sc.markBatchInspected(batch_id, "ipfs://cid-demo/inspected.json", sender=inspector)
    sc.transferFrom(farmer, logistics, batch_id, sender=farmer)
    sc.transferFrom(logistics, retailer, batch_id, sender=logistics)

    return batch_id


# 1) RETAILER: DELIVERED -> RETAILED (advanceBatchRetailStatus)
def test_retailer_advance_to_retailed(deployed_contract, farmer, inspector, logistics, retailer):
    sc = deployed_contract
    batch_id = _mint_attest_and_to_retailer(sc, farmer, inspector, logistics, retailer)

    assert sc.ownerOf(batch_id) == retailer.address
    assert sc.getBatchStatus(batch_id) == sc.get_DELIVERED_STATE()

    sc.advanceBatchRetailStatus(batch_id, sender=retailer)
    assert sc.getBatchStatus(batch_id) == sc.get_RETAILED_STATE()


# 2) RETAILER: RETAILED -> CONSUMED (advanceBatchRetailStatus again)
def test_retailer_advance_to_consumed(deployed_contract, farmer, inspector, logistics, retailer):
    sc = deployed_contract
    batch_id = _mint_attest_and_to_retailer(sc, farmer, inspector, logistics, retailer)

    sc.advanceBatchRetailStatus(batch_id, sender=retailer)
    assert sc.getBatchStatus(batch_id) == sc.get_RETAILED_STATE()

    sc.advanceBatchRetailStatus(batch_id, sender=retailer)
    assert sc.getBatchStatus(batch_id) == sc.get_CONSUMED_STATE()


# 3) Only RETAILER holder can call advanceBatchRetailStatus
def test_only_retailer_holder_can_advance(deployed_contract, admin, farmer, inspector, logistics, retailer, consumer):
    sc = deployed_contract
    batch_id = _mint_attest_and_to_retailer(sc, farmer, inspector, logistics, retailer)

    # Farmer cannot advance (no role)
    with pytest.raises(ContractLogicError, match="Missing required role"):
        sc.advanceBatchRetailStatus(batch_id, sender=farmer)

    # Consumer with RETAILER role but not holder cannot advance
    sc.grantRole(sc.get_RETAILER_ROLE(), consumer, sender=admin)
    with pytest.raises(ContractLogicError, match="Not current holder"):
        sc.advanceBatchRetailStatus(batch_id, sender=consumer)

    # Actual holder can advance
    sc.advanceBatchRetailStatus(batch_id, sender=retailer)
    assert sc.getBatchStatus(batch_id) == sc.get_RETAILED_STATE()


# 4) After DELIVERED: can still transfer before advancing status
def test_delivered_can_transfer_before_retail_advance(deployed_contract, farmer, inspector, logistics, retailer, consumer):
    sc = deployed_contract
    batch_id = _mint_attest_and_to_retailer(sc, farmer, inspector, logistics, retailer)
    
    assert sc.getBatchStatus(batch_id) == sc.get_DELIVERED_STATE()
    
    # DELIVERED state blocks transfers - consumer has no role
    with pytest.raises(ContractLogicError, match="Recipient has no valid supply-chain role"):
        sc.transferFrom(retailer, consumer, batch_id, sender=retailer)


# 5) After RETAILED: all transfers blocked (must call advanceBatchRetailStatus again to reach CONSUMED)
def test_transfer_blocked_after_retailed(deployed_contract, farmer, inspector, logistics, retailer):
    sc = deployed_contract
    batch_id = _mint_attest_and_to_retailer(sc, farmer, inspector, logistics, retailer)

    sc.advanceBatchRetailStatus(batch_id, sender=retailer)
    assert sc.getBatchStatus(batch_id) == sc.get_RETAILED_STATE()

    # Cannot transfer in RETAILED state - must call advanceBatchRetailStatus to reach CONSUMED
    with pytest.raises(ContractLogicError, match="Token in DELIVERED/RETAILED state cannot be transferred"):
        sc.transferFrom(retailer, logistics, batch_id, sender=retailer)


# 6) After CONSUMED: can only transfer to ARCHIVE_VAULT
def test_archive_transfer_only_when_consumed(deployed_contract, farmer, inspector, logistics, retailer):
    sc = deployed_contract
    batch_id = _mint_attest_and_to_retailer(sc, farmer, inspector, logistics, retailer)

    # First call: DELIVERED -> RETAILED
    sc.advanceBatchRetailStatus(batch_id, sender=retailer)
    assert sc.getBatchStatus(batch_id) == sc.get_RETAILED_STATE()

    # In RETAILED state, cannot transfer to non-ARCHIVE addresses
    with pytest.raises(ContractLogicError, match="Token in DELIVERED/RETAILED state cannot be transferred"):
        sc.transferFrom(retailer, logistics, batch_id, sender=retailer)

    # Second call: RETAILED -> CONSUMED
    sc.advanceBatchRetailStatus(batch_id, sender=retailer)
    assert sc.getBatchStatus(batch_id) == sc.get_CONSUMED_STATE()

    # Now in CONSUMED state, can transfer to ARCHIVE_VAULT only
    ARCHIVE = "0x000000000000000000000000000000000000aaaa"
    sc.transferFrom(retailer, ARCHIVE, batch_id, sender=retailer)

    assert sc.ownerOf(batch_id) == ARCHIVE


# 7) advanceBatchRetailStatus only valid from DELIVERED/RETAILED states
def test_advance_invalid_states_revert(deployed_contract, farmer, inspector, logistics, retailer):
    sc = deployed_contract

    # Case A: INSPECTING (not yet to retailer) -> retailer doesn't hold it
    sc.mintBatch("ipfs://cid-demo/meta.json", sender=farmer)
    batch_a = sc.tokenCounter()
    sc.markBatchInspected(batch_a, "ipfs://cid-demo/inspected.json", sender=inspector)
    
    with pytest.raises(ContractLogicError, match="Not current holder"):
        sc.advanceBatchRetailStatus(batch_a, sender=retailer)

    # Case B: DELIVERED -> valid to advance once
    batch_b = _mint_attest_and_to_retailer(sc, farmer, inspector, logistics, retailer)
    assert sc.getBatchStatus(batch_b) == sc.get_DELIVERED_STATE()
    
    # Logistics cannot advance (wrong role)
    with pytest.raises(ContractLogicError, match="Missing required role"):
        sc.advanceBatchRetailStatus(batch_b, sender=logistics)

    # Retailer can advance
    sc.advanceBatchRetailStatus(batch_b, sender=retailer)
    sc.advanceBatchRetailStatus(batch_b, sender=retailer)
    assert sc.getBatchStatus(batch_b) == sc.get_CONSUMED_STATE()

    # Case C: After CONSUMED -> cannot advance again
    with pytest.raises(ContractLogicError, match="Invalid state for retail progress"):
        sc.advanceBatchRetailStatus(batch_b, sender=retailer)
