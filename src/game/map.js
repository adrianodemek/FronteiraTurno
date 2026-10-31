import { NEIGHBORS } from '../data/map.js';
import { territoryById } from './state.js';

export function canSelectSource(state,t){
  return state.phase==='player' && !state.winner && t.owner==='blue' && t.troops>=2 && state.orders>0;
}
export function canTarget(state,source,target){
  return !!source && target.id!==source.id && target.owner!=='blue' && NEIGHBORS[source.id]?.includes(target.id);
}
export function isNeighbor(a,b){ return NEIGHBORS[a]?.includes(b); }
export function getTarget(state){ return state.selectedTarget ? territoryById(state,state.selectedTarget) : null; }
