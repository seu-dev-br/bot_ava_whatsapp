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

### Opções de uso:
- **Local**: `npm run web` → http://localhost:3000
- **Vercel**: Deploy na nuvem (veja seção abaixo) → acesse de qualquer lugar

### Funcionalidades:
- 📤 **Upload de calendário .ics** — substitui o arquivo atual
- ➕ **Criar lembretes manuais** — adiciona eventos personalizados
- 📚 **Gerenciar disciplinas** — adicionar/editar/remover matérias
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

## � Deploy no Vercel (Recomendado)

### Guia rápido:

1. **Acesse**: https://vercel.com/ e faça login com GitHub
2. **Clique em "Add New..."** → "Project"
3. **Importe**: `seu-dev-br/bot_ava_whatsapp`
4. **Deploy** - Vercel detecta configurações automaticamente
5. **Acesse**: `https://bot-ava-whatsapp.vercel.app`

📖 **Guia completo**: Veja [DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md)

### ⚠️ Importante:
- ✅ **Frontend hospedado** no Vercel (visualização, interface)
- ❌ **Bot roda localmente** (precisa escanear QR Code)
- 💾 **Arquivo .ics** gerenciado localmente pelo bot

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

