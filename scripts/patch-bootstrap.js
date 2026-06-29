const fs = require('fs');
const p = 'node_modules/bootstrap/dist/css/bootstrap.min.css';
if (fs.existsSync(p)) {
  let content = fs.readFileSync(p, 'utf8');
  if (content.includes('@charset')) {
    content = content.replace(/@charset ["']UTF-8["'];?/gi, '');
    fs.writeFileSync(p, content);
    console.log('Patched bootstrap.min.css to remove @charset');
  }
}
