<template>
  <div class="horizontal-scroll-container">
    <div
      v-for="therapist in therapists"
      :key="therapist.id"
      :id="`therapist-${therapist.name}`"
      class="therapist-column"
    >
      <div class="therapist-wrapper">
        <h5 class="therapist-name">{{ therapist.name }}</h5>
        <div class="therapist-calendar-box">
          <FullCalendar
            class="mini-calendar"
            :options="getCalendarOptions(therapist)"
          />
        </div>
      </div>
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
        slotMinTime: '09:00:00',
        slotMaxTime: '18:00:00',
        height: 320,
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

.mini-calendar :deep(.fc-scroller-liquid-absolute) {
  overflow-y: hidden !important;
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

.therapist-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 320px;
}

.therapist-name {
  margin-bottom: 0.5rem;
  font-size: 14px;
  font-weight: 600;
}

.therapist-calendar-box {
  border: 1px solid #ccc;
  border-radius: 10px;
  padding: 0.3rem;
  background: #fff;
}

</style>
