import { createInitialState, territoryById, owned } from './game/state.js';
import { canSelectSource, canTarget } from './game/map.js';
import { resolveAttack } from './game/combat.js';
import { runAiTurn } from './game/ai.js';
import { render } from './ui/render.js';

let state=createInitialState();
const refs={
  map:document.querySelector('#battleMap'), turnLabel:document.querySelector('#turnLabel'), blueScore:document.querySelector('#blueScore'), redScore:document.querySelector('#redScore'), warBlue:document.querySelector('#warBlue'), orders:document.querySelector('#orders'), ownedCount:document.querySelector('#ownedCount'), neutralCount:document.querySelector('#neutralCount'), hqCount:document.querySelector('#hqCount'), actionTitle:document.querySelector('#actionTitle'), actionText:document.querySelector('#actionText'), chanceBox:document.querySelector('#chanceBox'), chanceText:document.querySelector('#chanceText'), attackBtn:document.querySelector('#attackBtn'), endTurnBtn:document.querySelector('#endTurnBtn'), reinforceCard:document.querySelector('#reinforceCard'), toast:document.querySelector('#toast')
};

function showToast(text){ refs.toast.textContent=text; refs.toast.classList.add('show'); clearTimeout(showToast.t); showToast.t=setTimeout(()=>refs.toast.classList.remove('show'),1800); }
function checkWinner(){
  const blueHq=state.territories.find(t=>t.hq && t.id==='A1');
  const redHq=state.territories.find(t=>t.hq && t.id==='G2');
  if(redHq.owner==='blue') state.winner='blue';
  else if(blueHq.owner==='red') state.winner='red';
  else if(state.turn>state.maxTurns){ state.winner=owned(state,'blue').length>=owned(state,'red').length?'blue':'red'; }
}
function clearSelection(){ state.selectedSource=null; state.selectedTarget=null; }
function paint(){ checkWinner(); render(state,refs); }

refs.map.addEventListener('click',e=>{
  const g=e.target.closest?.('.territory'); if(!g || state.phase!=='player' || state.winner) return;
  const t=territoryById(state,g.dataset.id);
  const src=state.selectedSource?territoryById(state,state.selectedSource):null;
  if(!src){
    if(canSelectSource(state,t)){ state.selectedSource=t.id; showToast(`${t.id} selecionado`); }
    else if(t.owner==='blue' && t.troops<2) showToast('Este território precisa de 2+ tropas para atacar.');
  } else if(t.id===src.id){ clearSelection(); }
  else if(t.owner==='blue'){
    if(canSelectSource(state,t)) state.selectedSource=t.id;
    state.selectedTarget=null;
  } else if(canTarget(state,src,t)) state.selectedTarget=t.id;
  else showToast('Esse território não é vizinho.');
  paint();
});

refs.attackBtn.addEventListener('click',()=>{
  if(state.orders<1) return showToast('Sem ordens disponíveis.');
  const src=territoryById(state,state.selectedSource), tar=territoryById(state,state.selectedTarget);
  if(!src||!tar) return;
  const wasHQ=tar.hq;
  const r=resolveAttack(src,tar); state.orders--;
  showToast(r.win?`Vitória! ${tar.id} conquistado.`:`Ataque repelido em ${tar.id}.`);
  clearSelection(); checkWinner(); paint();
  if(wasHQ && r.win) showToast('QG inimigo capturado!');
});

refs.reinforceCard.addEventListener('click',()=>{
  if(state.reinforceUsed || state.orders<1) return;
  const t=state.selectedSource?territoryById(state,state.selectedSource):null;
  if(!t || t.owner!=='blue'){ showToast('Selecione primeiro um território azul.'); return; }
  t.troops+=2; state.orders--; state.reinforceUsed=true; showToast(`+2 tropas em ${t.id}`); paint();
});

refs.endTurnBtn.addEventListener('click',()=>{
  if(state.winner) return;
  clearSelection(); state.phase='ai'; paint(); showToast('Turno inimigo');
  setTimeout(()=>{
    const events=runAiTurn(state);
    const wins=events.filter(e=>e.result.win).length;
    showToast(events.length?`Inimigo: ${events.length} ataques, ${wins} conquistas.`:'Inimigo reorganizou as tropas.');
    state.turn++; state.orders=state.maxOrders; state.reinforceUsed=false; state.phase='player';
    for(const t of state.territories.filter(t=>t.owner==='blue')) if(Math.random()<0.24) t.troops++;
    paint();
  },650);
});

paint();
