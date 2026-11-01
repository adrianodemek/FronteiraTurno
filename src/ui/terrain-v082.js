import { BIOME_PRESETS, TERRITORY_STYLE, MAP_SEED } from '../data/world-v08.js?v=0.8.2';

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
function pointSegmentDistance(px,py,a,b){
  const vx=b.x-a.x,vy=b.y-a.y,wx=px-a.x,wy=py-a.y;
  const c2=vx*vx+vy*vy||1;
  const u=Math.max(0,Math.min(1,(wx*vx+wy*vy)/c2));
  return Math.hypot(px-(a.x+u*vx),py-(a.y+u*vy));
}
function edgeDistance(x,y,poly){
  let d=Infinity;
  for(let i=0;i<poly.length;i++)d=Math.min(d,pointSegmentDistance(x,y,poly[i],poly[(i+1)%poly.length]));
  return d;
}
function safePoints(poly,t,count,seed,minCenter=18,edgePad=12){
  const b=bounds(poly),rnd=mulberry32(seedFor(`${MAP_SEED}:${t.id}:${seed}`)),out=[];
  for(let tries=0;tries<count*28&&out.length<count;tries++){
    const x=b.minX+edgePad+rnd()*Math.max(1,b.maxX-b.minX-edgePad*2);
    const y=b.minY+edgePad+rnd()*Math.max(1,b.maxY-b.minY-edgePad*2);
    if(!pointInPoly(x,y,poly))continue;
    if(edgeDistance(x,y,poly)<edgePad)continue;
    if(Math.hypot(x-t.x,y-t.y)<minCenter)continue;
    if(out.some(p=>Math.hypot(x-p.x,y-p.y)<20))continue;
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
  return `url(#v082-surface-${SURFACE[style.surface]?style.surface:'grass'})`;
}

function surfacePattern(defs,el,name,colors){
  const p=el('pattern',{id:`v082-surface-${name}`,width:32,height:32,patternUnits:'userSpaceOnUse'});
  p.append(
    el('rect',{x:0,y:0,width:32,height:32,fill:colors[0]}),
    el('path',{d:'M3 7h5M20 20h7M10 27h4M25 5h3',stroke:colors[1],'stroke-width':1,opacity:.28}),
    el('rect',{x:16,y:9,width:2,height:2,fill:colors[2],opacity:.24})
  );
  defs.append(p);
}

export function installTerrainDefs(defs,el){
  for(const [name,colors] of Object.entries(SURFACE))surfacePattern(defs,el,name,colors);

  const forestA=el('symbol',{id:'v082-forest-a',viewBox:'0 0 64 48'});
  forestA.innerHTML='<path d="M5 37Q9 12 29 9Q49 5 59 28Q59 43 43 45H16Q6 44 5 37Z" fill="#29452d" opacity=".78"/><g stroke="#18321f" stroke-width="1"><circle cx="13" cy="29" r="8" fill="#355f39"/><circle cx="22" cy="18" r="10" fill="#2b5733"/><circle cx="33" cy="28" r="11" fill="#3b673d"/><circle cx="45" cy="17" r="9" fill="#285033"/><circle cx="54" cy="31" r="8" fill="#365f38"/><circle cx="18" cy="37" r="7" fill="#264d2d"/><circle cx="42" cy="37" r="8" fill="#315b35"/></g><g fill="#173922"><path d="M8 35l6-16 6 16z"/><path d="M27 37l6-18 7 18z"/><path d="M47 38l6-16 6 16z"/></g><g fill="#86a25d" opacity=".45"><circle cx="17" cy="15" r="2"/><circle cx="39" cy="14" r="2"/><circle cx="29" cy="31" r="2"/></g>';

  const forestB=el('symbol',{id:'v082-forest-b',viewBox:'0 0 58 44'});
  forestB.innerHTML='<path d="M4 34Q7 13 24 9Q39 3 54 20Q60 36 45 41Q27 46 11 40Z" fill="#243f2a" opacity=".8"/><g stroke="#19321f" stroke-width="1"><circle cx="12" cy="28" r="8" fill="#2c5532"/><circle cx="20" cy="16" r="9" fill="#3c653a"/><circle cx="31" cy="24" r="10" fill="#2e5b35"/><circle cx="43" cy="14" r="8" fill="#426c3e"/><circle cx="48" cy="31" r="8" fill="#2a5231"/><circle cx="28" cy="36" r="7" fill="#24482b"/></g><g fill="#173920"><path d="M8 37l5-15 6 15z"/><path d="M35 39l6-17 6 17z"/></g>';

  const farmA=el('symbol',{id:'v082-farm-a',viewBox:'0 0 62 44'});
  farmA.innerHTML='<rect x="2" y="4" width="27" height="15" rx="2" fill="#a39254" stroke="#645b35"/><rect x="32" y="3" width="28" height="16" rx="2" fill="#918348" stroke="#645b35"/><rect x="7" y="23" width="34" height="17" rx="2" fill="#806f3f" stroke="#5d5231"/><path d="M5 8h22M5 12h22M5 16h22M35 7h22M35 11h22M35 15h22M10 27h28M10 31h28M10 35h28" stroke="#d6c47c" stroke-width="1" opacity=".58"/><path d="M44 25h14v12H44z" fill="#9b7650" stroke="#58412e"/><path d="M42 26l9-7 9 7z" fill="#704635" stroke="#4f3328"/><circle cx="4" cy="31" r="4" fill="#3c6035"/><circle cx="58" cy="39" r="4" fill="#315631"/>';

  const farmB=el('symbol',{id:'v082-farm-b',viewBox:'0 0 58 42'});
  farmB.innerHTML='<rect x="3" y="4" width="22" height="31" rx="2" fill="#8d7e46" stroke="#625735"/><rect x="28" y="5" width="27" height="13" rx="2" fill="#a08d4d" stroke="#625735"/><rect x="29" y="21" width="25" height="16" rx="2" fill="#75683d" stroke="#5d5231"/><path d="M7 8v23M12 8v23M17 8v23M22 8v23M32 9h19M32 13h19M32 25h18M32 29h18M32 33h18" stroke="#d6c47c" stroke-width="1" opacity=".55"/><path d="M1 38Q20 33 39 38T58 36" fill="none" stroke="#55603a" stroke-width="2"/>';

  const cityA=el('symbol',{id:'v082-city-a',viewBox:'0 0 64 48'});
  cityA.innerHTML='<path d="M3 27Q18 23 31 25T61 23" fill="none" stroke="#887a61" stroke-width="5" opacity=".75"/><path d="M31 4Q29 18 31 44" fill="none" stroke="#8b7d63" stroke-width="4" opacity=".72"/><g stroke="#4f4031"><g><rect x="7" y="8" width="12" height="10" fill="#b39a70"/><path d="M5 9l8-6 8 6z" fill="#7d4936"/></g><g><rect x="39" y="7" width="13" height="11" fill="#aa916a"/><path d="M37 8l9-6 9 6z" fill="#6f4333"/></g><g><rect x="8" y="31" width="14" height="11" fill="#b9a27b"/><path d="M6 32l9-6 9 6z" fill="#824c35"/></g><g><rect x="40" y="31" width="14" height="11" fill="#a98f67"/><path d="M38 32l9-6 9 6z" fill="#754230"/></g></g><g fill="#315b35"><circle cx="24" cy="12" r="4"/><circle cx="56" cy="25" r="4"/><circle cx="28" cy="38" r="4"/></g><circle cx="31" cy="24" r="5" fill="#766952" stroke="#4e4537"/>';

  const cityB=el('symbol',{id:'v082-city-b',viewBox:'0 0 58 44'});
  cityB.innerHTML='<path d="M4 22H54M28 4V40" fill="none" stroke="#87785f" stroke-width="4" opacity=".72"/><g stroke="#4f4031"><g><rect x="5" y="6" width="12" height="10" fill="#ad956e"/><path d="M3 7l8-6 8 6z" fill="#784632"/></g><g><rect x="36" y="6" width="14" height="10" fill="#b29b72"/><path d="M34 7l9-6 9 6z" fill="#6f4130"/></g><g><rect x="7" y="27" width="13" height="11" fill="#b59e78"/><path d="M5 28l9-6 9 6z" fill="#824a34"/></g><g><rect x="36" y="27" width="14" height="11" fill="#a88e67"/><path d="M34 28l9-6 9 6z" fill="#754331"/></g></g><g fill="#315936"><circle cx="23" cy="8" r="3.5"/><circle cx="52" cy="35" r="3.5"/><circle cx="24" cy="36" r="3.5"/></g>';

  const pine=el('symbol',{id:'v082-pine',viewBox:'0 0 16 20'});
  pine.innerHTML='<rect x="7" y="14" width="2" height="5" fill="#4a3724"/><path d="M8 1 2 10h3l-4 5h14l-4-5h3z" fill="#21482c" stroke="#102b1a"/><path d="M8 4 4 10h8z" fill="#315d37"/>';
  const rock=el('symbol',{id:'v082-rock',viewBox:'0 0 14 11'});
  rock.innerHTML='<path d="M1 9 4 3l4-2 5 5-2 4H3z" fill="#76766d" stroke="#4d4e48"/><path d="m4 3 4-2 1 5z" fill="#97988e"/>';

  defs.append(forestA,forestB,farmA,farmB,cityA,cityB,pine,rock);
}

function useSymbol(g,el,id,x,y,w,h,scale=1,opacity=1){
  g.append(el('use',{href:`#${id}`,x:x-w*scale/2,y:y-h*scale/2,width:w*scale,height:h*scale,opacity}));
}
function drawForest(g,t,poly,el,style){
  const pts=safePoints(poly,t,3,'forest082',23,15);
  pts.forEach((p,i)=>useSymbol(g,el,i%2?'v082-forest-b':'v082-forest-a',p.x,p.y,i%2?58:64,i%2?44:48,.72+p.r*.14,.97));
  if(pts.length<2){
    const b=bounds(poly),x=(b.minX+b.maxX)/2,y=(b.minY+b.maxY)/2;
    useSymbol(g,el,style.variant==='broadleaf'?'v082-forest-b':'v082-forest-a',x,y,64,48,.74,.95);
  }
}
function drawFarm(g,t,poly,el){
  const pts=safePoints(poly,t,2,'farm082',22,14);
  pts.forEach((p,i)=>useSymbol(g,el,i%2?'v082-farm-b':'v082-farm-a',p.x,p.y,i%2?58:62,i%2?42:44,.72+p.r*.12,.98));
}
function drawCity(g,t,poly,el,style){
  const pts=safePoints(poly,t,style.features?.includes('hq')?1:2,'city082',24,15);
  pts.forEach((p,i)=>useSymbol(g,el,i%2?'v082-city-b':'v082-city-a',p.x,p.y,i%2?58:64,i%2?44:48,.72+p.r*.1,.98));
  if(style.variant==='industrial'&&pts[0]){
    const p=pts[0];
    g.append(el('rect',{x:p.x+13,y:p.y-18,width:22,height:12,class:'industrial-block'}));
    g.append(el('rect',{x:p.x+27,y:p.y-28,width:4,height:13,class:'smokestack'}));
  }
}
function drawOther(g,t,poly,el,style){
  if(style.biome==='rock'||style.biome==='snow'){
    const pts=safePoints(poly,t,style.biome==='snow'?2:3,'relief082',25,13);
    pts.forEach((p,i)=>{
      const s=.78+p.r*.2;
      g.append(el('path',{d:`M ${p.x-11*s} ${p.y+7*s} L ${p.x} ${p.y-13*s} L ${p.x+11*s} ${p.y+7*s} Z`,class:`mini-mountain ${style.biome==='snow'?'mini-snow':''}`}));
      if(style.biome==='snow'&&i===0)g.append(el('path',{d:`M ${p.x} ${p.y-13*s} l -4 ${7*s} 4 -2 4 2 z`,class:'mini-snowcap'}));
    });
    return;
  }
  const pts=safePoints(poly,t,3,'light082',22,12);
  pts.forEach((p,i)=>useSymbol(g,el,i%2?'v082-pine':'v082-rock',p.x,p.y,i%2?16:14,i%2?20:11,.52+p.r*.18,.9));
}
function drawLandmarks(g,t,el,style){
  if(style.features?.includes('airfield')){
    g.append(el('rect',{x:t.x-33,y:t.y-5,width:66,height:10,rx:1,class:'runway',transform:`rotate(-12 ${t.x} ${t.y})`}));
    g.append(el('path',{d:`M ${t.x-25} ${t.y} H ${t.x+25}`,class:'runway-mark',transform:`rotate(-12 ${t.x} ${t.y})`}));
    g.append(el('rect',{x:t.x+20,y:t.y+12,width:16,height:9,class:'hangar'}));
  }
  if(style.features?.includes('port')){
    g.append(el('path',{d:`M ${t.x-26} ${t.y+10} H ${t.x+26} M ${t.x-12} ${t.y+10} v 14 M ${t.x+8} ${t.y+10} v 15`,class:'local-dock'}));
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
  if(style.biome==='forest')drawForest(g,t,poly,el,style);
  else if(style.biome==='farm')drawFarm(g,t,poly,el);
  else if(style.biome==='city')drawCity(g,t,poly,el,style);
  else drawOther(g,t,poly,el,style);
  drawLandmarks(g,t,el,style);
}
