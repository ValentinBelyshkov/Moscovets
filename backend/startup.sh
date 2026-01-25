#!/bin/bash
export PYTHONPATH=$(pwd):$PYTHONPATH
# Increase upload limits for CT scans (500MB)
uvicorn main:app --host 0.0.0.0 --port 8002 --reload --limit-max-request-size=$((500*1024*1024))