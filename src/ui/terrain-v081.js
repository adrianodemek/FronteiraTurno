import { BIOME_PRESETS, TERRITORY_STYLE, INFRASTRUCTURE, MAP_SEED } from '../data/world-v08.js?v=0.8.1';

const SURFACE={
  grass:['#788a55','#657848','#98a766'], earth:['#655b43','#514936','#7b6f50'],
  mud:['#5f5842','#4c4635','#746b50'], loam:['#8b7d4d','#74663c','#aa995d'],
  dirt:['#786b50','#625740','#958267'], clay:['#87654a','#714f3a','#a57a5a'],
  sand:['#a89a68','#92865b','#c2b47c'], rock:['#73756d','#5e605a','#8a8c83'],
  snow:['#b7c5c2','#9eaeab','#d4dfdc']
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
  for(let tries=0;tries<count*10&&out.length<count;tries++){
    const x=b.minX+7+rnd()*Math.max(1,b.maxX-b.minX-14);
    const y=b.minY+7+rnd()*Math.max(1,b.maxY-b.minY-14);
    if(!pointInPoly(x,y,poly)||Math.hypot(x-t.x,y-t.y)<minCenter)continue;
    out.push({x,y,r:rnd()});
  }
  return out;
}
function styleFor(t){
  const base=BIOME_PRESETS[t.terrain]||BIOME_PRESETS.plains;
  return{...base,...(TERRITORY_STYLE[t.id]||{}),biome:TERRITORY_STYLE[t.id]?.biome||t.terrain};
}

export function territorySurface(t){
  const style=styleFor(t);
  return `url(#v081-surface-${SURFACE[style.surface]?style.surface:'grass'})`;
}

function surfacePattern(defs,el,name,colors){
  const p=el('pattern',{id:`v081-surface-${name}`,width:28,height:28,patternUnits:'userSpaceOnUse'});
  p.append(
    el('rect',{x:0,y:0,width:28,height:28,fill:colors[0]}),
    el('path',{d:'M3 6h5M18 19h6M9 25h3',stroke:colors[1],'stroke-width':1,opacity:.32}),
    el('rect',{x:15,y:7,width:2,height:2,fill:colors[2],opacity:.28})
  );
  defs.append(p);
}
export function installTerrainDefs(defs,el){
  for(const [name,colors] of Object.entries(SURFACE))surfacePattern(defs,el,name,colors);

  const crop=el('pattern',{id:'v081-crops',width:12,height:12,patternUnits:'userSpaceOnUse',patternTransform:'rotate(-8)'});
  crop.append(el('path',{d:'M1 0V12M7 0V12',stroke:'#ded080','stroke-width':1,opacity:.42}));
  defs.append(crop);

  const pine=el('symbol',{id:'v081-pine',viewBox:'0 0 16 20'});
  pine.innerHTML='<rect x="7" y="14" width="2" height="5" fill="#4a3724"/><path d="M8 1 2 10h3l-4 5h14l-4-5h3z" fill="#21482c" stroke="#102b1a"/><path d="M8 4 4 10h8z" fill="#315d37"/>';
  const tree=el('symbol',{id:'v081-tree',viewBox:'0 0 18 20'});
  tree.innerHTML='<rect x="8" y="13" width="2" height="6" fill="#543b25"/><circle cx="6" cy="9" r="5" fill="#2d5830"/><circle cx="11" cy="7" r="5" fill="#3d6738"/><circle cx="12" cy="11" r="4" fill="#284b2b"/>';
  const bush=el('symbol',{id:'v081-bush',viewBox:'0 0 14 10'});
  bush.innerHTML='<path d="M1 8Q2 3 6 5Q8 0 11 4Q14 5 13 9Z" fill="#4e6b3d"/>';
  const rock=el('symbol',{id:'v081-rock',viewBox:'0 0 14 11'});
  rock.innerHTML='<path d="M1 9 4 3l4-2 5 5-2 4H3z" fill="#76766d" stroke="#4d4e48"/><path d="m4 3 4-2 1 5z" fill="#97988e"/>';
  const house=el('symbol',{id:'v081-house',viewBox:'0 0 18 16'});
  house.innerHTML='<rect x="3" y="7" width="12" height="8" fill="#b49a6f" stroke="#564533"/><path d="M1 8 9 2l8 6z" fill="#874d34" stroke="#533326"/><rect x="8" y="10" width="3" height="5" fill="#4d392b"/>';
  defs.append(pine,tree,bush,rock,house);
}

