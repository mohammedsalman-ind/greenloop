import { createAssetEngine } from './scene-engine.js';
import { materials, clamp, smooth, filterMaterials, savings, chapterState } from './journey-data.js';

const $=(selector,root=document)=>root.querySelector(selector);
const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
const scenes=$$('.scene'),count=scenes.length;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const format=new Intl.NumberFormat('en-IN',{maximumFractionDigits:0});
const chapters=scenes.map((scene,index)=>({index,id:scene.id,title:scene.dataset.title}));
const icon=name=>`<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const sampleNote='<p class="demo-note">Illustrative GreenLoop material record recreated from the reference. Inventory, verification labels, costs and booking details are sample content.</p>';
let chapterHeight=1,active=-1,frame=0,engine,engineTried=false,viewer=null;
let pointer={x:0,y:0},targetPointer={x:0,y:0},orbit={x:0,y:0};
let tour=null,tourFrame=0,lastFocus=null;
const sceneParts=scenes.map(scene=>({
  counts:$$('[data-count]',scene),recovery:$$('[data-recovery-step]',scene),inspection:$$('[data-inspection-step]',scene),
  booking:$$('[data-booking-step]',scene),delivery:$$('[data-delivery-step]',scene),slot:$('.asset-viewport',scene)
}));
const route=$('#delivery-route'),deliveryMarker=$('#delivery-marker');
let routeLength=0;
try{routeLength=route.getTotalLength();}catch{}
function measure(){chapterHeight=$('[data-chapter="0"]').getBoundingClientRect().height||innerHeight*1.5;engine?.resize();schedule();}
function ensureEngine(){if(!engineTried){engineTried=true;try{engine=createAssetEngine();}catch{engine=null;}}return engine;}
function schedule(){if(!frame)frame=requestAnimationFrame(render);}
function setStyle(scene,name,value){scene.style.setProperty(name,value);}
function render(){
  frame=0;
  const position=clamp(scrollY/chapterHeight,0,count),current=Math.min(count-1,Math.floor(position+.085));
  const damp=reduced.matches?1:.18;
  pointer.x+=(targetPointer.x-pointer.x)*damp;pointer.y+=(targetPointer.y-pointer.y)*damp;
  if(current!==active){
    active=current;$('#chapter-number').textContent=String(active+1).padStart(2,'0');$('#chapter-title').textContent=chapters[active].title;
    $$('.chapter-rail [data-go]').forEach((button,i)=>{if(i===active)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');});
    $('[data-next]').setAttribute('aria-label',active===count-1?'Back to the beginning':'Next chapter');
    $('[data-next]').innerHTML=active===count-1?'BACK TO THE BEGINNING <span>↑</span>':'SCROLL TO EXPLORE <span>↓</span>';
    if(!viewer){const slot=sceneParts[active].slot;if(slot)ensureEngine()?.attach(slot,slot.dataset.model);else engine?.attach(null);}
  }
  scenes.forEach((scene,i)=>{
    const {p,opacity,draw}=chapterState(position,i,count,reduced.matches),visible=opacity>.001;
    scene.style.opacity=opacity.toFixed(4);scene.style.visibility=visible?'visible':'hidden';scene.classList.toggle('is-active',i===active);
    scene.setAttribute('aria-hidden',String(i!==active));scene.inert=i!==active;
    if(!visible)return;
    const settle=reduced.matches||i===0?1:smooth(0,.34,p),medium=reduced.matches||i===0?1:smooth(.015,.25,p),late=reduced.matches||i===0?1:smooth(.15,.43,p),last=reduced.matches||i===0?1:smooth(.3,.63,p);
    setStyle(scene,'--p',p.toFixed(4));setStyle(scene,'--draw',draw.toFixed(4));setStyle(scene,'--in',settle.toFixed(4));
    setStyle(scene,'--medium',medium.toFixed(4));setStyle(scene,'--late',late.toFixed(4));setStyle(scene,'--last',last.toFixed(4));
    const cameraProgress=reduced.matches?.55:p;
    setStyle(scene,'--camera-scale',(1.045+cameraProgress*.045).toFixed(4));
    setStyle(scene,'--camera-x',`${((.5-cameraProgress)*9+pointer.x*2.5)*(i%2?-1:1)}px`);
    setStyle(scene,'--camera-y',`${(cameraProgress-.5)*-8+pointer.y*1.8}px`);
    setStyle(scene,'--copy-y',`${(1-settle)*19}px`);
    setStyle(scene,'--card-x',`${(1-medium)*19+pointer.x*1.4}px`);
    setStyle(scene,'--card-y',`${(1-medium)*15+pointer.y*.8}px`);
    setStyle(scene,'--card-tilt',`${(1-medium)*-5}deg`);
    const parts=sceneParts[i];
    parts.counts.forEach(el=>{const value=Math.round(Number(el.dataset.count)*draw);el.textContent=el.dataset.numberFormat==='in'?format.format(value):String(value);});
    for(const group of [parts.recovery,parts.inspection,parts.booking,parts.delivery])group.forEach((step,j)=>{
      step.classList.toggle('completed',draw>=(j/group.length)*.94);step.classList.toggle('current',j===Math.min(group.length-1,Math.floor(draw*group.length)));
    });
    if(i===10&&routeLength){const point=route.getPointAtLength(draw*routeLength);deliveryMarker.setAttribute('transform',`translate(${point.x} ${point.y})`);}
  });
  $('#page-progress').style.transform=`scaleX(${position/count})`;
  $('#rail-progress').style.transform=`translateY(${clamp(position,0,count-1)*100}%)`;
  if(engine)engine.render(viewer?.65:clamp(position-active),{reducedMotion:reduced.matches,pointerX:pointer.x,pointerY:pointer.y,orbitX:orbit.x,orbitY:orbit.y});
  if(!reduced.matches&&(Math.abs(pointer.x-targetPointer.x)+Math.abs(pointer.y-targetPointer.y)>.003))schedule();
}
function stopTour(){if(tourFrame)cancelAnimationFrame(tourFrame);tourFrame=0;tour=null;$('#tour-state').hidden=true;}
function restoreChapterModel(){viewer=null;const slot=sceneParts[active]?.slot;engine?.attach(slot||null,slot?.dataset.model);schedule();}
function closeDialogs(){if(viewer)restoreChapterModel();$$('dialog[open]').forEach(dialog=>dialog.close());}
function go(index,{smoothScroll=true}={}){
  index=clamp(Number(index),0,count-1);stopTour();closeDialogs();
  window.scrollTo({top:(index+(index===0?0:.7))*chapterHeight,behavior:smoothScroll&&!reduced.matches?'smooth':'instant'});
  try{history.replaceState(null,'',`#${chapters[index].id}`);}catch{}
  schedule();
}
function startTour(){
  if(tour){stopTour();return;}
  closeDialogs();
  if(reduced.matches){go(active>=count-1?0:active+1,{smoothScroll:false});return;}
  tour={start:performance.now(),duration:120000};$('#tour-state').hidden=false;
  const tick=time=>{if(!tour)return;const p=clamp((time-tour.start)/tour.duration);window.scrollTo({top:p*count*chapterHeight,behavior:'instant'});schedule();if(p<1)tourFrame=requestAnimationFrame(tick);else stopTour();};
  tourFrame=requestAnimationFrame(tick);
}
function openDialog(id){
  stopTour();closeDialogs();lastFocus=document.activeElement;
  const dialog=$(`#${id}-dialog`);dialog.showModal();
  if(id==='search'){$('#site-search').value='';renderSearch('');$('#site-search').focus();}
}
function detail(title,html,eyebrow='MATERIAL PASSPORT'){
  openDialog('details');$('#detail-title').textContent=title;$('#detail-eyebrow').textContent=eyebrow;$('#detail-content').innerHTML=html;
}
function specs(rows){return `<dl class="detail-specs">${rows.map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl>`;}
function showMaterial(id){
  const item=materials.find(x=>x.id===id);if(!item)return;
  detail(item.title,`<img class="detail-image" style="${id==='steel'?'object-fit:contain;background:#b4c5a01c':''}" src="./assets/${item.image}" alt="${item.title}"/>${specs([['Asset ID',item.record],['Grade',item.grade],['Location',item.location],['Available quantity',item.quantity],['Condition',item.condition],['Availability',item.availability==='now'?'Available now':'Upcoming recovery']])}<div class="detail-actions"><button class="primary" data-go="7">Explore matching</button>${id==='steel'?'<button data-detail="model">Inspect 3D model</button>':''}<button data-download="${id}">Download material record</button></div>${sampleNote}`,'VERIFIED MATERIALS');
}
function showDetail(kind){
  const entries={
    photos:()=>detail('Material photographs',`<div class="detail-gallery"><figure><img src="./assets/identify-v2.webp" alt="Material identification on site"/><figcaption>01 / Identification on site</figcaption></figure><figure><img src="./assets/inspection-v2.webp" alt="Recovered structural steel during inspection"/><figcaption>02 / Recovered beam inspection</figcaption></figure></div>${sampleNote}`),
    model:()=>{
      detail('Structural steel. In three dimensions.',`<div class="asset-viewport viewer-slot" data-model="viewer" tabindex="0" role="img" aria-label="Interactive steel beam. Drag or use arrow keys to rotate."><img class="asset-fallback" src="./assets/beam-product.webp" alt="Reclaimed structural steel beam"/></div><p class="viewer-hint">Drag to rotate · Arrow keys to inspect · Double click to reset</p>${specs([['Profile','Reclaimed I-section'],['Grade','S355'],['Length','6.2 m'],['Reference record','GL / 001']])}${sampleNote}`,'3D MATERIAL VIEWER');
      viewer=$('.viewer-slot');orbit={x:0,y:0};ensureEngine()?.attach(viewer,'viewer');
      let drag=null;
      viewer.addEventListener('pointerdown',event=>{drag={x:event.clientX,y:event.clientY};viewer.setPointerCapture(event.pointerId);viewer.focus();});
      viewer.addEventListener('pointermove',event=>{if(!drag)return;orbit.x+=(event.clientX-drag.x)*.009;orbit.y=clamp(orbit.y+(event.clientY-drag.y)*.009,-1.5,1.5);drag={x:event.clientX,y:event.clientY};schedule();});
      const end=()=>{drag=null;};viewer.addEventListener('pointerup',end);viewer.addEventListener('pointercancel',end);
      viewer.addEventListener('dblclick',()=>{orbit={x:0,y:0};schedule();});
      viewer.addEventListener('keydown',event=>{if(!event.key.startsWith('Arrow'))return;event.preventDefault();event.stopPropagation();if(event.key==='ArrowLeft')orbit.x-=.13;if(event.key==='ArrowRight')orbit.x+=.13;if(event.key==='ArrowUp')orbit.y=clamp(orbit.y-.13,-1.5,1.5);if(event.key==='ArrowDown')orbit.y=clamp(orbit.y+.13,-1.5,1.5);schedule();});
      if(!engine)$('.viewer-hint').textContent='Static material preview. Your browser does not currently support WebGL.';
      schedule();
    },
    inspection:()=>detail('Inspection & verification',`<p class="detail-body">Every material passport brings capture, dimensions, surface condition and material documentation into one record.</p><ul class="inspection-report"><li>3D scan capture <span>Captured</span></li><li>Dimension analysis <span>6.2 m reference length</span></li><li>Surface inspection <span>Good reference condition</span></li><li>Material grade <span>S355 reference grade</span></li></ul><p class="demo-note">This reproduces the reference inspection workflow. It is not an engineering inspection or a certificate authorizing structural reuse.</p>${sampleNote}`,'GL / 001 — INSPECTION'),
    certificates:()=>detail('Material documentation',`<p class="detail-body">The passport keeps engineering and provenance documents with the material throughout its next lifecycle.</p><ul class="inspection-report"><li>Material grade certificate <span>Original document required</span></li><li>Condition assessment <span>Original document required</span></li><li>Recovery & ownership record <span>Original document required</span></li></ul><p class="demo-note">The collage contains a verified badge, but no original certificates were supplied. These document entries show the intended interface.</p>`),
    history:()=>detail('One material. A continuing story.',`<ol class="timeline-record"><li><strong>Original building</strong><span>Commercial office building · Delhi</span></li><li><strong>Careful recovery</strong><span>Safe dismantling, preservation and material identification.</span></li><li><strong>Inspection & passport</strong><span>Capture and document the recovered component.</span></li><li><strong>Match & procurement</strong><span>A new project identifies compatible material.</span></li><li><strong>Delivery & a second life</strong><span>Confirm receipt and retain the material history.</span></li></ol>${sampleNote}`,'MATERIAL HISTORY'),
    economics:()=>{
      detail('Compare your material costs.',`<p class="detail-body">Adjust the reference prices and quantity to calculate the material saving for your project.</p><form class="calculator" id="cost-calculator"><label>New material / tonne (₹)<input id="calc-new" type="number" value="65000" min="0" step="100" inputmode="decimal"/></label><label>Reclaimed material / tonne (₹)<input id="calc-reclaimed" type="number" value="38000" min="0" step="100" inputmode="decimal"/></label><label>Required quantity (tonnes)<input id="calc-tonnes" type="number" value="2.4" min="0" step="0.1" inputmode="decimal"/></label><div class="calculator-result" aria-live="polite"><span>Material saving<br><small id="calc-percentage"></small></span><strong id="calc-total"></strong></div></form><p class="demo-note">Material costs only. Transport, taxes, inspection, preparation and project-specific costs are excluded. Reference prices are illustrative.</p>`,'PROCUREMENT DECISION');
      $('#cost-calculator').addEventListener('submit',event=>event.preventDefault());$('#cost-calculator').addEventListener('input',updateCalculator);updateCalculator();
    },
    terms:()=>detail('Order & booking details',`${specs([['Material','GL / 001 · Structural steel'],['Quantity','1 beam · 2.4 tonnes'],['Unit price','₹38,000 / tonne'],['Material subtotal','₹91,200'],['Collection','Delhi'],['Delivery','Jaipur'],['Target delivery','15 October · sample schedule']])}<p class="detail-body">The booking scene demonstrates the journey from material selection to agreement, confirmation and delivery scheduling.</p><div class="detail-actions"><button class="primary" data-go="10">Follow delivery</button><button data-detail="economics">Compare costs</button></div><p class="demo-note">This is a sample order preview. No payment, reservation or purchase is made on this website.</p>`,'ORDER GL / 001'),
    impact:()=>detail('A verified second life.',`${specs([['Material recovered','2.4 tonnes'],['New material rate','₹65,000 / tonne'],['Reclaimed material rate','₹38,000 / tonne'],['Material cost saving','₹64,800'],['New lifecycle','1'],['Receipt reference','GL / 001 → Jaipur']])}<p class="detail-body">Material saving = (₹65,000 − ₹38,000) × 2.4 tonnes. Receipt, quantity and condition checks complete the sample material journey.</p><div class="detail-actions"><button data-download="steel">Download material record</button><button data-go="12" class="primary">Explore the network</button></div>${sampleNote}`,'VERIFICATION & IMPACT')
  };
  entries[kind]?.();
}
function updateCalculator(){
  const values=['#calc-new','#calc-reclaimed','#calc-tonnes'].map(id=>$(id).value.trim()===''?NaN:Number($(id).value));
  const result=savings(...values);
  $('#calc-total').textContent=result?`₹${format.format(result.total)}`:'—';
  $('#calc-percentage').textContent=result?`${Math.abs(result.percentage).toFixed(1)}% ${result.total>=0?'lower':'higher'} material cost`:'Enter a valid non-negative value in each field.';
}
function downloadRecord(id){
  const item=materials.find(x=>x.id===id);if(!item)return;
  const data={sample:true,source:'GreenLoop reference recreation',...item,pricePerTonne:id==='steel'?38000:null};
  const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
  const anchor=document.createElement('a');anchor.href=url;anchor.download=`greenloop-${id}-sample-passport.json`;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function renderMarket(){
  const filters=Object.fromEntries(['material','location','quantity','condition','availability'].map(key=>[key,$(`#filter-${key}`).value]));filters.query=$('#market-search').value;
  const results=filterMaterials(filters);
  $('#material-grid').innerHTML=results.length?results.map(item=>`<article class="material-card"><img loading="lazy" src="./assets/${item.image}" alt="${item.title}" ${item.id==='steel'?'style="object-fit:contain;background:#e4e9dc"':''}/><div class="material-card-body"><h3>${item.title}</h3><p>${item.quantity}</p><p>${item.location}</p><button data-asset="${item.id}">View Details ${icon('arrow')}</button></div></article>`).join(''):'<div class="empty-results"><strong>No materials match these filters.</strong><p>Try another material or location.</p><button id="empty-clear" class="panel-link">RESET FILTERS</button></div>';
  $('#market-result-count').textContent=`${results.length} VERIFIED ${results.length===1?'MATERIAL':'MATERIALS'} · REFERENCE INVENTORY`;
  $$('[data-filter]').forEach(button=>{const selected=button.dataset.filter===filters.material;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));});
}
function resetFilters(){['material','location','quantity','condition','availability'].forEach(key=>$(`#filter-${key}`).value='all');$('#market-search').value='';renderMarket();}
function renderSearch(query){
  const term=query.trim().toLowerCase();
  const results=[...chapters.filter(x=>x.title.toLowerCase().includes(term)).map(x=>({label:x.title,kind:`Chapter ${String(x.index+1).padStart(2,'0')}`,go:x.index})),...materials.filter(x=>`${x.title} ${x.grade} ${x.location}`.toLowerCase().includes(term)).map(x=>({label:x.title,kind:x.location,asset:x.id}))];
  const root=$('#search-results');root.replaceChildren();
  if(!results.length){const p=document.createElement('p');p.className='detail-body';p.textContent='No results found. Try steel, inspection, delivery or a city.';root.append(p);return;}
  results.forEach(result=>{const button=document.createElement('button');button.textContent=result.label;if(result.go!==undefined)button.dataset.go=result.go;else button.dataset.asset=result.asset;const label=document.createElement('span');label.textContent=result.kind;button.append(label);root.append(button);});
}
function showCity(city){
  const associated=materials.filter(item=>item.location.includes(city));
  detail(city,`<p class="detail-body">Explore this city within the GreenLoop recovery network.</p>${associated.length?associated.map(item=>`<div class="detail-actions"><button data-asset="${item.id}">${item.title} ${icon('arrow')}</button></div>`).join(''):'<p class="detail-body">Connect recovery, material demand and project opportunities across the network.</p>'}<div class="detail-actions"><button class="primary" data-go="6">Explore all materials</button></div><p class="demo-note">Illustrative network location. City markers do not represent a live inventory feed.</p>`,'GREENLOOP NETWORK');
}
document.addEventListener('click',event=>{
  const target=event.target.closest('[data-go],[data-open],[data-close],[data-next],[data-tour],[data-asset],[data-detail],[data-download],[data-filter],[data-city],#empty-clear');if(!target)return;
  if(target.hasAttribute('data-go')){event.preventDefault();go(target.dataset.go);}
  else if(target.dataset.open)openDialog(target.dataset.open);
  else if(target.hasAttribute('data-close'))target.closest('dialog').close();
  else if(target.hasAttribute('data-next'))go(active===count-1?0:active+1);
  else if(target.hasAttribute('data-tour'))startTour();
  else if(target.dataset.asset)showMaterial(target.dataset.asset);
  else if(target.dataset.detail)showDetail(target.dataset.detail);
  else if(target.dataset.download)downloadRecord(target.dataset.download);
  else if(target.dataset.filter){$('#filter-material').value=target.dataset.filter;renderMarket();}
  else if(target.dataset.city)showCity(target.dataset.city);
  else if(target.id==='empty-clear')resetFilters();
});
$$('dialog').forEach(dialog=>{
  let backdropDown=false;
  dialog.addEventListener('pointerdown',event=>{const r=dialog.getBoundingClientRect();backdropDown=event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom;});
  dialog.addEventListener('click',event=>{if(event.target===dialog&&backdropDown)dialog.close();});
  dialog.addEventListener('close',()=>{
    if(dialog.open)return;
    if(dialog.id==='details-dialog'&&viewer)restoreChapterModel();
    if(!document.querySelector('dialog[open]')&&lastFocus?.isConnected&&!lastFocus.closest('[inert]'))lastFocus.focus({preventScroll:true});
  });
});
document.addEventListener('keydown',event=>{
  if(event.target.closest('input,select,textarea,[contenteditable],dialog'))return;
  if(event.target.closest('[data-city]')&&['Enter',' '].includes(event.key)){event.preventDefault();showCity(event.target.closest('[data-city]').dataset.city);return;}
  if(['ArrowDown','PageDown','ArrowUp','PageUp','Home','End',' '].includes(event.key)){
    if(event.key===' '&&event.target.closest('button,a'))return;
    event.preventDefault();stopTour();go(event.key==='Home'?0:event.key==='End'?count-1:['ArrowUp','PageUp'].includes(event.key)?active-1:active+1);
  }
});
window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',measure,{passive:true});
window.addEventListener('wheel',stopTour,{passive:true});window.addEventListener('touchstart',stopTour,{passive:true});
window.addEventListener('pointermove',event=>{if(event.pointerType==='touch'||reduced.matches)return;targetPointer={x:(event.clientX/innerWidth-.5)*2,y:(event.clientY/innerHeight-.5)*2};schedule();},{passive:true});
document.addEventListener('pointerleave',()=>{targetPointer={x:0,y:0};schedule();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopTour();});reduced.addEventListener('change',()=>{targetPointer={x:0,y:0};stopTour();schedule();});
['material','location','quantity','condition','availability'].forEach(key=>$(`#filter-${key}`).addEventListener('change',renderMarket));
$('#market-search').addEventListener('input',renderMarket);$('#clear-filters').addEventListener('click',resetFilters);
$('#toggle-market-filters').addEventListener('click',()=>{const open=$('#marketplace').classList.toggle('filters-open');$('#toggle-market-filters').setAttribute('aria-expanded',String(open));});
$('#site-search').addEventListener('input',event=>renderSearch(event.target.value));
if(window.GREENLOOP_CONFIG?.platformUrl){const link=$('.platform-button');link.removeAttribute('data-go');link.href=window.GREENLOOP_CONFIG.platformUrl;}
renderMarket();document.documentElement.classList.add('enhanced');measure();
const initial=chapters.find(x=>`#${x.id}`===location.hash);if(initial&&initial.index>0)requestAnimationFrame(()=>go(initial.index,{smoothScroll:false}));schedule();
