const git = require('isomorphic-git');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'backend');
const frontendDir = path.join(rootDir, 'frontend');

async function initRepo(dir, name) {
  console.log(`[Git] Initializing git repository in ${name}...`);
  await git.init({ fs, dir, defaultBranch: 'main' });

  console.log(`[Git] Staging files in ${name}...`);
  await git.statusMatrix({ fs, dir }).then(async (status) => {
    for (const [filepath, head, workdir, stage] of status) {
      if (workdir !== 0 && !filepath.startsWith('node_modules') && !filepath.startsWith('.next')) {
        await git.add({ fs, dir, filepath });
      }
    }
  });

  console.log(`[Git] Creating initial commit in ${name}...`);
  const sha = await git.commit({
    fs,
    dir,
    author: {
      name: 'Care Guide BD Candidate',
      email: 'candidate@careguidebd.com',
    },
    message: `Initial commit: ${name} repository for Doctor Tracker`,
  });

  console.log(`[Git] Initialized ${name} (commit: ${sha.slice(0, 7)})`);
}

async function main() {
  await initRepo(backendDir, 'backend');
  await initRepo(frontendDir, 'frontend');
  console.log('✅ Both repositories successfully initialized with .git!');
}

main().catch((err) => {
  console.error('[Git Init Error]', err);
  process.exit(1);
});
