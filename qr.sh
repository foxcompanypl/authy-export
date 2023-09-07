#!/bin/bash

file="./export.json"

if [ ! -z "$1" ]; then
    file="$1"
fi

if [ ! -f "$file" ]; then
    echo "JSON file not found: $file"
    exit 1
fi

count=$(jq '. | length' "$file")

for ((i = 0; i < count; i++)); do
    n=$((i + 1))
    name=$(jq -r ".[${i}].name" "$file")
    url=$(jq -r ".[${i}].url" "$file")
    echo "${n}. ${name}"
    qrencode -m 2 -s 4 -t utf8 "${url}"
    read -p "Press enter to continue..."
    clear -x
done
