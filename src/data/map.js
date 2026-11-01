export const LANDMASSES = [
  {
    id:'central',
    points:[
      [142,23],[177,15],[216,19],[248,29],[276,43],[302,62],[329,70],[347,91],
      [343,116],[366,136],[358,161],[380,184],[374,212],[389,235],[375,260],
      [384,287],[368,312],[383,338],[368,365],[381,392],[367,419],[374,447],
      [354,471],[359,497],[339,520],[329,548],[302,562],[291,588],[266,604],
      [244,629],[214,641],[187,634],[161,643],[136,626],[109,620],[91,595],
      [66,582],[57,556],[39,536],[46,506],[31,480],[40,451],[28,422],[44,396],
      [32,369],[45,342],[30,316],[43,289],[31,260],[49,236],[39,207],[56,183],
      [50,153],[67,128],[72,102],[94,83],[105,59],[126,43]
    ]
  }
];

export const TERRITORY_TEMPLATE = [
  { id:'A1', x:145, y:72, terrain:'city', owner:'blue', troops:12, hq:true, landmass:'central' },
  { id:'A2', x:268, y:78, terrain:'snow', owner:'neutral', troops:1, landmass:'central' },
  { id:'B1', x:82, y:164, terrain:'port', owner:'neutral', troops:2, landmass:'central' },
  { id:'B2', x:183, y:145, terrain:'forest', owner:'blue', troops:2, landmass:'central' },
  { id:'B3', x:313, y:169, terrain:'farm', owner:'neutral', troops:2, landmass:'central' },
  { id:'C1', x:63, y:261, terrain:'rock', owner:'neutral', troops:3, landmass:'central' },
  { id:'C2', x:145, y:232, terrain:'forest', owner:'neutral', troops:3, landmass:'central' },
  { id:'C3', x:247, y:252, terrain:'plains', owner:'neutral', troops:2, landmass:'central' },
  { id:'C4', x:350, y:243, terrain:'forest', owner:'neutral', troops:2, landmass:'central' },
  { id:'D1', x:90, y:345, terrain:'city', owner:'neutral', troops:4, landmass:'central' },
  { id:'D2', x:191, y:321, terrain:'rock', owner:'neutral', troops:3, landmass:'central' },
  { id:'D3', x:299, y:344, terrain:'farm', owner:'neutral', troops:3, landmass:'central' },
  { id:'E1', x:65, y:431, terrain:'farm', owner:'neutral', troops:2, landmass:'central' },
  { id:'E2', x:158, y:411, terrain:'plains', owner:'neutral', troops:2, landmass:'central' },
  { id:'E3', x:261, y:431, terrain:'city', owner:'neutral', troops:4, landmass:'central' },
  { id:'E4', x:352, y:414, terrain:'rock', owner:'neutral', troops:3, landmass:'central' },
  { id:'F1', x:111, y:521, terrain:'forest', owner:'neutral', troops:2, landmass:'central' },
  { id:'F2', x:218, y:501, terrain:'farm', owner:'red', troops:2, landmass:'central' },
  { id:'F3', x:321, y:513, terrain:'port', owner:'neutral', troops:2, landmass:'central' },
  { id:'G1', x:152, y:602, terrain:'plains', owner:'neutral', troops:1, landmass:'central' },
  { id:'G2', x:267, y:588, terrain:'city', owner:'red', troops:12, hq:true, landmass:'central' }
];

export const NEIGHBORS = {
  A1:['A2','B1','B2'], A2:['A1','B2','B3'],
  B1:['A1','B2','C1','C2'], B2:['A1','A2','B1','B3','C2','C3'], B3:['A2','B2','C3','C4'],
  C1:['B1','C2','D1'], C2:['B1','B2','C1','C3','D1','D2'], C3:['B2','B3','C2','C4','D2','D3'], C4:['B3','C3','D3'],
  D1:['C1','C2','D2','E1','E2'], D2:['C2','C3','D1','D3','E2','E3'], D3:['C3','C4','D2','E3','E4'],
  E1:['D1','E2','F1'], E2:['D1','D2','E1','E3','F1','F2'], E3:['D2','D3','E2','E4','F2','F3'], E4:['D3','E3','F3'],
  F1:['E1','E2','F2','G1'], F2:['E2','E3','F1','F3','G1','G2'], F3:['E3','E4','F2','G2'],
  G1:['F1','F2','G2'], G2:['F2','F3','G1']
};
