import pytest
from ape.exceptions import ContractLogicError

def test_admin_can_grant_role(admin, contract, farmer):
    assert not contract.hasRole(contract.get_FARMER_ROLE(), farmer)
    contract.grantRole(contract.get_FARMER_ROLE(), farmer, sender=admin)
    assert contract.hasRole(contract.get_FARMER_ROLE(), farmer)

def test_non_admin_cannot_grant_role(contract, farmer, logistics):
    with pytest.raises(ContractLogicError, match="Missing required role"):
        contract.grantRole(contract.get_LOGISTICS_ROLE(), logistics, sender=farmer)

def test_farmer_mints_batch_happy(deployed_contract, farmer):
    uri = "ipfs://cid-demo/meta.json"
    before = deployed_contract.tokenCounter()

    tx = deployed_contract.mintBatch(uri, sender=farmer)
    new_id = deployed_contract.tokenCounter()
    
    assert new_id == before + 1
    assert deployed_contract.ownerOf(new_id) == farmer.address
    
    farmer_balance = deployed_contract.balanceOf(farmer.address)
    assert farmer_balance >= 1
    
    got_uri = deployed_contract.tokenURI(new_id)
    assert uri == got_uri
    
    assert deployed_contract.getBatchStatus(new_id) == deployed_contract.get_HARVESTED_STATE()

def test_mint_rejects_empty_uri(deployed_contract, farmer):
    with pytest.raises(ContractLogicError, match="URI required"):
        deployed_contract.mintBatch("", sender=farmer)

def test_only_inspector_can_attest(deployed_contract, farmer, inspector):
    deployed_contract.mintBatch("ipfs://cid/meta.json", sender=farmer)
    batch_id = deployed_contract.tokenCounter()

    with pytest.raises(ContractLogicError, match="Missing required role"):
        deployed_contract.markBatchInspected(batch_id, "ipfs://cid/inspected.json", sender=farmer)

    tx = deployed_contract.markBatchInspected(batch_id, "ipfs://cid/inspected.json", sender=inspector)
    assert deployed_contract.getBatchStatus(batch_id) == deployed_contract.get_INSPECTING_STATE()

def test_attest_only_from_harvested(deployed_contract, farmer, inspector):
    deployed_contract.mintBatch("ipfs://cid/meta.json", sender=farmer)
    batch_id = deployed_contract.tokenCounter()
    
    deployed_contract.markBatchInspected(batch_id, "ipfs://cid/inspected.json", sender=inspector)
    
    with pytest.raises(ContractLogicError, match="Must be in HARVESTED state"):
        deployed_contract.markBatchInspected(batch_id, "ipfs://cid/inspected2.json", sender=inspector)
