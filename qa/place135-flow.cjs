const assert=require('node:assert/strict');
const street='https://www.google.com.br/maps/@-20.7028804,-42.0622218,568a,75y,343.47h,93.95t/data=!3m7!1e1!3m5!1sEXuRq1xqiSCEYpmQ2GBCvA!2e0';

// Probe installed only by the isolated synthetic harness, never by application runtime.
async function installProbe(page){
 await page.evaluate(async()=>{
  if(ERPPreview.model().data.dataContext?.id!=='place135-synthetic')throw Error('Synthetic place fixture required');
  const state=window.__place135={position:{status:'ready',latitude:-20.7028804,longitude:-42.0622218,accuracyMeters:5,capturedAt:Date.now()},external:[],shares:[],nativeLocates:0,browserLocates:0,failPersist:0,failDurable:0,hold:false,resolver:null};
  const locate=()=>state.hold?new Promise(resolve=>{state.resolver=resolve;}):Promise.resolve(state.position);
  const cap=window.Capacitor, native=!!cap?.isNativePlatform?.(), original=cap?.nativePromise?.bind(cap);
  state.native=native;
  if(native)await cap.nativePromise('KeepAwake','keepAwake',{});
  if(native)cap.nativePromise=(plugin,method,options,...rest)=>{
   if(plugin==='AgroPlace'&&method==='locate'){state.nativeLocates++;return locate();}
   if(plugin==='AgroPlace'&&method==='cancel')return Promise.resolve();
   if(plugin==='Share'&&method==='share'){state.shares.push(options.text);return Promise.resolve({});}
   if(plugin==='CapacitorHttp'&&method==='request')return Promise.resolve({status:200,url:'https://www.google.com/maps/@?map_action=pano&viewpoint=-20.7028804,-42.0622218&heading=343&pitch=-4',data:''});
   return original(plugin,method,options,...rest);
  };
  Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition:(success,error)=>{state.browserLocates++;locate().then(r=>r.status==='ready'?success({coords:{latitude:r.latitude,longitude:r.longitude,accuracy:r.accuracyMeters},timestamp:r.capturedAt}):error({code:r.status==='permission-denied'?1:3}));}}});
  Object.defineProperty(navigator,'share',{configurable:true,value:async data=>{state.shares.push(data.text);}});
  const bridge=TerritorioWorkflowBridge,persist=bridge.persist;
  bridge.persist=()=>state.failPersist-->0?false:persist();
  bridge.external=url=>state.external.push(url);
  const store=window.TerritorioNative||(window.TerritorioNative={isNative:false}),durable=store.durable?.bind(store);
  store.durable=()=>state.failDurable-->0?Promise.resolve(false):durable?durable():Promise.resolve(true);
 });
}
async function exercisePlace(page,capture=async()=>{}){
 const checks={},act=name=>page.evaluate(name=>ERPPreview.actions[name](),name);
 await page.waitForFunction(()=>window.__AGRO_UI_BOOT_READY__&&window.ERPPreview,null,{timeout:40000});
 await installProbe(page);
 const snapshot=()=>page.evaluate(()=>JSON.stringify(Object.fromEntries(['products','sales','clients','events','movements','expenses'].map(k=>[k,ERPPreview.model().data[k]]))));
 const before=await snapshot();
 const open=async()=>{if(await page.locator('#dialog').evaluate(d=>d.open))await act('close-modal');await act('profile');await page.locator('#place-group').waitFor({state:'visible'});};
 const click=action=>page.locator(`[data-place="${action}"]`).click();
 const place=()=>page.evaluate(()=>ERPPreview.model().data.settings.location||null);
 const feedback=pattern=>page.waitForFunction(pattern=>new RegExp(pattern).test(document.getElementById('place-feedback')?.textContent||''),pattern,{timeout:20000});
 const fit=async()=>{
  const failures=await page.evaluate(()=>[...document.querySelectorAll('#place-group,#place-group .place-code,#place-group .place-actions button,#dialog')].flatMap(el=>el.scrollWidth>el.clientWidth+3?[{tag:el.className,width:el.clientWidth,scroll:el.scrollWidth}]:[]));
  assert.deepEqual(failures,[],'Place/profile content overflow');
 };
 await open();assert.equal(await place(),null);
 await page.locator('#business-community').fill('Comunidade Fictícia QA');await act('save-business');await open();assert.equal(await page.evaluate(()=>ERPPreview.model().data.settings.community),'Comunidade Fictícia QA');checks.communitySaved=true;
 assert.doesNotMatch(await page.locator('#place-group').innerText(),/porteira|placa/i);checks.seuLugarLanguage=true;
 await page.evaluate(()=>{__place135.position.accuracyMeters=1200;});await click('mark');await feedback('Sinal fraco');assert.equal(await place(),null);assert.equal(await page.locator('.place-preview').count(),0);checks.weakGpsNeverSaved=true;
 await page.evaluate(()=>{__place135.position.accuracyMeters=5;});await click('mark');await page.locator('.place-preview').waitFor({state:'visible'});assert.equal(await place(),null);
 await fit();await capture('place-confirmation');await click('preview');assert.match(await page.evaluate(()=>__place135.external.at(-1)),/58FV7WWQ%2BR4/);
 await click('discard');assert.equal(await place(),null);checks.previewDoesNotSave=true;
 await click('mark');await page.locator('.place-preview').waitFor({state:'visible'});await click('confirm');await feedback('gravação foi conferida');
 const original=await place();assert.equal(original.code,'58FV7WWQ+R4');assert.equal(original.origin,'gps');assert.equal(original.accuracy,5);assert(original.confirmedAt);checks.gpsConfirmationAndDurableSave=true;
 await page.evaluate(()=>{__place135.position.accuracyMeters=1200;});await click('mark');await feedback('Sinal fraco');assert.deepEqual(await place(),original);checks.weakGpsPreservesExisting=true;
 await page.evaluate(()=>{Object.assign(__place135.position,{accuracyMeters:5,latitude:-20.7333,longitude:-42.0297});__place135.failPersist=1;});
 await click('mark');await page.locator('.place-preview').waitFor({state:'visible'});await click('confirm');await feedback('Gravação não confirmada');assert.deepEqual(await place(),original);await click('discard');checks.rejectedSaveRollsBack=true;
 await page.evaluate(()=>{__place135.failDurable=1;});await click('mark');await page.locator('.place-preview').waitFor({state:'visible'});await click('confirm');await feedback('Gravação não confirmada');assert.deepEqual(await place(),original);await click('discard');checks.failedDiskRollsBack=true;
 await page.reload();await page.waitForFunction(()=>window.__AGRO_UI_BOOT_READY__,null,{timeout:40000});await installProbe(page);await open();assert.deepEqual(await place(),original);checks.persistedAfterReload=true;
 await page.locator('.place-import summary').click();await page.locator('#place-code-input').fill('7WWQ+R4 Carangola');await click('import');await feedback('código abreviado');assert.deepEqual(await place(),original);
 await page.locator('#place-code-input').fill('58FV7X8C+M4');await page.locator('#place-origin').selectOption('erd-mg');await click('import');await page.locator('.place-preview').waitFor({state:'visible'});assert.deepEqual(await place(),original);await fit();await capture('place-existing-erd');
 await click('confirm');await feedback('gravação foi conferida');const erd=await place();assert.equal(erd.code,'58FV7X8C+M4');assert.equal(erd.origin,'erd-mg-informed');assert.equal(erd.accuracy,null);assert.match(await page.locator('.place-code').innerText(),/58FV7X8C\+M4/);checks.existingErdFullCodeAndConfirmation=true;
 for(let i=0;i<5;i++){
  const input=page.locator(`#place-ref-${i}`);await input.fill(`Referência fictícia ${i+1}`);await input.evaluate(el=>el.blur());
  await page.waitForFunction(n=>ERPPreview.model().data.settings.location.references?.length===n,i+1);
 }
 assert.equal(await page.locator('.place-ref').count(),5);checks.fiveReferences=true;
 await page.locator('#place-street').fill(street);await page.locator('#place-street').evaluate(el=>el.blur());await feedback('Vista de seu lugar salva');
 assert.equal((await place()).streetView.pitch,-4);await click('street');assert.match(await page.evaluate(()=>__place135.external.at(-1)),/pitch=-4/);
 const validStreet=(await place()).streetView;
 await page.locator('#place-street').fill('https://www.google.com/maps/@?map_action=pano&viewpoint=0,0&heading=%');await page.locator('#place-street').evaluate(el=>el.blur());await feedback('Não foi possível ler');assert.deepEqual((await place()).streetView,validStreet);checks.streetViewValidationAndAngle=true;
 await page.locator('#place-street').fill('https://maps.app.goo.gl/SyntheticQA135');await page.locator('#place-street').evaluate(el=>el.blur());
 const native=await page.evaluate(()=>__place135.native);
 if(native){await feedback('Vista de seu lugar salva');assert.equal((await place()).streetView.lat,-20.7028804);checks.shortLinkResolution=true;}
 else{await feedback('Não foi possível ler');assert.deepEqual((await place()).streetView,validStreet);checks.offlineShortLinkPreservesOld=true;}
 await click('share');await page.waitForFunction(()=>__place135.shares.length>0);const message=await page.evaluate(()=>__place135.shares.at(-1));
 assert.match(message,/\*Plus Code\*\n58FV7X8C\+M4/);assert.match(message,/5\) Referência fictícia 5/);assert.match(message,/Comunidade Fictícia QA · Carangola, MG/);assert.match(message,/\*Coordenadas para copiar\*/);assert.match(message,/baixe toda a região do trajeto/);assert.match(message,/iniciar a rota não baixa o mapa/);assert.doesNotMatch(message,/caminho fica guardado|porteira/i);checks.shareOfflineAdviceAndFullCode=true;
 await click('navigate');assert.match(await page.evaluate(()=>__place135.external.at(-1)),/maps\/dir\/\?api=1&destination=/);checks.directMapsRoute=true;
 const saved=await place();await page.evaluate(()=>{__place135.hold=true;});await click('mark');await page.waitForFunction(()=>!!__place135.resolver);await act('close-modal');
 await page.evaluate(()=>{__place135.resolver(__place135.position);__place135.hold=false;});await page.waitForTimeout(100);await open();assert.deepEqual(await place(),saved);assert.equal(await page.locator('.place-preview').count(),0);checks.closedProfileDiscardsLateGps=true;
 await fit();await capture('place-final');await act('close-modal');assert.equal(await snapshot(),before);checks.businessRecordsUnchanged=true;
 assert(await page.evaluate(()=>__place135.native?__place135.nativeLocates>0:__place135.browserLocates>0),'GPS must be mocked, never read from a real device');checks.syntheticGpsOnly=true;
 return checks;
}
module.exports={exercisePlace,installProbe};
