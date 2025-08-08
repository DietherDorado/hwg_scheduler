<script>
/**
 * HWG Scheduler (MyCalendar.vue)
 * -----------------------------------------
 * Structure & notes:
 * 1) Imports
 * 2) Helper (authFetch)
 * 3) Vue component (data, lifecycle, computed, watch, methods)
 *    Methods grouped by feature area:
 *      A) UI / Toasts / Dropdowns
 *      B) Calendar Setup & Rendering
 *      C) Event CRUD
 *      D) Therapist CRUD
 *      E) Availability & Out-of-Office
 *      F) Auth / Session
 *      G) Utilities
 */

// =============================
// 1) Imports
// =============================
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import BootstrapTheme from '@fullcalendar/bootstrap5'
import flatPickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'
import HorizontalTherapistWeekView from './HorizontalTherapistWeekView.vue'
import Toastify from 'toastify-js'
import "toastify-js/src/toastify.css"

// =============================
// 2) Helper: authorized fetch wrapper
// =============================
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
  components: { FullCalendar, flatPickr, HorizontalTherapistWeekView },

  // =============================
  // Component State
  // =============================
  data() {
    const savedView =
      localStorage.getItem('calendarView') ||
      (window.innerWidth < 768 ? 'listWeek' : 'timeGridWeek')
    const savedTherapist = localStorage.getItem('selectedTherapist') || 'All'

    return {
      // ---------- Auth / Current User ----------
      user: { outOfOffice: { start: '', end: '' } },
      isAdmin: false,

      // ---------- Modal / UI State ----------
      showModal: false,
      showEventModal: false,
      showProfileDropdown: false,
      deletingEvent: false,
      selectedEvent: null,
      isHorizontalView: localStorage.getItem('viewMode') === 'horizontal',
      selectedTherapist: savedTherapist,
      therapistMap: {},

      // ---------- Fun banner ----------
      gifsByDay: [
        'https://media1.tenor.com/m/8J5RHMsLT7AAAAAC/the-simpsons-homer-simpson.gif', // Sun
        'https://media.tenor.com/cko8V8g8QCoAAAAj/monday-day.gif', // Mon
        'https://media.tenor.com/DH1UnQXJBlEAAAAj/tuesday-day.gif', // Tue
        'https://media1.tenor.com/m/-zQsh1umeigAAAAd/funny.gif', // Wed
        'https://media.tenor.com/uM0gyI4Wv-AAAAAi/thursday-day.gif', // Thu
        'https://media1.tenor.com/m/8J5RHMsLT7AAAAAC/the-simpsons-homer-simpson.gif', // Fri
        'https://media1.tenor.com/m/8J5RHMsLT7AAAAAC/the-simpsons-homer-simpson.gif' // Sat
      ],

      // ---------- Pickers / Controls ----------
      flatpickrConfig: {
        enableTime: true,
        noCalendar: false,
        dateFormat: 'Y-m-d H:i',
        minuteIncrement: 30,
        time_24hr: false,
        altInput: true,
        altFormat: 'l, F j, Y h:i K'
      },

      // ---------- Event Forms ----------
      form: {
        client: '',
        therapist: '',
        service: '',
        room: '',
        start: '',
        end: '',
        frequency: 'none' // doesn't repeat by default
      },
      editMode: false,
      editForm: {
        client: '',
        therapist: '',
        service: '',
        room: '',
        start: '',
        end: '',
        frequency: 'none'
      },

      // ---------- Therapists / Services / Rooms ----------
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
        'Individual',
        'Couples',
        'Family',
        'Intake',
        'Teletherapy',
        'KAP Integration',
        'KAP Dosing',
        'KAP Prep',
        'Out-Of-Office'
      ],
      rooms: {
        "Kana’s Room": '#8c52ff',
        'Blue Room': '#386bff',
        'Family Room': '#ff66c4',
        'Neuro Room': '#ffde59',
        'Room 1': '#7ed597',
        'Room 2': '#ffbd59',
        'Room 3': '#ffb3ba',
        Telehealth: '#708b4e',
        Other: '#bb0061'
      },
      allEvents: [],

      // ---------- FullCalendar Options ----------
      calendarOptions: {
        height: 'auto',
        themeSystem: 'bootstrap5',
        plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin, BootstrapTheme],
        initialView: savedView,
        viewDidMount: this.handleViewChange,
        views: {
          timeGridWeek: {
            slotMinTime: '07:00:00',
            slotMaxTime: '21:00:00',
            slotDuration: '00:30:00'
          },
          timeGridDay: { slotMinTime: '07:00:00', slotMaxTime: '21:00:00' }
        },
        weekends: true,
        nowIndicator: true,
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
        },
        eventContent: this.renderEventContent,
        selectable: true,
        selectMirror: true,
        // Hook up handlers directly here
        select: this.handleSlotSelect,
        selectAllow: this.selectAllow,
        eventClick: this.handleEventClick,
        // All events are provided via eventSources (no separate `events`)
        eventSources: []
      }
    }
  },

  // =============================
  // Lifecycle
  // =============================
  mounted() {
    const storedUser = JSON.parse(localStorage.getItem('user'))

    if (!storedUser || !localStorage.getItem('token')) {
      this.$router.push('/')
      return
    }

    try {
      const payload = JSON.parse(atob(localStorage.getItem('token').split('.')[1]))
      const expiry = payload.exp * 1000
      if (Date.now() > expiry) throw new Error('Token expired')
    } catch (err) {
      localStorage.clear()
      this.$router.push('/')
    }

    this.user = storedUser
    this.isAdmin = this.user.role === 'admin'

    if (!this.user.outOfOffice) {
      this.user.outOfOffice = { start: '', end: '' }
    }

    this.loadData()

    document.addEventListener('click', this.handleClickOutsideDropdown)
    document.addEventListener('click', this.handleClickOutsideProfileDropdown)

    if (!this.user.availability) {
      this.user.availability = {
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: [],
        Saturday: [],
        Sunday: []
      }
    }

    this.calendarOptions.viewDidMount = this.handleViewChange
  },

  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutsideDropdown)
    document.removeEventListener('click', this.handleClickOutsideProfileDropdown)
  },

  // =============================
  // Computed
  // =============================
  computed: {
    dailyGif() {
      const today = new Date().getDay()
      return this.gifsByDay[today]
    },
    filteredEvents() {
      if (!this.allEvents || !this.therapistMap) return []

      if (this.selectedTherapist === 'All') {
        return this.allEvents || []
      }
      return this.allEvents.filter(e => e.extendedProps?.therapist === this.selectedTherapist)
    },
    outOfOfficeTherapists() {
      const today = new Date()
      return this.therapists.filter(t => {
        const start = new Date(t.outOfOffice?.start)
        const end = new Date(t.outOfOffice?.end)
        return start && end && end >= today
      })
    },
    therapistNames() {
      return ['All', ...this.therapists.map(t => t.name)]
    },
    filteredOutOfOfficeTherapists() {
      const today = new Date()
      const oneWeekFromNow = new Date()
      oneWeekFromNow.setDate(today.getDate() + 7)

      return this.outOfOfficeTherapists.filter(t => {
        const start = new Date(t.outOfOffice?.start)
        const end = new Date(t.outOfOffice?.end)
        return start && end && start <= oneWeekFromNow && end >= today
      })
    }
  },

  // =============================
  // Watchers
  // =============================
  watch: {
    selectedTherapist(newValue) {
      localStorage.setItem('selectedTherapist', newValue)
      const calendarApi = this.$refs.fullCalendar?.getApi?.()
      calendarApi?.refetchEvents()
    },
    'form.start': function (newStart) {
      this.updateEndTime(newStart, this.form.service)
    },
    'form.service': function (newService) {
      this.updateEndTime(this.form.start, newService)
    }
  },

  // =============================
  // Methods
  // =============================
  methods: {
    // -------------------------------------
    // A) UI / Toasts / Dropdowns
    // -------------------------------------
    showToast(message, type = 'success') {
      Toastify({
        text: message,
        duration: 3000,
        gravity: 'top',
        position: 'right',
        backgroundColor: type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff',
        stopOnFocus: true
      }).showToast()
    },
    handleViewChange(arg) {
      localStorage.setItem('calendarView', arg.view.type)
    },
    handleClickOutsideDropdown(e) {
      const dropdown = this.$refs.therapistDropdownRef
      if (dropdown && !dropdown.contains(e.target)) {
        this.showTherapistDropdown = false
      }
    },
    handleClickOutsideProfileDropdown(e) {
      const dropdown = this.$refs.profileDropdown
      const image = this.$refs.profileImage
      if (dropdown && image && !dropdown.contains(e.target) && !image.contains(e.target)) {
        this.showProfileDropdown = false
      }
    },
    toggleTherapistDropdown() {
      this.showTherapistDropdown = !this.showTherapistDropdown
    },
    toggleProfileDropdown() {
      this.showProfileDropdown = !this.showProfileDropdown
    },

    // -------------------------------------
    // B) Calendar Setup & Rendering
    // -------------------------------------
    handleEventClick(info) {
      // Prevent clicking on background events
      if (info.event.classNames.includes('unavailable-slot')) {
        info.jsEvent.preventDefault()
        return
      }

      this.selectedEvent = info.event
      this.showEventModal = true
      this.editMode = false

      const props = info.event.extendedProps || {}
      this.editForm = {
        client: props.client || '',
        therapist: props.therapist || '',
        service: props.service || '',
        room: props.room || '',
        start: new Date(info.event.start),
        end: new Date(info.event.end),
        frequency: 'none'
      }
    },
    selectAllow(selectInfo) {
      // Allow selection when viewing "All" therapists
      if (this.selectedTherapist === 'All') return true
      const allowed = this.isWithinTherapistAvailability(selectInfo.start, selectInfo.end)
      console.log('Clicked slot from:', selectInfo.start, 'to', selectInfo.end, '| Allowed?', allowed)
      return allowed
    },
    closeModal() {
      this.showModal = false
      this.form = {
        client: '',
        therapist: '',
        service: '',
        room: '',
        start: '',
        end: '',
        frequency: 'none'
      }
    },
    handleSlotSelect(selectionInfo) {
      this.form.start = selectionInfo.start // Date object
      this.form.end = selectionInfo.end

      if (this.selectedTherapist !== 'All') {
        this.form.therapist = this.selectedTherapist
      }

      this.showModal = true
      const calendarApi = this.$refs.fullCalendar?.getApi?.()
      calendarApi?.unselect()
    },
    renderEventContent(arg) {
      // Compact renderer in timeGrid; richer info in month/list
      const event = arg.event
      const viewType = arg?.view?.type || ''
      if (event.display === 'background') return null

      const { therapist, room, client } = event.extendedProps || {}
      if (viewType.includes('timeGrid')) {
        const wrapper = document.createElement('div')
        wrapper.style.fontSize = '11px'
        wrapper.style.lineHeight = '1.1'
        wrapper.style.color = 'white'
        wrapper.innerHTML = `
          <strong>‣ ${client || 'Client'}</strong><br/>
          <small>👩‍⚕️ ${therapist || ''}</small><br/>
        `
        return { domNodes: [wrapper] }
      }
      return {
        html: `
          <div style="font-size: 13px;">
            👤 ${client || 'Client'}<br/>
            🛋 ${room || ''}<br/>
            👩‍⚕️ ${therapist || ''}
          </div>
        `
      }
    },
    getUnavailableBackgrounds(fetchInfo, successCallback /*, failureCallback */) {
      // Build background "blocked" ranges outside therapist availability
      if (this.selectedTherapist === 'All') return successCallback([])

      const therapist = this.therapistMap[this.selectedTherapist]
      if (!therapist || !therapist.availability) return successCallback([])

      const startDate = new Date(fetchInfo.start)
      const endDate = new Date(fetchInfo.end)
      const unavailableEvents = []
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

      for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
        const dayName = dayNames[d.getDay()]
        const availableBlocks = therapist.availability[dayName] || []

        const fullDayStart = new Date(d)
        fullDayStart.setHours(7, 0, 0) // calendar day start
        const fullDayEnd = new Date(d)
        fullDayEnd.setHours(21, 0, 0) // calendar day end

        let lastEnd = new Date(fullDayStart)

        for (const block of availableBlocks) {
          const blockStart = new Date(d)
          const [startHour, startMin] = block.start.split(':')
          blockStart.setHours(parseInt(startHour), parseInt(startMin))

          if (blockStart > lastEnd) {
            unavailableEvents.push({
              start: lastEnd.toISOString(),
              end: blockStart.toISOString(),
              display: 'background',
              classNames: ['unavailable-slot'],
              groupId: 'unavailable',
              editable: false
            })
          }

          const blockEnd = new Date(d)
          const [endHour, endMin] = block.end.split(':')
          blockEnd.setHours(parseInt(endHour), parseInt(endMin))
          lastEnd = new Date(blockEnd)
        }

        if (lastEnd < fullDayEnd) {
          unavailableEvents.push({
            start: lastEnd.toISOString(),
            end: fullDayEnd.toISOString(),
            display: 'background',
            classNames: ['unavailable-slot'],
            groupId: 'unavailable',
            editable: false
          })
        }
      }

      successCallback(unavailableEvents)
    },

    // -------------------------------------
    // C) Event CRUD
    // -------------------------------------
    async submitEvent() {
      const roomColor = this.rooms[this.form.room] || '#000000'
      const therapistObj = this.therapistMap[this.form.therapist]
      const { frequency } = this.form

      let startDate = new Date(this.form.start)
      let endDate = new Date(this.form.end)

      // Guard: both start and end must be valid
      if (isNaN(startDate) || isNaN(endDate)) {
        this.showToast('Please set a valid start and end time.', 'error')
        return
      }

      const repeatCount = frequency === 'none' ? 1 : 5 // default 5 occurrences
      const intervalMs = {
        daily: 86_400_000,
        weekly: 604_800_000,
        monthly: 2_592_000_000
      }

      const events = []

      // Prevent scheduling while therapist is OOO
      if (this.isTherapistOutOfOffice(therapistObj)) {
        this.showToast(`${therapistObj.name} is currently out of office and will return soon!`, 'error')
        return
      }

      for (let i = 0; i < repeatCount; i++) {
        let currentStart = new Date(startDate)
        let currentEnd = new Date(endDate)

        if (frequency === 'monthly') {
          currentStart.setMonth(currentStart.getMonth() + i)
          currentEnd.setMonth(currentEnd.getMonth() + i)
        } else if (frequency !== 'none') {
          const offset = i * intervalMs[frequency]
          currentStart = new Date(currentStart.getTime() + offset)
          currentEnd = new Date(currentEnd.getTime() + offset)
        }

        events.push({
          start: currentStart.toISOString(),
          end: currentEnd.toISOString(),
          backgroundColor: roomColor,
          extendedProps: {
            therapist: this.form.therapist,
            client: this.form.client,
            room: this.form.room,
            service: this.form.service,
            frequency: this.form.frequency
          }
        })
      }

      this.showToast('Session created successfully!', 'success')

      try {
        // Submit to backend
        await Promise.all(
          events.map(event =>
            authFetch('https://hwg-backend.onrender.com/events', {
              method: 'POST',
              body: JSON.stringify({
                timestart: event.start,
                timeend: event.end,
                therapist: event.extendedProps?.therapist,
                client: event.extendedProps?.client,
                service: event.extendedProps?.service,
                room: event.extendedProps?.room,
                frequency: event.extendedProps?.frequency,
                backgroundColor: event.backgroundColor
              })
            }).then(res => res.json())
          )
        )

        // Refresh data
        const data = await authFetch('https://hwg-backend.onrender.com/events').then(r => r.json())
        this.allEvents = data.map(event => ({
          ...event,
          start: new Date(event.timestart),
          end: new Date(event.timeend),
          extendedProps: { ...event, therapist: event.therapist_name },
          backgroundColor: event.backgroundColor
        }))
        this.$refs.fullCalendar?.getApi?.().refetchEvents()
        this.closeModal()
      } catch (err) {
        console.error('Error submitting event:', err)
        this.showToast('Failed to schedule session. Please try again.', 'error')
      }
    },
    async submitEventEdit() {
      try {
        const updated = {
          timestart: new Date(this.editForm.start).toISOString(),
          timeend: new Date(this.editForm.end).toISOString(),
          client: this.editForm.client,
          therapist: this.editForm.therapist,
          service: this.editForm.service,
          room: this.editForm.room,
          backgroundColor: this.rooms[this.editForm.room] || '#000'
        }

        await authFetch(`https://hwg-backend.onrender.com/events/${this.selectedEvent.id}`, {
          method: 'PATCH',
          body: JSON.stringify(updated)
        })

        // Update local appearance immediately
        this.selectedEvent.setExtendedProp('client', updated.client)
        this.selectedEvent.setExtendedProp('therapist', updated.therapist)
        this.selectedEvent.setExtendedProp('service', updated.service)
        this.selectedEvent.setExtendedProp('room', updated.room)
        this.selectedEvent.setProp('backgroundColor', updated.backgroundColor)

        this.showEventModal = false
        this.editMode = false
        await this.loadData()
      } catch (err) {
        console.error('Failed to update event:', err)
        this.showToast('Something went wrong while saving changes.', 'error')
      }
    },
    async deleteEvent() {
      if (!this.selectedEvent) return
      const confirmed = confirm('Are you sure you want to delete this session? This action cannot be undone.')
      if (!confirmed) return

      this.deletingEvent = true
      try {
        const eventToDelete = this.selectedEvent
        // UI feedback
        eventToDelete.remove()
        this.showEventModal = false

        await authFetch(`https://hwg-backend.onrender.com/events/${eventToDelete.id}`, { method: 'DELETE' })
        await this.loadData()

        this.showToast('Sessions has been deleted.', 'success')
      } catch (err) {
        console.error('Failed to delete event:', err)
        this.showToast('Error deleting session. Please try again later.', 'error')
      } finally {
        this.deletingEvent = false
      }
    },
    markEventStatus(statusType) {
      if (!this.selectedEvent) return

      const emoji = statusType === 'cancelled' ? '❌' : '❓'
      const statusText = statusType === 'cancelled' ? 'Cancelled' : 'No-Show'
      const originalClient = this.selectedEvent.extendedProps.client || ''

      if (originalClient.includes(emoji) || originalClient.includes('❌') || originalClient.includes('❓')) {
        this.showToast(`This session is already marked as ${statusText}.`, 'error')
        return
      }

      const newClient = `${emoji} ${originalClient}`
      this.selectedEvent.setExtendedProp('client', newClient)

      authFetch(`https://hwg-backend.onrender.com/events/${this.selectedEvent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client: newClient })
      })
        .then(() => (this.showEventModal = false))
        .catch(err => {
          console.error('Failed to update event status:', err)
          this.showToast(`Error marking session as ${statusText}. Please try again.`, 'error')
        })
    },
    removeEventStatus() {
      if (!this.selectedEvent) return
      const currentClient = this.selectedEvent.extendedProps.client || ''
      const cleanClient = currentClient.replace(/^❌\s*/, '').replace(/^❓\s*/, '')

      if (cleanClient === currentClient) {
        this.showToast('This session is not marked as cancelled or no-show.', 'error')
        return
      }

      this.selectedEvent.setExtendedProp('client', cleanClient)

      authFetch(`https://hwg-backend.onrender.com/events/${this.selectedEvent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client: cleanClient })
      })
        .then(() => (this.showEventModal = false))
        .catch(err => {
          console.error('Failed to clear event status:', err)
          this.showToast('Error clearing session status. Please try again.', 'error')
        })
    },

    // -------------------------------------
    // D) Therapist CRUD
    // -------------------------------------
    openAddTherapistModal() {
      this.resetNewTherapistForm()
      this.showAddTherapistModal = true
      this.showTherapistDropdown = false
    },
    openEditTherapistModal() {
      this.showEditTherapistModal = true
      this.showTherapistDropdown = false
    },
    openDeleteTherapistModal() {
      this.showDeleteTherapistModal = true
      this.showTherapistDropdown = false
    },
    async submitNewTherapist() {
      try {
        await authFetch(`https://hwg-backend.onrender.com/therapists`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.newTherapist)
        }).then(res => res.json())

        this.showAddTherapistModal = false
        this.showToast('New therapist added successfully!', 'success')

        const data = await authFetch('https://hwg-backend.onrender.com/therapists').then(r => r.json())
        this.therapists = data.sort((a, b) => a.name.localeCompare(b.name))
        this.therapistMap = {}
        data.forEach(t => {
          this.therapistMap[t.name] = t
        })
      } catch (err) {
        console.error('Failed to add new therapist:', err)
        this.showToast('Error adding new therapist. Please try again.', 'error')
      }
    },
    saveEditedTherapist() {
      authFetch(`https://hwg-backend.onrender.com/therapists/${this.selectedTherapistForEdit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.selectedTherapistForEdit)
      })
        .then(() => {
          this.showToast('Therapist updated successfully!', 'success')
          this.showEditTherapistModal = false
          return authFetch('https://hwg-backend.onrender.com/therapists')
        })
        .then(res => res.json())
        .then(data => {
          this.therapists = data.sort((a, b) => a.name.localeCompare(b.name))
          this.therapistMap = {}
          data.forEach(t => {
            this.therapistMap[t.name] = t
          })
        })
    },
    deleteTherapist(id) {
      const confirmDelete = confirm('Are you sure you want to delete this therapist? This action cannot be undone.')
      if (!confirmDelete) return

      authFetch(`https://hwg-backend.onrender.com/therapists/${id}`, { method: 'DELETE' })
        .then(() => {
          this.showToast('Therapist deleted successfully!', 'success')
          this.showDeleteTherapistModal = false
          return authFetch('https://hwg-backend.onrender.com/therapists')
        })
        .then(res => res.json())
        .then(data => {
          this.therapists = data.sort((a, b) => a.name.localeCompare(b.name))
          this.therapistMap = {}
          data.forEach(t => {
            this.therapistMap[t.name] = t
          })
        })
    },
    resetNewTherapistForm() {
      this.newTherapist = {
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
      }
    },
    getDayTime(day, type) {
      const dayBlocks = this.selectedTherapistForEdit.availability[day]
      if (!dayBlocks || dayBlocks.length === 0) return ''
      return dayBlocks[0][type] || ''
    },
    updateAvailability(day, type, value) {
      const avail = this.selectedTherapistForEdit.availability
      if (!avail[day] || avail[day].length === 0) {
        avail[day] = [{ start: '', end: '' }]
      }
      avail[day][0][type] = value
    },
    clearAvailability(day) {
      this.selectedTherapistForEdit.availability[day] = []
    },

    // -------------------------------------
    // E) Availability & Out-of-Office
    // -------------------------------------
    handleChangePassword() {
      this.showChangePasswordModal = true
      this.showProfileDropdown = false
    },
    handleChangeAvailability() {
      if (!this.user.availability) {
        this.user.availability = {
          Monday: [],
          Tuesday: [],
          Wednesday: [],
          Thursday: [],
          Friday: [],
          Saturday: [],
          Sunday: []
        }
      }
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      for (const day of days) {
        const blocks = this.user.availability[day]
        if (!Array.isArray(blocks) || blocks.length === 0) {
          // default 9–17 if unset
          this.user.availability[day] = [{ start: '09:00', end: '17:00' }]
        } else if (!blocks[0].start || !blocks[0].end) {
          this.user.availability[day][0] = {
            start: blocks[0].start || '09:00',
            end: blocks[0].end || '17:00'
          }
        }
      }
      this.showChangeAvailabilityModal = true
      this.showProfileDropdown = false
    },
    async submitPasswordChange() {
      if (this.newPassword !== this.confirmPassword) {
        this.showToast('Passwords do not match.', 'error')
        return
      }
      try {
        const res = await authFetch(`https://hwg-backend.onrender.com/therapists/${this.user.id}/password`, {
          method: 'PATCH',
          body: JSON.stringify({ newPassword: this.newPassword })
        })
        if (!res.ok) throw new Error('Failed to update password')
        this.showToast('Password updated successfully!', 'success')
        this.newPassword = ''
        this.confirmPassword = ''
        this.showChangePasswordModal = false
      } catch (err) {
        console.error('Password update error:', err)
        this.showToast('Error updating password.', 'error')
      }
    },
    async submitAvailabilityChange() {
      try {
        const res = await authFetch(`https://hwg-backend.onrender.com/therapists/${this.user.id}/availability`, {
          method: 'PATCH',
          body: JSON.stringify({ availability: this.user.availability })
        })
        if (!res.ok) throw new Error('Failed to update availability')

        this.showToast('Availability updated successfully!', 'success')
        this.showChangeAvailabilityModal = false

        // Update local cache
        this.therapistMap[this.user.name] = { ...this.user }
        this.selectedTherapist = this.user.name
        const calendarApi = this.$refs.fullCalendar?.getApi?.()
        calendarApi?.refetchEvents()
      } catch (err) {
        console.error('Availability update error:', err)
        this.showToast('Error updating availability.', 'error')
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
        if (!res.ok) throw new Error('Failed to update out-of-office')

        // Refresh therapist list and update current user
        const therapists = await authFetch(`https://hwg-backend.onrender.com/therapists`).then(r => r.json())
        this.therapists = therapists.sort((a, b) => a.name.localeCompare(b.name))
        this.therapistMap = {}
        therapists.forEach(t => {
          t.outOfOffice = t.out_of_office
          delete t.out_of_office
          this.therapistMap[t.name] = t
        })

        const currentUser = therapists.find(t => t.id === this.user.id)
        if (currentUser) {
          currentUser.outOfOffice = currentUser.out_of_office
          delete currentUser.out_of_office
          this.user = currentUser
          localStorage.setItem('user', JSON.stringify(currentUser))
        }

        this.showOutOfOfficeModal = false
        this.showToast('Out-of-office updated.', 'success')
      } catch (err) {
        console.error('Error updating out-of-office', err)
        this.showToast('Failed to update.', 'error')
      }
    },
    isWithinTherapistAvailability(start, end) {
      // Ensure slot falls within selected therapist's availability
      const therapist = this.therapistMap[this.selectedTherapist]
      if (!therapist || !therapist.availability) return false

      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const dayName = dayNames[start.getDay()]
      const availableBlocks = therapist.availability[dayName] || []

      for (let block of availableBlocks) {
        const [blockStartHour, blockStartMin] = block.start.split(':').map(Number)
        const [blockEndHour, blockEndMin] = block.end.split(':').map(Number)

        const blockStart = new Date(start)
        blockStart.setHours(blockStartHour, blockStartMin, 0, 0)

        const blockEnd = new Date(start)
        blockEnd.setHours(blockEndHour, blockEndMin, 0, 0)

        if (start >= blockStart && end <= blockEnd) {
          return true
        }
      }
      return false
    },
    isTherapistOutOfOffice(therapist) {
      if (!therapist || !therapist.outOfOffice || !therapist.outOfOffice.start || !therapist.outOfOffice.end) {
        return false
      }
      const now = new Date()
      const start = new Date(therapist.outOfOffice.start)
      const end = new Date(therapist.outOfOffice.end)
      return start <= now && now <= end
    },

    // -------------------------------------
    // F) Auth / Session
    // -------------------------------------
    logout() {
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      this.$router.push('/')
    },

    // -------------------------------------
    // G) Utilities
    // -------------------------------------
    clearUserAvailability(day) {
      this.user.availability[day] = []
    },
    updateUserAvailability(day, type, value) {
      if (!this.user.availability[day] || this.user.availability[day].length === 0) {
        this.user.availability[day] = [{ start: '', end: '' }]
      }
      this.user.availability[day][0][type] = value
    },
    formatDate(dateStr) {
      const options = { year: 'numeric', month: 'short', day: 'numeric' }
      return new Date(dateStr).toLocaleDateString(undefined, options)
    },
    getReturnDate(end) {
      if (!end) return ''
      const date = new Date(end)
      return date.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    },
    updateEndTime(start, service) {
      if (!start) return
      if (service === 'Out-Of-Office') {
        this.form.end = ''
        return
      }
      const startDate = new Date(start)
      const duration = service === 'KAP Dosing' ? 180 : 50
      const endDate = new Date(startDate.getTime() + duration * 60000)
      const pad = n => n.toString().padStart(2, '0')
      const formatted = `${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(
        endDate.getDate()
      )}T${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`
      this.form.end = formatted
    },
    cycleTherapist(direction) {
      const currentIndex = this.therapistNames.indexOf(this.selectedTherapist)
      if (currentIndex === -1) return
      const newIndex = (currentIndex + direction + this.therapistNames.length) % this.therapistNames.length
      this.selectedTherapist = this.therapistNames[newIndex]
    },
    setViewMode(mode) {
      this.isHorizontalView = mode === 'horizontal'
      localStorage.setItem('viewMode', mode)
    },
    async loadData() {
      try {
        // 1) Therapists
        const therapistRes = await authFetch('https://hwg-backend.onrender.com/therapists')
        const therapistData = await therapistRes.json()
        this.therapists = therapistData.sort((a, b) => a.name.localeCompare(b.name))
        this.therapistMap = {}
        therapistData.forEach(t => {
          t.outOfOffice = t.out_of_office
          delete t.out_of_office
          this.therapistMap[t.name] = t
        })

        // 2) Events
        const eventRes = await authFetch('https://hwg-backend.onrender.com/events')
        const eventData = await eventRes.json()
        this.allEvents = eventData.map(event => ({
          ...event,
          start: new Date(event.timestart),
          end: new Date(event.timeend),
          backgroundColor: event.backgroundColor,
          extendedProps: { ...event, therapist: event.therapist_name }
        }))

        // 3) Event sources (availability background + foreground events)
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
              successCallback(this.filteredEvents)
            }
          }
        ]

        this.$refs.fullCalendar?.getApi?.().refetchEvents()
      } catch (err) {
        console.error('Error loading data:', err)
        this.showToast('Failed to load calendar data.', 'error')
      }
    }
  }
}
</script>

