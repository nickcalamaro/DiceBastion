/**
 * Event Reminder Email Template
 * Sent 1 day before the event to remind attendees
 */

export function getEventReminderEmail(event, user, ticket) {
  const eventDate = new Date(event.event_datetime)
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit'
  }
  const formattedDate = eventDate.toLocaleDateString('en-GB', options)
  
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Event Reminder: ${event.event_name}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .event-title { font-size: 28px; margin-bottom: 10px; }
        .event-date { font-size: 20px; font-weight: bold; color: #667eea; margin: 20px 0; }
        .reminder-box { background: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 25px 0; }
        .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .footer { margin-top: 30px; font-size: 14px; color: #666; text-align: center; }
        .ticket-info { background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="event-title">⏰ Event Reminder: ${event.event_name}</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Don't forget! Your event is tomorrow!</p>
        </div>
        
        <div class="content">
            <p>Hi ${user.name || 'there'},</p>
            
            <p>Just a friendly reminder that <strong>${event.event_name}</strong> is happening <strong>tomorrow</strong>! We're excited to see you there.</p>
            
            <div class="event-date">
                📅 ${formattedDate}
            </div>
            
            <div class="reminder-box">
                <h3 style="margin-top: 0;">📍 Event Location</h3>
                <p>${event.location || 'TBD - Check our website for updates'}</p>
                
                ${event.requires_purchase ? '' : '<p><strong>This is a free event - no ticket needed!</strong></p>'}
            </div>
            
            ${ticket ? `
            <div class="ticket-info">
                <h3 style="margin-top: 0;">🎟️ Your Ticket Information</h3>
                <p><strong>Order Reference:</strong> ${ticket.order_ref}</p>
                <p><strong>Ticket Status:</strong> ${ticket.status === 'confirmed' ? '✅ Confirmed' : ticket.status}</p>
                ${event.membership_price ? '<p><strong>You got the member discount!</strong></p>' : ''}
            </div>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="https://dicebastion.com/events" class="cta-button">View Event Details</a>
            </div>
                            
            <h3>🚨 Important Notes</h3>
            <ul>
                <li><strong>Arrival Time:</strong> Please arrive 15-30 minutes early for check-in</li>
                <li><strong>Cancellation Policy:</strong> Please let us know ASAP if you won't be able to attend</li>
                <li><strong>Any questions?</strong> Reach out to us via WhatsApp or drop us an email and we'll make sure to get back to you as soon as we can!</li>
            </ul>
            
            <p>We can't wait to see you there!</p>
                        
            <p><strong>The Gibraltar Dice Bastion Team</strong></p>
            
            <div class="footer">
                <p>Dice Bastion | Gibraltar's  premier location for board games, wargames, card games and RPGs!</p>
                <p><a href="https://dicebastion.com" style="color: #667eea;">dicebastion.com</a> | <a href="mailto:info@dicebastion.com" style="color: #667eea;">info@dicebastion.com</a></p>
                <p style="font-size: 12px; margin-top: 10px;">You're receiving this email because you registered for ${event.event_name}.</p>
            </div>
        </div>
    </div>
</body>
</html>
  `
  
  return {
    subject: `⏰ Reminder: ${event.event_name} is tomorrow!`,
    html: htmlContent
  }
}
