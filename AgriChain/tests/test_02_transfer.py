import pytest
from ape.exceptions import ContractLogicError


def _mint_only(deployed_contract, farmer):
    uri = "ipfs://cid-demo/meta.json"
    deployed_contract.mintBatch(uri, sender=farmer)
    return deployed_contract.tokenCounter()


def _mint_and_attest(deployed_contract, farmer, inspector):
    batch_id = _mint_only(deployed_contract, farmer)
    deployed_contract.markBatchInspected(batch_id, "ipfs://cid-demo/inspected.json", sender=inspector)
    return batch_id


def test_cannot_transfer_in_harvested_state(deployed_contract, farmer, logistics):
    batch_id = _mint_only(deployed_contract, farmer)
    
    assert deployed_contract.ownerOf(batch_id) == farmer.address
    assert deployed_contract.getBatchStatus(batch_id) == deployed_contract.get_HARVESTED_STATE()

    with pytest.raises(ContractLogicError, match="Cannot transfer in HARVESTED state"):
        deployed_contract.transferFrom(farmer, logistics, batch_id, sender=farmer)

    assert deployed_contract.ownerOf(batch_id) == farmer.address


def test_inspected_then_transfer_to_logistics_updates_status(deployed_contract, farmer, inspector, logistics):
    batch_id = _mint_and_attest(deployed_contract, farmer, inspector)

    assert deployed_contract.getBatchStatus(batch_id) == deployed_contract.get_INSPECTING_STATE()
    assert deployed_contract.ownerOf(batch_id) == farmer.address

    deployed_contract.transferFrom(farmer, logistics, batch_id, sender=farmer)

    assert deployed_contract.ownerOf(batch_id) == logistics.address
    assert deployed_contract.getBatchStatus(batch_id) == deployed_contract.get_IN_TRANSIT_STATE()


def test_wrong_recipient_role_from_inspecting(deployed_contract, farmer, inspector, retailer):
    batch_id = _mint_and_attest(deployed_contract, farmer, inspector)

    with pytest.raises(ContractLogicError, match="Recipient must be logistics"):
        deployed_contract.transferFrom(farmer, retailer, batch_id, sender=farmer)

    assert deployed_contract.ownerOf(batch_id) == farmer.address
    assert deployed_contract.getBatchStatus(batch_id) == deployed_contract.get_INSPECTING_STATE()


def test_logistics_transfer_to_retailer_updates_status(deployed_contract, farmer, inspector, logistics, retailer):
    batch_id = _mint_and_attest(deployed_contract, farmer, inspector)

    deployed_contract.transferFrom(farmer, logistics, batch_id, sender=farmer)
    assert deployed_contract.getBatchStatus(batch_id) == deployed_contract.get_IN_TRANSIT_STATE()

    deployed_contract.transferFrom(logistics, retailer, batch_id, sender=logistics)

    assert deployed_contract.ownerOf(batch_id) == retailer.address
    assert deployed_contract.getBatchStatus(batch_id) == deployed_contract.get_DELIVERED_STATE()


def test_logistics_cannot_transfer_to_wrong_role(deployed_contract, farmer, inspector, logistics):
    batch_id = _mint_and_attest(deployed_contract, farmer, inspector)
    
    deployed_contract.transferFrom(farmer, logistics, batch_id, sender=farmer)
    assert deployed_contract.getBatchStatus(batch_id) == deployed_contract.get_IN_TRANSIT_STATE()

    with pytest.raises(ContractLogicError, match="Recipient must be retailer"):
        deployed_contract.transferFrom(logistics, farmer, batch_id, sender=logistics)


def test_non_approved_cannot_transfer(deployed_contract, farmer, inspector, logistics):
    batch_id = _mint_and_attest(deployed_contract, farmer, inspector)

    with pytest.raises(ContractLogicError, match="Not owner nor approved"):
        deployed_contract.transferFrom(farmer, logistics, batch_id, sender=logistics)

    assert deployed_contract.ownerOf(batch_id) == farmer.address


def test_safe_transfer_from_3_params(deployed_contract, farmer, inspector, logistics):
    batch_id = _mint_and_attest(deployed_contract, farmer, inspector)

    deployed_contract.safeTransferFrom(farmer, logistics, batch_id, sender=farmer)

    assert deployed_contract.ownerOf(batch_id) == logistics.address
    assert deployed_contract.getBatchStatus(batch_id) == deployed_contract.get_IN_TRANSIT_STATE()


def test_safe_transfer_from_4_params(deployed_contract, farmer, inspector, logistics):
    batch_id = _mint_and_attest(deployed_contract, farmer, inspector)

    deployed_contract.safeTransferFrom(farmer, logistics, batch_id, b"test data", sender=farmer)

    assert deployed_contract.ownerOf(batch_id) == logistics.address
    assert deployed_contract.getBatchStatus(batch_id) == deployed_contract.get_IN_TRANSIT_STATE()
