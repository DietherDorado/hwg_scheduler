<script>
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import BootstrapTheme from '@fullcalendar/bootstrap5'

export default {
    components: {
        FullCalendar
    },
    data() {
        return {
            showModal: false,
            showEventModal: false,
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
                select: this.handleSlotSelect,
                selectAllow: this.selectAllow,
                selectedEvent: null,
                showEventModal: false,
                eventClick: this.handleEventClick,
                eventSources: [], // will be filled with data later
            }
        }
    },
    mounted() {
        fetch('http://localhost:3000/events')
            .then(res => res.json())
            .then(data => {
                this.allEvents = data.map(event => ({
                    ...event,
                    start: new Date(event.start),
                    end: new Date(event.end)
                }))
            })
            .catch(err => {
                console.error('Failed to load events:', err)
            })

        fetch('http://localhost:3000/therapists')
            .then(res => res.json())
            .then(data => {
                this.therapists = data.sort((a, b) => a.name.localeCompare(b.name));
                this.therapistMap = {}
                data.forEach(t => {
                    this.therapistMap[t.name] = t
                })

                this.calendarOptions.eventSources = [
                    {
                        events: this.getUnavailableBackgrounds,
                        color: '#a0a0a0', // light gray for unavailable times
                        textColor: 'transparent',
                        display: 'background'
                    },
                    {
                        events: (fetchInfo, successCallback) => {
                            successCallback(this.filteredEvents)
                        }
                    }
                ]

                const calendarApi = this.$refs.fullCalendar?.getApi?.();
                if (calendarApi) calendarApi.refetchEvents();
            })
    },
    methods: {
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

            this.showModal = true

            const calendarApi = this.$refs.fullCalendar?.getApi?.();
            calendarApi?.unselect(); // Clear any previous selection
        },
        selectAllow(selectInfo) {
            const calendarApi = this.$refs.fullCalendar?.getApi?.();
            const events = calendarApi?.getEvents?.() || [];

            const duration = selectInfo.end - selectInfo.start;
            const isOneHour = duration === 60 * 60 * 1000; // 1 hour in milliseconds


            const isAvailable = !events.some(event => 
                event.display === 'background' &&
                (
                    selectInfo.start < event.end &&
                    selectInfo.end > event.start
                )
            );

            return isOneHour && isAvailable;
        },
        submitEvent() {
            const roomColor = this.rooms[this.form.room] || '#000000' // Default color if room not found
            const { frequency } = this.form;

            const startDate = new Date(this.form.start);
            const endDate = new Date(this.form.end);

            const repeatCount = frequency === 'none' ? 1 : 5; // Default to 5 occurrences if repeating

            const intervalMs = {
                daily: 24 * 60 * 60 * 1000, // 1 day
                weekly: 7 * 24 * 60 * 60 * 1000, // 1 week
                monthly: 30 * 24 * 60 * 60 * 1000 // Roughly 1 month
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

                const event = {
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
                };

                events.push(event);
            }


            // Submit each event to backend
            Promise.all(events.map(event =>
                fetch('http://localhost:3000/events', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(event)
                })
                    .then(res => res.json())
                    .then(data => {
                        this.calendarOptions.events.push({
                            ...data.event,
                            start: new Date(data.event.start),
                            end: new Date(data.event.end)
                        });
                    })
            ))
                .then(() => this.closeModal())
                .catch(err => {
                    console.error('Failed to submit event:', err);
                    alert('Error scheduling event. Please try again.');
                });
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
                    groupId: 'unavailable'
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
                    groupId: 'unavailable'
                });
                }
            }

            successCallback(unavailableEvents);
        },
        handleEventClick(info) {
            this.selectedEvent = info.event;
            this.showEventModal = true;
        }

    },
    computed: {
        filteredEvents() {
            if (this.selectedTherapist === 'All') {
                return this.allEvents || [];
            }
            return (this.allEvents || []).filter(
                event => event.extendedProps?.therapist === this.selectedTherapist
            );
        }
    },
    watch: {
        selectedTherapist() {
            const calendarApi = this.$refs.fullCalendar?.getApi?.();
            calendarApi.refetchEvents();
        }
    },
}
</script>

