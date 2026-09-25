# API Documentation — Farm Profile & Plantation Management System

**Base URL (local):** `http://localhost:5000/api`
**Auth:** All routes except `POST /auth/register` and `POST /auth/login` require a JWT.
Send it as a header: `Authorization: Bearer <token>`

Every response follows the same envelope:
```json
{ "success": true,  "message": "...", "data": { ... } }
{ "success": false, "message": "Reason for failure" }
```

---

## 1. Auth — `/api/auth`

### POST `/auth/register`
Public. Creates a user account.

**Body**
```json
{
  "fullName": "Asha Rao",
  "mobileNumber": "9876543210",
  "email": "asha@example.com",
  "password": "secret123"
}
```
**201 response**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { "id": "...", "fullName": "Asha Rao", "mobileNumber": "9876543210", "email": "asha@example.com", "role": "field_user" },
    "token": "<jwt>"
  }
}
```
**400** — missing fields, or email/mobile already registered.

### POST `/auth/login`
Public.

**Body**
```json
{ "identifier": "asha@example.com", "password": "secret123" }
```
`identifier` accepts either email or mobile number.

**200 response** — same shape as register's `data`.
**401** — invalid credentials. **403** — account deactivated.

### POST `/auth/logout`
Private. Stateless JWT logout — the endpoint exists for consistency and future token-blacklisting; the client is responsible for discarding the token.
**200** `{ "success": true, "message": "Logged out successfully" }`

### GET `/auth/me`
Private. Returns the logged-in user's profile (no password).

### POST `/auth/forgot-password`
Public. Looks up the user by mobile number or email and, if found, generates a
15-minute reset token. Always returns the same success message whether or not
the account exists, to avoid leaking which accounts are registered.

**Body**
```json
{ "identifier": "asha@example.com" }
```
**200 response**
```json
{
  "success": true,
  "message": "If an account exists for that mobile number/email, reset instructions have been sent",
  "resetToken": "<raw token — dev/demo only, remove once real SMS/email delivery is wired up>"
}
```

### POST `/auth/reset-password`
Public. Resets the password using the token from `forgot-password`.

**Body**
```json
{ "token": "<raw token>", "newPassword": "newSecret123" }
```
**200** — `{ "success": true, "message": "Password reset successful — please log in" }`
**400** — token missing/invalid/expired.

---

## 2. Farmers — `/api/farmers`  (all routes private)

### GET `/farmers?search=&district=&page=&limit=&includeInactive=`
Lists farmers with search (name/mobile), district filter, and pagination.

**200 response**
```json
{
  "success": true,
  "data": [ { "_id": "...", "farmerName": "...", "plantationCount": 3, "...": "..." } ],
  "pagination": { "total": 42, "page": 1, "limit": 20, "pages": 3 }
}
```

### POST `/farmers`
**Body**
```json
{
  "farmerName": "Ramesh K",
  "mobileNumber": "9900112233",
  "alternateMobileNumber": "",
  "gender": "Male",
  "dateOfBirth": "1985-04-12",
  "address": { "village": "Hosahalli", "taluk": "Nanjangud", "district": "Mysuru", "state": "Karnataka", "pinCode": "571301" },
  "primaryOccupation": "Farming",
  "farmingExperienceYears": 12
}
```
**201** — created farmer object.

### GET `/farmers/:id`
Returns farmer with `plantationCount` populated.

### PUT `/farmers/:id`
Body = any subset of the create fields. **200** updated farmer, **404** if not found.

### DELETE `/farmers/:id`
Soft delete (`isActive: false`). **400** if the farmer still has active plantations — remove/reassign those first.

---

## 3. Plantations — `/api/plantations`  (all routes private)

### GET `/plantations?search=&farmer=&type=&page=&limit=&includeInactive=`
Lists plantations, optionally scoped to a farmer, with pagination.

### POST `/plantations`
**Body**
```json
{
  "farmer": "<farmerId>",
  "plantationName": "North Field",
  "plantationCode": "PLT-001",
  "plantationType": "Coconut",
  "area": 2.5,
  "areaUnit": "Acres",
  "numberOfPlants": 120,
  "address": { "village": "...", "taluk": "...", "district": "...", "state": "..." },
  "irrigationMethod": "Drip",
  "waterSource": "Borewell",
  "soilType": "Red Loam",
  "plantationAgeYears": 4,
  "plantVariety": "Tall variety"
}
```
**201** — created plantation. Also writes a `Plantation Created` activity log entry.
`plantationCode` must be unique.

### GET `/plantations/:id`
Returns plantation details bundled with statistics and the latest location:
```json
{
  "success": true,
  "data": {
    "plantation": { "...": "...", "farmer": { "...populated..." } },
    "statistics": { "imageCount": 5, "activityCount": 3 },
    "location": { "latitude": 12.29, "longitude": 76.63, "...": "..." }
  }
}
```

### PUT `/plantations/:id`
Updates plantation. If `area` changes, logs an `Area Modified` activity instead of the generic `Plantation Updated`.

### DELETE `/plantations/:id`
Soft delete (`isActive: false`).

### POST `/plantations/:id/location`
Upserts the plantation's current GPS coordinates (one location record per plantation).
**Body** `{ "latitude": 12.2958, "longitude": 76.6394 }`
Logs a `Location Updated` activity.

### GET `/plantations/:id/location`
Returns the current coordinates, or **404** if none captured yet.

### POST `/plantations/:id/images`
`multipart/form-data`. Field name: `images` (up to 10 files). Optional field: `category`
(`Plantation Overview` | `Plant Images` | `Irrigation Images` | `Other`).
Rejects non-JPG/PNG files and anything over the size limit (default 10 MB, configurable via `MAX_UPLOAD_SIZE_MB`).
Logs a `Plantation Photo Added` activity. **201** — array of created image records.

### GET `/plantations/:id/images?category=`
Lists images for a plantation, optionally filtered by category.

### GET `/plantations/:id/activities`
Returns the plantation's full activity history, most recent first, with `performedBy` populated.

---

## 4. Images — `/api/images`  (private)

### DELETE `/images/:imageId`
Deletes the image file from disk and its database record.

---

## 5. Dashboard — `/api/dashboard`  (private)

### GET `/dashboard/farmers`
```json
{
  "success": true,
  "data": {
    "totalFarmers": 42,
    "activeFarmers": 40,
    "recentlyAddedFarmers": 5,
    "districtWise": [ { "district": "Mysuru", "count": 18 }, { "district": "Mandya", "count": 12 } ]
  }
}
```
`recentlyAddedFarmers` = created within the last 30 days.

### GET `/dashboard/plantations`
```json
{
  "success": true,
  "data": {
    "totalPlantations": 60,
    "totalArea": 148.5,
    "typeDistribution": [ { "type": "Coconut", "count": 25 }, { "type": "Coffee", "count": 15 } ],
    "recentlyUpdated": [ { "plantationName": "North Field", "plantationCode": "PLT-001", "updatedAt": "...", "farmer": { "farmerName": "Ramesh K" } } ]
  }
}
```

---

## 6. Health Check

### GET `/health` (note: not under `/api` prefix in some setups — this project mounts it at `/api/health`)
Public. `{ "success": true, "message": "API is running" }`

---

## Error Format
All errors use the same envelope. Common cases handled centrally by `middleware/errorHandler.js`:
| Situation | Status | Message |
|---|---|---|
| Invalid ObjectId in a route param | 400 | `Invalid <field>: <value>` |
| Duplicate unique field (e.g. `plantationCode`, `email`) | 400 | `Duplicate value for field: <field>` |
| Mongoose schema validation failure | 400 | Combined validation messages |
| No/invalid/expired JWT | 401 | `Not authorized, ...` |
| Resource not found | 404 | `<Resource> not found` |
| Unhandled server error | 500 | `Internal Server Error` |
