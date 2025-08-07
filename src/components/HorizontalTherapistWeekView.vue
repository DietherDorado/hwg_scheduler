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
        height: 'auto',
        slotMinTime: '07:00:00',
        slotMaxTime: '21:00:00',
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
.therapist-column {
  min-width: 320px;
  flex: 0 0 auto;
  border: 1px solid #ccc;
  border-radius: 10px;
  background: #fff;
  padding: 0.5rem;
}
</style>
