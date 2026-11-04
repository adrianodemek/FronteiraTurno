import { TERRITORY_TEMPLATE } from '../data/map.js?v=1.0.0';

export function createInitialState(){
  return {
    turn:1,
    maxTurns:12,
    maxOrders:3,
    orders:3,
    phase:'player',
    selectedSource:null,
    selectedTarget:null,
    attackTroops:1,
    reinforceUsed:false,
    territories:TERRITORY_TEMPLATE.map(t=>({...t})),
    winner:null,
    log:[]
  };
}

export function territoryById(state,id){ return state.territories.find(t=>t.id===id); }
export function owned(state,owner){ return state.territories.filter(t=>t.owner===owner); }
export function territoryPercent(state,owner){
  const total = state.territories.length || 1;
  return Math.round((owned(state,owner).length/total)*100);
}
