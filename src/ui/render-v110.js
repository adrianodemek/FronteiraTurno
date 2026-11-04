import { render as renderBase } from './render-v100.js?v=1.1.0';
import { activatePilotTiles } from './terrain-pilot-v110.js?v=1.1.0';
export function render(state,refs){
  renderBase(state,refs);
  activatePilotTiles(refs.map);
}
