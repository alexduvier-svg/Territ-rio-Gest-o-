// Prepara o modelo de voz em português do Vosk dentro dos assets do Android.
// O modelo não vai para o Git (32 MB): este script baixa da fonte oficial, confere o SHA-256
// aprovado e descompacta em android/app/src/main/assets/model-pt, com o arquivo uuid que o
// StorageService do Vosk usa para saber se a cópia no aparelho está atualizada.
//
// Uso: node tools/fetch-vosk-model.mjs [caminho/do/zip/já/baixado]

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync, renameSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

export const MODEL = {
  name: 'vosk-model-small-pt-0.3',
  url: 'https://alphacephei.com/vosk/models/vosk-model-small-pt-0.3.zip',
  license: 'Apache-2.0',
  source: 'https://alphacephei.com/vosk/models',
  sha256: '6e1ce909032e1afa7a88e68a3d628ecafff302bdf195befab308826c395e93b7',
};

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = join(root, 'android', 'app', 'src', 'main', 'assets', 'model-pt');

if (existsSync(join(target, 'uuid')) && readFileSync(join(target, 'uuid'), 'utf8').trim() === MODEL.sha256) {
  console.log(`${MODEL.name} já está pronto em ${target}`);
  process.exit(0);
}

const work = join(tmpdir(), 'agro-gestao-vosk');
mkdirSync(work, { recursive: true });
const zip = process.argv[2] ? resolve(process.argv[2]) : join(work, `${MODEL.name}.zip`);
if (!existsSync(zip)) {
  console.log(`Baixando ${MODEL.url}…`);
  const response = await fetch(MODEL.url);
  if (!response.ok) throw new Error(`Download falhou: HTTP ${response.status}`);
  writeFileSync(zip, Buffer.from(await response.arrayBuffer()));
}

const digest = createHash('sha256').update(readFileSync(zip)).digest('hex');
if (digest !== MODEL.sha256) throw new Error(`SHA-256 diferente do aprovado: ${digest}. Não usar este arquivo.`);

const unpacked = join(work, 'unpacked');
rmSync(unpacked, { recursive: true, force: true });
mkdirSync(unpacked, { recursive: true });
// No Windows, o tar do sistema (bsdtar) abre .zip e entende caminhos C:\; o do Git Bash não.
const tar = process.platform === 'win32' ? join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe') : 'tar';
execFileSync(tar, ['-xf', zip, '-C', unpacked]);
const folder = join(unpacked, readdirSync(unpacked).find(name => name.startsWith('vosk-model')));

rmSync(target, { recursive: true, force: true });
mkdirSync(dirname(target), { recursive: true });
renameSync(folder, target);
// O StorageService do Vosk recopia o modelo quando este conteúdo muda.
writeFileSync(join(target, 'uuid'), MODEL.sha256);
writeFileSync(join(target, 'MODEL-INFO.txt'), Object.entries(MODEL).map(([k, v]) => `${k}: ${v}`).join('\n') + '\n');
console.log(`${MODEL.name} pronto em ${target}`);
