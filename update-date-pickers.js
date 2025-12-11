const fs = require('fs');
const path = require('path');

const files = [
  'src/components/documents/upload-document-dialog.tsx',
  'src/app/dashboard/vehicles/page.tsx',
  'src/app/dashboard/vehicles/new/page.tsx',
  'src/app/dashboard/vehicles/[id]/page.tsx',
  'src/app/dashboard/vehicles/[id]/edit/page.tsx',
  'src/app/dashboard/vehicles/[id]/documents/[documentId]/edit/page.tsx',
];

files.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`Skipping ${filePath} - file not found`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // Add DatePicker import if not present
  if (!content.includes('DatePicker')) {
    // Find the last import from @/components/ui
    const lastUIImportRegex = /import .+ from "@\/components\/ui\/[^"]+";/g;
    const matches = [...content.matchAll(lastUIImportRegex)];

    if (matches.length > 0) {
      const lastMatch = matches[matches.length - 1];
      const insertIndex = lastMatch.index + lastMatch[0].length;
      content = content.slice(0, insertIndex) +
                '\nimport { DatePicker } from "@/components/ui/date-picker";' +
                content.slice(insertIndex);
      modified = true;
      console.log(`Added DatePicker import to ${filePath}`);
    }
  }

  // Replace all type="date" inputs with DatePicker
  // Pattern 1: Simple onChange with e.target.value
  content = content.replace(
    /<Input\s+type="date"\s+value=\{([^}]+)\}\s+onChange=\{(\([^)]+\))\s*=>\s*\{([^}]+)\.([^}]+)\s*=\s*e\.target\.value;?\s*\}\}/g,
    (match, value, params, obj, field) => {
      modified = true;
      return `<DatePicker
                value={${value}}
                onChange={(date) => { ${obj}.${field} = date ? date.toISOString().split('T')[0] : undefined; }}
                placeholder="Select date"`;
    }
  );

  // Pattern 2: With onChange that calls a function
  content = content.replace(
    /<Input\s+type="date"\s+value=\{([^}]+)\}\s+onChange=\{(\([^)]+\))\s*=>\s*([^}]+)\(([^)]*)\)\}/g,
    (match, value, params, funcName, funcArgs) => {
      modified = true;
      // Parse the function arguments to replace e.target.value with date conversion
      const newArgs = funcArgs.replace(/e\.target\.value/g, 'date ? date.toISOString().split(\'T\')[0] : undefined');
      return `<DatePicker
                value={${value}}
                onChange={(date) => ${funcName}(${newArgs})}
                placeholder="Select date"`;
    }
  );

  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Updated ${filePath}`);
  } else {
    console.log(`⏭️  Skipped ${filePath} - no changes needed`);
  }
});

console.log('\n✨ Date picker update complete!');
