# HWG Client Scheduler

The **HWG Client Scheduler** is a custom full-stack web application developed to streamline appointment scheduling for therapy and wellness clinics. Originally started as a personal project to better understand full-stack development, it has since evolved into a highly functional tool used by **Healing with Grace – Counseling and Ketamine Center**.

---

## 🧠 Purpose

The scheduler was built with real-world workflows in mind, reflecting how front desk staff, clinicians, and administrators coordinate daily scheduling tasks in a busy therapy office. It simplifies:

- Managing staff availability
- Assigning sessions to therapists and rooms
- Booking and modifying appointments
- Visually tracking no-shows and cancellations
- Filtering by therapist, service, or room

> This project also served as a full-stack learning exercise, helping me master state management, calendar logic, API integration, authentication, and deployment.

---

## ✨ Key Features

- ✅ **Drag-and-drop scheduling interface**
- 📅 **Full calendar view** by therapist, room, or all sessions
- 🧑‍⚕️ **Therapist & room filtering**
- 🧠 **Service types** (Intake, Individual, Couples, Family, KAP Dosing, etc.)
- 🎨 **Color-coded rooms** for quick visualization
- ❌ **Mark sessions as Cancelled or No-show** (with emojis & visual strikethrough)
- 🔁 **Recurring appointments** with frequency options
- 👤 **Admin & user roles** with access control
- 🧾 **Session notes and descriptions**
- 🔐 **Login system with role-based routing**
- 🧑‍💼 **Therapist management modal** (Add/edit therapists with availability & roles)

---

## 🛠 Tech Stack

### Frontend
- **Vue 3** – Primary frontend framework
- **Vite** – Lightning-fast build tool
- **FullCalendar / React-Big-Calendar** – Powerful calendar components
- **Bootstrap 5 + Bootswatch** – Clean UI styling and themes
- **Axios** – For RESTful API communication
- **Vue Router** – Client-side routing
- **Custom modals & form components** – For intuitive UX

### Backend (depends on current stage)
- **Flask** – Current backend API for handling routes, scheduling logic, and DB queries
- **Node.js + Express** – Previously used for backend prototyping
- **PHP + XAMPP** – Used during early development stages
- **MySQL / SQLite** – Flexible support for relational databases

---

## 🔒 Authentication & Roles

The app supports:
- **Admin accounts**: Can manage therapists, view all sessions, and access admin tools
- **User accounts**: Can view and manage their schedule and assigned clients

---

## 📦 Project Setup

```bash
# Clone the repo
git clone https://github.com/your-username/hwg-client-scheduler.git
cd hwg-client-scheduler

# Install frontend dependencies
npm install

# Run the app locally
npm run dev
```

### Backend (Flask)
```bash
# Create virtual environment and activate it
python -m venv venv
source venv/bin/activate  # or .\venv\Scripts\activate on Windows

# Install backend dependencies
pip install -r requirements.txt

# Run Flask server
flask run
```

---

## 🚀 Deployment

- **Frontend** is deployed via [Netlify](https://www.netlify.com/)
- **Backend** is hosted using [Render](https://render.com/) for API routes and database connectivity
- Uses `.env` files to securely manage API keys and environment-specific configs

---

## 💡 Learning Goals

This project helped me explore and solidify:

- Connecting frontend to backend via RESTful APIs
- Managing and visualizing complex state and data
- Implementing flexible calendar logic and drag-and-drop interactions
- Full CRUD operations with role-based permissions
- Working with multiple frameworks (Vue & React) to compare best practices

---

## 🏁 Future Improvements

- 📲 Mobile-friendly views & responsive calendar
- 🔔 Email/SMS reminders (via Twilio or SendGrid)
- 📊 Admin dashboard analytics
- 🗃️ Therapist profile pages
- 🔄 Calendar sync with Google Calendar
- 🌐 Multilingual support for accessibility

---

## 🙏 Acknowledgements

Thanks to the team at **Healing with Grace – Counseling and Ketamine Center** for testing and providing feedback throughout development. This scheduler is actively used by staff to streamline care coordination and room assignments.
