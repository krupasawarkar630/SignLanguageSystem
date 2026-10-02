#!/bin/bash

# GESTURA Pre-flight & Dev Server Launcher

echo "======================================"
echo "    GESTURA: HACKATHON PRE-FLIGHT     "
echo "======================================"

# 1. Check Node.js
if ! command -v npm &> /dev/null; then
    echo "❌ ERROR: npm is not installed or not in PATH."
    exit 1
else
    echo "✅ npm found."
fi

# 2. Check Python (for backend)
if ! command -v python &> /dev/null && ! command -v python3 &> /dev/null; then
    echo "❌ ERROR: Python is not installed. Custom training will fail."
    # We don't exit here because the frontend demo can still run
else
    echo "✅ Python found."
fi

# 3. Check Models
if [ ! -f "frontend/public/models/model.onnx" ]; then
    echo "⚠️ WARNING: model.onnx not found in frontend/public/models/. Demo will show MODEL ERROR until trained."
else
    echo "✅ Local ONNX model found."
fi

echo "--------------------------------------"
echo "Starting Next.js Frontend..."
echo "--------------------------------------"
cd frontend && npm run dev
