'use client';

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addToast } from '@/store/slices/uiSlice';
import { fetchProperties } from '@/store/slices/propertySlice';
import apiService from '@/services/api';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Dropdown } from '@/components/ui/Dropdown';
import {
  Settings,
  User,
  Bell,
  Shield,
  FileText,
  Save,
  Download,
  Upload,
  Plus,
  Trash2,
  Eye,
  Edit3
} from 'lucide-react';
import { DeleteIcon, EditIcon, ICON_COLORS } from '@/src/assets/icons';

function ProfileSettings() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [userSettings, setUserSettings] = useState(null);
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
    username: '',
    theme: 'light',
    language: 'en',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    currency: 'INR'
  });

  // Fetch user settings on component mount
  useEffect(() => {
    fetchUserSettings();
  }, []);

  const fetchUserSettings = async () => {
    try {
      setLoading(true);
      console.log('🔧 Fetching user settings...');
      
      const response = await apiService.settings.getUserSettings();
      console.log('✅ User settings response:', response);
      
      const userData = response.data;
      
      setUserSettings(userData.userSettings);
      setProfileData({
        fullName: userData.fullName || '',
        email: userData.email || '',
        phone: userData.phone || '',
        username: userData.username || '',
        theme: userData.userSettings?.theme || 'light',
        language: userData.userSettings?.language || 'en',
        timezone: userData.userSettings?.timezone || 'Asia/Kolkata',
        dateFormat: userData.userSettings?.dateFormat || 'DD/MM/YYYY',
        currency: userData.userSettings?.currency || 'INR'
      });
    } catch (error) {
      console.error('❌ Error fetching user settings:', error);
      dispatch(addToast({
        title: 'Error',
        description: `Failed to load user settings: ${error.message || 'Unknown error'}`,
        variant: 'error'
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await apiService.settings.updateUserSettings(profileData);
      
      dispatch(addToast({
        title: 'Profile Updated',
        description: 'Your profile settings have been saved successfully.',
        variant: 'success'
      }));
    } catch (error) {
      // Show backend error message if available
      const errorMsg = error?.response?.data?.error?.message || error?.message || 'Failed to save profile settings.';
      dispatch(addToast({
        title: 'Error',
        description: errorMsg,
        variant: 'error'
      }));
    } finally {
      setLoading(false);
    }
  };

  const currencyOptions = [
    { value: 'INR', label: 'Indian Rupee (₹)' },
    // { value: 'USD', label: 'US Dollar ($)' },
    // { value: 'EUR', label: 'Euro (€)' }
  ];

  const dateFormatOptions = [
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
    // { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
    // { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }
  ];

  const timezoneOptions = [
    { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
    // { value: 'UTC', label: 'UTC' },
    // { value: 'America/New_York', label: 'America/New_York (EST)' }
  ];

  const themeOptions = [
    { value: 'light', label: 'Light Theme' },
    // { value: 'dark', label: 'Dark Theme' },
    // { value: 'auto', label: 'Auto (System)' }
  ];

  if (loading && !userSettings) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-pulse">Loading user settings...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="w-5 h-5" />
          <span>Profile Settings</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Personal Information */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Personal Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={profileData.fullName}
              onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
              placeholder="Enter your full name"
            />
            <Input
              label="Email Address"
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter your email"
            />
            <Input
              label="Phone Number"
              value={profileData.phone}
              onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="Enter your phone number"
            />
            <Input
              label="Username"
              value={profileData.username}
              disabled
              className="bg-gray-50"
              placeholder="Username cannot be changed"
            />
          </div>
        </div>

        {/* System Preferences */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">System Preferences</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Dropdown
              label="Theme"
              options={themeOptions}
              value={profileData.theme}
              onChange={(value) => setProfileData(prev => ({ ...prev, theme: value }))}
            />
            <Dropdown
              label="Currency"
              options={currencyOptions}
              value={profileData.currency}
              onChange={(value) => setProfileData(prev => ({ ...prev, currency: value }))}
            />
            <Dropdown
              label="Date Format"
              options={dateFormatOptions}
              value={profileData.dateFormat}
              onChange={(value) => setProfileData(prev => ({ ...prev, dateFormat: value }))}
            />
            <Dropdown
              label="Timezone"
              options={timezoneOptions}
              value={profileData.timezone}
              onChange={(value) => setProfileData(prev => ({ ...prev, timezone: value }))}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function NotificationSettings() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    rentReminders: true,
    maintenanceAlerts: true,
    newTenantAlerts: true,
    paymentAlerts: true,
    systemUpdates: false
  });

  // Fetch notification settings on component mount
  useEffect(() => {
    fetchNotificationSettings();
  }, []);

  const fetchNotificationSettings = async () => {
    try {
      setLoading(true);
      const response = await apiService.settings.getUserSettings();
      const userSettings = response.data.userSettings;
      
      if (userSettings) {
        setNotifications({
          emailNotifications: userSettings.emailNotifications,
          smsNotifications: userSettings.smsNotifications,
          pushNotifications: userSettings.pushNotifications,
          rentReminders: userSettings.rentReminders,
          maintenanceAlerts: userSettings.maintenanceAlerts,
          newTenantAlerts: userSettings.newTenantAlerts,
          paymentAlerts: userSettings.paymentAlerts,
          systemUpdates: userSettings.systemUpdates
        });
      }
    } catch (error) {
      dispatch(addToast({
        title: 'Error',
        description: 'Failed to load notification settings.',
        variant: 'error'
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await apiService.settings.updateUserSettings(notifications);
      
      dispatch(addToast({
        title: 'Notifications Updated',
        description: 'Your notification preferences have been saved.',
        variant: 'success'
      }));
    } catch (error) {
      dispatch(addToast({
        title: 'Error',
        description: 'Failed to save notification settings.',
        variant: 'error'
      }));
    } finally {
      setLoading(false);
    }
  };

  const NotificationToggle = ({ label, description, checked, onChange }) => (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex-1">
        <h4 className="font-medium text-gray-900">{label}</h4>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
      </label>
    </div>
  );

  if (loading && Object.keys(notifications).every(key => notifications[key] === true || notifications[key] === false)) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-pulse">Loading notification settings...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bell className="w-5 h-5" />
          <span>Notification Settings</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <NotificationToggle
          label="Email Notifications"
          description="Receive notifications via email"
          checked={notifications.emailNotifications}
          onChange={(checked) => setNotifications(prev => ({ ...prev, emailNotifications: checked }))}
        />
        
        <NotificationToggle
          label="SMS Notifications"
          description="Receive notifications via SMS"
          checked={notifications.smsNotifications}
          onChange={(checked) => setNotifications(prev => ({ ...prev, smsNotifications: checked }))}
        />
        
        <NotificationToggle
          label="Push Notifications"
          description="Receive push notifications in browser"
          checked={notifications.pushNotifications}
          onChange={(checked) => setNotifications(prev => ({ ...prev, pushNotifications: checked }))}
        />
        
        <NotificationToggle
          label="Rent Reminders"
          description="Get notified about upcoming rent payments"
          checked={notifications.rentReminders}
          onChange={(checked) => setNotifications(prev => ({ ...prev, rentReminders: checked }))}
        />
        
        <NotificationToggle
          label="Maintenance Alerts"
          description="Receive alerts about maintenance requests"
          checked={notifications.maintenanceAlerts}
          onChange={(checked) => setNotifications(prev => ({ ...prev, maintenanceAlerts: checked }))}
        />
        
        <NotificationToggle
          label="New Tenant Alerts"
          description="Get notified when new tenants join"
          checked={notifications.newTenantAlerts}
          onChange={(checked) => setNotifications(prev => ({ ...prev, newTenantAlerts: checked }))}
        />
        
        <NotificationToggle
          label="Payment Alerts"
          description="Receive notifications about payments"
          checked={notifications.paymentAlerts}
          onChange={(checked) => setNotifications(prev => ({ ...prev, paymentAlerts: checked }))}
        />
        
        <NotificationToggle
          label="System Updates"
          description="Get notified about system updates and features"
          checked={notifications.systemUpdates}
          onChange={(checked) => setNotifications(prev => ({ ...prev, systemUpdates: checked }))}
        />

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TermsAndConditionsSettings() {
  const dispatch = useDispatch();
  const { properties, selectedProperty } = useSelector((state) => state.property);
  const [loading, setLoading] = useState(false);
  const [terms, setTerms] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch terms and conditions on component mount
  useEffect(() => {
    if (selectedProperty?.id) {
      fetchTermsAndConditions();
    } else if (properties.length > 0) {
      // Use first property if no selected property
      fetchTermsAndConditions(properties[0].id);
    }
  }, [selectedProperty, properties]);

  const fetchTermsAndConditions = async (propertyId = selectedProperty?.id) => {
    if (!propertyId) return;

    try {
      setLoading(true);
      console.log('🔧 Fetching terms and conditions for property:', propertyId);
      
      const response = await apiService.settings.getPropertySettings(propertyId);
      const settings = response.data;
      
      console.log('✅ Terms and conditions response:', settings);
      
      // Set terms from property settings rules
      if (settings.rules && settings.rules.length > 0) {
        setTerms(settings.rules);
      } else {
        // Set default terms if none exist
        setTerms([
          "The tenant agrees to pay rent on or before the 5th of every month.",
          "No smoking or consumption of alcohol is allowed on the premises.",
          "Visitors are allowed only between 9:00 AM to 9:00 PM.",
          "The tenant must maintain cleanliness in their room and common areas.",
          "Any damage to property will be charged from the security deposit."
        ]);
      }
    } catch (error) {
      console.error('❌ Error fetching terms and conditions:', error);
      dispatch(addToast({
        title: 'Error',
        description: `Failed to load terms and conditions: ${error.message || 'Unknown error'}`,
        variant: 'error'
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleAddTerm = () => {
    setTerms([...terms, ""]);
    setEditingIndex(terms.length); // Start editing the new term
  };

  const handleUpdateTerm = (index, value) => {
    const updatedTerms = [...terms];
    updatedTerms[index] = value;
    setTerms(updatedTerms);
  };

  const handleDeleteTerm = (index) => {
    if (terms.length > 1) {
      setTerms(terms.filter((_, i) => i !== index));
      if (editingIndex === index) {
        setEditingIndex(null);
      } else if (editingIndex > index) {
        setEditingIndex(editingIndex - 1);
      }
    } else {
      dispatch(addToast({
        title: 'Cannot Delete',
        description: 'At least one term must be present.',
        variant: 'warning'
      }));
    }
  };

  const handleEditTerm = (index) => {
    setEditingIndex(index);
  };

  const handleSaveEdit = (index) => {
    if (terms[index].trim() === '') {
      dispatch(addToast({
        title: 'Invalid Term',
        description: 'Term cannot be empty.',
        variant: 'error'
      }));
      return;
    }
    setEditingIndex(null);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
  };

  const handleSave = async () => {
    const validTerms = terms.filter(term => term.trim() !== '');
    if (validTerms.length === 0) {
      dispatch(addToast({
        title: 'Invalid Terms',
        description: 'Please add at least one valid term.',
        variant: 'error'
      }));
      return;
    }

    const propertyId = selectedProperty?.id || properties[0]?.id;
    if (!propertyId) {
      dispatch(addToast({
        title: 'Error',
        description: 'No property selected. Please create a property first.',
        variant: 'error'
      }));
      return;
    }

    try {
      setLoading(true);
      console.log('🔧 Saving terms and conditions for property:', propertyId);
      
      await apiService.settings.updatePropertySettings(propertyId, {
        rules: validTerms
      });
      
      console.log('✅ Terms and conditions saved successfully');
      
      dispatch(addToast({
        title: 'Terms Updated',
        description: 'Terms and conditions have been saved successfully.',
        variant: 'success'
      }));
    } catch (error) {
      console.error('❌ Error saving terms and conditions:', error);
      dispatch(addToast({
        title: 'Error',
        description: `Failed to save terms and conditions: ${error.message || 'Unknown error'}`,
        variant: 'error'
      }));
    } finally {
      setLoading(false);
    }
  };

  if (loading && terms.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-pulse">Loading terms and conditions...</div>
        </CardContent>
      </Card>
    );
  }

  if (properties.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Properties Found</h3>
          <p className="text-gray-600">Please create a property first to manage terms and conditions.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="w-5 h-5" />
          <span>Terms & Conditions</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-4">
            Configure the terms and conditions that new tenants must agree to during registration.
            These terms will be displayed during the tenant onboarding process.
          </p>
        </div>

        <div className="space-y-3">
          {terms.map((term, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
              <span className="text-blue-600 font-semibold mt-2 min-w-[20px]">
                {index + 1}.
              </span>
              <div className="flex-1">
                {editingIndex === index ? (
                  <div className="space-y-2">
                    <textarea
                      value={term}
                      onChange={(e) => handleUpdateTerm(index, e.target.value)}
                      placeholder="Enter term or condition..."
                      rows={1}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[40px] max-h-[120px]"
                      style={{ 
                        minHeight: '40px',
                        height: 'auto',
                        overflow: 'hidden'
                      }}
                      onInput={(e) => {
                        e.target.style.height = 'auto';
                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                      }}
                      autoFocus
                    />
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleSaveEdit(index)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Save className="w-3 h-3 mr-1" />
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full px-3 py-2 text-gray-700 leading-relaxed">
                    {term || <span className="text-gray-400 italic">Empty term</span>}
                  </div>
                )}
              </div>
              {editingIndex !== index && (
                <div className="flex space-x-1 mt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditTerm(index)}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <EditIcon  />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteTerm(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <DeleteIcon color={ICON_COLORS.error}/>
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleAddTerm}
            disabled={editingIndex !== null}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Term
          </Button>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowPreview(true)}
              disabled={editingIndex !== null}
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button
              onClick={handleSave}
              disabled={editingIndex !== null || terms.some(term => term.trim() === "")}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Terms
            </Button>
          </div>
        </div>

        {/* Preview Modal */}
        <Modal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          title="Terms & Conditions Preview"
          size="lg"
        >
          <div className="space-y-4">
            <div className="bg-gray-50 p-6 rounded-lg border">
              <h3 className="text-xl font-bold text-center mb-6 text-gray-900">
                Terms and Conditions
              </h3>
              <div className="space-y-3">
                <p className="text-gray-700 mb-4">
                  By registering as a tenant, you agree to comply with the following terms and conditions:
                </p>
                {terms.filter(term => term.trim() !== '').map((term, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <span className="font-semibold text-blue-600">{index + 1}.</span>
                    <p className="text-gray-700 leading-relaxed">{term}</p>
                  </div>
                ))}
                {terms.filter(term => term.trim() !== '').length === 0 && (
                  <p className="text-gray-500 italic text-center">
                    No terms and conditions added yet.
                  </p>
                )}
              </div>
            </div>
          </div>
          <ModalFooter>
            <Button onClick={() => setShowPreview(false)}>
              Close Preview
            </Button>
          </ModalFooter>
        </Modal>
      </CardContent>
    </Card>
  );
}

function SystemSettings() {
  const dispatch = useDispatch();
  const { properties, selectedProperty } = useSelector((state) => state.property);
  const [loading, setLoading] = useState(false);
  const [systemData, setSystemData] = useState({
    currency: 'INR',
    dateFormat: 'DD/MM/YYYY',
    timezone: 'Asia/Kolkata',
    language: 'en',
    theme: 'light',
    rentDueDay: 5,
    lateFeeDays: 3,
    lateFeeAmount: 500,
    backupFrequency: 'daily'
  });

  // Fetch system settings on component mount
  useEffect(() => {
    fetchSystemSettings();
  }, []);

  const fetchSystemSettings = async () => {
    try {
      setLoading(true);
      console.log('🔧 Fetching system settings...');
      
      // Get user settings for system preferences
      const userResponse = await apiService.settings.getUserSettings();
      const userData = userResponse.data;
      
      // Get property settings for rent-related settings if property exists
      let propertySettings = null;
      const propertyId = selectedProperty?.id || properties[0]?.id;
      if (propertyId) {
        try {
          const propertyResponse = await apiService.settings.getPropertySettings(propertyId);
          propertySettings = propertyResponse.data;
        } catch (error) {
          console.log('No property settings found, using defaults');
        }
      }
      
      console.log('✅ System settings response:', { userData, propertySettings });
      
      setSystemData({
        // User settings
        currency: userData.userSettings?.currency || 'INR',
        dateFormat: userData.userSettings?.dateFormat || 'DD/MM/YYYY',
        timezone: userData.userSettings?.timezone || 'Asia/Kolkata',
        language: userData.userSettings?.language || 'en',
        theme: userData.userSettings?.theme || 'light',
        // Property settings for rent configuration
        rentDueDay: propertySettings?.paymentSettings?.rentDueDay || 5,
        lateFeeDays: propertySettings?.paymentSettings?.lateFeeDays || 3,
        lateFeeAmount: propertySettings?.paymentSettings?.lateFeeAmount || 500,
        backupFrequency: 'daily' // This could be added to user settings later
      });
    } catch (error) {
      console.error('❌ Error fetching system settings:', error);
      dispatch(addToast({
        title: 'Error',
        description: `Failed to load system settings: ${error.message || 'Unknown error'}`,
        variant: 'error'
      }));
    } finally {
      setLoading(false);
    }
  };

  const currencyOptions = [
    { value: 'INR', label: 'Indian Rupee (₹)' },
    { value: 'USD', label: 'US Dollar ($)' },
    { value: 'EUR', label: 'Euro (€)' }
  ];

  const dateFormatOptions = [
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }
  ];

  const timezoneOptions = [
    { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'America/New_York (EST)' }
  ];

  const themeOptions = [
    { value: 'light', label: 'Light Theme' },
    { value: 'dark', label: 'Dark Theme' },
    { value: 'auto', label: 'Auto (System)' }
  ];

  const backupOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' }
  ];

  const handleSave = async () => {
    try {
      setLoading(true);
      console.log('🔧 Saving system settings...');
      
      // Update user settings
      const userSettingsUpdate = {
        currency: systemData.currency,
        dateFormat: systemData.dateFormat,
        timezone: systemData.timezone,
        language: systemData.language,
        theme: systemData.theme
      };
      
      await apiService.settings.updateUserSettings(userSettingsUpdate);
      
      // Update property settings for rent configuration if property exists
      const propertyId = selectedProperty?.id || properties[0]?.id;
      if (propertyId) {
        const propertySettingsUpdate = {
          paymentSettings: {
            rentDueDay: systemData.rentDueDay,
            lateFeeDays: systemData.lateFeeDays,
            lateFeeAmount: systemData.lateFeeAmount,
            acceptedMethods: ['Cash', 'UPI', 'Bank Transfer'] // Keep existing methods
          }
        };
        
        await apiService.settings.updatePropertySettings(propertyId, propertySettingsUpdate);
      }
      
      console.log('✅ System settings saved successfully');
      
      dispatch(addToast({
        title: 'System Settings Updated',
        description: 'System configuration has been saved successfully.',
        variant: 'success'
      }));
    } catch (error) {
      console.error('❌ Error saving system settings:', error);
      dispatch(addToast({
        title: 'Error',
        description: `Failed to save system settings: ${error.message || 'Unknown error'}`,
        variant: 'error'
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = () => {
    dispatch(addToast({
      title: 'Backup Started',
      description: 'System backup is in progress...',
      variant: 'info'
    }));
  };

  const handleRestore = () => {
    dispatch(addToast({
      title: 'Restore Initiated',
      description: 'System restore process has started.',
      variant: 'warning'
    }));
  };

  if (loading && systemData.currency === 'INR') {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-pulse">Loading system settings...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="w-5 h-5" />
          <span>System Settings</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* General Settings */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">General Settings</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Dropdown
              label="Currency"
              options={currencyOptions}
              value={systemData.currency}
              onChange={(value) => setSystemData(prev => ({ ...prev, currency: value }))}
            />
            <Dropdown
              label="Date Format"
              options={dateFormatOptions}
              value={systemData.dateFormat}
              onChange={(value) => setSystemData(prev => ({ ...prev, dateFormat: value }))}
            />
            <Dropdown
              label="Timezone"
              options={timezoneOptions}
              value={systemData.timezone}
              onChange={(value) => setSystemData(prev => ({ ...prev, timezone: value }))}
            />
            <Dropdown
              label="Theme"
              options={themeOptions}
              value={systemData.theme}
              onChange={(value) => setSystemData(prev => ({ ...prev, theme: value }))}
            />
          </div>
        </div>

        {/* Rent Settings */}
        <div className="border-t pt-6">
          <h4 className="font-medium text-gray-900 mb-3">Rent & Payment Settings</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Rent Due Day"
              type="number"
              min="1"
              max="31"
              value={systemData.rentDueDay}
              onChange={(e) => setSystemData(prev => ({ ...prev, rentDueDay: e.target.value }))}
            />
            <Input
              label="Late Fee Grace Period (Days)"
              type="number"
              min="0"
              max="30"
              value={systemData.lateFeeDays}
              onChange={(e) => setSystemData(prev => ({ ...prev, lateFeeDays: e.target.value }))}
            />
            <Input
              label="Late Fee Amount"
              type="number"
              min="0"
              value={systemData.lateFeeAmount}
              onChange={(e) => setSystemData(prev => ({ ...prev, lateFeeAmount: e.target.value }))}
            />
          </div>
        </div>

        {/* Backup Settings */}
        <div className="border-t pt-6">
          <h4 className="font-medium text-gray-900 mb-3">Backup & Recovery</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Dropdown
              label="Backup Frequency"
              options={backupOptions}
              value={systemData.backupFrequency}
              onChange={(value) => setSystemData(prev => ({ ...prev, backupFrequency: value }))}
            />
            <div className="flex items-end">
              <p className="text-sm text-gray-600">Last backup: January 15, 2024</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={handleBackup}>
              <Download className="w-4 h-4 mr-2" />
              Create Backup
            </Button>
            <Button variant="outline" onClick={handleRestore}>
              <Upload className="w-4 h-4 mr-2" />
              Restore Backup
            </Button>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SecuritySettings() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false,
    sessionTimeout: 60,
    loginNotifications: true
  });

  // Fetch security settings on component mount
  useEffect(() => {
    fetchSecuritySettings();
  }, []);

  const fetchSecuritySettings = async () => {
    try {
      setLoading(true);
      console.log('🔧 Fetching security settings...');
      
      const response = await apiService.settings.getUserSettings();
      const userData = response.data;
      
      console.log('✅ Security settings response:', userData);
      
      setSecurityData(prev => ({
        ...prev,
        twoFactorEnabled: userData.userSettings?.twoFactorEnabled || false,
        sessionTimeout: userData.userSettings?.sessionTimeout || 60,
        loginNotifications: userData.userSettings?.loginNotifications || true
      }));
    } catch (error) {
      console.error('❌ Error fetching security settings:', error);
      dispatch(addToast({
        title: 'Error',
        description: `Failed to load security settings: ${error.message || 'Unknown error'}`,
        variant: 'error'
      }));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (securityData.newPassword !== securityData.confirmPassword) {
      dispatch(addToast({
        title: 'Password Mismatch',
        description: 'New password and confirm password do not match.',
        variant: 'error'
      }));
      return;
    }

    if (securityData.newPassword.length < 6) {
      dispatch(addToast({
        title: 'Password Too Short',
        description: 'Password must be at least 6 characters long.',
        variant: 'error'
      }));
      return;
    }

    try {
      setLoading(true);
      console.log('🔧 Changing password...');
      
      // Call password change API (you'll need to implement this endpoint)
      await apiService.auth.changePassword({
        currentPassword: securityData.currentPassword,
        newPassword: securityData.newPassword
      });
      
      console.log('✅ Password changed successfully');
      
      dispatch(addToast({
        title: 'Password Updated',
        description: 'Your password has been changed successfully.',
        variant: 'success'
      }));

      setSecurityData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      console.error('❌ Error changing password:', error);
      dispatch(addToast({
        title: 'Error',
        description: `Failed to change password: ${error.message || 'Unknown error'}`,
        variant: 'error'
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleSecuritySettingsUpdate = async () => {
    try {
      setLoading(true);
      console.log('🔧 Updating security settings...');
      
      const securitySettingsUpdate = {
        twoFactorEnabled: securityData.twoFactorEnabled,
        sessionTimeout: securityData.sessionTimeout,
        loginNotifications: securityData.loginNotifications
      };
      
      await apiService.settings.updateUserSettings(securitySettingsUpdate);
      
      console.log('✅ Security settings updated successfully');
      
      dispatch(addToast({
        title: 'Security Settings Updated',
        description: 'Your security preferences have been saved successfully.',
        variant: 'success'
      }));
    } catch (error) {
      console.error('❌ Error updating security settings:', error);
      dispatch(addToast({
        title: 'Error',
        description: `Failed to update security settings: ${error.message || 'Unknown error'}`,
        variant: 'error'
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorToggle = () => {
    setSecurityData(prev => ({ ...prev, twoFactorEnabled: !prev.twoFactorEnabled }));
  };

  if (loading && securityData.sessionTimeout === 60) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-pulse">Loading security settings...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="w-5 h-5" />
          <span>Security Settings</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Password Change */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Change Password</h4>
          <div className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              value={securityData.currentPassword}
              onChange={(e) => setSecurityData(prev => ({ ...prev, currentPassword: e.target.value }))}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="New Password"
                type="password"
                value={securityData.newPassword}
                onChange={(e) => setSecurityData(prev => ({ ...prev, newPassword: e.target.value }))}
              />
              <Input
                label="Confirm New Password"
                type="password"
                value={securityData.confirmPassword}
                onChange={(e) => setSecurityData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              />
            </div>
            <Button onClick={handlePasswordChange}>
              <Save className="w-4 h-4 mr-2" />
              Change Password
            </Button>
          </div>
        </div>

        {/* Two-Factor Authentication */}
        <div className="border-t pt-6">
          <h4 className="font-medium text-gray-900 mb-3">Two-Factor Authentication</h4>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h5 className="font-medium">Enable Two-Factor Authentication</h5>
              <p className="text-sm text-gray-500 mt-1">
                Add an extra layer of security to your account
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={securityData.twoFactorEnabled}
                onChange={handleTwoFactorToggle}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {/* Session Settings */}
        <div className="border-t pt-6">
          <h4 className="font-medium text-gray-900 mb-3">Session Settings</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Session Timeout (minutes)"
              type="number"
              min="15"
              max="480"
              value={securityData.sessionTimeout}
              onChange={(e) => setSecurityData(prev => ({ ...prev, sessionTimeout: e.target.value }))}
            />
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h5 className="font-medium">Login Notifications</h5>
                <p className="text-sm text-gray-500 mt-1">Get notified of new logins</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={securityData.loginNotifications}
                  onChange={(e) => setSecurityData(prev => ({ ...prev, loginNotifications: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Save Security Settings */}
        <div className="flex justify-end pt-4 border-t">
          <Button
            onClick={handleSecuritySettingsUpdate}
            disabled={loading}
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Security Settings'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('profile');

  // Fetch properties on component mount
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchProperties());
    }
  }, [dispatch, isAuthenticated]);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'terms', label: 'Terms & Conditions', icon: FileText },
    { id: 'system', label: 'System', icon: Settings },
    { id: 'security', label: 'Security', icon: Shield }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'terms':
        return <TermsAndConditionsSettings />;
      case 'system':
        return <SystemSettings />;
      case 'security':
        return <SecuritySettings />;
      default:
        return <ProfileSettings />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your PG system preferences and configuration</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>{renderTabContent()}</div>
    </div>
  );
} 