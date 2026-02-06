# Deployment Guide

## Deploying to Wikimedia Commons

### Prerequisites

1. Wikimedia Commons account with system page edit permissions
2. Built files in `dist/` directory

---

## Deployment Steps

### Step 1: Build the Project

```bash
npm run build
```

This creates:
- `dist/Gadget-CategoryBatchManager.js` (49 KB)
- `dist/Gadget-CategoryBatchManager.css` (4 KB)

### Step 2: Deploy JavaScript

1. Open `dist/Gadget-CategoryBatchManager.js`
2. Copy entire contents
3. Go to: https://commons.wikimedia.org/wiki/MediaWiki:Gadget-CategoryBatchManager.js
4. Click "Edit"
5. Paste content
6. Edit summary:
   ```
   v1.1.0: Major performance improvement - Search API implementation
   ```
7. Save page

### Step 3: Deploy CSS

1. Open `dist/Gadget-CategoryBatchManager.css`
2. Copy entire contents
3. Go to: https://commons.wikimedia.org/wiki/MediaWiki:Gadget-CategoryBatchManager.css
4. Click "Edit"
5. Paste content
6. Edit summary:
   ```
   v1.1.0: Updated styles for source category field
   ```
7. Save page

### Step 4: Verify Gadget Definition

Go to: https://commons.wikimedia.org/wiki/MediaWiki:Gadgets-definition

Ensure this line exists:
```
* CategoryBatchManager[ResourceLoader|dependencies=mediawiki.api,mediawiki.util]|CategoryBatchManager.js|CategoryBatchManager.css
```

---

## Verification

### 1. Check Loading

Open browser console (F12) and verify no JavaScript errors

### 2. Test on Category Page

1. Go to any category: https://commons.wikimedia.org/wiki/Category:Test
2. Verify "Batch Manager" button appears
3. Click button
4. Verify:
   - Source Category field shows current category
   - Field is editable
   - Search works quickly

### 3. Performance Test

Test on large category:
1. Open `Category:Uploaded_by_OWID_importer_tool`
2. Open Batch Manager
3. Search for specific pattern (e.g., `,BLR.svg`)
4. Verify quick response (seconds, not minutes)

---

## Troubleshooting

### Button Doesn't Appear

**Solutions:**
1. Verify gadget enabled in preferences
2. Clear browser cache
3. Check console for errors
4. Ensure you're on a category page

### Search Not Working

**Solutions:**
1. Open console for error messages
2. Verify Search API is available
3. Check category format (must start with `Category:`)

### Slow Performance

**Possible Causes:**
1. Search pattern too generic (returns thousands)
2. Network issues
3. Server load

**Solutions:**
- Use more specific search pattern
- Wait and retry later

---

## Rollback Procedure

If issues occur:

1. Go to file page on Commons
2. Click "View history"
3. Select previous version
4. Click "restore this revision"

**Or** use git to rollback:
```bash
git checkout v1.0.0
npm run build
# Then deploy old files
```

---

## Announcement

### Create Documentation Page

Create/update: https://commons.wikimedia.org/wiki/Commons:Category_Batch_Manager

### Announce in Village Pump

Post at: https://commons.wikimedia.org/wiki/Commons:Village_pump

**Example Announcement:**

```markdown
== Category Batch Manager - Version 1.1.0 ==

Major update to Category Batch Manager gadget:

=== New Features ===
* '''60x faster search''' - Now uses Search API
* '''Flexible source category''' - Search any category
* '''Large category support''' - Handles 100,000+ files efficiently

=== How to Use ===
1. Go to any category page
2. Click "Batch Manager"
3. Enter search pattern
4. Add/remove categories

=== Feedback ===
Report issues at [[Commons talk:Category Batch Manager]]

~~~~
```

---

## Pre-Deployment Checklist

- [ ] All tests passing (`npm test`)
- [ ] Build successful (`npm run build`)
- [ ] Local testing complete
- [ ] CHANGELOG.md updated
- [ ] Version number updated in package.json
- [ ] Git tag created for release
- [ ] All changes reviewed
- [ ] No console errors
- [ ] Rollback plan ready

---

## Post-Deployment

1. **Monitor for 1 hour** - Check for errors
2. **Watch feedback** - Listen to user comments
3. **Document issues** - Record any problems
4. **Plan next release** - Use feedback for improvements

---

**Status:** Ready for production deployment 🚀
