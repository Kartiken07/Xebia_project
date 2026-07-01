import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const routesDir = path.join(__dirname, '..', 'routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

files.forEach(file => {
  const p = path.join(routesDir, file);
  let content = fs.readFileSync(p, 'utf8');

  // 1. Make handlers async
  content = content.replace(/router\.(get|post|put|delete)\('([^']+)',\s*(?:authenticateToken(?:,\s*requireRole\([^)]+\))?,\s*)?\(req,\s*res\)\s*=>\s*\{/g, (match) => {
    return match.replace('(req, res) => {', 'async (req, res) => {');
  });

  // 2. Add await to db calls
  content = content.replace(/db\.([a-zA-Z]+)\.(find|findOne|findById|create|findByIdAndUpdate|updateOne|deleteMany|deleteOne)\(/g, 'await db.$1.$2(');

  // Fix double awaits if any
  content = content.replace(/await\s+await\s+db/g, 'await db');
  
  // Fix assignments inside .forEach to be async if we need them, but it's easier to manually fix the 3 files.

  fs.writeFileSync(p, content, 'utf8');
});
console.log('Refactoring complete.');
