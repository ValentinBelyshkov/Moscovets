#!/bin/bash

# Exit on any error
set -e

# Navigate to the script's directory
cd "$(dirname "$0")"

# Create a virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt
pip install pyinstaller

# Build the application
echo "Building application with PyInstaller..."
pyinstaller --onefile --name moskovets3d_backend main.py

# Deactivate virtual environment
deactivate

echo "Build complete! Find the executable in the dist/ directory."