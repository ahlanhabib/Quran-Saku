import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'src/components', 'SettingsView.tsx');
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes("import { PageContainer }")) {
  content = content.replace(
    /(import React.*?;?)/,
    "$1\nimport { PageContainer } from \"./PageContainer\";"
  );
}

const divRegex = /return\s*\(\s*<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start max-w-5xl mx-auto w-full\s*">/g;

if (divRegex.test(content) || content.includes('<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start max-w-5xl mx-auto w-full">')) {
  // Try simple replace
  content = content.replace('<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start max-w-5xl mx-auto w-full">', '<PageContainer isGrid>');
  
  content = content.replace(/<\/div>(\s*\)\s*;\s*)$/, '</PageContainer>$1');
  content = content.replace(/<\/div>(\s*\)\s*;\s*\}\s*)$/, '</PageContainer>$1');
  fs.writeFileSync(filePath, content, 'utf8');
  console.log("Updated SettingsView.tsx");
} else {
  console.log("No match");
}
