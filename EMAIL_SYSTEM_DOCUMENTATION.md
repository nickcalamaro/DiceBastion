# 📧 Dice Bastion Email System Documentation

## 📋 Overview

This document provides comprehensive documentation of the Dice Bastion email system, including current functionality, email templates, triggers, and planned enhancements.

## 🎯 Current Email System

### Email Service Provider
- **Provider**: MailerSend
- **API Integration**: REST API via `MAILERSEND_API_KEY`
- **Configuration**: Environment variables for flexibility

### Email Configuration
```
MAILERSEND_API_KEY - API key for MailerSend service
MAILERSEND_FROM_EMAIL - Default from email (e.g., "noreply@dicebastion.com")
MAILERSEND_FROM_NAME - Default from name (e.g., "Dice Bastion")
```

## 📧 Email Templates & Triggers

### 1. Membership Welcome Email
**Template**: `getWelcomeEmail()`
**Trigger**: New membership purchase confirmation
**Recipients**: New members
**Content**:
- Welcome message
- Membership plan details
- Validity period
- Auto-renewal status
- Member benefits list
- Account management link

### 2. Membership Renewal Success Email
**Template**: `getRenewalSuccessEmail()`
**Trigger**: Successful auto-renewal payment
**Recipients**: Members with auto-renewal enabled
**Content**:
- Renewal confirmation
- New end date
- Payment amount
- Auto-renewal reminder
- Account management link

### 3. Upcoming Renewal Reminder Email
**Template**: `getUpcomingRenewalEmail()`
**Trigger**: 7 days before auto-renewal (cron job)
**Recipients**: Members with active auto-renewal
**Content**:
- Renewal date reminder
- Payment method details
- Update payment method link
- Cancel auto-renewal option

### 4. Renewal Failed Email
**Template**: `getRenewalFailedEmail()`
**Trigger**: Failed auto-renewal payment (attempts 1 & 2)
**Recipients**: Members with failed payments
**Content**:
- Payment failure notification
- Attempts remaining
- Troubleshooting steps
- Update payment method link
- Support contact

### 5. Renewal Failed Final Email
**Template**: `getRenewalFailedFinalEmail()`
**Trigger**: After 3 failed renewal attempts
**Recipients**: Members with disabled auto-renewal
**Content**:
- Auto-renewal disabled notification
- Expiration date reminder
- Purchase new membership link
- Re-enable auto-renewal option
- Support contact

### 6. Shop Order Confirmation Email
**Template**: `generateShopOrderEmail()`
**Trigger**: Shop order payment confirmation
**Recipients**: Shop customers
**Content**:
- Order confirmation
- Invoice with itemized breakdown
- Delivery/collection information
- Pre-order notices (if applicable)
- Order notes
- Support contact
- Professional HTML design with branding

### 7. Event Ticket Confirmation Email
**Template**: `getTicketConfirmationEmail()`
**Trigger**: Event ticket purchase confirmation
**Recipients**: Event attendees
**Content**:
- Ticket confirmation
- Event details (date, time, location)
- Payment details
- Check-in instructions
- Event description
- Additional event information

## 🔧 Technical Implementation

### Email Sending Function
```javascript
// Location: worker/src/index.js
async function sendEmail(env, { to, subject, html, text }) {
  // Uses MailerSend API
  // Handles errors gracefully
  // Returns success/failure status
}
```

### Error Handling
- ✅ Email failures don't break transactions
- ✅ Errors are logged for debugging
- ✅ Fallback text version generated from HTML
- ✅ Graceful degradation if MailerSend unavailable

