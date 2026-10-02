const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const chars = {
  sharma_sir: 'sharma-sir',
  didi: 'didi',
  filmy_raj: 'filmy-raj',
  coach_vikram: 'coach-vikram',
  dr_cosmo: 'dr-cosmo',
};

const stateMap = {
  idle: 'idle.webp',
  thinking: 'thinking.webp',
  correct: 'clapping.webp',
  wrong: 'disappointed.webp',
  celebrate: 'celebrating.webp',
  talking: 'clapping.webp',
};

const manifests = {};

for (const [target, source] of Object.entries(chars)) {
  const targetDir = path.join(projectRoot, 'public', 'mascots', target);
  fs.mkdirSync(targetDir, { recursive: true });

  manifests[target] = {
    id: target,
    name: target.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    states: {},
  };

  for (const [state, srcFilename] of Object.entries(stateMap)) {
    const srcFile = path.join(projectRoot, 'public', 'assets', 'characters', source, srcFilename);
    const destFile = path.join(targetDir, `${state}.webp`);

    if (fs.existsSync(srcFile)) {
      fs.copyFileSync(srcFile, destFile);
    }

    manifests[target].states[state] = {
      webm: `/mascots/${target}/${state}.webm`,
      mp4: `/mascots/${target}/${state}.mp4`,
      poster: `/mascots/${target}/${state}.webp`,
      fallbackPoster: `/assets/characters/${source}/${srcFilename}`,
      loop: state === 'idle' || state === 'talking',
    };
  }
}

// Write /public/mascots/manifest.json
const manifestPath = path.join(projectRoot, 'public', 'mascots', 'manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifests, null, 2), 'utf-8');

console.log('Mascot assets & manifest.json generated successfully!');
