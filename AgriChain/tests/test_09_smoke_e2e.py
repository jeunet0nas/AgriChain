import pytest
from ape.exceptions import ContractLogicError


# Smoke test: Full end-to-end flow

ARCHIVE_VAULT = "0x000000000000000000000000000000000000aaaa"
QUARANTINE_VAULT = "0x000000000000000000000000000000000000dEaD"


def test_happy_path_full_lifecycle(deployed_contract, farmer, inspector, logistics, retailer):
    """
    Complete happy path:
    FARMER mints -> INSPECTOR inspects -> FARMER->LOGISTICS -> LOGISTICS->RETAILER
    -> RETAILER advances to CONSUMED -> archives to vault
    """
    sc = deployed_contract
    
    # 1. Farmer mints batch
    uri = "ipfs://QmTest123/metadata.json"
    sc.mintBatch(uri, sender=farmer)
    batch_id = sc.tokenCounter()
    
    assert sc.ownerOf(batch_id) == farmer.address
    assert sc.getBatchStatus(batch_id) == sc.get_HARVESTED_STATE()
    assert sc.tokenURI(batch_id) == uri
    
    # 2. Inspector marks inspected
    sc.markBatchInspected(batch_id, sender=inspector)
    assert sc.getBatchStatus(batch_id) == sc.get_INSPECTING_STATE()
    assert sc.ownerOf(batch_id) == farmer.address  # Still with farmer
    
    # 3. Farmer transfers to logistics
    sc.transferFrom(farmer, logistics, batch_id, sender=farmer)
    assert sc.ownerOf(batch_id) == logistics.address
    assert sc.getBatchStatus(batch_id) == sc.get_IN_TRANSIT_STATE()
    
    # 4. Logistics transfers to retailer
    sc.transferFrom(logistics, retailer, batch_id, sender=logistics)
    assert sc.ownerOf(batch_id) == retailer.address
    assert sc.getBatchStatus(batch_id) == sc.get_DELIVERED_STATE()
    
    # 5. Retailer advances: DELIVERED -> RETAILED
    sc.advanceBatchRetailStatus(batch_id, sender=retailer)
    assert sc.getBatchStatus(batch_id) == sc.get_RETAILED_STATE()
    
    # 6. Retailer advances: RETAILED -> CONSUMED
    sc.advanceBatchRetailStatus(batch_id, sender=retailer)
    assert sc.getBatchStatus(batch_id) == sc.get_CONSUMED_STATE()
    
    # 7. Retailer archives to ARCHIVE_VAULT
    sc.transferFrom(retailer, ARCHIVE_VAULT, batch_id, sender=retailer)
    assert sc.ownerOf(batch_id) == ARCHIVE_VAULT


def test_recall_path_full_lifecycle(deployed_contract, admin, farmer, inspector, logistics, retailer):
    """
    Recall flow:
    Normal flow up to DELIVERED -> ADMIN recalls -> holder sends to QUARANTINE_VAULT
    """
    sc = deployed_contract
    
    # 1-4. Normal flow to DELIVERED
    sc.mintBatch("ipfs://batch", sender=farmer)
    batch_id = sc.tokenCounter()
    sc.markBatchInspected(batch_id, sender=inspector)
    sc.transferFrom(farmer, logistics, batch_id, sender=farmer)
    sc.transferFrom(logistics, retailer, batch_id, sender=logistics)
    
    assert sc.getBatchStatus(batch_id) == sc.get_DELIVERED_STATE()
    assert sc.ownerOf(batch_id) == retailer.address
    
    # 5. Admin recalls batch
    reason = b"quality issue detected"
    sc.markBatchRecalled(batch_id, reason, sender=admin)
    assert sc.getBatchStatus(batch_id) == sc.get_RECALLED_STATE()
    assert sc.ownerOf(batch_id) == retailer.address  # Still with retailer
    
    # 6. Retailer sends to quarantine
    sc.transferFrom(retailer, QUARANTINE_VAULT, batch_id, sender=retailer)
    assert sc.ownerOf(batch_id) == QUARANTINE_VAULT
    assert sc.getBatchStatus(batch_id) == sc.get_RECALLED_STATE()


