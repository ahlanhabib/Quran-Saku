import fs from 'fs';
import path from 'path';

// Fix imports for components not fixed yet
const extraFiles = [
  'DzikirPagiPetangView.tsx',
  'DoaHarianView.tsx',
  'JurnalIbadahView.tsx',
  'KalkulatorZakatView.tsx',
  'KumpulanShalawatView.tsx',
  'TanyaUstadzView.tsx'
];

extraFiles.forEach(file => {
  const filePath = path.join(process.cwd(), 'src/components', file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('import { PageContainer }')) {
    content = 'import { PageContainer } from "./PageContainer";\n' + content;
    fs.writeFileSync(filePath, content);
    console.log("Added import to", file);
  }
});