function useSymbol(g,el,id,x,y,w,h,scale=1,opacity=1){
  g.append(el('use',{href:`#${id}`,x:x-w*scale/2,y:y-h*scale/2,width:w*scale,height:h*scale,opacity}));
}
function drawGround(g,t,poly,el,style){
  if(style.biome!=='farm')return;
  const b=bounds(poly);
  g.append(el('rect',{x:b.minX-4,y:b.minY-4,width:b.maxX-b.minX+8,height:b.maxY-b.minY+8,fill:'url(#v081-crops)',class:'v081-crop-fill'}));
}
function drawVegetation(g,t,poly,el,style){
  const counts={dense:10,urban:3,light:4,edge:5,sparse:3,alpine:4,coastal:3,dry:3};
  const count=counts[style.vegetation]||3;
  const pts=safePoints(poly,t,count,'veg081',24);
  pts.forEach((p,i)=>{
    let id='v081-bush',w=14,h=10,scale=.62+p.r*.24;
    if(style.vegetation==='dense'){
      id=(i%3===0||style.variant==='broadleaf')?'v081-tree':'v081-pine';w=id==='v081-tree'?18:16;h=20;scale=.68+p.r*.28;
    }else if(style.vegetation==='alpine'){
      id=i%3===0?'v081-rock':'v081-pine';w=id==='v081-rock'?14:16;h=id==='v081-rock'?11:20;
    }else if(style.vegetation==='sparse'||style.vegetation==='coastal'){
      id=i%2?'v081-rock':'v081-bush';w=14;h=id==='v081-rock'?11:10;
    }else if(style.vegetation==='urban'||style.vegetation==='edge'){
      id=i%2?'v081-tree':'v081-bush';w=id==='v081-tree'?18:14;h=id==='v081-tree'?20:10;scale=.52+p.r*.22;
    }
    useSymbol(g,el,id,p.x,p.y,w,h,scale,.95);
  });
}
function drawRelief(g,t,poly,el,style){
  if(style.biome!=='rock'&&style.biome!=='snow')return;
  const pts=safePoints(poly,t,style.biome==='snow'?2:3,'relief081',27);
  pts.forEach((p,i)=>{
    const s=.78+p.r*.25,x=p.x,y=p.y;
    g.append(el('path',{d:`M ${x-11*s} ${y+7*s} L ${x} ${y-13*s} L ${x+11*s} ${y+7*s} Z`,class:`mini-mountain ${style.biome==='snow'?'mini-snow':''}`}));
    if(style.biome==='snow'&&i===0)g.append(el('path',{d:`M ${x} ${y-13*s} l -4 ${7*s} 4 -2 4 2 z`,class:'mini-snowcap'}));
  });
}
function drawSettlement(g,t,poly,el,style){
  if(style.biome!=='city'&&!style.features?.includes('hq'))return;
  const count=style.features?.includes('hq')?2:(style.variant==='industrial'?5:4);
  const pts=safePoints(poly,t,count,'build081',19);
  pts.forEach(p=>useSymbol(g,el,'v081-house',p.x,p.y,18,16,.6+p.r*.16,.96));
  if(style.variant==='industrial'){
    const x=t.x+18,y=t.y-13;
    g.append(el('rect',{x:x-12,y:y-5,width:24,height:13,class:'industrial-block'}));
    g.append(el('rect',{x:x+5,y:y-16,width:4,height:14,class:'smokestack'}));
  }
}
function drawLandmarks(g,t,el,style){
  if(style.features?.includes('airfield')){
    g.append(el('rect',{x:t.x-34,y:t.y-5,width:68,height:10,rx:1,class:'runway',transform:`rotate(-12 ${t.x} ${t.y})`}));
    g.append(el('path',{d:`M ${t.x-26} ${t.y} H ${t.x+26}`,class:'runway-mark',transform:`rotate(-12 ${t.x} ${t.y})`}));
    g.append(el('rect',{x:t.x+21,y:t.y+12,width:17,height:9,class:'hangar'}));
  }
  if(style.features?.includes('port')){
    g.append(el('path',{d:`M ${t.x-27} ${t.y+10} H ${t.x+27} M ${t.x-13} ${t.y+10} v 15 M ${t.x+8} ${t.y+10} v 16`,class:'local-dock'}));
    g.append(el('rect',{x:t.x-8,y:t.y-17,width:16,height:11,class:'warehouse'}));
  }
  if(style.features?.includes('hq')){
    const enemy=t.owner==='red';
    g.append(el('rect',{x:t.x-21,y:t.y-14,width:42,height:27,rx:2,class:`v08-hq ${enemy?'enemy':'friendly'}`}));
    g.append(el('rect',{x:t.x-26,y:t.y-18,width:8,height:29,class:'v08-hq-tower'}));
    g.append(el('rect',{x:t.x+18,y:t.y-18,width:8,height:29,class:'v08-hq-tower'}));
    g.append(el('path',{d:`M ${t.x+21} ${t.y-19} v -16 h 15 l -5 5 5 5 h -15`,class:`v08-hq-flag ${enemy?'enemy':'friendly'}`}));
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
    const bend=(seedFor(`${a.id}-${b.id}`)%17)-8;
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
