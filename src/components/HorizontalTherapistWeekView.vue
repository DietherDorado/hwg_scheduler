<template>
  <div class="horizontal-scroll-container">
    <div
      v-for="therapist in therapists"
      :key="therapist.id"
      class="therapist-column"
    >
      <h5 class="text-center">{{ therapist.name }}</h5>
      <FullCalendar
        class="mini-calendar"
        :options="getCalendarOptions(therapist)"
      />
    </div>
  </div>
</template>

<script>
import FullCalendar from '@fullcalendar/vue3'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'

export default {
  components: { FullCalendar },
  props: {
    therapists: Array,
    allEvents: Array
  },
  methods: {
    getCalendarOptions(therapist) {
      return {
        plugins: [timeGridPlugin, interactionPlugin],
        initialView: 'timeGridWeek',
        headerToolbar: false,
        nowIndicator: true,
        allDaySlot: false,
        slotMinTime: '07:00:00',
        slotMaxTime: '21:00:00',
        height: 400,
        slotDuration: '00:30:00',
        slotLabelInterval: '01:00',
        slotLabelFormat: {
            hour: 'numeric',
            minute: '2-digit',
            hour12: false
        },
        events: this.allEvents
          .filter(e => e.extendedProps?.therapist === therapist.name)
          .map(e => ({
            ...e,
            display: 'block'
          }))
      }
    }
  }
}
</script>

<style scoped>
.horizontal-scroll-container {
  display: flex;
  overflow-x: auto;
  gap: 20px;
  padding: 1rem;
}

.mini-calendar :deep(.fc) {
  font-size: 12px;
}
.mini-calendar :deep(.fc-timegrid-slot) {
  padding: 2px 4px !important;
  line-height: 1.1;
}
.mini-calendar :deep(.fc-event) {
  font-size: 11px !important;
  padding: 2px 4px !important;
}

.therapist-column {
  min-width: 300px;
  max-width: 320px;
  flex: 0 0 auto;
  border: 1px solid #ccc;
  border-radius: 10px;
  background: #fff;
  padding: 0.5rem;
}
</style>
