import pytest
from ape.exceptions import ContractLogicError


QUARANTINE_VAULT = "0x000000000000000000000000000000000000dEaD"
ARCHIVE_VAULT = "0x000000000000000000000000000000000000aaaa"


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


def test_only_admin_can_recall(deployed_contract, admin, farmer, inspector):
    sc = deployed_contract
    batch_id = _mint_only(sc, farmer)

    with pytest.raises(ContractLogicError, match="Missing required role"):
        sc.markBatchRecalled(batch_id, b"reason", sender=farmer)

    sc.markBatchRecalled(batch_id, b"reason", sender=admin)
    assert sc.getBatchStatus(batch_id) == sc.get_RECALLED_STATE()


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
    else:
        batch_id = _to_delivered(sc, farmer, inspector, logistics, retailer)

    sc.markBatchRecalled(batch_id, f"recall-{prep}".encode(), sender=admin)
    assert sc.getBatchStatus(batch_id) == sc.get_RECALLED_STATE()


def test_cannot_recall_consumed_and_cannot_recall_twice(
    deployed_contract, admin, farmer, inspector, logistics, retailer
):
    sc = deployed_contract
    batch_id = _to_delivered(sc, farmer, inspector, logistics, retailer)

    sc.advanceBatchRetailStatus(batch_id, sender=retailer)
    sc.advanceBatchRetailStatus(batch_id, sender=retailer)
    assert sc.getBatchStatus(batch_id) == sc.get_CONSUMED_STATE()

    with pytest.raises(ContractLogicError, match="Cannot recall consumed token"):
        sc.markBatchRecalled(batch_id, b"try", sender=admin)

    batch_id2 = _mint_only(sc, farmer)
    sc.markBatchRecalled(batch_id2, b"once", sender=admin)
    assert sc.getBatchStatus(batch_id2) == sc.get_RECALLED_STATE()

    with pytest.raises(ContractLogicError, match="Already recalled"):
        sc.markBatchRecalled(batch_id2, b"twice", sender=admin)


def test_after_recalled_only_quarantine_transfer_allowed(
    deployed_contract, admin, farmer, inspector, logistics, retailer
):
    sc = deployed_contract
    batch_id = _to_delivered(sc, farmer, inspector, logistics, retailer)

    sc.markBatchRecalled(batch_id, b"qa", sender=admin)
    assert sc.getBatchStatus(batch_id) == sc.get_RECALLED_STATE()
    assert sc.ownerOf(batch_id) == retailer.address

    with pytest.raises(ContractLogicError, match="Can only transfer RECALLED to QUARANTINE_VAULT"):
        sc.transferFrom(retailer, logistics, batch_id, sender=retailer)

    with pytest.raises(ContractLogicError, match="Can only transfer RECALLED to QUARANTINE_VAULT"):
        sc.transferFrom(retailer, retailer, batch_id, sender=retailer)

    with pytest.raises(ContractLogicError, match="Can only transfer RECALLED to QUARANTINE_VAULT"):
        sc.transferFrom(retailer, ARCHIVE_VAULT, batch_id, sender=retailer)

    sc.transferFrom(retailer, QUARANTINE_VAULT, batch_id, sender=retailer)
    assert sc.ownerOf(batch_id) == QUARANTINE_VAULT


def test_recalled_status_persists_after_quarantine(
    deployed_contract, admin, farmer, inspector, logistics, retailer
):
    sc = deployed_contract
    batch_id = _to_delivered(sc, farmer, inspector, logistics, retailer)

    sc.markBatchRecalled(batch_id, b"test", sender=admin)
    assert sc.getBatchStatus(batch_id) == sc.get_RECALLED_STATE()

    sc.transferFrom(retailer, QUARANTINE_VAULT, batch_id, sender=retailer)
    
    assert sc.getBatchStatus(batch_id) == sc.get_RECALLED_STATE()
    assert sc.ownerOf(batch_id) == QUARANTINE_VAULT


def test_multiple_batches_in_quarantine(
    deployed_contract, admin, farmer, inspector, logistics, retailer
):
    sc = deployed_contract
    
    batch_ids = []
    for i in range(3):
        batch_id = _to_delivered(sc, farmer, inspector, logistics, retailer)
        sc.markBatchRecalled(batch_id, f"recall-{i}".encode(), sender=admin)
        sc.transferFrom(retailer, QUARANTINE_VAULT, batch_id, sender=retailer)
        batch_ids.append(batch_id)
    
    for batch_id in batch_ids:
        assert sc.ownerOf(batch_id) == QUARANTINE_VAULT
        assert sc.getBatchStatus(batch_id) == sc.get_RECALLED_STATE()
    
    assert sc.balanceOf(QUARANTINE_VAULT) >= 3
