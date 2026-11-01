import { NEIGHBORS, LANDMASSES } from '../data/map.js?v=0.9';
import { attackChance, maxAttackTroops } from '../game/combat.js';
import { territoryById, owned, territoryPercent } from '../game/state.js';

const NS='http://www.w3.org/2000/svg';
const OWNER={blue:'#4faef7',red:'#ed674b',neutral:'#d9d0aa'};
const LAND_BY_ID=new Map(LANDMASSES.map(m=>[m.id,m]));
let worldCache=null;

function el(tag,attrs={}){
  const n=document.createElementNS(NS,tag);
  for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);
  return n;
}
function pointsAttr(poly){return poly.map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');}
function landPoly(id){return (LAND_BY_ID.get(id)?.points||[]).map(([x,y])=>({x,y}));}

let cellCacheKey='',cellCache=null;
function clipHalfPlane(poly,site,other){
  const dx=other.x-site.x,dy=other.y-site.y,mx=(site.x+other.x)/2,my=(site.y+other.y)/2;
  const f=p=>(p.x-mx)*dx+(p.y-my)*dy,out=[];
  for(let i=0;i<poly.length;i++){
    const a=poly[i],b=poly[(i+1)%poly.length],fa=f(a),fb=f(b),ina=fa<=0,inb=fb<=0;
    if(ina)out.push(a);
    if(ina!==inb){
      const t=fa/(fa-fb);
      out.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
    }
  }
  return out;
}
function territoryCell(t,territories){
  let poly=landPoly(t.landmass||'central');
  for(const o of territories){
    if(o.id===t.id||(o.landmass||'central')!==(t.landmass||'central'))continue;
    poly=clipHalfPlane(poly,t,o);
    if(poly.length<3)break;
  }
  return poly;
}
function getCells(territories){
  const key=territories.map(t=>`${t.id}:${t.x},${t.y}:${t.landmass||'central'}`).join('|');
  if(key!==cellCacheKey){
    cellCacheKey=key;
    cellCache=new Map(territories.map(t=>[t.id,territoryCell(t,territories)]));
  }
  return cellCache;
}
function worldKey(state){return state.territories.map(t=>`${t.id}:${t.x},${t.y}:${t.landmass||'central'}`).join('|');}

function createBadge(layer,t){
  const y=t.y+23;
  const rect=el('rect',{x:t.x-24,y,width:48,height:23,rx:11.5,class:`troop-badge owner-${t.owner}`});
  const text=el('text',{x:t.x,y:y+16,'text-anchor':'middle',class:'troop-text'});
  text.textContent=`● ${t.troops}`;
  layer.append(rect,text);
  let hq=null;
  if(t.hq){
    hq=el('text',{x:t.x,y:t.y-38,'text-anchor':'middle',class:'hq-star'});
    hq.textContent='★ QG';
    layer.append(hq);
  }
  return{rect,text,hq};
}
function drawFrontline(layer,state){
  for(const [id,ns] of Object.entries(NEIGHBORS)){
    const a=territoryById(state,id);if(!a)continue;
    for(const nid of ns){
      if(id>nid)continue;
      const b=territoryById(state,nid);
      if(!b||a.owner===b.owner||a.owner==='neutral'||b.owner==='neutral')continue;
      layer.append(el('path',{d:`M ${a.x} ${a.y} L ${b.x} ${b.y}`,class:'frontline v09-frontline'}));
    }
  }
}

function addEnvironment(map){
  const env=el('g',{class:'v09-environment','pointer-events':'none'});

  const sea=el('g',{class:'v09-sea-motion'});
  [
    'M 4 155 q 14 -5 28 0 t 28 0',
    'M 366 203 q 12 -4 24 0 t 24 0',
    'M 3 430 q 13 -4 26 0 t 26 0',
    'M 363 520 q 13 -4 26 0 t 26 0',
    'M 18 604 q 14 -4 28 0 t 28 0'
  ].forEach((d,i)=>{
    const p=el('path',{d,class:'v09-sea-streak'});
    const anim=el('animate',{
      attributeName:'stroke-dashoffset',from:'0',to:'-40',dur:`${5+i*.7}s`,repeatCount:'indefinite'
    });
    p.append(anim);sea.append(p);
  });
  env.append(sea);

  const wind=el('g',{class:'v09-wind'});
  ['M 52 112 q 14 -7 28 0','M 301 320 q 15 -8 31 0','M 96 566 q 14 -7 27 0'].forEach((d,i)=>{
    const p=el('path',{d,class:'v09-wind-line'});
    const anim=el('animate',{attributeName:'opacity',values:'.05;.34;.05',dur:`${4.2+i*.8}s`,repeatCount:'indefinite'});
    p.append(anim);wind.append(p);
  });
  env.append(wind);

  const plane=el('g',{class:'v09-plane'});
  plane.append(el('path',{d:'M -9 0 L -2 -2 L 1 -10 L 4 -10 L 3 -2 L 11 0 L 11 3 L 3 2 L 1 10 L -2 10 L -2 2 L -9 3 Z',class:'v09-plane-body'}));
  const fly=el('animateMotion',{dur:'19s',repeatCount:'indefinite',rotate:'auto',path:'M -30 205 C 72 170 160 138 248 118 S 425 72 455 30'});
  plane.append(fly);env.append(plane);

  const birds=el('g',{class:'v09-birds'});
  for(let i=0;i<2;i++){
    const flock=el('g',{class:'v09-flock'});
    flock.innerHTML='<path d="M0 2q3-4 6 0q3-4 6 0"/><path d="M15 7q2.5-3 5 0q2.5-3 5 0"/>';
    flock.append(el('animateMotion',{
      dur:i?'15s':'13s',repeatCount:'indefinite',rotate:'auto',
      path:i?'M 430 370 C 330 350 250 365 175 410 S 40 450 -30 430':'M -25 300 C 70 275 155 290 230 260 S 360 215 445 225'
    }));
    birds.append(flock);
  }
  env.append(birds);
  map.append(env);
  return env;
}

function buildWorld(state,map){
  map.replaceChildren();
  const cells=getCells(state.territories);
  const nodes=new Map();

  const staticLayer=el('g',{class:'v09-static-layer','pointer-events':'none'});
  const image=el('image',{
    href:'./assets/map/static/map-v09.svg?v=0.9',x:0,y:0,width:420,height:690,
    preserveAspectRatio:'xMidYMid meet',class:'v09-static-map'
  });
  staticLayer.append(image);map.append(staticLayer);
  const environmentLayer=addEnvironment(map);

  const interactionLayer=el('g',{class:'v09-interaction-layer'});
  map.append(interactionLayer);
  for(const t of state.territories){
    const poly=cells.get(t.id);if(!poly||poly.length<3)continue;
    const pts=pointsAttr(poly);
    const g=el('g',{class:'territory','data-id':t.id,'aria-label':`${t.id}, ${t.troops} tropas`});
    const hit=el('polygon',{points:pts,fill:'#ffffff','fill-opacity':'.001',class:'v09-hit-shape'});
    const tint=el('polygon',{points:pts,fill:OWNER[t.owner],class:'owner-tint v09-owner-tint'});
    g.append(hit,tint);interactionLayer.append(g);
    nodes.set(t.id,{g,tint,poly});
  }

  const borderLayer=el('g',{class:'v09-border-layer','pointer-events':'none'});
  map.append(borderLayer);
  for(const t of state.territories){
    const node=nodes.get(t.id);if(!node)continue;
    node.border=el('polygon',{points:pointsAttr(node.poly),fill:'none',stroke:OWNER[t.owner],class:'territory-border v09-border'});
    borderLayer.append(node.border);
  }

  const frontlineLayer=el('g',{class:'v09-frontline-layer','pointer-events':'none'});
  const actionLayer=el('g',{class:'v09-action-layer','pointer-events':'none'});
  const badgeLayer=el('g',{class:'badge-layer v09-badge-layer','pointer-events':'none'});
  map.append(frontlineLayer,actionLayer,badgeLayer);
  for(const t of state.territories){
    const node=nodes.get(t.id);if(node)node.badge=createBadge(badgeLayer,t);
  }

  worldCache={map,key:worldKey(state),nodes,staticLayer,environmentLayer,interactionLayer,borderLayer,frontlineLayer,actionLayer,badgeLayer};
  return worldCache;
}
function ensureWorld(state,map){
  const key=worldKey(state);
  if(!worldCache||worldCache.map!==map||worldCache.key!==key||worldCache.staticLayer.parentNode!==map)return buildWorld(state,map);
  return worldCache;
}
function updateWorld(state,cache){
  const src=state.selectedSource?territoryById(state,state.selectedSource):null;
  for(const t of state.territories){
    const node=cache.nodes.get(t.id);if(!node)continue;
    const selected=state.selectedSource===t.id||state.selectedTarget===t.id;
    const validTarget=src&&t.id!==src.id&&NEIGHBORS[src.id]?.includes(t.id);
    node.g.setAttribute('aria-label',`${t.id}, ${t.troops} tropas`);
    node.tint.setAttribute('fill',OWNER[t.owner]);
    node.border.setAttribute('stroke',OWNER[t.owner]);
    node.border.setAttribute('class',`territory-border v09-border ${selected?'selected':''} ${validTarget?'valid-target':''}`);
    node.badge.rect.setAttribute('class',`troop-badge owner-${t.owner}`);
    node.badge.text.textContent=`● ${t.troops}`;
  }

  cache.frontlineLayer.replaceChildren();
  drawFrontline(cache.frontlineLayer,state);
  cache.actionLayer.replaceChildren();
  if(state.selectedSource&&state.selectedTarget){
    const a=territoryById(state,state.selectedSource),b=territoryById(state,state.selectedTarget),moving=b?.owner==='blue';
    cache.actionLayer.append(el('path',{
      d:`M ${a.x} ${a.y} Q ${(a.x+b.x)/2+12} ${(a.y+b.y)/2-18} ${b.x} ${b.y}`,
      class:`attack-arrow ${moving?'transfer-arrow':''}`
    }));
  }
}

export function render(state,refs){
  const cache=ensureWorld(state,refs.map);
  updateWorld(state,cache);

  refs.turnLabel.textContent=`${state.turn}/${state.maxTurns}`;
  const bp=territoryPercent(state,'blue'),rp=territoryPercent(state,'red');
  refs.blueScore.textContent=`${bp}%`;
  refs.redScore.textContent=`${rp}%`;
  refs.warBlue.style.width=`${bp}%`;

  refs.orders.innerHTML='';
  for(let i=0;i<state.maxOrders;i++){
    const s=document.createElement('i');
    if(i<state.orders)s.classList.add('filled');
    refs.orders.append(s);
  }
  refs.ownedCount.textContent=owned(state,'blue').length;
  refs.neutralCount.textContent=owned(state,'neutral').length;
  refs.hqCount.textContent=owned(state,'blue').some(t=>t.hq)?'1':'0';

  const src=state.selectedSource?territoryById(state,state.selectedSource):null;
  const tar=state.selectedTarget?territoryById(state,state.selectedTarget):null;
  const hasAction=!!(src&&tar&&state.phase==='player'&&!state.winner);
  const isTransfer=!!(src&&tar&&tar.owner==='blue');

  refs.attackBtn.hidden=!hasAction;
  refs.attackBtn.textContent=isTransfer?'MOVER':'ATACAR';
  refs.chanceBox.hidden=!(src&&tar&&!isTransfer);
  refs.attackStrength.hidden=!(src&&tar);

  if(src&&tar){
    const maxSent=maxAttackTroops(src);
    const sent=Math.max(1,Math.min(maxSent,state.attackTroops||maxSent));
    refs.attackTroops.min='1';
    refs.attackTroops.max=String(maxSent);
    refs.attackTroops.value=String(sent);
    refs.attackTroops.disabled=maxSent<=1;
    refs.attackTroopsValue.textContent=String(sent);
    refs.attackTroopsMax.textContent=String(maxSent);
    const label=refs.attackStrength.querySelector('label');
    if(label?.firstChild)label.firstChild.textContent=isTransfer?'Mover ':'Enviar ';
    if(!isTransfer)refs.chanceText.textContent=`${Math.round(attackChance(src,tar,sent)*100)}%`;
    refs.actionTitle.textContent=`${src.id} → ${tar.id}`;
    refs.actionText.textContent=isTransfer
      ?(maxSent<=1?'Só 1 tropa pode ser transferida. Custa 1 ordem.':'Máximo selecionado. Reduza se quiser manter mais tropas na origem. Custa 1 ordem.')
      :(maxSent<=1?'Só 1 tropa pode ser enviada neste ataque.':'Máximo selecionado. Reduza apenas se quiser poupar tropas.');
  }else if(src){
    refs.actionTitle.textContent=`Território ${src.id} selecionado`;
    refs.actionText.textContent='Toque num vizinho seu para reforçar ou num inimigo/neutro para atacar.';
  }else{
    refs.actionTitle.textContent=state.phase==='player'?'Sua vez':'Turno inimigo';
    refs.actionText.textContent=state.phase==='player'?'Escolha um território azul com pelo menos 2 tropas.':'O inimigo está executando suas ordens.';
  }

  refs.endTurnBtn.disabled=state.phase!=='player'||!!state.winner;
  refs.reinforceCard.disabled=state.phase!=='player'||state.reinforceUsed||state.orders<1||!!state.winner;
  if(state.winner){
    refs.actionTitle.textContent=state.winner==='blue'?'Vitória!':'Derrota';
    refs.actionText.textContent=state.winner==='blue'?'O QG inimigo foi conquistado.':'Seu QG caiu.';
  }
}
