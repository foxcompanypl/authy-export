#!/bin/bash

socat TCP-LISTEN:5858,fork TCP:localhost:${DEBUG_PORT} >/dev/null 2>&1 &

authy \
    --no-sandbox \
    --disable-gpu \
    --remote-debugging-address=0.0.0.0 \
    --remote-debugging-port=${DEBUG_PORT}
