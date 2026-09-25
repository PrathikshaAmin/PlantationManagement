# Security Audit — Farm Profile & Plantation Management System

This is a completed pass against your actual code, plus a short list of manual items still worth doing before submission.

## 1. JWT coverage — checked against every route file

| Route file | Protection |
|---|---|
| `authRoutes.js` | `register` and `login` are public (correct — you can't require a token before you have one). `logout` and `me` use `protect`. ✅ |
| `farmerRoutes.js` | `router.use(protect)` applied before all routes — every farmer endpoint requires a valid token. ✅ |
| `plantationRoutes.js` | `router.use(protect)` applied before all routes — covers CRUD, location, images, and activities. ✅ |
| `imageRoutes.js` | `router.use(protect)` applied — image delete requires a token. ✅ |
| `dashboardRoutes.js` | `router.use(protect)` applied — both stats endpoints require a token. ✅ |

**Result:** no unauthenticated route is exposed except register/login, which is correct.

## 2. Password handling

- Passwords are hashed with bcrypt (`genSalt(10)` + `hash`) in a Mongoose `pre("save")` hook — never stored in plain text. ✅
- The `password` field has `select: false`, so it's never accidentally returned in a normal `find()`/`findById()` — it's only pulled in explicitly with `.select("+password")` during login. ✅
- Minimum password length is enforced at the schema level (`minlength: 6`). Consider raising this to 8 and requiring at least one number for the final submission, since 6 is on the low side.

## 3. Input validation

- `express-validator` rules are applied on Farmer create/update and Plantation create/update (name, mobile, area, coordinates, etc.) via the `validate` middleware. ✅
- Image upload restricts MIME type to JPG/PNG and enforces a 10 MB size limit via Multer's `fileFilter` and `limits`. ✅
- **Gap:** the `register` endpoint checks that fields are *present* but doesn't validate email format or password strength at the controller level beyond what the Mongoose schema itself enforces on save. This still works (Mongoose will reject bad data), but the error message will be a generic Mongoose validation error rather than a clean `express-validator` message. Low priority, but worth a line in your report if asked about it.

## 4. Error handling

- Centralized error handler (`errorHandler.js`) normalizes Mongoose `CastError`, duplicate key errors, and validation errors into consistent JSON responses — no raw stack traces are ever sent to the client. ✅
- `notFound` middleware catches unmatched routes with a clean 404 instead of Express's default HTML error page. ✅

## 5. CORS

- `cors()` is applied with no restrictions (open to all origins). This is fine for a college/internship project and local demo, but **note this out loud in your report** — a production deployment would restrict this to the actual web/mobile app origins.

## 6. Manual items still to check yourself before submission

- [ ] Confirm `.env` (with your real `JWT_SECRET` and `MONGO_URI`) is in `.gitignore` and was never committed
- [ ] Rotate/regenerate `JWT_SECRET` if it was ever pushed to a public repo at any point
- [ ] Confirm uploaded images can only be deleted by an authenticated user (currently any authenticated user can delete any image — there's no ownership check tying `deleteImage` to `uploadedBy`; acceptable for a single-admin-role project, but flag it as a known limitation if asked)
- [ ] Verify the `<500ms` API response time target informally — with a small demo dataset it should be well under this; note that no load testing was done
