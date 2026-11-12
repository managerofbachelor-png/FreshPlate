# Meal Planner Firestore Security Specification

## 1. Data Invariants
1. **Strict Ownership & Email Verification**: Every document under `/users/{userId}` and `/users/{userId}/mealSlots/{slotId}` belongs exclusively to `request.auth.uid == userId` with `request.auth.token.email_verified == true`.
2. **No Cross-User PII Exposure**: `email` and personal health/budget data inside `/users/{userId}` can only be `get` by the owner (`request.auth.uid == userId`). Top-level `list` on `/users` is completely denied.
3. **Master Gate on Subcollections**: A `mealSlots` document cannot be created unless its parent `/users/{userId}` profile already exists and `uid == request.auth.uid`.
4. **Immutable Ownership & Creation Timestamps**: `uid`, `ownerId`, and `createdAt` cannot be modified after creation (`incoming().createdAt == existing().createdAt`). Client-forged timestamps are rejected (`createdAt == request.time`, `updatedAt == request.time`).
5. **Bounded Arrays & Strings**: `favoriteRecipeIds` is capped at 50 elements and validated if non-empty; every string has explicit `.size()` bounds; all IDs match `^[a-zA-Z0-9_-]+$`.
6. **Zero Ghost Fields**: Both `create` (`hasAll` + `hasOnly`) and `update` (`affectedKeys().hasOnly(...)`) reject any unallowlisted fields (`isAdmin`, `role`, `isVerified`, etc.).

## 2. The "Dirty Dozen" Attack Payloads (All Must Yield PERMISSION_DENIED)
1. **Unauthenticated read** on `/users/uid1`.
2. **Unverified email write** (`email_verified: false`) creating `/users/uid1`.
3. **Identity spoofing** on `/users/uid1` with `uid: "other_uid"`.
4. **Cross-user PII read** (`uid2` reading `/users/uid1`).
5. **Ghost field / privilege escalation** (`role: "admin"`, `isVerified: true`) on `/users/uid1`.
6. **Forged client timestamp** (`createdAt: new Date(0)`) on `/users/uid1`.
7. **Mutating immutable `createdAt`** or `uid` on `/users/uid1` update.
8. **ID poisoning** with >128 chars or invalid characters on `/users/{badId}` or `mealSlots/{badId}`.
9. **Unbounded array / invalid type** in `favoriteRecipeIds` (51 items or `[123]`).
10. **Orphaned subcollection write** creating `/users/uid1/mealSlots/Monday_lunch` before `/users/uid1` exists.
11. **Invalid slot key / mismatched day-slot** creating `mealSlots/Invalid_slot` or `day: "Funday"`.
12. **Out-of-range numeric poisoning** (`servings: 999`, `bmiCm: 5`, `budgetUsAmount: -50`).
