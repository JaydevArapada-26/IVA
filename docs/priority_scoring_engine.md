# IVA Priority Scoring & Sorting System

This document explains the deterministic prioritization and sorting algorithm used by IVA to match welfare schemes to citizens and rank them on their dashboards.

---

## 1. Core Objectives
The recommendation engine aims to:
- **Prioritize Urgency**: Promptly show schemes with near-term deadlines or high-priority status.
- **Factor Eligibility Confidence**: Place schemes that the citizen strongly matches at the top.
- **Maintain Freshness**: Promote newly published or updated schemes while letting older recommendations decay.

---

## 2. Priority Score Formula
IVA uses a composite **0–100 point scale** to determine the rank of each scheme. The score is computed as follows:

$$\text{Priority Score} = \min(100, \text{Urgency Points} + \text{Eligibility Points} + \text{Recency Points})$$

### Component Breakdown

| Weight | Component | Max Points | Description / Calculation |
| :--- | :--- | :--- | :--- |
| **40%** | **Urgency** | `40 pts` | Awarded if the scheme has the `isUrgent` flag enabled in the database. |
| **40%** | **Eligibility** | `40 pts` | Scaled from the deterministic eligibility rule engine score (0.0 to 1.0): $\text{Score} \times 40$. |
| **20%** | **Recency** | `20 pts` | Linear decay based on the time elapsed since the scheme's publication (`publishedAt`), fading to 0 over 6 months. |

---

## 3. Algorithm Implementation Details

### A. Recency Decay Calculation
Recency points are calculated linearly up to a **6-month (180 days)** limit. 
If the scheme is older than 6 months or has no publication date, it receives `0` recency points.

```typescript
let recencyPts = 0;
if (publishedAt) {
  const ageMs = Date.now() - publishedAt.getTime();
  const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000; // 180 days
  recencyPts = Math.max(0, Math.round((1 - ageMs / SIX_MONTHS_MS) * 20));
}
```

### B. Eligibility Score Mapping
The eligibility score represents the percentage of matching rules in the scheme's rule tree.
- If a scheme has no eligibility result stored for the user, the engine falls back to `0` points.
- A score of `1.0` (fully eligible) contributes `40` points.
- A score of `0.5` (partially eligible) contributes `20` points.

---

## 4. Database Query & Sorting Flow

When a user requests recommendations or the system sends an SMS:
1. **Query Published Schemes**: Retrieves all schemes whose `publicationStatus` is `'published'`.
2. **Fetch Eligibility Scores**: Pulls the pre-computed eligibility scores for the logged-in user from the `eligibility_results` table.
3. **Map and Compute**:
   - Loops through each scheme.
   - Looks up the user's eligibility score for that scheme (defaults to `0` if not present).
   - Computes the composite score.
4. **Sort and Slice**:
   - Sorts the schemes in descending order of `priorityScore`.
   - Returns the top recommended matches (e.g., first 8 for the Web Dashboard, or the single top match for SMS notifications).

---

## 5. Reference File
The active implementation can be viewed and modified in:
- [priority/engine.ts](file:///w:/IVA/bkp%20-%20Copy/apps/backend/src/lib/priority/engine.ts)
