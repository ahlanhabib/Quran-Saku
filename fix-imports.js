import fs from 'fs';
import path from 'path';

const dir = path.join(process.cwd(), 'src/components');
const files = fs.readdirSync(dir);

files.forEach(file => {
  if (!file.endsWith('.tsx')) return;
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix the broken import
  if (content.includes("import React\nimport { PageContainer } from \"./PageContainer\";, { useState")) {
     content = content.replace("import React\nimport { PageContainer } from \"./PageContainer\";, { useState", "import React, { useState");
     // add page container properly
     content = content.replace("import React, { useState", "import { PageContainer } from \"./PageContainer\";\nimport React, { useState");
     fs.writeFileSync(filePath, content);
     console.log("Fixed", file);
  }
  else if (content.includes("import React\nimport { PageContainer } from \"./PageContainer\";, {")) {
     content = content.replace("import React\nimport { PageContainer } from \"./PageContainer\";, {", "import { PageContainer } from \"./PageContainer\";\nimport React, {");
     fs.writeFileSync(filePath, content);
     console.log("Fixed", file);
  }
});
