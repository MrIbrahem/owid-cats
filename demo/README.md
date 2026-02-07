# 📦 Distribution Folder - Category Batch Manager

This folder contains all the built and preview files for the Category Batch Manager project.

---

## 📁 Files Overview

### 🚀 Production Files (For Deployment)

| File | Size | Description |
|------|------|-------------|
| `Gadget-CategoryBatchManager.js` | ~49 KB | Main JavaScript bundle for production |
| `Gadget-CategoryBatchManager.css` | ~4 KB | Main CSS bundle for production |
| `js.js` | ~49 KB | Quick copy of JavaScript bundle |
| `css.css` | ~4 KB | Quick copy of CSS bundle |

**These files are ready to be deployed to Wikimedia Commons!**

### 🎨 Preview & Demo Files

| File | Purpose | Open in Browser |
|------|---------|-----------------|
| `index.html` | Main landing page | ⭐ **START HERE** |
| `modal.html` | Interactive preview with full functionality | 🎯 **RECOMMENDED** |
| `demo.html` | Advanced demo with testing controls | 🎮 **FOR TESTING** |
| `guide.html` | Complete usage guide in Arabic | 📖 **LEARN** |

### 📄 Documentation Files

| File | Description |
|------|-------------|
| `README_PREVIEW.md` | Technical documentation for preview files |
| `COMPLETION_SUMMARY.md` | Summary of completed features |
| `README.md` | This file |

---

## 🚀 Quick Start

### For Users:
1. Open `index.html` in your browser
2. Click "المعاينة التفاعلية" (Interactive Preview)
3. Try all the features!

### For Developers:
1. Open `demo.html` for advanced testing
2. Use the demo controls panel to test scenarios
3. Check console for logs and stats

### For Deployment:
1. Upload `Gadget-CategoryBatchManager.js` to MediaWiki:Gadget-CategoryBatchManager.js
2. Upload `Gadget-CategoryBatchManager.css` to MediaWiki:Gadget-CategoryBatchManager.css
3. Update gadget definition

---

## 🎯 File Usage Guide

### `index.html` - Landing Page
```
┌─────────────────────────────────┐
│   Category Batch Manager        │
│   الصفحة الرئيسية              │
├─────────────────────────────────┤
│                                 │
│  🎨 Interactive Preview         │
│  📖 Usage Guide                 │
│  📄 Technical Docs              │
│                                 │
│  Features, Stats, Links         │
└─────────────────────────────────┘
```

**Features:**
- Beautiful gradient design
- Quick access to all files
- Project statistics
- Feature highlights
- Arabic support (RTL)

**When to use:**
- First time visitors
- Overview of the project
- Quick navigation

---

### `modal.html` - Interactive Preview
```
┌─────────────────────────────────┐
│  Category Batch Manager         │
├─────────────────────────────────┤
│  Source Category: [_____]       │
│  Search Pattern:  [_____] [🔍] │
├─────────────────────────────────┤
│  ☑ File1.svg                    │
│  ☑ File2.svg                    │
│  ☐ File3.svg                    │
├─────────────────────────────────┤
│  Add: [__________]              │
│  Remove: [__________]           │
│  [Preview] [GO]                 │
└─────────────────────────────────┘
```

**Features:**
- Full UI functionality
- Mock data (8 sample files)
- All features working:
  - ✅ Search & filter
  - ✅ Select/deselect files
  - ✅ Add/remove categories
  - ✅ Preview modal
  - ✅ Progress bar
  - ✅ Results display
  - ✅ Error handling
  - ✅ Input validation

**When to use:**
- Testing the UI
- Demonstrating features
- UI/UX development
- Training users

**Keyboard shortcuts:**
- Enter in search field → Search
- ESC on preview modal → Close (planned)

---

### `demo.html` - Advanced Testing
```
┌─────────────────────────────────┐
│  Category Batch Manager         │
│  + Demo Controls Panel          │
├─────────────────────────────────┤
│  Main Interface                 │
│  (Same as modal.html)           │
└─────────────────────────────────┘
        ┌────────────────┐
        │ 🎮 Demo Panel  │
        ├────────────────┤
        │ Quick Actions  │
        │ Test Scenarios │
        │ UI Controls    │
        │ Console Tools  │
        └────────────────┘
```

**Extra Features:**
- Demo controls panel (toggleable)
- Quick action buttons
- Test scenario automation
- Extended mock data (12 files)
- Console logging
- Data export
- Statistics display

**Demo Controls:**
- 🔍 Quick Search (BLR)
- ✅ Select All + Add Categories
- 👁️ Preview Changes
- ▶️ Execute Batch
- 🗑️ Clear All
- 🔄 Reset Form
- 📊 Show Stats
- 💾 Export Data

**When to use:**
- Automated testing
- QA testing
- Performance testing
- Feature demonstration
- Developer testing

**How to toggle panel:**
- Click the 🎮 button (bottom right)
- Or hide it if it's in the way

---

### `guide.html` - Usage Guide
```
┌─────────────────────────────────┐
│  دليل الاستخدام الكامل         │
│  Category Batch Manager         │
├─────────────────────────────────┤
│  📋 Overview                    │
│  🚀 Quick Start                 │
│  💡 Examples                    │
│  ⚠️  Tips & Warnings            │
│  🎨 UI Explanation              │
│  🔍 Status Messages             │
│  🛠️  Troubleshooting            │
│  🔗 Useful Links                │
└─────────────────────────────────┘
```

**Content:**
- Complete guide in Arabic
- Step-by-step instructions
- Practical examples
- Tips and warnings
- Error solutions
- UI explanations
- Keyboard shortcuts

