@echo off
echo Deploying BMS Dashboard to GitHub...
echo.

git init
git add .
git commit -m "Initial commit - Voltas BMS Dashboard"
git branch -M main
git remote add origin https://github.com/jayaraman2212066/BMS_DASHBOARD.git
git push -u origin main

echo.
echo Project deployed to GitHub!
echo Next steps:
echo 1. Go to https://render.com
echo 2. Connect your GitHub account
echo 3. Create new Web Service from GitHub repo
echo 4. Use these settings:
echo    - Build Command: pip install -r requirements.txt
echo    - Start Command: cd backend && python main.py
echo    - Environment: Python 3
echo.
pause