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


const therapists = [
  {
    id: 1,
    name: 'Shannon Lee',
    email: 'shannon.l@healingwithgrace.com',
    role: 'admin',
    availability: {
      Monday: [{ start: '10:00', end: '18:00' }],
      Tuesday: [{ start: '10:00', end: '18:00' }],
      Wednesday: [{ start: '10:00', end: '18:00' }],
      Thursday: [{ start: '10:00', end: '18:00' }],
      Friday: [{ start: '10:00', end: '18:00' }],
    }
  },

  {
    id: 2, name: 'Kana Nootenboon',
    email: 'kana.n@healingwithgrace.com',
    role: 'admin',
    availability: {
      Monday: [{ start: '13:00', end: '19:00' }],
      Tuesday: [{ start: '13:00', end: '19:00' }],
      Wednesday: [],
      Thursday: [{ start: '13:00', end: '19:00' }],
      Friday: [],
    }
  },

  {
    id: 3, name: 'Brian',
    email: 'brian@healingwithgrace.com',
    role: 'user',
    availability: {
      Monday: [],
      Tuesday: [],
      Wednesday: [{ start: '10:00', end: '19:00' }],
      Thursday: [],
      Friday: [{ start: '10:00', end: '19:00' }],
      Saturday: [{ start: '10:00', end: '17:00' }],
      Sunday: [],
    }
  },

  {
    id: 4, name: 'Rachel',
    email: 'rachel@healingwithgrace.com',
    role: 'user',
    availability: {
      Monday: [{ start: '09:00', end: '17:00' }],
      Tuesday: [{ start: '09:00', end: '17:00' }],
      Wednesday: [],
      Thursday: [{ start: '09:00', end: '17:00' }],
      Friday: [{ start: '09:00', end: '17:00' }],
    }
  },
  {
    id: 5, name: 'Marija',
    email: 'marija@healingwithgrace.com',
    role: 'user',
    availability: {
      Monday: [{ start: '09:00', end: '17:00' }],
      Tuesday: [{ start: '09:00', end: '17:00' }],
      Wednesday: [],
      Thursday: [{ start: '09:00', end: '17:00' }],
      Friday: [{ start: '09:00', end: '17:00' }],
    }
  },
  {
    id: 6, name: 'Suzy',
    email: 'suzy@healingwithgrace.com',
    role: 'user',
    availability: {
      Monday: [{ start: '09:00', end: '17:00' }],
      Tuesday: [{ start: '09:00', end: '17:00' }],
      Wednesday: [],
      Thursday: [{ start: '09:00', end: '17:00' }],
      Friday: [{ start: '09:00', end: '17:00' }],
    }
  },
  {
    id: 7, name: 'Renata',
    email: 'renata@healingwithgrace.com',
    role: 'user',
    availability: {
      Monday: [{ start: '09:00', end: '17:00' }],
      Tuesday: [{ start: '09:00', end: '17:00' }],
      Wednesday: [],
      Thursday: [{ start: '09:00', end: '17:00' }],
      Friday: [{ start: '09:00', end: '17:00' }],
    }
  },
  {
    id: 8, name: 'Arisa',
    email: 'arisa@healingwithgrace.com',
    role: 'user',
    availability: {
      Monday: [{ start: '09:00', end: '17:00' }],
      Tuesday: [{ start: '09:00', end: '17:00' }],
      Wednesday: [],
      Thursday: [{ start: '09:00', end: '17:00' }],
      Friday: [{ start: '09:00', end: '17:00' }],
    }
  },
  {
    id: 9, name: 'Jericho',
    email: 'jericho@healingwithgrace.com',
    role: 'user',
    availability: {
      Monday: [{ start: '09:00', end: '17:00' }],
      Tuesday: [{ start: '09:00', end: '17:00' }],
      Wednesday: [],
      Thursday: [{ start: '09:00', end: '17:00' }],
      Friday: [{ start: '09:00', end: '17:00' }],
    }
  },
  {
    id: 10, name: 'Fay (Ranniya)',
    email: 'fay@healingwithgrace.com',
    role: 'user',
    availability: {
      Monday: [{ start: '09:00', end: '17:00' }],
      Tuesday: [{ start: '09:00', end: '17:00' }],
      Wednesday: [],
      Thursday: [{ start: '09:00', end: '17:00' }],
      Friday: [{ start: '09:00', end: '17:00' }],
    }
  },
  {
    id: 11, name: 'Dr. Leon',
    email: 'leon@healingwithgrace.com',
    role: 'user',
    availability: {
      Monday: [{ start: '09:00', end: '17:00' }],
      Tuesday: [{ start: '09:00', end: '17:00' }],
      Wednesday: [],
      Thursday: [{ start: '09:00', end: '17:00' }],
      Friday: [{ start: '09:00', end: '17:00' }],
    }
  },
  {
    id: 12, name: 'Stephanie',
    email: 'stephanie@healingwithgrace.com',
    role: 'user',
    availability: {
      Monday: [{ start: '09:00', end: '17:00' }],
      Tuesday: [{ start: '09:00', end: '17:00' }],
      Wednesday: [],
      Thursday: [{ start: '09:00', end: '17:00' }],
      Friday: [{ start: '09:00', end: '17:00' }],
    }
  },
  {
    id: 13, name: 'Sophia',
    email: 'sophia@healingwithgrace.com',
    role: 'user',
    availability: {
      Monday: [{ start: '09:00', end: '17:00' }],
      Tuesday: [{ start: '09:00', end: '17:00' }],
      Wednesday: [],
      Thursday: [{ start: '09:00', end: '17:00' }],
      Friday: [{ start: '09:00', end: '17:00' }],
    }
  },
  {
    id: 14, name: 'Mishelle',
    email: 'mishelle@healingwithgrace.com',
    role: 'user',
    availability: {
      Monday: [{ start: '09:00', end: '17:00' }],
      Tuesday: [{ start: '09:00', end: '17:00' }],
      Wednesday: [],
      Thursday: [{ start: '09:00', end: '17:00' }],
      Friday: [{ start: '09:00', end: '17:00' }],
    }
  }
];

// Routes
app.get('/events', (req, res) => res.json(events));
app.get('/therapists', (req, res) => res.json(therapists));
app.get('/clients', (req, res) => res.json(clients));

let nextEventId = 1;

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
app.post('/therapists', (req, res) => {
  const newTherapist = req.body;
  newTherapist.id = therapists.length + 1;
  therapists.push(newTherapist);
  res.status(201).json(newTherapist);
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

// Handle PATCH to request to edit a therapist
app.patch('/therapists/:id', (req, res) => {
  const therapistId = parseInt(req.params.id);
  const updatedData = req.body;

  const index = therapists.findIndex(t => t.id === therapistId);
  if (index === -1) {
    return res.status(404).json({ error: 'Therapist not found' });
  }

  // Merge the new data into the existing therapist object
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
