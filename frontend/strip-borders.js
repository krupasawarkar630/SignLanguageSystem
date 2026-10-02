const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

walkDir('./src', (filePath) => {
  if (filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Remove all black borders and neo-brutalist styles
    content = content.replace(/border-black/g, '');
    content = content.replace(/border-2/g, '');
    content = content.replace(/border-3/g, '');
    content = content.replace(/border-4/g, '');
    content = content.replace(/border-t-2/g, '');
    content = content.replace(/border-b-2/g, '');
    content = content.replace(/border-b-3/g, '');
    content = content.replace(/shadow-neo-[a-z]+/g, 'shadow-soft');
    content = content.replace(/shadow-neo/g, 'shadow-soft');
    content = content.replace(/shadow-\[[^\]]+\]/g, 'shadow-soft');
    
    // Clean up multiple spaces that might result from removal
    content = content.replace(/  +/g, ' ');
    content = content.replace(/ "/g, '"');
    content = content.replace(/" /g, '"');
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated', filePath);
    }
  }
});
