// Recurring event utilities

/**
 * Determine the UTC offset for Europe/Gibraltar at a given UTC date.
 * Gibraltar uses CET (UTC+1) in winter and CEST (UTC+2) in summer.
 * DST starts last Sunday in March at 01:00 UTC, ends last Sunday in October at 01:00 UTC.
 */
function getGibraltarOffsetHours(date) {
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth() // 0-indexed

  // January, February, November, December → CET (UTC+1)
  if (month < 2 || month > 9) return 1
  // April–September → CEST (UTC+2)
  if (month > 2 && month < 9) return 2

  // March: DST starts last Sunday at 01:00 UTC
  if (month === 2) {
    const lastDay = new Date(Date.UTC(year, 3, 0)).getUTCDate() // last day of March
    const lastDayDow = new Date(Date.UTC(year, 2, lastDay)).getUTCDay()
    const lastSunday = lastDay - lastDayDow
    const switchDate = Date.UTC(year, 2, lastSunday, 1, 0, 0) // March last-Sun 01:00 UTC
    return date.getTime() >= switchDate ? 2 : 1
  }

  // October: DST ends last Sunday at 01:00 UTC
  if (month === 9) {
    const lastDay = new Date(Date.UTC(year, 10, 0)).getUTCDate() // last day of October
    const lastDayDow = new Date(Date.UTC(year, 9, lastDay)).getUTCDay()
    const lastSunday = lastDay - lastDayDow
    const switchDate = Date.UTC(year, 9, lastSunday, 1, 0, 0) // Oct last-Sun 01:00 UTC
    return date.getTime() < switchDate ? 2 : 1
  }

  return 1 // fallback
}

/**
 * Build a UTC Date from a local-date + local-time intended for Gibraltar.
 * e.g. year=2026, month=2 (March), day=27, hours=18, minutes=0
 *      → if CET (offset +1), UTC = 17:00 → ISO "2026-03-27T17:00:00.000Z"
 *      → browser in Gibraltar renders this as 18:00 CET ✓
 */
function buildGibraltarDate(year, month, day, hours, minutes) {
  // First estimate with offset=1 to figure out which DST period we're in
  const estimate = new Date(Date.UTC(year, month, day, hours - 1, minutes, 0, 0))
  const offset = getGibraltarOffsetHours(estimate)
  return new Date(Date.UTC(year, month, day, hours - offset, minutes, 0, 0))
}

export function calculateNextOccurrence(event, fromDate = new Date()) {
  if (!event.is_recurring || !event.recurrence_pattern) {
    return new Date(event.event_datetime);
  }

  try {
    const pattern = JSON.parse(event.recurrence_pattern);
    const baseDate = new Date(fromDate);
    baseDate.setUTCHours(0, 0, 0, 0);

    if (event.recurrence_end_date) {
      const endDate = new Date(event.recurrence_end_date);
      if (baseDate > endDate) return null;
    }

    switch (pattern.type) {
      case 'weekly':
        return getNextWeeklyOccurrence(baseDate, pattern);
      case 'monthly_day':
        return getNextMonthlyDayOccurrence(baseDate, pattern);
      case 'monthly_date':
        return getNextMonthlyDateOccurrence(baseDate, pattern);
      default:
        return new Date(event.event_datetime);
    }
  } catch (e) {
    console.error('Error parsing recurrence pattern:', e);
    return new Date(event.event_datetime);
  }
}

function getNextWeeklyOccurrence(fromDate, pattern) {
  // pattern: {type:"weekly", day:0-6, time:"HH:MM"}
  const targetDay = pattern.day; // 0=Sunday, 6=Saturday
  const [hours, minutes] = pattern.time.split(':').map(Number);
  
  const result = new Date(fromDate);
  const currentDay = result.getUTCDay();
  
  // Days until target day
  let daysToAdd = targetDay - currentDay;
  if (daysToAdd < 0) daysToAdd += 7;
  if (daysToAdd === 0 && result > fromDate) daysToAdd = 7;
  
  const targetDate = new Date(result);
  targetDate.setUTCDate(targetDate.getUTCDate() + daysToAdd);
  
  return buildGibraltarDate(
    targetDate.getUTCFullYear(),
    targetDate.getUTCMonth(),
    targetDate.getUTCDate(),
    hours,
    minutes
  );
}

