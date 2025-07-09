const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET || 'supersecretkey';

const fs = require('fs');
const path = require('path');
const DATA_PATH = path.join(__dirname, 'therapists.json');

app.use(cors());
app.use(express.json());

const today = new Date();

const oneHourLater = new Date(today.getTime() + 60 * 60 * 1000); // 1 hour later

const events = [
  {
    id: 0,
    title: "Initial Test Session",
    start: today.toISOString(),
    end: oneHourLater.toISOString(),
    extendedProps: {
      therapist: "Shannon Lee",
      description: "First sample event to test rendering.",
      room: "Blue Room",
      client: "Diether Dorado",
      service: "Individual",
      frequency: "none"
    }
  }
];

const bcrypt = require('bcrypt');
const saltRounds = 10;

const therapistData = [
  {
    id: 1,
    name: 'Shannon Lee',
    email: 'shannon.l@healingwithgrace.com',
    role: 'admin',
    password: 'password123',
    availability: {
      Monday: [{ start: '10:00', end: '18:00' }],
      Tuesday: [{ start: '10:00', end: '18:00' }],
      Wednesday: [{ start: '10:00', end: '18:00' }],
      Thursday: [{ start: '10:00', end: '18:00' }],
      Friday: [{ start: '10:00', end: '18:00' }],
    },
    outOfOffice: {
      start: null, // '2025-07-12'
      end: null, // '2025-07-15'
    }
  },

  {
    id: 2, name: 'Kana Nootenboon',
    email: 'kana.n@healingwithgrace.com',
    role: 'admin',
    password: 'password123',
    availability: {
      Monday: [{ start: '13:00', end: '19:00' }],
      Tuesday: [{ start: '13:00', end: '19:00' }],
      Wednesday: [],
      Thursday: [{ start: '13:00', end: '19:00' }],
      Friday: [],
    },
    outOfOffice: {
      start: null, // '2025-07-12'
      end: null, // '2025-07-15'
    }
  },

  {
    id: 3, name: 'Brian',
    email: 'brian@healingwithgrace.com',
    role: 'user',
    password: 'password123',
    availability: {
      Monday: [],
      Tuesday: [],
      Wednesday: [{ start: '10:00', end: '19:00' }],
      Thursday: [],
      Friday: [{ start: '10:00', end: '19:00' }],
      Saturday: [{ start: '10:00', end: '17:00' }],
      Sunday: [],
    },
    outOfOffice: {
      start: null, // '2025-07-12'
      end: null, // '2025-07-15'
    }
  },

  {
    id: 4, name: 'Rachel',
    email: 'rachel@healingwithgrace.com',
    role: 'user',
    password: 'password123',
    availability: {
      Monday: [{ start: '09:00', end: '17:00' }],
      Tuesday: [{ start: '09:00', end: '17:00' }],
      Wednesday: [],
      Thursday: [{ start: '09:00', end: '17:00' }],
      Friday: [{ start: '09:00', end: '17:00' }],
    },
    outOfOffice: {
      start: null, // '2025-07-12'
      end: null, // '2025-07-15'
    }
  },
  {
    id: 5, name: 'Marija',
    email: 'marija@healingwithgrace.com',
    role: 'user',
    password: 'password123',
    availability: {
      Monday: [{ start: '09:00', end: '17:00' }],
      Tuesday: [{ start: '09:00', end: '17:00' }],
      Wednesday: [],
      Thursday: [{ start: '09:00', end: '17:00' }],
      Friday: [{ start: '09:00', end: '17:00' }],
    },
    outOfOffice: {
      start: null, // '2025-07-12'
      end: null, // '2025-07-15'
    }
  },
  {
    id: 6, name: 'Suzy',
    email: 'suzy@healingwithgrace.com',
    role: 'user',
    password: 'password123',
    availability: {
      Monday: [{ start: '09:00', end: '17:00' }],
      Tuesday: [{ start: '09:00', end: '17:00' }],
      Wednesday: [],
      Thursday: [{ start: '09:00', end: '17:00' }],
      Friday: [{ start: '09:00', end: '17:00' }],
    },
    outOfOffice: {
      start: null, // '2025-07-12'
      end: null, // '2025-07-15'
    }
  },
  {
    id: 7, name: 'Renata',
    email: 'renata@healingwithgrace.com',
    role: 'user',
    password: 'password123',
    availability: {
      Monday: [{ start: '09:00', end: '17:00' }],
      Tuesday: [{ start: '09:00', end: '17:00' }],
      Wednesday: [],
      Thursday: [{ start: '09:00', end: '17:00' }],
      Friday: [{ start: '09:00', end: '17:00' }],
    },
    outOfOffice: {
      start: null, // '2025-07-12'
      end: null, // '2025-07-15'
    }
  },
  {
    id: 8, name: 'Arisa',
    email: 'arisa@healingwithgrace.com',
    role: 'user',
    password: 'password123',
    availability: {
      Monday: [{ start: '09:00', end: '17:00' }],
      Tuesday: [{ start: '09:00', end: '17:00' }],
      Wednesday: [],
      Thursday: [{ start: '09:00', end: '17:00' }],
      Friday: [{ start: '09:00', end: '17:00' }],
    },
    outOfOffice: {
      start: null, // '2025-07-12'
      end: null, // '2025-07-15'
    }
  },
  {
    id: 9, name: 'Jericho',
    email: 'jericho@healingwithgrace.com',
    role: 'user',
    password: 'password123',
    availability: {
      Monday: [{ start: '09:00', end: '17:00' }],
      Tuesday: [{ start: '09:00', end: '17:00' }],
      Wednesday: [],
      Thursday: [{ start: '09:00', end: '17:00' }],
      Friday: [{ start: '09:00', end: '17:00' }],
    },
    outOfOffice: {
      start: null, // '2025-07-12'
      end: null, // '2025-07-15'
    }
  },
  {
    id: 10, name: 'Fay (Ranniya)',
    email: 'fay@healingwithgrace.com',
    role: 'user',
    password: 'password123',
    availability: {
      Monday: [{ start: '09:00', end: '17:00' }],
      Tuesday: [{ start: '09:00', end: '17:00' }],
      Wednesday: [],
      Thursday: [{ start: '09:00', end: '17:00' }],
      Friday: [{ start: '09:00', end: '17:00' }],
    },
    outOfOffice: {
      start: null, // '2025-07-12'
      end: null, // '2025-07-15'
    }
  },
  {
    id: 11, name: 'Dr. Leon',
    email: 'leon@healingwithgrace.com',
    role: 'user',
    password: 'password123',
    availability: {
      Monday: [{ start: '09:00', end: '17:00' }],
      Tuesday: [{ start: '09:00', end: '17:00' }],
      Wednesday: [],
      Thursday: [{ start: '09:00', end: '17:00' }],
      Friday: [{ start: '09:00', end: '17:00' }],
    },
    outOfOffice: {
      start: null, // '2025-07-12'
      end: null, // '2025-07-15'
    }
  },
  {
    id: 12, name: 'Stephanie',
    email: 'stephanie@healingwithgrace.com',
    role: 'user',
    password: 'password123',
    availability: {
      Monday: [{ start: '09:00', end: '17:00' }],
      Tuesday: [{ start: '09:00', end: '17:00' }],
      Wednesday: [],
      Thursday: [{ start: '09:00', end: '17:00' }],
      Friday: [{ start: '09:00', end: '17:00' }],
    },
    outOfOffice: {
      start: null, // '2025-07-12'
      end: null, // '2025-07-15'
    }
  },
  {
    id: 13, name: 'Sophia',
    email: 'sophia@healingwithgrace.com',
    role: 'user',
    password: 'password123',
    availability: {
      Monday: [{ start: '09:00', end: '17:00' }],
      Tuesday: [{ start: '09:00', end: '17:00' }],
      Wednesday: [],
      Thursday: [{ start: '09:00', end: '17:00' }],
      Friday: [{ start: '09:00', end: '17:00' }],
    },
    outOfOffice: {
      start: null, // '2025-07-12'
      end: null, // '2025-07-15'
    }
  },
  {
    id: 14, name: 'Mishelle',
    email: 'mishelle@healingwithgrace.com',
    role: 'user',
    password: 'password123',
    availability: {
      Monday: [{ start: '09:00', end: '17:00' }],
      Tuesday: [{ start: '09:00', end: '17:00' }],
      Wednesday: [],
      Thursday: [{ start: '09:00', end: '17:00' }],
      Friday: [{ start: '09:00', end: '17:00' }],
    },
    outOfOffice: {
      start: null, // '2025-07-12'
      end: null, // '2025-07-15'
    }
  }
];

