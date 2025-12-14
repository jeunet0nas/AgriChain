import pytest
from ape.exceptions import ContractLogicError


QUARANTINE_VAULT = "0x000000000000000000000000000000000000dEaD"
ARCHIVE_VAULT = "0x000000000000000000000000000000000000aaaa"  # ERC721 compliant


def _mint_only(sc, farmer):
    sc.mintBatch("ipfs://cid/meta.json", sender=farmer)
    return sc.tokenCounter()


def _mint_attest(sc, farmer, inspector):
    batch_id = _mint_only(sc, farmer)
    sc.markBatchInspected(batch_id, "ipfs://cid/inspected.json", sender=inspector)
    return batch_id


def _to_in_transit(sc, farmer, inspector, logistics):
    batch_id = _mint_attest(sc, farmer, inspector)
    sc.transferFrom(farmer, logistics, batch_id, sender=farmer)
    return batch_id


def _to_delivered(sc, farmer, inspector, logistics, retailer):
    batch_id = _to_in_transit(sc, farmer, inspector, logistics)
    sc.transferFrom(logistics, retailer, batch_id, sender=logistics)
    return batch_id


# 1) Only ADMIN can recall
def test_only_admin_can_recall(deployed_contract, admin, farmer, inspector):
    sc = deployed_contract
    batch_id = _mint_only(sc, farmer)

    # Farmer cannot recall
    with pytest.raises(ContractLogicError, match="Missing required role"):
        sc.markBatchRecalled(batch_id, b"reason", sender=farmer)

    # Admin can recall
    sc.markBatchRecalled(batch_id, b"reason", sender=admin)
    assert sc.getBatchStatus(batch_id) == sc.get_RECALLED_STATE()


# 2) Can recall from various states: HARVESTED / INSPECTING / IN_TRANSIT / DELIVERED
@pytest.mark.parametrize("prep", ["harvested", "inspecting", "in_transit", "delivered"])
def test_admin_can_recall_from_various_states(
    deployed_contract, admin, farmer, inspector, logistics, retailer, prep
):
    sc = deployed_contract

    if prep == "harvested":
        batch_id = _mint_only(sc, farmer)
    elif prep == "inspecting":
        batch_id = _mint_attest(sc, farmer, inspector)
    elif prep == "in_transit":
        batch_id = _to_in_transit(sc, farmer, inspector, logistics)
    else:  # delivered
        batch_id = _to_delivered(sc, farmer, inspector, logistics, retailer)

    sc.markBatchRecalled(batch_id, f"recall-{prep}".encode(), sender=admin)
    assert sc.getBatchStatus(batch_id) == sc.get_RECALLED_STATE()


# 3) Cannot recall when CONSUMED; cannot recall twice
def test_cannot_recall_consumed_and_cannot_recall_twice(
    deployed_contract, admin, farmer, inspector, logistics, retailer
):
    sc = deployed_contract
    batch_id = _to_delivered(sc, farmer, inspector, logistics, retailer)

    # Advance to CONSUMED
    sc.advanceBatchRetailStatus(batch_id, sender=retailer)
    sc.advanceBatchRetailStatus(batch_id, sender=retailer)
    assert sc.getBatchStatus(batch_id) == sc.get_CONSUMED_STATE()

    # Cannot recall consumed token
    with pytest.raises(ContractLogicError, match="Cannot recall consumed token"):
        sc.markBatchRecalled(batch_id, b"try", sender=admin)

    # Recall another batch
    batch_id2 = _mint_only(sc, farmer)
    sc.markBatchRecalled(batch_id2, b"once", sender=admin)
    assert sc.getBatchStatus(batch_id2) == sc.get_RECALLED_STATE()

    # Cannot recall twice
    with pytest.raises(ContractLogicError, match="Already recalled"):
        sc.markBatchRecalled(batch_id2, b"twice", sender=admin)


# 4) After RECALLED: only transfer to QUARANTINE_VAULT allowed
def test_after_recalled_only_quarantine_transfer_allowed(
    deployed_contract, admin, farmer, inspector, logistics, retailer
):
    sc = deployed_contract
    batch_id = _to_delivered(sc, farmer, inspector, logistics, retailer)

    sc.markBatchRecalled(batch_id, b"qa", sender=admin)
    assert sc.getBatchStatus(batch_id) == sc.get_RECALLED_STATE()
    assert sc.ownerOf(batch_id) == retailer.address

    # Cannot transfer to logistics
    with pytest.raises(ContractLogicError, match="Can only transfer RECALLED to QUARANTINE_VAULT"):
        sc.transferFrom(retailer, logistics, batch_id, sender=retailer)

    # Cannot transfer to self
    with pytest.raises(ContractLogicError, match="Can only transfer RECALLED to QUARANTINE_VAULT"):
        sc.transferFrom(retailer, retailer, batch_id, sender=retailer)

    # Cannot transfer to ARCHIVE_VAULT
    with pytest.raises(ContractLogicError, match="Can only transfer RECALLED to QUARANTINE_VAULT"):
        sc.transferFrom(retailer, ARCHIVE_VAULT, batch_id, sender=retailer)

    # Can transfer to QUARANTINE_VAULT
    sc.transferFrom(retailer, QUARANTINE_VAULT, batch_id, sender=retailer)
    assert sc.ownerOf(batch_id) == QUARANTINE_VAULT


# 5) After RECALLED: status stays RECALLED even after quarantine transfer
def test_recalled_status_persists_after_quarantine(
    deployed_contract, admin, farmer, inspector, logistics, retailer
):
    sc = deployed_contract
    batch_id = _to_delivered(sc, farmer, inspector, logistics, retailer)

    sc.markBatchRecalled(batch_id, b"test", sender=admin)
    assert sc.getBatchStatus(batch_id) == sc.get_RECALLED_STATE()

    sc.transferFrom(retailer, QUARANTINE_VAULT, batch_id, sender=retailer)
    
    # Status remains RECALLED
    assert sc.getBatchStatus(batch_id) == sc.get_RECALLED_STATE()
    assert sc.ownerOf(batch_id) == QUARANTINE_VAULT


# 6) Multiple batches can be in QUARANTINE_VAULT simultaneously
def test_multiple_batches_in_quarantine(
    deployed_contract, admin, farmer, inspector, logistics, retailer
):
    sc = deployed_contract
    
    # Create and recall 3 batches
    batch_ids = []
    for i in range(3):
        batch_id = _to_delivered(sc, farmer, inspector, logistics, retailer)
        sc.markBatchRecalled(batch_id, f"recall-{i}".encode(), sender=admin)
        sc.transferFrom(retailer, QUARANTINE_VAULT, batch_id, sender=retailer)
        batch_ids.append(batch_id)
    
    # All batches in quarantine
    for batch_id in batch_ids:
        assert sc.ownerOf(batch_id) == QUARANTINE_VAULT
        assert sc.getBatchStatus(batch_id) == sc.get_RECALLED_STATE()
    
    # QUARANTINE_VAULT owns 3+ tokens
    assert sc.balanceOf(QUARANTINE_VAULT) >= 3
