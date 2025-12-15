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


def test_retailer_advance_to_retailed(deployed_contract, farmer, inspector, logistics, retailer):
    sc = deployed_contract
    batch_id = _mint_attest_and_to_retailer(sc, farmer, inspector, logistics, retailer)

    assert sc.ownerOf(batch_id) == retailer.address
    assert sc.getBatchStatus(batch_id) == sc.get_DELIVERED_STATE()

    sc.advanceBatchRetailStatus(batch_id, sender=retailer)
    assert sc.getBatchStatus(batch_id) == sc.get_RETAILED_STATE()


def test_retailer_advance_to_consumed(deployed_contract, farmer, inspector, logistics, retailer):
    sc = deployed_contract
    batch_id = _mint_attest_and_to_retailer(sc, farmer, inspector, logistics, retailer)

    sc.advanceBatchRetailStatus(batch_id, sender=retailer)
    assert sc.getBatchStatus(batch_id) == sc.get_RETAILED_STATE()

    sc.advanceBatchRetailStatus(batch_id, sender=retailer)
    assert sc.getBatchStatus(batch_id) == sc.get_CONSUMED_STATE()


def test_only_retailer_holder_can_advance(deployed_contract, admin, farmer, inspector, logistics, retailer, consumer):
    sc = deployed_contract
    batch_id = _mint_attest_and_to_retailer(sc, farmer, inspector, logistics, retailer)

    with pytest.raises(ContractLogicError, match="Missing required role"):
        sc.advanceBatchRetailStatus(batch_id, sender=farmer)

    sc.grantRole(sc.get_RETAILER_ROLE(), consumer, sender=admin)
    with pytest.raises(ContractLogicError, match="Not current holder"):
        sc.advanceBatchRetailStatus(batch_id, sender=consumer)

    sc.advanceBatchRetailStatus(batch_id, sender=retailer)
    assert sc.getBatchStatus(batch_id) == sc.get_RETAILED_STATE()


def test_delivered_transfer_to_non_role_blocked(deployed_contract, farmer, inspector, logistics, retailer, consumer):
    sc = deployed_contract
    batch_id = _mint_attest_and_to_retailer(sc, farmer, inspector, logistics, retailer)
    
    assert sc.getBatchStatus(batch_id) == sc.get_DELIVERED_STATE()
    
    with pytest.raises(ContractLogicError, match="Recipient has no valid supply-chain role"):
        sc.transferFrom(retailer, consumer, batch_id, sender=retailer)


def test_transfer_blocked_after_retailed(deployed_contract, farmer, inspector, logistics, retailer):
    sc = deployed_contract
    batch_id = _mint_attest_and_to_retailer(sc, farmer, inspector, logistics, retailer)

    sc.advanceBatchRetailStatus(batch_id, sender=retailer)
    assert sc.getBatchStatus(batch_id) == sc.get_RETAILED_STATE()

    with pytest.raises(ContractLogicError, match="Token in DELIVERED/RETAILED state cannot be transferred"):
        sc.transferFrom(retailer, logistics, batch_id, sender=retailer)


def test_archive_transfer_only_when_consumed(deployed_contract, farmer, inspector, logistics, retailer):
    sc = deployed_contract
    batch_id = _mint_attest_and_to_retailer(sc, farmer, inspector, logistics, retailer)

    sc.advanceBatchRetailStatus(batch_id, sender=retailer)
    assert sc.getBatchStatus(batch_id) == sc.get_RETAILED_STATE()

    with pytest.raises(ContractLogicError, match="Token in DELIVERED/RETAILED state cannot be transferred"):
        sc.transferFrom(retailer, logistics, batch_id, sender=retailer)

    sc.advanceBatchRetailStatus(batch_id, sender=retailer)
    assert sc.getBatchStatus(batch_id) == sc.get_CONSUMED_STATE()

    ARCHIVE = "0x000000000000000000000000000000000000aaaa"
    sc.transferFrom(retailer, ARCHIVE, batch_id, sender=retailer)

    assert sc.ownerOf(batch_id) == ARCHIVE


def test_advance_invalid_states_revert(deployed_contract, farmer, inspector, logistics, retailer):
    sc = deployed_contract

    sc.mintBatch("ipfs://cid-demo/meta.json", sender=farmer)
    batch_a = sc.tokenCounter()
    sc.markBatchInspected(batch_a, "ipfs://cid-demo/inspected.json", sender=inspector)
    
    with pytest.raises(ContractLogicError, match="Not current holder"):
        sc.advanceBatchRetailStatus(batch_a, sender=retailer)

    batch_b = _mint_attest_and_to_retailer(sc, farmer, inspector, logistics, retailer)
    assert sc.getBatchStatus(batch_b) == sc.get_DELIVERED_STATE()
    
    with pytest.raises(ContractLogicError, match="Missing required role"):
        sc.advanceBatchRetailStatus(batch_b, sender=logistics)

    sc.advanceBatchRetailStatus(batch_b, sender=retailer)
    sc.advanceBatchRetailStatus(batch_b, sender=retailer)
    assert sc.getBatchStatus(batch_b) == sc.get_CONSUMED_STATE()

    with pytest.raises(ContractLogicError, match="Invalid state for retail progress"):
        sc.advanceBatchRetailStatus(batch_b, sender=retailer)
