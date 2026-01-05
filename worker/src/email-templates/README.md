# Email Templates

This directory contains all email templates for the Dice Bastion system.

## Template Files

- `membership-welcome.js` - Welcome email for new members
- `membership-renewal-success.js` - Renewal confirmation email
- `membership-renewal-reminder.js` - Upcoming renewal reminder
- `membership-renewal-failed.js` - Payment failure notification
- `membership-renewal-final-failed.js` - Final failure notification
- `event-ticket-confirmation.js` - Event ticket confirmation
- `shop-order-confirmation.js` - Shop order confirmation

## Usage

Each template exports a function that returns an email object with:
- `subject`: Email subject line
- `html`: HTML version of the email
- `text`: Plain text version of the email

## Template Structure

```javascript
// Example template structure
export function getTemplateName(params) {
  return {
    subject: "Email Subject",
    html: "<html>...</html>",
    text: "Plain text version..."
  }
}
```

## Testing

Templates can be tested using the email preview endpoint:
- `/admin/email/preview` - Preview email templates
- `/admin/email/test` - Send test emails

## Best Practices

1. Keep HTML simple and responsive
2. Include both HTML and text versions
3. Use UTM parameters for tracking links
4. Follow email accessibility guidelines
5. Test templates across email clients