function getNextMonthlyDayOccurrence(fromDate, pattern) {
  // pattern: {type:"monthly_day", week:1-5 (1=first, 5=last), day:0-6, time:"HH:MM"}
  const [hours, minutes] = pattern.time.split(':').map(Number);
  
  let result = new Date(fromDate);
  result.setUTCDate(1); // Start at first of month
  
  // Try current month first, then next month
  for (let attempt = 0; attempt < 2; attempt++) {
    const occurrence = getNthDayOfMonth(result.getUTCFullYear(), result.getUTCMonth(), pattern.week, pattern.day);
    if (!occurrence) {
      result.setUTCMonth(result.getUTCMonth() + 1);
      continue;
    }
    
    const withTime = buildGibraltarDate(
      occurrence.getUTCFullYear(),
      occurrence.getUTCMonth(),
      occurrence.getUTCDate(),
      hours,
      minutes
    );
    
    if (withTime >= fromDate) {
      return withTime;
    }
    
    // Move to next month
    result.setUTCMonth(result.getUTCMonth() + 1);
  }
  
  return result;
}

function getNthDayOfMonth(year, month, week, dayOfWeek) {
  // week: 1=first, 2=second, 3=third, 4=fourth, 5=last
  // dayOfWeek: 0=Sunday, 6=Saturday
  
  if (week === 5) {
    // Last occurrence
    const lastDay = new Date(Date.UTC(year, month + 1, 0));
    const lastDayOfWeek = lastDay.getUTCDay();
    let diff = lastDayOfWeek - dayOfWeek;
    if (diff < 0) diff += 7;
    lastDay.setUTCDate(lastDay.getUTCDate() - diff);
    return lastDay;
  }
  
  // First, second, third, or fourth occurrence
  const firstDay = new Date(Date.UTC(year, month, 1));
  const firstDayOfWeek = firstDay.getUTCDay();
  
  let daysToAdd = dayOfWeek - firstDayOfWeek;
  if (daysToAdd < 0) daysToAdd += 7;
  
  daysToAdd += (week - 1) * 7;
  
  const result = new Date(Date.UTC(year, month, 1 + daysToAdd));
  
  // Make sure we didn't overflow into next month
  if (result.getUTCMonth() !== month) {
    return null;
  }
  
  return result;
}

function getNextMonthlyDateOccurrence(fromDate, pattern) {
  // pattern: {type:"monthly_date", date:1-31, time:"HH:MM"}
  const targetDate = pattern.date;
  const [hours, minutes] = pattern.time.split(':').map(Number);
  
  let year = fromDate.getUTCFullYear();
  let month = fromDate.getUTCMonth();
  
  let result = buildGibraltarDate(year, month, targetDate, hours, minutes);
  
  // If this month's date has passed, go to next month
  if (result < fromDate) {
    month++;
    if (month > 11) { month = 0; year++; }
    result = buildGibraltarDate(year, month, targetDate, hours, minutes);
  }
  
  // Handle months that don't have this date (e.g., Feb 30)
  if (result.getUTCDate() !== targetDate) {
    month++;
    if (month > 11) { month = 0; year++; }
    result = buildGibraltarDate(year, month, targetDate, hours, minutes);
  }
  
  return result;
}

export function getUpcomingOccurrences(event, count = 3) {
  const occurrences = [];
  let nextDate = new Date();
  
  for (let i = 0; i < count; i++) {
    const occurrence = calculateNextOccurrence(event, nextDate);
    if (!occurrence) break;
    
    occurrences.push(occurrence);
    
    // Move to day after this occurrence for next calculation
    nextDate = new Date(occurrence);
    nextDate.setDate(nextDate.getDate() + 1);
  }
  
  return occurrences;
}
