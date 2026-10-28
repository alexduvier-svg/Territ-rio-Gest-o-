// Compare tracked runtime and reference assets against the pinned Claude source, without reading device data.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),ref='claude/claude/agro-gestao-claude';
const git=(...args)=>cp.execFileSync('git',args,{cwd:root,encoding:'utf8',windowsHide:true});
const sourceCommit=git('rev-parse',ref).trim();
assert(sourceCommit.startsWith('4a15376'),'Expected pinned Claude133 source');
const roots=['app/src','app/public','app/resources','app/tests','app/docs/motor'];
const rows=git('ls-tree','-rz','-r',ref,'--',...roots).split('\0').filter(Boolean).map(row=>{const [meta,file]=row.split('\t');return {file,blob:meta.split(' ')[2]};});
const blob=bytes=>crypto.createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
const entries=[],brandingOnly=[],different=[];
for(const row of rows){const file=path.join(root,row.file);if(!fs.existsSync(file)){different.push({path:row.file,reason:'missing'});continue;}const bytes=fs.readFileSync(file);let normalized=bytes;
 if(['app/src/main.js','app/src/legacy/erp-ui.js'].includes(row.file))normalized=Buffer.from(bytes.toString('utf8').replaceAll('AGRO Gestão Codex','AGRO Gestão Claude').replaceAll('· Codex','· Claude'));
 if(blob(normalized)!==row.blob)different.push({path:row.file,reason:'content'});else if(blob(bytes)!==row.blob)brandingOnly.push(row.file);
 entries.push({path:row.file,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
}
const expected=new Set(rows.map(r=>r.file)),extras=[];
function visit(dir){if(!fs.existsSync(dir))return;for(const item of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,item.name);if(item.isDirectory())visit(file);else{const rel=path.relative(root,file).replaceAll(path.sep,'/');if(!expected.has(rel))extras.push(rel);}}}
roots.forEach(dir=>visit(path.join(root,dir)));
const report={version:'0.12.133',sourceCommit,checked:rows.length,css:entries.filter(e=>e.path.endsWith('.css')).length,brandingOnly,different,extras,entries,passed:!different.length&&!extras.length,deviceDataRead:false};
fs.writeFileSync(path.join(__dirname,'clone133-source-review.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({sourceCommit,checked:rows.length,brandingOnly,different,extras,passed:report.passed}));assert(report.passed);
