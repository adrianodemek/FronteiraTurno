import { NEIGHBORS, LANDMASSES } from '../data/map.js?v=0.7';
import { attackChance, maxAttackTroops } from '../game/combat.js';
import { territoryById, owned, territoryPercent } from '../game/state.js';

const NS='http://www.w3.org/2000/svg';
const TERRAIN={
  city:'#80745c',forest:'#365f3d',snow:'#aebfc0',rock:'#75776e',
  port:'#667d79',farm:'#95894e',plains:'#7f8e59'
};
const OWNER={blue:'#4faef7',red:'#ed674b',neutral:'#d9d0aa'};
const LAND_BY_ID=new Map(LANDMASSES.map(m=>[m.id,m]));
const SEA_BOUNDS={x:-900,y:-900,w:2200,h:2500};
const ASSET='./assets/map/terrain/';
const SPRITES={
  forest:{file:'forest.svg',w:82,h:62,y:-10},
  city:{file:'city.svg',w:82,h:62,y:-9},
  farm:{file:'farm.svg',w:82,h:62,y:-8},
  rock:{file:'mountain.svg',w:82,h:62,y:-7},
  snow:{file:'snow.svg',w:82,h:62,y:-7},
  port:{file:'port.svg',w:84,h:63,y:-8},
  plains:{file:'plains.svg',w:82,h:60,y:-7}
};

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

function seedFor(text){
  let h=2166136261;
  for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}
  return h>>>0;
}
function mulberry32(a){
  return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
}
function addGroundTexture(g,t){
  const rnd=mulberry32(seedFor(t.id));
  for(let i=0;i<10;i++){
    const dx=(rnd()-.5)*72,dy=(rnd()-.5)*55;
    g.append(el('rect',{
      x:t.x+dx,y:t.y+dy,width:1.5+rnd()*2.8,height:1.2+rnd()*1.8,
      rx:.35,class:'ground-speck'
    }));
  }
}
function drawTerrainSprite(g,t){
  addGroundTexture(g,t);
  let spec;
  if(t.hq){
    spec={file:t.owner==='red'?'hq-red.svg':'hq-blue.svg',w:91,h:68,y:-13};
  }else spec=SPRITES[t.terrain]||SPRITES.plains;
  const img=el('image',{
    href:`${ASSET}${spec.file}?v=071`,
    x:t.x-spec.w/2,
    y:t.y-spec.h/2+spec.y,
    width:spec.w,
    height:spec.h,
    preserveAspectRatio:'xMidYMid meet',
    class:`terrain-sprite sprite-${t.hq?'hq':t.terrain}`,
    'pointer-events':'none'
  });
  img.style.imageRendering='pixelated';
  g.append(img);
}

function badge(g,t){
  const y=t.y+23;
  g.append(el('rect',{x:t.x-24,y,width:48,height:23,rx:11.5,class:`troop-badge owner-${t.owner}`}));
  const txt=el('text',{x:t.x,y:y+16,'text-anchor':'middle',class:'troop-text'});
  txt.textContent=`● ${t.troops}`;
  g.append(txt);
  if(t.hq){
    const q=el('text',{x:t.x,y:t.y-34,'text-anchor':'middle',class:'hq-star'});
    q.textContent='★ QG';
    g.append(q);
  }
}

