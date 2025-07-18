#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all page.tsx files
const pageFiles = glob.sync('src/app/**/page.tsx', { 
  cwd: process.cwd(),
  ignore: ['src/app/page.tsx', 'src/app/dashboard/page.tsx', 'src/app/documents/create/page.tsx']
});

console.log(`Found ${pageFiles.length} page files to process`);

pageFiles.forEach(filePath => {
  const absolutePath = path.join(process.cwd(), filePath);
  let content = fs.readFileSync(absolutePath, 'utf8');
  
  // Skip if already has error boundary
  if (content.includes('PageErrorBoundary') || content.includes('withErrorBoundary')) {
    console.log(`Skipping ${filePath} - already has error boundary`);
    return;
  }
  
  // Skip if not a valid React component file
  if (!content.includes('export default function')) {
    console.log(`Skipping ${filePath} - no default export function`);
    return;
  }
  
  // Add import
  if (!content.includes('import { PageErrorBoundary }')) {
    const importMatch = content.match(/^('use client'[^\n]*\n\n)/);
    if (importMatch) {
      const beforeImports = importMatch[0];
      const afterImports = content.substring(importMatch[0].length);
      
      // Find the last import
      const lastImportMatch = afterImports.match(/^import[^;]+;$/gm);
      if (lastImportMatch) {
        const lastImport = lastImportMatch[lastImportMatch.length - 1];
        const lastImportIndex = afterImports.indexOf(lastImport) + lastImport.length;
        
        const beforeLastImport = afterImports.substring(0, lastImportIndex);
        const afterLastImport = afterImports.substring(lastImportIndex);
        
        content = beforeImports + beforeLastImport + 
                 '\nimport { PageErrorBoundary } from \'@/components/error/withErrorBoundary\';' + 
                 afterLastImport;
      }
    }
  }
  
  // Find the export default function
  const exportMatch = content.match(/export default function (\w+)\(/);
  if (exportMatch) {
    const functionName = exportMatch[1];
    const originalFunctionName = functionName + 'Content';
    
    // Rename the function
    content = content.replace(
      `export default function ${functionName}(`,
      `function ${originalFunctionName}(`
    );
    
    // Add the wrapper export
    content += `\n\nexport default function ${functionName}() {
  return (
    <PageErrorBoundary>
      <${originalFunctionName} />
    </PageErrorBoundary>
  );
}`;
  }
  
  fs.writeFileSync(absolutePath, content);
  console.log(`Updated ${filePath}`);
});

console.log('Error boundaries added to all page files');