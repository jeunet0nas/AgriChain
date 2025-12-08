# Git Setup for AgriChain Project

## Initialize Git Repository

```powershell
# Navigate to project root
cd E:\UIT\UIT\y4\IS355\lab6\final

# Initialize git repository
git init

# Check gitignore is working
git status

# You should NOT see:
# - .env files
# - node_modules/
# - .build/
# - __pycache__/
```

## First Commit

```powershell
# Add all files
git add .

# Check what will be committed
git status

# Create initial commit
git commit -m "Initial commit: AgriChain ERC721 with Vue 3 frontend

- Smart contract: Vyper ERC721 with role-based access control
- Frontend: Vue 3 + Vite + Pinia + ethers.js
- IPFS integration: Pinata for metadata and files
- Event sync: Refactored single-source-of-truth architecture
- Documentation: Complete setup guides and architecture docs"

# View commit
git log --oneline
```

## Create GitHub Repository

```powershell
# Option 1: Use GitHub CLI (if installed)
gh repo create AgriChain --public --source=. --remote=origin

# Option 2: Manual setup
# 1. Go to https://github.com/new
# 2. Create new repository "AgriChain"
# 3. Don't initialize with README (we have one)
# 4. Copy the remote URL

# Add remote
git remote add origin https://github.com/<your-username>/AgriChain.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Verify .gitignore

```powershell
# These files should be ignored:
git check-ignore -v frontend/.env
git check-ignore -v frontend/node_modules
git check-ignore -v AgriChain/.build
git check-ignore -v AgriChain/__pycache__

# Output should show which .gitignore rule is matching
```

## Branch Strategy (Recommended)

```powershell
# Create development branch
git checkout -b develop

# Create feature branches from develop
git checkout -b feature/new-feature

# Merge back to develop when done
git checkout develop
git merge feature/new-feature

# Merge to main for releases
git checkout main
git merge develop
git tag -a v1.0.0 -m "Release version 1.0.0"
git push --tags
```

## Useful Git Commands

```powershell
# Check repository status
git status

# View commit history
git log --oneline --graph --all

# Create .gitignore for specific file types
# (Already done - see .gitignore files)

# Undo unstaged changes
git checkout -- <file>

# Undo last commit (keep changes)
git reset --soft HEAD~1

# View differences
git diff
```

## Important Notes

### Files That Should NEVER Be Committed:

- ❌ `frontend/.env` - Contains Pinata JWT token
- ❌ `frontend/node_modules/` - Too large, install via npm
- ❌ `AgriChain/.build/` - Compiled artifacts
- ❌ `AgriChain/.venv/` - Python virtual environment
- ❌ Private keys or wallet files

### Files That SHOULD Be Committed:

- ✅ `frontend/.env.example` - Template for environment variables
- ✅ `README.md` and documentation
- ✅ Source code (contracts, frontend)
- ✅ Configuration files (package.json, ape-config.yaml)
- ✅ `.gitignore` files

## Troubleshooting

### Accidentally committed .env file:

```powershell
# Remove from git (keep local file)
git rm --cached frontend/.env

# Add to .gitignore if not already there
echo ".env" >> frontend/.gitignore

# Commit the removal
git commit -m "Remove .env from version control"

# IMPORTANT: Rotate your Pinata JWT token!
# The old token is now in git history
```

### Reset to last commit:

```powershell
# Discard all local changes
git reset --hard HEAD

# Discard changes in specific file
git checkout HEAD -- <file>
```

### Check what's ignored:

```powershell
# List all ignored files
git status --ignored
```

## CI/CD Setup (Optional)

Create `.github/workflows/deploy.yml` for automated testing/deployment:

```yaml
name: AgriChain CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test-contract:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: "3.10"
      - name: Install Ape
        run: pip install eth-ape
      - name: Run tests
        run: |
          cd AgriChain
          ape test

  build-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - name: Install dependencies
        run: |
          cd frontend
          npm install
      - name: Build
        run: |
          cd frontend
          npm run build
```

## Next Steps

After git setup:

1. ✅ Verify all sensitive files are ignored
2. ✅ Push to GitHub
3. ✅ Set up branch protection rules (main branch)
4. ✅ Add collaborators if team project
5. ✅ Consider setting up GitHub Actions for CI/CD

---

**Questions?** Check the main [README.md](../README.md) for full documentation.
