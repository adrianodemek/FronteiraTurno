import { createInitialState, territoryById, owned } from './game/state.js?v=0.7.1';
import { canSelectSource, canTarget, isNeighbor } from './game/map.js';
import { attackChance, maxAttackTroops, resolveAttack } from './game/combat.js';
import { runAiTurn } from './game/ai.js';
import { LANDMASSES } from './data/map.js?v=0.7.1';
import { render } from './ui/render.js?v=0.7.1';

let state=createInitialState();
let aiTimer=0,resizeRaf=0;
const refs={
  map:document.querySelector('#battleMap'),
  mapFrame:document.querySelector('#mapFrame'),
  hudTop:document.querySelector('#hudTop'),
  objectiveStrip:document.querySelector('#objectiveStrip'),
  bottomDock:document.querySelector('#bottomDock'),
  turnLabel:document.querySelector('#turnLabel'),
  blueScore:document.querySelector('#blueScore'),
  redScore:document.querySelector('#redScore'),
  warBlue:document.querySelector('#warBlue'),
  orders:document.querySelector('#orders'),
  ownedCount:document.querySelector('#ownedCount'),
  neutralCount:document.querySelector('#neutralCount'),
  hqCount:document.querySelector('#hqCount'),
  actionPanel:document.querySelector('#actionPanel'),
  actionTitle:document.querySelector('#actionTitle'),
  actionText:document.querySelector('#actionText'),
  chanceBox:document.querySelector('#chanceBox'),
  chanceText:document.querySelector('#chanceText'),
  attackStrength:document.querySelector('#attackStrength'),
  attackTroops:document.querySelector('#attackTroops'),
  attackTroopsValue:document.querySelector('#attackTroopsValue'),
  attackTroopsMax:document.querySelector('#attackTroopsMax'),
  attackBtn:document.querySelector('#attackBtn'),
  endTurnBtn:document.querySelector('#endTurnBtn'),
  reinforceCard:document.querySelector('#reinforceCard'),
  toast:document.querySelector('#toast')
};

const MIN_ZOOM=1,MAX_ZOOM=3,MAP_MARGIN=24,PAN_SEA=105;
const pointers=new Map();
const camera={zoom:1,x:0,y:0};
let fit={x:0,y:0,w:420,h:690},gesture=null,suppressClickUntil=0;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));

function getContentBounds(){
  const pts=LANDMASSES.flatMap(m=>m.points);
  const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);
  return{minX:Math.min(...xs),maxX:Math.max(...xs),minY:Math.min(...ys),maxY:Math.max(...ys)};
}
const contentBounds=getContentBounds();

function safePadding(){
  const frame=refs.mapFrame.getBoundingClientRect();
  if(!frame.width||!frame.height)return{left:18,right:18,top:92,bottom:178};
  const hud=refs.hudTop.getBoundingClientRect();
  const action=refs.actionPanel.getBoundingClientRect();
  const dock=refs.bottomDock.getBoundingClientRect();
  return{
    left:18,
    right:18,
    top:Math.max(18,hud.bottom-frame.top+10),
    bottom:Math.max(18,frame.bottom-Math.min(action.top,dock.top)+10)
  };
}

function recalcFit(preserve=true){
  const r=refs.mapFrame.getBoundingClientRect();
  const fw=Math.max(1,r.width),fh=Math.max(1,r.height),aspect=fw/fh,p=safePadding();
  const fracW=clamp((fw-p.left-p.right)/fw,.35,1),fracH=clamp((fh-p.top-p.bottom)/fh,.35,1);
  const contentW=contentBounds.maxX-contentBounds.minX+MAP_MARGIN*2;
  const contentH=contentBounds.maxY-contentBounds.minY+MAP_MARGIN*2;
  const viewW=Math.max(contentW/fracW,contentH*aspect/fracH),viewH=viewW/aspect;
  const nx=(p.left+(fw-p.left-p.right)/2)/fw,ny=(p.top+(fh-p.top-p.bottom)/2)/fh;
  const cx=(contentBounds.minX+contentBounds.maxX)/2,cy=(contentBounds.minY+contentBounds.maxY)/2;
  const oldCenter={x:camera.x+(fit.w/camera.zoom)/2,y:camera.y+(fit.h/camera.zoom)/2};
  fit={x:cx-nx*viewW,y:cy-ny*viewH,w:viewW,h:viewH};
  if(camera.zoom<=MIN_ZOOM+.001||!preserve){camera.zoom=MIN_ZOOM;camera.x=fit.x;camera.y=fit.y;}
  else{const w=fit.w/camera.zoom,h=fit.h/camera.zoom;camera.x=oldCenter.x-w/2;camera.y=oldCenter.y-h/2;clampCamera();}
  applyCamera();
}

