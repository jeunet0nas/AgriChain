import pytest
from ape.exceptions import ContractLogicError


# Test event emissions and view functions

def test_batch_minted_event(deployed_contract, farmer):
    """Test BatchMinted event is emitted correctly"""
    sc = deployed_contract
    
    tx = sc.mintBatch("ipfs://test", sender=farmer)
    batch_id = sc.tokenCounter()
    
    # Check event logs
    events = list(tx.events)
    batch_minted_events = [e for e in events if e.event_name == "BatchMinted"]
    assert len(batch_minted_events) >= 1
    
    event = batch_minted_events[0]
    assert event.batchId == batch_id
    assert event.farmer == farmer.address


def test_batch_inspected_event(deployed_contract, farmer, inspector):
    """Test BatchInspected event is emitted correctly"""
    sc = deployed_contract
    sc.mintBatch("ipfs://test", sender=farmer)
    batch_id = sc.tokenCounter()
    
    tx = sc.markBatchInspected(batch_id, sender=inspector)
    
    events = list(tx.events)
    inspected_events = [e for e in events if e.event_name == "BatchInspected"]
    assert len(inspected_events) >= 1
    
    event = inspected_events[0]
    assert event.batchId == batch_id
    assert event.inspector == inspector.address


def test_transfer_event(deployed_contract, farmer, inspector, logistics):
    """Test ERC721 Transfer event is emitted"""
    sc = deployed_contract
    sc.mintBatch("ipfs://test", sender=farmer)
    batch_id = sc.tokenCounter()
    sc.markBatchInspected(batch_id, sender=inspector)
    
    tx = sc.transferFrom(farmer, logistics, batch_id, sender=farmer)
    
    events = list(tx.events)
    transfer_events = [e for e in events if e.event_name == "Transfer"]
    assert len(transfer_events) >= 1
    
    event = transfer_events[0]
    assert event._from == farmer.address
    assert event._to == logistics.address
    assert event.tokenId == batch_id


def test_status_updated_event(deployed_contract, farmer, inspector, logistics):
    """Test StatusUpdated event on state transitions"""
    sc = deployed_contract
    sc.mintBatch("ipfs://test", sender=farmer)
    batch_id = sc.tokenCounter()
    sc.markBatchInspected(batch_id, sender=inspector)
    
    tx = sc.transferFrom(farmer, logistics, batch_id, sender=farmer)
    
    events = list(tx.events)
    status_events = [e for e in events if e.event_name == "StatusUpdated"]
    assert len(status_events) >= 1
    
    event = status_events[0]
    assert event.batchId == batch_id
    assert event.oldStatus == sc.get_INSPECTING_STATE()
    assert event.newStatus == sc.get_IN_TRANSIT_STATE()


def test_batch_recalled_event(deployed_contract, admin, farmer):
    """Test BatchRecalled event"""
    sc = deployed_contract
    sc.mintBatch("ipfs://test", sender=farmer)
    batch_id = sc.tokenCounter()
    
    reason = b"contamination"
    tx = sc.markBatchRecalled(batch_id, reason, sender=admin)
    
    events = list(tx.events)
    recall_events = [e for e in events if e.event_name == "BatchRecalled"]
    assert len(recall_events) >= 1
    
    event = recall_events[0]
    assert event.batchId == batch_id
    assert event.caller == admin.address


def test_batch_archived_event(deployed_contract, farmer, inspector, logistics, retailer):
    """Test BatchArchived event on archive transfer"""
    sc = deployed_contract
    sc.mintBatch("ipfs://test", sender=farmer)
    batch_id = sc.tokenCounter()
    sc.markBatchInspected(batch_id, sender=inspector)
    sc.transferFrom(farmer, logistics, batch_id, sender=farmer)
    sc.transferFrom(logistics, retailer, batch_id, sender=logistics)
    
    # Advance to CONSUMED
    sc.advanceBatchRetailStatus(batch_id, sender=retailer)
    sc.advanceBatchRetailStatus(batch_id, sender=retailer)
    
    # Transfer to ARCHIVE_VAULT
    ARCHIVE = "0x000000000000000000000000000000000000aaaa"
    tx = sc.transferFrom(retailer, ARCHIVE, batch_id, sender=retailer)
    
    events = list(tx.events)
    archive_events = [e for e in events if e.event_name == "BatchArchived"]
    assert len(archive_events) >= 1
    
    event = archive_events[0]
    assert event.batchId == batch_id
    assert event.archiveWallet == ARCHIVE


def test_view_functions(deployed_contract, farmer):
    """Test read-only view functions"""
    sc = deployed_contract
    
    # Token counter starts at 0
    initial_count = sc.tokenCounter()
    
    # Mint batch
    sc.mintBatch("ipfs://test", sender=farmer)
    batch_id = sc.tokenCounter()
    
    # Counter incremented
    assert batch_id == initial_count + 1
    
    # getBatchStatus works
    status = sc.getBatchStatus(batch_id)
    assert status == sc.get_HARVESTED_STATE()
    
    # tokenURI works
    uri = sc.tokenURI(batch_id)
    assert uri == "ipfs://test"
    
    # ownerOf works
    owner = sc.ownerOf(batch_id)
    assert owner == farmer.address
    
    # balanceOf works
    balance = sc.balanceOf(farmer.address)
    assert balance >= 1


def test_role_getters(deployed_contract):
    """Test role constant getters"""
    sc = deployed_contract
    
    # All role getters work
    assert sc.get_FARMER_ROLE() != b"\x00" * 32
    assert sc.get_INSPECTOR_ROLE() != b"\x00" * 32
    assert sc.get_LOGISTICS_ROLE() != b"\x00" * 32
    assert sc.get_RETAILER_ROLE() != b"\x00" * 32
    assert sc.get_ADMIN_ROLE() != b"\x00" * 32
    
    # All roles are different
    roles = [
        sc.get_FARMER_ROLE(),
        sc.get_INSPECTOR_ROLE(),
        sc.get_LOGISTICS_ROLE(),
        sc.get_RETAILER_ROLE(),
        sc.get_ADMIN_ROLE()
    ]
    assert len(set(roles)) == 5


def test_state_getters(deployed_contract):
    """Test state constant getters"""
    sc = deployed_contract
    
    # All state getters work
    assert sc.get_HARVESTED_STATE() == 1
    assert sc.get_INSPECTING_STATE() == 2
    assert sc.get_IN_TRANSIT_STATE() == 3
    assert sc.get_DELIVERED_STATE() == 4
    assert sc.get_RETAILED_STATE() == 5
    assert sc.get_CONSUMED_STATE() == 6
    assert sc.get_RECALLED_STATE() == 7
