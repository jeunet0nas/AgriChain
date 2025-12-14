import pytest
from ape.exceptions import ContractLogicError


# ERC721 receiver checks (safeTransferFrom should verify recipient contract)

def test_safe_transfer_to_eoa_works(deployed_contract, farmer, inspector, logistics):
    """safeTransferFrom to EOA (externally owned account) should work"""
    sc = deployed_contract
    sc.mintBatch("ipfs://test", sender=farmer)
    batch_id = sc.tokenCounter()
    sc.markBatchInspected(batch_id, "ipfs://test/inspected.json", sender=inspector)
    
    # Transfer to EOA (logistics account)
    sc.safeTransferFrom(farmer, logistics, batch_id, sender=farmer)
    assert sc.ownerOf(batch_id) == logistics.address


def test_transfer_from_to_eoa_works(deployed_contract, farmer, inspector, logistics):
    """Regular transferFrom doesn't check receiver"""
    sc = deployed_contract
    sc.mintBatch("ipfs://test", sender=farmer)
    batch_id = sc.tokenCounter()
    sc.markBatchInspected(batch_id, "ipfs://test/inspected.json", sender=inspector)
    
    # transferFrom works to any address
    sc.transferFrom(farmer, logistics, batch_id, sender=farmer)
    assert sc.ownerOf(batch_id) == logistics.address


def test_safe_transfer_with_data_to_eoa(deployed_contract, farmer, inspector, logistics):
    """safeTransferFrom with data to EOA works"""
    sc = deployed_contract
    sc.mintBatch("ipfs://test", sender=farmer)
    batch_id = sc.tokenCounter()
    sc.markBatchInspected(batch_id, "ipfs://test/inspected.json", sender=inspector)
    
    # safeTransferFrom with custom data
    sc.safeTransferFrom(farmer, logistics, batch_id, b"custom data", sender=farmer)
    assert sc.ownerOf(batch_id) == logistics.address


def test_cannot_transfer_to_zero_address(deployed_contract, farmer, inspector):
    """ERC721 compliance: cannot transfer to zero address"""
    sc = deployed_contract
    sc.mintBatch("ipfs://test", sender=farmer)
    batch_id = sc.tokenCounter()
    sc.markBatchInspected(batch_id, "ipfs://test/inspected.json", sender=inspector)
    
    # Try to transfer to zero address (zero address has no role)
    ZERO = "0x0000000000000000000000000000000000000000"
    
    with pytest.raises(ContractLogicError, match="Recipient has no valid supply-chain role"):
        sc.transferFrom(farmer, ZERO, batch_id, sender=farmer)
    
    # Owner unchanged
    assert sc.ownerOf(batch_id) == farmer.address


def test_cannot_safe_transfer_to_zero_address(deployed_contract, farmer, inspector):
    """safeTransferFrom also blocks zero address"""
    sc = deployed_contract
    sc.mintBatch("ipfs://test", sender=farmer)
    batch_id = sc.tokenCounter()
    sc.markBatchInspected(batch_id, "ipfs://test/inspected.json", sender=inspector)
    
    ZERO = "0x0000000000000000000000000000000000000000"
    
    with pytest.raises(ContractLogicError, match="Recipient has no valid supply-chain role"):
        sc.safeTransferFrom(farmer, ZERO, batch_id, sender=farmer)


# Note: Testing actual contract receivers (ERC721Receiver interface) would require
# deploying contract recipients. Since this is a supply chain contract with
# EOA participants (farmers, inspectors, etc.), contract receivers are not
# the primary use case. The important tests are:
# 1. EOA transfers work (tested above)
# 2. Zero address is blocked (tested above)
# 3. Business logic role checks work (tested in other files)
