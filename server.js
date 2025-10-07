const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const ICAL = require('ical.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Storage para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './'),
  filename: (req, file, cb) => cb(null, 'calendario.ics')
});
const upload = multer({ storage });

// Rota: Upload de calendário .ics
app.post('/upload', upload.single('calendar'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  }
  res.json({ success: true, message: 'Calendário atualizado com sucesso!' });
});

// Rota: Listar eventos do calendário
app.get('/events', (req, res) => {
  try {
    if (!fs.existsSync('./calendario.ics')) {
      return res.json({ events: [] });
    }
    const icsData = fs.readFileSync('./calendario.ics', 'utf8');
    const jcalData = ICAL.parse(icsData);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents('vevent');
    
    const events = vevents.map(vevent => {
      const event = new ICAL.Event(vevent);
      return {
        uid: event.uid,
        summary: event.summary,
        description: event.description || '',
        startDate: event.startDate.toJSDate(),
        endDate: event.endDate.toJSDate(),
        categories: event.component.getFirstPropertyValue('categories') || ''
      };
    });
    
    res.json({ events: events.sort((a, b) => a.startDate - b.startDate) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rota: Criar lembrete manual
app.post('/reminder', (req, res) => {
  try {
    const { summary, description, date, time, category } = req.body;
    if (!summary || !date || !time) {
      return res.status(400).json({ error: 'Campos obrigatórios: summary, date, time' });
    }

    // Carregar ou criar novo calendário
    let comp;
    if (fs.existsSync('./calendario.ics')) {
      const icsData = fs.readFileSync('./calendario.ics', 'utf8');
      const jcalData = ICAL.parse(icsData);
      comp = new ICAL.Component(jcalData);
    } else {
      comp = new ICAL.Component(['vcalendar', [], []]);
      comp.updatePropertyWithValue('prodid', '-//Bot WhatsApp//Manual Event//PT');
      comp.updatePropertyWithValue('version', '2.0');
    }

    // Criar novo evento
    const vevent = new ICAL.Component('vevent');
    const event = new ICAL.Event(vevent);
    
    const startDateTime = new Date(`${date}T${time}:00`);
    event.summary = summary;
    event.description = description || '';
    event.startDate = ICAL.Time.fromJSDate(startDateTime, false);
    event.endDate = ICAL.Time.fromJSDate(startDateTime, false);
    event.uid = `manual-${Date.now()}@bot`;
    
    if (category) {
      vevent.addPropertyWithValue('categories', category);
    }
    
    comp.addSubcomponent(vevent);
    
    // Salvar calendário atualizado
    fs.writeFileSync('./calendario.ics', comp.toString());
    
    // Notificar o bot para enviar mensagem imediatamente
    try {
      const http = require('http');
      const postData = JSON.stringify({
        summary,
        description: description || '',
        startDate: startDateTime.toISOString(),
        category: category || ''
      });

      const options = {
        hostname: 'localhost',
        port: 3001,
        path: '/notify',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = http.request(options, (response) => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
          console.log('Bot notificado:', data);
        });
      });

      req.on('error', (error) => {
        console.error('Erro ao notificar bot:', error.message);
      });

      req.write(postData);
      req.end();
    } catch (notifyError) {
      console.error('Erro ao tentar notificar bot:', notifyError.message);
    }
    
    res.json({ success: true, message: 'Lembrete criado e enviado para o grupo!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rota: Deletar evento
app.delete('/event/:uid', (req, res) => {
  try {
    const { uid } = req.params;
    if (!fs.existsSync('./calendario.ics')) {
      return res.status(404).json({ error: 'Calendário não encontrado' });
    }

    const icsData = fs.readFileSync('./calendario.ics', 'utf8');
    const jcalData = ICAL.parse(icsData);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents('vevent');
    
    let found = false;
    vevents.forEach(vevent => {
      const event = new ICAL.Event(vevent);
      if (event.uid === uid) {
        comp.removeSubcomponent(vevent);
        found = true;
      }
    });

    if (!found) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }

    fs.writeFileSync('./calendario.ics', comp.toString());
    res.json({ success: true, message: 'Evento deletado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rota: Status do bot
app.get('/status', (req, res) => {
  try {
    const events = [];
    if (fs.existsSync('./calendario.ics')) {
      const icsData = fs.readFileSync('./calendario.ics', 'utf8');
      const jcalData = ICAL.parse(icsData);
      const comp = new ICAL.Component(jcalData);
      events.push(...comp.getAllSubcomponents('vevent'));
    }
    res.json({
      totalEvents: events.length,
      calendarExists: fs.existsSync('./calendario.ics')
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rota: Listar disciplinas
app.get('/subjects', (req, res) => {
  try {
    if (!fs.existsSync('./subjects.json')) {
      return res.json({ subjects: [] });
    }
    const data = JSON.parse(fs.readFileSync('./subjects.json', 'utf8'));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rota: Adicionar disciplina
app.post('/subject', (req, res) => {
  try {
    const { code, name } = req.body;
    if (!code || !name) {
      return res.status(400).json({ error: 'Código e nome são obrigatórios' });
    }

    let data = { subjects: [] };
    if (fs.existsSync('./subjects.json')) {
      data = JSON.parse(fs.readFileSync('./subjects.json', 'utf8'));
    }

    // Verificar se já existe
    const exists = data.subjects.find(s => s.code.toLowerCase() === code.toLowerCase());
    if (exists) {
      return res.status(400).json({ error: 'Disciplina já existe' });
    }

    data.subjects.push({ code, name });
    fs.writeFileSync('./subjects.json', JSON.stringify(data, null, 2));
    res.json({ success: true, message: 'Disciplina adicionada!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rota: Atualizar disciplina
app.put('/subject/:code', (req, res) => {
  try {
    const { code } = req.params;
    const { name } = req.body;
    
    if (!fs.existsSync('./subjects.json')) {
      return res.status(404).json({ error: 'Arquivo de disciplinas não encontrado' });
    }

    const data = JSON.parse(fs.readFileSync('./subjects.json', 'utf8'));
    const subject = data.subjects.find(s => s.code === code);
    
    if (!subject) {
      return res.status(404).json({ error: 'Disciplina não encontrada' });
    }

    subject.name = name;
    fs.writeFileSync('./subjects.json', JSON.stringify(data, null, 2));
    res.json({ success: true, message: 'Disciplina atualizada!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rota: Deletar disciplina
app.delete('/subject/:code', (req, res) => {
  try {
    const { code } = req.params;
    
    if (!fs.existsSync('./subjects.json')) {
      return res.status(404).json({ error: 'Arquivo de disciplinas não encontrado' });
    }

    const data = JSON.parse(fs.readFileSync('./subjects.json', 'utf8'));
    const index = data.subjects.findIndex(s => s.code === code);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Disciplina não encontrada' });
    }

    data.subjects.splice(index, 1);
    fs.writeFileSync('./subjects.json', JSON.stringify(data, null, 2));
    res.json({ success: true, message: 'Disciplina deletada!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🌐 Frontend rodando em http://localhost:${PORT}`);
});
