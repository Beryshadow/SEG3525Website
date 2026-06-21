const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('src');
const bsClasses = new Set();
files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const matches = content.match(/className=["']([^"']+)["']/g);
  if(matches) {
    matches.forEach(m => {
      const classes = m.replace(/className=["']([^"']+)["']/, '$1').split(' ');
      classes.forEach(c => bsClasses.add(c.trim()));
    });
  }
});

const arr = Array.from(bsClasses).filter(c => 
  /^(row|col|container-fluid|navbar|sticky-top|w-100|h-100)$/.test(c) || 
  c.startsWith('col-') || 
  c.startsWith('d-') || 
  c.startsWith('align-items-') || 
  c.startsWith('justify-content-') || 
  c.startsWith('order-') || 
  c.startsWith('g-')
);
console.log(arr.sort().join('\n'));
