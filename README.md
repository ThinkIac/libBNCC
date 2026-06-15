# libBNCC 🎯

A `libBNCC` é uma máquina de estado cronológica e roteador estrutural leve e sem dependências em JavaScript, projetada para analisar, navegar e encadear conjuntos de dados da Base Nacional Comum Curricular (**BNCC**).

Ela abstrai transições pedagógicas complexas (como mudar de unidades temáticas, avançar anos escolares e monitorar fronteiras de conteúdo) em métodos de API previsíveis como `next()`, `previous()` e `getSteps()`.

---

## 🚀 Principais Recursos

* 🔄 **Navegação Bidirecional:** Movimentação cronológica fluida para frente (`next()`) e para trás (`previous()`), gerenciando automaticamente as quebras de categorias e anos.
* 🧭 **Roteador para Formulários (Wizard):** O método `getSteps()` resolve dinamicamente as etapas de interface necessárias para filtrar itens em cascata (Segmento ➔ Ano ➔ Unidade ➔ Habilidade).
* 📋 **Planificação do Currículo:** Converta facilmente esquemas JSON profundamente aninhados em uma única linha do tempo linear com o método `getAll()`.
* 🧠 **Orientada a Estado:** Mantém o controle da habilidade ativa internamente (`current`), funcionando exatamente como um player de faixas de áudio.

---

## 🛠️ Instalação e Configuração

1. Adicione o arquivo `libBNCC.js` ao seu projeto.
2. Certifique-se de que o seu `package.json` suporta Módulos ECMAScript (`"type": "module"`).

### Exemplo de Importação
```javascript
import libBNCC from './libBNCC.js';
import dadosBNCC from './bncc.json'; // O arquivo com a estrutura da BNCC

// Instancia o motor
const bncEngine = new libBNCC(dadosBNCC);

```

---

## 📖 Referência da API e Uso

### 1. Definindo e Obtendo o Estado Ativo

Você pode posicionar a máquina de estados apontando diretamente para o identificador de uma habilidade a qualquer momento.

```javascript
// Salta imediatamente para um código específico
bncEngine.setActiveSkill("EF01MA08");

// Recupera o objeto de estado completo
const ativa = bncEngine.getActiveSkill();
console.log(ativa.code);           // "EF01MA08"
console.log(ativa.thematic_unit);  // "Números"

```

### 2. Navegação Cronológica (`next` / `previous`)

O motor avalia os limites do JSON e realiza as viradas de assunto ou de ano letivo automaticamente.

```javascript
// EF01MA08 é a última habilidade de "Números" no 1º Ano.
bncEngine.setActiveSkill("EF01MA08");

// Avança na linha do tempo
bncEngine.next(); 
console.log(bncEngine.getActiveSkill().thematic_unit); // "Álgebra"
console.log(bncEngine.getActiveSkill().code);          // "EF01MA09"

// Bate na fronteira e retrocede
bncEngine.previous();
console.log(bncEngine.getActiveSkill().thematic_unit); // "Números"

```

### 3. Planificando a Grade para Visualização Completa (`getAll`)

Perfeito para renderizar tabelas dinâmicas, cronogramas ou mapas visuais completos para o professor.

```javascript
const linhaDoTempoLinear = bncEngine.getAll("EF");

console.log(linhaDoTempoLinear.length);  // Total de lições sequenciais disponíveis
console.log(linhaDoTempoLinear[0].code); // "EF01MA01"

```

### 4. Fluxo Dinâmico para Filtros da Interface (`getSteps`)

Se o código da habilidade for fornecido, o método resolve o estado diretamente. Caso contrário, ele entrega arrays de dados ordenados para alimentar seletores (dropdowns) em cascata no seu frontend.

```javascript
// Passo 1: Inicialize sem argumentos para buscar os anos disponíveis
const passo1 = bncEngine.getSteps();
// Retorna: { nextStep: "year", availableOptions: ["1_ano", "2_ano", ...] }

// Passo 2: Envie o ano escolhido para buscar as unidades temáticas dele
const passo2 = bncEngine.getSteps({ year: "1_ano" });
// Retorna: { nextStep: "thematicUnit", availableOptions: ["Números", "Álgebra", ...] }

// Passo 3: Busque todas as habilidades mapeadas sob aquela unidade temática
const passo3 = bncEngine.getSteps({ year: "1_ano", thematicUnit: "Geometria" });
// Retorna: { nextStep: "skillSelection", availableOptions: [ {codigo: "...", descricao: "..."} ] }

```

---

## 🗂️ Estrutura do Esquema JSON Obrigatório

O objeto de dados enviado para a `libBNCC` precisa seguir rigidamente este padrão:

```json
{
  "EF": {
    "1_ano": [
      {
        "unidade_tematica": "Números",
        "objetos_de_conhecimento": [ "Item A", "Item B" ],
        "habilidades": [
          { "codigo": "EF01MA01", "descricao": "Exemplo de texto da diretriz" }
        ]
      }
    ]
  }
}

```

---

## 📄 Licença

Este projeto está licenciado sob a Licença MIT.