**When to use:**
- Learning how to use the tool
- Training new users
- Reference documentation
- Troubleshooting

---

## 🎨 Features Comparison

| Feature | modal.html | demo.html | Production |
|---------|-----------|-----------|------------|
| Full UI | ✅ | ✅ | ✅ |
| Mock Data | ✅ (8 files) | ✅ (12 files) | ❌ (Real API) |
| Demo Controls | ❌ | ✅ | ❌ |
| Quick Tests | ❌ | ✅ | ❌ |
| API Calls | ❌ Simulated | ❌ Simulated | ✅ Real |
| Save Changes | ❌ | ❌ | ✅ |
| Codex Design | ✅ | ✅ | ✅ |
| Responsive | ✅ | ✅ | ✅ |
| Arabic Support | ✅ | ✅ | ✅ |

---

## 🧪 Testing Workflows

### Workflow 1: Basic Testing
```
1. Open modal.html
2. Enter pattern: "BLR"
3. Click Search
4. Select files
5. Add categories
6. Preview
7. Execute
✅ Verify all steps work
```

### Workflow 2: Error Testing
```
1. Open modal.html
2. Click Preview (no files)
   → Should show warning
3. Search, don't select
4. Click Preview
   → Should show warning
5. Select files, no categories
6. Click Preview
   → Should show warning
✅ All validations work
```

### Workflow 3: Advanced Testing
```
1. Open demo.html
2. Click "Quick Search"
3. Click "Select All + Add"
4. Click "Preview Demo"
5. Click "Show Stats"
6. Click "Export Data"
7. Check console logs
✅ All automation works
```

---

## 📊 Performance Metrics

### File Sizes:
- `modal.html`: ~15 KB (with inline JS)
- `demo.html`: ~20 KB (with demo controls)
- `guide.html`: ~25 KB (with full guide)
- `index.html`: ~12 KB (landing page)

### Load Times (estimated):
- Local file: < 50ms
- With Codex CDN: < 200ms
- Production: < 300ms

### Browser Support:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

---

## 🔧 Customization

### Changing Mock Data:
Edit in `modal.html` or `demo.html`:
```javascript
const mockFiles = [
    { title: 'File:YourFile.svg', selected: false },
    // Add more...
];
```

### Adding Demo Actions:
Edit in `demo.html`:
```javascript
function yourCustomAction() {
    // Your code here
    console.log('Custom action executed');
}
```

### Changing Styles:
Edit `css.css` or add inline styles:
```css
.cbm-container {
    /* Your custom styles */
}
```

---

## 🐛 Known Issues & Limitations

### Preview Files (modal.html, demo.html):
- ❌ No real API calls
- ❌ No actual file saving
- ❌ Limited to mock data
- ✅ All UI features work
- ✅ All validations work
- ✅ All interactions work

### Workarounds:
1. Use for UI testing only
2. Use for training/demos
3. Deploy production files for real usage

---

## 📝 Development Notes

### Build Process:
```bash
# Build production files
npm run build

# Output:
# - demo/Gadget-CategoryBatchManager.js
# - demo/Gadget-CategoryBatchManager.css
```

### File Sources:
- `modal.html`: Hand-crafted preview
- `demo.html`: Extended from modal.html
- `guide.html`: Documentation page
- `index.html`: Landing page
- `js.js`: Copy from Gadget-CategoryBatchManager.js
- `css.css`: Copy from Gadget-CategoryBatchManager.css

---

## 🔗 Quick Links

### Preview Files:
- [index.html](../demo/index.html) - Landing page ⭐
- [modal.html](../demo/modal.html) - Interactive preview 🎯
- [demo.html](../demo/demo.html) - Advanced demo 🎮
- [guide.html](../demo/guide.html) - Usage guide 📖

### Documentation:
- [README_PREVIEW.md](README_PREVIEW.md) - Preview docs
- [COMPLETION_SUMMARY.md](COMPLETION_SUMMARY.md) - Summary
- [../docs/](../docs) - Full documentation
- [../README.md](../README.md) - Project README
- [../CHANGELOG.md](../CHANGELOG.md) - Changelog

### Production:
- [Gadget-CategoryBatchManager.js](../demo/Gadget-CategoryBatchManager.js)
- [Gadget-CategoryBatchManager.css](../demo/Gadget-CategoryBatchManager.css)

---

## 🎯 Recommended Usage

### For Different Users:

**👤 End Users:**
→ Use production version on Wikimedia Commons

**👨‍🏫 Trainers:**
→ Use `modal.html` for demonstrations

**🧪 Testers:**
→ Use `demo.html` for testing scenarios

**📚 Learners:**
→ Use `guide.html` for learning

**👨‍💻 Developers:**
→ Use all files + source code

---

## 📞 Support

### Getting Help:
1. Read `guide.html` first
2. Check `README_PREVIEW.md`
3. Review `../docs/` documentation
4. Check console for errors
5. Open browser DevTools

### Reporting Issues:
1. Check browser console
2. Note the steps to reproduce
3. Include browser version
4. Include OS version
5. Create GitHub issue

---

## 🎉 Summary

This `demo/` folder contains everything you need:

✅ **Production files** ready for deployment
✅ **Interactive preview** for testing
✅ **Advanced demo** for QA
✅ **Complete guide** for users
✅ **Landing page** for navigation

**Start with `index.html` and explore!**

---

**Last Updated:** February 7, 2026
**Version:** 1.1.1
**Maintainer:** Category Batch Manager Team
