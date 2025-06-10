#!/bin/bash

# 杀死之前运行的进程
kill $(ps aux | grep 'uvicorn main:app' | awk '{print $2}') 2>/dev/null
kill $(ps aux | grep 'npm run dev' | awk '{print $2}') 2>/dev/null
fuser -k 8000/tcp 2>/dev/null
fuser -k 5173/tcp 2>/dev/null

# 启动后端服务
echo "Starting backend service..."
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
cd ..

# 启动前端服务
echo "Starting frontend service..."
cd frontend
export VITE_API_BASE="http://$(hostname -I | awk '{print $1}'):8000"
npm install
npm run dev &
FRONTEND_PID=$!
cd ..

echo "Backend service started with PID: $BACKEND_PID"
echo "Frontend service started with PID: $FRONTEND_PID"