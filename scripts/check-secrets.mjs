import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));

// Geen geheimen afdrukken. Dit is een beperkte extra controle, geen vervanging van push protection.
const staged = process.argv.includes('--staged');
const args = staged ? ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z'] : ['ls-files', '--cached', '--others', '--exclude-standard', '-z'];
const files = execFileSync('git', args, { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
const problems = [];
const patterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{50,})\b/,
  /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/,
  /AIza[A-Za-z0-9_-]{35}/,
  /\bya29\.[A-Za-z0-9_-]{25,}/,
];
for (const file of files) {
  if (/(^|\/)(?:\.env(?:\..*)?|id_rsa|id_ed25519|credentials\.json|service[-_]account.*\.json)$/.test(file) && !file.endsWith('.env.example')) {
    problems.push(`${file}: bestand met mogelijke geheimen`);
    continue;
  }
  if (/\.(?:pem|p12|pfx|key)$/i.test(file)) { problems.push(`${file}: sleutelbestand`); continue; }
  if (!new Set(['.js', '.mjs', '.cjs', '.json', '.html', '.yml', '.yaml', '.toml', '.md', '.ps1', '.example']).has(extname(file))) continue;
  const text = staged
    ? execFileSync('git', ['show', `:${file}`], { cwd: root, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 })
    : await readFile(join(root, file), 'utf8');
  if (patterns.some(pattern => pattern.test(text))) problems.push(`${file}: mogelijk geheim; controleer lokaal`);
}
if (problems.length) { console.error(problems.join('\n')); process.exitCode = 1; }
else console.log(`Geen herkenbare sleutelbestanden of tokenpatronen gevonden (${staged ? 'staged inhoud' : 'werkmap en gevolgde bestanden'}).`);
