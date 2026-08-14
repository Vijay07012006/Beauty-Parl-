import { execSync } from 'child_process';

const args = process.argv.slice(2);
let name = 'Migration';
for (let i = 0; i < args.length; i++) {
  if ((args[i] === '-n' || args[i] === '--name') && args[i + 1]) {
    name = args[i + 1];
    args.splice(i, 2);
    i--;
  }
}

const cmd = `npx typeorm-ts-node-commonjs migration:generate src/migrations/${name} -d src/data-source.ts ${args.join(' ')}`;
console.log(`🚀 Running migration generation: ${cmd}`);
try {
  execSync(cmd, { stdio: 'inherit' });
} catch (e) {
  process.exit(1);
}
