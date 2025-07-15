# Print Preview System Documentation

## Overview

The Real Estate CRM features a world-class print preview system that provides professional document formatting with enterprise-grade features. This system allows users to preview, customize, and print documents with precise control over layout, formatting, and appearance.

## Features

### 🖼️ **Print Preview Component**
- **File**: `src/components/documents/PrintPreview.tsx`
- **Full-screen modal** with responsive design
- **Real-time document preview** with accurate paper simulation
- **Professional styling** with Times New Roman typography for documents

### 🔧 **Control Features**

#### Zoom Controls
- **Range**: 25% to 200% zoom levels
- **Increment**: Predefined zoom steps (25, 50, 75, 100, 125, 150, 200)
- **Keyboard shortcuts**: 
  - `Ctrl/Cmd + +` or `Ctrl/Cmd + =` - Zoom in
  - `Ctrl/Cmd + -` - Zoom out
- **Reset button** to return to 100% zoom

#### Paper Settings
- **Paper sizes**: A4 (210×297mm), Letter (8.5×11in), Legal (8.5×14in)
- **Orientation toggle**: Portrait ↔ Landscape
- **Live preview updates** when settings change

#### Margin Controls
- **Customizable margins**: Top, Right, Bottom, Left
- **Range**: 0-50mm with real-time preview
- **Visual representation** in the preview

#### Additional Controls
- **Fullscreen toggle** for maximum preview area
- **Settings panel** with collapsible interface
- **Quick actions** for common tasks

### ⌨️ **Keyboard Shortcuts**

| Shortcut | Action |
|----------|--------|
| `Escape` | Close print preview |
| `Ctrl/Cmd + P` | Print document |
| `Ctrl/Cmd + +` | Zoom in |
| `Ctrl/Cmd + -` | Zoom out |

### 🎯 **Access Methods**

#### 1. Modal Mode
- **Trigger**: "Print Preview" button on document view page
- **Location**: `/documents/[id]` page
- **Behavior**: Opens as overlay modal

#### 2. Standalone Mode
- **URL**: `/documents/[id]/print-preview`
- **Behavior**: Full-page print preview experience
- **Navigation**: Back button returns to document view

## Technical Implementation

### Component Structure

```typescript
interface PrintPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    id: string;
    title: string;
    content: string;
    document_templates?: any;
    field_values?: Record<string, any>;
  };
  onPrint?: () => void;
  onDownload?: () => void;
}
```

### CSS Architecture

#### Print-Specific Styles
- **Font**: Times New Roman for professional document appearance
- **Font size**: 12pt for print optimization
- **Line height**: 1.6 for readability
- **Print media queries** for clean output

#### Typography Hierarchy
- **H1**: 18pt, bold, uppercase, center-aligned with border
- **H2**: 14pt, bold, uppercase with underline
- **H3**: 12pt, bold with underline
- **Body**: 12pt, justified text alignment

#### Layout Features
- **Paper simulation** with realistic shadows and borders
- **Responsive scaling** based on container size
- **Accurate dimensions** matching real paper sizes

### State Management

```typescript
const [zoom, setZoom] = useState(100);
const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
const [paperSize, setPaperSize] = useState<'A4' | 'Letter' | 'Legal'>('A4');
const [margins, setMargins] = useState({ top: 20, right: 20, bottom: 20, left: 20 });
```

## Integration Guide

### Adding Print Preview to New Documents

1. **Import the component**:
```typescript
import PrintPreview from '@/components/documents/PrintPreview';
```

2. **Add state management**:
```typescript
const [showPrintPreview, setShowPrintPreview] = useState(false);
```

3. **Add trigger button**:
```typescript
<Button onClick={() => setShowPrintPreview(true)}>
  <Eye className="w-4 h-4 mr-2" />
  Print Preview
</Button>
```

4. **Include component**:
```typescript
<PrintPreview
  isOpen={showPrintPreview}
  onClose={() => setShowPrintPreview(false)}
  document={{
    id: document.id,
    title: document.title,
    content: generateContent(),
    document_templates: document.document_templates,
    field_values: document.field_values
  }}
  onPrint={() => window.print()}
  onDownload={handlePDFGeneration}
/>
```

### Content Generation

The print preview automatically processes document templates and replaces placeholders:

```typescript
const generateContent = () => {
  let content = document.document_templates.template_content;
  
  if (document.field_values) {
    Object.entries(document.field_values).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      content = content.replace(new RegExp(placeholder, 'g'), String(value || ''));
    });
  }
  
  return content;
};
```

## Browser Compatibility

### Supported Browsers
- **Chrome/Chromium**: Full feature support
- **Firefox**: Full feature support
- **Safari**: Full feature support
- **Edge**: Full feature support

### Print Behavior
- **Media queries** ensure clean print output
- **No UI elements** printed (buttons, controls hidden)
- **Optimized typography** for print medium
- **Proper page breaks** for multi-page documents

## Performance Considerations

### Optimization Features
- **Lazy loading** of preview content
- **Debounced zoom updates** for smooth interaction
- **Efficient re-rendering** with React optimization
- **Memory management** for large documents

### Best Practices
- **Limit zoom frequency** to prevent performance issues
- **Use CSS transforms** for smooth zoom transitions
- **Minimize DOM updates** during preview changes

## Customization Options

### Styling Customization
Modify styles in the component's embedded CSS:

```css
.document-preview-content {
  font-family: 'Times New Roman', serif;
  line-height: 1.6;
  color: #000;
  font-size: 12pt;
}
```

### Paper Size Extension
Add new paper sizes to the `paperSizes` object:

```typescript
const paperSizes = {
  A4: { width: 210, height: 297 },
  Letter: { width: 216, height: 279 },
  Legal: { width: 216, height: 356 },
  // Add new sizes here
  A3: { width: 297, height: 420 }
};
```

### Zoom Level Customization
Modify the `zoomLevels` array:

```typescript
const zoomLevels = [25, 50, 75, 100, 125, 150, 200, 300]; // Add 300%
```

## Troubleshooting

### Common Issues

#### 1. Content Not Displaying
- **Check**: Document template content exists
- **Verify**: Field values are properly formatted
- **Solution**: Ensure `generateContent()` returns valid HTML

#### 2. Print Output Differs from Preview
- **Check**: Print media queries are applied
- **Verify**: Browser print settings
- **Solution**: Test with different browsers

#### 3. Performance Issues
- **Check**: Document size and complexity
- **Verify**: Zoom level frequency
- **Solution**: Implement debouncing for zoom changes

#### 4. Responsive Issues
- **Check**: Container dimensions
- **Verify**: Viewport meta tag
- **Solution**: Test on different screen sizes

### Debug Tips

1. **Console logging**: Enable debug mode in component
2. **CSS inspection**: Use browser dev tools to inspect print styles
3. **Print simulation**: Use browser's print preview to compare
4. **Performance monitoring**: Check for memory leaks with large documents

## Future Enhancements

### Planned Features
- **Custom CSS injection** for advanced styling
- **Watermark support** for draft documents
- **Header/footer customization** with page numbers
- **Export to various formats** (PNG, JPEG for images)
- **Collaborative preview** for multi-user review
- **Template preview mode** for template designers

### API Extensions
- **Print settings persistence** per user
- **Custom paper size definitions** in database
- **Print analytics** and usage tracking
- **Batch print operations** for multiple documents