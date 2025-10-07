# whatsapp-ics-reminder-bot

Bot que lê um arquivo `.ics` e envia lembretes para um grupo do WhatsApp + Frontend web para gerenciar calendários.

## 🚀 Como usar

1. Instale dependências:

```powershell
npm install
```

2. Inicie o painel web (opcional):

```powershell
npm run web
```
Acesse: http://localhost:3000

3. Inicie o bot WhatsApp (aparecerá um QR para escanear):

```powershell
npm start
```

## 🌐 Frontend Web

### Funcionalidades:
- 📤 **Upload de calendário .ics** — substitui o arquivo atual
- ➕ **Criar lembretes manuais** — adiciona eventos personalizados
- 📋 **Visualizar todos os eventos** — lista ordenada por data
- 🗑️ **Deletar eventos** — remover eventos específicos
- 📊 **Estatísticas** — total de eventos e próximos 7 dias

## Comandos disponíveis

### Comandos públicos (qualquer pessoa pode usar):
- `!ajuda` ou `!help` — mostra todos os comandos
- `!atividades_proximas` — lista atividades dos próximos 7 dias
- `!materias` — lista todas as disciplinas disponíveis
- `!<materia>` — atividades futuras de uma disciplina (ex: `!bdi`, `!banco_dados`)

### Comandos administrativos (apenas quem iniciou a sessão):
- `!status` — mostra total de eventos e quantos foram notificados
- `!recarregar` — recarrega o `.ics` e força checagem

### Exemplo de uso:
```
!materias
!bdi
!atividades_proximas
```

Configuração rápida
- Edite `whatsapp-web.js` e ajuste `CONFIG` (nome do grupo, caminho do .ics e `anticipationHours`).

## 🚂 Deploy no Railway

### Passo a passo:

1. **Crie uma conta no Railway**: https://railway.app/

2. **Instale o Railway CLI** (opcional):
```powershell
npm install -g @railway/cli
railway login
```

3. **Deploy via GitHub** (Recomendado):
   - Acesse https://railway.app/
   - Clique em "New Project"
   - Selecione "Deploy from GitHub repo"
   - Escolha o repositório `seu-dev-br/bot_ava_whatsapp`
   - Railway detectará automaticamente as configurações

4. **Deploy via CLI** (alternativa):
```powershell
railway init
railway up
```

5. **Configurar variáveis de ambiente** (se necessário):
   - No painel do Railway, vá em "Variables"
   - Adicione: `PORT` (Railway define automaticamente)

6. **Acesse seu frontend**:
   - Railway fornecerá uma URL pública (ex: `https://seu-projeto.up.railway.app`)

### ⚠️ Notas importantes:
- O bot WhatsApp (`whatsapp-web.js`) **NÃO pode rodar no Railway** pois precisa de interface gráfica para escanear QR
- Apenas o **frontend web** (`server.js`) será hospedado no Railway
- O bot deve continuar rodando localmente com `npm start`

## Commit & push

Depois de criar um repositório remoto no GitHub, execute localmente:

```powershell
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/seu-dev-br/bot_ava_whatsapp.git
git push -u origin main
```

