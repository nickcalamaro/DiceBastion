const fs = require('fs');
const path = require('path');

const API_URL = process.env.API_URL || 'https://dicebastion-memberships.ncalamaro.workers.dev';
const EVENTS_DIR = path.join(__dirname, '../content/Events');

// Ensure Events directory exists
if (!fs.existsSync(EVENTS_DIR)) {
  fs.mkdirSync(EVENTS_DIR, { recursive: true });
}

async function fetchEvents() {
  try {
    const response = await fetch(`${API_URL}/events`);
    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching events:', error);
    process.exit(1);
  }
}

function calculateNextOccurrence(event) {
  if (event.is_recurring !== 1 || !event.recurrence_pattern) {
    return new Date(event.event_datetime);
  }
  
  // Parse recurrence pattern
  let pattern;
  try {
    pattern = JSON.parse(event.recurrence_pattern);
  } catch {
    return new Date(event.event_datetime);
  }
  
  const baseDate = new Date(event.event_datetime);
  const now = new Date();
  const timeString = baseDate.toTimeString().split(' ')[0]; // Get HH:MM:SS
  
  // Helper to create date with time
  const createDateTime = (date) => {
    const [hours, minutes] = timeString.split(':');
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return date;
  };
  
  // Weekly recurrence
  if (pattern.type === 'weekly' && pattern.day_of_week !== undefined) {
    const targetDay = pattern.day_of_week;
    const today = now.getDay();
    let daysUntilNext = (targetDay - today + 7) % 7;
    if (daysUntilNext === 0 && now > createDateTime(new Date())) {
      daysUntilNext = 7;
    }
    const nextDate = new Date(now);
    nextDate.setDate(now.getDate() + daysUntilNext);
    return createDateTime(nextDate);
  }
  
  // Monthly by date
  if (pattern.type === 'monthly_date' && pattern.day_of_month) {
    const targetDay = pattern.day_of_month;
    const nextDate = new Date(now.getFullYear(), now.getMonth(), targetDay);
    if (nextDate <= now) {
      nextDate.setMonth(nextDate.getMonth() + 1);
    }
    return createDateTime(nextDate);
  }
  
  // Monthly by week/day (e.g., "3rd Wednesday")
  if (pattern.type === 'monthly_week' && pattern.week_of_month && pattern.day_of_week !== undefined) {
    const findNthWeekday = (year, month, nth, dayOfWeek) => {
      const firstDay = new Date(year, month, 1);
      const firstWeekday = firstDay.getDay();
      const offset = (dayOfWeek - firstWeekday + 7) % 7;
      const day = 1 + offset + (nth - 1) * 7;
      return new Date(year, month, day);
    };
    
    let nextDate = findNthWeekday(now.getFullYear(), now.getMonth(), pattern.week_of_month, pattern.day_of_week);
    if (nextDate <= now) {
      nextDate = findNthWeekday(now.getFullYear(), now.getMonth() + 1, pattern.week_of_month, pattern.day_of_week);
    }
    return createDateTime(nextDate);
  }
  
  return new Date(event.event_datetime);
}

