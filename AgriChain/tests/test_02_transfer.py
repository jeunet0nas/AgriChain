import pytest
from ape.exceptions import ContractLogicError


def _mint_only(deployed_contract, farmer):
    """Mint batch in HARVESTED state"""
    uri = "ipfs://cid-demo/meta.json"
    deployed_contract.mintBatch(uri, sender=farmer)
    return deployed_contract.tokenCounter()


def _mint_and_attest(deployed_contract, farmer, inspector):
    """Mint and mark inspected -> INSPECTING state"""
    batch_id = _mint_only(deployed_contract, farmer)
    deployed_contract.markBatchInspected(batch_id, sender=inspector)
    return batch_id


# 1) HARVESTED: absolutely no transfers allowed (not yet inspected)
def test_cannot_transfer_in_harvested_state(deployed_contract, farmer, logistics):
    batch_id = _mint_only(deployed_contract, farmer)
    
    assert deployed_contract.ownerOf(batch_id) == farmer.address
    assert deployed_contract.getBatchStatus(batch_id) == deployed_contract.get_HARVESTED_STATE()

    # Cannot transfer in HARVESTED state
    with pytest.raises(ContractLogicError, match="Cannot transfer in HARVESTED state"):
        deployed_contract.transferFrom(farmer, logistics, batch_id, sender=farmer)

    # Owner unchanged
    assert deployed_contract.ownerOf(batch_id) == farmer.address


# 2) INSPECTING -> transfer to LOGISTICS, status updates to IN_TRANSIT
def test_inspected_then_transfer_to_logistics_updates_status(deployed_contract, farmer, inspector, logistics):
    batch_id = _mint_and_attest(deployed_contract, farmer, inspector)

    assert deployed_contract.getBatchStatus(batch_id) == deployed_contract.get_INSPECTING_STATE()
    assert deployed_contract.ownerOf(batch_id) == farmer.address

    # ERC721: transferFrom (no amount parameter)
    deployed_contract.transferFrom(farmer, logistics, batch_id, sender=farmer)

    assert deployed_contract.ownerOf(batch_id) == logistics.address
    assert deployed_contract.getBatchStatus(batch_id) == deployed_contract.get_IN_TRANSIT_STATE()


# 3) INSPECTING: transfer to wrong role (RETAILER) must revert
def test_wrong_recipient_role_from_inspecting(deployed_contract, farmer, inspector, retailer):
    batch_id = _mint_and_attest(deployed_contract, farmer, inspector)

    # Try to transfer to retailer (wrong role, needs logistics)
    with pytest.raises(ContractLogicError, match="Recipient must be logistics"):
        deployed_contract.transferFrom(farmer, retailer, batch_id, sender=farmer)

    # Owner unchanged
    assert deployed_contract.ownerOf(batch_id) == farmer.address
    assert deployed_contract.getBatchStatus(batch_id) == deployed_contract.get_INSPECTING_STATE()


# 4) IN_TRANSIT -> transfer to RETAILER, status updates to DELIVERED
def test_logistics_transfer_to_retailer_updates_status(deployed_contract, farmer, inspector, logistics, retailer):
    batch_id = _mint_and_attest(deployed_contract, farmer, inspector)

    # Farmer -> Logistics
    deployed_contract.transferFrom(farmer, logistics, batch_id, sender=farmer)
    assert deployed_contract.getBatchStatus(batch_id) == deployed_contract.get_IN_TRANSIT_STATE()

    # Logistics -> Retailer
    deployed_contract.transferFrom(logistics, retailer, batch_id, sender=logistics)

    assert deployed_contract.ownerOf(batch_id) == retailer.address
    assert deployed_contract.getBatchStatus(batch_id) == deployed_contract.get_DELIVERED_STATE()


# 5) IN_TRANSIT: transfer to wrong role (FARMER) must revert
def test_logistics_cannot_transfer_to_wrong_role(deployed_contract, farmer, inspector, logistics):
    batch_id = _mint_and_attest(deployed_contract, farmer, inspector)
    
    deployed_contract.transferFrom(farmer, logistics, batch_id, sender=farmer)
    assert deployed_contract.getBatchStatus(batch_id) == deployed_contract.get_IN_TRANSIT_STATE()

    # Try to transfer back to farmer (wrong role, needs retailer)
    with pytest.raises(ContractLogicError, match="Recipient must be retailer"):
        deployed_contract.transferFrom(logistics, farmer, batch_id, sender=logistics)


# 6) Operator (approved) can transfer on behalf of owner, respecting role checks
def test_operator_can_transfer_respecting_roles(deployed_contract, farmer, inspector, logistics):
    batch_id = _mint_and_attest(deployed_contract, farmer, inspector)

    # Farmer approves inspector as operator
    deployed_contract.setApprovalForAll(inspector, True, sender=farmer)
    assert deployed_contract.isApprovedForAll(farmer, inspector) is True

    # Inspector transfers on farmer's behalf to logistics
    deployed_contract.transferFrom(farmer, logistics, batch_id, sender=inspector)
    
    assert deployed_contract.ownerOf(batch_id) == logistics.address
    assert deployed_contract.getBatchStatus(batch_id) == deployed_contract.get_IN_TRANSIT_STATE()


# 7) Non-owner/non-approved cannot transfer
def test_non_approved_cannot_transfer(deployed_contract, farmer, inspector, logistics):
    batch_id = _mint_and_attest(deployed_contract, farmer, inspector)

    # Logistics tries to transfer farmer's token without approval
    with pytest.raises(ContractLogicError, match="Not owner nor approved"):
        deployed_contract.transferFrom(farmer, logistics, batch_id, sender=logistics)

    assert deployed_contract.ownerOf(batch_id) == farmer.address


# 8) safeTransferFrom with empty data works same as transferFrom
def test_safe_transfer_from_3_params(deployed_contract, farmer, inspector, logistics):
    batch_id = _mint_and_attest(deployed_contract, farmer, inspector)

    # ERC721: safeTransferFrom(from, to, tokenId) - 3 params
    deployed_contract.safeTransferFrom(farmer, logistics, batch_id, sender=farmer)

    assert deployed_contract.ownerOf(batch_id) == logistics.address
    assert deployed_contract.getBatchStatus(batch_id) == deployed_contract.get_IN_TRANSIT_STATE()


# 9) safeTransferFrom with data also works
def test_safe_transfer_from_4_params(deployed_contract, farmer, inspector, logistics):
    batch_id = _mint_and_attest(deployed_contract, farmer, inspector)

    # ERC721: safeTransferFrom(from, to, tokenId, data) - 4 params
    deployed_contract.safeTransferFrom(farmer, logistics, batch_id, b"test data", sender=farmer)

    assert deployed_contract.ownerOf(batch_id) == logistics.address
    assert deployed_contract.getBatchStatus(batch_id) == deployed_contract.get_IN_TRANSIT_STATE()
