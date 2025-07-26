```markdown
# Biblioteca JavaScript Utilitária

## Descrição

Este arquivo contém uma biblioteca JavaScript "vanilla" (sem dependências externas) que encapsula três componentes principais em um único escopo:

* **Util**: Uma extensa biblioteca de utilitários focada em metaprogramming, manipulação de objetos, reflexão e algoritmos de propósito geral.
* **Task**: Uma implementação robusta do padrão de Promise para gerenciamento de operações assíncronas, com uma API rica e métodos adicionais.
* **PUnit**: Um framework de testes unitários inspirado em bibliotecas como Jest, que se integra perfeitamente com o módulo Task para testes síncronos e assíncronos.

O código é modular e autocontido, começando com a criação da biblioteca Util e, em seguida, usando-a para construir os componentes Task e PUnit.

## Util - A Biblioteca de Utilitários

A Util é criada dentro de uma função auto-executável (createUtilLib) para evitar poluir o escopo global. Ela oferece um conjunto de ferramentas para manipulação de baixo nível de objetos, iteração e algoritmos.

### Interface e Funcionalidades

#### Manipulação e Definição de Propriedades:

* `def(obj, propName, value)`: Um atalho para definir uma propriedade simples em um objeto.
* `define(obj, propName, objDef)`: Um wrapper para `Object.defineProperty`, permitindo controle total sobre os atributos de uma propriedade.
* `final(obj, propName, value)`: Define uma propriedade de valor enumerável e não regravável.
* `var(obj, propName, value)`: Define uma propriedade de valor que é gravável e enumerável.
* `lazy(obj, propName, getFn)`: Define uma propriedade lazy. O valor só é calculado pela função `getFn` na primeira vez que a propriedade é acessada e, em seguida, é substituído pelo resultado.
* `pseudo(obj, propName, objFn)`: Define uma propriedade com getters e setters personalizados.

#### Reflexão e Comparação:

* `hasOwn(Type, propName)`: Verifica se um objeto possui uma propriedade diretamente (não herdada).
* `isEqual(obj1, obj2)`: Realiza uma comparação profunda (deep equal) bidirecional entre dois objetos.
* `isSameOf(obj, Type, checker)`: Verifica se um objeto corresponde à "forma" ou estrutura de um Type, opcionalmente usando um checker customizado.
* `typeof(Class, Interface)` e `instanceof(Class, Interface)`: Funções de verificação de tipo que lidam com primitivos e objetos.
* `checkPattern(value, pattern, checker)`: Verifica se um valor corresponde a um padrão, que pode ser um valor, um tipo, uma estrutura ou uma função de validação.

#### Clonagem e Extensão:

* `copyDiscriptors(Type, newType)`: Copia os descritores de propriedade de um objeto para outro.
* `extend(Type, extention)`: Cria um novo objeto que herda de Type e copia as propriedades de extention para ele.

#### Algoritmos e Estruturas de Dados:

* `sort(arr, getNodeId)`: Implementa um algoritmo de ordenação (merge sort). Ele opera em uma cópia da matriz e usa um objeto `FatPtr` para gerenciar sub-arrays e comparações.
* `searchNode(arr, id, getNodeId)`: Realiza uma busca em uma estrutura semelhante a uma árvore (heap) dentro de um array. As funções `getLayer`, `getColumn`, `leftIndex`, `rightIndex` e `startIndex` são auxiliares para navegar nesta estrutura de árvore implícita.

## Task - Gerenciamento de Operações Assíncronas

`Task` é uma implementação do padrão Promise.

### Interface e Funcionalidades

A API é muito semelhante à especificação Promises/A+.

* `Task.new(callback)`: O construtor, que recebe uma função com os argumentos `fulfill` e `reject`.
* `.then(onFulfilled, onRejected)`: Anexa callbacks para os estados de sucesso ou falha de uma Task. Retorna uma nova Task, permitindo o encadeamento.
* `.catch(onRejected)`: Um atalho para `then(null, onRejected)`.
* `.finally(callback)`: Executa um callback quando a Task é concluída (seja resolvida ou rejeitada).
* `Task.resolve(obj)` e `Task.reject(obj)`: Funções estáticas para criar Tasks que já estão resolvidas ou rejeitadas.
* `Task.all(tasks)` e `Task.race(tasks)`: Combinadores para lidar com múltiplos Tasks em paralelo.
* **Métodos Utilitários**: A biblioteca inclui métodos adicionais como `flow`, `until` e `range`, que permitem a criação de fluxos de controle assíncronos complexos, como sequências e laços.

### Implementação

* **Fila de Execução e Scheduler**: Quando uma Task é resolvida ou rejeitada, seus callbacks não são executados imediatamente. Em vez disso, eles são agendados para execução no próximo "tick" do loop de eventos do JavaScript, usando `setTimeout(execQueue, 0)`, garantindo um comportamento assíncrono e previsível.
* **Estado Interno**: Cada instância de Task possui um objeto de estado interno (`_this`) que rastreia seu status (`settledResolve`, `settledReject`), o resultado (`result`) e as listas de callbacks a serem executados (`onResolve`, `onReject`).
* **Imutabilidade e Encadeamento**: A função não modifica a Task original, mas cria e retorna uma nova Task. Essa nova Task é resolvida ou rejeitada com base no resultado do callback passado para `then`, permitindo o encadeamento de operações.
* **Interoperação**: O sistema é projetado para interoperar com objetos "thenable" (qualquer objeto com um método `.then`), tratando-os como Tasks ao resolvê-los.

## PUnit - Framework de Testes Unitários

`PUnit` é um framework de testes que se integra aos outros componentes da biblioteca.

### Interface e Funcionalidades

* `PUnit.new()`: Cria uma nova suíte de testes.
* `pUnit.test(name, callback)`: Define um novo caso de teste dentro da suíte.
* `pUnit.fn()`: Cria uma função mock (`mokeFn`) para simular dependências e espionar chamadas.
* `expect(value)`: O ponto de partida para criar uma asserção.
* **Matchers**: Fornece um conjunto de matchers para validação:
    * **Síncronos**: `toBe(value)`, `toBeEqual(value)`, `toBeTruthy()`, `toThrow(error)`, `toBeSameOf(shape)` etc.
    * **Modificador `.not`**: Nega o resultado de um matcher (`expect(value).not.toBe(other)`).
    * **Matchers Assíncronos**:
        * `.resolves`: Testa o valor de uma Task resolvida (`expect(myTask).resolves.toBe(42)`).
        * `.rejects`: Testa o motivo de uma Task rejeitada.
* **Funções Mock**:
    * `.mockReturnValue(value)` e `.mockReturnValueOnce(value)`: Controlam o valor de retorno da função mock.
    * `.where(test, callback)`: Permite que a função mock retorne valores diferentes com base nos argumentos recebidos.

### Implementação

* **Integração com Task**: PUnit usa Task internamente para gerenciar o fluxo de testes. Quando um matcher como `.resolves` é usado, ele anexa um `.then` à Task esperada para executar a asserção somente após a resolução.
* **Callback `done`**: Para testes assíncronos, PUnit suporta um callback `done`, que sinaliza a conclusão de um teste. Isso permite que o executor aguarde a finalização de operações assíncronas antes de prosseguir.
* **Criação de Mocks**: A função `createMokeFn` cria uma função que registra todas as chamadas (`moke.calls`) e seus resultados (`moke.results`). A funcionalidade `.where` adiciona uma camada de lógica condicional, verificando padrões nos argumentos da chamada com `Util.checkPattern` para determinar o valor de retorno.
* **Coleta de Resultados**: A função `pUnit.execut` executa todos os testes definidos. Cada teste é envolvido em uma Task. `Task.all` é usado para esperar que todos os testes sejam concluídos. No final, ele formata um objeto de resultados, separando os testes bem-sucedidos das falhas e apresentando um resumo.
```