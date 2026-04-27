# AbsoluteKino
Backend for a platform capable of managing cinemas and related data

## Documentation

<details>
<summary><h3>/cinema</h3></summary>

#### POST /new
Adds a new cinema. Requires site-admin privileges.

Request body (JSON)
```json
{
  "name": "string",         // required; trimmed length between CINEMA_NAME_MIN_LEN and CINEMA_NAME_MAX_LEN
  "address": "string",      // required; must match CINEMA_POLISH_ADDRESS_REGEX
  "latitude": 12.345,       // required; number between CINEMA_MIN_LATITUDE and CINEMA_MAX_LATITUDE
  "longitude": 67.890       // required; number between CINEMA_MIN_LONGITUDE and CINEMA_MAX_LONGITUDE
}
```

Responses
- 200: { cinemas: [ Cinema ] } — created cinema object
- 400: { message: <error message>, cinemas: [] } — missing/invalid fields, wrong types, or validation failures
- errors forwarded to next(error)

#### GET /all
Returns all cinemas. Public endpoint.

Responses
- 200: { cinemas: [ CinemaInstance, ... ] }
- 404: { message: CINEMA_ERR_NOT_FOUND_ALL, cinemas: [] } — no cinemas in DB
- errors forwarded to next(error)

#### GET /id/:cinemaId
Returns cinema with given ID. Public endpoint.

Path params
- cinemaId (number) — must be >= TYPICAL_MIN_ID

Responses
- 200: { cinemas: [ CinemaInstance ] }
- 400: { message: CINEMA_ERR_ID, cinemas: [] } — invalid ID
- 404: { message: CINEMA_ERR_NOT_FOUND, cinemas: [] } — not found
- errors forwarded to next(error)

#### PUT /update/:cinemaId
Updates a cinema. Requires site-admin privileges (authorize "cinemas" and privileges level 3).

Path params
- cinemaId (number) — must be >= TYPICAL_MIN_ID

Request body (JSON) — at least one of:
```json
{
  "name": "string",         // required; trimmed length between CINEMA_NAME_MIN_LEN and CINEMA_NAME_MAX_LEN
  "address": "string",      // required; must match CINEMA_POLISH_ADDRESS_REGEX
  "latitude": 12.345,       // required; number between CINEMA_MIN_LATITUDE and CINEMA_MAX_LATITUDE
  "longitude": 67.890       // required; number between CINEMA_MIN_LONGITUDE and CINEMA_MAX_LONGITUDE
}
```

Responses
- 200: { cinemas: [ CinemaInstance ] } — cinema after update
- 400: { message: <error message>, cinemas: [] } — invalid ID, typing, validation or empty args
- 404: { message: CINEMA_ERR_NOT_FOUND, cinemas: [] } — cinema not found
- errors forwarded to next(error)

#### DELETE /delete/:cinemaId
Deletes a cinema. Requires site-admin privileges (authorize "cinemas" and privileges level 3).

Path params
- cinemaId (number) — must be >= TYPICAL_MIN_ID

Responses
- 200: { message: CINEMA_MSG_DEL } — successful deletion
- 400: { message: CINEMA_ERR_ID } — invalid ID
- 404: { message: CINEMA_ERR_NOT_FOUND } — nothing deleted
- errors forwarded to next(error)

</details>
