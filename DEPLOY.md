# 🚀 Deployment Instructions

## ✅ GitHub Deployment - COMPLETED
Your project is now live on GitHub: https://github.com/jayaraman2212066/BMS_DASHBOARD

## 🌐 Render Auto-Deploy Setup

### Step 1: Connect to Render
1. Go to [render.com](https://render.com)
2. Sign up/Login with your GitHub account
3. Click "New +" → "Web Service"

### Step 2: Connect Repository
1. Select "Build and deploy from a Git repository"
2. Connect your GitHub account if not already connected
3. Select the `BMS_DASHBOARD` repository

### Step 3: Configure Service
Use these exact settings:

**Basic Settings:**
- **Name**: `voltas-bms-dashboard`
- **Region**: `Oregon (US West)`
- **Branch**: `main`
- **Runtime**: `Python 3`

**Build & Deploy:**
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `cd backend && python main.py`

**Environment Variables** (Auto-configured by render.yaml):
- `PORT` - Auto-assigned by Render
- `SECRET_KEY` - Auto-generated
- `DATABASE_URL` - `sqlite:///./voltas_bms.db`
- `JWT_ALGORITHM` - `HS256`
- `JWT_EXPIRE_MINUTES` - `30`

### Step 4: Deploy
1. Click "Create Web Service"
2. Render will automatically detect `render.yaml` and configure everything
3. Wait 3-5 minutes for deployment to complete

### Step 5: Access Your App
- Your app will be live at: `https://voltas-bms-dashboard.onrender.com`
- Login with demo credentials:
  - **Admin**: admin@voltas.com / admin123
  - **Operator**: operator@voltas.com / operator123
  - **Guest**: guest@voltas.com / guest123

## 🔄 Auto-Deploy Features
- ✅ Automatic deployments on every GitHub push
- ✅ Environment variables pre-configured
- ✅ Health checks enabled
- ✅ HTTPS enabled by default
- ✅ Custom domain support available

## 📊 Live Features
- ✅ Real-time device monitoring
- ✅ Interactive dashboard with charts
- ✅ WebSocket live updates
- ✅ Role-based authentication
- ✅ Device control simulation
- ✅ Alert management system

Your BMS Dashboard is now production-ready! 🎉