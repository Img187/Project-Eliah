import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import { join, sep } from 'node:path';
import { root } from '../scripts/prepare-pages.mjs';

test('secretcontrole ziet staged inhoud en drukt een aangetroffen waarde niet af', async t => {
  const build = join(await realpath(root), 'build');
  await mkdir(build, { recursive: true });
  const fixture = await mkdtemp(join(build, 'secret-check-'));
  t.after(async () => {
    const actual = await realpath(fixture);
    if (!actual.startsWith(build + sep)) throw new Error('Onveilig testopruimpad');
    await rm(actual, { recursive: true, force: true });
  });
  await mkdir(join(fixture, 'scripts'));
  for (const name of ['prepare-pages.mjs', 'check-secrets.mjs']) await copyFile(join(root, 'scripts', name), join(fixture, 'scripts', name));
  execFileSync('git', ['init', '-q'], { cwd: fixture });
  const synthetic = 'ghp_' + 'x'.repeat(36);
  await writeFile(join(fixture, 'fixture.js'), `const token = '${synthetic}';\n`);
  execFileSync('git', ['add', 'fixture.js'], { cwd: fixture });
  await writeFile(join(fixture, 'fixture.js'), '// Schoon in werkmap, staged versie moet nog worden gevonden.\n');
  const run = args => spawnSync(process.execPath, ['scripts/check-secrets.mjs', ...args], { cwd: fixture, encoding: 'utf8' });
  const staged = run(['--staged']);
  assert.equal(staged.status, 1);
  assert.match(staged.stderr, /fixture\.js/);
  assert.ok(!staged.stderr.includes(synthetic));
  assert.equal(run([]).status, 0);
  execFileSync('git', ['add', 'fixture.js'], { cwd: fixture });
  assert.equal(run(['--staged']).status, 0);
  await writeFile(join(fixture, '.env'), 'SYNTHETIC=fixture\n');
  execFileSync('git', ['add', '.env'], { cwd: fixture });
  assert.equal(run(['--staged']).status, 1);
});