let therapists = [];

if (fs.existsSync(DATA_PATH)) {
  therapists = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
} else {
  therapists = therapistData.map(t => ({
    ...t,
    password: bcrypt.hashSync(t.password, saltRounds)
  }));
  fs.writeFileSync(DATA_PATH, JSON.stringify(therapists, null, 2));
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access token missing' });

  jwt.verify(token, secretKey, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
}

function saveTherapists() {
  fs.writeFileSync(DATA_PATH, JSON.stringify(therapists, null, 2));
}


// Routes
app.get('/events', authenticateToken, (req, res) => res.json(events));
app.get('/therapists', authenticateToken, (req, res) => {
  const publicTherapists = therapists.map(({ _password, ...rest }) => rest);
  res.json(publicTherapists);
});

let nextEventId = 1;

// Handle POST request to login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = therapists.find(t => t.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    secretKey,
    { expiresIn: '2h' }
  );

  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,  // include if needed
      role: user.role
    }
  });
});

// Handle POST request to add a new event
app.post('/events', (req, res) => {
  const newEvent = req.body;

  if (!newEvent.title || !newEvent.start || !newEvent.end) {
    return res.status(400).json({ message: 'Missing event fields' });
  }

  newEvent.id = nextEventId++;
  events.push(newEvent);
  res.status(201).json({ message: 'Event added', event: newEvent });
});

