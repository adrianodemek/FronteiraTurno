import { BIOME_PRESETS, TERRITORY_STYLE, INFRASTRUCTURE, MAP_SEED } from '../data/world-v08.js?v=0.8';

const SURFACE={
  grass:'#788a55',earth:'#655b43',mud:'#5f5842',loam:'#8b7d4d',dirt:'#786b50',
  clay:'#87654a',sand:'#a89a68',rock:'#73756d',snow:'#b7c5c2'
};

function seedFor(text){
  let h=2166136261;
  for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}
  return h>>>0;
}
function mulberry32(a){
  return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
}
function pointInPoly(x,y,poly){
  let inside=false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const xi=poly[i].x,yi=poly[i].y,xj=poly[j].x,yj=poly[j].y;
    const hit=((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/((yj-yi)||1e-9)+xi);
    if(hit)inside=!inside;
  }
  return inside;
}
function bounds(poly){
  const xs=poly.map(p=>p.x),ys=poly.map(p=>p.y);
  return{minX:Math.min(...xs),maxX:Math.max(...xs),minY:Math.min(...ys),maxY:Math.max(...ys)};
}
function safePoints(poly,t,count,seed,minCenter=22){
  const b=bounds(poly),rnd=mulberry32(seedFor(`${MAP_SEED}:${t.id}:${seed}`)),out=[];
  for(let tries=0;tries<count*18&&out.length<count;tries++){
    const x=b.minX+6+rnd()*Math.max(1,b.maxX-b.minX-12);
    const y=b.minY+6+rnd()*Math.max(1,b.maxY-b.minY-12);
    if(!pointInPoly(x,y,poly))continue;
    if(Math.hypot(x-t.x,y-t.y)<minCenter)continue;
    out.push({x,y,r:rnd()});
  }
  return out;
}
function styleFor(t){
  const base=BIOME_PRESETS[t.terrain]||BIOME_PRESETS.plains;
  return{...base,...(TERRITORY_STYLE[t.id]||{}),biome:(TERRITORY_STYLE[t.id]?.biome||t.terrain)};
}
export function territorySurface(t){
  const s=styleFor(t);
  return SURFACE[s.surface]||SURFACE.grass;
}

export function installTerrainDefs(defs,el){
  const pine=el('symbol',{id:'v08-pine',viewBox:'0 0 16 20'});
  pine.innerHTML='<rect x="7" y="14" width="2" height="5" fill="#4a3724"/><path d="M8 1 2 10h3l-4 5h14l-4-5h3z" fill="#21482c" stroke="#102b1a" stroke-width="1"/><path d="M8 4 4 10h8z" fill="#315d37"/>';
  const tree=el('symbol',{id:'v08-tree',viewBox:'0 0 18 20'});
  tree.innerHTML='<rect x="8" y="13" width="2" height="6" fill="#543b25"/><circle cx="6" cy="9" r="5" fill="#2d5830"/><circle cx="11" cy="7" r="5" fill="#3d6738"/><circle cx="12" cy="11" r="4" fill="#284b2b"/>';
  const bush=el('symbol',{id:'v08-bush',viewBox:'0 0 14 10'});
  bush.innerHTML='<circle cx="4" cy="6" r="4" fill="#49663a"/><circle cx="8" cy="4" r="4" fill="#5c7845"/><circle cx="11" cy="6" r="3" fill="#3f5b34"/>';
  const rock=el('symbol',{id:'v08-rock',viewBox:'0 0 14 11'});
  rock.innerHTML='<path d="M1 9 4 3l4-2 5 5-2 4H3z" fill="#76766d" stroke="#4d4e48" stroke-width="1"/><path d="m4 3 4-2 1 5z" fill="#97988e"/>';
  const house=el('symbol',{id:'v08-house',viewBox:'0 0 18 16'});
  house.innerHTML='<rect x="3" y="7" width="12" height="8" fill="#b49a6f" stroke="#564533"/><path d="M1 8 9 2l8 6z" fill="#874d34" stroke="#533326"/><rect x="8" y="10" width="3" height="5" fill="#4d392b"/>';
  defs.append(pine,tree,bush,rock,house);
}

