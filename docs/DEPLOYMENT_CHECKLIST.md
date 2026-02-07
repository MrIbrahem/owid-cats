# 🚀 Deployment Checklist - v1.1.1

Use this checklist to deploy Category Batch Manager v1.1.1 to Wikimedia Commons.

---

## Pre-Deployment

### Code Verification
- [x] All tests passing (74/74) ✅
- [x] Build successful ✅
- [x] No lint errors ✅
- [x] Version bumped to 1.1.1 ✅
- [x] CHANGELOG.md updated ✅

### Documentation
- [x] README.md updated ✅
- [x] API_IMPROVEMENTS.md created ✅
- [x] Release notes created ✅
- [x] Visual guide created ✅
- [x] All documentation reviewed ✅

### Testing
- [x] Unit tests: 74/74 passing ✅
- [x] Manual testing completed ✅
- [x] Bug fixes verified ✅
- [x] Performance verified ✅

---

## Build Process

### 1. Clean Build
```bash
# Remove old dist files
rm -rf dist/

# Install dependencies
npm install

# Run tests
npm test

# Build
node build.js
```

**Expected Output:**
```
✓ Created dist/ directory
✓ Created dist/Gadget-CategoryBatchManager.js
✓ Created dist/Gadget-CategoryBatchManager.css
Build completed successfully!
```

- [ ] Build successful
- [ ] Files created in `dist/` folder
- [ ] No build errors

---

## File Preparation

### 2. Verify Built Files

**Check JavaScript bundle:**
```bash
ls -lh dist/Gadget-CategoryBatchManager.js
```
- [ ] File exists
- [ ] File size reasonable (~85KB)

**Check CSS file:**
```bash
ls -lh dist/Gadget-CategoryBatchManager.css
```
- [ ] File exists
- [ ] File size reasonable (~5KB)

### 3. Manual Code Review

Open and review:
- [ ] `dist/Gadget-CategoryBatchManager.js` - No obvious errors
- [ ] `dist/Gadget-CategoryBatchManager.css` - Styles look correct

---

## Wikimedia Commons Deployment

### 4. Upload JavaScript

**Page:** `MediaWiki:Gadget-CategoryBatchManager.js`

Steps:
1. [ ] Go to https://commons.wikimedia.org/wiki/MediaWiki:Gadget-CategoryBatchManager.js
2. [ ] Click "Edit"
3. [ ] Copy content from `dist/Gadget-CategoryBatchManager.js`
4. [ ] Paste into editor
5. [ ] Edit summary: "Update to v1.1.1 - Bug fixes and API improvements"
6. [ ] Save page

**Verification:**
- [ ] Page saved successfully
- [ ] No syntax errors shown
- [ ] File loads without errors

### 5. Upload CSS

**Page:** `MediaWiki:Gadget-CategoryBatchManager.css`

Steps:
1. [ ] Go to https://commons.wikimedia.org/wiki/MediaWiki:Gadget-CategoryBatchManager.css
2. [ ] Click "Edit"
3. [ ] Copy content from `dist/Gadget-CategoryBatchManager.css`
4. [ ] Paste into editor
5. [ ] Edit summary: "Update to v1.1.1 - Updated styles"
6. [ ] Save page

**Verification:**
- [ ] Page saved successfully
- [ ] Styles look correct

### 6. Update Gadget Definition

**Page:** `MediaWiki:Gadgets-definition`

Find the CategoryBatchManager entry and update if needed:
```
* CategoryBatchManager[ResourceLoader|default]|Gadget-CategoryBatchManager.js|Gadget-CategoryBatchManager.css
```

Steps:
1. [ ] Go to https://commons.wikimedia.org/wiki/MediaWiki:Gadgets-definition
2. [ ] Find CategoryBatchManager line
3. [ ] Verify syntax is correct
4. [ ] Save if changes needed

---

## Post-Deployment Testing

### 7. Functional Testing

**Test 1: Basic Load**
1. [ ] Clear browser cache
2. [ ] Reload Wikimedia Commons
3. [ ] Enable gadget in preferences
4. [ ] Verify gadget loads without errors

**Test 2: Search Functionality**
1. [ ] Go to a category page
2. [ ] Click "Batch Manager" in tools menu
3. [ ] Enter search pattern
4. [ ] Click "Search"
5. [ ] Verify results appear

**Test 3: File List Persistence (Critical)**
1. [ ] Search for files
2. [ ] Add a category
3. [ ] Click "GO"
4. [ ] **Verify files remain visible** ✅
5. [ ] Click "GO" again
6. [ ] **Verify files still visible** ✅

**Test 4: Preview Modal (Critical)**
1. [ ] Search for files
2. [ ] Click "Preview Changes"
3. [ ] **Verify modal opens** ✅
4. [ ] Click "Close"
5. [ ] **Verify modal closes** ✅
6. [ ] Open preview again
7. [ ] Click outside modal
8. [ ] **Verify modal closes** ✅

