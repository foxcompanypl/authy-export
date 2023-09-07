# Authy export tool

This container runs **Authy 2.2.3** version on virtual desktop with enabled remote debugging port in background and fetch data with node script.

## Usage

```bash
$ docker run --rm -it \
    -e COUNTRY_CODE=+00 \
    -e PHONE_NUMBER=000000000 \
    -e BACKUP_PASSWORD=password \
    -v ./export.json:/root/export.json \
    liskeee/authy-export:latest
```

## Environment variables

- `CONTRY_CODE` - your contry code, for example `+48`
- `PHONE_NUMBER` - your phone number, for example `500600700`
- `BACKUP_PASSWORD` (optional) - if your account is encrypted with backup password u need to provide this, for example `password`
- `DEBUG` (optional) - if you want to check something in Authy app, set this variable to `1`

## Debuging

1. Add flag to docker command `-p 5858:5858`
2. Open Chrome App
3. Go to url `http://localhost:5858/`
