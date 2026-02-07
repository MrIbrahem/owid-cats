# Quick Reference

## Category Batch Manager v1.1.0

### At a Glance

**What it does:** Batch categorize files on Wikimedia Commons
**Speed:** 60x faster than before
**Status:** ✅ Production ready

---

## Quick Start

### For Users

1. **Enable:** Go to Commons Preferences → Gadgets
2. **Access:** Visit any category page → Click "Batch Manager"
3. **Search:** Enter pattern (e.g., `,BLR.svg`)
4. **Categorize:** Add/remove categories
5. **Execute:** Click "GO"

**Read more:** [README.md](README.md) | [EXAMPLES.md](EXAMPLES.md)

---

### For Developers

```bash
# Install
npm install

# Test
npm test        # 69/69 passing

# Build
npm run build   # Creates dist/ files

# Deploy
# See DEPLOYMENT.md
```

**Technical details:** [PERFORMANCE.md](PERFORMANCE.md)

---

## Key Changes in v1.1.0

### Performance
- ⚡ **60x faster** - Search API implementation
- 💾 **99% less memory** - Loads only matching files
- 📉 **99% fewer API calls** - Direct search

### Features
- 🔧 **Flexible source** - Editable category field
- 🎯 **Large categories** - Handles 100K+ files
- 📝 **Better UX** - Auto-fill current category

### Files Changed
- `FileService.js` - New search method
- `main.js` - Source category field
- Tests updated
- Docs in English

---

## Documentation Map

| File | Purpose | Audience |
|------|---------|----------|
| `README.md` | Main guide | Users & Devs |
| `EXAMPLES.md` | Usage examples | Users |
| `DEPLOYMENT.md` | Deploy steps | Admins |
| `PERFORMANCE.md` | Tech details | Developers |
| `CHANGELOG.md` | Version history | All |
| `FUTURE_IDEAS.md` | Roadmap | Contributors |
| `SUMMARY.md` | Project summary | All |

---

## Common Tasks

### Search in Large Category
```
Source: Category:Charts (100K files)
Pattern: Population_density
Result: ~200 matching files in seconds
```

### Replace Old Category
```
Add: Category:New_2024
Remove: Category:Old
```

### Multi-Country Batch
```
1. Pattern: ,BLR.svg → Add: Category:Belarus
2. Pattern: ,USA.svg → Add: Category:United States
3. Pattern: ,JPN.svg → Add: Category:Japan
```

---

## Performance Comparison

| Operation | v1.0 | v1.1 |
|-----------|------|------|
| Search 100K category | 3-5 min | 3-5 sec |
| Memory usage | High | Low |
| API calls | 200 | 2 |

---

## Support

- **Docs:** This repository
- **Issues:** Commons talk page
- **Questions:** See README.md

---

## Status

```
Version: 1.1.0
Tests: 69/69 ✅
Build: Success ✅
Docs: Complete ✅
Ready: Production ✅
```

---

**Last Updated:** February 7, 2026
**License:** MIT
**Author:** OWID Tools Team
