# LINGGUANG Health OS — Mobile GitHub Upload 1.3.1

This package is optimized for uploading from an iPhone.

## Upload these four files to the root of one GitHub repository
- `index.html`
- `app.js`
- `styles.css`
- `README.md`

There is no outer project folder inside the ZIP and no nested source folders to upload.

## GitHub Pages
After uploading, open repository **Settings → Pages**, choose **Deploy from a branch**, select `main` and `/ (root)`, then save.

## Current technical boundary
This is a browser-based working build. It uses local browser storage. Cloud accounts, Supabase, live GPT API, SMS/email, and production medical compliance are not yet connected.


## White-screen fix
Removed leftover module import statements from the bundled JavaScript and added cache-busting file versions for GitHub Pages.
