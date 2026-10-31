import { TERRITORY_TEMPLATE } from '../data/map.js';

export function createInitialState(){
  return {
    turn:1,
    maxTurns:12,
    maxOrders:3,
    orders:3,
    phase:'player',
    selectedSource:null,
    selectedTarget:null,
    reinforceUsed:false,
    territories:TERRITORY_TEMPLATE.map(t=>({...t})),
    winner:null,
    log:[]
  };
}

export function territoryById(state,id){ return state.territories.find(t=>t.id===id); }
export function owned(state,owner){ return state.territories.filter(t=>t.owner===owner); }
export function territoryPercent(state,owner){
  const active = state.territories.filter(t=>t.owner!=='neutral').length || 1;
  return Math.round((owned(state,owner).length/active)*100);
}
