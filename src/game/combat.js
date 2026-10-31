const TERRAIN_DEFENSE = { city:0.12, forest:0.09, snow:0.06, rock:0.08, port:0.04, farm:0.01, plains:0 };

export function attackChance(attacker, defender){
  const attackPower = Math.max(1, attacker.troops - 1);
  const defense = defender.troops * (1 + (TERRAIN_DEFENSE[defender.terrain] || 0));
  const raw = attackPower / (attackPower + defense);
  return Math.max(0.15, Math.min(0.88, raw));
}

export function resolveAttack(attacker, defender, rng=Math.random){
  const committed = Math.max(1, attacker.troops - 1);
  const chance = attackChance(attacker, defender);
  const win = rng() < chance;
  if(win){
    const survivors = Math.max(1, Math.round(committed * (0.55 + rng()*0.25)));
    attacker.troops = 1;
    defender.owner = attacker.owner;
    defender.troops = survivors;
    return { win:true, chance, survivors, committed };
  }
  const loss = Math.max(1, Math.round(committed * (0.45 + rng()*0.35)));
  attacker.troops = Math.max(1, attacker.troops - loss);
  defender.troops = Math.max(1, defender.troops - Math.max(0, Math.round(loss * 0.35)));
  return { win:false, chance, loss, committed };
}
