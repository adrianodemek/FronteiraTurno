export const MAP_SEED='fronteira-alpha-080';

export const BIOME_PRESETS={
  forest:{surface:'earth',vegetation:'dense',relief:'soft',detail:'wet'},
  plains:{surface:'grass',vegetation:'light',relief:'flat',detail:'open'},
  farm:{surface:'loam',vegetation:'edge',relief:'flat',detail:'fields'},
  city:{surface:'grass',vegetation:'urban',relief:'flat',detail:'settlement'},
  port:{surface:'sand',vegetation:'coastal',relief:'flat',detail:'harbor'},
  rock:{surface:'rock',vegetation:'sparse',relief:'high',detail:'stone'},
  snow:{surface:'snow',vegetation:'alpine',relief:'high',detail:'cold'}
};

// A geometria e as regras continuam em map.js. Aqui fica apenas a aparência do mundo.
// No futuro um gerador randômico poderá produzir este mesmo formato a partir de uma seed.
export const TERRITORY_STYLE={
  A1:{biome:'city',surface:'grass',vegetation:'urban',features:['hq','road'],variant:'military'},
  A2:{biome:'snow',surface:'snow',vegetation:'alpine',features:['trail'],variant:'ridge'},
  B1:{biome:'port',surface:'sand',vegetation:'coastal',features:['port','road'],variant:'bay'},
  B2:{biome:'forest',surface:'earth',vegetation:'dense',features:['road'],variant:'pine'},
  B3:{biome:'farm',surface:'loam',vegetation:'edge',features:['road'],variant:'grain'},
  C1:{biome:'rock',surface:'rock',vegetation:'sparse',features:['trail'],variant:'cliff'},
  C2:{biome:'forest',surface:'mud',vegetation:'dense',features:['road'],variant:'mixed'},
  C3:{biome:'plains',surface:'grass',vegetation:'light',features:['road','airfield'],variant:'open'},
  C4:{biome:'forest',surface:'earth',vegetation:'dense',features:['trail'],variant:'wet'},
  D1:{biome:'city',surface:'dirt',vegetation:'urban',features:['road','rail'],variant:'town'},
  D2:{biome:'rock',surface:'rock',vegetation:'sparse',features:['rail','trail'],variant:'highland'},
  D3:{biome:'farm',surface:'loam',vegetation:'edge',features:['road'],variant:'orchard'},
  E1:{biome:'farm',surface:'clay',vegetation:'dry',features:['road'],variant:'dryland'},
  E2:{biome:'plains',surface:'grass',vegetation:'light',features:['road','rail'],variant:'junction'},
  E3:{biome:'city',surface:'dirt',vegetation:'urban',features:['road','rail'],variant:'industrial'},
  E4:{biome:'rock',surface:'clay',vegetation:'sparse',features:['trail'],variant:'badlands'},
  F1:{biome:'forest',surface:'earth',vegetation:'dense',features:['road'],variant:'broadleaf'},
  F2:{biome:'farm',surface:'loam',vegetation:'edge',features:['road','rail'],variant:'fields'},
  F3:{biome:'port',surface:'sand',vegetation:'coastal',features:['port','road'],variant:'harbor'},
  G1:{biome:'plains',surface:'grass',vegetation:'light',features:['road'],variant:'meadow'},
  G2:{biome:'city',surface:'grass',vegetation:'urban',features:['hq','road','rail'],variant:'military'}
};

// Infraestrutura contínua. Ela atravessa divisas e portanto não parece um desenho cortado.
export const INFRASTRUCTURE=[
  {id:'road-main',type:'road',route:['A1','B2','C2','D2','E2','F2','G2']},
  {id:'road-east',type:'road',route:['B1','C2','C3','D3','E3','F3']},
  {id:'road-north',type:'road',route:['A2','B3','C3','D2']},
  {id:'rail-spine',type:'rail',route:['B3','C3','D2','E3','F2','G2']},
  {id:'rail-west',type:'rail',route:['D1','D2','E2','F2']}
];