def test_multiple_batches_independent_flows(deployed_contract, admin, farmer, inspector, logistics, retailer):
    """
    Multiple batches in different states:
    - Batch A: full happy path to archive
    - Batch B: recalled and quarantined
    - Batch C: stuck in transit
    """
    sc = deployed_contract
    
    # Batch A: Full happy path
    sc.mintBatch("ipfs://batch-a", sender=farmer)
    batch_a = sc.tokenCounter()
    sc.markBatchInspected(batch_a, sender=inspector)
    sc.transferFrom(farmer, logistics, batch_a, sender=farmer)
    sc.transferFrom(logistics, retailer, batch_a, sender=logistics)
    sc.advanceBatchRetailStatus(batch_a, sender=retailer)
    sc.advanceBatchRetailStatus(batch_a, sender=retailer)
    sc.transferFrom(retailer, ARCHIVE_VAULT, batch_a, sender=retailer)
    
    # Batch B: Recalled
    sc.mintBatch("ipfs://batch-b", sender=farmer)
    batch_b = sc.tokenCounter()
    sc.markBatchInspected(batch_b, sender=inspector)
    sc.transferFrom(farmer, logistics, batch_b, sender=farmer)
    sc.markBatchRecalled(batch_b, b"contaminated", sender=admin)
    sc.transferFrom(logistics, QUARANTINE_VAULT, batch_b, sender=logistics)
    
    # Batch C: In transit
    sc.mintBatch("ipfs://batch-c", sender=farmer)
    batch_c = sc.tokenCounter()
    sc.markBatchInspected(batch_c, sender=inspector)
    sc.transferFrom(farmer, logistics, batch_c, sender=farmer)
    
    # Verify independent states
    assert sc.ownerOf(batch_a) == ARCHIVE_VAULT
    assert sc.getBatchStatus(batch_a) == sc.get_CONSUMED_STATE()
    
    assert sc.ownerOf(batch_b) == QUARANTINE_VAULT
    assert sc.getBatchStatus(batch_b) == sc.get_RECALLED_STATE()
    
    assert sc.ownerOf(batch_c) == logistics.address
    assert sc.getBatchStatus(batch_c) == sc.get_IN_TRANSIT_STATE()


def test_role_based_access_enforcement_e2e(deployed_contract, admin, farmer, inspector, logistics, retailer, consumer):
    """
    Test that roles are properly enforced throughout lifecycle
    """
    sc = deployed_contract
    
    # Consumer has no roles initially
    sc.mintBatch("ipfs://test", sender=farmer)
    batch_id = sc.tokenCounter()
    
    # Consumer cannot inspect
    with pytest.raises(ContractLogicError, match="Missing required role"):
        sc.markBatchInspected(batch_id, sender=consumer)
    
    # Consumer cannot recall
    with pytest.raises(ContractLogicError, match="Missing required role"):
        sc.markBatchRecalled(batch_id, b"test", sender=consumer)
    
    # Inspector inspects
    sc.markBatchInspected(batch_id, sender=inspector)
    
    # Consumer cannot receive from farmer (consumer has no role)
    with pytest.raises(ContractLogicError, match="Recipient has no valid supply-chain role"):
        sc.transferFrom(farmer, consumer, batch_id, sender=farmer)
    
    # Proper flow continues
    sc.transferFrom(farmer, logistics, batch_id, sender=farmer)
    
    # Consumer cannot receive from logistics (consumer has no role)
    with pytest.raises(ContractLogicError, match="Recipient has no valid supply-chain role"):
        sc.transferFrom(logistics, consumer, batch_id, sender=logistics)
    
    # Retailer receives
    sc.transferFrom(logistics, retailer, batch_id, sender=logistics)
    
    # Consumer cannot advance retail status (no role)
    with pytest.raises(ContractLogicError, match="Missing required role"):
        sc.advanceBatchRetailStatus(batch_id, sender=consumer)
    
    # Retailer can advance
    sc.advanceBatchRetailStatus(batch_id, sender=retailer)
    assert sc.getBatchStatus(batch_id) == sc.get_RETAILED_STATE()


def test_erc721_standard_compliance(deployed_contract, farmer):
    """
    Verify basic ERC721 standard compliance
    """
    sc = deployed_contract
    
    # supportsInterface
    ERC721_INTERFACE = "0x80ac58cd"
    assert sc.supportsInterface(bytes.fromhex(ERC721_INTERFACE[2:]))
    
    # name and symbol
    assert len(sc.name()) > 0
    assert len(sc.symbol()) > 0
    
    # Mint and verify ERC721 functions
    sc.mintBatch("ipfs://test", sender=farmer)
    batch_id = sc.tokenCounter()
    
    # ownerOf
    assert sc.ownerOf(batch_id) == farmer.address
    
    # balanceOf
    assert sc.balanceOf(farmer.address) >= 1
    
    # tokenURI
    assert sc.tokenURI(batch_id) == "ipfs://test"
    
    # approve/getApproved
    ZERO = "0x0000000000000000000000000000000000000000"
    assert sc.getApproved(batch_id) == ZERO
    
    # All core ERC721 functions work
