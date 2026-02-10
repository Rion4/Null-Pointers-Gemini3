
#!/bin/bash

# Cloud Run Deployment Script
# Usage: ./deploy.sh [PROJECT_ID] [REGION]

set -e

PROJECT_ID=$1
REGION=${2:-us-central1}

if [ -z "$PROJECT_ID" ]; then
  echo "Usage: ./deploy.sh [PROJECT_ID] [REGION]"
  echo "Please provide your Google Cloud Project ID."
  exit 1
fi

echo "========================================================"
echo "Deploying to Google Cloud Run"
echo "Project: $PROJECT_ID"
echo "Region:  $REGION"
echo "========================================================"

# Enable necessary services
echo "Enabling Cloud Run, Cloud Build, and Artifact Registry APIs..."
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com --project $PROJECT_ID

# 1. Deploy Backend
echo ""
echo "--- Deploying Backend ---"
echo "Submitting build for backend..."
gcloud builds submit --tag gcr.io/$PROJECT_ID/guardian-backend ./backend --project $PROJECT_ID

echo "Deploying backend service..."
gcloud run deploy guardian-backend \
  --image gcr.io/$PROJECT_ID/guardian-backend \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --project $PROJECT_ID \
  --set-env-vars GOOGLE_API_KEY=${GOOGLE_API_KEY}

# Get Backend URL
BACKEND_URL=$(gcloud run services describe guardian-backend --platform managed --region $REGION --format 'value(status.url)' --project $PROJECT_ID)
echo "Backend deployed at: $BACKEND_URL"

# 2. Deploy Frontend
echo ""
echo "--- Deploying Frontend ---"
echo "Building frontend with API URL: $BACKEND_URL"
# We pass the backend URL as a build argument so Next.js can bake it in
gcloud builds submit --tag gcr.io/$PROJECT_ID/guardian-frontend ./frontend \
  --project $PROJECT_ID \
  --substitutions=_NEXT_PUBLIC_API_URL=$BACKEND_URL \
  --build-arg NEXT_PUBLIC_API_URL=$BACKEND_URL

echo "Deploying frontend service..."
gcloud run deploy guardian-frontend \
  --image gcr.io/$PROJECT_ID/guardian-frontend \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --project $PROJECT_ID

FRONTEND_URL=$(gcloud run services describe guardian-frontend --platform managed --region $REGION --format 'value(status.url)' --project $PROJECT_ID)

echo ""
echo "========================================================"
echo "Deployment Complete!"
echo "Frontend: $FRONTEND_URL"
echo "Backend:  $BACKEND_URL"
echo "========================================================"
