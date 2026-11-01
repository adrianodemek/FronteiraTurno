export const TERRITORY_TEMPLATE = [
  { id:'A1', x:165, y:76, terrain:'city', owner:'blue', troops:11, hq:true },
  { id:'A2', x:265, y:72, terrain:'snow', owner:'blue', troops:5 },
  { id:'B1', x:108, y:154, terrain:'port', owner:'blue', troops:7 },
  { id:'B2', x:205, y:151, terrain:'forest', owner:'blue', troops:8 },
  { id:'B3', x:308, y:162, terrain:'farm', owner:'blue', troops:6 },
  { id:'C1', x:72, y:244, terrain:'rock', owner:'neutral', troops:3 },
  { id:'C2', x:157, y:236, terrain:'forest', owner:'blue', troops:9 },
  { id:'C3', x:246, y:242, terrain:'plains', owner:'neutral', troops:4 },
  { id:'C4', x:337, y:248, terrain:'forest', owner:'neutral', troops:2 },
  { id:'D1', x:96, y:333, terrain:'city', owner:'neutral', troops:4 },
  { id:'D2', x:191, y:324, terrain:'rock', owner:'neutral', troops:3 },
  { id:'D3', x:295, y:332, terrain:'farm', owner:'red', troops:5 },
  { id:'E1', x:80, y:422, terrain:'farm', owner:'neutral', troops:2 },
  { id:'E2', x:165, y:414, terrain:'plains', owner:'red', troops:6 },
  { id:'E3', x:257, y:419, terrain:'city', owner:'red', troops:8 },
  { id:'E4', x:341, y:416, terrain:'rock', owner:'red', troops:5 },
  { id:'F1', x:119, y:506, terrain:'forest', owner:'red', troops:4 },
  { id:'F2', x:211, y:510, terrain:'farm', owner:'red', troops:6 },
  { id:'F3', x:304, y:501, terrain:'port', owner:'red', troops:7 },
  { id:'G1', x:160, y:594, terrain:'plains', owner:'red', troops:5 },
  { id:'G2', x:256, y:590, terrain:'city', owner:'red', troops:13, hq:true }
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
