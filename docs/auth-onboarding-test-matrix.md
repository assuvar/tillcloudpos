# Auth and Onboarding Test Matrix

Date: 2026-04-04

## Scope
Covers authentication, authorization, onboarding state transitions, and database persistence checks.

## Test Cases

| ID | Area | Scenario | Steps | Expected Result |
|---|---|---|---|---|
| AUTH-001 | Registration | Register with valid data | Submit signup form with valid name/email/password | User record created; password stored hashed; success response returned |
| AUTH-002 | Registration | Register with duplicate email | Submit signup form for existing email | Validation/business error returned; no duplicate user created |
| AUTH-003 | Registration | Register with invalid payload | Submit missing/invalid fields | Request rejected with validation errors |
| AUTH-004 | Login | Login with valid credentials | Submit login form using registered user | JWT issued; user authenticated; frontend stores token/session state |
| AUTH-005 | Login | Login with wrong password | Submit existing email with wrong password | Unauthorized error returned; no token issued |
| AUTH-006 | Login | Login with unknown user | Submit non-existing email | Unauthorized/not found behavior as implemented; no token issued |
| AUTH-007 | Token | Access protected endpoint with valid JWT | Call protected API after login | Request succeeds with authorized response |
| AUTH-008 | Token | Access protected endpoint without JWT | Call protected API without auth header | Request denied with unauthorized error |
| AUTH-009 | Token | Access protected endpoint with malformed JWT | Send invalid bearer token | Request denied with unauthorized error |
| FLOW-001 | Onboarding | New user redirected to onboarding | Register/login as user with onboarding incomplete | Frontend routes to onboarding flow |
| FLOW-002 | Onboarding | Complete onboarding successfully | Submit business profile details | Data persisted; onboarding status becomes complete |
| FLOW-003 | Onboarding | Completed user bypasses onboarding | Login with onboarding-complete user | Frontend routes to dashboard/home instead of onboarding |
| FLOW-004 | Onboarding | Resume incomplete onboarding | Login with partially configured user | User resumes onboarding at correct step |
| DB-001 | Persistence | User saved with expected fields | Inspect user via Prisma client/studio | Required fields present; password is hashed |
| DB-002 | Persistence | Onboarding status persisted | Complete onboarding then reload session | Status remains complete across sessions |
| DB-003 | Schema | Prisma schema validates | Run prisma validate against schemas | Validation succeeds without schema errors |

## Regression Checklist
- Auth API errors are handled cleanly in frontend UI.
- Token state is cleared on logout and unauthorized responses.
- Protected routes are inaccessible without valid auth context.
- Onboarding route guards enforce correct navigation for each state.
- Existing non-auth flows still work after auth middleware/guard updates.

## Suggested Automation Mapping
- Backend unit tests: registration/login service logic.
- Backend integration tests: auth endpoints + JWT guard behavior.
- Frontend integration tests: login/signup submissions and route transitions.
- E2E smoke tests: new user signup -> login -> onboarding -> dashboard.
