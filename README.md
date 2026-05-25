# AbsoluteKino
Backend for a platform capable of managing cinemas and related data.

---

## Installation
You can set up the project manually or use **Docker** for an isolated environment.

### Docker (Recommended for all platforms)
Docker ensures the app runs exactly the same on Windows and Linux without worrying about local Node.js versions.

1. **Prerequisites:**
   * **Windows**: Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) and [Git](https://git-scm.com/), then run Docker Desktop
   * **Linux**: Install `docker` + `docker-compose` on your system.
3. **Terminal setup:**
   ```bash
   git clone https://github.com/RC-GitHub/AbsoluteKino.git
   cd AbsoluteKino

   # IMPORTANT: Complete the "Environment Configuration" section below first!

   # Standard compose up creates the production version
   docker compose up
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
   * **EXTERNAL_PORT:** The port to call to send requests (`http://localhost:<EXTERNAL_PORT>`)
   * **JWT_SECRET:** A long, random string.
   * **INITIAL_OWNER_...:** Credentials for your first Admin account.
  
   On top of that the user might define their own database supported by [Sequelize](https://sequelize.org/)
   (**Note:** That would however require adding necessary `npm` packages)

> [!IMPORTANT]
> Never commit your `.env` file to GitHub. It is already included in the `.gitignore` to protect your secrets.

---

## Running & Testing

### Using Docker
* **Start Server:** `docker compose up` or `docker compose -f docker-compose.prod.yml up`
* **View Logs:** `docker compose logs -f`
* **Development:** `docker compose -f docker-compose.dev.yml up`
* **Run Tests:**
  1. `docker compose -f docker-compose.dev.yml up`
  2. `docker compose exec api npm run test`
  3. *To return to production mode:* `docker compose up` or `docker compose -f docker-compose.prod.yml up`

### Using Manual Setup
* **Production:**  
  * `npm run build` then `npm run start-js` or 
  * `npm run start` (TypeScript version)
* **Development:** `npm run dev`
* **Run Tests:**
  1. Set `NODE_ENV=test` in `.env`.
  2. Run `npm test`.
  3. *To return to dev mode:* Set `NODE_ENV=prod` in `.env`

---

## CLI Utilities

<details>
<summary><h3>Site Admin CLI Utility</h3></summary>

The Admin CLI is a command-line interface designed to manage **Site Admin privileges (Level 3)** directly via the terminal. This utility bypasses standard API routes to ensure the system owner can initialize the database or recover access.

#### Usage
All commands should be executed through `npm run` with arguments passed after the `--` separator.
```bash
npm run admin -- [action] [parameters]
npm run admin-js -- [action] [parameters]

# Or using Docker:
docker compose exec api npm run admin -- [action] [parameters]
docker compose exec api npm run admin-js -- [action] [parameters]
```

---

#### Add New Admin
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
npm run admin-js -- add "John Doe" john@example.com SecretPass123 555666777

# Or using Docker:
docker compose exec api npm run admin -- add "John Doe" john@example.com SecretPass123 555666777
docker compose exec api npm run admin-js -- add "John Doe" john@example.com SecretPass123 555666777
```

---

#### Elevate Existing User
Promotes an existing user account to Site Admin status by their unique ID.
* **Requirements:** Valid User ID existing in the database.
* **Action:** `elevate`

**Parameters:**
1. `id` (number)

**Example:**
```bash
npm run admin -- elevate 5
npm run admin-js -- elevate 5

# Or using Docker:
docker compose exec api npm run admin -- elevate 5
docker compose exec api npm run admin-js -- elevate 5
```

---

#### Revoke Admin Privileges
Demotes a Site Admin back to a standard user account.
* **Requirements:** Valid User ID.
* **Action:** `revoke`

**Parameters:**
1. `id` (number)

**Example:**
```bash
npm run admin -- revoke 5
npm run admin-js -- revoke 5

# Or using Docker:
docker compose exec api npm run admin -- revoke 5
docker compose exec api npm run admin-js -- revoke 5
```

---

#### Add Default Admin
Automates the creation of the first Site Admin using credentials stored in the `.env` configuration file.
* **Requirements:** `INITIAL_OWNER` variables defined in `CONFIG`.
* **Action:** `add-default`

**Example:**
```bash
npm run admin -- add-default
npm run admin-js -- add-default

# Or using Docker:
docker compose exec api npm run admin -- add-default
docker compose exec api npm run admin-js -- add-default
```

</details>

---

<details>
<summary><h3>Cinema City API Fetcher</h3></summary>

The Cinema City API Fetcher is a command-line interface designed to fill out the database with fresh Movies. By default it fetches only 10 Movies to prevent rate-limiting.

**Parameters:**
1. `amount` (number)

**Example:**
```bash
npm run scrape -- 5
npm run scrape-js -- 5

# Or using Docker:
docker compose exec api npm run scrape -- 5
docker compose exec api npm run scrape-js -- 5
```

</details>

---

## Documentation

### Architecture
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Web Framework**: [Express](https://expressjs.com/en/)
- **ORM**: [Sequelize](https://sequelize.org/)
- **Database**: [SQLite](https://sqlite.org/) (by default)

### Additional information
- Users with higher privilege level can access endpoints with lower privilege level requirement (if they meet all other side criteria as well[^1]).
- All constants mentioned in the documentation can be found in [`constants.ts`](https://github.com/RC-GitHub/AbsoluteKino/blob/main/src/constants.ts) file.

### Middleware
These statuses apply globally across all modules. If a request fails here, it never reaches the logic layers.

| Status | Message Constant | Trigger Condition | Array Handling |
| :--- | :--- | :--- | :--- |
| **400** | `*_ERR_ID` | ID is not a number, NaN, or below `TYPICAL_MIN_ID`. | Returns empty arrays[^2]. |
| **401** | `AUTH_REQUIRED` | Missing or malformed `auth_token` cookie. | Returns empty arrays[^2]. |
| **401** | `AUTH_SESSION` | `tokenVersion` mismatch or expired JWT. | Clears cookie; returns empty arrays[^2]. |
| **403** | `AUTH_FORBIDDEN` | Insufficient level or no membership/ownership link. | Returns empty arrays[^2]. |
| **500** | `DB_ERR_ASSOCIATION` | Missing database relation (e.g., Seat has no associated Room). | Returns empty arrays[^2]. |

[^1]: Except for Site Admin users who usually bypass side criteria, unless they involve operations such as transaction completion
[^2]: Except for `/delete` endpoints.

---

### Endpoints
Endpoint documentation can be found in [`ENDPOINT_DOCUMENTATION.md`](https://github.com/RC-GitHub/AbsoluteKino/blob/main/ENDPOINT_DOCUMENTATION.md).
