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

## Media uploads

Project photos, videos, and cover images are uploaded to Cloudinary. The portfolio
JSON and PDF files remain in Vercel Blob. Configure `CLOUDINARY_CLOUD_NAME`,
`CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` as server-side environment
variables in Vercel, then redeploy. For local development, put these values in
`.env.local`; never expose `CLOUDINARY_API_SECRET` in client-side code.
