#!/bin/bash

if [[ "$DEBUG" == "1" ]]; then
    socat TCP-LISTEN:5858,fork TCP:localhost:${DEBUG_PORT} >/dev/null 2>&1 &
fi

authy \
    --no-sandbox \
    --disable-gpu \
    --remote-debugging-address=0.0.0.0 \
    --remote-debugging-port=${DEBUG_PORT} >/dev/null 2>&1 &

sleep 5
cd /root/node && npm run --silent start
