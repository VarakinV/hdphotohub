const { execSync } = require('child_process');
const fs = require('fs');
const cwd = 'c:/Users/volod/Desktop/NextJS/hdphotohub-clone';
const out = cwd + '/git-result.txt';
try {
  execSync('git add -A', { cwd, encoding: 'utf8', stdio: 'pipe' });
  const status = execSync('git status --short', { cwd, encoding: 'utf8', stdio: 'pipe' });
  execSync('git commit -m "feat: AI Reel generation, searchable realtor filter, email normalization, delivery page updates"', { cwd, encoding: 'utf8', stdio: 'pipe' });
  const push = execSync('git push origin main', { cwd, encoding: 'utf8', stdio: 'pipe', timeout: 60000 });
  fs.writeFileSync(out, 'SUCCESS\nStatus:\n' + status + '\nPush:\n' + push);
} catch (e) {
  fs.writeFileSync(out, 'ERROR\nSTDOUT: ' + (e.stdout || '') + '\nSTDERR: ' + (e.stderr || ''));
}