// Handle POST request to add a new therapist
app.post('/therapists', async (req, res) => {
  const newTherapist = req.body;

  if (!newTherapist.password) {
    return res.status(400).json({ message: 'Password required' });
  }

  newTherapist.id = therapists.length + 1;
  newTherapist.password = await bcrypt.hash(newTherapist.password, saltRounds);

  therapists.push(newTherapist);
  const { _password, ...publicData } = newTherapist;
  res.status(201).json({ message: 'Therapist added', therapist: publicData });
});

// Handle POST request to delete event
app.delete('/events/:id', (req, res) => {
  const eventId = parseInt(req.params.id)
  const index = events.findIndex(event => event.id === eventId)

  if (index === -1) {
    return res.status(404).json({ message: 'Event not found' })
  }

  events.splice(index, 1)
  res.json({ message: 'Event deleted' })
})

// Handle PATCH to update OOO
app.patch('/therapists/:id/out-of-office', (req, res) => {
  const therapistId = parseInt(req.params.id);
  const { start, end } = req.body;

  const therapist = therapists.find(t => t.id === therapistId);
  if (!therapist) {
    return res.status(404).json({ message: 'Therapist not found' });
  }

  therapist.outOfOffice = { start, end };
  saveTherapists(); // 💾 Persist changes

  res.json({ message: 'Out-of-office updated', outOfOffice: therapist.outOfOffice });
});

// Handle PATCH to request to edit a therapist
app.patch('/therapists/:id', async (req, res) => {
  const therapistId = parseInt(req.params.id);
  const updatedData = req.body;

  const index = therapists.findIndex(t => t.id === therapistId);
  if (index === -1) {
    return res.status(404).json({ error: 'Therapist not found' });
  }

  // If a new password is being set, hash it
  if (updatedData.password) {
    const saltRounds = 10;
    updatedData.password = await bcrypt.hash(updatedData.password, saltRounds);
  }

  therapists[index] = {
    ...therapists[index],
    ...updatedData
  };

  res.json({ message: 'Therapist updated successfully', therapist: therapists[index] });
});

// Handle POST request to delete a therapist
app.delete('/therapists/:id', (req, res) => {
  const therapistId = parseInt(req.params.id);
  const index = therapists.findIndex(t => t.id === therapistId);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Therapist not found' });
  }

  therapists.splice(index, 1);
  res.json({ message: 'Therapist deleted successfully' });
});


// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