<template>
    <div class="bg-light p-4 rounded shadow-sm mb-4 text-center">
        <h1 class="display-4 text-primary fw-bold my-4 d-flex justify-content-center align-items-center gap-3">
            <img src="/hwg.svg" alt="HWG Logo" style="width: 50px; height: 50px;" />
            HWG Scheduler
        </h1>
        <p class="lead text-center text-muted">Easily manage therapist schedules and client sessions</p>
    </div>

    <div class="calendar-header">
        <button @click="showModal = true" class="btn btn-primary">📝 Schedule Client</button>
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

    <!-- Schedule Client Modal -->
    <div v-if="showModal" class="modal-overlay">
        <div class="modal-content">
            <h2>Schedule A Client</h2>
            <form @submit.prevent="submitEvent">
            <div class="form-row">
                <label>Session Title:</label>
                <input v-model="form.title" type="text" placeholder="Enter session title" required />
            </div>

            
            <div class="form-row">
                <label>Therapists:</label>
                <select v-model="form.therapist" required>
                    <option disabled value="">Select a therapist</option>
                    <option v-for="therapist in therapists" :key="therapist.id" :value="therapist.name">
                        {{ therapist.name }}
                    </option>
                </select>
            </div>

            <div class="form-row">
                <label>Services:</label>
                <select v-model="form.service" required>
                    <option disabled value="">Select a service</option>
                    <option v-for="service in services" :key="service.id" :value="service.name">
                        {{ service }}
                    </option>
                </select>
            </div>

            <div class="form-row">
                <label>Client Name:</label>
                <input v-model="form.client" type="text" placeholder="Enter client name" required />
            </div>

            <div class="form-row">
                <label>Room:</label>
                <select v-model="form.room" required>
                    <option disabled value="">Select a room</option>
                    <option v-for="(color, name) in rooms" :key="name" :value="name">
                    {{ name }}
                    </option>
                </select>
            </div>

            <div class="form-row">
                <label>Start Time:</label>
                <input v-model="form.start" type="datetime-local" required />
            </div>

            <div class="form-row">
                <label>End Time:</label>
                <input v-model="form.end" type="datetime-local" required />
            </div>

            <div class="form-row">
                <label>Description:</label>
                <textarea v-model="form.description" rows="4" placeholder="Add any notes..."></textarea>
            </div>

            <div class="form-row">
                <label>Frequency:</label>
                <select v-model="form.frequency">
                    <option value = "none">Doesn't repeat</option>
                    <option value = "daily">Every day</option>
                    <option value = "weekly">Every week</option>
                    <option value = "monthly">Every month</option>
                </select>
            </div>
            
            <div class="modal-buttons" style="display: flex; justify-content: space-between; gap: 10px;">
                <button class="btn btn-primary" type="submit">Submit</button>
                <button class="btn btn-secondary" type="button" @click="closeModal">Cancel</button>
            </div>

            </form>
        </div>
    </div>

    <!-- Event Details Modal -->
     <div v-if="showEventModal" class="modal-overlay">
        <div class="modal-content">
            <h2 >Session Details</h2>
            <p align="left"><strong>Title:</strong> {{ selectedEvent?.title }}</p>
            <p align="left"><strong>Therapist:</strong> {{ selectedEvent?.extendedProps?.therapist }}</p>
            <p align="left"><strong>Client:</strong> {{ selectedEvent?.extendedProps?.client }}</p>
            <p align="left"><strong>Room:</strong> {{ selectedEvent?.extendedProps?.room }}</p>
            <p align="left"><strong>Description:</strong> {{ selectedEvent?.extendedProps?.description }}</p>
            <p align="left">
                <strong>Time:</strong>
                {{ new Date(selectedEvent?.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
                -
                {{ new Date(selectedEvent?.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
            </p>
            <div class="modal-buttons">
                <button class="btn btn-secondary" @click="showEventModal = false">Close</button>
            </div>
        </div>
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
    