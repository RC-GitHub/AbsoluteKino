# AbsoluteKino
Backend for a platform capable of managing cinemas and related data.

---

## Installation
You can set up the project manually or use **Docker** for an isolated environment.

### Docker (Recommended for all platforms)
Docker ensures the app runs exactly the same on Windows and Linux (CachyOS/Ubuntu) without worrying about local Node.js versions.

1. **Prerequisites:** Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows) or `docker` + `docker-compose` (Linux).
2. **Setup:**
   ```bash
   git clone https://github.com/RC-GitHub/AbsoluteKino.git
   cd AbsoluteKino
   # IMPORTANT: Complete the "Environment Configuration" section below first!
   docker compose up -d --build
   ```

---

### Manual Setup - Windows
1. **Prerequisites:** Install [Node.js](https://nodejs.org/) (LTS) and [Git](https://git-scm.com/).
2. **Setup:**
   ```powershell
   git clone 'https://github.com/RC-GitHub/AbsoluteKino.git'
   cd AbsoluteKino
   npm install
   ```

### Manual Setup - Linux
1. **Clone:**
   ```bash
   git clone https://github.com/RC-GitHub/AbsoluteKino.git
   cd AbsoluteKino
   ```
2. **Install Node.js & Dependencies:**
   * **Arch-based:** `sudo pacman -S nodejs npm`
   * **Debian-based:** `sudo apt update && sudo apt install nodejs npm build-essential`
   ```bash
   npm install
   ```

---

## Environment Configuration
The application relies on a `.env` file. **This step must be completed before running the app or Docker.**

1. **Create the file:**
   ```bash
   # Linux/macOS/Git Bash
   cp .env.example .env
   
   # Windows (PowerShell)
   copy .env.example .env
   ```
2. **Edit your variables:**
   Open `.env` and configure:
   * **JWT_SECRET:** A long, random string.
   * **INITIAL_OWNER_...:** Credentials for your first Admin account.
   * **DB_FORCE_SYNC:** Set to `true` for the first run to create tables.

> [!IMPORTANT]
> Never commit your `.env` file to GitHub. It is already included in the `.gitignore` to protect your secrets.

---

## Running & Testing

### Using Docker
* **Start Server:** `docker compose up -d`
* **View Logs:** `docker compose logs -f`
* **Development:** `docker compose -f docker-compose.yml -f docker-compose.dev.yml up`
* **Run Tests:**
  1. `docker compose -f docker-compose.yml -f docker-compose.test.yml up -d`
  2. `docker compose exec api npm run test`
  3. *To return to production mode:* `docker compose up -d`

### Using Manual Setup
* **Production:**  `npm run start-js` or `npm run start` (TypeScript version)
* **Development:** `npm run dev`
* **Run Tests:**
  1. Set `NODE_ENV=test` in `.env`.
  2. Run `npm test`.
  3. *To return to dev mode:* Set `NODE_ENV=prod` in `.env`

---

<details>
<summary><h2>Site Admin CLI Utility</h2></summary>

The Admin CLI is a command-line interface designed to manage **Site Admin privileges (Level 3)** directly via the terminal. This utility bypasses standard API routes to ensure the system owner can initialize the database or recover access.

### Usage
All commands should be executed through `npm run` with arguments passed after the `--` separator.
```bash
npm run admin -- [action] [parameters]

# Or using Docker:
docker compose exec api npm run admin -- [action] [parameters]
```

---

### Add New Admin
Registers a new user directly into the database with Site Admin privileges.
* **Requirements:** Direct database access (Terminal).
* **Action:** `add`

**Parameters:**
1. `name` (string)
2. `email` (string)
3. `password` (string)
4. `phone` (string/number)

**Example:**
```bash
npm run admin -- add "John Doe" john@example.com SecretPass123 555666777

# Or using Docker:
docker compose exec api npm run admin -- add "John Doe" john@example.com SecretPass123 555666777
```

---

### Elevate Existing User
Promotes an existing user account to Site Admin status by their unique ID.
* **Requirements:** Valid User ID existing in the database.
* **Action:** `elevate`

**Parameters:**
1. `id` (number)

**Example:**
```bash
npm run admin -- elevate 5

# Or using Docker:
docker compose exec api npm run admin -- elevate 5
```

---

### Revoke Admin Privileges
Demotes a Site Admin back to a standard user account.
* **Requirements:** Valid User ID.
* **Action:** `revoke`

**Parameters:**
1. `id` (number)

**Example:**
```bash
npm run admin -- revoke 5

# Or using Docker:
docker compose exec api npm run admin -- revoke 5
```

---

### Add Default Admin
Automates the creation of the first Site Admin using credentials stored in the `.env` configuration file.
* **Requirements:** `INITIAL_OWNER` variables defined in `CONFIG`.
* **Action:** `add-default`

**Example:**
```bash
npm run admin -- add-default

# Or using Docker:
docker compose exec api npm run admin -- add-default
```

</details>

---

<details>
<summary><h2>Cinema City API Fetcher</h2></summary>

The Cinema City API Fetcher is a command-line interface designed to fill out the database with fresh Movies. By default it fetches only 10 Movies to prevent rate-limiting.

**Parameters:**
1. `amount` (number)

**Example:**
```bash
npm run scrape -- 5

# Or using Docker:
docker compose exec api npm run scrape -- 5
```

</details>

---

## Documentation

### Additional information
- Users with higher privilege level can access endpoints with lower privilege level requirement (if they meet all other side criteria as well[^1]).
- All constants mentioned in the documentation can be found in [`constants.ts`](https://github.com/RC-GitHub/AbsoluteKino/blob/main/src/constants.ts) file.

### Middleware
These statuses apply globally across all modules. If a request fails here, it never reaches the logic layers.

| Status | Message Constant | Trigger Condition | Array Handling |
| :--- | :--- | :--- | :--- |
| **401** | `AUTH_REQUIRED` | Missing or malformed `auth_token` cookie. | Returns empty arrays[^2]. |
| **401** | `AUTH_SESSION` | `tokenVersion` mismatch or expired JWT. | Clears cookie; returns empty arrays[^2]. |
| **400** | `*_ERR_ID` | ID is not a number, NaN, or below `TYPICAL_MIN_ID`. | Returns empty arrays[^2]. |
| **403** | `AUTH_FORBIDDEN` | Insufficient level or no membership/ownership link. | Returns empty arrays[^2]. |
| **500** | `DB_ERR_ASSOCIATION` | Missing database relation (e.g., Seat has no associated Room). | Returns empty arrays[^2]. |

[^1]: Except for Site Admin users who usually bypass side criteria, unless they involve operations such as transaction completion
[^2]: Except for `/delete` endpoints.

---

<details open>
<summary><h3>/user</h3></summary>

#### POST /register
Creates a new user. If no data is provided, an unauthorized "Guest" account is created. To create an authorized account, credentials must be provided.
* **Requirements:** Public.

**Request Body (JSON):**
```json
{
  "name": "string",          // optional; length: USER_NAME_MIN to USER_NAME_MAX
  "password": "string",      // optional; length: USER_PASS_MIN to USER_NAME_MAX
  "email": "string",         // optional; regex: USER_EMAIL_REGEX
  "phoneNumber": "string"    // optional; regex: USER_PHONE_REGEX
}
```

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Registered successfully | `{ "message": USER_MSG_LOGIN, "users": [ UserInstance ] }`[^3] |
| **400** | Validation Error | `{ "message": <error message>, "users": [] }` |

[^3]: Returned `UserInstance` is without the password.

---

#### POST /login
Authenticates a user and sets an `auth_token` cookie.
* **Requirements:** Public.

**Request Body (JSON):**
```json
{
  "email": "string",         // required (if no phoneNumber is provided)
  "phoneNumber": "string",   // required (if no email is provided)
  "password": "string"       // required
}
```

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Logged in successfully | `{ "message": USER_MSG_LOGIN, "users": [ UserInstance ] }`[^3] |
| **400** | Validation Error | `{ "message": <error message>, "users": [] }` |
| **401** | Invalid credentials | `{ "message": USER_ERR_LOGIN, "users": [] }` |

---

#### POST /logout
Logs the user out by clearing the authentication cookie and incrementing the `tokenVersion` in the database to invalidate existing tokens.
* **Requirements:** Authenticated user privileges (Level 1).

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Logged out successfully | `{ "message": USER_MSG_LOGOUT }` |

---

#### GET /all
Returns data for all users.
* **Requirements:** Site-admin privileges (Level 3).

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Success | `{ "users": [ UserInstance, ... ] }` |
| **404** | No users found | `{ "message": USER_ERR_NOT_FOUND_ALL, "users": [] }` |

---

#### GET /id/:userId
Returns data for a specific user by ID.
* **Requirements:** Site-admin privileges (Level 3).
* **Path Params:** `userId` (Number, $\ge$ `TYPICAL_MIN_ID`).

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Success | `{ "users": [ UserInstance ] }` |
| **400** | Invalid ID format | `{ "message": USER_ERR_ID, "users": [] }` |
| **404** | User not found | `{ "message": USER_ERR_NOT_FOUND, "users": [] }` |

---

#### PUT /update/:userId
Updates user details. Users can update their own data (except for their account type); Site-admins can update anyone.
* **Requirements:** Public.
* **Path Params:** `userId` (Number, $\ge$ `TYPICAL_MIN_ID`).

**Request Body (JSON):**
> At least one field must be provided.
```json
{
  "name": "string",
  "password": "string",
  "email": "string",
  "phoneNumber": "string"
}
```

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Update Successful | `{ "message": USER_MSG_LOGIN, "users": [ UserInstance ] }`[^3] |
| **400** | Validation Error | `{ "message": <error message>, "users": [] }` |
| **404** | User not found | `{ "message": USER_ERR_NOT_FOUND, "users": [] }` |

---

#### PUT /update-type/:userId
Changes the `accountType` for a specific user. Unauthorized users can elevate themselves up to Authorized users. No user can lower their own privileges. Site Admins can update privileges up to Cinema Admin level (2). To grant the Site Admin privileges, the user must use [the CLI](#Site-Admin-CLI-Utility).
* **Requirements:** Public.
* **Path Params:** `userId` (Number, $\ge$ `TYPICAL_MIN_ID`).

**Request Body (JSON):**
```json
{
  "accountType": "string" // Must be a valid type from USER_ACC_TYPES
}
```

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Type updated | `{ "message": USER_MSG_LOGIN, "users": [ UserInstance ] }`[^3] |
| **400** | Validation Error | `{ "message": <error message>, "users": [] }` |

---

#### PUT /assign-cinema
Assigns a specific cinema to a user (promoting them to Cinema Admin if they were a standard User).
* **Requirements:** Site-admin privileges (Level 3).

**Request Body (JSON):**
```json
{
  "userId": number,     // must exist in the database
  "cinemaId": number    // must exist in the database
}
```

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Cinema assigned | `{ "message": USER_MSG_CINEMA_ASSIGN, "users": [ UserWithCinemas ] }` |
| **400** | Validation Error | `{ "message": <error message>, "users": [] }` |
| **404** | User/Cinema not found | `{ "message": <error message>, "users": [] }` |

---

#### DELETE /unassign-cinema
Deletes the connection between a user and a cinema.
* **Requirements:** Site Admin privileges (Level 3)

**Request Body (JSON):**
```json
{
  "userId": number,   // required; must exist in the database
  "cinemaId": number  // required; must exist in the database
}
```

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Success | `{ "message": USER_MSG_CINEMA_UNASSIGN, "users": [ UserInstance ] }` |
| **400** | Validation Error | `{ "message": <error message>, "users": [] }` |
| **404** | Validation Error | `{ "message": <error message>, "users": [] }` |

---

#### DELETE /delete/:userId
Deletes a non-Site Admin user from the system.
* **Requirements:** Site-admin privileges (Level 3)
* **Path Params:** `userId` (Number, $\ge$ `TYPICAL_MIN_ID`).

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Deletion Successful | `{ "message": USER_MSG_DEL }` |
| **400** | Validation Error | `{ "message": <error message> }` |
| **404** | User not found | `{ "message": USER_ERR_NOT_FOUND }` |

</details>

---

<details>
<summary><h3>/cinema</h3></summary>
<br>

#### POST /new
Adds a new cinema to the system. 
* **Requirements:** Site-admin privileges (Level 3).

**Request Body (JSON):**
```json
{
  "name": "string",      // required; length: CINEMA_NAME_MIN to CINEMA_NAME_MAX
  "address": "string",   // required; regex: CINEMA_POLISH_ADDRESS_REGEX
  "latitude": 12.345,    // required; range: CINEMA_MIN_LATITUDE to CINEMA_MAX_LATITUDE
  "longitude": 67.890    // required; range: CINEMA_MIN_LONGITUDE to CINEMA_MAX_LONGITUDE
}
```

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Success | `{ "cinemas": [ CinemaInstance ] }` |
| **400** | Validation Error | `{ "message": <error message>, "cinemas": [] }` |
| **401** | Unauthorized | `{ "message": "Unauthorized" }` |

---

#### GET /all
Returns a list of all cinemas in the database.
* **Requirements:** Public.

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Success | `{ "cinemas": [ CinemaInstance, ... ] }` |
| **404** | No cinemas found | `{ "message": "CINEMA_ERR_NOT_FOUND_ALL", "cinemas": [] }` |

---

#### GET /id/:cinemaId
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

#### PUT /update/:cinemaId
Updates an existing cinema record.
* **Requirements:** Site Admin privileges (Level 3).
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
| **400** | Validation Error | `{ "message": <error message>, "cinemas": [] }` |
| **404** | Cinema not found | `{ "message": "CINEMA_ERR_NOT_FOUND", "cinemas": [] }` |

---

#### DELETE /delete/:cinemaId
Removes a cinema from the database.
* **Requirements:** Site Admin privileges (Level 3).
* **Path Params:** `cinemaId` (Number, $\ge$ `TYPICAL_MIN_ID`).

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Deletion Successful | `{ "message": "CINEMA_MSG_DEL" }` |
| **400** | Invalid ID | `{ "message": "CINEMA_ERR_ID" }` |
| **404** | Cinema not found | `{ "message": "CINEMA_ERR_NOT_FOUND" }` |

</details>

---

<details>
<summary><h3>/room</h3></summary>

#### POST /new
Adds a new room to a specific cinema. 
* **Requirements:** Cinema-admin privileges (Level 2) and cinema membership.

**Request Body (JSON):**
```json
{
  "name": "string",      // required; range: ROOM_NAME_MIN to ROOM_NAME_MAX
  "cinemaId": number,    // required; must exist in database
  "width": number,       // optional; range: ROOM_WIDTH_MIN_VAL to ROOM_WIDTH_MAX_VAL; default: ROOM_WIDTH_DEF_VAL
  "depth": number,       // optional; range: ROOM_DEPTH_MIN_VAL to ROOM_DEPTH_MAX_VAL; default: ROOM_DEPTH_DEF_VAL
  "rowAmount": number,   // optional; range: ROOM_ROWS_MIN_VAL to ROOM_ROWS_MAX_VAL; default: ROOM_ROWS_DEF_VAL
  "colAmount": number    // optional; range: ROOM_COLS_MIN_VAL to ROOM_COLS_MAX_VAL; default: ROOM_COLS_DEF_VAL
}
```

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Success | `{ "rooms": [ RoomInstance ] }` |
| **400** | Validation Error | `{ "message": <error message>, "rooms": [] }` |
| **404** | Cinema not found | `{ "message": CINEMA_ERR_NOT_FOUND, "rooms": [] }` |

---

#### POST /new/default-seats
Creates a new room and automatically populates it with a grid of seats, accounting for specified stair placements.
* **Requirements:** Cinema-admin privileges (Level 2) and cinema membership connected with both rooms and seats.

**Request Body (JSON):**
```json
{
  "name": "string",         // required; range: ROOM_NAME_MIN to ROOM_NAME_MAX
  "cinemaId": number,       // required; must exist in database    
  "stairsPlacements": [     // required
    { 
      "x": number,          // range: 0 to room.width
      "width": number       // range: ROOM_STAIRS_MIN_VAL to ROOM_STAIRS_MAX_VAL; default: ROOM_STAIRS_DEF_VAL    
    }
  ],
  "width": number,       // optional; range: ROOM_WIDTH_MIN_VAL to ROOM_WIDTH_MAX_VAL; default: ROOM_WIDTH_DEF_VAL
  "depth": number,       // optional; range: ROOM_DEPTH_MIN_VAL to ROOM_DEPTH_MAX_VAL; default: ROOM_DEPTH_DEF_VAL
  "rowAmount": number,   // optional; range: ROOM_ROWS_MIN_VAL to ROOM_ROWS_MAX_VAL; default: ROOM_ROWS_DEF_VAL
  "colAmount": number    // optional; range: ROOM_COLS_MIN_VAL to ROOM_COLS_MAX_VAL; default: ROOM_COLS_DEF_VAL
}
```

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Success | `{ "rooms": [ Room ], "seats": [ Seat, ... ] }` |
| **400** | Validation Error / Dimensions exceeded | `{ "message": <error message>, "rooms": [], "seats": [] }` |

---

#### GET /all/:cinemaId
Returns all rooms belonging to a specific cinema.
* **Requirements:** Public.
* **Path Params:** `cinemaId` (Number, $\ge$ `TYPICAL_MIN_ID`).

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Success | `{ "rooms": [ RoomInstance, ... ] }` |
| **400** | Invalid Cinema ID | `{ "message": CINEMA_ERR_ID, "rooms": [] }` |
| **404** | Cinema or Rooms not found | `{ "message": <error message>, "rooms": [] }` |

---

#### GET /id/:roomId
Returns details of a specific room by its unique ID.
* **Requirements:** Public.
* **Path Params:** `roomId` (Number, $\ge$ `TYPICAL_MIN_ID`).

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Success | `{ "rooms": [ RoomInstance ] }` |
| **400** | Invalid Room ID | `{ "message": ROOM_ERR_ID, "rooms": [] }` |
| **404** | Room not found | `{ "message": ROOM_ERR_NOT_FOUND_GLOBAL, "rooms": [] }` |

---

#### PUT /update/:roomId
Updates an existing room's attributes.
* **Requirements:** Cinema Admin privileges (Level 2) and cinema membership connected with the room.
* **Path Params:** `roomId` (Number, $\ge$ `TYPICAL_MIN_ID`).

**Request Body (JSON):**
> Both `name` and `cinemaId` are required in the body for this implementation.
```json
{
  "name": "string",
  "cinemaId": number,
  "width": number,
  "depth": number,
  "rowAmount": number,
  "colAmount": number
}
```

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Update Successful | `{ "rooms": [ RoomInstance ] }` |
| **400** | Validation Error | `{ "message": <error message>, "rooms": [] }` |
| **404** | Room/Cinema not found | `{ "message": <error message>, "rooms": [] }` |

---

#### DELETE /delete/:roomId
Permanently removes a room from the database.
* **Requirements:** Cinema Admin privileges (Level 2) and cinema membership connected with the room.
* **Path Params:** `roomId` (Number, $\ge$ `TYPICAL_MIN_ID`).

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Deletion Successful | `{ "message": ROOM_MSG_DEL }` |
| **400** | Invalid Room ID | `{ "message": ROOM_ERR_ID }` |
| **404** | Room not found | `{ "message": ROOM_ERR_NOT_FOUND_GLOBAL }` |

</details>

---

<details>
<summary><h3>/seat</h3></summary>

#### POST /new
Adds a single seat to a specific room. Validates coordinates and grid positions against the room's physical dimensions and constraints.
* **Requirements:** Cinema Admin privileges (Level 2) and cinema membership connected with the room.

**Request Body (JSON):**
```json
{
  "x": number,          // required; range: 0 to room.width
  "y": number,          // required; range: 0 to room.depth
  "row": number,        // required; range: 1 to room.rowAmount
  "column": number,     // required; range: 1 to room.colAmount
  "type": "string",     // required; must be in SEAT_TYPES
  "roomId": number,     // required; must exist in database
  "width": number,      // optional; range: SEAT_WIDTH_MIN to SEAT_WIDTH_MAX
  "depth": number       // optional; range: SEAT_DEPTH_MIN to SEAT_DEPTH_MAX
}
```

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Success | `{ "seats": [ SeatInstance ] }` |
| **400** | Validation Error | `{ "message": <error message>, "seats": [] }` |
| **404** | Room not found | `{ "message": ROOM_ERR_NOT_FOUND_GLOBAL, "seats": [] }` |

---

#### GET /all/:roomId
Returns a list of all seats within a specified room.
* **Requirements:** Public.
* **Path Params:** `roomId` (Number, $\ge$ `TYPICAL_MIN_ID`).

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Success | `{ "seats": [ SeatInstance, ... ] }` |
| **400** | Invalid Room ID | `{ "message": ROOM_ERR_ID, "seats": [] }` |
| **404** | Room or Seats not found | `{ "message": <error message>, "seats": [] }` |

---

#### GET /id/:seatId
Returns details for a specific seat by its ID.
* **Requirements:** Public.
* **Path Params:** `seatId` (Number, $\ge$ `TYPICAL_MIN_ID`).

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Success | `{ "seats": [ SeatInstance ] }` |
| **400** | Invalid Seat ID | `{ "message": SEAT_ERR_ID, "seats": [] }` |
| **404** | Seat not found | `{ "message": SEAT_ERR_NOT_FOUND, "seats": [] }` |

---

#### PUT /update/:seatId
Updates an existing seat's configuration.
* **Requirements:** Cinema-admin privileges (Level 2) and seat access.
* **Path Params:** `seatId` (Number, $\ge$ `TYPICAL_MIN_ID`).

**Request Body (JSON):**
> At least one field is required. Coordinates and grid positions are re-validated against the room's limits.
```json
{
  "x": number,
  "y": number,
  "width": number,
  "depth": number,
  "row": number,
  "column": number,
  "type": "string"
}
```

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Update Successful | `{ "seats": [ SeatInstance ] }` |
| **400** | Validation Error | `{ "message": <error message>, "seats": [] }` |
| **404** | Seat or Room not found | `{ "message": <error message>, "seats": [] }` |

---

#### DELETE /delete/:seatId
Permanently removes a seat from the room layout.
* **Requirements:** Cinema Admin privileges (Level 2) and cinema membership connected with the seat.
* **Path Params:** `seatId` (Number, $\ge$ `TYPICAL_MIN_ID`).

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Deletion Successful | `{ "message": SEAT_MSG_DEL }` |
| **400** | Invalid Seat ID | `{ "message": SEAT_ERR_ID }` |
| **404** | Seat not found | `{ "message": SEAT_ERR_NOT_FOUND }` |

</details>

---

<details>
<summary><h3>/movie</h3></summary>

#### POST /new
Adds a new movie to the global database. Includes extensive validation for strings, URL formats[^4] (Poster/Trailer), and ISO date parsing.
* **Requirements:** Site Admin privileges (Level 3).

**Request Body (JSON):**
```json
{
  "title": "string",          // required; length: MOVIE_TITLE_MIN_LEN to MOVIE_TITLE_MAX_LEN
  "viewingFormat": "string",  // required; length: MOVIE_VF_MIN_LEN to MOVIE_VF_MAX_LEN
  "duration": 120,            // required; range: MOVIE_DUR_MIN to MOVIE_DUR_MAX
  "description": "string",    // required; length: MOVIE_DESC_MIN_LEN to MOVIE_DESC_MAX_LEN
  "posterUrl": "string",      // required; regex: isValidURL() pattern
  "trailerUrl": "string",     // required; regex: isValidURL() pattern
  "language": "string",       // required; length: MOVIE_LANG_MIN_LEN to MOVIE_LANG_MAX_LEN
  "premiereDate": "string",   // required; format: ISO 8601 (YYYY-MM-DD)
  "genre": "string",          // required; length: MOVIE_GENRE_MIN_LEN to MOVIE_GENRE_MAX_LEN
  "restrictions": "string",   // required; length: MOVIE_AR_MIN_LEN to MOVIE_AR_MAX_LEN
  "cast": "string",           // required; length: MOVIE_CAST_MIN_LEN to MOVIE_CAST_MAX_LEN
  "directors": "string"       // required; length: MOVIE_DIR_MIN_LEN to MOVIE_DIR_MAX_LEN
}
```

[^4]: The function can be found in the [`movie.ts`](https://github.com/RC-GitHub/AbsoluteKino/blob/main/src/routes/movie.ts) file.

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Success | `{ "movies": [ MovieInstance ] }` |
| **400** | Validation Error | `{ "message": <error message>, "movies": [] }` |
| **401** | Unauthorized | `{ "message": AUTH_REQUIRED, "movies": [] }` |

---

#### GET /all
Retrieves all movies currently in the database.
* **Requirements:** Public.

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Success | `{ "movies": [ MovieInstance, ... ] }` |
| **404** | No movies found | `{ "message": MOVIE_ERR_NOT_FOUND_ALL, "movies": [] }` |

---

#### GET /id/:movieId
Returns data for a specific movie by its ID.
* **Requirements:** Public.

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Success | `{ "movies": [ MovieInstance ] }` |
| **400** | Invalid ID format | `{ "message": MOVIE_ERR_ID, "movies": [] }` |
| **404** | Movie not found | `{ "message": MOVIE_ERR_NOT_FOUND, "movies": [] }` |

---

#### PUT /update/:movieId
Updates an existing movie record.
* **Requirements:** Site Admin privileges (Level 3).

**Request Body (JSON):**
> At least one field is required.
```json
{
  "title": "string",
  "viewingFormat": "string",
  "duration": number,
  "description": "string",
  "posterUrl": "string",
  "trailerUrl": "string",
  "language": "string",
  "premiereDate": "string",
  "genre": "string",
  "restrictions": "string",
  "cast": "string",
  "directors": "string"
}
```

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Update Successful | `{ "movies": [ MovieInstance ] }` |
| **400** | Validation Error | `{ "message": <error message>, "movies": [] }` |
| **404** | Movie not found | `{ "message": MOVIE_ERR_NOT_FOUND, "movies": [] }` |

---

#### DELETE /delete/:movieId
Permanently removes a movie from the database.
* **Requirements:** Site Admin privileges (Level 3).

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Success | `{ "message": MOVIE_MSG_DEL }` |
| **400** | Invalid ID format | `{ "message": MOVIE_ERR_ID }` |
| **404** | Movie not found | `{ "message": MOVIE_ERR_NOT_FOUND }` |

</details>

---

<details>
<summary><h3>/screening</h3></summary>

#### POST /new
Creates a new screening, linking a specific movie to a room at a scheduled time.
* **Requirements:** Cinema Admin privileges (Level 2) and cinema membership.

**Request Body (JSON):**
```json
{
  "startDate": "string",  // required; format: ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)
  "roomId": 1,            // required; must exist in database
  "movieId": 1,           // required; must exist in database
  "basePrice": 25.50      // optional; range: > 0; default: SCREENING_BASE_SEAT_PRICE
}
```

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Success | `{ "screenings": [ ScreeningInstance ] }` |
| **400** | Validation Error | `{ "message": <error message>, "screenings": [] }` |
| **404** | Linked ID Not Found | `{ "message": <error message>, "screenings": [] }` |

---

#### GET /all
Retrieves all screenings globally across all cinemas.
* **Requirements:** Public.

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Success | `{ "screenings": [ ScreeningInstance, ... ] }` |
| **404** | Empty Database | `{ "message": SCREENING_ERR_NOT_FOUND_ALL, "screenings": [] }` |

---

#### GET /all/room/:roomId
Retrieves all screenings for a specific room.
* **Requirements:** Public.
* **Path Params:** `roomId` (Number, $\ge$ `TYPICAL_MIN_ID`).

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Success | `{ "screenings": [ ScreeningInstance, ... ] }` |
| **400** | Invalid ID | `{ "message": ROOM_ERR_ID, "screenings": [] }` |
| **404** | No screenings in room | `{ "message": SCREENING_ERR_NOT_FOUND_ROOM, "screenings": [] }` |

---

#### GET /all/movie/:movieId
Retrieves all screenings for a specific movie.
* **Requirements:** Public.
* **Path Params:** `movieId` (Number, $\ge$ `TYPICAL_MIN_ID`).

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Success | `{ "screenings": [ ScreeningInstance, ... ] }` |
| **404** | No screenings for movie | `{ "message": SCREENING_ERR_NOT_FOUND_MOVIE, "screenings": [] }` |

---

#### GET /id/:screeningId
Returns data for a single screening by its unique ID.
* **Requirements:** Public.
* **Path Params:** `screeningId` (Number, $\ge$ `TYPICAL_MIN_ID`).

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Success | `{ "screenings": [ ScreeningInstance ] }` |
| **404** | Screening not found | `{ "message": SCREENING_ERR_NOT_FOUND_GLOBAL, "screenings": [] }` |

---

#### PUT /update/:screeningId
Updates screening details. Validates existence of new `roomId` or `movieId` if provided.
* **Requirements:** Cinema Admin privileges (Level 2) and cinema membership connected with the screening.
* **Path Params:** `screeningId` (Number, $\ge$ `TYPICAL_MIN_ID`).

**Request Body (JSON):**
> At least one field is required.
```json
{
  "startDate": "string",
  "basePrice": number,
  "roomId": number,
  "movieId": number
}
```

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Success | `{ "screenings": [ ScreeningInstance ] }` |
| **400** | Validation Error | `{ "message": <error message>, "screenings": [] }` |
| **404** | Resource not found | `{ "message": <error message>, "screenings": [] }` |

---

#### DELETE /delete/:screeningId
Removes a screening from the schedule.
* **Requirements:** Cinema Admin privileges (Level 2) and cinema membership connected with the screening.
* **Path Params:** `screeningId` (Number, $\ge$ `TYPICAL_MIN_ID`).

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Success | `{ "message": SCREENING_MSG_DEL }` |
| **404** | Screening not found | `{ "message": SCREENING_ERR_NOT_FOUND_GLOBAL }` |

</details>

---

<details>
<summary><h3>/reservation</h3></summary>

#### POST /new
Adds a new reservation for a specific seat at a screening.
* **Requirements:** Public.

**Request Body (JSON):**
```json
{
  "type": "string",      // required; valid RESERVATION_TYPES
  "seatId": 1,           // required; must exist in the database
  "screeningId": 1       // required; must exist in the database
}
```

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Success | `{ "reservations": [ ReservationInstance ] }` |
| **400** | Validation Error | `{ "message": <error message>, "reservations": [] }` |
| **404** | Not Found | `{ "message": <error message>, "reservations": [] }` |

---

#### POST /new/bulk
Adds multiple reservations in bulk using a database transaction.
* **Requirements:** Public.

**Request Body (JSON):**
```json
{
  "type": "string",      // required; valid RESERVATION_TYPES
  "seatIds": [1, 2],     // required; array of integers; all must exist in the database
  "screeningId": 1       // required; must exist in the database
}
```

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Success | `{ "reservations": [ ReservationInstance, ... ] }` |
| **400** | Validation Error | `{ "message": <error message>, "reservations": [] }` |

---

#### GET /all
Sends data about all reservations.
* **Requirements:** Site Admin privileges (Level 3).

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Success | `{ "reservations": [ ReservationInstance, ... ] }` |
| **404** | Empty | `{ "message": RESERVATION_ERR_NOT_FOUND_ALL, "reservations": [] }` |

---

#### GET /all/screening/:screeningId
Sends data about all reservations for a specific screening.
* **Requirements:** Site Admin privileges (Level 3).
* **Path Params:** `screeningId` (Number, $\ge$ `TYPICAL_MIN_ID`).

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Success | `{ "reservations": [ ReservationInstance, ... ] }` |
| **400** | Invalid ID | `{ "message": SCREENING_ERR_ID, "reservations": [] }` |
| **404** | No results | `{ "message": RESERVATION_ERR_NOT_FOUND_SCREENING, "reservations": [] }` |

---

#### GET /all/user/:userId
Sends data about all reservations for a specific user.
* **Requirements:** Authenticated user privileges (Level 1) and valid cookie corresponding to the `userId`.
* **Path Params:** `userId` (Number, $\ge$ `TYPICAL_MIN_ID`).

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Success | `{ "reservations": [ ReservationInstance, ... ] }` |
| **403** | Forbidden | `{ "message": AUTH_FORBIDDEN, "reservations": [] }` |

---
#### GET /all/seat/:seatId
Sends data about all reservations for a specific seat.
* **Requirements:** Site Admin privileges (Level 3).

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Success | `{ "reservations": [ ReservationInstance, ... ] }` |
| **400** | Invalid ID | `{ "message": SEAT_ERR_ID, "reservations": [] }` |
| **404** | No results | `{ "message": RESERVATION_ERR_NOT_FOUND_SEAT, "reservations": [] }` |

---

#### PUT /update/:reservationId
Updates data (moves a seat) for a reservation with the specified ID
**Note:** screeningId and clientId cannot be changed per requirements.
* **Requirements:** Site Admin privileges (Level 3).
* **Path Params:** `reservationId` (Number, $\ge$ `TYPICAL_MIN_ID`).

**Request Body (JSON):**
```json
{
  "type": "string",     // required; valid RESERVATION_TYPE
  "seatId": number      // required; must exist in the database
}
```

---

#### POST /complete
Completes multiple reservations by verifying payment amount against seat-type calculations.
* **Requirements:** Authenticated user privileges (Level 1) and valid cookie corresponding to the `userId`.

##### Reservation Price Calculation Logic
The system calculates final payment requirements based on seat types:
* **Standard:** `basePrice`
* **VIP:** `(basePrice * 1.25) + 3`
* **Discounted:** `basePrice * 0.8`

Payment verification uses a `0.01` tolerance for floating-point comparisons. Successful completion updates the reservation type to the status defined in `RESERVATION_TYPES[1]`.

**Request Body (JSON):**
```json
{
  "reservationIds": [1, 2],     // required; array of integers; all must exist in the database
  "amount": number              // required; value >= 0
}
```

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Success | `{ "message": RESERVATION_ERR_COMPLETED, "amountPaid": number, "reservations": [] }` |
| **400** | Payment Mismatch | `{ "message": RESERVATION_ERR_PAYMENT, "reservations": [] }` |

---

#### DELETE /delete/:reservationId
Deletes a reservation with the specified ID.
* **Requirements:** Authenticated user privileges (Level 1) and valid cookie corresponding to the `userId`.
* **Path Params:** `reservationId` (Number, $\ge$ `TYPICAL_MIN_ID`).

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Success | `{ "message": RESERVATION_MSG_DEL }` |
| **403** | Forbidden | `{ "message": AUTH_FORBIDDEN }` |
| **404** | Not Found | `{ "message": RESERVATION_ERR_NOT_FOUND }` |

</details>

---

<details>
<summary><h3>/products</h3></summary>

#### POST /new
Adds a product to the database.
* **Requirements:** Cinema admin privileges (Level 2)

**Request Body (JSON):**
```json
{
  "name": "string",       // required; length: PRODUCT_NAME_MIN_LEN to PRODUCT_NAME_MAX_LEN
  "price": number,        // required; min: PRODUCT_PRICE_MIN_VAL
  "cinemaId": number,     // required; must exist in the database
  "size": "string",       // optional; must be in PRODUCT_SIZES
  "discount": number      // optional; range: PRODUCT_DISCOUNT_MIN_VAL to PRODUCT_DISCOUNT_MAX_VAL
}
```

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Success | `{ "products": [ ProductInstance ] }` |
| **400** | Validation Error | `{ "message": <error message>, "products": [] }` |
| **404** | Cinema Not Found | `{ "message": CINEMA_ERR_NOT_FOUND, "products": [] }` |

---

#### GET /all
Sends data about all products.
* **Requirements:** Public.

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Success | `{ "products": [ ProductInstance, ... ] }` |
| **404** | Empty | `{ "message": PRODUCT_ERR_NOT_FOUND_ALL, "products": [] }` |

---

#### GET /all/cinema/:cinemaId
Fetches products for a specific cinema.
* **Requirements:** Public.
* **Path Params:** `cinemaId` (Number, $\ge$ `TYPICAL_MIN_ID`).

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Success | `{ "products": [ ProductInstance, ... ] }` |
| **400** | Invalid ID | `{ "message": CINEMA_ERR_ID, "products": [] }` |
| **404** | Not Found | `{ "message": CINEMA_ERR_NOT_FOUND, "products": [] }` |

---

#### PUT /update/:productId
Updates data for a product with the specified ID.
* **Requirements:** Cinema Admin privileges (Level 2) and cinema membership connected with the product
* **Path Params:** `productId` (Number, $\ge$ `TYPICAL_MIN_ID`).

**Request Body (JSON):**
> At least one field is required.
```json
{
  "name": "string",       
  "price": number,        
  "size": "string",       
  "discount": number,     
  "cinemaId": number      
}
```

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Success | `{ "products": [ ProductInstance ] }` |
| **400** | Validation Error | `{ "message": <error message>, "products": [] }` |
| **404** | Not Found | `{ "message": <error message>, "products": [] }` |

---

#### DELETE /delete/:productId
Deletes a product with the specified ID.
* **Requirements:** Cinema admin privileges (Level 2) and cinema membership connected with the product
* **Path Params:** `productId` (Number, $\ge$ `TYPICAL_MIN_ID`).

**Responses:**
| Status | Description | Body |
| :--- | :--- | :--- |
| **200** | Success | `{ "message": PRODUCT_MSG_DEL }` |
| **400** | Invalid ID | `{ "message": PRODUCT_ERR_ID }` |
| **404** | Not Found | `{ "message": PRODUCT_ERR_NOT_FOUND, "products": [] }` |

</details>