function axisClamp(pos,size,min,max){const span=max-min;if(size>=span)return(min+max-size)/2;return clamp(pos,min,max-size);}
function clampCamera(){
  const w=fit.w/camera.zoom,h=fit.h/camera.zoom;
  if(camera.zoom<=MIN_ZOOM+.001){camera.x=fit.x;camera.y=fit.y;return;}
  camera.x=axisClamp(camera.x,w,contentBounds.minX-PAN_SEA,contentBounds.maxX+PAN_SEA);
  camera.y=axisClamp(camera.y,h,contentBounds.minY-PAN_SEA,contentBounds.maxY+PAN_SEA);
}
function setCamera(zoom,x,y){camera.zoom=clamp(zoom,MIN_ZOOM,MAX_ZOOM);camera.x=x;camera.y=y;clampCamera();applyCamera();}
function applyCamera(){const w=fit.w/camera.zoom,h=fit.h/camera.zoom;refs.map.setAttribute('viewBox',`${camera.x.toFixed(2)} ${camera.y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)}`);}
function localNorm(clientX,clientY){const r=refs.map.getBoundingClientRect();return{nx:clamp((clientX-r.left)/r.width,0,1),ny:clamp((clientY-r.top)/r.height,0,1)};}
function twoPointers(){return[...pointers.values()].slice(0,2);}
function beginGesture(){if(pointers.size<2)return;const[a,b]=twoPointers(),mx=(a.x+b.x)/2,my=(a.y+b.y)/2,{nx,ny}=localNorm(mx,my),w=fit.w/camera.zoom,h=fit.h/camera.zoom;gesture={startDistance:Math.hypot(b.x-a.x,b.y-a.y)||1,startZoom:camera.zoom,anchorX:camera.x+nx*w,anchorY:camera.y+ny*h};suppressClickUntil=Date.now()+420;for(const id of pointers.keys()){try{refs.map.setPointerCapture(id);}catch{}}refs.map.classList.add('pinching');}
function updateGesture(){if(!gesture||pointers.size<2)return;const[a,b]=twoPointers(),distance=Math.hypot(b.x-a.x,b.y-a.y)||1,newZoom=clamp(gesture.startZoom*(distance/gesture.startDistance),MIN_ZOOM,MAX_ZOOM),mx=(a.x+b.x)/2,my=(a.y+b.y)/2,{nx,ny}=localNorm(mx,my),w=fit.w/newZoom,h=fit.h/newZoom;setCamera(newZoom,gesture.anchorX-nx*w,gesture.anchorY-ny*h);}

refs.map.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch')return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2)beginGesture();});
refs.map.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size>=2){e.preventDefault();if(!gesture)beginGesture();updateGesture();}});
function endPointer(e){if(pointers.has(e.pointerId))pointers.delete(e.pointerId);if(pointers.size<2&&gesture){gesture=null;suppressClickUntil=Date.now()+360;refs.map.classList.remove('pinching');}}
refs.map.addEventListener('pointerup',endPointer);refs.map.addEventListener('pointercancel',endPointer);refs.map.addEventListener('lostpointercapture',endPointer);

function showToast(text){refs.toast.textContent=text;refs.toast.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>refs.toast.classList.remove('show'),1800);}
function checkWinner(){const blueHq=state.territories.find(t=>t.hq&&t.id==='A1'),redHq=state.territories.find(t=>t.hq&&t.id==='G2');if(redHq.owner==='blue')state.winner='blue';else if(blueHq.owner==='red')state.winner='red';else if(state.turn>state.maxTurns)state.winner=owned(state,'blue').length>=owned(state,'red').length?'blue':'red';}
function clearSelection(){state.selectedSource=null;state.selectedTarget=null;state.attackTroops=1;}
function paint(){checkWinner();render(state,refs);applyCamera();}

