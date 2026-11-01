import { NEIGHBORS, LANDMASSES } from '../data/map.js?v=0.8.2';
import { attackChance, maxAttackTroops } from '../game/combat.js';
import { territoryById, owned, territoryPercent } from '../game/state.js';
import { territorySurface, installTerrainDefs, decorateTerritory } from './terrain-v082.js?v=0.8.2';

const NS='http://www.w3.org/2000/svg';
const OWNER={blue:'#4faef7',red:'#ed674b',neutral:'#d9d0aa'};
const LAND_BY_ID=new Map(LANDMASSES.map(m=>[m.id,m]));
const SEA_BOUNDS={x:-900,y:-900,w:2200,h:2500};
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
function worldKey(state){
  return state.territories.map(t=>`${t.id}:${t.x},${t.y}:${t.terrain}:${t.landmass||'central'}:${t.hq?t.owner:''}`).join('|');
}

function drawBackdrop(map){
  const defs=el('defs',{id:'mapDefs'});
  const seaGrad=el('linearGradient',{id:'seaGrad',x1:'0',y1:'0',x2:'0',y2:'1'});
  seaGrad.innerHTML='<stop offset="0" stop-color="#0d6070"/><stop offset=".55" stop-color="#084f60"/><stop offset="1" stop-color="#063d4d"/>';
  defs.append(seaGrad);
  installTerrainDefs(defs,el);
  map.append(defs);
  map.append(el('rect',{x:SEA_BOUNDS.x,y:SEA_BOUNDS.y,width:SEA_BOUNDS.w,height:SEA_BOUNDS.h,fill:'url(#seaGrad)'}));

  let waveD='';
  for(let y=-850;y<1550;y+=96)waveD+=`M -900 ${y} q 96 -7 192 0 t 192 0 t 192 0 t 192 0 t 192 0 t 192 0 `;
  map.append(el('path',{d:waveD,class:'wave v081-wave'}));

  [[18,116,6],[396,188,5],[14,390,4],[401,540,7]].forEach(([x,y,r])=>{
    map.append(el('ellipse',{cx:x,cy:y,rx:r*1.4,ry:r,class:'sea-rock'}));
  });
  for(const mass of LANDMASSES){
    const pts=mass.points.map(p=>p.join(',')).join(' ');
    map.append(el('polygon',{points:pts,class:'island-shadow-under',transform:'translate(0 5)'}));
    map.append(el('polygon',{points:pts,class:'island-shadow'}));
    map.append(el('polygon',{points:pts,class:'coast-foam'}));
  }
  return defs;
}
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
      layer.append(el('path',{d:`M ${a.x} ${a.y} L ${b.x} ${b.y}`,class:'frontline'}));
    }
  }
}

function buildWorld(state,map){
  map.replaceChildren();
  const defs=drawBackdrop(map);
  const cells=getCells(state.territories);
  const nodes=new Map();

  const terrainLayer=el('g',{class:'v082-terrain-layer'});
  map.append(terrainLayer);
  for(const t of state.territories){
    const poly=cells.get(t.id);if(!poly||poly.length<3)continue;
    const pts=pointsAttr(poly);
    const g=el('g',{class:'territory','data-id':t.id,'aria-label':`${t.id}, ${t.troops} tropas`});
    g.append(el('polygon',{points:pts,fill:territorySurface(t),class:'territory-base'}));
    const tint=el('polygon',{points:pts,fill:OWNER[t.owner],class:'owner-tint'});
    g.append(tint);
    const clipId=`clip082-${t.id}`;
    const cp=el('clipPath',{id:clipId});
    cp.append(el('polygon',{points:pts}));
    defs.append(cp);
    const decor=el('g',{'clip-path':`url(#${clipId})`,class:`terrain-decor terrain-${t.terrain}`});
    decorateTerritory({g:decor,t,poly,el});
    g.append(decor);
    terrainLayer.append(g);
    nodes.set(t.id,{g,tint,poly});
  }

  const borderLayer=el('g',{class:'v082-border-layer','pointer-events':'none'});
  map.append(borderLayer);
  for(const t of state.territories){
    const node=nodes.get(t.id);if(!node)continue;
    node.border=el('polygon',{points:pointsAttr(node.poly),fill:'none',stroke:OWNER[t.owner],class:'territory-border'});
    borderLayer.append(node.border);
  }

  const frontlineLayer=el('g',{class:'v082-frontline-layer','pointer-events':'none'});
  const actionLayer=el('g',{class:'v082-action-layer','pointer-events':'none'});
  const badgeLayer=el('g',{class:'badge-layer','pointer-events':'none'});
  map.append(frontlineLayer,actionLayer,badgeLayer);
  for(const t of state.territories){
    const node=nodes.get(t.id);if(node)node.badge=createBadge(badgeLayer,t);
  }

  worldCache={map,key:worldKey(state),nodes,terrainLayer,borderLayer,frontlineLayer,actionLayer,badgeLayer};
  return worldCache;
}
function ensureWorld(state,map){
  const key=worldKey(state);
  if(!worldCache||worldCache.map!==map||worldCache.key!==key||worldCache.terrainLayer.parentNode!==map)return buildWorld(state,map);
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
    node.border.setAttribute('class',`territory-border ${selected?'selected':''} ${validTarget?'valid-target':''}`);
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
