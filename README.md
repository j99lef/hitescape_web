# HitEscapeNow Frontend (Vite + React)

Single-page search UI that calls the Cloud Run backend.

## Prerequisites
- Node.js 18+
- A valid Cloud Run identity token (org policy blocks unauthenticated access)

## Setup
1) Create a `.env` file (dotfile) in this folder with your token:
```
VITE_DEV_ID_TOKEN="<your identity token>"
VITE_SITE_PASSWORD="<password to unlock UI>"
```
If you prefer, copy `env.example` to `.env` and fill in the token.

To generate a token:
```bash
gcloud auth print-identity-token
```
Paste the output into `VITE_DEV_ID_TOKEN` in `.env`.
Set `VITE_SITE_PASSWORD` to any temporary secret (dev-only gate).

2) Install dependencies and run dev:
```bash
npm install
npm run dev
```
Open the printed local URL in your browser.

## Build
```bash
npm run build
# optional preview of the built site
npm run preview
```

## Using the App
- Enter origin, destination, depart date, return date
- Click “Search”
- The app POSTs to:
  `https://hitescape-agent-ws2qitn7ea-nw.a.run.app/search`
- Authorization header is set from `VITE_DEV_ID_TOKEN`

## Deploy Options

### Option A: Deploy to Cloud Storage (static hosting)
```bash
# From this folder, build
npm run build

# Create a bucket (pick a unique name)
PROJECT_ID=phoenix-479815
BUCKET_NAME=hitescape-web-<unique-suffix>
gcloud config set project $PROJECT_ID
gcloud storage buckets create gs://$BUCKET_NAME --location=EU

# Upload built assets
gcloud storage cp -r dist/* gs://$BUCKET_NAME

# Set website config and make public
gcloud storage buckets update gs://$BUCKET_NAME --web-main-page-suffix=index.html --web-error-page=404.html
gcloud storage buckets add-iam-policy-binding gs://$BUCKET_NAME --member=allUsers --role=roles/storage.objectViewer

# Access URL
echo \"https://storage.googleapis.com/$BUCKET_NAME/index.html\"
```

### Option B: Deploy to Cloud Run (serving build via Vite preview)
Cloud Run source deploy uses buildpacks and runs `npm start` at runtime. This project defines:
- `build`: `vite build`
- `start`: `vite preview --host 0.0.0.0 --port 8080`

```bash
PROJECT_ID=phoenix-479815
SERVICE_NAME=hitescape-web
REGION=europe-west2

gcloud config set project $PROJECT_ID
gcloud run deploy $SERVICE_NAME \
  --source . \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated
```

Note: If your organization enforces authenticated-only access, remove `--allow-unauthenticated` and use an identity token with requests.


