#!/bin/bash

export PYTHONPATH=$(pwd)

uvicorn main:app --reload --host 0.0.0.0 --port 4000 --log-config=log_conf.yaml
