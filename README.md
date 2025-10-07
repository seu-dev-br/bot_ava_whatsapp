# whatsapp-ics-reminder-bot

Bot que lê um arquivo `.ics` e envia lembretes para um grupo do WhatsApp.

Como usar

1. Instale dependências:

```powershell
npm install
```

2. Inicie o bot (aparecerá um QR para escanear):

```powershell
npm start
```

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

Commit & push

Depois de criar um repositório remoto no GitHub, execute localmente:

```powershell
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/seu-dev-br/bot_ava_whatsapp.git
git push -u origin main
```