### Email Delivery Flow
1. **Trigger Event** (purchase, renewal, etc.)
2. **Generate Email Content** (template function)
3. **Send via MailerSend API** (sendEmail function)
4. **Handle Response** (log success/failure)
5. **Continue Transaction** (email failure doesn't stop process)

## 📊 Email Statistics & Tracking

### Current Tracking
- ✅ Email send success/failure logging
- ✅ Basic error tracking
- ❌ No open/click tracking
- ❌ No UTM parameters
- ❌ No comprehensive analytics

### Planned Enhancements
- UTM parameters for link tracking
- Email open/click tracking
- Delivery success rates
- Bounce tracking

## 🛠️ Email Template Management

### Current Structure
- Templates are inline in worker code
- HTML and text versions for each email
- Consistent branding and styling
- Responsive design

### Planned Improvements
- Separate template files for easier maintenance
- Template versioning
- A/B testing capability
- Dynamic content insertion

## 📁 Email History & Records

### Current State
- ❌ No email history stored
- ❌ No sent email records
- ❌ No customer email preferences
- ✅ Transaction records include email status

### Planned Enhancements
- Email history database table
- Sent email tracking
- Customer email preferences
- Resend capability

## 🧪 Email Testing

### Current Testing
- Manual testing during development
- Error logging for debugging
- No automated testing

### Planned Enhancements
- Email preview endpoint
- Test email sending
- Template validation
- Spam score checking

## 🚀 Enhancement Roadmap

### Phase 1: Core Improvements
1. **UTM Parameters** - Add tracking to email links
2. **Template Files** - Move templates to separate files
3. **Email Testing** - Add preview/test endpoints
4. **Email History** - Track sent emails in database

### Phase 2: Advanced Features
1. **Email Preferences** - Customer preference management
2. **Analytics Dashboard** - Email performance tracking
3. **A/B Testing** - Template optimization
4. **Unsubscribe Management** - Compliance features

### Phase 3: Integration & Automation
1. **CRM Integration** - Connect with customer management
2. **Marketing Automation** - Drip campaigns
3. **Personalization Engine** - Dynamic content
4. **Multi-language Support** - Internationalization

## 📝 Maintenance & Support

### Monitoring
- Check email logs regularly
- Monitor MailerSend dashboard
- Watch for delivery failures

### Troubleshooting
1. **Email Not Sent**: Check MailerSend API status
2. **Delivery Failures**: Verify recipient email addresses
3. **Template Errors**: Validate HTML content
4. **Configuration Issues**: Verify environment variables

### Backup & Recovery
- Email templates are in version control
- Database backups include transaction records
- MailerSend provides email delivery logs

## 🔒 Security & Compliance

### Data Protection
- ✅ No sensitive data in emails
- ✅ Email addresses handled securely
- ✅ Compliance with privacy regulations
- ✅ Proper error handling prevents data leaks

### Best Practices
- Use HTTPS for all email-related endpoints
- Validate all email inputs
- Rate limit email sending
- Monitor for abuse

## 📚 Resources

### MailerSend Documentation
- [MailerSend API Docs](https://developers.mailersend.com/)
- [Email Best Practices](https://www.mailersend.com/blog/email-best-practices)

### Email Design Resources
- [HTML Email Guidelines](https://www.campaignmonitor.com/dev-resources/)
- [Email Accessibility](https://www.a11yproject.com/checklist/#email)

### Cloudflare Workers
- [Workers Documentation](https://developers.cloudflare.com/workers/)
- [D1 Database Guide](https://developers.cloudflare.com/d1/)

## 📅 Changelog

### [Upcoming] - Email System Enhancements
- Added UTM parameters for tracking
- Created separate template files
- Added email testing endpoints
- Implemented email history tracking
- Added email preferences management

### [Current] - Initial Implementation
- MailerSend integration
- 7 email templates
- Robust error handling
- Transactional email workflows

## 🤝 Support

For email system issues or questions:
- **Primary Contact**: support@dicebastion.com
- **Technical Issues**: dev@dicebastion.com
- **MailerSend Support**: support@mailersend.com

## 📋 License

This documentation is for internal use by Dice Bastion team members only.

© 2024 Dice Bastion Gibraltar. All rights reserved.