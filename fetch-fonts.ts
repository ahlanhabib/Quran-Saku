import https from 'https';
import fs from 'fs';

const getFont = (url: string) => new Promise<string>((resolve) => {
  https.get(url, (res) => {
    let chunks: Buffer[] = [];
    res.on('data', (c) => chunks.push(c));
    res.on('end', () => resolve(Buffer.concat(chunks).toString('base64')));
  });
});

async function run() {
  const regular = await getFont('https://fonts.gstatic.com/s/scheherazadenew/v21/4UaZrFhTvxVnHDvUkUiHg8jprP4DCwM.ttf');
  const bold = await getFont('https://fonts.gstatic.com/s/scheherazadenew/v21/4UaerFhTvxVnHDvUkUiHg8jprP4DM79DHlY.ttf');
  
  const output = `
export const fontRegularBase64 = "data:font/ttf;base64," + "${regular}";
export const fontBoldBase64 = "data:font/ttf;base64," + "${bold}";
  `;
  
  fs.writeFileSync('src/fonts.ts', output);
  console.log("Wrote fonts");
}

run();
