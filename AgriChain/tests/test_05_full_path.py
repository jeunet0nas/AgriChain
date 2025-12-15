import pytest
from ape.exceptions import ContractLogicError

ARCHIVE_VAULT = "0x000000000000000000000000000000000000aaaa"
QUARANTINE_VAULT = "0x000000000000000000000000000000000000dEaD"


def test_happy_path_full_lifecycle(deployed_contract, farmer, inspector, logistics, retailer):
    sc = deployed_contract
    
    # Farmer mints batch
    uri = "ipfs://QmTest123/metadata.json"
    sc.mintBatch(uri, sender=farmer)
    batch_id = sc.tokenCounter()
    
    assert sc.ownerOf(batch_id) == farmer.address
    assert sc.getBatchStatus(batch_id) == sc.get_HARVESTED_STATE()
    assert sc.tokenURI(batch_id) == uri
    
    # Inspector marks inspected
    sc.markBatchInspected(batch_id, "ipfs://QmTest123/inspected.json", sender=inspector)
    assert sc.getBatchStatus(batch_id) == sc.get_INSPECTING_STATE()
    assert sc.ownerOf(batch_id) == farmer.address
    
    # Farmer transfers to logistics
    sc.transferFrom(farmer, logistics, batch_id, sender=farmer)
    assert sc.ownerOf(batch_id) == logistics.address
    assert sc.getBatchStatus(batch_id) == sc.get_IN_TRANSIT_STATE()
    
    # Logistics transfers to retailer
    sc.transferFrom(logistics, retailer, batch_id, sender=logistics)
    assert sc.ownerOf(batch_id) == retailer.address
    assert sc.getBatchStatus(batch_id) == sc.get_DELIVERED_STATE()
    
    # Retailer advances: DELIVERED -> RETAILED
    sc.advanceBatchRetailStatus(batch_id, sender=retailer)
    assert sc.getBatchStatus(batch_id) == sc.get_RETAILED_STATE()
    
    # Retailer advances: RETAILED -> CONSUMED
    sc.advanceBatchRetailStatus(batch_id, sender=retailer)
    assert sc.getBatchStatus(batch_id) == sc.get_CONSUMED_STATE()
    
    # Retailer archives to ARCHIVE_VAULT
    sc.transferFrom(retailer, ARCHIVE_VAULT, batch_id, sender=retailer)
    assert sc.ownerOf(batch_id) == ARCHIVE_VAULT


def test_recall_path_full_lifecycle(deployed_contract, admin, farmer, inspector, logistics, retailer):
    sc = deployed_contract
    
    # Normal flow to DELIVERED
    sc.mintBatch("ipfs://batch", sender=farmer)
    batch_id = sc.tokenCounter()
    sc.markBatchInspected(batch_id, "ipfs://batch/inspected.json", sender=inspector)
    sc.transferFrom(farmer, logistics, batch_id, sender=farmer)
    sc.transferFrom(logistics, retailer, batch_id, sender=logistics)
    
    assert sc.getBatchStatus(batch_id) == sc.get_DELIVERED_STATE()
    assert sc.ownerOf(batch_id) == retailer.address
    
    # Admin recalls batch
    reason = b"quality issue detected"
    sc.markBatchRecalled(batch_id, reason, sender=admin)
    assert sc.getBatchStatus(batch_id) == sc.get_RECALLED_STATE()
    assert sc.ownerOf(batch_id) == retailer.address  # Still with retailer
    
    # Retailer sends to quarantine
    sc.transferFrom(retailer, QUARANTINE_VAULT, batch_id, sender=retailer)
    assert sc.ownerOf(batch_id) == QUARANTINE_VAULT
    assert sc.getBatchStatus(batch_id) == sc.get_RECALLED_STATE()
