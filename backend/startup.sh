#!/bin/bash
export PYTHONPATH=$(pwd):$PYTHONPATH
uvicorn main:app --host 0.0.0.0 --port 8002 --reload