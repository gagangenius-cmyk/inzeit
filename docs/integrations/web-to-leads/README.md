# Web-to-Leads integrations

CRM endpoint: `POST https://YOUR-CRM-DOMAIN/api/web-to-leads`

Required fields are a name, email, and phone. The endpoint accepts either generic field names (`fullName`, `email`, `phone`) or Contact Form 7 names (`your-name`, `your-email`, `phonetext-718`). It also accepts optional `Branch`, `DestinationCountry`, `ImmigrationType`, `Education`, `AgeRange`, `LeadSource`, and `UTMSource` fields.

## JavaScript website

Copy `vanilla-js-form.js` to the site, set `CRM_WEB_TO_LEADS_URL`, and call `submitDmcLead(form)` in the website form submit handler. The form fields should use these names:

```html
<form id="dmc-lead-form">
  <input name="fullName" required>
  <input name="email" type="email" required>
  <input name="phone" required>
  <input name="branch" value="Dubai">
  <input name="destinationCountry">
  <input name="immigrationType">
  <button type="submit">Request a callback</button>
</form>
```

Do not add `WEB_TO_LEADS_API_KEY` to browser JavaScript. If the CRM API key is enabled, send requests through a server-side endpoint (as the WordPress plugin does), or use a serverless function.

## WordPress / Contact Form 7

1. Copy `wordpress-dmc-web-to-leads.php` into `wp-content/plugins/dmc-crm-web-to-leads/` and activate it.
2. Add the two constants shown at the top of the plugin to `wp-config.php`.
3. Use these CF7 field names: `your-name`, `your-email`, `phonetext-718`, `menu-404`, `residentCountry`, `menu-3065`, `menu-55692`, `menu-35926`, and `menu-359`.

Set `WEB_TO_LEADS_API_KEY` and `WEB_TO_LEADS_ALLOWED_ORIGIN` in the CRM environment before accepting production traffic. Use the exact WordPress domain for the allowed origin.
