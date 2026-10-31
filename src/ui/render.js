import { NEIGHBORS } from '../data/map.js';
import { attackChance } from '../game/combat.js';
import { territoryById, owned, territoryPercent } from '../game/state.js';

const NS='http://www.w3.org/2000/svg';
const TERRAIN={
  city:'#706853', forest:'#2a5738', snow:'#b7c7ca', rock:'#666a68', port:'#587279', farm:'#91884b', plains:'#7b8255'
};
const OWNER={blue:'#45a9ff', red:'#ff6449', neutral:'#d8cfaa'};

function el(tag,attrs={}){
  const n=document.createElementNS(NS,tag);
  for(const [k,v] of Object.entries(attrs)) n.setAttribute(k,v);
  return n;
}

function hashId(id){
  let h=2166136261;
  for(const ch of id){ h^=ch.charCodeAt(0); h=Math.imul(h,16777619); }
  return h>>>0;
}

function regionPoints(t, inset=0){
  const seed=hashId(t.id);
  const count=10;
  const pts=[];
  for(let i=0;i<count;i++){
    const a=(-90+i*(360/count))*Math.PI/180;
    const wobble=((seed>>(i%16))&7)-3;
    const base=56-inset;
    const rx=base + wobble*1.15 + (i%2?3:-1);
    const ry=(base*.86) + (((seed>>(i%12))&3)-1)*1.2;
    pts.push(`${(t.x+Math.cos(a)*rx).toFixed(1)},${(t.y+Math.sin(a)*ry).toFixed(1)}`);
  }
  return pts.join(' ');
}

function drawTerrain(g,t){
  const c={x:t.x,y:t.y};
  if(t.terrain==='forest'){
    for(const [dx,dy,s] of [[-29,-18,7],[-9,-26,8],[11,-21,9],[29,-8,7],[-19,3,9],[2,5,8],[24,15,9],[-8,24,8]]){
      g.append(el('path',{d:`M ${c.x+dx} ${c.y+dy-s} l ${-s} ${s*1.7} h ${s*2} z`,class:'tree'}));
    }
  } else if(t.terrain==='city' || t.terrain==='port'){
    for(const [dx,dy,w,h] of [[-28,-18,15,12],[-6,-28,18,16],[18,-9,16,13],[-20,10,18,14],[6,15,19,13]]){
      g.append(el('rect',{x:c.x+dx,y:c.y+dy,width:w,height:h,rx:2,class:'building'}));
    }
    g.append(el('path',{d:`M ${c.x-36} ${c.y+7} Q ${c.x} ${c.y-4} ${c.x+36} ${c.y+8}`,class:'road'}));
    if(t.terrain==='port'){
      g.append(el('path',{d:`M ${c.x-34} ${c.y+29} h 68`,class:'dock'}));
      g.append(el('path',{d:`M ${c.x-20} ${c.y+25} v 10 M ${c.x+8} ${c.y+25} v 10`,class:'pier'}));
    }
  } else if(t.terrain==='farm'){
    for(let i=-26;i<=26;i+=9) g.append(el('path',{d:`M ${c.x-34} ${c.y+i} Q ${c.x} ${c.y+i-3} ${c.x+34} ${c.y+i}`,class:'farmline'}));
    g.append(el('circle',{cx:c.x+18,cy:c.y-19,r:4,class:'scrub'}));
  } else if(t.terrain==='snow' || t.terrain==='rock'){
    for(const [dx,dy,s] of [[-23,11,14],[4,-18,21],[26,14,12]]){
      g.append(el('path',{d:`M ${c.x+dx-s} ${c.y+dy+s/2} L ${c.x+dx} ${c.y+dy-s} L ${c.x+dx+s} ${c.y+dy+s/2} Z`,class:'mountain'}));
    }
    if(t.terrain==='snow') g.append(el('path',{d:`M ${c.x-18} ${c.y-6} Q ${c.x} ${c.y-17} ${c.x+21} ${c.y-8}`,class:'snowcap'}));
  } else {
    for(const [dx,dy,r] of [[-27,-12,3],[8,-22,2.6],[26,13,3.2],[-8,22,2.8],[18,28,2.4]]) g.append(el('circle',{cx:c.x+dx,cy:c.y+dy,r,class:'scrub'}));
    g.append(el('path',{d:`M ${c.x-34} ${c.y+12} Q ${c.x-5} ${c.y-8} ${c.x+33} ${c.y+4}`,class:'road'}));
  }
}

