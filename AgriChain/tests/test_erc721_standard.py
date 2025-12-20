import pytest
from ape.exceptions import ContractLogicError


def test_erc721_metadata(deployed_contract, farmer):
    sc = deployed_contract
    assert sc.name() == "AgriChain721"
    assert sc.symbol() == "AGC"
    
    uri = "ipfs://QmTest123"
    sc.mintBatch(uri, sender=farmer)
    batch_id = sc.tokenCounter()
    assert sc.tokenURI(batch_id) == uri


def test_erc721_ownership_tracking(deployed_contract, farmer, inspector, logistics):
    sc = deployed_contract
    assert sc.balanceOf(farmer) == 0
    
    sc.mintBatch("ipfs://test", sender=farmer)
    batch_id = sc.tokenCounter()

    assert sc.balanceOf(farmer) == 1
    assert sc.ownerOf(batch_id) == farmer.address
    
    sc.markBatchInspected(batch_id, "ipfs://inspected", sender=inspector)
    sc.transferFrom(farmer, logistics, batch_id, sender=farmer)
    
    assert sc.ownerOf(batch_id) == logistics.address
    assert sc.balanceOf(farmer) == 0
    assert sc.balanceOf(logistics) == 1


def test_erc721_transfer(deployed_contract, farmer, inspector, logistics):
    sc = deployed_contract
    sc.mintBatch("ipfs://test", sender=farmer)
    batch_id = sc.tokenCounter()
    sc.markBatchInspected(batch_id, "ipfs://inspected", sender=inspector)
    
    sc.transferFrom(farmer, logistics, batch_id, sender=farmer)
    assert sc.ownerOf(batch_id) == logistics.address


def test_erc721_approval(deployed_contract, farmer, accounts):
    sc = deployed_contract
    sc.mintBatch("ipfs://test", sender=farmer)
    batch_id = sc.tokenCounter()
    
    approved = accounts[6]
    sc.approve(approved, batch_id, sender=farmer)
    assert sc.getApproved(batch_id) == approved.address


def test_erc721_approval_for_all(deployed_contract, farmer, accounts):
    sc = deployed_contract
    
    operator = accounts[6]
    assert sc.isApprovedForAll(farmer, operator) == False
    
    sc.setApprovalForAll(operator, True, sender=farmer)
    assert sc.isApprovedForAll(farmer, operator) == True
    
    sc.setApprovalForAll(operator, False, sender=farmer)
    assert sc.isApprovedForAll(farmer, operator) == False


def test_erc721_transfer_event(deployed_contract, farmer, inspector, logistics):
    sc = deployed_contract
    
    tx_mint = sc.mintBatch("ipfs://test", sender=farmer)
    batch_id = sc.tokenCounter()
    
    events = tx_mint.decode_logs(sc.Transfer)
    assert len(events) == 1
    assert events[0]._from == "0x0000000000000000000000000000000000000000"
    assert events[0]._to == farmer.address
    assert events[0].tokenId == batch_id
    
    sc.markBatchInspected(batch_id, "ipfs://inspected", sender=inspector)
    tx_transfer = sc.transferFrom(farmer, logistics, batch_id, sender=farmer)
    
    events = tx_transfer.decode_logs(sc.Transfer)
    assert len(events) == 1
    assert events[0]._from == farmer.address
    assert events[0]._to == logistics.address
    assert events[0].tokenId == batch_id


def test_erc165_interface_support(deployed_contract):
    sc = deployed_contract
    
    # ERC165
    assert sc.supportsInterface(b"\x01\xff\xc9\xa7") == True
    # ERC721
    assert sc.supportsInterface(b"\x80\xac\x58\xcd") == True
    # ERC721Metadata
    assert sc.supportsInterface(b"\x5b\x5e\x13\x9f") == True
    # random interface
    assert sc.supportsInterface(b"\xff\xff\xff\xff") == False
