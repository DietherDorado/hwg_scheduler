const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const today = new Date();

const oneHourLater = new Date(today.getTime() + 60 * 60 * 1000); // 1 hour later

const events = [
  {
    title: "Initial Test Session",
    start: today.toISOString(),
    end: oneHourLater.toISOString(),
    extendedProps: {
      therapist: "Shannon Lee",
      description: "First sample event to test rendering.",
      room: "Blue Room",
      service: "Individual",
      frequency: "none"
    }
  }
];


const therapists = [
  {
    id: 1,
    name: 'Shannon Lee',
    availability: {
      Monday: [{ start: '10:00', end: '18:00' }],
      Tuesday: [{ start: '10:00', end: '18:00' }],
      Wednesday: [{ start: '10:00', end: '18:00' }],
      Thursday: [{ start: '10:00', end: '18:00' }],
      Friday: [{ start: '10:00', end: '18:00' }],
    }
  },


  { id: 2, name: 'Kana Nootenboon', availability: {
      Monday: [{ start: '13:00', end: '19:00' }],
      Tuesday: [{ start: '13:00', end: '19:00' }],
      Wednesday: [],
      Thursday: [{ start: '13:00', end: '19:00' }],
      Friday: [],
    }
  },
  { id: 3, name: 'Brian', availability: {
      Monday: [],
      Tuesday: [],
      Wednesday: [{ start: '10:00', end: '19:00' }],
      Thursday: [],
      Friday: [{ start: '10:00', end: '19:00' }],
      Saturday: [{ start: '10:00', end: '17:00' }],
      Sunday: [],
    }
  },
  { id: 4, name: 'Rachel', availability: {
      Monday: [{ start: '09:00', end: '17:00' }],
      Tuesday: [{ start: '09:00', end: '17:00' }],
      Wednesday: [],
      Thursday: [{ start: '09:00', end: '17:00' }],
      Friday: [{ start: '09:00', end: '17:00' }],
    }
  },
  { id: 5, name: 'Marija', availability: {
      Monday: [{ start: '09:00', end: '17:00' }],
      Tuesday: [{ start: '09:00', end: '17:00' }],
      Wednesday: [],
      Thursday: [{ start: '09:00', end: '17:00' }],
      Friday: [{ start: '09:00', end: '17:00' }],
    }
  },
  { id: 6, name: 'Suzy', availability: {
      Monday: [{ start: '09:00', end: '17:00' }],
      Tuesday: [{ start: '09:00', end: '17:00' }],
      Wednesday: [],
      Thursday: [{ start: '09:00', end: '17:00' }],
      Friday: [{ start: '09:00', end: '17:00' }],
    }
  },
  { id: 7, name: 'Renata', availability: {
      Monday: [{ start: '09:00', end: '17:00' }],
      Tuesday: [{ start: '09:00', end: '17:00' }],
      Wednesday: [],
      Thursday: [{ start: '09:00', end: '17:00' }],
      Friday: [{ start: '09:00', end: '17:00' }],
    }
  },
  { id: 8, name: 'Arisa', availability: {
      Monday: [{ start: '09:00', end: '17:00' }],
      Tuesday: [{ start: '09:00', end: '17:00' }],
      Wednesday: [],
      Thursday: [{ start: '09:00', end: '17:00' }],
      Friday: [{ start: '09:00', end: '17:00' }],
    }
  },
  { id: 9, name: 'Jericho', availability: {
      Monday: [{ start: '09:00', end: '17:00' }],
      Tuesday: [{ start: '09:00', end: '17:00' }],
      Wednesday: [],
      Thursday: [{ start: '09:00', end: '17:00' }],
      Friday: [{ start: '09:00', end: '17:00' }],
    }
  },
  { id: 10, name: 'Fay (Ranniya)', availability: {
      Monday: [{ start: '09:00', end: '17:00' }],
      Tuesday: [{ start: '09:00', end: '17:00' }],
      Wednesday: [],
      Thursday: [{ start: '09:00', end: '17:00' }],
      Friday: [{ start: '09:00', end: '17:00' }],
    }
  },
  { id: 11, name: 'Dr. Leon', availability: {
      Monday: [{ start: '09:00', end: '17:00' }],
      Tuesday: [{ start: '09:00', end: '17:00' }],
      Wednesday: [],
      Thursday: [{ start: '09:00', end: '17:00' }],
      Friday: [{ start: '09:00', end: '17:00' }],
    }
  },
  { id: 12, name: 'Stephanie', availability: {
      Monday: [{ start: '09:00', end: '17:00' }],
      Tuesday: [{ start: '09:00', end: '17:00' }],
      Wednesday: [],
      Thursday: [{ start: '09:00', end: '17:00' }],
      Friday: [{ start: '09:00', end: '17:00' }],
    }
  },
  { id: 13, name: 'Sophia', availability: {
      Monday: [{ start: '09:00', end: '17:00' }],
      Tuesday: [{ start: '09:00', end: '17:00' }],
      Wednesday: [],
      Thursday: [{ start: '09:00', end: '17:00' }],
      Friday: [{ start: '09:00', end: '17:00' }],
    }
  },
  { id: 14, name: 'Mishelle', availability: {
      Monday: [{ start: '09:00', end: '17:00' }],
      Tuesday: [{ start: '09:00', end: '17:00' }],
      Wednesday: [],
      Thursday: [{ start: '09:00', end: '17:00' }],
      Friday: [{ start: '09:00', end: '17:00' }],
    }
  }
];

const clients = [
  { id: 1, name: 'Jane Doe' },
  { id: 2, name: 'John Smith' }
];

// Routes
app.get('/events', (req, res) => res.json(events));
app.get('/therapists', (req, res) => res.json(therapists));
app.get('/clients', (req, res) => res.json(clients));

// Handle POST request to add a new event
app.post('/events', (req, res) => {
  const newEvent = req.body;

  if (!newEvent.title || !newEvent.start || !newEvent.end) {
    return res.status(400).json({ message: 'Missing event fields' });
  }

  events.push(newEvent);
  res.status(201).json({ message: 'Event added', event: newEvent });
});


// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
