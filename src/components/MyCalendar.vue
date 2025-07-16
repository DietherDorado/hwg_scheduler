<script>
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import BootstrapTheme from '@fullcalendar/bootstrap5'
import { useRouter } from 'vue-router'
import { formatDate } from '@fullcalendar/core/index.js'
import { reactive, watch } from 'vue'

const authFetch = async (urlencoded, options = {}) => {
    const token = localStorage.getItem('token')
    const headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
    return fetch(urlencoded, { ...options, headers })
}

export default {
    components: {
        FullCalendar
    },
    data() {
        return {
            user: {
                outOfOffice: {
                    start: '',
                    end: ''
                }
            },
            isAdmin: false,
            showModal: false,
            showEventModal: false,
            showProfileDropdown: false,
            selectedEvent: null,
            selectedTherapist: 'All',
            therapistMap: {},
            unavailableBackgrounds: [],
            form: {
                client: '',
                therapist: '',
                service: '',
                room: '',
                title: '',
                start: '',
                end: '',
                frequency: 'none', // default to no repeat
                description: ''
            },
            therapists: [],
            showTherapistDropdown: false,
            showAddTherapistModal: false,
            showEditTherapistModal: false,
            showDeleteTherapistModal: false,
            showChangePasswordModal: false,
            showOutOfOfficeModal: false,
            showChangeAvailabilityModal: false,
            selectedTherapistForEdit: null,
            newPassword: '',
            confirmPassword: '',
            newTherapist: {
                name: '',
                email: '',
                password: '',
                role: 'user',
                availability: {
                    Sunday: [],
                    Monday: [],
                    Tuesday: [],
                    Wednesday: [],
                    Thursday: [],
                    Friday: [],
                    Saturday: []
                }
            },
            services: [
                'Intake', 'Individual', 'Couples', 'Family',
                'Teletherapy', 'KAP Integration', 'KAP Dosing',
                'KAP Prep'
            ],
            rooms: {
                "Kana’s Room": "#8c52ff",
                "Blue Room": "#386bff",
                "Family Room": "#ff66c4",
                "Neuro Room": "#ffde59",
                "Room 1": "#7ed597",
                "Room 2": "#ffbd59",
                "Room 3": "#004aad",
                "Telehealth": "#708b4e"
            },
            allEvents: [],
            calendarOptions: {
                height: 'auto',
                themeSystem: 'bootstrap5',
                plugins: [dayGridPlugin, timeGridPlugin, listPlugin, BootstrapTheme],
                initialView: 'timeGridWeek',
                views: {
                    timeGridWeek: {
                        slotMinTime: '07:00:00',
                        slotMaxTime: '21:00:00',
                        slotDuration: '00:30:00',
                        selectMinDistance: 1,
                        selectLongPressDelay: 0,
                        eventLongPressDelay: 0,
                    }
                },
                weekends: true,
                nowIndicator: true,
                events: [], // will be filled with data later
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
                },
                eventContent: this.renderEventContent,
                selectable: true,
                selectMirror: true,
                selectMinDistance: 1,
                longPressDelay: 0,
                selectLongPressDelay: 0,
                eventLongPressDelay: 0,
                select: null,
                selectAllow: null,
                eventClick: null,
                eventSources: [], // will be filled with data later
            }
        }
    },
    mounted() {
        const router = useRouter();
        const storedUser = JSON.parse(localStorage.getItem('user'));

        if (!storedUser) {
            router.push('/');
            return;
        }

        this.user = storedUser;
        this.isAdmin = this.user.role === 'admin';
        if (!this.user.outOfOffice) {
            this.user.outOfOffice = { start: '', end: '' };
        }

        this.loadData();

        this.calendarOptions.select = this.handleSlotSelect;
        this.calendarOptions.selectAllow = this.selectAllow;
        this.calendarOptions.eventClick = this.handleEventClick;

        this.$nextTick(() => {
            const calendarApi = this.$refs.fullCalendar?.getApi?.();
            if (calendarApi) {
                calendarApi.setOption('select', this.handleSlotSelect);
                calendarApi.setOption('selectAllow', this.selectAllow);
                calendarApi.setOption('eventClick', this.handleEventClick);
            }
        });

        document.addEventListener('click', this.handleClickOutsideDropdown);
        document.addEventListener('click', this.handleClickOutsideProfileDropdown);

        if (!this.user.availability) {
            this.user.availability = {
                Monday: [], Tuesday: [], Wednesday: [],
                Thursday: [], Friday: [], Saturday: [],
                Sunday: []
            }
        }

        this.user = storedUser;
    },
    beforeUnmount() {
        document.removeEventListener('click', this.handleClickOutsideDropdown);
        document.removeEventListener('click', this.handleClickOutsideProfileDropdown);
    },
    methods: {
        handleClickOutsideDropdown(e) {
            const dropdown = this.$refs.therapistDropdownRef;
            if (dropdown && !dropdown.contains(e.target)) {
                this.showTherapistDropdown = false;
            }
        },
        handleClickOutsideProfileDropdown(e) {
            const dropdown = this.$refs.profileDropdown;
            const image = this.$refs.profileImage;

            if (dropdown && image && !dropdown.contains(e.target) && !image.contains(e.target)) {
                this.showProfileDropdown = false;
            }
        },
        handleEventClick(info) {
            // Prevent clicking on background events
            if (info.event.classNames.includes('unavailable-slot')) {
                info.jsEvent.preventDefault();
                return;
            }
            this.selectedEvent = info.event;
            this.showEventModal = true;
        },
        selectAllow(selectInfo) {
            const allowed = this.isWithinTherapistAvailability(selectInfo.start, selectInfo.end);
            console.log("Clicked slot from:", selectInfo.start, "to", selectInfo.end, "| Allowed?", allowed);
            return allowed;
        },
        closeModal() {
            this.showModal = false
            this.form = {
                client: '',
                therapist: '',
                service: '',
                room: '',
                title: '',
                start: '',
                end: '',
                frequency: 'none',
                description: ''
            }
        },
        handleSlotSelect(selectionInfo) {
            const start = new Date(selectionInfo.start)
            const end = new Date(start.getTime() + 60 * 60 * 1000) // Default to 1 hour duration

            this.form.start = start.toISOString().slice(0, 16) // Format to datetime-local
            this.form.end = end.toISOString().slice(0, 16) // Format to datetime-local

            if (this.selectedTherapist !== 'All') {
                this.form.therapist = this.selectedTherapist;
            }

            this.showModal = true

            const calendarApi = this.$refs.fullCalendar?.getApi?.();
            calendarApi?.unselect(); // Clear any previous selection
        },
        submitEvent() {
            const roomColor = this.rooms[this.form.room] || '#000000' // Default color if room not found
            const { frequency } = this.form;

            const startDate = new Date(this.form.start);
            const endDate = new Date(this.form.end);

            const repeatCount = frequency === 'none' ? 1 : 5; // Default to 5 occurrences if repeating

            const intervalMs = {
                daily: 86400000,
                weekly: 604800000,
                monthly: 2592000000
            };

            const events = [];

            for (let i = 0; i < repeatCount; i++) {
                let currentStart = new Date(startDate);
                let currentEnd = new Date(endDate);

                if (frequency === 'monthly') {
                    currentStart.setMonth(currentStart.getMonth() + i);
                    currentEnd.setMonth(currentEnd.getMonth() + i);
                } else if (frequency !== 'none') {
                    const offset = i * intervalMs[frequency];
                    currentStart = new Date(currentStart.getTime() + offset);
                    currentEnd = new Date(currentEnd.getTime() + offset);
                }

                events.push({
                title: this.form.title,
                start: currentStart.toISOString(),
                end: currentEnd.toISOString(),
                backgroundColor: roomColor,
                extendedProps: {
                    therapist: this.form.therapist,
                    client: this.form.client,
                    description: this.form.description,
                    room: this.form.room,
                    service: this.form.service,
                    frequency: this.form.frequency
                }   
            });
        }


            // Submit each event to backend
            Promise.all(events.map(event =>
                authFetch('https://hwg-backend.onrender.com/events', {
                    method: 'POST',
                    body: JSON.stringify({
                        title: event.title,
                        timestart: event.start,
                        timeend: event.end,
                        therapist: event.extendedProps?.therapist, // ✅ fix
                        client: event.extendedProps?.client,
                        service: event.extendedProps?.service,
                        room: event.extendedProps?.room,
                        description: event.extendedProps?.description,
                        frequency: event.extendedProps?.frequency,
                        backgroundColor: event.backgroundColor,
                    })
                }).then(res => res.json())
            ))
            .then(() => {
                return authFetch('https://hwg-backend.onrender.com/events')
                    .then(res => res.json())
                    .then(data => {
                        this.allEvents = data.map(event => ({
                            ...event,
                            start: new Date(event.timestart),
                            end: new Date(event.timeend),
                            extendedProps: {
                                ...event,
                                therapist: event.therapist_name
                            }
                        }))
                        this.$refs.fullCalendar?.getApi?.().refetchEvents();
                    })
            })
            .then(() => this.closeModal())
                .catch(err => {
                    console.error('Error submitting event:', err);
                    alert('Failed to schedule session. Please try again.');
            })
        },
        renderEventContent(arg) {
            const event = arg.event;
            const viewType = arg?.view?.type || '';

            // Skip rendering background events completely
            if (event.display === 'background') return null;

            const start = new Date(event.start);
            const end = new Date(event.end);
            const startStr = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const endStr = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const { therapist, room } = event.extendedProps || {};

            // Condensed for TimeGrid views
            if (viewType.includes('timeGrid')) {
                const wrapper = document.createElement('div');
                wrapper.style.fontSize = '11px';
                wrapper.style.lineHeight = '1.1';
                wrapper.style.color = 'white';
                wrapper.innerHTML = `
                <strong>‣ ${event.title}</strong><br/>
                <small>👩‍⚕️ ${therapist || ''}</small><br/>
                <small>🕒 ${startStr} – ${endStr}</small>
                `;
                return { domNodes: [wrapper] };
            }

            // Detailed for month/list views
            return {
                html: `
                <div style="font-size: 13px;">
                    <strong>‣ ${event.title}</strong><br/>
                    🕒 ${startStr} – ${endStr}<br/>
                    🛋 ${room || ''}<br/>
                    👩‍⚕️ ${therapist || ''}
                </div>
                `
            };
        },
        getUnavailableBackgrounds(fetchInfo, successCallback, failureCallback) {
            if (this.selectedTherapist === 'All') return successCallback([]);

            const therapist = this.therapistMap[this.selectedTherapist];
            if (!therapist || !therapist.availability) return successCallback([]);

            const startDate = new Date(fetchInfo.start);
            const endDate = new Date(fetchInfo.end);
            const unavailableEvents = [];

            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

            for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
                const dayName = dayNames[d.getDay()];
                const availableBlocks = therapist.availability[dayName] || [];

                const fullDayStart = new Date(d);
                fullDayStart.setHours(7, 0, 0); // assuming your calendar starts at 7:00

                const fullDayEnd = new Date(d);
                fullDayEnd.setHours(21, 0, 0); // assuming your calendar ends at 21:00

                let lastEnd = new Date(fullDayStart);

                for (const block of availableBlocks) {
                const blockStart = new Date(d);
                const [startHour, startMin] = block.start.split(':');
                blockStart.setHours(parseInt(startHour), parseInt(startMin));

                if (blockStart > lastEnd) {
                    unavailableEvents.push({
                        start: lastEnd.toISOString(),
                        end: blockStart.toISOString(),
                        display: 'background',
                        classNames: ['unavailable-slot'],
                        groupId: 'unavailable',
                        editable: false
                    });
                }

                const blockEnd = new Date(d);
                const [endHour, endMin] = block.end.split(':');
                blockEnd.setHours(parseInt(endHour), parseInt(endMin));
                lastEnd = new Date(blockEnd);
                }

                if (lastEnd < fullDayEnd) {
                unavailableEvents.push({
                    start: lastEnd.toISOString(),
                    end: fullDayEnd.toISOString(),
                    display: 'background',
                    classNames: ['unavailable-slot'],
                    groupId: 'unavailable',
                    editable: false
                });
                }
            }

            successCallback(unavailableEvents);
        },
        isWithinTherapistAvailability(start, end) {
            const therapist = this.therapistMap[this.selectedTherapist];
            if (!therapist || !therapist.availability) return false;

            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayName = dayNames[start.getDay()];
            const availableBlocks = therapist.availability[dayName] || [];

            for (let block of availableBlocks) {
                const [blockStartHour, blockStartMin] = block.start.split(':').map(Number);
                const [blockEndHour, blockEndMin] = block.end.split(':').map(Number);

                const blockStart = new Date(start);
                blockStart.setHours(blockStartHour, blockStartMin, 0, 0);

                const blockEnd = new Date(start);
                blockEnd.setHours(blockEndHour, blockEndMin, 0, 0);

                if (start >= blockStart && end <= blockEnd) {
                    return true;
                }
            }

            return false;
        },
        markEventStatus(statusType) {
            if (!this.selectedEvent) return;

            const emoji = statusType === 'cancelled' ? '❌' : '❓';
            const statusText = statusType === 'cancelled' ? 'Cancelled' : 'No-Show';

            const originalTitle = this.selectedEvent.title;

            if (originalTitle.includes(emoji) || originalTitle.includes('❌') || originalTitle.includes('❓')) {
                alert(`This session is already marked as ${statusText}.`);
                return;
            }

            const newTitle = `${emoji} ${originalTitle}`;
            this.selectedEvent.setProp('title', newTitle);

            authFetch(`https://hwg-backend.onrender.com/events/${this.selectedEvent.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title: newTitle})
            }).then(() => {
                this.showEventModal = false;
            }).catch(err => {
                console.error("Failed to update event status:", err);
                alert(`Error marking session as ${statusText}. Please try again.`);
            })
        },
        removeEventStatus() {
            if (!this.selectedEvent) return;

            const cleanTitle = this.selectedEvent.title
                .replace(/^❌\s*/, '')
                .replace(/^❓\s*/, '');

            if (cleanTitle === this.selectedEvent.title) {
                alert("This session is not marked as cancelled or no-show.");
                return;
            }

            this.selectedEvent.setProp('title', cleanTitle);

            authFetch(`https://hwg-backend.onrender.com/events/${this.selectedEvent.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title: cleanTitle })
            }).then(() => {
                this.showEventModal = false;
            }).catch(err => {
                console.error("Failed to clear event status:", err);
                alert("Error clearing session status. Please try again.");
            });
        },
        logout() {
            localStorage.removeItem('user')
            this.$router.push('/')
        },
        deleteEvent() {
            if (!this.selectedEvent) return;

            const confirmed = confirm("Are you sure you want to delete this session? This action cannot be undone.");
            if (!confirmed) return;

            const eventToDelete = this.selectedEvent;

            // Immediate UI feedback
            eventToDelete.remove();
            this.showEventModal = false;

            // Continue with API request in background
            authFetch(`https://hwg-backend.onrender.com/events/${eventToDelete.id}`, {
                method: 'DELETE'
            }).catch(err => {
                console.error('Failed to delete event:', err);
                alert('Error deleting session. Please refresh the page.');
                // Optionally re-fetch events here if needed
            });
        },
        submitNewTherapist() {
            authFetch(`https://hwg-backend.onrender.com/therapists`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.newTherapist)
            })
            .then(res => res.json())
                .then(() => {
                    this.showAddTherapistModal = false;
                    alert('New therapist added successfully!');
                return authFetch('https://hwg-backend.onrender.com/therapists');
            })
            .then(res => res.json())
            .then(data => {
                this.therapists = data.sort((a, b) => a.name.localeCompare(b.name));
                this.therapistMap = {};
                data.forEach(t => { this.therapistMap[t.name] = t });
            })
            .catch(err => {
                console.error('Failed to add new therapist:', err);
                alert('Error adding new therapist. Please try again.');
            })
        },
        resetNewTherapistForm() {
            this.newTherapist = {
                name: '',
                email: '',
                role: 'user',
                availability: {
                    Sunday: [],
                    Monday: [],
                    Tuesday: [],
                    Wednesday: [],
                    Thursday: [],
                    Friday: [],
                    Saturday: []
                }
            };
        },
        toggleTherapistDropdown() {
            this.showTherapistDropdown = !this.showTherapistDropdown;
        },
        openAddTherapistModal() {
            this.resetNewTherapistForm();
            this.showAddTherapistModal = true;
            this.showTherapistDropdown = false;
        },
        openEditTherapistModal() {
            this.showEditTherapistModal = true;
            this.showTherapistDropdown = false;
        },
        openDeleteTherapistModal() {
            this.showDeleteTherapistModal = true;
            this.showTherapistDropdown = false;
        },
        saveEditedTherapist() {
            authFetch(`https://hwg-backend.onrender.com/therapists/${this.selectedTherapistForEdit.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.selectedTherapistForEdit)
                })
                .then(() => {
                    alert('Therapist updated successfully!');
                    this.showEditTherapistModal = false;
                    return authFetch('https://hwg-backend.onrender.com/therapists');
                })
                .then(res => res.json())
                .then(data => {
                    this.therapists = data.sort((a, b) => a.name.localeCompare(b.name));
                    this.therapistMap = {};
                    data.forEach(t => {this.therapistMap[t.name] = t });
                })
        },
        deleteTherapist(id) {
            const confirmDelete = confirm("Are you sure you want to delete this therapist? This action cannot be undone.");
            if (!confirmDelete) return;

            authFetch(`https://hwg-backend.onrender.com/therapists/${id}`, {
                method: 'DELETE'
            })
            .then(() => {
                alert('Therapist deleted successfully!');
                this.showDeleteTherapistModal = false;
                return authFetch('https://hwg-backend.onrender.com/therapists');
            })
            .then(res => res.json())
            .then(data => {
                this.therapists = data.sort((a, b) => a.name.localeCompare(b.name));
                    this.therapistMap = {};
                    data.forEach(t => { this.therapistMap[t.name] = t });
                })
        },
        getDayTime(day, type) {
            const dayBlocks = this.selectedTherapistForEdit.availability[day]
            if (!dayBlocks || dayBlocks.length === 0) return '';
            return dayBlocks[0][type] || '';
        },
        updateAvailability(day, type, value) {
            const avail = this.selectedTherapistForEdit.availability;

            if (!avail[day] || avail[day].length === 0) {
                avail[day] = [{ start: '', end: '' }];
            }

            avail[day][0][type] = value;
        },
        clearAvailability(day) {
            this.selectedTherapistForEdit.availability[day] = [];
        },
        toggleProfileDropdown() {
            this.showProfileDropdown = !this.showProfileDropdown;
        },
        handleChangePassword() {
            this.showChangePasswordModal = true;
            this.showProfileDropdown = false;
        },
        handleChangeAvailability() {
            if (!this.user.availability) {
                this.user.availability = {
                Monday: [], Tuesday: [], Wednesday: [],
                Thursday: [], Friday: [], Saturday: [], Sunday: []
                };
            }

            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            for (const day of days) {
                const blocks = this.user.availability[day];
                
                if (!Array.isArray(blocks) || blocks.length === 0) {
                // Default to 9–17 if nothing set
                this.user.availability[day] = [{ start: '09:00', end: '17:00' }];
                } else if (!blocks[0].start || !blocks[0].end) {
                // Fill in missing values if partial
                this.user.availability[day][0] = {
                    start: blocks[0].start || '09:00',
                    end: blocks[0].end || '17:00'
                };
                }
            }

            this.showChangeAvailabilityModal = true;
            this.showProfileDropdown = false;
        },
        async submitPasswordChange() {
            if (this.newPassword !== this.confirmPassword) {
                alert("Passwords do not match.");
                return;
            }

            try {
                const res = await authFetch(`https://hwg-backend.onrender.com/therapists/${this.user.id}/password`, {
                    method: 'PATCH',
                    body: JSON.stringify({ newPassword: this.newPassword })
                });
                if (!res.ok) throw new Error('Failed to update password');
                alert('Password updated successfully!');
                this.newPassword = '';
                this.confirmPassword = '';
                this.showChangePasswordModal = false;
            } catch (err) {
                console.error('Password update error:', err);
                alert('Error updating password.');
            }
        },
        async submitAvailabilityChange() {
            try {
                const res = await authFetch(`https://hwg-backend.onrender.com/therapists/${this.user.id}/availability`, {
                method: 'PATCH',
                body: JSON.stringify({ availability: this.user.availability })
                });
                if (!res.ok) throw new Error('Failed to update availability');

                alert('Availability updated successfully!');
                this.showChangeAvailabilityModal = false;

                this.therapistMap[this.user.name] = { ...this.user };

                this.selectedTherapist = this.user.name;
                const calendarApi = this.$refs.fullCalendar?.getApi?.();
                calendarApi?.refetchEvents();
            } catch (err) {
                console.error('Availability update error:', err);
                alert('Error updating availability.');
            }
        },
        async submitOutOfOffice() {
            try {
                const res = await authFetch(`https://hwg-backend.onrender.com/therapists/${this.user.id}/out-of-office`, {
                    method: 'PATCH',
                    body: JSON.stringify({
                        start: this.user.outOfOffice.start,
                        end: this.user.outOfOffice.end
                    })
                })

                const data = await res.json();
                this.user.outOfOffice = data.outOfOffice;
                localStorage.setItem('user', JSON.stringify(this.user));

                this.showOutOfOfficeModal = false;
                alert('Out-of-office updated.');

                await this.loadData();

            } catch (err) {
                console.error('Error updating out-of-office', err);
                alert('Failed to update.');
            }
        },
        async loadData() {
            try {
                // Get Therapist First
                const therapistRes = await authFetch('https://hwg-backend.onrender.com/therapists');
                const therapistData = await therapistRes.json();

                this.therapists = therapistData.sort((a, b) => a.name.localeCompare(b.name));
                this.therapistMap = {};
                therapistData.forEach(t => {
                    this.therapistMap[t.name] = t;
                });

                // Load Events
                const eventRes = await authFetch('https://hwg-backend.onrender.com/events');
                const eventData = await eventRes.json();

                this.allEvents = eventData.map(event => ({
                    ...event,
                    start: new Date(event.timestart),
                    end: new Date(event.timeend),
                    backgroundColor: event.backgroundColor,
                    extendedProps: {
                        ...event,
                        therapist: event.therapist_name
                    }
                }));
                
                // Update Calendar's eventSources
                this.calendarOptions.eventSources = [
                    {
                        events: this.getUnavailableBackgrounds,
                        color: '#a0a0a0',
                        textColor: 'transparent',
                        display: 'background',
                        editable: false,
                        overlap: false,
                        groupId: 'unavailable'
                    },
                    {
                        events: (fetchInfo, successCallback) => {
                            successCallback(this.filteredEvents);
                        }
                    }
                ];

                if (this.user && this.therapistMap[this.user.name]) {
                    this.user = this.therapistMap[this.user.name];
                }

                this.$refs.fullCalendar?.getApi?.().refetchEvents();
            } catch (err) {
                console.error('Error loading data:', err);
                alert('Failed to load calendar data.');
            }
        },
        clearUserAvailability(day) {
            this.user.availability[day] = [];
        },
        updateUserAvailability(day, type, value) {
            if (!this.user.availability[day] || this.user.availability[day].length === 0) {
                this.user.availability[day] = [{ start: '', end: '' }];
            }

            this.user.availability[day][0][type] = value;
        },
        formatDate(dateStr) {
            const options = { year: 'numeric', month: 'short', day: 'numeric' };
            return new Date(dateStr).toLocaleDateString(undefined, options);
        },
        getReturnDate(end) {
            const date = new Date(end);
            date.setDate(date.getDate() + 1);
            return date.toISOString().split('T')[0];
        },
        updateEndTime(start, service) {
            if (!start) return;

            const startDate = new Date(start);
            const duration = service === 'KAP Dosing' ? 180 : 50;
            const endDate = new Date(startDate.getTime() + duration * 60000);

            const pad = (n) => n.toString().padStart(2, '0');
            const formatted = `${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(endDate.getDate())}T${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`;
            this.form.end = formatted;
        }
    },
    computed: {
        filteredEvents() {
            if (!this.allEvents || !this.therapistMap) return [];

            if (this.selectedTherapist === 'All') {
                return this.allEvents || [];
            }
            return this.allEvents.filter(
                e => e.extendedProps?.therapist === this.selectedTherapist
            );
        },
        outOfOfficeTherapists() {
            const today = new Date();
            return this.therapists.filter(t => {
                if (!t.outOfOffice || !t.outOfOffice.start || !t.outOfOffice.end) return false;

                const start = new Date(t.outOfOffice.start);
                const end = new Date(t.outOfOffice.end);

                return !isNaN(start) && !isNaN(end) && end >= today;
            });
        }

    },
    watch: {
        selectedTherapist() {
            const calendarApi = this.$refs.fullCalendar?.getApi?.();
            calendarApi.refetchEvents();
        },

        'form.start': function (newStart) {
            this.updateEndTime(newStart, this.form.service);
        },

        'form.service': function (newService) {
            this.updateEndTime(this.form.start, newService);
        }
    },
}
</script>

