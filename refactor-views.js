import fs from 'fs';
import path from 'path';

const filesToUpdate = [
  'AsmaulHusnaView.tsx',
  'RadioIslamView.tsx',
  'ArahKiblatView.tsx',
  'KisahNabiView.tsx',
  'KalenderView.tsx',
  'FikihView.tsx',
  'KumpulanShalawatView.tsx',
  'KalkulatorWarisView.tsx',
  'TasbihView.tsx',
  'CariView.tsx',
  'KhutbahJumatView.tsx',
  'HaditsView.tsx',
  'TadarusView.tsx',
];

filesToUpdate.forEach(file => {
  const filePath = path.join(process.cwd(), 'src/components', file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Add import if not present
  if (!content.includes("import { PageContainer }")) {
    content = content.replace(
      /(import React.*?;?)/,
      "$1\nimport { PageContainer } from \"./PageContainer\";"
    );
  }
  
  const divRegex = /return\s*\(\s*<div className="flex flex-col h-full bg-\[\#FDFBF7\] relative max-w-2xl mx-auto w-full">/g;
  
  if (divRegex.test(content)) {
    content = content.replace(divRegex, 'return (\n    <PageContainer>');
    // Now replace the matching closing </div>
    // Replace the very last </div> before );
    content = content.replace(/<\/div>(\s*\)\s*;\s*)$/, '</PageContainer>$1');
    content = content.replace(/<\/div>(\s*\)\s*;\s*\}\s*)$/, '</PageContainer>$1');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Updated", file);
  } else {
    console.log("Skipped", file, "no exact match");
  }
});
