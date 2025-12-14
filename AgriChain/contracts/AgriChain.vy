# @version ^0.4.3

event Transfer:
    _from: indexed(address)
    _to: indexed(address)
    tokenId: indexed(uint256)

event Approval:
    owner: indexed(address)
    approved: indexed(address)
    tokenId: indexed(uint256)

event ApprovalForAll:
    owner: indexed(address)
    operator: indexed(address)
    approved: bool

event URI:
    value: String[256]
    tokenId: indexed(uint256)

event StatusUpdated:
    batchId: indexed(uint256)
    updater: indexed(address)
    oldStatus: uint256
    newStatus: uint256

event BatchMinted:
    batchId: indexed(uint256)
    farmer: indexed(address)

event BatchInspected:
    batchId: indexed(uint256)
    inspector: indexed(address)

event RoleGranted:
    role: indexed(bytes32)
    account: indexed(address)
    sender: indexed(address)

event RoleRevoked:
    role: indexed(bytes32)
    account: indexed(address)
    sender: indexed(address)

event BatchArchived:
    batchId: indexed(uint256)
    caller: indexed(address)
    archiveWallet: indexed(address)

event BatchRecalled:
    batchId: indexed(uint256)
    caller: indexed(address)
    reasonHash: bytes32


interface ERC721Receiver:
    def onERC721Received(
        _operator: address,
        _from: address,
        _tokenId: uint256,
        _data: Bytes[1024]
    ) -> bytes4: nonpayable


# =========================
# CONSTANTS
# =========================

# ERC165 / ERC721 interface IDs
INTERFACE_ID_ERC165: constant(bytes4) = 0x01ffc9a7
INTERFACE_ID_ERC721: constant(bytes4) = 0x80ac58cd
INTERFACE_ID_ERC721_METADATA: constant(bytes4) = 0x5b5e139f

# ERC721 receiver magic value
ERC721_RECEIVED: constant(bytes4) = 0x150b7a02

# State machine
NOT_EXIST: constant(uint256) = 0
HARVESTED: constant(uint256) = 1
INSPECTING: constant(uint256) = 2
IN_TRANSIT: constant(uint256) = 3
DELIVERED: constant(uint256) = 4
RETAILED: constant(uint256) = 5
CONSUMED: constant(uint256) = 6
RECALLED: constant(uint256) = 7

# Special vaults
ARCHIVE_VAULT: constant(address) = 0x000000000000000000000000000000000000aaaa
QUARANTINE_VAULT: constant(address) = 0x000000000000000000000000000000000000dEaD

# Roles
ADMIN_ROLE: constant(bytes32) = keccak256("ADMIN_ROLE")
FARMER_ROLE: constant(bytes32) = keccak256("FARMER_ROLE")
INSPECTOR_ROLE: constant(bytes32) = keccak256("INSPECTOR_ROLE")
LOGISTICS_ROLE: constant(bytes32) = keccak256("LOGISTICS_ROLE")
RETAILER_ROLE: constant(bytes32) = keccak256("RETAILER_ROLE")


# =========================
# STATE VARIABLES
# =========================

# ERC721 metadata
name: public(String[32])
symbol: public(String[32])

# ERC721 ownership
tokenOwner: public(HashMap[uint256, address])
ownedTokensCount: HashMap[address, uint256]
tokenApprovals: HashMap[uint256, address]
operatorApprovals: public(HashMap[address, HashMap[address, bool]])

# Per-batch URI (IPFS CID or URL)
tokenURIs: public(HashMap[uint256, String[256]])

# Agri-chain state
tokenCounter: public(uint256)
contractOwner: public(address)
batchStatus: public(HashMap[uint256, uint256])
roles: public(HashMap[bytes32, HashMap[address, bool]])


# =========================
# CONSTRUCTOR
# =========================

@deploy
def __init__():
    self.contractOwner = msg.sender
    self.tokenCounter = 0
    self.name = "AgriChain721"
    self.symbol = "AGC"
    self._grantRole(ADMIN_ROLE, msg.sender)


# =========================
# INTERNAL ROLE HELPERS
# =========================

@view
@internal
def _checkRole(_role: bytes32, _account: address):
    assert self.roles[_role][_account], "Missing required role"

