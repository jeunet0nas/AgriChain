import pytest
from ape import project

@pytest.fixture
def admin(accounts):
    return accounts[0]

@pytest.fixture
def farmer(accounts):
    return accounts[1]

@pytest.fixture
def inspector(accounts):
    return accounts[2]

@pytest.fixture
def logistics(accounts):
    return accounts[3]

@pytest.fixture
def retailer(accounts):
    return accounts[4]

@pytest.fixture
def consumer(accounts):
    return accounts[5]

@pytest.fixture
def contract(admin):
    deployed = admin.deploy(project.AgriChain)
    return deployed

@pytest.fixture
def deployed_contract(admin, contract, farmer, inspector, logistics, retailer):
    contract.grantRole(contract.get_FARMER_ROLE(), farmer, sender=admin)
    contract.grantRole(contract.get_INSPECTOR_ROLE(), inspector, sender=admin)
    contract.grantRole(contract.get_LOGISTICS_ROLE(), logistics, sender=admin)
    contract.grantRole(contract.get_RETAILER_ROLE(), retailer, sender=admin)
    return contract