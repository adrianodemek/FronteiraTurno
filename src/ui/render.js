import { NEIGHBORS, LANDMASSES } from '../data/map.js?v=0.7';
import { attackChance, maxAttackTroops } from '../game/combat.js';
import { territoryById, owned, territoryPercent } from '../game/state.js';

const NS='http://www.w3.org/2000/svg';
const TERRAIN={
  city:'#80745c',
  forest:'#365f3d',
  snow:'#aebfc0',
  rock:'#75776e',
  port:'#667d79',
  farm:'#95894e',
  plains:'#7f8e59'
};
const OWNER={blue:'#4faef7',red:'#ed674b',neutral:'#d9d0aa'};
const LAND_BY_ID=new Map(LANDMASSES.map(m=>[m.id,m]));
const SEA_BOUNDS={x:-900,y:-900,w:2200,h:2500};

function el(tag,attrs={}){
  const n=document.createElementNS(NS,tag);
  for(const [k,v] of Object.entries(attrs)) n.setAttribute(k,v);
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

function drawTree(g,x,y,s=1){
  g.append(
    el('rect',{x:x-1.4*s,y:y+4*s,width:2.8*s,height:5*s,class:'tree-trunk'}),
    el('path',{d:`M ${x} ${y-9*s} L ${x-7*s} ${y+1*s} H ${x-3.5*s} L ${x-8*s} ${y+7*s} H ${x+8*s} L ${x+3.5*s} ${y+1*s} H ${x+7*s} Z`,class:'tree-crown'})
  );
}
function drawHouse(g,x,y,s=1,roof='warm'){
  g.append(
    el('rect',{x:x-6*s,y:y-2*s,width:12*s,height:9*s,rx:.7*s,class:'house-wall'}),
    el('path',{d:`M ${x-8*s} ${y-2*s} L ${x} ${y-8*s} L ${x+8*s} ${y-2*s} Z`,class:`house-roof roof-${roof}`}),
    el('rect',{x:x-1.5*s,y:y+2*s,width:3*s,height:5*s,class:'house-door'})
  );
}
function drawMountain(g,x,y,s=1,snow=false){
  g.append(
    el('path',{d:`M ${x-15*s} ${y+10*s} L ${x} ${y-15*s} L ${x+15*s} ${y+10*s} Z`,class:'mountain-main'}),
    el('path',{d:`M ${x} ${y-15*s} L ${x+15*s} ${y+10*s} L ${x+6*s} ${y+4*s} L ${x+2*s} ${y+8*s} Z`,class:'mountain-shadow'})
  );
  if(snow)g.append(el('path',{d:`M ${x} ${y-15*s} L ${x-5*s} ${y-6*s} L ${x-1*s} ${y-8*s} L ${x+3*s} ${y-4*s} L ${x+6*s} ${y-5*s} Z`,class:'snow-cap'}));
}
function drawBush(g,x,y,s=1){
  g.append(
    el('circle',{cx:x-3*s,cy:y,r:3.4*s,class:'bush'}),
    el('circle',{cx:x+2*s,cy:y-1.5*s,r:3.8*s,class:'bush'}),
    el('circle',{cx:x+5*s,cy:y+1.5*s,r:2.8*s,class:'bush'})
  );
}
function drawHQ(g,t){
  const x=t.x,y=t.y-4,enemy=t.owner==='red';
  g.append(
    el('rect',{x:x-19,y:y-10,width:38,height:23,rx:2,class:`hq-base ${enemy?'hq-red':'hq-blue'}`}),
    el('rect',{x:x-24,y:y-15,width:9,height:28,class:'hq-tower'}),
    el('rect',{x:x+15,y:y-15,width:9,height:28,class:'hq-tower'}),
    el('path',{d:`M ${x-25} ${y-15} h 11 l -5 -7 z M ${x+14} ${y-15} h 11 l -5 -7 z`,class:'hq-roof'}),
    el('rect',{x:x-2,y:y+2,width:4,height:11,class:'hq-gate'}),
    el('path',{d:`M ${x+19} ${y-18} v -13 h 15 l -4 4 4 4 h -15`,class:`hq-flag ${enemy?'hq-flag-red':'hq-flag-blue'}`})
  );
}
function drawTerrain(g,t){
  const rnd=mulberry32(seedFor(t.id));
  const x=t.x,y=t.y;

  for(let i=0;i<12;i++){
    const dx=(rnd()-.5)*70,dy=(rnd()-.5)*56;
    g.append(el('rect',{x:x+dx,y:y+dy,width:1.8+rnd()*2.5,height:1.2+rnd()*1.7,rx:.5,class:'ground-speck'}));
  }

  if(t.hq){
    drawHQ(g,t);
    for(const [dx,dy] of [[-31,18],[30,15],[-29,-21]])drawTree(g,x+dx,y+dy,.55);
    return;
  }

  if(t.terrain==='forest'){
    const spots=[[-26,-17],[-11,-22],[7,-18],[25,-12],[-30,2],[-14,1],[4,2],[22,5],[-22,20],[-3,18],[17,21],[31,17]];
    spots.forEach(([dx,dy],i)=>drawTree(g,x+dx+(i%2?2:-1),y+dy,.62+(i%3)*.06));
  }else if(t.terrain==='city'){
    g.append(el('path',{d:`M ${x-37} ${y+14} Q ${x-6} ${y+4} ${x+38} ${y+12}`,class:'local-road'}));
    [[-20,-10,1],[-4,-17,.9],[17,-8,1.05],[-25,9,.82],[2,8,1.1],[24,13,.78]].forEach(([dx,dy,s],i)=>drawHouse(g,x+dx,y+dy,s,i%2?'dark':'warm'));
  }else if(t.terrain==='port'){
    [[-18,-12,.88],[2,-16,.78],[20,-7,.82],[-10,6,.76]].forEach(([dx,dy,s],i)=>drawHouse(g,x+dx,y+dy,s,i%2?'dark':'warm'));
    g.append(
      el('path',{d:`M ${x-32} ${y+20} H ${x+31}`,class:'dock-main'}),
      el('path',{d:`M ${x-23} ${y+20} v 10 M ${x-4} ${y+20} v 12 M ${x+16} ${y+20} v 9`,class:'dock-pier'}),
      el('path',{d:`M ${x+26} ${y-22} v 22 M ${x+26} ${y-18} l 11 5 -11 4 Z`,class:'port-flag'})
    );
  }else if(t.terrain==='farm'){
    const patches=[[-27,-18,23,14],[-1,-20,28,15],[-31,2,28,15],[2,1,31,17]];
    patches.forEach(([dx,dy,w,h],i)=>{
      g.append(el('rect',{x:x+dx,y:y+dy,width:w,height:h,rx:1.3,class:`field-patch field-${i%2}`}));
      for(let k=4;k<w;k+=6)g.append(el('path',{d:`M ${x+dx+k} ${y+dy+2} v ${h-4}`,class:'field-line'}));
    });
    drawHouse(g,x+23,y+22,.7,'warm');
  }else if(t.terrain==='snow'){
    drawMountain(g,x-13,y+4,.9,true);drawMountain(g,x+15,y+7,.7,true);
    for(const [dx,dy] of [[-29,20],[30,-15],[5,25]])g.append(el('circle',{cx:x+dx,cy:y+dy,r:2.5,class:'snow-rock'}));
  }else if(t.terrain==='rock'){
    drawMountain(g,x-14,y+6,.72,false);drawMountain(g,x+15,y+10,.58,false);
    for(const [dx,dy] of [[-29,-18],[28,-14],[1,24]])g.append(el('path',{d:`M ${x+dx-4} ${y+dy+3} l 4 -7 5 5 -2 5 z`,class:'rock-chip'}));
  }else{
    g.append(el('path',{d:`M ${x-34} ${y+14} Q ${x-9} ${y-1} ${x+34} ${y+10}`,class:'local-road faint'}));
    for(const [dx,dy,s] of [[-27,-15,.7],[-8,16,.75],[21,-10,.65],[29,18,.55]])drawBush(g,x+dx,y+dy,s);
  }
}
function badge(g,t){
  const y=t.y+23;
  g.append(el('rect',{x:t.x-24,y,width:48,height:23,rx:11.5,class:`troop-badge owner-${t.owner}`}));
  const txt=el('text',{x:t.x,y:y+16,'text-anchor':'middle',class:'troop-text'});
  txt.textContent=`● ${t.troops}`;
  g.append(txt);
  if(t.hq){
    const q=el('text',{x:t.x,y:t.y-31,'text-anchor':'middle',class:'hq-star'});
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
      points:pointsAttr(poly),
      fill:TERRAIN[t.terrain],
      stroke:OWNER[t.owner],
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
    drawTerrain(decor,t);
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