function drawBackdrop(map){
  const defs=el('defs',{id:'mapDefs'});
  const seaGrad=el('linearGradient',{id:'seaGrad',x1:'0',y1:'0',x2:'0',y2:'1'});
  seaGrad.innerHTML='<stop offset="0" stop-color="#0d6070"/><stop offset=".55" stop-color="#084f60"/><stop offset="1" stop-color="#063d4d"/>';
  const glow=el('filter',{id:'glow',x:'-30%',y:'-30%',width:'160%',height:'160%'});
  glow.innerHTML='<feGaussianBlur stdDeviation="2.1" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>';
  defs.append(seaGrad,glow);
  map.append(defs);
  map.append(el('rect',{x:SEA_BOUNDS.x,y:SEA_BOUNDS.y,width:SEA_BOUNDS.w,height:SEA_BOUNDS.h,fill:'url(#seaGrad)'}));

  let waveD='';
  for(let y=-850;y<1550;y+=66)waveD+=`M -900 ${y} q 70 -8 140 0 t 140 0 t 140 0 t 140 0 t 140 0 t 140 0 t 140 0 `;
  map.append(el('path',{d:waveD,class:'wave'}));

  [[18,116,6],[396,188,5],[14,390,4],[401,540,7],[44,654,5],[378,92,3]].forEach(([x,y,r])=>{
    map.append(el('ellipse',{cx:x,cy:y,rx:r*1.4,ry:r,class:'sea-rock'}));
    map.append(el('path',{d:`M ${x-r*2} ${y+r+2} q ${r*2} 3 ${r*4} 0`,class:'foam-mini'}));
  });
  for(const mass of LANDMASSES){
    const pts=mass.points.map(p=>p.join(',')).join(' ');
    map.append(el('polygon',{points:pts,class:'island-shadow-under',transform:'translate(0 5)'}));
    map.append(el('polygon',{points:pts,class:'island-shadow'}));
    map.append(el('polygon',{points:pts,class:'coast-foam'}));
  }
  return defs;
}
function drawFrontline(map,state){
  for(const [id,ns] of Object.entries(NEIGHBORS)){
    const a=territoryById(state,id);if(!a)continue;
    for(const nid of ns){
      if(id>nid)continue;
      const b=territoryById(state,nid);
      if(!b||a.owner===b.owner||a.owner==='neutral'||b.owner==='neutral')continue;
      map.append(el('path',{d:`M ${a.x} ${a.y} L ${b.x} ${b.y}`,class:'frontline'}));
    }
  }
}

export function render(state,refs){
  const map=refs.map;
  map.innerHTML='';
  const defs=drawBackdrop(map);
  const cells=getCells(state.territories);
  const badges=[];

  for(const t of state.territories){
    const poly=cells.get(t.id);if(!poly||poly.length<3)continue;
    const source=state.selectedSource?territoryById(state,state.selectedSource):null;
    const selected=state.selectedSource===t.id||state.selectedTarget===t.id;
    const validTarget=source&&t.id!==source.id&&NEIGHBORS[source.id]?.includes(t.id);
    const g=el('g',{class:'territory','data-id':t.id,'aria-label':`${t.id}, ${t.troops} tropas`});
    const shape=el('polygon',{
      points:pointsAttr(poly),fill:TERRAIN[t.terrain],stroke:OWNER[t.owner],
      class:`territory-shape ${selected?'selected':''} ${validTarget?'valid-target':''}`
    });
    if(selected)shape.setAttribute('filter','url(#glow)');
    g.append(shape);
    g.append(el('polygon',{points:pointsAttr(poly),fill:OWNER[t.owner],class:'owner-tint'}));

    const clipId=`clip-${t.id}`;
    const cp=el('clipPath',{id:clipId});
    cp.append(el('polygon',{points:pointsAttr(poly)}));
    defs.append(cp);
    const decor=el('g',{'clip-path':`url(#${clipId})`,class:`terrain-decor terrain-${t.terrain}`});
    drawTerrainSprite(decor,t);
    g.append(decor);

    map.append(g);
    badges.push([g,t]);
  }

  drawFrontline(map,state);
  for(const [g,t] of badges)badge(g,t);

  if(state.selectedSource&&state.selectedTarget){
    const a=territoryById(state,state.selectedSource),b=territoryById(state,state.selectedTarget),moving=b?.owner==='blue';
    map.append(el('path',{
      d:`M ${a.x} ${a.y} Q ${(a.x+b.x)/2+12} ${(a.y+b.y)/2-18} ${b.x} ${b.y}`,
      class:`attack-arrow ${moving?'transfer-arrow':''}`
    }));
  }

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
    if(isTransfer){
      refs.actionText.textContent=maxSent<=1?'Só 1 tropa pode ser transferida. Custa 1 ordem.':'Máximo selecionado. Reduza se quiser manter mais tropas na origem. Custa 1 ordem.';
    }else{
      refs.actionText.textContent=maxSent<=1?'Só 1 tropa pode ser enviada neste ataque.':'Máximo selecionado. Reduza apenas se quiser poupar tropas.';
    }
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
