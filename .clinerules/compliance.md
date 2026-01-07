# Compliance System Knowledge Base

This file contains all essential information about the compliance system implementation to avoid repeated file reads.

## File Locations

### Components
- **Compliance Overview**: `src/components/compliance/compliance-overview.tsx`
- **Compliance Form Dialog**: `src/components/compliance/compliance-form-dialog.tsx`
- **Compliance Records Table**: `src/components/compliance/compliance-records-table.tsx`
- **Compliance Status Badge**: `src/components/compliance/compliance-status-badge.tsx`
- **Compliance History Sheet**: `src/components/compliance/compliance-history-sheet.tsx`

### Pages
- **Vehicle Compliance Page**: `src/app/dashboard/vehicles/[id]/compliance/page.tsx`

### API/Services
- **Compliance Service**: `src/lib/compliance.ts`
- **Vehicle Service**: `src/lib/vehicles.ts`

## Key TypeScript Interfaces

### ComplianceType
```typescript
export interface ComplianceType {
  id: number;
  name: string;
  description?: string;
  category: 'roadworthiness' | 'registration' | 'insurance' | 'inspection' | 'other';
  scope_type: 'global' | 'state' | 'vehicle_type' | 'tenant';
  state_code?: string;
  vehicle_type_id?: number;
  tenant_id?: string;
  renewal_frequency_days: number;
  requires_document: boolean;
  is_required: boolean;
  is_active: boolean;
  alert_thresholds: number[];
  accepted_document_types: number[];
  sort_order: number;
}
```

### ComplianceRecord
```typescript
export interface ComplianceRecord {
  id: number;
  tenant_id: string;
  vehicle_id: number;
  vehicle_compliance_requirement_id: number;
  compliance_type_id: number;
  issue_date: string;
  expiry_date: string;
  inspection_provider?: string;  // Not used in form
  inspection_number?: string;    // Not used in form
  notes?: string;
  submitted_by: { id: number; name: string; email: string; };
  approved_by?: { id: number; name: string; email: string; };
  approved_at?: string;
  is_current: boolean;
  status: 'compliant' | 'at_risk' | 'expired' | 'pending';
  days_until_expiry: number;
  compliance_type: ComplianceType;
  documents: ComplianceDocument[];
  created_at: string;
  updated_at: string;
}
```

### ComplianceStatus
```typescript
export interface ComplianceStatus {
  vehicle: {
    id: number;
    vehicle_type_id?: number;
    vehicle_type_name?: string;
    state_of_operation?: string;
    compliance_status: string;
    compliance_score: number | string;
    operational_status: string;
  };
  requirements: {
    required: ComplianceRequirement[];
    optional: ComplianceRequirement[];
  };
  summary: ComplianceSummary;
}

export interface ComplianceSummary {
  total_requirements: number;  // Count of required items only
  compliant: number;
  at_risk: number;
  expired: number;
  pending: number;
  compliance_score: number | string;
  overall_status: 'compliant' | 'at_risk' | 'expired' | 'pending';
  can_operate: boolean;
}

export interface ComplianceRequirement {
  requirement_id: number;
  compliance_type: string;
  compliance_type_name?: string;  // Preferred field to display
  category: string;
  status: 'compliant' | 'at_risk' | 'expired' | 'pending';
  current_record: ComplianceRecord | null;
  days_until_expiry: number | null;
  is_overdue: boolean;
}
```

## API Endpoints & Usage

### 1. Get Compliance Types (Filtered)
```typescript
// General endpoint with filters
complianceService.getComplianceTypes({
  vehicle_type_id?: number;
  category?: string;
  state_code?: string;
  is_active?: boolean;
})
// Backend: GET /api/compliance-types?vehicle_type_id=8&state_code=VIC
```

### 2. Get Vehicle-Specific Compliance Types
```typescript
// Automatically filters by vehicle's type and state
complianceService.getVehicleComplianceTypes(vehicleId)
// Backend: GET /api/vehicles/{vehicleId}/compliance-types
// Returns: { vehicle: {...}, compliance_types: [...] }
```

### 3. Get Vehicle Compliance Status
```typescript
complianceService.getVehicleComplianceStatus(vehicleId)
// Backend: GET /api/vehicles/{vehicleId}/compliance/status
// Returns: { success: true, data: ComplianceStatus }

// NEW API Response Structure (Updated):
{
  "vehicle": {
    "id": 148,
    "vehicle_type_id": 8,
    "vehicle_type_name": "Crane",
    "state_of_operation": "VIC",
    "compliance_status": "pending",
    "compliance_score": "0.00",
    "operational_status": "operational"
  },
  "requirements": {
    "required": [...],  // Array of required compliance items
    "optional": [...]   // Array of optional compliance items
  },
  "summary": {
    "total_requirements": 4,  // Required only
    "compliant": 0,
    "at_risk": 0,
    "expired": 0,
    "pending": 4,
    "compliance_score": "0.00",
    "overall_status": "pending",
    "can_operate": false
  }
}
```

