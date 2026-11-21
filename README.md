AUTO VERSE — Vercel project

## Open in VS Code and upload to GitHub

Open the outputs folder as the project folder in VS Code. The main source files are index.html, assets/styles.css, and assets/app.js. The assets folder also holds the brand logos, contact form scripts, and private admin UI scripts. The api folder contains the Vercel server functions; lib contains private backend helpers; db/schema.sql initializes the car inventory database.

To upload with GitHub Desktop, add this outputs folder as a local repository, commit the files, and publish it to a private or public GitHub repository. If using GitHub web upload, upload the contents of outputs into the repository root. Do not upload environment secrets. The .gitignore excludes local .env files.

For Vercel, import that GitHub repository. Set Root Directory to . if you uploaded outputs contents into the repository root; set it to outputs only if the repository contains outputs as a subfolder. Configure Neon Postgres, Vercel Blob, Upstash Redis, and Resend. Run db/schema.sql in Neon.

Copy values from .env.example into Vercel Project Settings → Environment Variables. Generate ADMIN_PASSWORD_HASH locally with:
node -e "require('bcryptjs').hash('YOUR-STRONG-PASSWORD',12).then(console.log)"
Set a unique AUTH_SECRET of 32+ random characters. Never commit real API keys, passwords, or .env.local.

Set CONTACT_TO=info@autoverse.es,admin@autoverse.es to deliver enquiries to both inboxes. EMAIL_FROM must use the verified sending domain in Resend.

Add autoverse.es to the Vercel project and copy the exact DNS records Vercel shows into Piensa Solutions. Preserve existing MX records. Vercel does not host mailboxes; create info@, admin@ and ceo@ with Piensa Solutions or another email provider. Resend sends messages from the contact form; it is not an inbox.

The homepage has basic SEO for Barcelona. A physical address, phone and Google Business Profile were not available, so they are not invented. Add those real details and a verified business profile later. Search position cannot be guaranteed.

Privacy and legal pages are drafts: replace them with AUTO VERSE legal identity and reviewed privacy terms before activating the public contact form. Do not publish sample inventory from the old prototype; add actual vehicles through /admin.
