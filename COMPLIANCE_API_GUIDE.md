# Vehicle Compliance Management API Guide for Next.js Frontend

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Core Concepts](#core-concepts)
4. [API Endpoints](#api-endpoints)
5. [Response Formats](#response-formats)
6. [Implementation Examples](#implementation-examples)
7. [Status Calculation Logic](#status-calculation-logic)
8. [Error Handling](#error-handling)

---

## Overview

The Compliance Management System tracks vehicle compliance requirements (like registration, insurance, inspections) with automatic status calculation, expiry tracking, and document management.

**Base URL**: `https://your-domain.com/api`

**Key Features**:
- ✅ Real-time compliance status calculation
- 📅 Automatic expiry tracking
- 📄 Document attachment and management
- 📊 Compliance scoring (0-100%)
- ⚠️ Alert system for expiring compliance
- 🔄 Complete audit trail
- 🎯 Multi-tenant isolation

---

## Authentication

All API requests require authentication using Laravel Sanctum tokens.

### Headers Required
```javascript
{
  "Authorization": "Bearer YOUR_ACCESS_TOKEN",
  "Content-Type": "application/json",
  "Accept": "application/json"
}
```

### For File Uploads
```javascript
{
  "Authorization": "Bearer YOUR_ACCESS_TOKEN",
  "Content-Type": "multipart/form-data",
  "Accept": "application/json"
}
```

---

## Core Concepts

### 1. Compliance Types
Predefined compliance requirements (e.g., "Vehicle Registration", "Heavy Vehicle Inspection")

**Hierarchy**:
- **Global**: Available to all tenants (created by superadmin)
- **State-Specific**: Applies to specific Australian states (NSW, VIC, QLD, etc.)
- **Vehicle-Type Specific**: Only for specific vehicle types (Cranes, Forklifts, etc.)
- **Tenant Custom**: Created by tenant for their specific needs

### 2. Vehicle Compliance Requirements
Auto-generated when a vehicle is created. Links a specific vehicle to applicable compliance types.

### 3. Compliance Records
The actual compliance submissions with documents, dates, and status.

**Record Lifecycle**:
```
pending → compliant → at_risk → expired
```

**Status Rules**:
- `compliant`: More than 30 days until expiry
- `at_risk`: 1-30 days until expiry
- `expired`: Past expiry date
- `pending`: No record submitted yet

### 4. Documents
Files attached to compliance records (PDFs, images, etc.) - Max 100MB per file.

---

## API Endpoints

### 🔹 1. Get Compliance Types

**Endpoint**: `GET /api/compliance-types`

**Description**: Get all compliance types applicable to the current tenant (global + state-specific + tenant custom).

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `vehicle_id` | integer | Filter types applicable to specific vehicle |
| `category` | string | Filter by category (roadworthiness, registration, insurance, inspection, other) |
| `state_code` | string | Filter by state (NSW, VIC, QLD, etc.) |
| `vehicle_type_id` | integer | Filter by vehicle type |
| `is_active` | boolean | Filter active/inactive types (default: true) |

**Response**:
```json
{
  "success": true,
  "message": "Compliance types retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Vehicle Registration",
      "description": "Annual vehicle registration renewal",
      "category": "registration",
      "scope_type": "global",
      "state_code": null,
      "vehicle_type_id": null,
      "tenant_id": null,
      "renewal_frequency_days": 365,
      "requires_document": true,
      "is_required": true,
      "is_active": true,
      "alert_thresholds": [30, 14, 7, 0],
      "accepted_document_types": [1, 2],
      "sort_order": 0
    }
  ]
}
```

---

### 🔹 2. Get Compliance Types for Vehicle

**Endpoint**: `GET /api/vehicles/{vehicleId}/compliance-types`

**Description**: Get only the compliance types applicable to a specific vehicle (considers vehicle type, state, and tenant).

**Response**: Same as above, but filtered for the vehicle.

---

### 🔹 3. Get Vehicle Compliance Records

**Endpoint**: `GET /api/vehicles/{vehicleId}/compliance-records`

**Description**: Get all compliance records for a vehicle.

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `compliance_type_id` | integer | Filter by compliance type |
| `status` | string | Filter by status (compliant, at_risk, expired, pending) |
| `current_only` | boolean | Show only current (latest) records |

**Response**:
```json
{
  "success": true,
  "message": "Compliance records retrieved successfully",
  "data": [
    {
      "id": 3,
      "tenant_id": "bb54c6f2-dc6e-4c82-89d5-a8c46cdfbcd4",
      "vehicle_id": 148,
      "vehicle_compliance_requirement_id": 1,
      "compliance_type_id": 1,
      "issue_date": "2026-01-06",
      "expiry_date": "2027-01-06",
      "inspection_provider": null,
      "inspection_number": null,
      "notes": "Test compliance record",
      "submitted_by": 10,
      "approved_by": null,
      "approved_at": null,
      "is_current": true,
      "status": "compliant",
      "days_until_expiry": 364,
      "compliance_type": {
        "id": 1,
        "name": "Vehicle Registration",
        "category": "registration"
      },
      "documents": [
        {
          "id": 45,
          "document_name": "registration-2026.pdf",
          "file_path": "vehicle-documents/abc123.pdf",
          "file_type": "application/pdf",
          "file_size": 245678,
          "url": "https://your-domain.com/storage/vehicle-documents/abc123.pdf",
          "pivot": {
            "is_primary": true
          }
        }
      ],
      "submitted_by": {
        "id": 10,
        "name": "craneliftadmin",
        "email": "craneliftadmin@gmail.com"
      },
      "created_at": "2026-01-06T11:43:46.000000Z",
      "updated_at": "2026-01-06T11:43:46.000000Z"
    }
  ]
}
```

---

### 🔹 4. Get Single Compliance Record

**Endpoint**: `GET /api/vehicles/{vehicleId}/compliance-records/{id}`

**Description**: Get detailed information about a specific compliance record including audit logs.

**Response**: Same as above but single object with additional `audit_logs` array.

---

### 🔹 5. Create Compliance Record ⭐ KEY ENDPOINT

**Endpoint**: `POST /api/vehicles/{vehicleId}/compliance-records`

**Description**: Submit a new compliance record for a vehicle.

**Request Body** (multipart/form-data for file upload OR JSON):

```json
{
  "compliance_type_id": 1,
  "issue_date": "2026-01-06",
  "expiry_date": "2027-01-06",
  "inspection_provider": "ABC Inspection Services",
  "inspection_number": "INS-2026-001",
  "notes": "Annual registration renewed",
  "document_ids": [45, 46],
  "file": "<binary file data>"
}
```

**Field Descriptions**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `compliance_type_id` | integer | ✅ Yes | ID of the compliance type |
| `issue_date` | date | ✅ Yes | Date when compliance was issued (YYYY-MM-DD) |
| `expiry_date` | date | ✅ Yes | Date when compliance expires (YYYY-MM-DD) |
| `inspection_provider` | string | No | Name of inspection/certification provider |
| `inspection_number` | string | No | Certificate/inspection number |
| `notes` | text | No | Additional notes |
| `document_ids` | array | Conditional* | IDs of existing vehicle documents to attach |
| `file` | file | Conditional* | New file to upload (max 100MB) |

*At least one document is required if `compliance_type.requires_document` is true.

**File Upload Example (FormData)**:
```javascript
const formData = new FormData();
formData.append('compliance_type_id', '1');
formData.append('issue_date', '2026-01-06');
formData.append('expiry_date', '2027-01-06');
formData.append('notes', 'Annual registration');
formData.append('file', fileObject); // File from input[type="file"]

// OR attach existing documents
formData.append('document_ids[]', '45');
formData.append('document_ids[]', '46');
```

**Success Response** (201 Created):
```json
{
  "success": true,
  "message": "Compliance record created successfully",
  "data": {
    "id": 4,
    "vehicle_id": 148,
    "compliance_type_id": 1,
    "issue_date": "2026-01-06",
    "expiry_date": "2027-01-06",
    "status": "compliant",
    "days_until_expiry": 364,
    "is_current": true,
    "compliance_type": { /* ... */ },
    "documents": [ /* ... */ ],
    "submitted_by": { /* ... */ }
  }
}
```

**Validation Rules**:
1. ✅ Compliance type must be applicable to the vehicle (correct vehicle type, state, tenant)
2. ✅ Expiry date must be after issue date
3. ✅ Document required if compliance type requires it
4. ✅ Only accepted document types allowed
5. ✅ Automatically creates vehicle compliance requirement if doesn't exist
6. ✅ Automatically marks previous records as `is_current = false`
7. ✅ Automatically updates vehicle compliance score

---

### 🔹 6. Update Compliance Record

**Endpoint**: `PUT /api/vehicles/{vehicleId}/compliance-records/{id}`

**Description**: Update an existing compliance record.

**Request Body**:
```json
{
  "issue_date": "2026-01-07",
  "expiry_date": "2027-01-07",
  "inspection_provider": "Updated Provider",
  "inspection_number": "INS-2026-002",
  "notes": "Updated notes",
  "document_ids": [47, 48]
}
```

**Note**: Cannot change `compliance_type_id`. All fields are optional.

---

### 🔹 7. Delete Compliance Record

**Endpoint**: `DELETE /api/vehicles/{vehicleId}/compliance-records/{id}`

**Description**: Soft delete a compliance record.

**Response**:
```json
{
  "success": true,
  "message": "Compliance record deleted successfully",
  "data": null
}
```

**Note**: Automatically recalculates vehicle compliance score after deletion.

---

### 🔹 8. Get Vehicle Compliance Status ⭐ DASHBOARD ENDPOINT

**Endpoint**: `GET /api/vehicles/{vehicleId}/compliance/status`

**Description**: Get complete compliance overview for a vehicle with all requirements and their current status.

**Response**:
```json
{
  "success": true,
  "message": "Current compliance status retrieved successfully",
  "data": {
    "vehicle": {
      "id": 148,
      "compliance_status": "compliant",
      "compliance_score": 100.00,
      "operational_status": "operational"
    },
    "requirements": [
      {
        "requirement_id": 1,
        "compliance_type": "Vehicle Registration",
        "category": "registration",
        "status": "compliant",
        "current_record": {
          "id": 3,
          "issue_date": "2026-01-06",
          "expiry_date": "2027-01-06",
          "documents": [ /* ... */ ]
        },
        "days_until_expiry": 364,
        "is_overdue": false
      },
      {
        "requirement_id": 2,
        "compliance_type": "Heavy Vehicle Inspection (NSW)",
        "category": "inspection",
        "status": "pending",
        "current_record": null,
        "days_until_expiry": null,
        "is_overdue": false
      }
    ],
    "summary": {
      "total_requirements": 5,
      "compliant": 3,
      "at_risk": 1,
      "expired": 0,
      "pending": 1,
      "compliance_score": 80.00,
      "overall_status": "at_risk",
      "can_operate": true
    }
  }
}
```

**Use this endpoint for**:
- Vehicle detail compliance dashboard
- Compliance overview widgets
- Determining if vehicle can operate
- Showing alerts for expiring compliance

---

### 🔹 9. Get Compliance History

**Endpoint**: `GET /api/vehicles/{vehicleId}/compliance/requirements/{requirementId}/history`

**Description**: Get all historical compliance records for a specific requirement.

**Response**:
```json
{
  "success": true,
  "message": "Compliance history retrieved successfully",
  "data": {
    "requirement": {
      "id": 1,
      "compliance_type": {
        "id": 1,
        "name": "Vehicle Registration"
      }
    },
    "history": [
      {
        "id": 3,
        "issue_date": "2026-01-06",
        "expiry_date": "2027-01-06",
        "is_current": true,
        "status": "compliant"
      },
      {
        "id": 2,
        "issue_date": "2025-01-06",
        "expiry_date": "2026-01-06",
        "is_current": false,
        "status": "expired"
      }
    ]
  }
}
```

---

### 🔹 10. Approve Compliance Record

**Endpoint**: `POST /api/vehicles/{vehicleId}/compliance-records/{id}/approve`

**Description**: Approve a compliance record (for admin/manager workflow).

**Response**:
```json
{
  "success": true,
  "message": "Compliance record approved successfully",
  "data": {
    "id": 3,
    "approved_by": 5,
    "approved_at": "2026-01-06T15:30:00.000000Z",
    "approved_by": {
      "id": 5,
      "name": "Manager",
      "email": "manager@example.com"
    }
  }
}
```

---

### 🔹 11. Get Compliance Categories

**Endpoint**: `GET /api/compliance-types/categories`

**Description**: Get list of all compliance categories for filtering.

**Response**:
```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": [
    "roadworthiness",
    "registration",
    "insurance",
    "inspection",
    "other"
  ]
}
```

---

## Response Formats

### Success Response Structure
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* ... */ }
}
```

### Error Response Structure
```json
{
  "success": false,
  "message": "Error message",
  "errors": {
    "field_name": [
      "Validation error message"
    ]
  }
}
```

### Common HTTP Status Codes
| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET, PUT, DELETE |
| 201 | Created | Successful POST |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Missing or invalid auth token |
| 403 | Forbidden | User doesn't have permission |
| 404 | Not Found | Resource doesn't exist |
| 422 | Unprocessable Entity | Validation failed |
| 500 | Server Error | Something went wrong server-side |

---

## Implementation Examples

### React Hook: Create Compliance Record

```typescript
import { useState } from 'react';
import axios from 'axios';

interface ComplianceFormData {
  compliance_type_id: number;
  issue_date: string;
  expiry_date: string;
  inspection_provider?: string;
  inspection_number?: string;
  notes?: string;
  file?: File;
  document_ids?: number[];
}

export const useCreateCompliance = (vehicleId: number) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCompliance = async (data: ComplianceFormData) => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();

      // Append all fields
      formData.append('compliance_type_id', data.compliance_type_id.toString());
      formData.append('issue_date', data.issue_date);
      formData.append('expiry_date', data.expiry_date);

      if (data.inspection_provider) {
        formData.append('inspection_provider', data.inspection_provider);
      }
      if (data.inspection_number) {
        formData.append('inspection_number', data.inspection_number);
      }
      if (data.notes) {
        formData.append('notes', data.notes);
      }
      if (data.file) {
        formData.append('file', data.file);
      }
      if (data.document_ids) {
        data.document_ids.forEach((id) => {
          formData.append('document_ids[]', id.toString());
        });
      }

      const response = await axios.post(
        `/api/vehicles/${vehicleId}/compliance-records`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      setLoading(false);
      return response.data.data;
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || 'Failed to create compliance record');
      throw err;
    }
  };

  return { createCompliance, loading, error };
};
```

### Usage Example

```tsx
import { useCreateCompliance } from '@/hooks/useCreateCompliance';

const ComplianceForm = ({ vehicleId }: { vehicleId: number }) => {
  const { createCompliance, loading, error } = useCreateCompliance(vehicleId);
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const record = await createCompliance({
        compliance_type_id: 1,
        issue_date: '2026-01-06',
        expiry_date: '2027-01-06',
        notes: 'Annual registration renewed',
        file: file || undefined,
      });

      console.log('Created:', record);
      alert('Compliance record created successfully!');
    } catch (err) {
      console.error('Error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Submit'}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
};
```

---

### Compliance Status Dashboard Component

```tsx
import { useEffect, useState } from 'react';
import axios from 'axios';

interface ComplianceStatus {
  vehicle: {
    id: number;
    compliance_status: string;
    compliance_score: number;
    operational_status: string;
  };
  requirements: Array<{
    requirement_id: number;
    compliance_type: string;
    category: string;
    status: string;
    days_until_expiry: number | null;
    is_overdue: boolean;
  }>;
  summary: {
    total_requirements: number;
    compliant: number;
    at_risk: number;
    expired: number;
    pending: number;
    compliance_score: number;
    overall_status: string;
    can_operate: boolean;
  };
}

const ComplianceDashboard = ({ vehicleId }: { vehicleId: number }) => {
  const [status, setStatus] = useState<ComplianceStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await axios.get(
          `/api/vehicles/${vehicleId}/compliance/status`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );
        setStatus(response.data.data);
      } catch (error) {
        console.error('Failed to fetch compliance status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [vehicleId]);

  if (loading) return <div>Loading...</div>;
  if (!status) return <div>No data available</div>;

  const getStatusColor = (statusValue: string) => {
    switch (statusValue) {
      case 'compliant': return 'green';
      case 'at_risk': return 'orange';
      case 'expired': return 'red';
      case 'pending': return 'gray';
      default: return 'gray';
    }
  };

  return (
    <div className="compliance-dashboard">
      <div className="header">
        <h2>Compliance Status</h2>
        <div className="score" style={{ color: status.summary.compliance_score >= 80 ? 'green' : 'red' }}>
          {status.summary.compliance_score}%
        </div>
      </div>

      <div className="summary">
        <div className="stat">
          <span>Total Requirements:</span>
          <span>{status.summary.total_requirements}</span>
        </div>
        <div className="stat compliant">
          <span>Compliant:</span>
          <span>{status.summary.compliant}</span>
        </div>
        <div className="stat at-risk">
          <span>At Risk:</span>
          <span>{status.summary.at_risk}</span>
        </div>
        <div className="stat expired">
          <span>Expired:</span>
          <span>{status.summary.expired}</span>
        </div>
        <div className="stat pending">
          <span>Pending:</span>
          <span>{status.summary.pending}</span>
        </div>
      </div>

      <div className="requirements-list">
        {status.requirements.map((req) => (
          <div
            key={req.requirement_id}
            className="requirement-item"
            style={{ borderLeft: `4px solid ${getStatusColor(req.status)}` }}
          >
            <div className="requirement-header">
              <h4>{req.compliance_type}</h4>
              <span className={`badge ${req.status}`}>
                {req.status.toUpperCase()}
              </span>
            </div>
            <div className="requirement-details">
              <span className="category">{req.category}</span>
              {req.days_until_expiry !== null && (
                <span className="expiry">
                  {req.days_until_expiry < 0
                    ? `${Math.abs(req.days_until_expiry)} days overdue`
                    : `${req.days_until_expiry} days until expiry`
                  }
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {!status.summary.can_operate && (
        <div className="alert alert-danger">
          ⚠️ Vehicle cannot operate due to compliance issues!
        </div>
      )}
    </div>
  );
};
```

---

## Status Calculation Logic

### How Status is Calculated

**For Each Compliance Record**:
```javascript
const calculateStatus = (expiryDate) => {
  if (!expiryDate) return 'pending';

  const now = new Date();
  const expiry = new Date(expiryDate);
  const daysUntilExpiry = Math.floor((expiry - now) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= 30) return 'at_risk';
  return 'compliant';
};
```

**For Vehicle Overall Status** (worst-case rule):
```javascript
const calculateVehicleStatus = (requirements) => {
  const statuses = requirements.map(req => req.current_status);

  if (statuses.includes('expired')) return 'expired';
  if (statuses.includes('at_risk')) return 'at_risk';
  if (statuses.includes('pending')) return 'pending';
  return 'compliant';
};
```

**Compliance Score** (0-100%):
```javascript
const calculateScore = (requirements) => {
  if (requirements.length === 0) return 100;

  let totalScore = 0;
  requirements.forEach(req => {
    switch (req.current_status) {
      case 'compliant': totalScore += 100; break;
      case 'at_risk': totalScore += 50; break;
      case 'expired': totalScore += 0; break;
      case 'pending': totalScore += 0; break;
    }
  });

  return Math.round(totalScore / requirements.length);
};
```

**Operational Status**:
```javascript
const calculateOperationalStatus = (complianceStatus) => {
  if (complianceStatus === 'expired') return 'non_operational';
  return 'operational'; // at_risk, pending, compliant
};
```

---

## Error Handling

### Common Validation Errors

**1. Compliance Type Not Applicable**
```json
{
  "success": false,
  "message": "This compliance type is not applicable to this vehicle",
  "errors": {}
}
```
**Solution**: Check that the compliance type matches the vehicle's type, state, and tenant.

**2. Document Required**
```json
{
  "success": false,
  "message": "This compliance type requires document evidence",
  "errors": {}
}
```
**Solution**: Upload a file or provide `document_ids` array.

**3. Invalid Date Range**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "expiry_date": [
      "The expiry date must be a date after issue date."
    ]
  }
}
```
**Solution**: Ensure `expiry_date` is after `issue_date`.

**4. File Too Large**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "file": [
      "The file must not be greater than 102400 kilobytes."
    ]
  }
}
```
**Solution**: Compress file or use a smaller file (max 100MB).

**5. Unauthorized Access**
```json
{
  "success": false,
  "message": "Unauthenticated.",
  "errors": {}
}
```
**Solution**: Check that the auth token is valid and included in the `Authorization` header.

**6. Vehicle Not Found**
```json
{
  "success": false,
  "message": "No query results for model [App\\Models\\Vehicle]",
  "errors": {}
}
```
**Solution**: Verify the vehicle ID exists and belongs to the current tenant.

---

## Best Practices

### 1. **Polling vs Real-time Updates**
- Poll the `/compliance/status` endpoint every 5-10 minutes for dashboard updates
- Use WebSockets/Pusher for real-time notifications when compliance expires

### 2. **Caching Strategy**
- Cache compliance types list (they rarely change)
- Refresh vehicle compliance status on page load
- Invalidate cache after creating/updating records

### 3. **File Upload UX**
- Show upload progress
- Validate file size client-side before upload
- Accept: `.pdf`, `.jpg`, `.jpeg`, `.png`, `.doc`, `.docx`
- Max size: 100MB

### 4. **Date Handling**
- Always use `YYYY-MM-DD` format for API
- Convert to local timezone for display
- Show days until expiry prominently

### 5. **Error Display**
- Show validation errors inline with form fields
- Display generic errors in toast/snackbar
- Log errors to monitoring service (Sentry, etc.)

---

## Testing Checklist

### Frontend Developer Testing Checklist

- [ ] Can view list of compliance types
- [ ] Can filter compliance types by category
- [ ] Can view compliance records for a vehicle
- [ ] Can create new compliance record with file upload
- [ ] Can create compliance record with existing document
- [ ] Can update compliance record
- [ ] Can delete compliance record
- [ ] Can view compliance history
- [ ] Can approve compliance record
- [ ] Can view vehicle compliance status dashboard
- [ ] Status badges show correct colors
- [ ] Days until expiry calculated correctly
- [ ] File upload progress shows
- [ ] Validation errors display properly
- [ ] Cannot submit without required fields
- [ ] Cannot upload files > 100MB
- [ ] Auth token expires, shows login prompt
- [ ] Tenant isolation works (cannot see other tenant's data)

---

## Support & Questions

If you have questions or need clarification:
1. Check the Nova admin panel at `/nova` to see how it works visually
2. Review the controller code: `app/Http/Controllers/Api/ComplianceRecordController.php`
3. Check model logic: `app/Models/ComplianceRecord.php`
4. Test endpoints using Postman/Insomnia with the examples above

**Happy coding! 🚀**