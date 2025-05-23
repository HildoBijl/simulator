# Excel Import Functionality Guide

This guide explains how to properly structure your Excel file for importing simulations. Following these guidelines will help ensure a smooth import process without complications.

## Excel File Structure

Your Excel file should contain the following sheets:

1. **Ordner** (Folders)
2. **Seiten** (Pages)
3. **Parameter** (Parameters) - Optional

### 1. Ordner Sheet (Folders)

The "Ordner" sheet requires the following columns:

| Column | Header | Description |
|--------|---------|-------------|
| A | ID | Unique identifier for the folder. Leave empty for new folders |
| B | In Ordner | ID of the parent folder (if this folder should be inside another folder) |
| C | Titel | The folder's title |

### 2. Seiten Sheet (Pages)

The "Seiten" sheet requires the following columns:

| Column | Header | Description |
|--------|---------|-------------|
| A | ID | Unique identifier for the page. Leave empty for new pages |
| B | In Ordner | ID of the folder this page belongs to (if any) |
| C | Titel | The page's title |
| D | Beschreibung | The page's description (supports Markdown formatting) |
| E | Antwortmöglichkeiten | Answer options (special format, see below) |

#### Answer Options Format
Each answer option should be on a new line with fields separated by pipe characters (|):
```
Description|Feedback|Follow-up Page ID|Update Script
```
Example:
```
Yes, I agree|Great choice!|page123|score += 1
No, I disagree|Consider reviewing...|page456|score -= 1
```

### 3. Parameter Sheet (Optional)

The "Parameter" sheet requires the following columns:

| Column | Header | Description |
|--------|---------|-------------|
| A | ID | Unique identifier for the parameter. Leave empty for new parameters |
| B | Name | Parameter name (must be unique) |
| C | Beschreibung | Parameter description |
| D | Standardwert | Default value |
| E | Minimalwert | Minimum value (optional) |
| F | Maximalwert | Maximum value (optional) |

## Best Practices

1. **IDs**
   - Leave ID fields empty for new items
   - Use existing IDs only when updating existing items
   - Never duplicate IDs within the same sheet

2. **Parent References**
   - When referencing parent folders, make sure the folder ID exists
   - Avoid circular references (folders can't contain themselves)
   - Main-level items should have empty "In Ordner" fields

3. **Text Formatting**
   - The description field supports Markdown formatting
   - Use line breaks in the "Antwortmöglichkeiten" field for multiple options
   - Ensure pipe characters (|) are only used as separators in answer options

4. **Parameters**
   - Parameter names must be unique
   - Default values are required
   - Min/Max values are optional but must be valid numbers if provided

## Common Issues to Avoid

1. **Header Issues**
   - Don't modify or rename the column headers
   - Keep headers in the first row
   - Ensure all required columns are present

2. **Data Format Issues**
   - Don't include formulas in cells
   - Avoid special characters in IDs
   - Keep answer options in the correct pipe-separated format

3. **Reference Issues**
   - Don't reference non-existent folder IDs
   - Avoid circular folder references
   - Ensure follow-up page IDs exist when referenced

## Import Process

1. Prepare your Excel file according to this guide
2. Go to the simulation edit page
3. Click on "Excel-Import/Export verwenden"
4. Upload your file
5. Review the proposed changes
6. Confirm to apply the changes

## Troubleshooting

If you encounter errors during import:

1. Check that all sheet names are correct (Ordner, Seiten, Parameter)
2. Verify that all required columns are present and in the correct order
3. Look for duplicate IDs within each sheet
4. Ensure all referenced IDs (folders, follow-up pages) exist
5. Validate that the answer options follow the correct format

For technical support or questions about specific errors, please contact the system administrator. 