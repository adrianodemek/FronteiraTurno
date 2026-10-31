import { NEIGHBORS } from '../data/map.js';
import { attackChance } from '../game/combat.js';
import { territoryById, owned, territoryPercent } from '../game/state.js';

const NS='http://www.w3.org/2000/svg';
const TERRAIN={
  city:'#77705c', forest:'#2f5b3a', snow:'#b9c8ca', rock:'#666a67', port:'#5b7379', farm:'#8e8a4e', plains:'#7f8357'
};
const OWNER={blue:'#45a9ff', red:'#ff6449', neutral:'#d8cfaa'};

function hexPoints(cx,cy,r=53){
  const pts=[];
  for(let i=0;i<6;i++){
    const a=(Math.PI/180)*(60*i);
    pts.push(`${cx+r*Math.cos(a)},${cy+r*Math.sin(a)}`);
  }
  return pts.join(' ');
}
function el(tag,attrs={}){
  const n=document.createElementNS(NS,tag);
  for(const [k,v] of Object.entries(attrs)) n.setAttribute(k,v);
  return n;
}
function drawTerrain(g,t){
  const c={x:t.x,y:t.y};
  if(t.terrain==='forest'){
    for(const [dx,dy,s] of [[-24,-14,8],[0,-23,10],[24,-9,7],[-9,15,9],[19,20,8]]){
      const tri=el('path',{d:`M ${c.x+dx} ${c.y+dy-s} l ${-s} ${s*1.6} h ${s*2} z`,class:'tree'}); g.append(tri);
    }
  } else if(t.terrain==='city' || t.terrain==='port'){
    for(const [dx,dy,w,h] of [[-25,-16,16,13],[-3,-25,18,18],[18,-5,17,14],[-15,12,21,15]]){
      g.append(el('rect',{x:c.x+dx,y:c.y+dy,width:w,height:h,rx:2,class:'building'}));
    }
    if(t.terrain==='port') g.append(el('path',{d:`M ${c.x-33} ${c.y+27} h 66`,class:'dock'}));
  } else if(t.terrain==='farm'){
    for(let i=-28;i<=28;i+=10) g.append(el('path',{d:`M ${c.x-33} ${c.y+i} h 66`,class:'farmline'}));
  } else if(t.terrain==='snow' || t.terrain==='rock'){
    for(const [dx,dy,s] of [[-22,9,15],[3,-19,20],[24,13,13]]){
      g.append(el('path',{d:`M ${c.x+dx-s} ${c.y+dy+s/2} L ${c.x+dx} ${c.y+dy-s} L ${c.x+dx+s} ${c.y+dy+s/2} Z`,class:'mountain'}));
    }
  } else {
    for(const [dx,dy] of [[-25,-9],[10,-21],[25,16],[-7,20]]) g.append(el('circle',{cx:c.x+dx,cy:c.y+dy,r:3,class:'scrub'}));
  }
}
function badge(g,t){
  const bg=el('rect',{x:t.x-31,y:t.y+17,width:62,height:30,rx:13,class:`troop-badge owner-${t.owner}`});
  const txt=el('text',{x:t.x,y:t.y+38,'text-anchor':'middle',class:'troop-text'}); txt.textContent=`● ${t.troops}`;
  g.append(bg,txt);
  if(t.hq){
    const q=el('text',{x:t.x,y:t.y-28,'text-anchor':'middle',class:'hq-star'}); q.textContent='★ QG'; g.append(q);
  }
}

export function render(state, refs){
  const map=refs.map; map.innerHTML='';
  const defs=el('defs');
  const glow=el('filter',{id:'glow',x:'-30%',y:'-30%',width:'160%',height:'160%'});
  glow.innerHTML='<feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>';
  defs.append(glow); map.append(defs);

  const sea=el('rect',{x:0,y:0,width:420,height:650,class:'sea'}); map.append(sea);
  for(let y=20;y<640;y+=34){ map.append(el('path',{d:`M 0 ${y} Q 70 ${y-9} 140 ${y} T 280 ${y} T 420 ${y}`,class:'wave'})); }

  for(const t of state.territories){
    const g=el('g',{class:'territory', 'data-id':t.id, tabindex:'0', role:'button', 'aria-label':`${t.id}, ${t.troops} tropas`});
    const selected=state.selectedSource===t.id || state.selectedTarget===t.id;
    const source=state.selectedSource ? territoryById(state,state.selectedSource) : null;
    const validTarget=source && source.owner==='blue' && t.owner!=='blue' && NEIGHBORS[source.id]?.includes(t.id);
    const poly=el('polygon',{points:hexPoints(t.x,t.y),fill:TERRAIN[t.terrain],stroke:OWNER[t.owner],class:`territory-shape ${selected?'selected':''} ${validTarget?'valid-target':''}`});
    if(selected) poly.setAttribute('filter','url(#glow)');
    g.append(poly);
    const tint=el('polygon',{points:hexPoints(t.x,t.y,48),fill:OWNER[t.owner],class:'owner-tint'}); g.append(tint);
    drawTerrain(g,t); badge(g,t);
    map.append(g);
  }

  if(state.selectedSource && state.selectedTarget){
    const a=territoryById(state,state.selectedSource), b=territoryById(state,state.selectedTarget);
    const line=el('path',{d:`M ${a.x} ${a.y+10} Q ${(a.x+b.x)/2+15} ${(a.y+b.y)/2-20} ${b.x} ${b.y-12}`,class:'attack-arrow'});
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
