const fs = require('fs');
const path = require('path');

function replaceAliasesInDirectory(directory, srcDir) {
  const files = fs.readdirSync(directory);

  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      replaceAliasesInDirectory(fullPath, srcDir);
    } else if (/\.(ts|tsx|js|jsx)$/.test(file)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Regex to match imports/exports like: from "@/..." or import "@/..."
      const regex = /(from\s+|import\s+)['"]@\/(.*?)['"]/g;
      
      let modified = false;
      content = content.replace(regex, (match, prefix, importPath) => {
        modified = true;
        const currentDir = path.dirname(fullPath);
        const targetPath = path.join(srcDir, importPath);
        
        let relPath = path.relative(currentDir, targetPath);
        if (!relPath.startsWith('.')) {
          relPath = './' + relPath;
        }
        
        // Ensure standard forward slashes for imports
        relPath = relPath.replace(/\\/g, '/');
        
        return `${prefix}"${relPath}"`;
      });
      
      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

const rootDir = process.cwd();
const backendSrc = path.join(rootDir, 'backend', 'src');
const frontendSrc = path.join(rootDir, 'frontend', 'src');

if (fs.existsSync(backendSrc)) {
  console.log('Processing backend...');
  replaceAliasesInDirectory(backendSrc, backendSrc);
}

if (fs.existsSync(frontendSrc)) {
  console.log('Processing frontend...');
  replaceAliasesInDirectory(frontendSrc, frontendSrc);
}

console.log('Done.');