@internal
def _grantRole(_role: bytes32, _account: address):
    self.roles[_role][_account] = True
    log RoleGranted(_role, _account, msg.sender)

@internal
def _revokeRole(_role: bytes32, _account: address):
    self.roles[_role][_account] = False
    log RoleRevoked(_role, _account, msg.sender)

@view
@internal
def _checkExists(_batchId: uint256):
    assert len(self.tokenURIs[_batchId]) > 0, "Unknown batch"


# =========================
# INTERNAL ERC721 HELPERS
# =========================

@view
@internal
def _isApprovedOrOwner(_spender: address, _tokenId: uint256) -> bool:
    self._checkExists(_tokenId)
    owner: address = self.tokenOwner[_tokenId]
    return (
        _spender == owner or
        self.tokenApprovals[_tokenId] == _spender or
        self.operatorApprovals[owner][_spender]
    )

@internal
def _clearApproval(_tokenId: uint256):
    if self.tokenApprovals[_tokenId] != empty(address):
        self.tokenApprovals[_tokenId] = empty(address)

@internal
def _transfer(_from: address, _to: address, _tokenId: uint256):
    assert self.tokenOwner[_tokenId] == _from, "From is not owner"

    self._clearApproval(_tokenId)

    self.ownedTokensCount[_from] -= 1
    self.ownedTokensCount[_to] += 1

    self.tokenOwner[_tokenId] = _to

    log Transfer(_from, _to, _tokenId)

@internal
def _checkOnERC721Received(_from: address, _to: address, _tokenId: uint256, _data: Bytes[1024]):
    if _to.is_contract:
        resp: bytes4 = extcall ERC721Receiver(_to).onERC721Received(
            msg.sender,
            _from,
            _tokenId,
            _data
        )
        assert resp == ERC721_RECEIVED, "ERC721Receiver rejected tokens"


# =========================
# INTERNAL BUSINESS HELPERS
# =========================

@internal
def _recipient_allowed_for_status(_to: address, _status: uint256):
    if _status == RECALLED:
        assert _to == QUARANTINE_VAULT, "Can only transfer RECALLED to QUARANTINE_VAULT"
        return

    if _status == CONSUMED:
        assert _to == ARCHIVE_VAULT, "Can only transfer CONSUMED to ARCHIVE_VAULT"
        return

    has_any: bool = (
        self.roles[FARMER_ROLE][_to] or
        self.roles[INSPECTOR_ROLE][_to] or
        self.roles[LOGISTICS_ROLE][_to] or
        self.roles[RETAILER_ROLE][_to]
    )

    assert has_any, "Recipient has no valid supply-chain role"

    if _status == HARVESTED:
        assert False, "Cannot transfer in HARVESTED state"

    elif _status == INSPECTING:
        assert self.roles[LOGISTICS_ROLE][_to], "Recipient must be logistics"

    elif _status == IN_TRANSIT:
        assert self.roles[RETAILER_ROLE][_to], "Recipient must be retailer"

    elif _status == DELIVERED or _status == RETAILED:
        assert False, "Token in DELIVERED/RETAILED state cannot be transferred"

@internal
def _agri_transfer(_from: address, _to: address, _tokenId: uint256, _data: Bytes[1024]):
    self._checkExists(_tokenId)
    assert _from == self.tokenOwner[_tokenId], "From is not owner"

    _status: uint256 = self.batchStatus[_tokenId]
    self._recipient_allowed_for_status(_to, _status)

    if _status == RECALLED and _to == QUARANTINE_VAULT:
        assert (msg.sender == _from), \
            "Only holder can transfer recalled batch"
        self._transfer(_from, _to, _tokenId)
        return

    assert _to != empty(address), "ERC721: transfer to zero address"

    if _status == CONSUMED and _to == ARCHIVE_VAULT:
        assert (msg.sender == _from), \
            "Only holder can archive consumed batch"
        self._transfer(_from, _to, _tokenId)
        log BatchArchived(_tokenId, _from, _to)
        return

    # Status transitions along the logistics route
    if _status == INSPECTING and self.roles[LOGISTICS_ROLE][_to]:
        assert self.roles[FARMER_ROLE][_from], "Logistics must receive batch from farmer holder"
        assert self.roles[FARMER_ROLE][msg.sender], \
            "Actor must be farmer to transfer batch to logistics (delegation allowed only within FARMER role)"
        self.batchStatus[_tokenId] = IN_TRANSIT
        log StatusUpdated(_tokenId, msg.sender, INSPECTING, IN_TRANSIT)

    elif _status == IN_TRANSIT and self.roles[RETAILER_ROLE][_to]:
        assert self.roles[LOGISTICS_ROLE][_from], "Retailer must receive batch from logistics holder"
        assert self.roles[LOGISTICS_ROLE][msg.sender], \
            "Actor must be logistics to transfer batch to retailer (delegation allowed only within LOGISTICS role)"
        self.batchStatus[_tokenId] = DELIVERED
        log StatusUpdated(_tokenId, msg.sender, IN_TRANSIT, DELIVERED)

    self._transfer(_from, _to, _tokenId)


