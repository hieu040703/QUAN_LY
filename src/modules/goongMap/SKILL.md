# GoongMap module

## Scope

This module is the Goong Maps integration for FIT_CLUB. It exposes the generic Goong geocoding and routing endpoints and a club map endpoint. Order, delivery, employee tracking, and socket tracking from the source project are intentionally not included because FIT_CLUB has no matching Order model.

## Configuration

Set `GOONG_API_KEY` and `GOONG_MAP_TILE_KEY` in the runtime `.env` file. Optional timeout, quota, cache TTL, and API base URL settings are declared in `src/config/env.ts` and `.env.example`.

## Routes

The router is mounted at `/v1/manager/goong-map` after account authentication. It is not passed through the system `authorization` middleware:

- `GET /clubs` lists clubs and returns normalized `latitude`/`longitude` values.
- `GET /map-tile-key` returns the tile key for the frontend.
- `GET /autocomplete`, `/place-children`, `/place-detail`, `/geocode`, `/reverse-geocode`, `/geocode-street`, `/directions`, `/distance-matrix`, and `/trip` proxy supported Goong endpoints.

## Club coordinates

The canonical fields are `Club.latitude` and `Club.longitude`. If either value is invalid or empty, the response falls back to `Club.address.lat` and `Club.address.lng`.