function badge(g,t){
  const bg=el('rect',{x:t.x-31,y:t.y+18,width:62,height:29,rx:13,class:`troop-badge owner-${t.owner}`});
  const txt=el('text',{x:t.x,y:t.y+38,'text-anchor':'middle',class:'troop-text'}); txt.textContent=`● ${t.troops}`;
  g.append(bg,txt);
  if(t.hq){
    const q=el('text',{x:t.x,y:t.y-30,'text-anchor':'middle',class:'hq-star'}); q.textContent='★ QG'; g.append(q);
  }
}

function drawSeaAndIsland(map){
  const defs=el('defs');
  const seaGrad=el('linearGradient',{id:'seaGrad',x1:'0',y1:'0',x2:'1',y2:'1'});
  seaGrad.innerHTML='<stop offset="0%" stop-color="#0c6072"/><stop offset="48%" stop-color="#0b4e61"/><stop offset="100%" stop-color="#073b49"/>';
  const islandGrad=el('linearGradient',{id:'islandGrad',x1:'0',y1:'0',x2:'0',y2:'1'});
  islandGrad.innerHTML='<stop offset="0%" stop-color="#697057"/><stop offset="100%" stop-color="#5a5542"/>';
  const glow=el('filter',{id:'glow',x:'-30%',y:'-30%',width:'160%',height:'160%'});
  glow.innerHTML='<feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>';
  const coastShadow=el('filter',{id:'coastShadow',x:'-20%',y:'-20%',width:'140%',height:'140%'});
  coastShadow.innerHTML='<feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#00151b" flood-opacity="0.75"/>';
  defs.append(seaGrad,islandGrad,glow,coastShadow); map.append(defs);

  map.append(el('rect',{x:0,y:0,width:420,height:650,fill:'url(#seaGrad)',class:'sea'}));
  for(let y=18;y<645;y+=27){
    map.append(el('path',{d:`M -10 ${y} Q 55 ${y-7} 120 ${y} T 250 ${y} T 430 ${y}`,class:'wave'}));
  }
  for(const [cx,cy,rx,ry] of [[30,135,8,4],[392,205,9,5],[24,505,7,4],[398,555,6,3]]){
    map.append(el('ellipse',{cx,cy,rx,ry,class:'islet'}));
  }

  const island=el('path',{d:'M 121 12 C 168 2 236 5 290 27 C 332 45 365 79 378 126 C 401 171 404 224 392 269 C 408 316 407 361 395 405 C 387 450 367 495 336 531 C 317 574 286 614 247 632 C 207 649 158 640 123 621 C 85 603 60 570 50 533 C 25 496 18 449 24 406 C 7 360 9 315 19 274 C 4 224 12 178 29 140 C 45 99 74 55 121 12 Z',fill:'url(#islandGrad)',class:'island-base',filter:'url(#coastShadow)'});
  map.append(island);
  map.append(el('path',{d:'M 121 12 C 168 2 236 5 290 27 C 332 45 365 79 378 126 C 401 171 404 224 392 269 C 408 316 407 361 395 405 C 387 450 367 495 336 531 C 317 574 286 614 247 632 C 207 649 158 640 123 621 C 85 603 60 570 50 533 C 25 496 18 449 24 406 C 7 360 9 315 19 274 C 4 224 12 178 29 140 C 45 99 74 55 121 12 Z',class:'coast-foam'}));
}

