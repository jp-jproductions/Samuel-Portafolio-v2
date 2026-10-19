<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/53083c42-2a6e-4085-ba2b-ce9c52490c94

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Media and portfolio storage

Project photos, videos, and cover images are uploaded to Cloudinary. Portfolio
data is stored in Supabase Postgres, and PDFs/CV files are stored in the public
`portfolio-pdfs` Supabase Storage bucket. Apply [`supabase/setup.sql`](./supabase/setup.sql)
in the Supabase SQL Editor before deploying.

Configure these server-side environment variables in Vercel:

- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- `PORTFOLIO_ADMIN_PASSWORD` (optional; the administrator PIN `7374` remains enabled)

Keep all secrets out of client-side code and source control. The Supabase service
role key and administrator password are only used by Vercel Functions. The
four-digit PIN is retained for compatibility but is not suitable for production
security. After setting variables or applying SQL, redeploy the project.
