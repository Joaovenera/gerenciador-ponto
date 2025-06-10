# Testes e Integração Contínua

Este documento descreve a configuração de testes e integração contínua (CI/CD) para o projeto de controle de ponto.

## Estrutura de Testes

O projeto utiliza Jest como framework de testes, tanto para o backend quanto para o frontend.

### Frameworks e Ferramentas

- Jest: Framework de testes principal
- React Testing Library: Para testar componentes React
- Supertest: Para testar endpoints HTTP

### Organização dos Testes

- `server/__tests__/`: Testes do backend
- `client/src/__tests__/`: Testes do frontend
  - `components/`: Testes de componentes React

## Executando Testes Localmente

Para executar os testes, use os seguintes comandos:

```bash
# Executar testes de backend
./run-tests.sh

# Ou use o comando direto
node --experimental-vm-modules node_modules/jest/bin/jest.js --config=jest.config.ts

# Executar testes de frontend
node --experimental-vm-modules node_modules/jest/bin/jest.js --config=jest.client.config.ts
```

## GitHub Actions

O projeto inclui vários workflows do GitHub Actions para automação:

### 1. Testes (tests.yml)

Executa testes automatizados em push para a branch main e pull requests.
- Configura um banco de dados PostgreSQL para testes
- Executa verificação de tipos TypeScript
- Executa testes de backend e frontend

### 2. Build e Deploy (deploy.yml)

Preparação e deploy em ambiente de produção após push para main.
- Constrói a aplicação
- Armazena artefatos
- Realiza o deploy (configuração exemplo)

### 3. Auditoria de Segurança (security.yml)

Verifica vulnerabilidades de segurança regularmente.
- Executa npm audit para verificar dependências
- Programado para execução semanal

### 4. Verificações de Pull Request (pull-request.yml)

Verificações específicas para novos pull requests.
- Executa validação TypeScript
- Executa testes apenas para arquivos alterados

## Boas Práticas

1. **Escreva testes para código novo**: Todo código novo deve ter testes associados.
2. **Mantenha a cobertura**: Monitore a cobertura de testes para garantir qualidade.
3. **Testes unitários e de integração**: Combine ambos para cobertura completa.
4. **Use mocks quando necessário**: Para isolar os testes de dependências externas.
5. **Evite testes frágeis**: Testes não devem quebrar com mudanças menores na UI.