function useSymbol(g,el,id,x,y,w,h,scale=1,opacity=1){
  g.append(el('use',{href:`#${id}`,x:x-w*scale/2,y:y-h*scale/2,width:w*scale,height:h*scale,opacity}));
}
function drawGround(g,t,poly,el,style){
  const rnd=mulberry32(seedFor(`${MAP_SEED}:${t.id}:ground`)),b=bounds(poly);
  const tone=style.surface;
  for(let i=0;i<18;i++){
    const x=b.minX+rnd()*(b.maxX-b.minX),y=b.minY+rnd()*(b.maxY-b.minY);
    if(!pointInPoly(x,y,poly))continue;
    const w=4+rnd()*12,h=2+rnd()*6;
    g.append(el('ellipse',{cx:x,cy:y,rx:w/2,ry:h/2,class:`terrain-patch patch-${tone}`,opacity:.12+rnd()*.14}));
  }
  if(style.biome==='farm'){
    const angle=(t.id.charCodeAt(0)+t.id.charCodeAt(1))%18-9;
    const field=el('g',{class:'field-grid',transform:`rotate(${angle} ${t.x} ${t.y})`});
    for(let y=b.minY-10;y<b.maxY+10;y+=9)field.append(el('path',{d:`M ${b.minX-8} ${y} H ${b.maxX+8}`,class:'crop-row'}));
    g.append(field);
  }
  if(style.biome==='snow'){
    for(let i=0;i<10;i++){
      const p=safePoints(poly,t,10,`snow-${i}`,18)[0];if(!p)continue;
      g.append(el('circle',{cx:p.x,cy:p.y,r:1.2+p.r*2.2,class:'snow-speck'}));
    }
  }
}
function drawVegetation(g,t,poly,el,style){
  const counts={dense:30,urban:8,light:12,edge:11,sparse:6,alpine:8,coastal:8,dry:6};
  const count=counts[style.vegetation]||8;
  const pts=safePoints(poly,t,count,'veg',23);
  pts.forEach((p,i)=>{
    let id='v08-bush',w=14,h=10,scale=.55+p.r*.35,opacity=.92;
    if(style.vegetation==='dense'){
      id=(i%3===0||style.variant==='broadleaf')?'v08-tree':'v08-pine';w=id==='v08-tree'?18:16;h=20;scale=.62+p.r*.34;
    }else if(style.vegetation==='alpine'){
      id=i%4===0?'v08-rock':'v08-pine';w=id==='v08-rock'?14:16;h=id==='v08-rock'?11:20;scale=.52+p.r*.28;
    }else if(style.vegetation==='sparse'){
      id=i%2?'v08-rock':'v08-bush';w=id==='v08-rock'?14:14;h=id==='v08-rock'?11:10;scale=.5+p.r*.3;
    }else if(style.vegetation==='urban'){
      id=i%3?'v08-tree':'v08-bush';w=id==='v08-tree'?18:14;h=id==='v08-tree'?20:10;scale=.45+p.r*.25;
    }else if(style.vegetation==='edge'){
      id=i%2?'v08-tree':'v08-bush';w=id==='v08-tree'?18:14;h=id==='v08-tree'?20:10;scale=.44+p.r*.24;
    }else if(style.vegetation==='coastal'){
      id=i%3===0?'v08-rock':'v08-bush';w=id==='v08-rock'?14:14;h=id==='v08-rock'?11:10;scale=.42+p.r*.25;
    }
    useSymbol(g,el,id,p.x,p.y,w,h,scale,opacity);
  });
}
function drawRelief(g,t,poly,el,style){
  if(!['rock','snow'].includes(style.biome))return;
  const pts=safePoints(poly,t,style.biome==='snow'?5:7,'relief',26);
  pts.forEach((p,i)=>{
    const s=.7+p.r*.45;
    const x=p.x,y=p.y;
    g.append(el('path',{d:`M ${x-11*s} ${y+7*s} L ${x} ${y-13*s} L ${x+11*s} ${y+7*s} Z`,class:`mini-mountain ${style.biome==='snow'?'mini-snow':''}`,opacity:.8}));
    if(style.biome==='snow'&&i%2===0)g.append(el('path',{d:`M ${x} ${y-13*s} l -4 ${7*s} 4 -2 4 2 z`,class:'mini-snowcap'}));
  });
}
function drawSettlement(g,t,poly,el,style){
  if(style.biome!=='city'&&!style.features?.includes('hq'))return;
  const count=style.features?.includes('hq')?5:(style.variant==='industrial'?12:9);
  const pts=safePoints(poly,t,count,'buildings',18);
  pts.forEach((p,i)=>{
    if(i<2&&style.features?.includes('hq'))return;
    useSymbol(g,el,'v08-house',p.x,p.y,18,16,.55+p.r*.25,.95);
  });
  if(style.variant==='industrial'){
    const x=t.x+18,y=t.y-13;
    g.append(el('rect',{x:x-13,y:y-5,width:26,height:14,class:'industrial-block'}));
    g.append(el('rect',{x:x+5,y:y-18,width:5,height:16,class:'smokestack'}));
  }
}
function drawLandmarks(g,t,el,style){
  if(style.features?.includes('airfield')){
    g.append(el('rect',{x:t.x-35,y:t.y-5,width:70,height:10,rx:1,class:'runway',transform:`rotate(-12 ${t.x} ${t.y})`}));
    g.append(el('path',{d:`M ${t.x-27} ${t.y} H ${t.x+27}`,class:'runway-mark',transform:`rotate(-12 ${t.x} ${t.y})`}));
    g.append(el('rect',{x:t.x+22,y:t.y+12,width:18,height:10,class:'hangar'}));
  }
  if(style.features?.includes('port')){
    g.append(el('path',{d:`M ${t.x-28} ${t.y+10} H ${t.x+28} M ${t.x-15} ${t.y+10} v 16 M ${t.x+7} ${t.y+10} v 18`,class:'local-dock'}));
    g.append(el('rect',{x:t.x-8,y:t.y-17,width:16,height:12,class:'warehouse'}));
  }
  if(style.features?.includes('hq')){
    const enemy=t.owner==='red';
    g.append(el('rect',{x:t.x-22,y:t.y-15,width:44,height:28,rx:2,class:`v08-hq ${enemy?'enemy':'friendly'}`}));
    g.append(el('rect',{x:t.x-27,y:t.y-19,width:9,height:31,class:'v08-hq-tower'}));
    g.append(el('rect',{x:t.x+18,y:t.y-19,width:9,height:31,class:'v08-hq-tower'}));
    g.append(el('path',{d:`M ${t.x+21} ${t.y-20} v -17 h 16 l -5 5 5 5 h -16`,class:`v08-hq-flag ${enemy?'enemy':'friendly'}`}));
  }
}
export function decorateTerritory({g,t,poly,el}){
  const style=styleFor(t);
  drawGround(g,t,poly,el,style);
  drawVegetation(g,t,poly,el,style);
  drawRelief(g,t,poly,el,style);
  drawSettlement(g,t,poly,el,style);
  drawLandmarks(g,t,el,style);
}

function routePath(route,state,territoryById){
  const pts=route.map(id=>territoryById(state,id)).filter(Boolean);
  if(pts.length<2)return'';
  let d=`M ${pts[0].x} ${pts[0].y}`;
  for(let i=1;i<pts.length;i++){
    const a=pts[i-1],b=pts[i],mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
    const bend=((seedFor(`${a.id}-${b.id}`)%17)-8);
    d+=` Q ${mx+bend} ${my-bend*.45} ${b.x} ${b.y}`;
  }
  return d;
}
export function drawInfrastructure({map,state,el,territoryById}){
  for(const net of INFRASTRUCTURE){
    const d=routePath(net.route,state,territoryById);if(!d)continue;
    if(net.type==='road'){
      map.append(el('path',{d,class:'world-road-shadow'}));
      map.append(el('path',{d,class:'world-road'}));
    }else if(net.type==='rail'){
      map.append(el('path',{d,class:'world-rail-bed'}));
      map.append(el('path',{d,class:'world-rail'}));
    }
  }
}
