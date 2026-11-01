import { NEIGHBORS, LANDMASSES } from '../data/map.js';
import { attackChance, maxAttackTroops } from '../game/combat.js';
import { territoryById, owned, territoryPercent } from '../game/state.js';

const NS='http://www.w3.org/2000/svg';
const TERRAIN={city:'#7e765e',forest:'#315e3d',snow:'#c4d3d4',rock:'#777b75',port:'#617b7e',farm:'#948b50',plains:'#87905f'};
const OWNER={blue:'#4faef7',red:'#ed674b',neutral:'#ddd4aa'};
const LAND_BY_ID=new Map(LANDMASSES.map(m=>[m.id,m]));
const SEA_BOUNDS={x:-900,y:-900,w:2200,h:2500};

function el(tag,attrs={}){const n=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);return n;}
function pointsAttr(poly){return poly.map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');}
function landPoly(id){return (LAND_BY_ID.get(id)?.points||[]).map(([x,y])=>({x,y}));}
let cellCacheKey='',cellCache=null;
function clipHalfPlane(poly,site,other){const dx=other.x-site.x,dy=other.y-site.y,mx=(site.x+other.x)/2,my=(site.y+other.y)/2,f=p=>(p.x-mx)*dx+(p.y-my)*dy,out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],fa=f(a),fb=f(b),ina=fa<=0,inb=fb<=0;if(ina)out.push(a);if(ina!==inb){const t=fa/(fa-fb);out.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});}}return out;}
function territoryCell(t,territories){let poly=landPoly(t.landmass||'central');for(const o of territories){if(o.id===t.id||(o.landmass||'central')!==(t.landmass||'central'))continue;poly=clipHalfPlane(poly,t,o);if(poly.length<3)break;}return poly;}
function getCells(territories){const key=territories.map(t=>`${t.id}:${t.x},${t.y}:${t.landmass||'central'}`).join('|');if(key!==cellCacheKey){cellCacheKey=key;cellCache=new Map(territories.map(t=>[t.id,territoryCell(t,territories)]));}return cellCache;}
function drawTerrain(g,t){const c=t;if(t.terrain==='forest'){for(const [dx,dy,s] of [[-20,-13,6],[-5,-18,7],[12,-14,6],[23,-3,5],[-14,4,7],[4,7,6],[18,15,6],[-5,17,5]])g.append(el('path',{d:`M ${c.x+dx} ${c.y+dy-s} l ${-s} ${s*1.7} h ${s*2} z`,class:'tree'}));}else if(t.terrain==='city'||t.terrain==='port'){for(const [dx,dy,w,h] of [[-22,-13,12,10],[-5,-21,14,13],[13,-7,13,11],[-14,7,15,11],[7,10,15,10]])g.append(el('rect',{x:c.x+dx,y:c.y+dy,width:w,height:h,rx:1.5,class:'building'}));if(t.terrain==='port')g.append(el('path',{d:`M ${c.x-26} ${c.y+22} h 52`,class:'dock'}));}else if(t.terrain==='farm'){for(let i=-19;i<=19;i+=7)g.append(el('path',{d:`M ${c.x-25} ${c.y+i} q 25 -4 50 0`,class:'farmline'}));}else if(t.terrain==='snow'||t.terrain==='rock'){for(const [dx,dy,s] of [[-16,7,11],[4,-13,15],[19,10,9]])g.append(el('path',{d:`M ${c.x+dx-s} ${c.y+dy+s/2} L ${c.x+dx} ${c.y+dy-s} L ${c.x+dx+s} ${c.y+dy+s/2} Z`,class:'mountain'}));}else{for(const [dx,dy,r] of [[-20,-8,2.3],[8,-15,2],[20,10,2.5],[-6,14,2.2]])g.append(el('circle',{cx:c.x+dx,cy:c.y+dy,r,class:'scrub'}));}}
function badge(g,t){const y=t.y+21;g.append(el('rect',{x:t.x-26,y,width:52,height:25,rx:12,class:`troop-badge owner-${t.owner}`}));const txt=el('text',{x:t.x,y:y+17,'text-anchor':'middle',class:'troop-text'});txt.textContent=`● ${t.troops}`;g.append(txt);if(t.hq){const q=el('text',{x:t.x,y:t.y-27,'text-anchor':'middle',class:'hq-star'});q.textContent='★ QG';g.append(q);}}
function drawBackdrop(map){const defs=el('defs'),seaGrad=el('linearGradient',{id:'seaGrad',x1:'0',y1:'0',x2:'0',y2:'1'});seaGrad.innerHTML='<stop offset="0" stop-color="#0c6072"/><stop offset="1" stop-color="#063e4e"/>';const glow=el('filter',{id:'glow',x:'-30%',y:'-30%',width:'160%',height:'160%'});glow.innerHTML='<feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>';defs.append(seaGrad,glow);map.append(defs);map.append(el('rect',{x:SEA_BOUNDS.x,y:SEA_BOUNDS.y,width:SEA_BOUNDS.w,height:SEA_BOUNDS.h,fill:'url(#seaGrad)'}));let waveD='';for(let y=-850;y<1550;y+=58)waveD+=`M -900 ${y} Q -500 ${y-8} -100 ${y} T 700 ${y} T 1300 ${y} `;map.append(el('path',{d:waveD,class:'wave'}));for(const mass of LANDMASSES){const pts=mass.points.map(p=>p.join(',')).join(' ');map.append(el('polygon',{points:pts,class:'island-shadow-under',transform:'translate(0 4)'}));map.append(el('polygon',{points:pts,class:'island-shadow'}));map.append(el('polygon',{points:pts,class:'coast-foam'}));}}
function drawFrontline(map,state){for(const [id,ns] of Object.entries(NEIGHBORS)){const a=territoryById(state,id);if(!a)continue;for(const nid of ns){if(id>nid)continue;const b=territoryById(state,nid);if(!b||a.owner===b.owner||a.owner==='neutral'||b.owner==='neutral')continue;map.append(el('path',{d:`M ${a.x} ${a.y} L ${b.x} ${b.y}`,class:'frontline'}));}}}

