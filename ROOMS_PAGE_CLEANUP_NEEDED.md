# 🔧 Rooms Page Cleanup - URGENT FIX NEEDED

## ❌ **CURRENT ISSUE:**

**Runtime Error:** `fetchTenants is not defined` in `app/rooms/page.jsx` line 1916

**Root Cause:** The rooms page still has extensive tenant-related code that should be removed since tenants are now managed in the dedicated `/tenants` page.

## 🚨 **IMMEDIATE FIX NEEDED:**

### **1. Remove fetchTenants Call (CRITICAL)**
**File:** `app/rooms/page.jsx` line 1916
**Fix:** Remove the line `dispatch(fetchTenants({ propertyId: selectedProperty.id }));`

### **2. Clean Up Tenant References**
**The rooms page still has 80+ tenant references that should be removed:**

#### **Tenant-Related Code to Remove:**
- ❌ `TenantFormModal` function (lines 1358-1803) - 446 lines!
- ❌ `handleTenantSubmit` function
- ❌ `handleEditTenant` function  
- ❌ `handleDeleteTenant` function
- ❌ `handleAssignTenantToBed` function
- ❌ `handleVacateTenant` function
- ❌ `showTenantModal` state
- ❌ `editingTenant` state
- ❌ Tenant column in bed table
- ❌ Tenant references in bed cards
- ❌ TenantFormModal usage in modals section

#### **What Should Remain:**
- ✅ Floors management
- ✅ Rooms management  
- ✅ Beds management
- ✅ Bed occupancy status (Available/Occupied)
- ✅ Basic bed information display

## 🎯 **QUICK PATCH (IMMEDIATE):**

To fix the runtime error immediately, remove this line from the useEffect:

```javascript
// REMOVE THIS LINE:
dispatch(fetchTenants({ propertyId: selectedProperty.id }));
```

**Location:** `app/rooms/page.jsx` around line 1916

## 🔄 **PROPER CLEANUP (RECOMMENDED):**

### **Step 1: Remove Tenant Imports**
```javascript
// Remove tenant-related imports
import { fetchTenants, createTenant, updateTenant, deleteTenant, assignTenantToBed as assignTenant, vacateTenant } from '@/store/slices/tenantsSlice';
```

### **Step 2: Clean Bed Display**
**Current (Wrong):**
```javascript
// Shows tenant info in bed table
{tenant ? (
  <div>
    <div>{tenant.fullName}</div>
    <div>{tenant.phone}</div>
  </div>
) : (
  <span>No tenant</span>
)}
```

**Should Be:**
```javascript
// Just show occupancy status
<span className={`px-2 py-1 rounded-full text-xs ${
  bed.status === 'Available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
}`}>
  {bed.status}
</span>
```

### **Step 3: Remove Tenant Management Functions**
Remove all functions starting with `handleTenant*`

### **Step 4: Remove TenantFormModal**
Remove the entire 446-line TenantFormModal function

### **Step 5: Update Bed Table Headers**
```javascript
// Remove "Tenant" column header
<th>Tenant</th> // ❌ Remove this

// Keep only relevant bed info
<th>Bed Info</th>
<th>Room</th>
<th>Status</th>
<th>Rent</th>
<th>Actions</th>
```

## 🏠 **PROPER SEPARATION:**

### **Rooms Page Should Handle:**
- ✅ Floor creation, editing, deletion
- ✅ Room creation, editing, deletion  
- ✅ Bed creation, editing, deletion
- ✅ Bed status (Available/Occupied/Maintenance)
- ✅ Room and bed configurations

### **Tenants Page Should Handle:**
- ✅ Tenant creation, editing, deletion
- ✅ Tenant-bed assignments
- ✅ Tenant personal information
- ✅ Terms and conditions acceptance
- ✅ Financial management (deposits, rent)

## 🚀 **TESTING AFTER CLEANUP:**

### **Rooms Page Should:**
1. ✅ Load without runtime errors
2. ✅ Show floors, rooms, beds properly
3. ✅ Allow bed creation/editing
4. ✅ Show bed status correctly
5. ✅ NOT show tenant management options

### **Tenants Page Should:**
1. ✅ Handle all tenant operations
2. ✅ Show hierarchical bed selection
3. ✅ Display terms and conditions
4. ✅ Manage tenant-bed relationships

## ⚡ **IMMEDIATE ACTION REQUIRED:**

**Priority 1:** Remove the `fetchTenants` call to fix runtime error
**Priority 2:** Clean up all tenant-related code from rooms page
**Priority 3:** Test both pages work independently

**The rooms page has become bloated with tenant code that belongs in the dedicated tenants page!** 🔧 