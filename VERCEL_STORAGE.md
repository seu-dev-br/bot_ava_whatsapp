# 💾 Opção: Persistência com Vercel Blob Storage

Se você quiser que o `calendario.ics` persista no Vercel (e não apenas localmente), pode usar o Vercel Blob Storage.

## Instalação

```powershell
npm install @vercel/blob
```

## Configuração

1. No painel do Vercel:
   - Vá em **Storage** → **Create Database**
   - Escolha **Blob**
   - Copie o token gerado

2. Adicione variável de ambiente:
   ```
   BLOB_READ_WRITE_TOKEN=vercel_blob_xxx
   ```

## Exemplo de uso no server.js

```javascript
const { put, list, del } = require('@vercel/blob');

// Upload de arquivo
app.post('/upload', upload.single('calendar'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  }
  
  // Salvar no Blob Storage
  const blob = await put('calendario.ics', req.file.buffer, {
    access: 'public',
  });
  
  res.json({ success: true, url: blob.url });
});

// Ler arquivo
app.get('/events', async (req, res) => {
  try {
    const blobs = await list();
    const calendarBlob = blobs.blobs.find(b => b.pathname === 'calendario.ics');
    
    if (!calendarBlob) {
      return res.json({ events: [] });
    }
    
    const response = await fetch(calendarBlob.url);
    const icsData = await response.text();
    
    // Parse ICS...
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

## Custo

- **Free Tier**: 1 GB de storage grátis
- Suficiente para milhares de eventos .ics

## Quando usar?

- ✅ Se você quer acessar o calendário de qualquer lugar
- ✅ Se múltiplas pessoas vão fazer upload
- ❌ Se prefere manter tudo local (mais simples)

Para este projeto, **manter local é mais simples** e funciona perfeitamente.