export function render(state,refs){
  const map=refs.map;map.innerHTML='';drawBackdrop(map);const cells=getCells(state.territories);
  for(const t of state.territories){const poly=cells.get(t.id);if(!poly||poly.length<3)continue;const g=el('g',{class:'territory','data-id':t.id,tabindex:'0',role:'button','aria-label':`${t.id}, ${t.troops} tropas`}),selected=state.selectedSource===t.id||state.selectedTarget===t.id,source=state.selectedSource?territoryById(state,state.selectedSource):null,validTarget=source&&source.owner==='blue'&&t.owner!=='blue'&&NEIGHBORS[source.id]?.includes(t.id),shape=el('polygon',{points:pointsAttr(poly),fill:TERRAIN[t.terrain],stroke:OWNER[t.owner],class:`territory-shape ${selected?'selected':''} ${validTarget?'valid-target':''}`});if(selected)shape.setAttribute('filter','url(#glow)');g.append(shape);g.append(el('polygon',{points:pointsAttr(poly),fill:OWNER[t.owner],class:'owner-tint'}));drawTerrain(g,t);badge(g,t);map.append(g);}
  drawFrontline(map,state);
  if(state.selectedSource&&state.selectedTarget){const a=territoryById(state,state.selectedSource),b=territoryById(state,state.selectedTarget);map.append(el('path',{d:`M ${a.x} ${a.y} Q ${(a.x+b.x)/2+12} ${(a.y+b.y)/2-18} ${b.x} ${b.y}`,class:'attack-arrow'}));}

  refs.turnLabel.textContent=`${state.turn}/${state.maxTurns}`;
  const bp=territoryPercent(state,'blue'),rp=territoryPercent(state,'red');refs.blueScore.textContent=`${bp}%`;refs.redScore.textContent=`${rp}%`;refs.warBlue.style.width=`${bp}%`;
  refs.orders.innerHTML='';for(let i=0;i<state.maxOrders;i++){const s=document.createElement('i');if(i<state.orders)s.classList.add('filled');refs.orders.append(s);}
  refs.ownedCount.textContent=owned(state,'blue').length;refs.neutralCount.textContent=owned(state,'neutral').length;refs.hqCount.textContent=owned(state,'blue').some(t=>t.hq)?'1':'0';

  const src=state.selectedSource?territoryById(state,state.selectedSource):null;
  const tar=state.selectedTarget?territoryById(state,state.selectedTarget):null;
  const hasAttack=!!(src&&tar&&state.phase==='player'&&!state.winner);
  refs.attackBtn.hidden=!hasAttack;
  refs.chanceBox.hidden=!(src&&tar);
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
    refs.chanceText.textContent=`${Math.round(attackChance(src,tar,sent)*100)}%`;
    refs.actionTitle.textContent=`${src.id} → ${tar.id}`;
    refs.actionText.textContent=maxSent<=1?'Só 1 tropa pode ser enviada neste ataque.':'Máximo selecionado. Reduza apenas se quiser poupar tropas.';
  }else if(src){
    refs.actionTitle.textContent=`Território ${src.id} selecionado`;
    refs.actionText.textContent='Escolha um território vizinho inimigo ou neutro.';
  }else{
    refs.actionTitle.textContent=state.phase==='player'?'Sua vez':'Turno inimigo';
    refs.actionText.textContent=state.phase==='player'?'Escolha um território azul com pelo menos 2 tropas.':'O inimigo está executando suas ordens.';
  }

  refs.endTurnBtn.disabled=state.phase!=='player'||!!state.winner;
  refs.reinforceCard.disabled=state.phase!=='player'||state.reinforceUsed||state.orders<1||!!state.winner;
  if(state.winner){refs.actionTitle.textContent=state.winner==='blue'?'Vitória!':'Derrota';refs.actionText.textContent=state.winner==='blue'?'O QG inimigo foi conquistado.':'Seu QG caiu.';}
}
