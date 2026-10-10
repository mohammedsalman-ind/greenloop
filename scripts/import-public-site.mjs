import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const source = new URL('../greenloop-3d/dist/', import.meta.url);
const destination = new URL('../frontend/public/landing/', import.meta.url);
await mkdir(destination, { recursive: true });
await cp(new URL('assets/', source), new URL('assets/', destination), { recursive: true });
for (const name of ['index.html', 'app.js', 'styles.css']) {
  let text = (await readFile(new URL(name, source), 'utf8')).replaceAll('./assets/', '/landing/assets/');
  if (name === 'index.html') {
    text = text.replaceAll('./styles.css', '/landing/styles.css').replaceAll('./app.js', '/landing/app.js')
      .replace('<script src="/landing/app.js" defer></script>', '<script>window.GREENLOOP_CONFIG = { platformUrl: "/app" };</script><script src="/landing/app.js" defer></script>')
      .replace('href="#marketplace" data-go="6" class="platform-button', 'href="/app" class="platform-button');
  }
  await writeFile(new URL(name, destination), text);
}
await cp(new URL('../greenloop-3d/ASSETS.md', import.meta.url), new URL('ASSETS.md', destination));
console.log(`Imported the public experience into ${fileURLToPath(destination)}`);
