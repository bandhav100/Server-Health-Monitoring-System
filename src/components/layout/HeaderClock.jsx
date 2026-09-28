import React, { useState, useEffect } from 'react';
import { useSettings } from '../../context/SettingsContext';

/**
 * Format a Date object into 12-hour or 24-hour time string
 * using the user's current local browser time.
 */
function formatTime(date, timeFormat) {
  const is12h = timeFormat === '12h';

  try {
    if (is12h) {
      return new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).format(date);
    } else {
      return new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(date);
    }
  } catch {
    return date.toLocaleTimeString();
  }
}

/**
 * Format a Date object into compact date string (e.g. "12 Sep 2026")
 * using the user's current local browser time.
 */
function formatDate(date) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).formatToParts(date);

    const day = parts.find((p) => p.type === 'day')?.value || '';
    const month = parts.find((p) => p.type === 'month')?.value || '';
    const year = parts.find((p) => p.type === 'year')?.value || '';
    return `${day} ${month} ${year}`.trim();
  } catch {
    return date.toLocaleDateString();
  }
}

/**
 * HeaderClock component:
 * Displays real-time digital clock synchronized with user's local system time
 * and respects Settings for 12-hour (AM/PM) vs 24-hour display.
 * Renders immediately before the Theme Toggle on the global header.
 */
const HeaderClock = () => {
  const { settings } = useSettings();
  const [currentTime, setCurrentTime] = useState(() => new Date());

  // Efficient single interval that updates every second and cleans up on unmount
  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timerId);
    };
  }, []);

  const timeFormat = settings?.time_format || '24h';

  const timeString = formatTime(currentTime, timeFormat);
  const dateString = formatDate(currentTime);

  return (
    <div
      className="header-clock cursor-default select-none transition-colors"
      role="timer"
      aria-label="Current time"
      title="Current local time"
    >
      <span className="header-clock-time leading-none tracking-tight">
        {timeString}
      </span>
      <span className="header-clock-date leading-none tracking-wide">
        {dateString}
      </span>
    </div>
  );
};

export default HeaderClock;
