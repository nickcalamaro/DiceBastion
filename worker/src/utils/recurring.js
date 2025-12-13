// Recurring event utilities
export function calculateNextOccurrence(event, fromDate = new Date()) {
  if (!event.is_recurring || !event.recurrence_pattern) {
    return new Date(event.event_datetime);
  }

  try {
    const pattern = JSON.parse(event.recurrence_pattern);
    const baseDate = new Date(fromDate);
    baseDate.setHours(0, 0, 0, 0);

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
  const currentDay = result.getDay();
  
  // Days until target day
  let daysToAdd = targetDay - currentDay;
  if (daysToAdd < 0) daysToAdd += 7;
  if (daysToAdd === 0 && result > fromDate) daysToAdd = 7;
  
  result.setDate(result.getDate() + daysToAdd);
  result.setHours(hours, minutes, 0, 0);
  
  return result;
}

function getNextMonthlyDayOccurrence(fromDate, pattern) {
  // pattern: {type:"monthly_day", week:1-5 (1=first, 5=last), day:0-6, time:"HH:MM"}
  const [hours, minutes] = pattern.time.split(':').map(Number);
  
  let result = new Date(fromDate);
  result.setDate(1); // Start at first of month
  
  // Try current month first, then next month
  for (let attempt = 0; attempt < 2; attempt++) {
    const occurrence = getNthDayOfMonth(result.getFullYear(), result.getMonth(), pattern.week, pattern.day);
    occurrence.setHours(hours, minutes, 0, 0);
    
    if (occurrence >= fromDate) {
      return occurrence;
    }
    
    // Move to next month
    result.setMonth(result.getMonth() + 1);
  }
  
  return result;
}

function getNthDayOfMonth(year, month, week, dayOfWeek) {
  // week: 1=first, 2=second, 3=third, 4=fourth, 5=last
  // dayOfWeek: 0=Sunday, 6=Saturday
  
  if (week === 5) {
    // Last occurrence
    const lastDay = new Date(year, month + 1, 0);
    const lastDayOfWeek = lastDay.getDay();
    let diff = lastDayOfWeek - dayOfWeek;
    if (diff < 0) diff += 7;
    lastDay.setDate(lastDay.getDate() - diff);
    return lastDay;
  }
  
  // First, second, third, or fourth occurrence
  const firstDay = new Date(year, month, 1);
  const firstDayOfWeek = firstDay.getDay();
  
  let daysToAdd = dayOfWeek - firstDayOfWeek;
  if (daysToAdd < 0) daysToAdd += 7;
  
  daysToAdd += (week - 1) * 7;
  
  const result = new Date(year, month, 1 + daysToAdd);
  
  // Make sure we didn't overflow into next month
  if (result.getMonth() !== month) {
    return null;
  }
  
  return result;
}

function getNextMonthlyDateOccurrence(fromDate, pattern) {
  // pattern: {type:"monthly_date", date:1-31, time:"HH:MM"}
  const targetDate = pattern.date;
  const [hours, minutes] = pattern.time.split(':').map(Number);
  
  let result = new Date(fromDate);
  result.setDate(targetDate);
  result.setHours(hours, minutes, 0, 0);
  
  // If this month's date has passed, go to next month
  if (result < fromDate) {
    result.setMonth(result.getMonth() + 1);
    result.setDate(targetDate);
  }
  
  // Handle months that don't have this date (e.g., Feb 30)
  if (result.getDate() !== targetDate) {
    result.setMonth(result.getMonth() + 1);
    result.setDate(targetDate);
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
