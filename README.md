# Estratégia Territorial — V0.1

Protótipo mobile-first de estratégia territorial por turnos.

## Já funciona
- Mapa com 21 territórios
- Facções azul, vermelha e neutra
- Seleção de território
- Validação de vizinhança
- Cálculo de chance baseado em tropas + defesa do terreno
- Ataques e conquista
- 3 ordens por turno
- Carta Reforços (+2 tropas)
- IA inimiga básica
- Condição de vitória por captura de QG
- Limite de 12 turnos
- Interface responsiva pensada para celular

## Rodar localmente
Como usa ES Modules, rode por um servidor local:

```bash
python3 -m http.server 8080
```

Depois abra `http://localhost:8080`.

## Próximas etapas sugeridas
1. Trocar hexágonos por territórios orgânicos desenhados em pixel art.
2. Adicionar sprites reais de floresta, cidade, fazenda, neve, porto e QG.
3. Implementar animação de mar e partículas.
4. Criar mão/deck com 8 cartas reais.
5. Implementar diferentes perfis de general/IA.
6. Criar tela de campanha e coleção.