<template>
  <div class="bg-light p-4 rounded shadow-sm mb-4 text-center">
    <h1
      class="display-4 text-primary fw-bold my-4 d-flex justify-content-center align-items-center gap-3"
    >
      <img
        src="/hwg.svg"
        alt="HWG Logo"
        class="logo-spin"
        style="width: 50px; height: 50px"
      />
      HWG Scheduler
      <small v-if="user" class="ms-3 fs-5 text-muted"
        >– Welcome, {{ user.name }}</small
      >
    </h1>
    <p class="lead text-center text-muted">
      Easily manage therapist schedules and client sessions
    </p>
    <img :src="dailyGif" alt="Daily GIF" style="width: 200px" />
  </div>

  <div v-if="isAdmin" class="admin-banner">
    <span>👑 You are logged in as <strong>Admin</strong></span>
  </div>

  <div
    v-if="isAdmin"
    class="dropdown"
    ref="therapistDropdownRef"
    style="position: relative; display: inline-block"
  >
    <button class="btn btn-success" @click="toggleTherapistDropdown">
      ⚙️ Manage Therapists
    </button>
    <div v-if="showTherapistDropdown" class="dropdown-menu show">
      <button class="dropdown-item" @click="openAddTherapistModal">
        ➕ Add Therapist
      </button>
      <button class="dropdown-item" @click="openEditTherapistModal">
        ✏️ Edit Therapists
      </button>
      <button class="dropdown-item" @click="openDeleteTherapistModal">
        🗑️ Delete Therapists
      </button>
    </div>
  </div>

  <div v-if="user && user.outOfOffice && user.outOfOffice.start">
    <strong>Out of Office:</strong><br />
    {{ formatDate(user.outOfOffice.start) }} -
    {{ formatDate(user.outOfOffice.end) }}
  </div>

  <div class="d-flex justify-content-center gap-3 my-3">
    <button
      class="btn"
      :class="isHorizontalView ? 'btn-outline-primary' : 'btn-primary'"
      @click="setViewMode('default')"
    >
      📅 Default View
    </button>
    <button
      class="btn"
      :class="isHorizontalView ? 'btn-primary' : 'btn-outline-primary'"
      @click="setViewMode('horizontal')"
    >
      💫 Scheduler View
    </button>
  </div>

  <div
    class="calendar-header d-flex justify-content-between align-items-center mb-3 px-3"
  >
    <button @click="showModal = true" class="btn btn-primary">
      📝 Schedule Client
    </button>
    <!-- Profile Dropdown -->
    <div class="dropdown position-relative">
      <!-- Profile image -->
      <img
        ref="profileImage"
        src="https://i.imgur.com/4LJltFq.png"
        alt="Profile"
        class="rounded-circle"
        style="width: 60px; height: 60px; cursor: pointer; object-fit: cover"
        @click="toggleProfileDropdown"
      />

      <!-- Dropdown menu -->
      <div
        v-if="showProfileDropdown"
        ref="profileDropdown"
        class="dropdown-menu show mt-2"
        style="right: 0; left: auto; position: absolute"
      >
        <button class="dropdown-item" @click="showOutOfOfficeModal = true">
          🚪 Set Out-of-Office Dates
        </button>
        <button class="dropdown-item" @click="handleChangePassword">
          🔒 Change Password
        </button>
        <button class="dropdown-item" @click="handleChangeAvailability">
          🗓️ Change Availability
        </button>
        <div class="dropdown-divider"></div>
        <button class="dropdown-item text-danger" @click="logout">
          🚪 Logout
        </button>
      </div>
    </div>
  </div>

  <div class="therapist-filter" style="margin: 1rem 0">
    <label for="therapistDropdown">Filter by Therapist:</label>
    <select v-model="selectedTherapist" id="therapistDropdown">
      <option value="All">All Therapists</option>
      <option
        v-for="therapist in therapists"
        :key="therapist.id"
        :value="therapist.name"
        :disabled="isTherapistOutOfOffice(therapist)"
      >
        {{ therapist.name }}
        <span v-if="isTherapistOutOfOffice(therapist)">🚫</span>
      </option>
    </select>
  </div>

  <div class="d-flex align-items-center justify-content-center gap-3 mt-2">
    <button
      class="btn btn-outline-secondary btn-sm"
      @click="cycleTherapist(-1)"
      title="Previous Therapist"
    >
      ◀
    </button>
    <p class="mb-0"><strong>Now Viewing:</strong> {{ selectedTherapist }}</p>
    <button
      class="btn btn-outline-secondary btn-sm"
      @click="cycleTherapist(1)"
      title="Next Therapist"
    >
      ▶
    </button>
  </div>

  <!-- Schedule Client Modal -->
  <div v-if="showModal" class="modal-overlay">
    <div class="modal-content">
      <form @submit.prevent="submitEvent">
        <h2>📅 Schedule A Client</h2>

        <div class="modal-section text-center">
          <label class="form-label">Client Name</label>
          <input
            v-model="form.client"
            type="text"
            class="form-control"
            placeholder="Enter client name"
            required
          />
        </div>

        <div class="modal-section text-center">
          <!-- Select Therapist -->
          <div class="form-group mb-3 d-flex flex-column align-items-center">
            <label class="form-label">Therapist</label>
            <select v-model="form.therapist" class="form-select w-75" required>
              <option disabled value="">Select a therapist</option>
              <option
                v-for="therapist in therapists"
                :key="therapist.id"
                :value="therapist.name"
                :disabled="isTherapistOutOfOffice(therapist)"
              >
                {{ therapist.name }}
                <span v-if="isTherapistOutOfOffice(therapist)">🚫</span>
              </option>
            </select>
          </div>

          <div class="form-group mb-3 d-flex flex-column align-items-center">
            <label class="form-label">Service</label>
            <select v-model="form.service" class="form-select w-75" required>
              <option disabled value="">Select a service</option>
              <option v-for="service in services" :key="service" :value="service">
                {{ service }}
              </option>
            </select>
          </div>
        </div>

        <div class="form-group mb-3 d-flex flex-column align-items-center">
          <label class="form-label">Room</label>
          <select v-model="form.room" class="form-select w-75 text-center" required>
            <option disabled value="">Select a room</option>
            <option v-for="(color, name) in rooms" :key="name" :value="name">
              {{ name }}
            </option>
          </select>
        </div>

        <div class="form-group mb-3 d-flex flex-column align-items-center">
          <label class="form-label">Start Time</label>
          <flat-pickr
            class="form-control mb-2"
            v-model="form.start"
            :config="flatpickrConfig"
            placeholder="Select start time"
          />
          <label class="form-label">End Time</label>
          <flat-pickr
            class="form-control mb-2"
            v-model="form.end"
            :config="flatpickrConfig"
            placeholder="Select end time"
            :readonly="form.service !== 'Out-Of-Office'"
          />
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
          <button type="button" class="btn btn-outline-secondary w-50" @click="closeModal">
            ❌ Cancel
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- Event Details Modal -->
  <div v-if="showEventModal" class="modal-overlay" @click.self="showEventModal = false">
    <div class="modal-content shadow-lg p-4 rounded bg-white" style="width: 500px; max-width: 95%">
      <h3 class="text-center text-primary fw-bold mb-4">
        {{ editMode ? 'Edit Session 🛠️' : 'Session Details ✍️' }}
      </h3>

      <!-- Editable View -->
      <div v-if="editMode">
        <label>Client</label>
        <input class="form-control mb-2" v-model="editForm.client" />

        <label>Therapist</label>
        <select class="form-control mb-2" v-model="editForm.therapist">
          <option v-for="t in therapists" :key="t.id" :value="t.name">{{ t.name }}</option>
        </select>

        <label>Service</label>
        <select class="form-control mb-2" v-model="editForm.service">
          <option v-for="s in services" :key="s" :value="s">{{ s }}</option>
        </select>

        <label>Room</label>
        <select class="form-control mb-2" v-model="editForm.room">
          <option v-for="(color, name) in rooms" :key="name" :value="name">{{ name }}</option>
        </select>

        <label>Start Time</label>
        <flat-pickr class="form-control mb-2" v-model="editForm.start" :config="flatpickrConfig" />

        <label>End Time</label>
        <flat-pickr class="form-control mb-2" v-model="editForm.end" :config="flatpickrConfig" />

        <div class="d-flex justify-content-between">
          <button class="btn btn-success w-50 me-2" @click="submitEventEdit">💾 Save</button>
          <button class="btn btn-secondary w-50" @click="editMode = false">Cancel</button>
        </div>
      </div>

      <!-- Read-Only View -->
      <div v-else>
        <ul class="list-unstyled text-start mb-4" style="line-height: 1.8">
          <li><strong>Client:</strong> {{ selectedEvent?.extendedProps?.client }}</li>
          <li><strong>Therapist:</strong> {{ selectedEvent?.extendedProps?.therapist }}</li>
          <li><strong>Service:</strong> {{ selectedEvent?.extendedProps?.service }}</li>
          <li><strong>Room:</strong> {{ selectedEvent?.extendedProps?.room }}</li>
          <li>
            <strong>Time:</strong>
            {{ new Date(selectedEvent?.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
            -
            {{ new Date(selectedEvent?.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
          </li>
        </ul>

        <div class="d-flex flex-wrap justify-content-center gap-2">
          <button class="btn btn-outline-secondary" @click="editMode = true">✏️ Edit</button>
          <button class="btn btn-danger" @click="markEventStatus('cancelled')">❌ Cancelled</button>
          <button class="btn btn.warning text-white" @click="markEventStatus('no-show')">❓ No-Show</button>
          <button class="btn btn-outline-primary" @click="removeEventStatus">🔄 Clear</button>
          <button class="btn btn-dark" @click="showEventModal = false">✖ Close</button>
          <button class="btn btn-outline-danger" @click="deleteEvent" :disabled="deletingEvent">
            <span
              v-if="deletingEvent"
              class="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            ></span>
            {{ deletingEvent ? 'Deleting...' : '🗑️ Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Add New Therapist Modal -->
  <div v-if="showAddTherapistModal" class="modal-overlay" @click.self="showAddTherapistModal = false">
    <div class="modal-content shadow-lg p-4 rounded bg-white" style="width: 400px; max-width: 90%">
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

        <div class="d-flex justify-content-between mt-4">
          <button class="btn btn-success w-50 me-2" type="submit">➕ Add</button>
          <button class="btn btn-secondary w-50" type="button" @click="showAddTherapistModal = false">✖ Cancel</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Edit Therapist Modal -->
  <div v-if="showEditTherapistModal" class="modal-overlay" @click.self="showEditTherapistModal = false">
    <div class="modal-content shadow-lg p-4 rounded bg-white" style="width: 400px; max-width: 90%">
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
              <strong style="width: 90px">{{ day }}</strong>

              <input
                type="time"
                class="form-control form-control-sm"
                style="max-width: 130px"
                :value="getDayTime(day, 'start')"
                @change="updateAvailability(day, 'start', $event.target.value)"
              />
              <span>to</span>
              <input
                type="time"
                class="form-control form-control-sm"
                style="max-width: 130px"
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

        <div class="d-flex justify-content-between mt-4">
          <button class="btn btn-primary w-50 me-2" @click="saveEditedTherapist">💾 Save</button>
          <button class="btn btn-secondary w-50" @click="showEditTherapistModal = false">✖ Cancel</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Delete Therapist Modal -->
  <div v-if="showDeleteTherapistModal" class="modal-overlay" @click.self="showDeleteTherapistModal = false">
    <div class="modal-content shadow-lg p-4 rounded bg-white" style="width: 420px; max-width: 90%">
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
          <button class="btn btn-outline-danger btn-sm" @click="deleteTherapist(t.id)">🗑️ Delete</button>
        </li>
      </ul>

      <div class="text-center">
        <button class="btn btn-secondary w-100" @click="showDeleteTherapistModal = false">✖ Cancel</button>
      </div>
    </div>
  </div>

  <!-- Change Password Modal -->
  <div v-if="showChangePasswordModal" class="modal-overlay" @click.self="showChangePasswordModal = false">
    <div class="modal-content shadow-lg p-4 rounded bg-white" style="width: 400px; max-width: 90%">
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
    <div class="modal-content shadow-lg p-4 rounded bg-white" style="width: 500px; max-width: 95%">
      <h3 class="text-center text-success fw-bold mb-4">🗓️ Change Availability</h3>
      <div
        v-for="day in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']"
        :key="day"
        class="mb-3"
      >
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
    <div class="modal-content shadow-lg p-4 rounded bg-white" style="width: 400px; max-width: 90%">
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

  <div v-if="filteredOutOfOfficeTherapists.length" class="alert alert-warning mt-3">
    <strong>🚫 Unavailable Therapists:</strong>
    <ul class="mb-0 ps-3">
      <li v-for="t in filteredOutOfOfficeTherapists" :key="t.id">
        <strong>{{ t.name }}</strong> :
        <em>{{ getReturnDate(t.outOfOffice.start) }}</em>
        ⇨
        <em>{{ getReturnDate(t.outOfOffice.end) }}</em>
      </li>
    </ul>
  </div>

  <!-- FullCalendar component -->
  <HorizontalTherapistWeekView
    v-if="isHorizontalView"
    :therapists="therapists.filter(t => t.name !== 'Admin')"
    :allEvents="filteredEvents"
  />

  <FullCalendar v-else ref="fullCalendar" :options="calendarOptions" />

  <!-- Footer -->
  <footer class="bg-light text-center py-4">
    <p class="mb-0 text-muted">© 2025 HWG Scheduler. Enjoy!</p>
  </footer>
</template>
