<template>
  <div class="horizontal-scroll-container">
    <div
      v-for="therapist in therapists.filter(t => t.name !== 'Admin')"
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
        allDaySlot: false,
        slotMinTime: '07:00:00',
        slotMaxTime: '21:00:00',
        slotDuration: '00:30:00',
        height: 280,
        events: this.allEvents
          .filter(e => e.extendedProps?.therapist === therapist.name)
          .map(e => ({
            ...e,
            title: e.extendedProps?.client || 'Unknown Client'
          })),
        eventContent(arg) {
            return { html: `<div class="fc-event-title">${arg.event.title}</div>` };
          }
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

.therapist-column {
  min-width: 300px;
  max-width: 320px;
  flex: 0 0 auto;
}

.therapist-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.therapist-name {
  margin-bottom: 0.5rem;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  color: #333;
}

.therapist-calendar-box {
  width: 100%;
  border: 1px solid #ccc;
  border-radius: 10px;
  background: #fff;
  padding: 0.3rem;
}

/* Mini calendar styling */
.mini-calendar :deep(.fc) {
  font-size: 12px;
}
.mini-calendar :deep(.fc-timegrid-slot) {
  padding: 1px 2px !important;
  line-height: 1 !important;
  height: 1.3em !important;
}

.mini-calendar :deep(.fc-timegrid-slot-label) {
  font-size: 10px !important;
  padding: 0 2px !important;
}

.mini-calendar :deep(.fc-event) {
  font-size: 10px !important;
  padding: 1px 3px !important;
  border-radius: 4px;
}

.mini-calendar :deep(.fc-col-header-cell-cushion) {
  font-size: 11px !important;
  padding: 2px 4px !important;
  font-weight: 600;
  color: #3c3c3c;
}

.mini-calendar :deep(.fc-daygrid-day-number) {
  font-size: 10px !important;
}

.mini-calendar :deep(.fc-event-title) {
  font-size: 9px;
  padding: 0;
  line-height: 1.2;
  white-space: normal;
}
</style>
