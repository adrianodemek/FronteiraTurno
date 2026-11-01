const TERRAIN_DEFENSE = { city:0.12, forest:0.09, snow:0.06, rock:0.08, port:0.04, farm:0.01, plains:0 };

export function maxAttackTroops(attacker){
  return Math.max(1, attacker.troops - 1);
}

export function attackChance(attacker, defender, committed=maxAttackTroops(attacker)){
  const sent = Math.max(1, Math.min(maxAttackTroops(attacker), Number(committed) || 1));
  const attackPower = sent;
  const defense = defender.troops * (1 + (TERRAIN_DEFENSE[defender.terrain] || 0));
  const raw = attackPower / (attackPower + defense);
  return Math.max(0.08, Math.min(0.92, raw));
}

export function resolveAttack(attacker, defender, committed=maxAttackTroops(attacker), rng=Math.random){
  const sent = Math.max(1, Math.min(maxAttackTroops(attacker), Number(committed) || 1));
  const chance = attackChance(attacker, defender, sent);
  const win = rng() < chance;

  if(win){
    const survivors = Math.max(1, Math.min(sent, Math.round(sent * (0.55 + rng()*0.25))));
    attacker.troops = Math.max(1, attacker.troops - sent);
    defender.owner = attacker.owner;
    defender.troops = survivors;
    return { win:true, chance, survivors, committed:sent };
  }

  const loss = Math.max(1, Math.min(sent, Math.round(sent * (0.45 + rng()*0.35))));
  attacker.troops = Math.max(1, attacker.troops - loss);
  defender.troops = Math.max(1, defender.troops - Math.max(0, Math.round(loss * 0.35)));
  return { win:false, chance, loss, committed:sent };
}