### 4. Get Vehicle Compliance Records
```typescript
complianceService.getVehicleComplianceRecords(vehicleId, {
  compliance_type_id?: number;
  status?: string;
  current_only?: boolean;
})
// Backend: GET /api/vehicles/{vehicleId}/compliance-records
```

### 5. Create Compliance Record
```typescript
const formData = new FormData();
formData.append("compliance_type_id", "123");
formData.append("issue_date", "2024-01-01");
formData.append("expiry_date", "2025-01-01");
formData.append("file", fileObject);
formData.append("document_type_id", "456");

complianceService.createComplianceRecord(vehicleId, formData)
// Backend: POST /api/vehicles/{vehicleId}/compliance-records
```

## Backend Filtering Logic

### Vehicle Type Filtering
```php
// Backend filters compliance types by vehicle type
if ($request->has('vehicle_type_id')) {
    $query->where(function($q) use ($request) {
        $q->whereNull('vehicle_type_id')  // Global types (all vehicle types)
          ->orWhere('vehicle_type_id', $request->vehicle_type_id); // Specific type
    });
}
```

Returns: Global compliance types + types specific to the vehicle_type_id

## Important Implementation Notes

### ComplianceFormDialog
1. **Fetching Compliance Types**: Uses `getVehicleComplianceTypes(vehicleId)` which automatically filters by vehicle type and state
2. **Response Structure**: API returns `{ vehicle: {...}, compliance_types: [...] }`, need to extract `compliance_types` array
3. **Fields NOT Included**: `inspection_provider` and `inspection_number` are NOT in the form (as per requirements)
4. **Auto-calculated Expiry**: When compliance type has `renewal_frequency_days`, expiry is auto-calculated from issue date
5. **Document Handling**: File upload with document_type_id from compliance type's `accepted_document_types`

### ComplianceOverview
1. **Data Source**: Fetches from `getVehicleComplianceStatus(vehicleId)`
2. **API Response Structure**:
   - `requirements` is now an object with `required` and `optional` arrays (not a flat array)
   - `compliance_score` can be string or number
3. **Displays**:
   - Compliance Score card (percentage) - converted to number, with progress bar and overall status
   - List of ALL requirements (required + optional) showing:
     - Compliance type name (NOT category) using `compliance_type_name` or fallback to `compliance_type`
     - "(Optional)" text for optional items
     - Days until expiry (if applicable)
     - Status badge
   - Start Inhibit warning if `can_operate` is false
4. **Data is Pre-Calculated**: Backend calculates all scores and counts, frontend just displays
5. **Important**: Combine `requirements.required` and `requirements.optional` arrays, marking each with `isOptional` flag

### Vehicle Service Methods
```typescript
vehicleService.getOne(id, includeFieldValues = true) // Note: NOT getById
vehicleService.getAll(filters)
vehicleService.create(data)
vehicleService.update(id, data)
vehicleService.delete(id)
```

## Common Pitfalls

1. **API Response Structure**: `getVehicleComplianceTypes()` returns nested object with `compliance_types` array, not direct array
2. **Vehicle Service Method**: Use `getOne()` not `getById()`
3. **Filtering**: Always use vehicle-specific endpoint for compliance types to ensure proper filtering
4. **Compliance Score**: Don't calculate on frontend - it comes from backend API
5. **Requirements Count**: Based on vehicle type - shows only applicable compliance types

## Form Validation

### Required Fields
- compliance_type_id (required)
- issue_date (required)
- expiry_date (required)
- file (optional, but required if compliance type has `requires_document: true`)

### File Upload
- Accepted formats: .pdf, .jpg, .jpeg, .png, .doc, .docx
- Sent as multipart/form-data
- Must include document_type_id from compliance type's accepted types

## Status Logic

### Status Types
- **compliant**: Valid, not expiring soon
- **at_risk**: Expiring within threshold (usually 30 days)
- **expired**: Past expiry date
- **pending**: Awaiting approval

### Badge Colors
- Compliant: Green
- At Risk: Orange/Yellow
- Expired: Red
- Pending: Blue/Gray
