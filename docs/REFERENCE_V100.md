# FronteiraTurno — base de arte V1.0.0

Referência oficial: `/FronteiraTurno/Referencia_Visual_Oficial.png` (Biblioteca do usuário).

## Implementação
- Arte 2D raster otimizada (`assets/map/reference/island-playable-v100.webp`) derivada da arte original, recortando HUD/cartas para permitir controles reais.
- Uma imagem estática de 840 × 1193 px, ~212 KB, desenhada uma vez no SVG; o jogo não recria objetos de vegetação a cada toque.
- **21 territórios clicáveis** com geometria independente em `src/data/reference-geometry.js`, mapeada à arte do conceito.
- Badges/tropas, seleção, tints e bordas de controle sobrepostos e atualizados pela engine; regras, IA, transferência, zoom por pinça e cartas preservados.
- A UI HTML fica fora do mapa. A câmera mantém o enquadramento seguro sem alcançar os botões.

## Limite visual do piloto
O conceito de origem inclui *divisas e números pintados na imagem*. Esta etapa sobrepõe os indicadores reais exatamente nesses locais, mas ainda não remove essas marcações do raster. Para mudanças de domínio, bordas/tints dinâmicos cobrem a marcação inicial. Para a futura versão de produção, produzir **uma arte-base limpa sem textos, indicadores e fronteiras**, mantendo a mesma geografia, e desenhar toda a semântica por cima.

## Próximas etapas
1. Validar alinhamento das 21 áreas de toque nos aparelhos Android, sem alterar mecânicas.
2. Recriar a arte-base limpa por regiões e melhorar transições entre biomas.
3. Animar o mar e espuma costeira em camada leve sem atualizar o terreno.