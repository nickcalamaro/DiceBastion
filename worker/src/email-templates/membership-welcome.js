// Membership Welcome Email Template
// Trigger: New membership purchase confirmation

// UTM Parameter Helper (imported from main file)
function addUtmParams(url, source = 'email', medium = 'transactional', campaign = null) {
  try {
    const baseUrl = new URL(url.startsWith('http') ? url : `https://${url}`)
    baseUrl.searchParams.set('utm_source', source)
    baseUrl.searchParams.set('utm_medium', medium)
    if (campaign) baseUrl.searchParams.set('utm_campaign', campaign)
    return baseUrl.toString()
  } catch (e) {
    console.error('UTM parameter error:', e)
    return url
  }
}

export function getWelcomeEmail(membership, user, autoRenew) {
  const planNames = { monthly: 'Monthly', quarterly: 'Quarterly', annual: 'Annual' }
  const planName = planNames[membership.plan] || membership.plan
  
  return {
    subject: `Welcome to Dice Bastion ${planName} Membership!`,
    html: `
      <h2>Welcome to Dice Bastion!</h2>
      <p>Hi ${user.name || 'there'},</p>
      <p>Thank you for becoming a <strong>${planName} Member</strong>!</p>
      <ul>
        <li><strong>Plan:</strong> ${planName}</li>
        <li><strong>Valid Until:</strong> ${new Date(membership.end_date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</li>
        <li><strong>Auto-Renewal:</strong> ${autoRenew ? 'Enabled ✓' : 'Disabled'}</li>
      </ul>
      ${autoRenew ? '<p>Your membership will automatically renew before expiration. You can manage this at any time from your <a href="' + addUtmParams('https://dicebastion.com/account', 'email', 'transactional', 'welcome') + '">account page</a>.</p>' : '<p>Remember to renew your membership before it expires to continue enjoying member benefits!</p>'}
      <p><strong>Member Benefits:</strong></p>
      <ul>
        <li>Discounted event tickets</li>
        <li>Priority booking for tournaments</li>
        <li>Exclusive member events</li>
        <li>And much more!</li>
      </ul>
      <p>See you at the club!</p>
      <p>— The Dice Bastion Team</p>
    `,
    text: `
Welcome to Dice Bastion ${planName} Membership!

Hi ${user.name || 'there'},

Thank you for becoming a ${planName} Member!

Plan: ${planName}
Valid Until: ${new Date(membership.end_date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
Auto-Renewal: ${autoRenew ? 'Enabled' : 'Disabled'}

${autoRenew ? 'Your membership will automatically renew before expiration. Manage at: https://dicebastion.com/account' : 'Remember to renew your membership before it expires.'}

Member Benefits:
- Discounted event tickets
- Priority booking for tournaments
- Exclusive member events
- And much more!

See you at the club!

— The Dice Bastion Team
    `.trim()
  }
}