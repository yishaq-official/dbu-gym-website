#!/bin/bash

cd /home/yishaq/ProjectPHP/gym-website || exit

while true; do
  git add .

  if ! git diff --cached --quiet; then
    git commit -m "auto-save $(date '+%Y-%m-%d %H:%M:%S')"
    git push
  fi

  sleep 60
done
