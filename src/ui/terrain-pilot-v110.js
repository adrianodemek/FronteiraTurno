// Piloto modular A1/B1/C1. Uma carga; nenhuma reconstrução durante combate.
const NS='http://www.w3.org/2000/svg';
const MANIFEST='./assets/mapas/ilha-01/manifest.json?v=1.1.0';
let resourcesPromise;
const absoluteUrl=path=>new URL(path,document.baseURI).href;
function preload(url){
  return new Promise((resolve,reject)=>{
    const img=new Image(); img.decoding='async';
    img.onload=resolve;
    img.onerror=()=>reject(new Error('Imagem indisponível: '+url));
    img.src=url;
  });
}
function svgImage(href,x,y,width,height){
  const el=document.createElementNS(NS,'image');
  for(const[k,v]of Object.entries({href,x,y,width,height,preserveAspectRatio:'none'}))
    el.setAttribute(k,v);
  el.setAttribute('pointer-events','none');
  return el;
}
function resources(){
  if(!resourcesPromise){
    resourcesPromise=fetch(MANIFEST,{cache:'force-cache'})
      .then(r=>{if(!r.ok)throw new Error('Manifesto HTTP '+r.status);return r.json()})
      .then(async m=>{
        if(m.format!=='fronteiraturno-territory-atlas-v1'||m.regions.length!==3)
          throw new Error('Manifesto incompatível com piloto');
        await Promise.all([m.base,...m.regions.map(r=>r.asset)]
          .map(path=>preload(absoluteUrl(path))));
        return m;
      });
  }
  return resourcesPromise;
}
export function activatePilotTiles(map){
  const root=map.querySelector('.v100-static-layer');
  if(!root||root.dataset.pilotStatus)return;
  root.dataset.pilotStatus='loading';
  resources().then(m=>{
    if(!root.isConnected)return;
    const group=document.createElementNS(NS,'g');
    group.setAttribute('class','v110-terrain-tiles');
    group.setAttribute('pointer-events','none');
    const vp=m.viewport;
    group.append(svgImage(absoluteUrl(m.base),vp.offsetX,vp.offsetY,vp.width,vp.height));
    for(const r of m.regions){
      const b=r.box;
      const part=svgImage(absoluteUrl(r.asset),vp.offsetX+b.x,vp.offsetY+b.y,b.width,b.height);
      part.setAttribute('data-region-art',r.id);
      group.append(part);
    }
    root.append(group);
    const fallback=root.querySelector('.v100-static-map');
    if(fallback)fallback.setAttribute('visibility','hidden');
    root.dataset.pilotStatus='ready';
  }).catch(err=>{
    root.dataset.pilotStatus='fallback';
    console.error('FronteiraTurno: mantido o mapa V1.0 por erro de arte modular',err);
  });
}