function formatDate(date) {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function generateRecurrenceDescription(event) {
  if (event.is_recurring !== 1 || !event.recurrence_pattern) {
    return '';
  }
  
  let pattern;
  try {
    pattern = JSON.parse(event.recurrence_pattern);
  } catch {
    return '';
  }
  
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const weeks = ['', 'First', 'Second', 'Third', 'Fourth', 'Last'];
  
  if (pattern.type === 'weekly' && pattern.day_of_week !== undefined) {
    return `This event recurs every ${days[pattern.day_of_week]}.`;
  }
  
  if (pattern.type === 'monthly_date' && pattern.day_of_month) {
    return `This event recurs on the ${pattern.day_of_month}${getOrdinalSuffix(pattern.day_of_month)} of each month.`;
  }
  
  if (pattern.type === 'monthly_week' && pattern.week_of_month && pattern.day_of_week !== undefined) {
    return `This event recurs on the ${weeks[pattern.week_of_month]} ${days[pattern.day_of_week]} of each month.`;
  }
  
  return '';
}

function getOrdinalSuffix(num) {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}

function generateEventMarkdown(event) {
  // API returns: id, title, slug, description, full_description, event_datetime, etc.
  const nextDate = new Date(event.event_datetime);
  const formattedDate = formatDate(nextDate);
  const recurrenceDesc = generateRecurrenceDescription(event);
  
  const isFree = event.requires_purchase !== 1;
  const memberPrice = isFree ? 'Free' : `£${(event.membership_price / 100).toFixed(2)}`;
  const nonMemberPrice = isFree ? 'Free' : `£${(event.non_membership_price / 100).toFixed(2)}`;
  
  // Generate SEO-friendly description from available content
  let seoDescription = '';
  if (event.full_description) {
    // Strip HTML and truncate
    seoDescription = event.full_description.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().substring(0, 155);
  } else if (event.description) {
    seoDescription = event.description.substring(0, 155);
  } else {
    seoDescription = `Join us for ${event.title} at ${formattedDate}. ${recurrenceDesc}`.substring(0, 155);
  }
  
  // Add ellipsis if truncated
  if (seoDescription.length === 155) {
    seoDescription += '...';
  }
  
  return `---
title: "${event.title.replace(/"/g, '\\"')}"
date: ${nextDate.toISOString()}
eventId: ${event.id}
slug: "${event.slug || event.id}"
description: "${seoDescription.replace(/"/g, '\\"')}"
location: "${event.location || 'TBA'}"
image: "${event.image_url || '/img/default-event.jpg'}"
requiresPurchase: ${!isFree}
memberPrice: "${memberPrice}"
nonMemberPrice: "${nonMemberPrice}"
capacity: ${event.capacity || 0}
ticketsSold: ${event.tickets_sold || 0}
isRecurring: ${event.is_recurring === 1}
type: "event"
---

## ${event.title}

**${formattedDate}**

${event.location ? `📍 **Location:** ${event.location}` : ''}

${recurrenceDesc ? `🔄 **${recurrenceDesc}**` : ''}

${event.description || ''}

${event.full_description || ''}

---

### Event Details

${isFree ? '✅ **Free Event** - No payment required' : `
💳 **Pricing:**
- Members: ${memberPrice}
- Non-members: ${nonMemberPrice}
`}

${event.capacity ? `
👥 **Capacity:** ${event.tickets_sold || 0} / ${event.capacity} tickets sold
` : ''}

---

[Register for this event](/events#event-${event.id})

*This event information is automatically synchronized from our event management system.*
`;
}

async function syncEvents() {
  console.log('Fetching events from API...');
  const data = await fetchEvents();
  
  // API returns array directly
  const events = Array.isArray(data) ? data : [];
  
  console.log(`Found ${events.length} events`);
  
  // Debug first event structure if available
  if (events.length > 0) {
    console.log('Sample event:', {
      id: events[0].id,
      title: events[0].title,
      slug: events[0].slug,
      is_active: events[0].is_active
    });
  }
  
  // Get existing event files
  const existingFiles = fs.readdirSync(EVENTS_DIR)
    .filter(file => file.endsWith('.md') && file !== '_index.md');
  
  const existingEventIds = new Set(
    existingFiles.map(file => {
      const content = fs.readFileSync(path.join(EVENTS_DIR, file), 'utf8');
      const match = content.match(/eventId: (\d+)/);
      return match ? parseInt(match[1]) : null;
    }).filter(Boolean)
  );
  
  // Generate/update files for active events
  const currentEventIds = new Set();
  events.forEach(event => {
    // API already filters to active events only
    if (!event.title || !event.id) {
      console.log(`Skipping event with missing data:`, event);
      return;
    }
    
    currentEventIds.add(event.id);
    
    const filename = `${event.slug || event.id}.md`;
    const filepath = path.join(EVENTS_DIR, filename);
    const markdown = generateEventMarkdown(event);
    
    fs.writeFileSync(filepath, markdown, 'utf8');
    console.log(`Generated: ${filename} - ${event.title}`);
  });
  
  // Remove files for events that no longer exist or are inactive
  existingFiles.forEach(file => {
    const filepath = path.join(EVENTS_DIR, file);
    const content = fs.readFileSync(filepath, 'utf8');
    const match = content.match(/eventId: (\d+)/);
    const eventId = match ? parseInt(match[1]) : null;
    
    if (eventId && !currentEventIds.has(eventId)) {
      fs.unlinkSync(filepath);
      console.log(`Removed: ${file} (event no longer active)`);
    }
  });
  
  console.log('Event sync complete!');
}

syncEvents().catch(error => {
  console.error('Sync failed:', error);
  process.exit(1);
});
