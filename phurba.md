# Phurba — Changes Log

## User Story 1: Administrator Login & Authentication

**As an Administrator**, I want to authenticate with my email and password before accessing any part of the dashboard, so that sensitive lead information remains completely inaccessible to anyone who is not an authorized Nexus-IT employee.

### Changes Made

#### Backend — Secure Credential Verification

- **`app/routers/auth.py`**
  - Replaced the placeholder route with a full authentication endpoint
  - `POST /auth/login` — accepts email and password, verifies against bcrypt-hashed credentials, returns a JWT token
  - `GET /auth/me` — verifies a JWT token and returns user info
  - Passwords are stored only as bcrypt hashes and never returned in any response
  - Invalid credentials produce a single generic error message ("Invalid email or password") that does not reveal which field was wrong

#### Frontend — Login Screen

- **`app/admin/login/page.tsx`**
  - Built the administrator login screen with email and password fields
  - Form validation with `required` attributes and proper input types
  - Displays clear error messages on failed login attempts
  - Shows loading state ("Signing in...") while the request is in progress

#### Session Management

- **`app/lib/session.ts`**
  - Encrypts session data into a JWT stored in an HttpOnly cookie
  - `createSession()` — creates a secure cookie after successful login
  - `deleteSession()` — clears the session cookie on logout
  - `getSession()` — reads and decrypts the current session from cookies

#### Server Actions

- **`app/actions/auth.ts`**
  - `login()` — server action that sends credentials to the FastAPI backend, creates a session cookie on success, and redirects to the dashboard
  - `logout()` — server action that deletes the session and redirects to the login page

#### Route Protection

- **`proxy.ts`**
  - Intercepts all `/admin/*` routes
  - Allows `/admin/login` as a public route
  - Verifies the session cookie JWT on every protected request
  - Redirects to `/admin/login` if no session or invalid/expired session is detected

#### Dashboard

- **`app/admin/page.tsx`**
  - Added server-side session check — redirects to login if unauthenticated
  - Displays the logged-in user's name and email
  - Includes a Sign Out button that triggers the logout server action

#### Dependencies

- **`requirements.txt`** — added `bcrypt`, `PyJWT`, `email-validator`
- **`package.json`** — installed `jose`, `server-only`
- **`.env.example`** — added `SESSION_SECRET` variable

---

## User Story 2: Session Inactivity Expiry

**As an Administrator**, I want my dashboard session to expire automatically after inactivity, so that lead data remains protected even if I leave my workstation unattended or forget to log out.

### Changes Made

#### Sliding-Window Session (Server-Side)

- **`app/lib/session.ts`**
  - Changed session expiry from a fixed 8-hour window to a 15-minute inactivity timeout
  - Added `SESSION_TIMEOUT_MINUTES` constant (set to 15)
  - Added `refreshSession()` function that reissues the session with a fresh expiry

#### Proxy-Level Session Refresh

- **`proxy.ts`**
  - On every valid authenticated request, the proxy now reissues a fresh session cookie with a reset 15-minute expiry (sliding window)
  - If the JWT has expired (no activity for 15 minutes), the proxy clears the cookie and redirects to `/admin/login?expired=1`

#### Client-Side Inactivity Monitor

- **`components/SessionGuard.tsx`**
  - Monitors user activity events: mouse movement, clicks, key presses, scrolling, and touch
  - Resets the inactivity timer on any detected activity
  - Shows a warning toast 2 minutes before session expiry ("Your session will expire in 2 minutes due to inactivity")
  - Forces a redirect to the login page when the full 15-minute timeout elapses

#### Admin Layout

- **`app/admin/layout.tsx`**
  - Created a shared layout for all `/admin/*` pages
  - Wraps every admin page with the `<SessionGuard />` component so inactivity detection applies consistently across the entire dashboard

#### Expired Session Feedback

- **`app/admin/login/page.tsx`**
  - Reads the `?expired=1` query parameter from the URL
  - Displays an amber banner: "Your session has expired due to inactivity. Please sign in again."
  - The banner is hidden once the user submits the login form

---

## Default Admin Credentials

- **Email:** `admin@nexusit.com`
- **Password:** `Admin123!`
