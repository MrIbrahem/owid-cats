# Usage Examples

## Practical Examples for Category Batch Manager

### Example 1: Adding Country Category to Files

**Goal:** Add `Category:Belarus` to all Belarus-related files

**Steps:**
1. Navigate to category page or enter manually
2. Source Category: `Category:Uploaded_by_OWID_importer_tool`
3. Search Pattern: `,BLR.svg`
4. Click "Search"
5. Add Categories: `Category:Belarus, Category:Europe`
6. Click "GO"

**Result:** All files with `,BLR.svg` will be categorized

---

### Example 2: Replacing Old Category

**Goal:** Replace deprecated category with new one

**Steps:**
1. Source Category: `Category:Economic_Charts`
2. Search Pattern: `GDP`
3. Add Categories: `Category:GDP_Indicators_2024`
4. Remove Categories: `Category:Old_Economic_Data`
5. Preview changes (optional)
6. Click "GO"

---

### Example 3: Large Category Search (100K+ files)

**Scenario:** Category has 150,000 files, need only 200

**Steps:**
1. Source Category: `Category:Charts`
2. Search Pattern: `Population_density`
3. Click "Search" - **Returns only matches in seconds!**
4. Review ~200 results
5. Add categories
6. Execute

**Performance:** Loads 200 files instead of 150,000!

---

## Common Search Patterns

| Pattern | Matches | Example |
|---------|---------|---------|
| `,BLR.svg` | Belarus files | `Chart_GDP,BLR.svg` |
| `_indicator_` | Indicators | `Economic_indicator_2020.svg` |
| `Chart_` | All charts | `Chart_Population.svg` |
| `2023` | 2023 files | `Data_2023_Report.svg` |

---

## Tips

### Best Practices
- ✅ Use specific patterns: `Chart_GDP,BLR.svg`
- ✅ Preview large operations
- ✅ Test on 5-10 files first
- ✅ Use full category names: `Category:Example`

### Common Mistakes
- ❌ Generic patterns: `Chart`
- ❌ Missing prefix: `Belarus` instead of `Category:Belarus`
- ❌ No preview for 50+ files

---

## FAQ

**Q: Maximum files per batch?**
A: Up to 5000, recommended 100-500

**Q: Can I undo?**
A: No undo, but can reverse (add→remove, remove→add)

**Q: Why so fast?**
A: Uses Search API instead of loading all files. See [PERFORMANCE.md](PERFORMANCE.md)

**Q: Multiple categories?**
A: Run tool separately for each category
