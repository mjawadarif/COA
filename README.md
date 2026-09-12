# Image Alignment and Correction Protocol Specialist

**Engineered by madebyJawadGenix**

A high-precision, client-side web application for automated aspect ratio delta calculations, image distortion detection, and catalog remediation based on the 16 decision rules of the Image Alignment and Correction Protocol.

---

## Canonical Ratio Standards
The catalog strictly adheres to 6 canonical reciprocal aspect ratios:
- **3:2** (1.50) — Landscape
- **2:3** (0.67) — Portrait
- **1:2** (0.50) — Vertical Panel / Runner
- **2:1** (2.00) — Horizontal Panorama
- **1:3** (0.33) — Ultra-tall Panel / Triptych Column
- **3:1** (3.00) — Ultra-wide Panorama

---

## How to Deploy on the Internet (Free Forever)

Because this tool is built 100% with standard web technologies (HTML5, modern CSS, and ES6 JavaScript) and runs client-side inside the user's browser, **you can host it for free with zero backend maintenance and zero server costs**.

### Method 1: Netlify Drop (Easiest — 30 Seconds, No Code)
1. Open [https://app.netlify.com/drop](https://app.netlify.com/drop) in your browser.
2. Drag and drop this entire project folder into the upload circle.
3. Done! Netlify immediately gives you a live public URL (e.g. `image-alignment-protocol.netlify.app`) with free SSL and worldwide CDN delivery.

### Method 2: Vercel CLI (or Vercel Dashboard)
In your terminal, run:
```bash
npx vercel
```
Follow the 3 quick prompts to deploy immediately to a public URL on Vercel.

### Method 3: GitHub Pages
1. Create a repository on [GitHub](https://github.com) (e.g., `image-alignment-protocol`).
2. Upload the project files (`index.html`, `styles.css`, `app.js`, `protocolEngine.js`, etc.).
3. Go to repository **Settings** → **Pages**.
4. Set source to **Deploy from a branch** (select `main` / `/root`) and click **Save**.
5. Your tool will be live at `https://<your-username>.github.io/image-alignment-protocol/`.

### Method 4: Cloudflare Pages
1. Log in to the Cloudflare dashboard and go to **Workers & Pages**.
2. Click **Create Application** → **Pages** → **Direct Upload**.
3. Upload this folder. It deploys across Cloudflare's 300+ edge data centers.

---

## Running Locally

### Option 1: Direct File Opening
Double-click [`index.html`](file:///c:/Users/Jawad/Downloads/Compressed/New%20folder/index.html) in your file manager to open it in Chrome, Edge, Safari, or Firefox.

### Option 2: Python
```bash
python server.py
```

### Option 3: Node.js
```bash
npm start
```
*or:*
```bash
node server.js
```
Then navigate to `http://localhost:8080`.

---

## Test Suite
To run the automated test suite verifying all 16 decision protocol rules:
```bash
npm test
```
*or:*
```bash
node test_protocol.js
```