<template>
    <div class="bg-light p-4 rounded shadow-sm mb-4 text-center">
        <h1 class="display-4 text-primary fw-bold my-4 d-flex justify-content-center align-items-center gap-3">
            <img src="/hwg.svg" alt="HWG Logo" class="logo-spin" style="width: 50px; height: 50px;" />
            HWG Scheduler <small v-if="user" class="ms-3 fs-5 text-muted">– Welcome, {{ user.name }}</small>
        </h1>
        <p class="lead text-center text-muted">Easily manage therapist schedules and client sessions</p>
    </div>

    <div v-if="isAdmin" class="admin-banner">
        <span>👑 You are logged in as <strong>Admin</strong></span>
    </div>

    <div v-if="isAdmin" class="dropdown" ref="therapistDropdownRef" style="position: relative; display: inline-block;">
        <button class="btn btn-success" @click="toggleTherapistDropdown">
            ⚙️ Manage Therapists
        </button>
        <div v-if="showTherapistDropdown" class="dropdown-menu show">
            <button class="dropdown-item" @click="openAddTherapistModal">➕ Add Therapist</button>
            <button class="dropdown-item" @click="openEditTherapistModal">✏️ Edit Therapists</button>
            <button class="dropdown-item" @click="openDeleteTherapistModal">🗑️ Delete Therapists</button>
        </div>
    </div>

    <div v-if="user.outOfOffice && user.outOfOffice.start">
        <strong>Out of Office:</strong><br>
        {{ formatDate(user.outOfOffice.start) }} - {{ formatDate(user.outOfOffice.end) }}
    </div>


    <div class="calendar-header d-flex justify-content-between align-items-center mb-3 px-3">
        <button @click="showModal = true" class="btn btn-primary">📝 Schedule Client</button>
        <!-- Profile Dropdown -->
        <div class="dropdown position-relative">
            <!-- Profile image -->
            <img
            ref="profileImage"
            src="https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg"
            alt="Profile"
            class="rounded-circle"
            style="width: 40px; height: 40px; cursor: pointer; object-fit: cover;"
            @click="toggleProfileDropdown"
            />

            <!-- Dropdown menu -->
            <div
            v-if="showProfileDropdown"
            ref="profileDropdown"
            class="dropdown-menu show mt-2"
            style="right: 0; left: auto; position: absolute;"
            >
            <button class="dropdown-item" @click="showOutOfOfficeModal = true">🚪 Set Out-of-Office Dates</button>
            <button class="dropdown-item" @click="handleChangePassword">🔒 Change Password</button>
            <button class="dropdown-item" @click="handleChangeAvailability">🗓️ Change Availability</button>
            <div class="dropdown-divider"></div>
                <button class="dropdown-item text-danger" @click="logout">🚪 Logout</button>
            </div>
        </div>
    </div>

    <div class="therapist-filter" style="margin: 1rem 0;">
        <label for="therapistDropdown">Filter by Therapist:</label>
        <select v-model="selectedTherapist" id="therapistDropdown">
            <option value="All">All Therapists</option>
            <option v-for="therapist in therapists" :key="therapist.id" :value="therapist.name">
            {{ therapist.name }}
            </option>
        </select>
    </div>

    <p><strong>Now Viewing:</strong> {{ selectedTherapist }}</p>

    <div 
        v-if="outOfOfficeTherapists.length" 
        class="alert alert-warning d-flex flex-column align-items-start p-3 mb-3"
        style="border-left: 5px solid #ff6f61;"
    >
        <strong class="mb-2">🚫 Out of Office</strong>
        <ul class="mb-0 ps-3">
            <li 
                v-for="t in outOfOfficeTherapists" 
                :key="t.id"
            >
                {{ t.name }} (returns {{ getReturnDate(t.outOfOffice.end) }})
            </li>
        </ul>
    </div>

    <!-- Schedule Client Modal -->
    <div v-if="showModal" class="modal-overlay">
        <div class="modal-content">
            <form @submit.prevent="submitEvent">
                <h2>📅 Schedule A Client</h2>
                
                <div class="modal-section">
                    <label class="form-label">Session Title</label>
                    <input v-model="form.title" type="text" class="form-control" placeholder="Enter session title" required />
                </div>

                <div class="modal-section">
                    <div class="col-md-6">
                    <label class="form-label">Therapist</label>
                    <select v-model="form.therapist" class="form-select" required>
                        <option disabled value="">Select a therapist</option>
                        <option v-for="therapist in therapists" :key="therapist.id" :value="therapist.name">
                        {{ therapist.name }}
                        </option>
                    </select>
                    </div>

                    <div class="col-md-6">
                    <label class="form-label">Service</label>
                    <select v-model="form.service" class="form-select" required>
                        <option disabled value="">Select a service</option>
                        <option v-for="service in services" :key="service" :value="service">{{ service }}</option>
                    </select>
                    </div>
                </div>

                <div class="modal-section">
                    <label class="form-label">Client Name</label>
                    <input v-model="form.client" type="text" class="form-control" placeholder="Enter client name" required />
                </div>

                <div class="modal-section">
                    <label class="form-label">Room</label>
                    <select v-model="form.room" class="form-select" required>
                    <option disabled value="">Select a room</option>
                    <option v-for="(color, name) in rooms" :key="name" :value="name">
                        {{ name }}
                    </option>
                    </select>
                </div>

                <div class="modal-section">
                    <div class="col-md-6">
                    <label class="form-label">Start Time</label>
                    <input v-model="form.start" type="datetime-local" class="form-control" required />
                    </div>
                    <div class="col-md-6">
                    <label class="form-label">End Time</label>
                    <input v-model="form.end" type="datetime-local" class="form-control" readonly />
                    </div>
                </div>

                <div class="modal-section">
                    <label class="form-label">Description</label>
                    <textarea v-model="form.description" class="form-control" rows="3" placeholder="Add any notes..."></textarea>
                </div>

                <div class="modal-section">
                    <label class="form-label">Frequency</label>
                    <select v-model="form.frequency" class="form-select">
                    <option value="none">Doesn't repeat</option>
                    <option value="daily">Every day</option>
                    <option value="weekly">Every week</option>
                    <option value="monthly">Every month</option>
                    </select>
                </div>

                <div class="d-flex justify-content-between mt-4">
                    <button type="submit" class="btn btn-primary w-50 me-2">✅ Submit</button>
                    <button type="button" class="btn btn-outline-secondary w-50" @click="closeModal">❌ Cancel</button>
                </div>
            </form>

        </div>
    </div>

    <!-- Event Details Modal -->
    <div v-if="showEventModal" class="modal-overlay" @click.self="showEventModal = false">
        <div class="modal-content shadow-lg p-4 rounded bg-white" style="width: 500px; max-width: 95%;">
            <h3 class="text-center text-primary fw-bold mb-4">Session Details ✍️</h3>

            <ul class="list-unstyled text-start mb-4" style="line-height: 1.8;">
            <li><strong>Title:</strong> {{ selectedEvent?.title }}</li>
            <li><strong>Therapist:</strong> {{ selectedEvent?.extendedProps?.therapist }}</li>
            <li><strong>Client:</strong> {{ selectedEvent?.extendedProps?.client }}</li>
            <li><strong>Room:</strong> {{ selectedEvent?.extendedProps?.room }}</li>
            <li><strong>Description:</strong> {{ selectedEvent?.extendedProps?.description }}</li>
            <li>
                <strong>Time:</strong>
                {{
                new Date(selectedEvent?.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }} – 
                {{
                new Date(selectedEvent?.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }}
            </li>
            </ul>

            <div class="d-flex flex-wrap justify-content-center gap-2">
            <button class="btn btn-danger" @click="markEventStatus('cancelled')">❌ Cancelled</button>
            <button class="btn btn-warning text-white" @click="markEventStatus('no-show')">❓ No-Show</button>
            <button class="btn btn-outline-primary" @click="removeEventStatus">🔄 Clear</button>
            <button class="btn btn-dark" @click="showEventModal = false">✖ Close</button>
            <button 
                v-if="isAdmin"
                class="btn btn-outline-danger"
                @click="deleteEvent"
            >
                🗑️ Delete
            </button>
            </div>
        </div>
    </div>



    <!-- Add New Therapist Modal -->
    <div v-if="showAddTherapistModal" class="modal-overlay" @click.self="showAddTherapistModal = false">
        <div class="modal-content shadow-lg p-4 rounded bg-white" style="width: 400px; max-width: 90%;">
            <h3 class="text-center mb-4 text-success fw-bold">Add New Therapist</h3>

            <form @submit.prevent="submitNewTherapist">
            <div class="mb-3">
                <label class="form-label">Full Name</label>
                <input v-model="newTherapist.name" type="text" class="form-control" placeholder="Enter full name" required />
            </div>

            <div class="mb-3">
                <label class="form-label">Email</label>
                <input v-model="newTherapist.email" type="email" class="form-control" placeholder="Enter email" required />
            </div>

            <div class="mb-3">
                <label class="form-label">Password</label>
                <input v-model="newTherapist.password" type="password" class="form-control" placeholder="Enter password" required />
            </div>

            <div class="mb-3">
                <label class="form-label">Role</label>
                <select v-model="newTherapist.role" class="form-select">
                <option value="user">User</option>
                <option value="admin">Admin</option>
                </select>
            </div>

        <!-- Optional future: Add availability picker -->

        <div class="d-flex justify-content-between mt-4">
            <button class="btn btn-success w-50 me-2" type="submit">➕ Add</button>
            <button class="btn btn-secondary w-50" type="button" @click="showAddTherapistModal = false">✖ Cancel</button>
        </div>
        </form>
    </div>
    </div>

    <!-- Edit Therapist Modal -->
    <div v-if="showEditTherapistModal" class="modal-overlay" @click.self="showEditTherapistModal = false">
        <div class="modal-content shadow-lg p-4 rounded bg-white" style="width: 400px; max-width: 90%;">
            <h3 class="text-center mb-4 text-primary fw-bold">Edit Therapist</h3>

            <div class="mb-3">
            <label class="form-label">Select Therapist</label>
            <select v-model="selectedTherapistForEdit" class="form-select">
                <option disabled value="">-- Choose --</option>
                <option v-for="t in therapists" :key="t.id" :value="t">{{ t.name }}</option>
            </select>
            </div>

            <div v-if="selectedTherapistForEdit">
            <div class="mb-3">
                <label class="form-label">Full Name</label>
                <input type="text" v-model="selectedTherapistForEdit.name" class="form-control" placeholder="Enter name" />
            </div>

            <div class="mb-3">
                <label class="form-label">Email</label>
                <input type="email" v-model="selectedTherapistForEdit.email" class="form-control" placeholder="Enter email" />
            </div>

            <div class="mb-3">
                <label class="form-label fw-bold">Availability</label>

                <div 
                    v-for="day in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']" 
                    :key="day"
                    class="mb-2"
                >
                    <div class="d-flex align-items-center gap-2">
                    <strong style="width: 90px;">{{ day }}</strong>

                    <input
                        type="time"
                        class="form-control form-control-sm"
                        style="max-width: 130px;"
                        :value="getDayTime(day, 'start')"
                        @change="updateAvailability(day, 'start', $event.target.value)"
                    />
                    <span>to</span>
                    <input
                        type="time"
                        class="form-control form-control-sm"
                        style="max-width: 130px;"
                        :value="getDayTime(day, 'end')"
                        @change="updateAvailability(day, 'end', $event.target.value)"
                    />
                    <button class="btn btn-sm btn-outline-danger" @click="clearAvailability(day)">❌</button>
                    </div>
                </div>
            </div>


            <div class="mb-3">
                <label class="form-label">Role</label>
                <select v-model="selectedTherapistForEdit.role" class="form-select">
                <option value="user">User</option>
                <option value="admin">Admin</option>
                </select>
            </div>

            <!-- Optional future availability editor -->

            <div class="d-flex justify-content-between mt-4">
                <button class="btn btn-primary w-50 me-2" @click="saveEditedTherapist">💾 Save</button>
                <button class="btn btn-secondary w-50" @click="showEditTherapistModal = false">✖ Cancel</button>
            </div>
            </div>
        </div>
    </div>
    
    <!-- Delete Therapist Modal -->
    <div v-if="showDeleteTherapistModal" class="modal-overlay" @click.self="showDeleteTherapistModal = false">
        <div class="modal-content shadow-lg p-4 rounded bg-white" style="width: 420px; max-width: 90%;">
            <h3 class="text-center mb-4 text-danger fw-bold">Delete Therapist</h3>

            <p class="text-muted text-center mb-3">Select a therapist you wish to remove from the system:</p>

            <ul class="list-group mb-4">
            <li 
                v-for="t in therapists" 
                :key="t.id" 
                class="list-group-item d-flex justify-content-between align-items-center"
            >
                <div>
                <strong>{{ t.name }}</strong><br />
                <small class="text-muted">{{ t.email }}</small>
                </div>
                <button 
                class="btn btn-outline-danger btn-sm"
                @click="deleteTherapist(t.id)"
                >
                🗑️ Delete
                </button>
            </li>
            </ul>

            <div class="text-center">
            <button class="btn btn-secondary w-100" @click="showDeleteTherapistModal = false">✖ Cancel</button>
            </div>
        </div>
    </div>

    <!-- Change Password Modal -->
    <div v-if="showChangePasswordModal" class="modal-overlay" @click.self="showChangePasswordModal = false">
        <div class="modal-content shadow-lg p-4 rounded bg-white" style="width: 400px; max-width: 90%;">
            <h3 class="text-center text-primary fw-bold mb-4">🔒 Change Password</h3>
            <form @submit.prevent="submitPasswordChange">
            <div class="mb-3">
                <label>New Password</label>
                <input type="password" v-model="newPassword" class="form-control" required />
            </div>
            <div class="mb-3">
                <label>Confirm Password</label>
                <input type="password" v-model="confirmPassword" class="form-control" required />
            </div>
            <div class="d-flex justify-content-between">
                <button type="submit" class="btn btn-primary w-50 me-2">Update</button>
                <button type="button" class="btn btn-secondary w-50" @click="showChangePasswordModal = false">Cancel</button>
            </div>
            </form>
        </div>
    </div>

    <!-- Change Availability Modal -->
    <div v-if="showChangeAvailabilityModal" class="modal-overlay" @click.self="showChangeAvailabilityModal = false">
        <div class="modal-content shadow-lg p-4 rounded bg-white" style="width: 500px; max-width: 95%;">
            <h3 class="text-center text-success fw-bold mb-4">🗓️ Change Availability</h3>
            <div v-for="day in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']" :key="day" class="mb-3">
            <strong>{{ day }}</strong>
            <div class="d-flex gap-2 mt-1">
                <input 
                    type="time" 
                    class="form-control" 
                    :value="user.availability[day]?.[0]?.start || ''"
                    @input="updateUserAvailability(day, 'start', $event.target.value)"
                />
                <input 
                    type="time" 
                    class="form-control" 
                    :value="user.availability[day]?.[0]?.end || ''"
                    @input="updateUserAvailability(day, 'end', $event.target.value)"
                />
                <button class="btn btn-outline-danger" @click="clearUserAvailability(day)">❌</button>
            </div>
            </div>
            <div class="d-flex justify-content-between">
            <button class="btn btn-primary w-50 me-2" @click="submitAvailabilityChange">Save</button>
            <button class="btn btn-secondary w-50" @click="showChangeAvailabilityModal = false">Cancel</button>
            </div>
        </div>
    </div>

    <!-- Out-Of-Office Modal-->
    <div v-if="showOutOfOfficeModal" class="modal-overlay" @click.self="showOutOfOfficeModal = false">
        <div class="modal-content shadow-lg p-4 rounded bg-white" style="width: 400px; max-width: 90%;">
            <h3 class="text-center fw-bold text-danger mb-4">Set Out-of-Office</h3>
            <div class="mb-3">
                <label>Start Date</label>
                <input type="date" class="form-control" v-model="user.outOfOffice.start" />
            </div>
            <div class="mb-3">
                <label>Return Date</label>
                <input type="date" class="form-control" v-model="user.outOfOffice.end" />
            </div>
            <div class="d-flex justify-content-between">
                <button class="btn btn-primary w-50 me-2" @click="submitOutOfOffice">Save</button>
                <button class="btn btn-secondary w-50" @click="showOutOfOfficeModal = false">Cancel</button>
            </div>
        </div>
    </div>

    <div v-if="outOfOfficeTherapists.length" class="alert alert-warning mt-3">
        <strong>🚫 Unavailable Therapists:</strong>
        <ul class="mb-0">
            <li v-for="t in outOfOfficeTherapists" :key="t.id">
            {{ t.name }} (returns on {{ getReturnDate(t.outOfOffice.end) }})
            </li>
        </ul>
     </div>

    <!-- FullCalendar component -->
    <FullCalendar 
        ref="fullCalendar"
        :options="calendarOptions"
    />

    <!-- Footer -->
    <footer class="bg-light text-center py-4">
        <p class="mb-0 text-muted">© 2025 HWG Scheduler created by Diether Dorado. All rights reserved.</p>
    </footer>
</template>
    