# =========================
# ADMIN ROLE FUNCTIONS
# =========================

@external
def grantRole(_role: bytes32, _account: address):
    self._checkRole(ADMIN_ROLE, msg.sender)
    self._grantRole(_role, _account)

@external
def revokeRole(_role: bytes32, _account: address):
    self._checkRole(ADMIN_ROLE, msg.sender)
    self._revokeRole(_role, _account)

@view
@external
def hasRole(_role: bytes32, _account: address) -> bool:
    return self.roles[_role][_account]


# =========================
# ERP / BUSINESS FUNCTIONS
# =========================

@external
def mintBatch(_uri: String[256]) -> uint256:
    self._checkRole(FARMER_ROLE, msg.sender)
    assert len(_uri) > 0, "URI required"

    batchId: uint256 = self.tokenCounter + 1
    self.tokenCounter = batchId

    self.tokenURIs[batchId] = _uri

    self.tokenOwner[batchId] = msg.sender
    self.ownedTokensCount[msg.sender] += 1

    self.batchStatus[batchId] = HARVESTED

    log URI(_uri, batchId)
    log StatusUpdated(batchId, msg.sender, NOT_EXIST, HARVESTED)
    log BatchMinted(batchId, msg.sender)
    log Transfer(empty(address), msg.sender, batchId)

    return batchId


@external
def markBatchInspected(_batchId: uint256, _newURI: String[256]):
    self._checkExists(_batchId)
    self._checkRole(INSPECTOR_ROLE, msg.sender)
    assert len(_newURI) > 0, "New URI required for attestation"

    _currentStatus: uint256 = self.batchStatus[_batchId]
    assert _currentStatus == HARVESTED, "Must be in HARVESTED state"

    owner: address = self.tokenOwner[_batchId]
    assert self.roles[FARMER_ROLE][owner], "Batch must be held by a farmer"

    # Update status
    self.batchStatus[_batchId] = INSPECTING
    log StatusUpdated(_batchId, msg.sender, HARVESTED, INSPECTING)
    log BatchInspected(_batchId, msg.sender)
    
    # Update URI with inspection certificate
    self.tokenURIs[_batchId] = _newURI
    log URI(_newURI, _batchId)


@external
def advanceBatchRetailStatus(_batchId: uint256):
    self._checkExists(_batchId)
    self._checkRole(RETAILER_ROLE, msg.sender)
    assert self.tokenOwner[_batchId] == msg.sender, "Not current holder"

    _currentStatus: uint256 = self.batchStatus[_batchId]

    if _currentStatus == DELIVERED:
        self.batchStatus[_batchId] = RETAILED
        log StatusUpdated(_batchId, msg.sender, DELIVERED, RETAILED)
    elif _currentStatus == RETAILED:
        self.batchStatus[_batchId] = CONSUMED
        log StatusUpdated(_batchId, msg.sender, RETAILED, CONSUMED)
    else:
        assert False, "Invalid state for retail progress"


@external
def markBatchRecalled(_batchId: uint256, _reasonHash: bytes32):
    self._checkRole(ADMIN_ROLE, msg.sender)
    self._checkExists(_batchId)

    _oldStatus: uint256 = self.batchStatus[_batchId]
    assert _oldStatus != RECALLED, "Already recalled"
    assert _oldStatus != CONSUMED, "Cannot recall consumed token"

    self.batchStatus[_batchId] = RECALLED
    log StatusUpdated(_batchId, msg.sender, _oldStatus, RECALLED)
    log BatchRecalled(_batchId, msg.sender, _reasonHash)