refs.map.addEventListener('click',e=>{
  if(Date.now()<suppressClickUntil)return;
  const g=e.target.closest?.('.territory');
  if(!g||state.phase!=='player'||state.winner)return;
  const t=territoryById(state,g.dataset.id),src=state.selectedSource?territoryById(state,state.selectedSource):null;
  if(!src){
    if(canSelectSource(state,t)){state.selectedSource=t.id;state.attackTroops=1;showToast(`${t.id} selecionado`);}
    else if(t.owner==='blue'&&t.troops<2)showToast('Este território precisa de 2+ tropas para mover ou atacar.');
  }else if(t.id===src.id){
    clearSelection();
  }else if(t.owner==='blue'){
    if(isNeighbor(src.id,t.id)){
      state.selectedTarget=t.id;
      state.attackTroops=maxAttackTroops(src);
    }else if(canSelectSource(state,t)){
      state.selectedSource=t.id;
      state.selectedTarget=null;
      state.attackTroops=1;
    }else showToast('Para transferir tropas, escolha um território seu vizinho.');
  }else if(canTarget(state,src,t)){
    state.selectedTarget=t.id;
    state.attackTroops=maxAttackTroops(src);
  }else showToast('Esse território não é vizinho.');
  paint();
});

refs.attackTroops.addEventListener('input',()=>{
  const src=state.selectedSource?territoryById(state,state.selectedSource):null;
  const tar=state.selectedTarget?territoryById(state,state.selectedTarget):null;
  if(!src||!tar)return;
  const maxSent=maxAttackTroops(src);
  const sent=clamp(Number(refs.attackTroops.value)||1,1,maxSent);
  state.attackTroops=sent;
  refs.attackTroops.value=String(sent);
  refs.attackTroopsValue.textContent=String(sent);
  refs.attackTroopsMax.textContent=String(maxSent);
  if(tar.owner!=='blue')refs.chanceText.textContent=`${Math.round(attackChance(src,tar,sent)*100)}%`;
});

refs.attackBtn.addEventListener('click',()=>{
  if(state.orders<1)return showToast('Sem ordens disponíveis.');
  const src=territoryById(state,state.selectedSource),tar=territoryById(state,state.selectedTarget);
  if(!src||!tar)return;
  const sent=clamp(state.attackTroops||maxAttackTroops(src),1,maxAttackTroops(src));

  if(tar.owner==='blue'){
    if(!isNeighbor(src.id,tar.id))return showToast('Os territórios precisam ser vizinhos.');
    src.troops-=sent;
    tar.troops+=sent;
    state.orders--;
    showToast(`${sent} tropa${sent===1?'':'s'} movida${sent===1?'':'s'} para ${tar.id}.`);
    clearSelection();paint();
    return;
  }

  const wasHQ=tar.hq,r=resolveAttack(src,tar,sent);
  state.orders--;
  showToast(r.win?`Vitória! ${r.committed} tropas atacaram ${tar.id}.`:`Ataque repelido em ${tar.id}.`);
  clearSelection();checkWinner();paint();
  if(wasHQ&&r.win)showToast('QG inimigo capturado!');
});

refs.reinforceCard.addEventListener('click',()=>{if(state.reinforceUsed||state.orders<1)return;const t=state.selectedSource?territoryById(state,state.selectedSource):null;if(!t||t.owner!=='blue'){showToast('Selecione primeiro um território azul.');return;}t.troops+=2;state.orders--;state.reinforceUsed=true;showToast(`+2 tropas em ${t.id}`);paint();});
refs.endTurnBtn.addEventListener('click',()=>{if(state.winner)return;clearSelection();state.phase='ai';paint();showToast('Turno inimigo');clearTimeout(aiTimer);aiTimer=setTimeout(()=>{const events=runAiTurn(state),wins=events.filter(e=>e.result.win).length;showToast(events.length?`Inimigo: ${events.length} ataques, ${wins} conquistas.`:'Inimigo reorganizou as tropas.');state.turn++;state.orders=state.maxOrders;state.reinforceUsed=false;state.phase='player';for(const t of state.territories.filter(t=>t.owner==='blue'))if(Math.random()<.24)t.troops++;paint();},650);});

function scheduleResize(){cancelAnimationFrame(resizeRaf);resizeRaf=requestAnimationFrame(()=>recalcFit(true));}
const ro=new ResizeObserver(scheduleResize);ro.observe(refs.mapFrame);window.addEventListener('orientationchange',scheduleResize,{passive:true});
function syncVisibility(){document.documentElement.classList.toggle('app-paused',document.hidden);}
document.addEventListener('visibilitychange',syncVisibility,{passive:true});
window.addEventListener('pagehide',e=>{document.documentElement.classList.add('app-paused');clearTimeout(showToast.t);if(!e.persisted){clearTimeout(aiTimer);pointers.clear();gesture=null;ro.disconnect();refs.map.replaceChildren();}},{passive:true});
window.addEventListener('pageshow',()=>{syncVisibility();paint();recalcFit(true);},{passive:true});

window.__cameraDebug={camera,fit,recalcFit,setCamera,contentBounds};
syncVisibility();render(state,refs);recalcFit(false);