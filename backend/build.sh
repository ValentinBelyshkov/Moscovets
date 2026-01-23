#!/bin/bash

# Exit on any error
set -e

# Navigate to the script's directory
cd "$(dirname "$0")"

# Create a virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install pyinstaller

# Build the application
pyinstaller --onefile --name moskovets3d_backend main.py

# Deactivate virtual environment
deactivate

echo "Build complete! Find the executable in the dist/ directory."