'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Bell,
  Building2,
  ChevronDown,
  FileText,
  Globe,
  Plus,
  Save,
  Settings,
  Shield,
  Trash2,
  User,
} from 'lucide-react';
import { addToast } from '@/store/slices/uiSlice';
import { fetchProperties } from '@/store/slices/propertySlice';
import apiService from '@/services/api';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const THEME_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'auto', label: 'System (Auto)' },
];

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
];

const TIMEZONE_OPTIONS = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'America/New_York (EST)' },
];

const DATE_FORMAT_OPTIONS = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
];

const CURRENCY_OPTIONS = [
  { value: 'INR', label: 'Indian Rupee (INR)' },
  { value: 'USD', label: 'US Dollar (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
];

const PAYMENT_METHOD_OPTIONS = ['Cash', 'UPI', 'Bank Transfer', 'Card', 'Net Banking'];

const defaultProfileData = {
  fullName: '',
  email: '',
  phone: '',
  username: '',
  theme: 'light',
  language: 'en',
  timezone: 'Asia/Kolkata',
  dateFormat: 'DD/MM/YYYY',
  currency: 'INR',
};

const defaultNotificationData = {
  emailNotifications: true,
  smsNotifications: false,
  pushNotifications: true,
  rentReminders: true,
  maintenanceAlerts: true,
  newTenantAlerts: true,
  paymentAlerts: true,
  systemUpdates: false,
};

const defaultSystemData = {
  theme: 'light',
  language: 'en',
  timezone: 'Asia/Kolkata',
  dateFormat: 'DD/MM/YYYY',
  currency: 'INR',
  rentDueDay: 5,
  lateFeeDays: 3,
  lateFeeAmount: 500,
  acceptedMethods: ['Cash', 'UPI', 'Bank Transfer'],
  contactPhone: '',
  contactEmail: '',
  emergencyContact: '',
};

const defaultSecurityData = {
  twoFactorEnabled: false,
  sessionTimeout: 60,
  loginNotifications: true,
};

const inputClasses =
  'border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 focus:border-sky-500 focus:ring-sky-500/20';
const labelClasses = 'text-slate-700';

function SettingsCard({ icon: Icon, title, description, children, actions }) {
  return (
    <Card
      hover={false}
      className="overflow-hidden border-slate-200 bg-white text-slate-900 shadow-sm"
    >
      <CardHeader className="border-b border-slate-200 pb-5">
        <CardTitle className="flex items-center gap-3 text-base font-semibold text-slate-900">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-sky-600">
            <Icon className="h-4 w-4" />
          </span>
          {title}
        </CardTitle>
        {description ? <p className="text-sm text-slate-600">{description}</p> : null}
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {children}
        {actions ? <div className="border-t border-slate-200 pt-5">{actions}</div> : null}
      </CardContent>
    </Card>
  );
}

function SectionTitle({ children }) {
  return <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">{children}</h3>;
}

function SelectField({ label, value, options, onChange, hint }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2.5 pr-9 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-white text-slate-900">
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      </div>
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

function PropertySelector({ properties, propertyId, onChange, disabled = false }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-slate-700">Property</label>
      <div className="relative">
        <select
          value={propertyId}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled || properties.length === 0}
          className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2.5 pr-9 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {properties.length === 0 ? (
            <option value="">No properties available</option>
          ) : null}
          {properties.map((property) => (
            <option key={property.id} value={property.id} className="bg-white text-slate-900">
              {property.name}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      </div>
    </div>
  );
}

function ToggleField({ id, label, description, checked, onChange }) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 transition-colors hover:bg-slate-50"
    >
      <div>
        <p className="text-sm font-medium text-slate-900">{label}</p>
        {description ? <p className="mt-1 text-xs text-slate-600">{description}</p> : null}
      </div>
      <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="peer sr-only"
        />
        <span className="absolute inset-0 rounded-full bg-slate-300 transition peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-500/25 peer-checked:bg-sky-500" />
        <span className="absolute left-[2px] top-[2px] h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

function FieldError({ message }) {
  if (!message) return null;
  return <p className="text-xs text-rose-600">{message}</p>;
}

function ProfileSettings() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState(defaultProfileData);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      try {
        const response = await apiService.settings.getUserSettings();
        const userData = response.data || {};
        const settings = userData.userSettings || {};

        if (!isMounted) return;

        setProfileData({
          fullName: userData.fullName || '',
          email: userData.email || '',
          phone: userData.phone || '',
          username: userData.username || '',
          theme: settings.theme || 'light',
          language: settings.language || 'en',
          timezone: settings.timezone || 'Asia/Kolkata',
          dateFormat: settings.dateFormat || 'DD/MM/YYYY',
          currency: settings.currency || 'INR',
        });
      } catch {
        if (!isMounted) return;
        setProfileData((previous) => ({
          ...previous,
          fullName: user?.fullName || previous.fullName,
          email: user?.email || previous.email,
          phone: user?.phone || previous.phone,
          username: user?.username || previous.username,
        }));
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const validate = () => {
    const nextErrors = {};

    if (!profileData.fullName.trim()) {
      nextErrors.fullName = 'Full name is required.';
    }

    if (!profileData.email.trim()) {
      nextErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (profileData.phone.trim() && !/^[0-9+\-()\s]{7,20}$/.test(profileData.phone.trim())) {
      nextErrors.phone = 'Enter a valid phone number.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      dispatch(
        addToast({
          title: 'Fix validation errors',
          description: 'Please correct the highlighted fields before saving.',
          variant: 'error',
        })
      );
      return;
    }

    setSaving(true);

    try {
      await apiService.settings.updateUserSettings({
        fullName: profileData.fullName.trim(),
        email: profileData.email.trim(),
        phone: profileData.phone.trim(),
        theme: profileData.theme,
        language: profileData.language,
        timezone: profileData.timezone,
        dateFormat: profileData.dateFormat,
        currency: profileData.currency,
      });

      dispatch(
        addToast({
          title: 'Profile updated',
          description: 'Your account settings were saved successfully.',
          variant: 'success',
        })
      );
    } catch (error) {
      dispatch(
        addToast({
          title: 'Update failed',
          description:
            error?.message || error?.response?.data?.error?.message || 'Unable to save profile settings.',
          variant: 'error',
        })
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsCard
      icon={User}
      title="Profile & Preferences"
      description="Update account identity and personal defaults used across your PG operations."
      actions={
        <div className="flex justify-end">
          <Button onClick={handleSave} loading={saving} disabled={loading}>
            <Save className="h-4 w-4" />
            <span>Save changes</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <SectionTitle>Account</SectionTitle>
        {loading ? <p className="text-sm text-slate-600">Loading profile settings...</p> : null}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Input
              label="Full Name"
              labelClassName={labelClasses}
              className={inputClasses}
              value={profileData.fullName}
              onChange={(event) => setProfileData((previous) => ({ ...previous, fullName: event.target.value }))}
              placeholder="Your full name"
            />
            <FieldError message={errors.fullName} />
          </div>

          <div>
            <Input
              type="email"
              label="Email"
              labelClassName={labelClasses}
              className={inputClasses}
              value={profileData.email}
              onChange={(event) => setProfileData((previous) => ({ ...previous, email: event.target.value }))}
              placeholder="name@example.com"
            />
            <FieldError message={errors.email} />
          </div>

          <div>
            <Input
              label="Phone"
              labelClassName={labelClasses}
              className={inputClasses}
              value={profileData.phone}
              onChange={(event) => setProfileData((previous) => ({ ...previous, phone: event.target.value }))}
              placeholder="+91 98765 43210"
            />
            <FieldError message={errors.phone} />
          </div>

          <Input
            label="Username"
            labelClassName={labelClasses}
            className={cn(inputClasses, 'cursor-not-allowed opacity-80')}
            value={profileData.username}
            disabled
            hint="Username is fixed for this account."
          />
        </div>
      </div>

      <div className="space-y-4">
        <SectionTitle>Preferences</SectionTitle>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SelectField
            label="Theme"
            value={profileData.theme}
            options={THEME_OPTIONS}
            onChange={(value) => setProfileData((previous) => ({ ...previous, theme: value }))}
          />
          <SelectField
            label="Language"
            value={profileData.language}
            options={LANGUAGE_OPTIONS}
            onChange={(value) => setProfileData((previous) => ({ ...previous, language: value }))}
          />
          <SelectField
            label="Timezone"
            value={profileData.timezone}
            options={TIMEZONE_OPTIONS}
            onChange={(value) => setProfileData((previous) => ({ ...previous, timezone: value }))}
          />
          <SelectField
            label="Date Format"
            value={profileData.dateFormat}
            options={DATE_FORMAT_OPTIONS}
            onChange={(value) => setProfileData((previous) => ({ ...previous, dateFormat: value }))}
          />
          <SelectField
            label="Currency"
            value={profileData.currency}
            options={CURRENCY_OPTIONS}
            onChange={(value) => setProfileData((previous) => ({ ...previous, currency: value }))}
          />
        </div>
      </div>
    </SettingsCard>
  );
}

function NotificationSettings() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState(defaultNotificationData);

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      try {
        const response = await apiService.settings.getUserSettings();
        const settings = response.data?.userSettings || {};

        if (!isMounted) return;

        setNotifications({
          emailNotifications: settings.emailNotifications ?? true,
          smsNotifications: settings.smsNotifications ?? false,
          pushNotifications: settings.pushNotifications ?? true,
          rentReminders: settings.rentReminders ?? true,
          maintenanceAlerts: settings.maintenanceAlerts ?? true,
          newTenantAlerts: settings.newTenantAlerts ?? true,
          paymentAlerts: settings.paymentAlerts ?? true,
          systemUpdates: settings.systemUpdates ?? false,
        });
      } catch {
        if (!isMounted) return;
        setNotifications(defaultNotificationData);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);

    try {
      await apiService.settings.updateUserSettings(notifications);
      dispatch(
        addToast({
          title: 'Notifications updated',
          description: 'Your notification preferences were saved.',
          variant: 'success',
        })
      );
    } catch {
      dispatch(
        addToast({
          title: 'Update failed',
          description: 'Unable to save notification settings.',
          variant: 'error',
        })
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsCard
      icon={Bell}
      title="Notification Preferences"
      description="Control which channels and operational events should notify you."
      actions={
        <div className="flex justify-end">
          <Button onClick={handleSave} loading={saving} disabled={loading}>
            <Save className="h-4 w-4" />
            <span>Save notifications</span>
          </Button>
        </div>
      }
    >
      {loading ? <p className="text-sm text-slate-600">Loading notification settings...</p> : null}

      <div className="space-y-4">
        <SectionTitle>Channels</SectionTitle>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <ToggleField
            id="notif-email"
            label="Email notifications"
            description="Send updates to your registered email address."
            checked={notifications.emailNotifications}
            onChange={(value) => setNotifications((previous) => ({ ...previous, emailNotifications: value }))}
          />
          <ToggleField
            id="notif-sms"
            label="SMS notifications"
            description="Send critical updates as SMS."
            checked={notifications.smsNotifications}
            onChange={(value) => setNotifications((previous) => ({ ...previous, smsNotifications: value }))}
          />
          <ToggleField
            id="notif-push"
            label="Push notifications"
            description="Show browser push notifications while using the app."
            checked={notifications.pushNotifications}
            onChange={(value) => setNotifications((previous) => ({ ...previous, pushNotifications: value }))}
          />
        </div>
      </div>

      <div className="space-y-4">
        <SectionTitle>Operational Events</SectionTitle>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <ToggleField
            id="notif-rent"
            label="Rent reminders"
            description="Upcoming due-date reminders and missed payments."
            checked={notifications.rentReminders}
            onChange={(value) => setNotifications((previous) => ({ ...previous, rentReminders: value }))}
          />
          <ToggleField
            id="notif-maintenance"
            label="Maintenance alerts"
            description="New and updated maintenance requests."
            checked={notifications.maintenanceAlerts}
            onChange={(value) => setNotifications((previous) => ({ ...previous, maintenanceAlerts: value }))}
          />
          <ToggleField
            id="notif-tenant"
            label="New tenant alerts"
            description="When tenant records are created in your property."
            checked={notifications.newTenantAlerts}
            onChange={(value) => setNotifications((previous) => ({ ...previous, newTenantAlerts: value }))}
          />
          <ToggleField
            id="notif-payment"
            label="Payment alerts"
            description="Payment received, failed, or pending notifications."
            checked={notifications.paymentAlerts}
            onChange={(value) => setNotifications((previous) => ({ ...previous, paymentAlerts: value }))}
          />
          <ToggleField
            id="notif-system"
            label="System updates"
            description="Product updates and maintenance notices."
            checked={notifications.systemUpdates}
            onChange={(value) => setNotifications((previous) => ({ ...previous, systemUpdates: value }))}
          />
        </div>
      </div>
    </SettingsCard>
  );
}

function TermsAndRulesSettings() {
  const dispatch = useDispatch();
  const { properties, selectedProperty } = useSelector((state) => state.property);

  const [propertyId, setPropertyId] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rules, setRules] = useState(['']);
  const [amenities, setAmenities] = useState([]);
  const [amenityInput, setAmenityInput] = useState('');

  useEffect(() => {
    if (properties.length === 0) {
      setPropertyId('');
      return;
    }

    const preferredPropertyId = selectedProperty?.id || properties[0]?.id;

    if (!propertyId || !properties.some((property) => property.id === propertyId)) {
      setPropertyId(preferredPropertyId || '');
    }
  }, [properties, propertyId, selectedProperty]);

  useEffect(() => {
    if (!propertyId) {
      setRules(['']);
      setAmenities([]);
      return;
    }

    let isMounted = true;

    const loadPropertySettings = async () => {
      setLoading(true);

      try {
        const response = await apiService.settings.getPropertySettings(propertyId);
        const data = response.data || {};

        if (!isMounted) return;

        const incomingRules = Array.isArray(data.rules) ? data.rules : [];
        const incomingAmenities = Array.isArray(data.amenities) ? data.amenities : [];

        setRules(incomingRules.length > 0 ? incomingRules : ['']);
        setAmenities(incomingAmenities);
      } catch {
        if (isMounted) {
          dispatch(
            addToast({
              title: 'Load failed',
              description: 'Unable to fetch rules for this property.',
              variant: 'error',
            })
          );
          setRules(['']);
          setAmenities([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadPropertySettings();

    return () => {
      isMounted = false;
    };
  }, [dispatch, propertyId]);

  const updateRule = (index, value) => {
    setRules((previous) => previous.map((rule, currentIndex) => (currentIndex === index ? value : rule)));
  };

  const addRule = () => {
    setRules((previous) => [...previous, '']);
  };

  const removeRule = (index) => {
    setRules((previous) => {
      const next = previous.filter((_, currentIndex) => currentIndex !== index);
      return next.length > 0 ? next : [''];
    });
  };

  const addAmenity = () => {
    const nextAmenity = amenityInput.trim();

    if (!nextAmenity) return;

    if (amenities.includes(nextAmenity)) {
      setAmenityInput('');
      return;
    }

    setAmenities((previous) => [...previous, nextAmenity]);
    setAmenityInput('');
  };

  const removeAmenity = (targetAmenity) => {
    setAmenities((previous) => previous.filter((amenity) => amenity !== targetAmenity));
  };

  const handleSave = async () => {
    if (!propertyId) {
      dispatch(
        addToast({
          title: 'Property required',
          description: 'Create a property first before saving rules.',
          variant: 'error',
        })
      );
      return;
    }

    const cleanRules = rules.map((rule) => rule.trim()).filter(Boolean);
    const cleanAmenities = [...new Set(amenities.map((amenity) => amenity.trim()).filter(Boolean))];

    if (cleanRules.length === 0) {
      dispatch(
        addToast({
          title: 'Rule required',
          description: 'Add at least one valid rule before saving.',
          variant: 'error',
        })
      );
      return;
    }

    setSaving(true);

    try {
      await apiService.settings.updatePropertyRules(propertyId, {
        rules: cleanRules,
        amenities: cleanAmenities,
      });

      setRules(cleanRules);
      setAmenities(cleanAmenities);

      dispatch(
        addToast({
          title: 'Rules updated',
          description: 'Rules and amenities were saved successfully.',
          variant: 'success',
        })
      );
    } catch {
      dispatch(
        addToast({
          title: 'Save failed',
          description: 'Unable to save property rules right now.',
          variant: 'error',
        })
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsCard
      icon={FileText}
      title="Terms & Rules"
      description="Define enforceable house rules and published amenities for tenant onboarding."
      actions={
        <div className="flex justify-end">
          <Button onClick={handleSave} loading={saving} disabled={loading || properties.length === 0}>
            <Save className="h-4 w-4" />
            <span>Save rules</span>
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <PropertySelector properties={properties} propertyId={propertyId} onChange={setPropertyId} disabled={loading} />
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <p className="font-medium text-slate-900">Tenant onboarding scope</p>
          <p className="mt-1">Rules in this tab appear in tenant registration and agreement review screens.</p>
        </div>
      </div>

      {properties.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          No property found. Create a property to configure rules and amenities.
        </div>
      ) : null}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionTitle>Rules</SectionTitle>
          <Button type="button" variant="outline" size="sm" onClick={addRule} className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50">
            <Plus className="h-3.5 w-3.5" />
            <span>Add rule</span>
          </Button>
        </div>

        {loading ? <p className="text-sm text-slate-600">Loading rules...</p> : null}

        <div className="space-y-3">
          {rules.map((rule, index) => (
            <div key={`rule-${index}`} className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rule {index + 1}</p>
                <button
                  type="button"
                  onClick={() => removeRule(index)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-300/30"
                  aria-label={`Delete rule ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <textarea
                rows={2}
                value={rule}
                onChange={(event) => updateRule(index, event.target.value)}
                placeholder="Example: Rent must be paid by the 5th of every month."
                className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <SectionTitle>Amenities</SectionTitle>
        <div className="flex flex-col gap-3 md:flex-row">
          <Input
            label="Add Amenity"
            labelClassName={labelClasses}
            className={inputClasses}
            value={amenityInput}
            onChange={(event) => setAmenityInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addAmenity();
              }
            }}
            placeholder="WiFi, Laundry, Security..."
          />
          <div className="md:self-end">
            <Button
              type="button"
              variant="outline"
              onClick={addAmenity}
              className="w-full border-slate-300 bg-white text-slate-700 hover:bg-slate-50 md:w-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Add</span>
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {amenities.length === 0 ? <p className="text-sm text-slate-500">No amenities listed yet.</p> : null}
          {amenities.map((amenity) => (
            <button
              key={amenity}
              type="button"
              onClick={() => removeAmenity(amenity)}
              className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 transition hover:bg-sky-100"
              aria-label={`Remove amenity ${amenity}`}
            >
              {amenity}
              <Trash2 className="h-3 w-3" />
            </button>
          ))}
        </div>
      </div>
    </SettingsCard>
  );
}

function SystemSettings() {
  const dispatch = useDispatch();
  const { properties, selectedProperty } = useSelector((state) => state.property);

  const [propertyId, setPropertyId] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [systemData, setSystemData] = useState(defaultSystemData);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (properties.length === 0) {
      setPropertyId('');
      return;
    }

    const preferredPropertyId = selectedProperty?.id || properties[0]?.id;

    if (!propertyId || !properties.some((property) => property.id === propertyId)) {
      setPropertyId(preferredPropertyId || '');
    }
  }, [properties, propertyId, selectedProperty]);

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      setLoading(true);

      try {
        const userResponse = await apiService.settings.getUserSettings();
        const userSettings = userResponse.data?.userSettings || {};

        let propertySettings = null;

        if (propertyId) {
          try {
            const propertyResponse = await apiService.settings.getPropertySettings(propertyId);
            propertySettings = propertyResponse.data || null;
          } catch {
            propertySettings = null;
          }
        }

        if (!isMounted) return;

        const paymentSettings = propertySettings?.paymentSettings || {};
        const contactInfo = propertySettings?.contactInfo || {};

        setSystemData({
          theme: userSettings.theme || 'light',
          language: userSettings.language || 'en',
          timezone: userSettings.timezone || 'Asia/Kolkata',
          dateFormat: userSettings.dateFormat || 'DD/MM/YYYY',
          currency: userSettings.currency || 'INR',
          rentDueDay: Number(paymentSettings.rentDueDay ?? 5),
          lateFeeDays: Number(paymentSettings.lateFeeDays ?? 3),
          lateFeeAmount: Number(paymentSettings.lateFeeAmount ?? 500),
          acceptedMethods:
            Array.isArray(paymentSettings.acceptedMethods) && paymentSettings.acceptedMethods.length > 0
              ? paymentSettings.acceptedMethods
              : ['Cash', 'UPI', 'Bank Transfer'],
          contactPhone: contactInfo.phone || '',
          contactEmail: contactInfo.email || '',
          emergencyContact: contactInfo.emergencyContact || '',
        });
      } catch {
        if (isMounted) {
          dispatch(
            addToast({
              title: 'Load failed',
              description: 'Unable to fetch system settings.',
              variant: 'error',
            })
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, [dispatch, propertyId]);

  const validate = () => {
    const nextErrors = {};

    if (Number(systemData.rentDueDay) < 1 || Number(systemData.rentDueDay) > 31) {
      nextErrors.rentDueDay = 'Rent due day must be between 1 and 31.';
    }

    if (Number(systemData.lateFeeDays) < 0 || Number(systemData.lateFeeDays) > 30) {
      nextErrors.lateFeeDays = 'Grace period must be between 0 and 30 days.';
    }

    if (Number(systemData.lateFeeAmount) < 0) {
      nextErrors.lateFeeAmount = 'Late fee amount cannot be negative.';
    }

    if (systemData.contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(systemData.contactEmail.trim())) {
      nextErrors.contactEmail = 'Enter a valid contact email.';
    }

    if (systemData.acceptedMethods.length === 0) {
      nextErrors.acceptedMethods = 'Select at least one accepted payment method.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const togglePaymentMethod = (method) => {
    setSystemData((previous) => {
      const hasMethod = previous.acceptedMethods.includes(method);
      return {
        ...previous,
        acceptedMethods: hasMethod
          ? previous.acceptedMethods.filter((item) => item !== method)
          : [...previous.acceptedMethods, method],
      };
    });
  };

  const handleSave = async () => {
    if (!validate()) {
      dispatch(
        addToast({
          title: 'Fix validation errors',
          description: 'Please correct highlighted system fields before saving.',
          variant: 'error',
        })
      );
      return;
    }

    setSaving(true);

    try {
      await apiService.settings.updateUserSettings({
        theme: systemData.theme,
        language: systemData.language,
        timezone: systemData.timezone,
        dateFormat: systemData.dateFormat,
        currency: systemData.currency,
      });

      if (propertyId) {
        await apiService.settings.updatePropertySettings(propertyId, {
          paymentSettings: {
            rentDueDay: Number(systemData.rentDueDay),
            lateFeeDays: Number(systemData.lateFeeDays),
            lateFeeAmount: Number(systemData.lateFeeAmount),
            acceptedMethods: systemData.acceptedMethods,
          },
          contactInfo: {
            phone: systemData.contactPhone.trim(),
            email: systemData.contactEmail.trim(),
            emergencyContact: systemData.emergencyContact.trim(),
          },
        });
      }

      dispatch(
        addToast({
          title: 'System settings updated',
          description: 'Operational configuration saved successfully.',
          variant: 'success',
        })
      );
    } catch {
      dispatch(
        addToast({
          title: 'Save failed',
          description: 'Unable to save system settings.',
          variant: 'error',
        })
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsCard
      icon={Settings}
      title="System Configuration"
      description="Production-facing defaults for locale, payment policy, and property contact details."
      actions={
        <div className="flex justify-end">
          <Button onClick={handleSave} loading={saving} disabled={loading}>
            <Save className="h-4 w-4" />
            <span>Save configuration</span>
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SelectField
          label="Theme"
          value={systemData.theme}
          options={THEME_OPTIONS}
          onChange={(value) => setSystemData((previous) => ({ ...previous, theme: value }))}
        />
        <SelectField
          label="Language"
          value={systemData.language}
          options={LANGUAGE_OPTIONS}
          onChange={(value) => setSystemData((previous) => ({ ...previous, language: value }))}
        />
        <SelectField
          label="Timezone"
          value={systemData.timezone}
          options={TIMEZONE_OPTIONS}
          onChange={(value) => setSystemData((previous) => ({ ...previous, timezone: value }))}
        />
        <SelectField
          label="Date Format"
          value={systemData.dateFormat}
          options={DATE_FORMAT_OPTIONS}
          onChange={(value) => setSystemData((previous) => ({ ...previous, dateFormat: value }))}
        />
        <SelectField
          label="Currency"
          value={systemData.currency}
          options={CURRENCY_OPTIONS}
          onChange={(value) => setSystemData((previous) => ({ ...previous, currency: value }))}
        />
      </div>

      <div className="space-y-4">
        <SectionTitle>Property Ops</SectionTitle>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <PropertySelector properties={properties} propertyId={propertyId} onChange={setPropertyId} disabled={loading} />
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <p className="font-medium text-slate-900">Applies to selected property</p>
            <p className="mt-1">Rent and contact values below are scoped to this property only.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <Input
              label="Rent Due Day"
              labelClassName={labelClasses}
              className={inputClasses}
              type="number"
              min="1"
              max="31"
              value={systemData.rentDueDay}
              onChange={(event) =>
                setSystemData((previous) => ({ ...previous, rentDueDay: Number(event.target.value || 0) }))
              }
            />
            <FieldError message={errors.rentDueDay} />
          </div>

          <div>
            <Input
              label="Late Fee Grace (Days)"
              labelClassName={labelClasses}
              className={inputClasses}
              type="number"
              min="0"
              max="30"
              value={systemData.lateFeeDays}
              onChange={(event) =>
                setSystemData((previous) => ({ ...previous, lateFeeDays: Number(event.target.value || 0) }))
              }
            />
            <FieldError message={errors.lateFeeDays} />
          </div>

          <div>
            <Input
              label="Late Fee Amount"
              labelClassName={labelClasses}
              className={inputClasses}
              type="number"
              min="0"
              value={systemData.lateFeeAmount}
              onChange={(event) =>
                setSystemData((previous) => ({ ...previous, lateFeeAmount: Number(event.target.value || 0) }))
              }
            />
            <FieldError message={errors.lateFeeAmount} />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <SectionTitle>Accepted Payment Methods</SectionTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {PAYMENT_METHOD_OPTIONS.map((method) => {
            const selected = systemData.acceptedMethods.includes(method);

            return (
              <button
                key={method}
                type="button"
                onClick={() => togglePaymentMethod(method)}
                className={cn(
                  'rounded-xl border px-3 py-2 text-left text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-sky-500/25',
                  selected
                    ? 'border-sky-300 bg-sky-50 text-sky-700'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                )}
              >
                {method}
              </button>
            );
          })}
        </div>
        <FieldError message={errors.acceptedMethods} />
      </div>

      <div className="space-y-4">
        <SectionTitle>Contact Information</SectionTitle>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Input
            label="Property Contact Phone"
            labelClassName={labelClasses}
            className={inputClasses}
            value={systemData.contactPhone}
            onChange={(event) => setSystemData((previous) => ({ ...previous, contactPhone: event.target.value }))}
            placeholder="+91 98765 43210"
          />

          <div>
            <Input
              type="email"
              label="Property Contact Email"
              labelClassName={labelClasses}
              className={inputClasses}
              value={systemData.contactEmail}
              onChange={(event) => setSystemData((previous) => ({ ...previous, contactEmail: event.target.value }))}
              placeholder="property@example.com"
            />
            <FieldError message={errors.contactEmail} />
          </div>

          <Input
            label="Emergency Contact"
            labelClassName={labelClasses}
            className={inputClasses}
            value={systemData.emergencyContact}
            onChange={(event) => setSystemData((previous) => ({ ...previous, emergencyContact: event.target.value }))}
            placeholder="Caretaker / alternate number"
          />
        </div>
      </div>
    </SettingsCard>
  );
}

function SecuritySettings() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [securityData, setSecurityData] = useState(defaultSecurityData);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      try {
        const response = await apiService.settings.getUserSettings();
        const settings = response.data?.userSettings || {};

        if (!isMounted) return;

        setSecurityData({
          twoFactorEnabled: settings.twoFactorEnabled ?? false,
          sessionTimeout: Number(settings.sessionTimeout ?? 60),
          loginNotifications: settings.loginNotifications ?? true,
        });
      } catch {
        if (isMounted) {
          setSecurityData(defaultSecurityData);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const handlePasswordChange = async () => {
    const nextErrors = {};

    if (!passwordData.currentPassword) {
      nextErrors.currentPassword = 'Current password is required.';
    }

    if (!passwordData.newPassword) {
      nextErrors.newPassword = 'New password is required.';
    } else if (passwordData.newPassword.length < 8) {
      nextErrors.newPassword = 'Use at least 8 characters for stronger security.';
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      nextErrors.confirmPassword = 'New password and confirmation do not match.';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      dispatch(
        addToast({
          title: 'Password validation failed',
          description: 'Please fix the highlighted password fields.',
          variant: 'error',
        })
      );
      return;
    }

    setPasswordSaving(true);

    try {
      await apiService.auth.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setErrors((previous) => ({
        ...previous,
        currentPassword: undefined,
        newPassword: undefined,
        confirmPassword: undefined,
      }));

      dispatch(
        addToast({
          title: 'Password updated',
          description: 'Your password has been changed successfully.',
          variant: 'success',
        })
      );
    } catch (error) {
      dispatch(
        addToast({
          title: 'Password change failed',
          description: error?.message || 'Unable to update password.',
          variant: 'error',
        })
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleSaveSecurity = async () => {
    if (Number(securityData.sessionTimeout) < 15 || Number(securityData.sessionTimeout) > 480) {
      setErrors((previous) => ({
        ...previous,
        sessionTimeout: 'Session timeout must be between 15 and 480 minutes.',
      }));
      dispatch(
        addToast({
          title: 'Invalid timeout',
          description: 'Session timeout must be between 15 and 480 minutes.',
          variant: 'error',
        })
      );
      return;
    }

    setErrors((previous) => ({ ...previous, sessionTimeout: undefined }));
    setSaving(true);

    try {
      await apiService.settings.updateUserSettings({
        twoFactorEnabled: securityData.twoFactorEnabled,
        sessionTimeout: Number(securityData.sessionTimeout),
        loginNotifications: securityData.loginNotifications,
      });

      dispatch(
        addToast({
          title: 'Security settings updated',
          description: 'Security preferences saved successfully.',
          variant: 'success',
        })
      );
    } catch {
      dispatch(
        addToast({
          title: 'Save failed',
          description: 'Unable to save security preferences.',
          variant: 'error',
        })
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsCard
      icon={Shield}
      title="Security"
      description="Protect account access and define your active session policy."
      actions={
        <div className="flex justify-end">
          <Button onClick={handleSaveSecurity} loading={saving} disabled={loading}>
            <Save className="h-4 w-4" />
            <span>Save security settings</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <SectionTitle>Change Password</SectionTitle>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Input
              type="password"
              label="Current Password"
              labelClassName={labelClasses}
              className={inputClasses}
              value={passwordData.currentPassword}
              onChange={(event) =>
                setPasswordData((previous) => ({ ...previous, currentPassword: event.target.value }))
              }
              placeholder="Current password"
            />
            <FieldError message={errors.currentPassword} />
          </div>

          <div>
            <Input
              type="password"
              label="New Password"
              labelClassName={labelClasses}
              className={inputClasses}
              value={passwordData.newPassword}
              onChange={(event) => setPasswordData((previous) => ({ ...previous, newPassword: event.target.value }))}
              placeholder="Minimum 8 characters"
            />
            <FieldError message={errors.newPassword} />
          </div>

          <div>
            <Input
              type="password"
              label="Confirm New Password"
              labelClassName={labelClasses}
              className={inputClasses}
              value={passwordData.confirmPassword}
              onChange={(event) =>
                setPasswordData((previous) => ({ ...previous, confirmPassword: event.target.value }))
              }
              placeholder="Re-enter new password"
            />
            <FieldError message={errors.confirmPassword} />
          </div>
        </div>

        <div>
          <Button onClick={handlePasswordChange} loading={passwordSaving} variant="outline" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50">
            <Save className="h-4 w-4" />
            <span>Change password</span>
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <SectionTitle>Access Controls</SectionTitle>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <ToggleField
            id="security-2fa"
            label="Two-factor authentication"
            description="Require a second verification step during login."
            checked={securityData.twoFactorEnabled}
            onChange={(value) => setSecurityData((previous) => ({ ...previous, twoFactorEnabled: value }))}
          />

          <ToggleField
            id="security-login-notifications"
            label="Login notifications"
            description="Notify on new login or unusual sign-in attempts."
            checked={securityData.loginNotifications}
            onChange={(value) => setSecurityData((previous) => ({ ...previous, loginNotifications: value }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <SectionTitle>Session Policy</SectionTitle>
        <div className="max-w-sm">
          <Input
            type="number"
            min="15"
            max="480"
            label="Session Timeout (minutes)"
            labelClassName={labelClasses}
            className={inputClasses}
            value={securityData.sessionTimeout}
            onChange={(event) =>
              setSecurityData((previous) => ({ ...previous, sessionTimeout: Number(event.target.value || 0) }))
            }
          />
          <FieldError message={errors.sessionTimeout} />
        </div>
      </div>
    </SettingsCard>
  );
}

export default function SettingsPage() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchProperties());
    }
  }, [dispatch, isAuthenticated]);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'rules', label: 'Terms & Rules', icon: FileText },
    { id: 'system', label: 'System', icon: Globe },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'rules':
        return <TermsAndRulesSettings />;
      case 'system':
        return <SystemSettings />;
      case 'security':
        return <SecuritySettings />;
      default:
        return <ProfileSettings />;
    }
  };

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Settings</h1>
          <p className="max-w-3xl text-sm text-slate-600 sm:text-base">
            Manage your PG system preferences and production configuration in one place.
          </p>
        </header>

        <div className="overflow-x-auto pb-1">
          <nav className="flex min-w-max items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-sky-500/25',
                    isActive
                      ? 'border-sky-300 bg-sky-50 text-sky-700'
                      : 'border-transparent bg-transparent text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div>{renderTabContent()}</div>
      </div>
    </div>
  );
}
