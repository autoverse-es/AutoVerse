# AUTO VERSE website

This folder is the full website source. It includes the public car listing site, contact page, private admin area, Vercel API functions, and the database schema.

## Publish it again

1. Extract this ZIP. In GitHub Desktop, create a new repository from the extracted `AUTO-VERSE-WEBSITE` folder, then publish it to GitHub.
2. In Vercel, create a new project and import that GitHub repository. Leave the Root Directory as `.`. This is a static Vercel project with serverless functions; do not choose a framework preset.
3. Add the environment variables listed in `.env.example` under Vercel → Project Settings → Environment Variables. Set them for Production (and Preview if you will use Preview deployments).
4. Run `db/schema.sql` once in the Neon SQL Editor. Use the Neon pooled `DATABASE_URL` value in Vercel.
5. Connect Vercel Blob and Upstash Redis to the Vercel project so their environment variables are added automatically.
6. Deploy. First test the public homepage, then open `/admin` and sign in with your configured username and password.
7. Add `autoverse.es` to the Vercel project's Domains page and follow the exact DNS instructions shown there in Piensa Solutions. Preserve existing email MX records.

## Admin password setup

Set `ADMIN_USERNAME` to your chosen admin login name. Generate a bcrypt password hash locally from this folder after installing dependencies:

```powershell
npm.cmd install
node -e "require('bcryptjs').hash('REPLACE-WITH-YOUR-PASSWORD',12).then(console.log)"
```

Put the printed hash in `ADMIN_PASSWORD_HASH`. Put a new, random secret of at least 32 characters in `AUTH_SECRET`. Never put the plain password or secret in GitHub. If PowerShell blocks `npm`, use `npm.cmd` as shown above.

## Contact email

The contact page is included. Sending messages requires Resend, which can be connected later. Until `RESEND_API_KEY`, `EMAIL_FROM`, and `CONTACT_TO` are configured, the form cannot deliver email. Mailboxes such as `info@autoverse.es` must be created with your email provider; Resend is a sending service, not an inbox.

## Notes

- The website is for your own inventory. Visitors cannot list cars for sale.
- Photos uploaded through `/admin` are stored in Vercel Blob.
- Car records are stored in Neon.
- Admin access is protected by a login and session cookie. Keep the environment secrets private.
- Add your real address, phone, and reviewed legal/privacy details before relying on the site as a live business website. These details were not provided, so the website does not invent them.
- Search ranking cannot be guaranteed; local business information and a verified Google Business Profile can help once available.
