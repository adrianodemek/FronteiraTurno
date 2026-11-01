export const LANDMASSES = [
  {
    id:'central',
    points:[[146,24],[193,18],[242,23],[286,35],[322,56],[347,88],[361,125],[371,163],[369,201],[380,240],[372,278],[381,318],[372,357],[379,398],[369,438],[357,478],[338,515],[319,550],[304,585],[278,615],[245,635],[208,646],[170,643],[133,632],[101,613],[76,586],[58,553],[45,516],[36,478],[34,440],[40,402],[31,365],[38,328],[29,292],[35,254],[30,217],[39,181],[43,145],[55,112],[74,82],[98,55],[121,37]]
  }
];

export const TERRITORY_TEMPLATE = [
  { id:'A1', x:165, y:76, terrain:'city', owner:'blue', troops:12, hq:true, landmass:'central' },
  { id:'A2', x:265, y:72, terrain:'snow', owner:'neutral', troops:1, landmass:'central' },
  { id:'B1', x:108, y:154, terrain:'port', owner:'neutral', troops:2, landmass:'central' },
  { id:'B2', x:205, y:151, terrain:'forest', owner:'blue', troops:2, landmass:'central' },
  { id:'B3', x:308, y:162, terrain:'farm', owner:'neutral', troops:2, landmass:'central' },
  { id:'C1', x:72, y:244, terrain:'rock', owner:'neutral', troops:3, landmass:'central' },
  { id:'C2', x:157, y:236, terrain:'forest', owner:'neutral', troops:3, landmass:'central' },
  { id:'C3', x:246, y:242, terrain:'plains', owner:'neutral', troops:2, landmass:'central' },
  { id:'C4', x:337, y:248, terrain:'forest', owner:'neutral', troops:2, landmass:'central' },
  { id:'D1', x:96, y:333, terrain:'city', owner:'neutral', troops:4, landmass:'central' },
  { id:'D2', x:191, y:324, terrain:'rock', owner:'neutral', troops:3, landmass:'central' },
  { id:'D3', x:295, y:332, terrain:'farm', owner:'neutral', troops:3, landmass:'central' },
  { id:'E1', x:80, y:422, terrain:'farm', owner:'neutral', troops:2, landmass:'central' },
  { id:'E2', x:165, y:414, terrain:'plains', owner:'neutral', troops:2, landmass:'central' },
  { id:'E3', x:257, y:419, terrain:'city', owner:'neutral', troops:4, landmass:'central' },
  { id:'E4', x:341, y:416, terrain:'rock', owner:'neutral', troops:3, landmass:'central' },
  { id:'F1', x:119, y:506, terrain:'forest', owner:'neutral', troops:2, landmass:'central' },
  { id:'F2', x:211, y:510, terrain:'farm', owner:'red', troops:2, landmass:'central' },
  { id:'F3', x:304, y:501, terrain:'port', owner:'neutral', troops:2, landmass:'central' },
  { id:'G1', x:160, y:594, terrain:'plains', owner:'neutral', troops:1, landmass:'central' },
  { id:'G2', x:256, y:590, terrain:'city', owner:'red', troops:12, hq:true, landmass:'central' }
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