**Test 5: Category with Spaces (Critical)**
1. [ ] Enter category with spaces: "Life expectancy maps of South America (no data)"
2. [ ] Enter pattern: "177"
3. [ ] Click "Search"
4. [ ] **Verify results found** ✅

**Test 6: Batch Operations**
1. [ ] Search for files
2. [ ] Select files
3. [ ] Add categories
4. [ ] Click "GO"
5. [ ] Wait for completion
6. [ ] Verify success message
7. [ ] Check a few files manually to confirm categories added

---

## Monitoring

### 8. Check for Errors

**Browser Console:**
- [ ] No JavaScript errors
- [ ] No failed API calls
- [ ] No CSS warnings

**MediaWiki Logs:**
- [ ] No error logs related to gadget
- [ ] No performance issues reported

**User Feedback:**
- [ ] Monitor talk page for issues
- [ ] Monitor Commons Village Pump

---

## Documentation Updates

### 9. Update Help Pages

**Create/Update:**
1. [ ] Commons:Gadget-CategoryBatchManager (help page)
2. [ ] Add link from Commons:Gadgets
3. [ ] Update Commons:Batch uploading (if applicable)

**Content to include:**
- Installation instructions
- Usage examples
- New features in v1.1.1
- Link to full documentation

---

## Communication

### 10. Announce Update

**Where to announce:**
1. [ ] Commons:Village pump (technical)
2. [ ] Commons:Bots noticeboard (if applicable)
3. [ ] User talk pages of known users
4. [ ] Project documentation page

**Announcement template:**
```
== Category Batch Manager v1.1.1 Released ==

The Category Batch Manager gadget has been updated to version 1.1.1 with important bug fixes:

* '''Fixed:''' Search results now persist after clicking GO
* '''Fixed:''' Preview modal closes properly
* '''Fixed:''' Search works with category names containing spaces
* '''Improved:''' 33% fewer API calls for better performance

To use: Enable in [[Special:Preferences#mw-prefsection-gadgets|Preferences → Gadgets]]

See [[Commons:Gadget-CategoryBatchManager]] for details.

~~~~
```

Post announcements:
- [ ] Village pump
- [ ] Relevant project pages
- [ ] User notifications

---

## Rollback Plan

### 11. Prepare Rollback (Just in Case)

**Backup previous version:**
1. [ ] Save previous version of JS file
2. [ ] Save previous version of CSS file
3. [ ] Document version numbers

**If rollback needed:**
```bash
# Steps to rollback:
1. Go to page history
2. Find previous working version
3. Revert to that version
4. Post notice about temporary rollback
5. Investigate issue
```

**Rollback criteria:**
- Critical functionality broken
- Security issue discovered
- Performance significantly degraded
- Multiple user complaints

---

## Final Verification

### 12. Post-Deployment Checks (24 hours later)

**Usage Statistics:**
- [ ] Check gadget usage logs
- [ ] Monitor error rates
- [ ] Check performance metrics

**User Feedback:**
- [ ] Any complaints on talk page?
- [ ] Any questions from users?
- [ ] Any feature requests?

**Performance:**
- [ ] API usage within limits?
- [ ] No timeout errors?
- [ ] Response times acceptable?

---

## Success Criteria

Deployment is successful if:
- [x] All tests pass before deployment
- [ ] Build completes without errors
- [ ] Files upload successfully
- [ ] Gadget loads without errors
- [ ] Search results persist (critical fix verified)
- [ ] Modal closes properly (critical fix verified)
- [ ] Category spaces handled (critical fix verified)
- [ ] No critical bugs reported within 24 hours
- [ ] User feedback is positive
- [ ] Performance is acceptable

---

## Completion

- [ ] All deployment steps completed
- [ ] All tests passed
- [ ] Documentation updated
- [ ] Announcements posted
- [ ] Monitoring in place
- [ ] 24-hour check completed

**Deployment Date:** __________
**Deployed By:** __________
**Version:** 1.1.1
**Status:** ☐ Success ☐ Partial ☐ Rollback

---

## Notes

Use this space for deployment notes:

```
Deployment Notes:
-
-
-
```

---

## Post-Deployment Report

**After 1 week, complete this report:**

### Statistics
- Active users: _______
- Total operations: _______
- Success rate: _______%
- Error rate: _______%

### Feedback
- Positive: _______
- Negative: _______
- Feature requests: _______

### Issues
- Critical: _______
- Major: _______
- Minor: _______

### Conclusion
☐ Deployment successful - no action needed
☐ Minor issues - address in next release
☐ Major issues - hotfix required

---

**Remember:** Always test in a sandbox environment first if possible!

Good luck with the deployment! 🚀
