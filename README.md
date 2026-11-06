# Lista de Presentes

Aplicação web desenvolvida para facilitar a organização de uma lista de presentes de aniversário. Os convidados podem acessar a página, visualizar os presentes disponíveis, escolher o que desejam presentear e confirmar presença diretamente pelo site.

O projeto conta com uma área administrativa para gerenciar os presentes, acompanhar as reservas e visualizar as confirmações de presença.

## Funcionalidades

### Página pública
- Visualização dos presentes disponíveis.
- Seleção e reserva de presentes.
- Identificação dos presentes já reservados.
- Confirmação de presença informando o próprio nome, sem necessidade de código de convite.
- Exibição das informações do evento, como nome, data e mensagem de apresentação.
- Acesso ao contato via WhatsApp.

### Painel administrativo
- Cadastro, edição e exclusão de presentes.
- Gerenciamento das reservas.
- Visualização dos presentes disponíveis e reservados.
- Gerenciamento das confirmações de presença.
- Consulta dos nomes dos convidados e suas respostas.
- Indicadores de convidados confirmados, recusados e pendentes.
- Personalização das informações do evento, incluindo nome, data, título e mensagem.

### API
- API própria para gerenciamento dos dados.
- Endpoints para presentes, reservas, convidados e configurações.
- Proteção das operações administrativas por token de autenticação.
- Persistência dos dados no ambiente Cloudflare Workers.

## Tecnologias utilizadas

- HTML5
- CSS3
- JavaScript
- Bootstrap 5
- Cloudflare Workers
- Wrangler CLI

## Configuração

As configurações da aplicação ficam centralizadas em:

```text
assets/js/config.js
```

Nesse arquivo são definidos o endereço da API e as configurações de integração utilizadas pela página pública.

A API utiliza o segredo `ADMIN_TOKEN` para proteger as operações administrativas. Esse valor deve ser configurado como secret no ambiente Cloudflare, sem ser armazenado diretamente no código-fonte.

## Executando localmente

Para executar a página localmente, utilize um servidor HTTP simples:

```bash
python -m http.server 8000
```

Acesse:

```text
http://localhost:8000
```

Para executar a API localmente, utilize o Wrangler:

```bash
npx wrangler dev
```

## Deploy

Para publicar a API no Cloudflare Workers:

```bash
npx wrangler deploy
```

O frontend pode ser publicado em um serviço de hospedagem de páginas estáticas, mantendo a URL da API configurada em `assets/js/config.js`.

## Objetivo

O projeto foi desenvolvido com o objetivo de oferecer uma maneira simples e prática de organizar uma lista de presentes e acompanhar a participação dos convidados, centralizando essas funcionalidades em uma única aplicação web.