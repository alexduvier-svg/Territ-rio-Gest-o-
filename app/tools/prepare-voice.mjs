// Reproducible public model preparation. No credentials, user data or audio.
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const name='vosk-model-small-pt-0.3.zip',sha256='6e1ce909032e1afa7a88e68a3d628ecafff302bdf195befab308826c395e93b7';
const dest=path.join(root,'android/app/src/main/assets/voice',name);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
let existing;try{existing=await fs.readFile(dest);}catch{}
if(existing&&hash(existing)===sha256){console.log('Português offline verificado.');process.exit(0);}
const response=await fetch('https://alphacephei.com/vosk/models/'+name,{signal:AbortSignal.timeout(180000)});
if(!response.ok)throw Error('Falha ao obter o modelo oficial: '+response.status);
const bytes=Buffer.from(await response.arrayBuffer());
if(bytes.length!==32453112||hash(bytes)!==sha256)throw Error('Integridade do modelo incorreta. Nada foi instalado.');
await fs.mkdir(path.dirname(dest),{recursive:true});await fs.writeFile(dest+'.tmp',bytes);await fs.rename(dest+'.tmp',dest);
console.log('Português offline preparado e SHA-256 conferido.');
