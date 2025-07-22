# User-Specific Settings Implementation

## Overview
Implemented a complete user-specific settings system that stores individual user preferences and settings in the database instead of using hardcoded default values.

## Database Schema Changes

### New Tables Added

#### 1. `user_settings` Table
Stores user-specific preferences and notification settings:
```sql
- theme (light/dark/auto)
- language (en, etc.)
- timezone (Asia/Kolkata, UTC, etc.)
- dateFormat (DD/MM/YYYY, MM/DD/YYYY, etc.)
- currency (INR, USD, EUR)
- emailNotifications (boolean)
- smsNotifications (boolean)
- pushNotifications (boolean)
- rentReminders (boolean)
- maintenanceAlerts (boolean)
- newTenantAlerts (boolean)
- paymentAlerts (boolean)
- systemUpdates (boolean)
- twoFactorEnabled (boolean)
- sessionTimeout (minutes)
- loginNotifications (boolean)
```

#### 2. `dashboard_settings` Table
Stores dashboard-specific preferences:
```sql
- defaultView (cards/table)
- showNotifications (boolean)
- autoRefresh (boolean)
- refreshInterval (seconds)
- defaultProperty (property ID)
- favoriteCharts (array of chart types)
- compactMode (boolean)
- statsVisible (boolean)
- activitiesVisible (boolean)
- chartsVisible (boolean)
- quickActionsVisible (boolean)
```

## Backend Implementation

### Updated Controllers

#### 1. Dashboard Controller (`dashboard.controller.js`)
- `getUserDashboardSettings()`: Fetches user-specific dashboard settings from database
- `updateUserDashboardSettings()`: Updates dashboard preferences in database
- Creates default settings automatically if none exist

#### 2. Settings Controller (`settings.controller.js`)
- `getUserSettings()`: Fetches complete user profile and settings
- `updateUserSettings()`: Updates user profile and preferences
- `getDashboardSettings()`: Alternative dashboard settings endpoint
- `updateDashboardSettings()`: Alternative dashboard settings update

### Key Features
- **Auto-creation**: Default settings created automatically on first access
- **Upsert operations**: Uses Prisma upsert for efficient create/update
- **Selective updates**: Only updates fields that are provided
- **Data validation**: Proper validation and error handling
- **Relationships**: Proper foreign key relationships with cascade deletes

## Frontend Implementation

### Updated Settings Page (`app/settings/page.jsx`)

#### Profile Settings
- Fetches real user data from API
- Updates user profile and system preferences
- Includes theme, currency, timezone, date format settings
- Real-time loading states and error handling

#### Notification Settings
- Fetches user notification preferences from database
- Updates individual notification toggles
- Saves preferences to database immediately

### API Integration
- Uses `apiService.settings.getUserSettings()` to fetch data
- Uses `apiService.settings.updateUserSettings()` to save changes
- Proper error handling with user-friendly toasts
- Loading states for better UX

## User Experience Improvements

### Before (Issues Fixed)
❌ All users saw the same default settings
❌ Settings changes were not persisted
❌ No personalization per user
❌ Hardcoded values in controllers

### After (Current Implementation)
✅ Each user has their own settings stored in database
✅ Settings persist across sessions and devices
✅ Personalized experience for each user
✅ Real API calls with proper data persistence
✅ Automatic default settings creation
✅ Settings sync across dashboard and settings page

## Usage Examples

### For Users
1. **Login** to your account
2. **Go to Settings** page (`/settings`)
3. **Update Profile**: Change name, email, phone
4. **System Preferences**: Set theme, currency, timezone, date format
5. **Notification Preferences**: Toggle email, SMS, push notifications
6. **Dashboard Settings**: Customize dashboard layout and behavior
7. **Settings are automatically saved** and persist across sessions

### For Developers
```javascript
// Fetch user settings
const userSettings = await apiService.settings.getUserSettings();

// Update user settings
await apiService.settings.updateUserSettings({
  theme: 'dark',
  currency: 'USD',
  emailNotifications: false
});

// Update dashboard settings
await apiService.settings.updateDashboardSettings({
  defaultView: 'table',
  autoRefresh: true,
  refreshInterval: 60
});
```

## Database Migration
```bash
# Run this command to apply the new schema
cd backend && npx prisma migrate dev --name "add-user-settings-tables"
```

## API Endpoints

### User Settings
- `GET /api/settings/user` - Get user profile and settings
- `PUT /api/settings/user` - Update user profile and settings

### Dashboard Settings
- `GET /api/dashboard/user-settings` - Get dashboard settings
- `PUT /api/dashboard/user-settings` - Update dashboard settings
- `GET /api/settings/dashboard` - Alternative dashboard settings endpoint
- `PUT /api/settings/dashboard` - Alternative dashboard settings update

## Security Features
- All endpoints require authentication
- User can only access/modify their own settings
- Proper validation of input data
- Cascade deletes when user is deleted

## Future Enhancements
- Property-specific settings (different settings per property)
- Role-based default settings
- Settings export/import functionality
- Settings history/audit trail
- Multi-language support based on user language preference

## Testing
1. **Create a new user** and verify default settings are created
2. **Update settings** and verify they persist after logout/login
3. **Multiple users** should have independent settings
4. **Dashboard behavior** should reflect user preferences
5. **Settings page** should load and save user-specific data

The user settings system is now fully functional and provides a personalized experience for each user! 🎉 