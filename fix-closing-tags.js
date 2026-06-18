import fs from 'fs';
import path from 'path';

const dir = path.join(process.cwd(), 'src/components');
const files = fs.readdirSync(dir);

files.forEach(file => {
  if (!file.endsWith('.tsx')) return;
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // We are looking for any file that starts with <PageContainer> but ends with </div>
  // Specifically the bottom pattern: </div>\n  );\n};
  // But ONLY if it has <PageContainer> somewhere!
  if (content.includes('<PageContainer') && !content.includes('</PageContainer>')) {
    content = content.replace(/<\/div>(\s*\)\s*;\s*\n?\s*\}\s*;?\s*)$/, '</PageContainer>$1');
    fs.writeFileSync(filePath, content);
    console.log("Fixed closing tag in", file);
  }
});
