import { render as render091 } from './render-v091.js?v=0.9.3';

const NS='http://www.w3.org/2000/svg';
const MAP_HREF='./assets/map/static/map-v093.webp?v=0.9.3';

function ensureStableMap(refs){
  const layer=refs.map.querySelector('.v091-static-layer');
  if(!layer)return;
  let image=layer.querySelector('.v092-static-map');
  if(!image){
    image=document.createElementNS(NS,'image');
    image.setAttribute('x','0');
    image.setAttribute('y','0');
    image.setAttribute('width','420');
    image.setAttribute('height','690');
    image.setAttribute('preserveAspectRatio','none');
    image.setAttribute('class','v092-static-map');
    image.setAttribute('href',MAP_HREF);
    layer.append(image);
  }
}

export function render(state,refs){
  render091(state,refs);
  ensureStableMap(refs);
}
