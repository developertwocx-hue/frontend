# Compliance API - Quick Reference

## Authentication
```javascript
headers: {
  "Authorization": "Bearer YOUR_TOKEN",
  "Content-Type": "application/json"
}
```

## Core Endpoints

### 📋 List Compliance Types
```http
GET /api/compliance-types
```

### 📊 Vehicle Compliance Status Dashboard
```http
GET /api/vehicles/{vehicleId}/compliance/status
```
**Returns**: Complete overview with score, requirements, and summary

### 📝 List Records
```http
GET /api/vehicles/{vehicleId}/compliance-records
```
**Params**: `?status=compliant&current_only=true`

### ➕ Create Record
```http
POST /api/vehicles/{vehicleId}/compliance-records
Content-Type: multipart/form-data

{
  "compliance_type_id": 1,
  "issue_date": "2026-01-06",
  "expiry_date": "2027-01-06",
  "notes": "Renewed",
  "file": <binary>
}
```

### ✏️ Update Record
```http
PUT /api/vehicles/{vehicleId}/compliance-records/{id}

{
  "expiry_date": "2027-02-06",
  "notes": "Extended"
}
```

### 🗑️ Delete Record
```http
DELETE /api/vehicles/{vehicleId}/compliance-records/{id}
```

### ✅ Approve Record
```http
POST /api/vehicles/{vehicleId}/compliance-records/{id}/approve
```

### 📜 View History
```http
GET /api/vehicles/{vehicleId}/compliance/requirements/{requirementId}/history
```

## Status Values

| Status | Meaning | Color |
|--------|---------|-------|
| `compliant` | >30 days until expiry | 🟢 Green |
| `at_risk` | 1-30 days until expiry | 🟠 Orange |
| `expired` | Past expiry date | 🔴 Red |
| `pending` | No record submitted | ⚪ Gray |

## Categories
- `roadworthiness`
- `registration`
- `insurance`
- `inspection`
- `other`

## Response Structure
```json
{
  "success": true,
  "message": "...",
  "data": { ... }
}
```

## Common Errors

| Code | Meaning |
|------|---------|
| 401 | Invalid/missing token |
| 404 | Vehicle/record not found |
| 422 | Validation failed |
| 400 | Compliance type not applicable |

## File Upload
- Max size: 100MB
- Formats: `.pdf`, `.jpg`, `.jpeg`, `.png`, `.doc`, `.docx`
- Use `multipart/form-data`

## React Example
```tsx
const { data } = await axios.post(
  `/api/vehicles/${vehicleId}/compliance-records`,
  formData,
  { headers: { 'Content-Type': 'multipart/form-data' } }
);
```

## Compliance Score Formula
```javascript
score = (compliant * 100 + at_risk * 50 + expired * 0 + pending * 0) / total
```

## Key Concepts
1. **Compliance Type** = Template (e.g., "Vehicle Registration")
2. **Requirement** = Vehicle-specific link to type
3. **Record** = Actual submission with dates & documents
4. **Status** = Computed in real-time from expiry date
5. **Score** = 0-100% based on all requirements

## Testing Quick Start
1. Login → Get token
2. GET `/vehicles/{id}/compliance-types` → Pick a type
3. POST `/vehicles/{id}/compliance-records` → Create record
4. GET `/vehicles/{id}/compliance/status` → See dashboard

---

📖 **Full Documentation**: See `COMPLIANCE_API_GUIDE.md`