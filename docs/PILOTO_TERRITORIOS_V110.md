# FronteiraTurno · Piloto de territórios V1.1.0

Esta etapa separa **A1 (QG), B1 (fazenda) e C1 (floresta)** em três WebPs transparentes independentes, mantendo os outros 18 no fundo. A arte vem da ilustração aprovada, não de objetos procedurais.

- Imagem de fundo: `assets/mapas/ilha-01/oceano-e-terreno.webp`
- Peças: `assets/mapas/ilha-01/territorios/{A1-qg,B1-fazenda,C1-floresta}.webp`
- Metadados de tamanho, origem, polígonos e biomas: `assets/mapas/ilha-01/manifest.json`
- Inspeção, ligar/desligar cada peça: `tools/mapa-piloto.html`
- Engine visual: `src/ui/terrain-pilot-v110.js`
- Fonte de geometria de clique: `src/data/reference-geometry.js`; regras em `src/game/`.

O WebP original V1.0.0 é usado como fallback caso falte algum arquivo, evitando mapa vazio. O loader recebe os assets de uma única vez, não recompõe a cena a cada toque.

Para recriar o piloto: `python tools/build_pilot_tiles.py` (Pillow). O script usa a própria imagem V1.0.0 do repositório. A referência original 941×1672 também está salva na Biblioteca do projeto.

**Limitação conhecida**: as contagens e bordas originais ainda estão impressas na arte da imagem aprovada. Separar a arte dessas marcações é uma fase posterior. O piloto valida primeiro encaixe, edição individual e desempenho.
