# Deployment Guide

Free deployment path for Humanzise:

- **Frontend** → Vercel (free, auto-deploys from GitHub `web/` subfolder)
- **Backend** → Hugging Face Spaces (free, 16 GB RAM, Docker SDK)

Both are genuinely free — no credit card required. Total monthly cost: **$0**.

---

## Part 1 — Backend on Hugging Face Spaces

### 1. Create the Space

1. Go to https://huggingface.co/new-space
2. **Owner**: your username (e.g. `bug-head`)
3. **Space name**: `humanzise-api`
4. **License**: MIT
5. **Select the Space SDK**: choose **Docker** → **Blank**
6. **Space hardware**: CPU basic (free, 2 vCPU, 16 GB RAM)
7. **Visibility**: Public (required for free tier)
8. Click **Create Space**

### 2. Clone the empty Space locally

HF Spaces are git repositories. Clone the one you just created:

```bash
cd ~/Documents/GitHub   # or anywhere outside the humanzise repo
git clone https://huggingface.co/spaces/<your-hf-username>/humanzise-api
cd humanzise-api
```

If Git asks for credentials, use your HF username and an **access token** with `write` permission (create one at https://huggingface.co/settings/tokens).

### 3. Copy the backend files into the Space

From the Space directory, copy the needed files from the main repo:

```bash
# Assuming both repos live under ~/Documents/GitHub/
SRC=~/Documents/GitHub/AI-content-detector-Humanizer

cp -r "$SRC/api" .
cp -r "$SRC/utils" .
cp "$SRC/Dockerfile" .
cp "$SRC/.dockerignore" .
cp "$SRC/requirements.txt" .
cp "$SRC/README.md" .
cp "$SRC/LICENSE" .
```

Your Space directory should now look like:

```
humanzise-api/
├── api/
├── utils/
├── Dockerfile
├── .dockerignore
├── requirements.txt
├── README.md          # includes HF YAML frontmatter at the top
└── LICENSE
```

### 4. Push to HF Spaces

```bash
git add .
git commit -m "Initial Humanzise backend deployment"
git push
```

HF will automatically start building the Docker image. Watch the build logs at:

```
https://huggingface.co/spaces/<your-hf-username>/humanzise-api?logs=build
```

Build takes **~5–8 minutes** the first time (installing torch, transformers, spaCy, downloading NLP data). Subsequent builds reuse Docker layer cache and take ~2–3 minutes.

### 5. Test the backend

Once the build succeeds, your backend lives at:

```
https://<your-hf-username>-humanzise-api.hf.space
```

Test it:

```bash
curl https://<your-hf-username>-humanzise-api.hf.space/health
# {"status":"ok"}
```

First `/detect` or `/humanize` call will be slow — the desklib model downloads (~1.75 GB) and loads into memory. Subsequent calls are fast.

### 6. Heads up about HF free tier limits

- **Sleeps after 48h of inactivity** → next request takes ~30–60s to wake up
- **CPU only** (no GPU) → detection takes 3–8 seconds per paragraph
- **Storage wipes on rebuild** → model re-downloads when you push new commits
- **Public** → anyone can query your API (rate limiting recommended if you grow)

---

## Part 2 — Frontend on Vercel

### 1. Push the repo to GitHub (already done if you followed earlier steps)

```
https://github.com/bug-head/humanzise
```

### 2. Import into Vercel

1. Go to https://vercel.com/new
2. Sign in with GitHub (free tier, no CC)
3. **Import Git Repository** → select `bug-head/humanzise`
4. **Configure project**:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: click **Edit** → set to `web`
   - **Build Command**: leave default (`next build`)
   - **Output Directory**: leave default (`.next`)
5. **Environment Variables**: click **Add**
   - **Key**: `NEXT_PUBLIC_API_BASE_URL`
   - **Value**: `https://<your-hf-username>-humanzise-api.hf.space`
6. Click **Deploy**

Vercel builds and deploys in ~90 seconds. You get a URL like:

```
https://humanzise.vercel.app
https://humanzise-git-main-bug-head.vercel.app
https://humanzise-<hash>.vercel.app
```

Every `git push` to `main` auto-deploys a new version.

### 3. (Optional) Custom domain

1. Buy `humanzise.com` at Namecheap or Porkbun (~$10/yr)
2. In Vercel → **Project** → **Settings** → **Domains** → add `humanzise.com`
3. Vercel shows you DNS records to set at your registrar (an A record + a CNAME)
4. Wait 5–30 minutes for DNS → Vercel auto-issues a free Let's Encrypt SSL cert

---

## Part 3 — Keeping the two repos in sync

You now have two git remotes:

- **GitHub** (source of truth): https://github.com/bug-head/humanzise
- **HF Space** (backend mirror): https://huggingface.co/spaces/<hf-user>/humanzise-api

To push a backend update:

```bash
# in the main repo
git push origin main                     # triggers Vercel redeploy (frontend)

# in the HF Space clone
cd ~/Documents/GitHub/humanzise-api
cp -r ~/Documents/GitHub/AI-content-detector-Humanizer/{api,utils,Dockerfile,requirements.txt} .
git add .
git commit -m "Sync backend from main repo"
git push                                 # triggers HF rebuild (backend)
```

You can script this as a shell alias if it gets tedious. A GitHub Action that auto-pushes to HF on every commit is also possible but requires storing an HF token as a secret.

---

## Part 4 — CORS tightening (production hardening)

Once you know your final Vercel URL, lock down CORS in `api/humanize_api.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://humanzise.vercel.app",
        "https://humanzise.com",
        "http://localhost:3000",  # local dev
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Commit, push to GitHub, sync to HF Space. Done.

---

## Troubleshooting

**HF build fails with "No module named X"** → Add X to `requirements.txt` and push again.

**HF build OOMs** → Rare on 16 GB free tier, but if you see it, upgrade to CPU upgrade ($0.03/h, still cheap).

**Frontend shows "Failed to fetch"** → Check `NEXT_PUBLIC_API_BASE_URL` is set in Vercel env vars and the HF Space is awake (curl `/health` first).

**First `/detect` call times out** → Model download is slow. Hit it once from curl to warm up; UI calls after that will be fast.

**HF Space keeps sleeping** → Upgrade to "Always on" ($9/mo) or ping `/health` every 30 min with a cron (UptimeRobot is free).
