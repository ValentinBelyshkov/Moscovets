#!/bin/bash
export PYTHONPATH=$(pwd):$PYTHONPATH
# Increase upload limits for CT scans (500MB) - handled via config now
uvicorn main:app --host 0.0.0.0 --port 5001 --reload