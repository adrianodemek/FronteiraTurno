import { NEIGHBORS } from '../data/map.js';
import { attackChance, resolveAttack } from './combat.js';
import { territoryById } from './state.js';

export function runAiTurn(state){
  const events=[];
  const candidates=[];
  for(const src of state.territories.filter(t=>t.owner==='red' && t.troops>=2)){
    for(const nid of NEIGHBORS[src.id]){
      const target=territoryById(state,nid);
      if(target && target.owner!=='red'){
        candidates.push({src,target,chance:attackChance(src,target)});
      }
    }
  }
  candidates.sort((a,b)=>(b.chance + b.src.troops*0.012)-(a.chance + a.src.troops*0.012));
  const actions=Math.min(3,candidates.length);
  const used=new Set();
  for(let i=0,count=0;i<candidates.length && count<actions;i++){
    const c=candidates[i];
    if(used.has(c.src.id) || c.src.owner!=='red' || c.target.owner==='red' || c.src.troops<2) continue;
    if(c.chance<0.28 && Math.random()>0.35) continue;
    const r=resolveAttack(c.src,c.target);
    used.add(c.src.id); count++;
    events.push({type:'attack', from:c.src.id, to:c.target.id, result:r});
  }
  for(const t of state.territories.filter(t=>t.owner==='red')){
    if(Math.random()<0.28) t.troops += 1;
  }
  return events;
}