@external
def updateBatchURI(_batchId: uint256, _newURI: String[256]):
    self._checkExists(_batchId)
    self._checkRole(INSPECTOR_ROLE, msg.sender)

    self.tokenURIs[_batchId] = _newURI
    log URI(_newURI, _batchId)


# =========================
# ERC721: TRANSFERS
# =========================

@external
def transferFrom(_from: address, _to: address, _tokenId: uint256):
    assert self._isApprovedOrOwner(msg.sender, _tokenId), "Not owner nor approved"
    self._agri_transfer(_from, _to, _tokenId, b"")


@external
def safeTransferFrom(_from: address, _to: address, _tokenId: uint256, _data: Bytes[1024] = b""):
    assert self._isApprovedOrOwner(msg.sender, _tokenId), "Not owner nor approved"
    self._agri_transfer(_from, _to, _tokenId, _data)
    self._checkOnERC721Received(_from, _to, _tokenId, _data)


# =========================
# ERC721: APPROVALS
# =========================

@external
def approve(_to: address, _tokenId: uint256):
    self._checkExists(_tokenId)
    owner: address = self.tokenOwner[_tokenId]
    assert _to != owner, "Approval to current owner"
    assert (
        msg.sender == owner or
        self.operatorApprovals[owner][msg.sender]
    ), "Not owner nor operator"

    self.tokenApprovals[_tokenId] = _to
    log Approval(owner, _to, _tokenId)


@external
def setApprovalForAll(_operator: address, _approved: bool):
    assert _operator != msg.sender, "Approve to caller"
    self.operatorApprovals[msg.sender][_operator] = _approved
    log ApprovalForAll(msg.sender, _operator, _approved)


@view
@external
def getApproved(_tokenId: uint256) -> address:
    self._checkExists(_tokenId)
    return self.tokenApprovals[_tokenId]


@view
@external
def isApprovedForAll(_owner: address, _operator: address) -> bool:
    return self.operatorApprovals[_owner][_operator]


# =========================
# ERC721: VIEWS
# =========================

@view
@external
def balanceOf(_owner: address) -> uint256:
    assert _owner != empty(address), "Zero address"
    return self.ownedTokensCount[_owner]


@view
@external
def ownerOf(_tokenId: uint256) -> address:
    owner: address = self.tokenOwner[_tokenId]
    assert owner != empty(address), "Token does not exist or archived"
    return owner


@view
@external
def tokenURI(_tokenId: uint256) -> String[256]:
    self._checkExists(_tokenId)
    return self.tokenURIs[_tokenId]


# =========================
# ROLE & STATE GETTERS
# =========================

@view
@external
def get_FARMER_ROLE() -> bytes32:
    return FARMER_ROLE

@view
@external
def get_INSPECTOR_ROLE() -> bytes32:
    return INSPECTOR_ROLE

@view
@external
def get_LOGISTICS_ROLE() -> bytes32:
    return LOGISTICS_ROLE

@view
@external
def get_RETAILER_ROLE() -> bytes32:
    return RETAILER_ROLE

@view
@external
def get_ADMIN_ROLE() -> bytes32:
    return ADMIN_ROLE


@view
@external
def get_HARVESTED_STATE() -> uint256:
    return HARVESTED

@view
@external
def get_INSPECTING_STATE() -> uint256:
    return INSPECTING

@view
@external
def get_IN_TRANSIT_STATE() -> uint256:
    return IN_TRANSIT

@view
@external
def get_DELIVERED_STATE() -> uint256:
    return DELIVERED

@view
@external
def get_RETAILED_STATE() -> uint256:
    return RETAILED

@view
@external
def get_CONSUMED_STATE() -> uint256:
    return CONSUMED

@view
@external
def get_RECALLED_STATE() -> uint256:
    return RECALLED


@view
@external
def getBatchStatus(_batchId: uint256) -> uint256:
    return self.batchStatus[_batchId]


# =========================
# ERC165 SUPPORTS INTERFACE
# =========================

@view
@external
def supportsInterface(_interfaceId: bytes4) -> bool:
    return (
        _interfaceId == INTERFACE_ID_ERC165 or
        _interfaceId == INTERFACE_ID_ERC721 or
        _interfaceId == INTERFACE_ID_ERC721_METADATA
    )
