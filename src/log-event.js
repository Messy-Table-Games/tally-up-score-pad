/**
 * Logs events for analytics.
 * In production, sends to Simple Analytics.
 * In development, logs to console.
 * @param {string} eventName - The name of the event.
 * @param {object} data - Optional data object with properties and values.
 */
export function LogEvent(eventName, data = null) {
  if (APP_ENV === 'production') {
    // Send to Simple Analytics if available
    if (typeof window !== 'undefined' && window.sa_event) {
      if (data) {
        window.sa_event(eventName, data);
      } else {
        window.sa_event(eventName);
      }
    }
  } else {
    // Log to console in development
    if (data) {
      console.log(`LogEvent: ${eventName}`, data);
    } else {
      console.log(`LogEvent: ${eventName}`);
    }
  }
}
