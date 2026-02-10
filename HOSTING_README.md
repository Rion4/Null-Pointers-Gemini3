# Hosting RuleGuard on Google Cloud Run (Free Tier)

This guide provides detailed, step-by-step instructions to host the **RuleGuard** application on Google Cloud Run. Google Cloud Run offers a generous free tier (2 million requests/month), making it an excellent choice for hosting this application for free or at very low cost.

## Prerequisites

Before you begin, ensure you have the following:

1.  **Google Cloud Account**: [Sign up here](https://cloud.google.com/) if you don't have one.
2.  **Project**: Create a new Project in the Google Cloud Console. Note your **Project ID**.
3.  **Billing Enabled**: You must enable billing for your project.
    *   *Note: You will not be charged unless you exceed the free tier limits, but Google requires a billing account to be linked to use Cloud Build and Cloud Run.*
4.  **Google Cloud SDK**: Install the `gcloud` CLI on your machine. [Installation Guide](https://cloud.google.com/sdk/docs/install).

## Step-by-Step Deployment Guide

### 1. Login to Google Cloud

Open your terminal and log in to your Google Account:

```bash
gcloud auth login
```

Follow the browser prompts to authenticate.

### 2. Configure Your Project

Set your active project to the one you created (replace `[YOUR_PROJECT_ID]` with your actual Project ID):

```bash
gcloud config set project [YOUR_PROJECT_ID]
```

### 3. Prepare Your Environment

You need to provide your Gemini API key so the application can function. Run this command in your terminal (replace with your actual key):

```bash
export GOOGLE_API_KEY="your_actual_gemini_api_key_here"
```

*   *Note: This sets the variable only for the current terminal session. If you close the terminal, you will need to run this again.*

### 4. Run the Deployment Script

We have provided a script to automate the entire process. It will:
*   Enable necessary Google Cloud APIs.
*   Build and deploy the Backend (FastAPI).
*   Build and deploy the Frontend (Next.js), automatically linking it to the Backend.

Run the script:

```bash
# Make the script executable (only needed once)
chmod +x deploy_cloud_run.sh

# Run the deployment (replace [YOUR_PROJECT_ID] and optionally [REGION])
./deploy_cloud_run.sh [YOUR_PROJECT_ID] us-central1
```

*   **Region**: `us-central1` is recommended for the free tier, but you can choose others.

### 5. Access Your Application

Once the script finishes, it will print the URLs for both your Frontend and Backend:

```
========================================================
Deployment Complete!
Frontend: https://guardian-frontend-xyz123-uc.a.run.app
Backend:  https://guardian-backend-xyz123-uc.a.run.app
========================================================
```

Click the **Frontend** URL to start using RuleGuard!

---

## 🆘 Troubleshooting & Asking for Help

Deployment can sometimes fail due to permissions, billing issues, or configuration errors.

**If you encounter an error:**

1.  **Don't Panic**: Read the error message in the terminal.
2.  **Ask Antigravity**: I am here to help you solve deployment issues.

**How to ask Antigravity for help:**

Copy the specific error message from your terminal and paste it into the chat with the following prompt:

> "I ran the deployment script and got this error:
>
> ```
> [PASTE THE ERROR MESSAGE HERE]
> ```
>
> Can you help me fix this?"

**Common Issues I can help with:**
*   "Permission denied" errors.
*   "API not enabled" errors.
*   Docker build failures.
*   500 Internal Server Errors after deployment.

---

### Key Commands Reference

*   **Check Deployment Status**:
    ```bash
    gcloud run services list
    ```
*   **View Logs**:
    *   Go to the [Google Cloud Console](https://console.cloud.google.com/run).
    *   Click on your service (`guardian-frontend` or `guardian-backend`).
    *   Click on the **Logs** tab.
