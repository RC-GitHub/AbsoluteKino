# AbsoluteKino
Backend for a platform capable of managing cinemas and related data.

---

## Documentation

<details open>
<summary><b>/cinema</b></summary>
<br>

### POST /new
Adds a new cinema to the system. 
* **Requirements:** Site-admin privileges (Level 3).

**Request Body (JSON):**
```json
{
  "name": "string",      // required; length: CINEMA_NAME_MIN to MAX
  "address": "string",   // required; regex: CINEMA_POLISH_ADDRESS_REGEX
  "latitude": 12.345,    // required; range: MIN_LATITUDE to MAX_LATITUDE
  "longitude": 67.890    // required; range: MIN_LONGITUDE to MAX_LONGITUDE
}
```

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Success | `{ "cinemas": [ CinemaInstance ] }` |
| **400** | Validation/Type Error | `{ "message": "error string", "cinemas": [] }` |
| **401** | Unauthorized | `{ "message": "Unauthorized" }` |

---

### GET /all
Returns a list of all cinemas in the database.
* **Requirements:** Public.

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Success | `{ "cinemas": [ CinemaInstance, ... ] }` |
| **404** | No cinemas found | `{ "message": "CINEMA_ERR_NOT_FOUND_ALL", "cinemas": [] }` |

---

### GET /id/:cinemaId
Returns details of a specific cinema.
* **Requirements:** Public.
* **Path Params:** `cinemaId` (Number, $\ge$ `TYPICAL_MIN_ID`).

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Success | `{ "cinemas": [ CinemaInstance ] }` |
| **400** | Invalid ID format | `{ "message": "CINEMA_ERR_ID", "cinemas": [] }` |
| **404** | Not found | `{ "message": "CINEMA_ERR_NOT_FOUND", "cinemas": [] }` |

---

### PUT /update/:cinemaId
Updates an existing cinema record.
* **Requirements:** Site-admin (Authorize: "cinemas", Level 3).
* **Path Params:** `cinemaId` (Number, $\ge$ `TYPICAL_MIN_ID`).

**Request Body (JSON):**
> At least one field must be provided.
```json
{
  "name": "string",
  "address": "string",
  "latitude": number,
  "longitude": number
}
```

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Update Successful | `{ "cinemas": [ CinemaInstance ] }` |
| **400** | Validation error / Empty body | `{ "message": "error string", "cinemas": [] }` |
| **404** | Cinema not found | `{ "message": "CINEMA_ERR_NOT_FOUND", "cinemas": [] }` |

---

### DELETE /delete/:cinemaId
Removes a cinema from the database.
* **Requirements:** Site-admin (Authorize: "cinemas", Level 3).
* **Path Params:** `cinemaId` (Number, $\ge$ `TYPICAL_MIN_ID`).

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Deletion Successful | `{ "message": "CINEMA_MSG_DEL" }` |
| **400** | Invalid ID | `{ "message": "CINEMA_ERR_ID" }` |
| **404** | Cinema not found | `{ "message": "CINEMA_ERR_NOT_FOUND" }` |

</details>
