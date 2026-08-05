# Hugging Face Spaces Backend Deployment Guide

This guide details how to deploy the **NestJS Backend (`apps/api`)** to **Hugging Face Spaces** using Docker, giving your backend **16 GB RAM** completely free forever.

---

## Architecture Overview

- **Frontend:** Vercel (`https://erp-web-u8zw.vercel.app`)
- **Backend:** Hugging Face Spaces (`Docker SDK`, Port `7860`, 16 GB RAM)
- **Database:** Supabase PostgreSQL (Port `5432` Session Pooler)

---

## Step-by-Step Deployment Instructions

### 1. Create a New Space on Hugging Face
1. Go to [https://huggingface.co/new-space](https://huggingface.co/new-space).
2. Set Space Name: `erp-api` (or your preferred name).
3. Select License: `mit`.
4. Select Space SDK: **`Docker`** -> **`Blank`**.
5. Choose Visibility: `Public` or `Private`.
6. Click **Create Space**.

---

### 2. Configure Space Secrets
Go to your Space's **Settings -> Variables and secrets**, and add the following **New Secret** entries:

| Secret Key | Secret Value |
|---|---|
| `DATABASE_URL` | `postgresql://postgres.emjaajdvkyyyxbrpjduy:SuperSecureStrongPassword%212026@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres` |
| `AUTH_SECRET` | `6b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c` |
| `ENCRYPTION_KEY` | `f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2` |
| `FRONTEND_URL` | `https://erp-web-u8zw.vercel.app` |
| `PORT` | `7860` |
| `NODE_ENV` | `production` |

---

### 3. Deploy Code to Hugging Face
Option A: **Git Push to Hugging Face**
Clone your Hugging Face Space repository and copy `apps/api/Dockerfile` to the root, then push:
```bash
git remote add hf https://huggingface.co/spaces/<YOUR_USERNAME>/<YOUR_SPACE_NAME>
git push hf main
```

Option B: **GitHub Actions Sync**
Add a GitHub secret `HF_TOKEN` and sync commits automatically.

---

### 4. Wire Vercel Frontend
Go to your Vercel Dashboard -> Project Settings -> **Environment Variables**:

- `NEXT_PUBLIC_API_URL` = `https://<YOUR_USERNAME>-<YOUR_SPACE_NAME>.hf.space`
- `API_URL` = `https://<YOUR_USERNAME>-<YOUR_SPACE_NAME>.hf.space`
- `AUTH_URL` = `https://erp-web-u8zw.vercel.app`
- `AUTH_SECRET` = `6b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c`

Redeploy the Vercel project to apply the new API URL.

---

## Access & Login Credentials
- **Frontend App:** [https://erp-web-u8zw.vercel.app](https://erp-web-u8zw.vercel.app)
- **Admin Email:** `ashabuilder30111@gmail.com`
- **Admin Password:** `AshaBuilders@2026`
