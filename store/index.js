import { configureStore } from '@reduxjs/toolkit';
import roomsReducer from './slices/roomsSlice';
import tenantsReducer from './slices/tenantsSlice';
import dashboardReducer from './slices/dashboardSlice';
import uiReducer from './slices/uiSlice';
import floorsReducer from './slices/floorsSlice';
import bedsReducer from './slices/bedsSlice';
import authReducer from './slices/authSlice';
import propertyReducer from './slices/propertySlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    property: propertyReducer,
    rooms: roomsReducer,
    tenants: tenantsReducer,
    dashboard: dashboardReducer,
    ui: uiReducer,
    floors: floorsReducer,
    beds: bedsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
}); 