# Security Spec & Payload-First TDD for Fenk Mahli POS Firestore

## Data Invariants
1. A store document `/stores/{syncCode}` contains metadata for a synchronized retail store.
2. Store subcollections (`/stores/{syncCode}/products/{id}`, `/stores/{syncCode}/debts/{id}`, `/stores/{syncCode}/transactions/{id}`) represent inventory, customer credit debts, and checkout receipts.
3. `/subscribers/{syncCode}` holds store subscription registry accounts managed by the application owner or authorized store sync code holders.
4. Timestamps and numeric values must strictly conform to positive bounds.

## Dirty Dozen Payloads (Rejection Targets)
1. **Unbounded Payload Injection**: Injecting 1MB junk text string into `barcode` or `nameAr`.
2. **Invalid Price Type**: Setting `sellingPrice` or `buyingPrice` to string `"free"`.
3. **Negative Quantity Attack**: Setting inventory quantity to negative numbers.
4. **Subscriber Status Override**: Injecting non-enum status like `"god_mode"`.
5. **Missing Required Fields**: Attempting to create product without `barcode`.
6. **Unknown Fields (Ghost Keys)**: Injecting `isAdmin: true` into `Product` or `Store` document.
7. **Path Injection**: Creating store with path containing special invalid symbols.
8. **Negative Debt Balance**: Creating customer debt with invalid format or malformed string.
9. **Fake Payment Method**: Transaction payload with `paymentMethod: "crypto"`.
10. **Transaction Amount Tampering**: Negative `totalAmount` in transaction payload.
11. **Spoofed Auth Context**: Accessing store data without matching valid syncCode or authentication.
12. **Malformed Sync Code**: Accessing collection paths with strings exceeding 128 chars.
