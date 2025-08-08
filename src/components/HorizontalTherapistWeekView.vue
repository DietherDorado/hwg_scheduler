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
import tippy from 'tippy.js'

function formatTime(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

export default {
  components: { FullCalendar },
  props: {
    therapists: Array,
    allEvents: Array
  },
  methods: {
    getCalendarOptions(therapist) {
      const today = new Date()
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()))
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(endOfWeek.getDate() + 6)

      const sessionEvents = this.allEvents
        .filter(e => e.extendedProps?.therapist === therapist.name)
        .map(e => ({
          ...e,
          title: e.extendedProps?.client || 'Unknown Client',
          extendedProps: {
            ...e.extendedProps,
            tooltip: `
              <strong>Client:</strong> ${e.extendedProps?.client || 'Unknown'}<br/>
              <strong>Service:</strong> ${e.extendedProps?.service || 'N/A'}<br/>
              <strong>Room:</strong> ${e.extendedProps?.room || 'N/A'}<br/>
              <strong>Time:</strong> ${formatTime(e.start)} – ${formatTime(e.end)}
            `
          }
        }))

      const backgroundEvents = this.getUnavailableBlocks(therapist, new Date(startOfWeek), new Date(endOfWeek))

      return {
        plugins: [timeGridPlugin, interactionPlugin],
        initialView: 'timeGridWeek',
        headerToolbar: false,
        allDaySlot: false,
        slotMinTime: '07:00:00',
        slotMaxTime: '21:00:00',
        slotDuration: '00:30:00',
        height: 280,
        events: [...sessionEvents, ...backgroundEvents],
        eventDidMount(info) {
          tippy(info.el, {
            content: info.event.extendedProps.tooltip,
            allowHTML: true,
            theme: 'light', // optional theme
            placement: 'top',
            delay: [100, 0],
            maxWidth: 250
          });
        },
        eventContent(arg) {
          return { html: `<div>${arg.event.title}</div>` };
        }
      }
    },
    getUnavailableBlocks(therapist, startDate, endDate) {
          const unavailableEvents = [];
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

          for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
            const dayName = dayNames[d.getDay()];
            const availableBlocks = therapist.availability?.[dayName] || [];

            const fullDayStart = new Date(d);
            fullDayStart.setHours(7, 0, 0);

            const fullDayEnd = new Date(d);
            fullDayEnd.setHours(21, 0, 0);

            let lastEnd = new Date(fullDayStart);

            for (const block of availableBlocks) {
              const blockStart = new Date(d);
              const [startHour, startMin] = block.start.split(':');
              blockStart.setHours(+startHour, +startMin);

              if (blockStart > lastEnd) {
                unavailableEvents.push({
                  start: new Date(lastEnd),
                  end: new Date(blockStart),
                  display: 'background',
                  classNames: ['unavailable-slot']
                });
              }

              const blockEnd = new Date(d);
              const [endHour, endMin] = block.end.split(':');
              blockEnd.setHours(+endHour, +endMin);
              lastEnd = new Date(blockEnd);
            }

            if (lastEnd < fullDayEnd) {
              unavailableEvents.push({
                start: new Date(lastEnd),
                end: new Date(fullDayEnd),
                display: 'background',
                classNames: ['unavailable-slot']
              });
            }
          }

          return unavailableEvents;
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

.mini-calendar :deep(.fc-event.unavailable-slot) {
  background-color: #ccc !important;
  opacity: 0.4 !important;
  border: none !important;
  pointer-events: none;
  color: transparent !important;
}

/* Add this to your global styles or <style scoped> */
.tippy-box[data-theme~='light'] {
  border: 1px solid #ccc;
  font-size: 13px;
  line-height: 1.4;
}

.fc-event.unavailable-slot {
  background-color: #d3d3d3 !important;
  opacity: 0.4;
  border: none;
  pointer-events: none;
}

</style>