export function render(state, refs){
  const map=refs.map; map.innerHTML='';
  drawSeaAndIsland(map);

  for(const t of state.territories){
    const g=el('g',{class:'territory', 'data-id':t.id, tabindex:'0', role:'button', 'aria-label':`${t.id}, ${t.troops} tropas`});
    const selected=state.selectedSource===t.id || state.selectedTarget===t.id;
    const source=state.selectedSource ? territoryById(state,state.selectedSource) : null;
    const validTarget=source && source.owner==='blue' && t.owner!=='blue' && NEIGHBORS[source.id]?.includes(t.id);
    const poly=el('polygon',{points:regionPoints(t),fill:TERRAIN[t.terrain],stroke:OWNER[t.owner],class:`territory-shape ${selected?'selected':''} ${validTarget?'valid-target':''}`});
    if(selected) poly.setAttribute('filter','url(#glow)');
    g.append(poly);
    const tint=el('polygon',{points:regionPoints(t,5),fill:OWNER[t.owner],class:'owner-tint'}); g.append(tint);
    drawTerrain(g,t); badge(g,t);
    map.append(g);
  }

  if(state.selectedSource && state.selectedTarget){
    const a=territoryById(state,state.selectedSource), b=territoryById(state,state.selectedTarget);
    const line=el('path',{d:`M ${a.x} ${a.y+8} Q ${(a.x+b.x)/2+18} ${(a.y+b.y)/2-22} ${b.x} ${b.y-14}`,class:'attack-arrow'});
    map.append(line);
  }

  refs.turnLabel.textContent=`${state.turn}/${state.maxTurns}`;
  const bp=territoryPercent(state,'blue'), rp=territoryPercent(state,'red');
  refs.blueScore.textContent=`${bp}%`; refs.redScore.textContent=`${rp}%`; refs.warBlue.style.width=`${bp}%`;
  refs.orders.innerHTML='';
  for(let i=0;i<state.maxOrders;i++){ const s=document.createElement('i'); if(i<state.orders) s.classList.add('filled'); refs.orders.append(s); }
  refs.ownedCount.textContent=owned(state,'blue').length;
  refs.neutralCount.textContent=owned(state,'neutral').length;
  refs.hqCount.textContent=owned(state,'blue').some(t=>t.hq)?'1':'0';

  const src=state.selectedSource?territoryById(state,state.selectedSource):null;
  const tar=state.selectedTarget?territoryById(state,state.selectedTarget):null;
  refs.attackBtn.hidden=!(src&&tar&&state.phase==='player'&&!state.winner);
  refs.chanceBox.hidden=!(src&&tar);
  if(src&&tar){ refs.chanceText.textContent=`${Math.round(attackChance(src,tar)*100)}%`; refs.actionTitle.textContent=`${src.id} → ${tar.id}`; refs.actionText.textContent=`Atacar com até ${Math.max(1,src.troops-1)} tropas. Custa 1 ordem.`; }
  else if(src){ refs.actionTitle.textContent=`Território ${src.id} selecionado`; refs.actionText.textContent='Escolha um território vizinho inimigo ou neutro.'; }
  else { refs.actionTitle.textContent=state.phase==='player'?'Sua vez':'Turno inimigo'; refs.actionText.textContent=state.phase==='player'?'Escolha um território azul com pelo menos 2 tropas.':'O inimigo está executando suas ordens.'; }

  refs.endTurnBtn.disabled=state.phase!=='player' || !!state.winner;
  refs.reinforceCard.disabled=state.phase!=='player' || state.reinforceUsed || state.orders<1 || !!state.winner;
  if(state.winner){ refs.actionTitle.textContent=state.winner==='blue'?'Vitória!':'Derrota'; refs.actionText.textContent=state.winner==='blue'?'O QG inimigo foi conquistado.':'Seu QG caiu.'; }
}
