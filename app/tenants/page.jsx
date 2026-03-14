'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { fetchTenants, createTenant, updateTenant, deleteTenant, vacateTenant } from '@/store/slices/tenantsSlice';
import { fetchFloors } from '@/store/slices/floorsSlice';
import { fetchRooms } from '@/store/slices/roomsSlice';
import { fetchBeds } from '@/store/slices/bedsSlice';
import { fetchProperties } from '@/store/slices/propertySlice';
import { addToast } from '@/store/slices/uiSlice';
import apiService from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dropdown } from '@/components/ui/Dropdown';
import { Modal } from '@/components/ui/Modal';
import { TenantTable } from '@/components/tables/TenantTable';
import {
  Users,
  Plus,
  Eye,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  List,
  Grid3X3,
  User,
  Home,
  Briefcase,
  UserMinus,
  Search
} from 'lucide-react';
import { Drawer } from '@/components/ui';

const DEFAULT_TENANT_FORM = {
  fullName: '',
  email: '',
  phone: '',
  alternatePhone: '',
  address: '',
  idProofType: 'AADHAR',
  idProofNumber: '',
  occupation: '',
  company: '',
  emergencyContact: '',
  emergencyContactPhone: '',
  floorId: '',
  roomId: '',
  bedId: '',
  securityDeposit: '',
  advanceRent: '',
  paymentMode: 'CASH',
  termsAccepted: false
};

const PHONE_REGEX = /^(?:\+91[\s-]?)?[6-9]\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMERGENCY_PHONE_EXTRACT_REGEX = /(?:\+91[\s-]?)?[6-9]\d{9}/;

const parseEmergencyContact = (value = '') => {
  const normalizedValue = String(value || '').trim();

  if (!normalizedValue) {
    return {
      emergencyContact: '',
      emergencyContactPhone: '',
    };
  }

  const phoneMatch = normalizedValue.match(EMERGENCY_PHONE_EXTRACT_REGEX);

  if (!phoneMatch) {
    return {
      emergencyContact: normalizedValue,
      emergencyContactPhone: '',
    };
  }

  const emergencyContactPhone = phoneMatch[0].trim();
  const emergencyContact = normalizedValue
    .replace(phoneMatch[0], '')
    .replace(/^[\s,;:()/-]+|[\s,;:()/-]+$/g, '')
    .trim();

  return {
    emergencyContact,
    emergencyContactPhone,
  };
};

const formatEmergencyContact = ({ emergencyContact, emergencyContactPhone }) => {
  const name = String(emergencyContact || '').trim();
  const phone = String(emergencyContactPhone || '').trim();

  if (name && phone) {
    return `${name} - ${phone}`;
  }

  return name || phone || '';
};

const METRIC_CARD_STYLES = {
  blue: 'border-sky-200/80 bg-[linear-gradient(180deg,rgba(240,249,255,0.96),rgba(255,255,255,0.92))] text-sky-700',
  emerald: 'border-emerald-200/80 bg-[linear-gradient(180deg,rgba(236,253,245,0.96),rgba(255,255,255,0.92))] text-emerald-700',
  amber: 'border-amber-200/80 bg-[linear-gradient(180deg,rgba(255,251,235,0.96),rgba(255,255,255,0.92))] text-amber-700',
  slate: 'border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.96),rgba(255,255,255,0.92))] text-slate-700',
};

function TenantMetricCard({ icon: Icon, label, value, helper, tone = 'blue', active = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-[1.5rem] border px-4 py-3.5 text-left shadow-[0_12px_30px_rgba(15,23,42,0.04)] transition-all duration-200 ${METRIC_CARD_STYLES[tone]} ${
        active ? 'ring-2 ring-slate-900/10' : 'hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
          <p className="mt-1.5 text-[1.8rem] font-semibold tracking-tight text-slate-950">{value}</p>
          <p className="mt-1.5 text-xs text-slate-500">{helper}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-[1.1rem] border border-white/70 bg-white/80">
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
    </button>
  );
}

function TenantFormSection({ icon: Icon, title, description, children, tone = 'slate' }) {
  const toneClasses = {
    slate: 'border-slate-200/80 bg-white/90',
    sky: 'border-sky-200/80 bg-sky-50/70',
    emerald: 'border-emerald-200/80 bg-emerald-50/70',
    amber: 'border-amber-200/80 bg-amber-50/70',
  };
  const hasDescription = Boolean(description);

  return (
    <section className={`overflow-visible rounded-[1.5rem] border p-4 shadow-[0_12px_32px_rgba(15,23,42,0.04)] sm:p-5 ${toneClasses[tone]}`}>
      <div className={`flex gap-3 ${hasDescription ? 'mb-4 items-start' : 'mb-3 items-center'}`}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/70 bg-white/80 text-slate-700">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div className={hasDescription ? '' : 'flex min-h-10 items-center'}>
          <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
          {description ? <p className="mt-1 text-xs text-slate-500">{description}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function PremiumTextarea({ label, value, onChange, placeholder, rows = 3, error, hint, required = false }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </label>
      <textarea
        value={value}
        onChange={onChange}
        rows={rows}
        className={`w-full rounded-xl border bg-white px-4 py-3 text-sm shadow-elegant transition-all duration-200 focus:outline-none ${
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/15'
            : 'border-gray-200 hover:border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15'
        }`}
        placeholder={placeholder}
      />
      {error ? <p className="text-xs text-red-500">{error}</p> : hint ? <p className="text-xs text-gray-500">{hint}</p> : null}
    </div>
  );
}

function TenantMiniStat({ label, value, helper }) {
  return (
    <div className="rounded-[1.2rem] border border-slate-200/80 bg-white/88 px-4 py-3 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1.5 text-sm font-semibold text-slate-950">{value}</p>
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </div>
  );
}

// Tenant Form Modal with Terms and Conditions
function TenantFormModal({ isOpen, onClose, tenant = null, onSubmit, availableBeds = [] }) {
  const dispatch = useDispatch();
  const { floors } = useSelector((state) => state.floors);
  const { rooms } = useSelector((state) => state.rooms);
  const { selectedProperty } = useSelector((state) => state.property);
  
  const [formData, setFormData] = useState(DEFAULT_TENANT_FORM);
  const [termsAndConditions, setTermsAndConditions] = useState([]);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Fetch terms and conditions when modal opens
  useEffect(() => {
    if (isOpen && selectedProperty?.id) {
      fetchTermsAndConditions();
    }
  }, [isOpen, selectedProperty]);

  const fetchTermsAndConditions = async () => {
    try {
      const response = await apiService.settings.getPropertySettings(selectedProperty.id);
      const settings = response.data;
      setTermsAndConditions(settings.rules || []);
    } catch (error) {
      console.error('Error fetching terms and conditions:', error);
      setTermsAndConditions([]);
    }
  };

  // Update form data when tenant prop changes (for editing)
  useEffect(() => {
    if (tenant) {
      const parsedEmergencyContact = parseEmergencyContact(tenant.emergencyContact);

      setFormData({
        ...DEFAULT_TENANT_FORM,
        fullName: tenant.fullName || '',
        email: tenant.email || '',
        phone: tenant.phone || '',
        alternatePhone: tenant.alternatePhone || '',
        address: tenant.address || '',
        idProofType: tenant.idProofType || 'AADHAR',
        idProofNumber: tenant.idProofNumber || '',
        occupation: tenant.occupation || '',
        company: tenant.company || '',
        emergencyContact: parsedEmergencyContact.emergencyContact,
        emergencyContactPhone: parsedEmergencyContact.emergencyContactPhone,
        floorId: tenant.bed?.room?.floorId || '',
        roomId: tenant.bed?.roomId || '',
        bedId: tenant.bed?.id || '',
        securityDeposit: tenant.securityDeposit || '',
        advanceRent: tenant.advanceRent || '',
        paymentMode: tenant.paymentMode || 'CASH',
        termsAccepted: true // Assume existing tenants have accepted terms
      });
    } else {
      setFormData(DEFAULT_TENANT_FORM);
    }
    setErrors({});
  }, [tenant]);

  // Auto-populate financial data when bed is selected
  useEffect(() => {
    if (formData.bedId && availableBeds.length > 0) {
      const selectedBed = availableBeds.find(bed => bed.id === formData.bedId);
      if (selectedBed) {
        // Auto-populate rent-based deposits
        const suggestedSecurityDeposit = selectedBed.rent * 2; // 2 months rent
        const suggestedAdvanceRent = selectedBed.rent; // 1 month advance
        
        setFormData(prev => ({
          ...prev,
          securityDeposit: prev.securityDeposit || suggestedSecurityDeposit.toString(),
          advanceRent: prev.advanceRent || suggestedAdvanceRent.toString()
        }));
      }
    }
  }, [formData.bedId, availableBeds]);

  // Reset room and bed when floor changes
  useEffect(() => {
    if (formData.floorId && !tenant) {
      setFormData(prev => ({
        ...prev,
        roomId: '',
        bedId: '',
        securityDeposit: '',
        advanceRent: ''
      }));
    }
  }, [formData.floorId, tenant]);

  // Reset bed when room changes
  useEffect(() => {
    if (formData.roomId && !tenant) {
      setFormData(prev => ({
        ...prev,
        bedId: '',
        securityDeposit: '',
        advanceRent: ''
      }));
    }
  }, [formData.roomId, tenant]);

  // Clear ID proof number when type changes
  useEffect(() => {
    if (!tenant) {
      setFormData(prev => ({
        ...prev,
        idProofNumber: ''
      }));
    }
  }, [formData.idProofType, tenant]);

  // Get floors with availability info
  const floorOptions = floors.map(floor => {
    const floorRooms = rooms.filter(room => room.floorId === floor.id);
    // Fix: Check if beds are actually available (not occupied by tenants)
    const floorBeds = availableBeds.filter(bed => {
      return bed.room?.floorId === floor.id || 
             (bed.roomId && rooms.find(r => r.id === bed.roomId && r.floorId === floor.id));
    });
    const hasAvailableBeds = floorBeds.length > 0;
    
    return {
      value: floor.id,
      label: `${floor.name} ${hasAvailableBeds ? `(${floorBeds.length} beds available)` : '(Full)'}`,
      disabled: !hasAvailableBeds
    };
  });

  // Get rooms for selected floor
  const roomOptions = formData.floorId ? 
    rooms.filter(room => room.floorId === formData.floorId).map(room => {
      // Fix: Check if beds are actually available in this room
      const roomBeds = availableBeds.filter(bed => bed.roomId === room.id);
      const hasAvailableBeds = roomBeds.length > 0;
      
      return {
        value: room.id,
        label: `Room ${room.roomNumber} - ${room.type} ${hasAvailableBeds ? `(${roomBeds.length} beds available)` : '(Full)'}`,
        disabled: !hasAvailableBeds
      };
    }) : [];

  // Get beds for selected room
  const bedOptions = formData.roomId ? 
    availableBeds.filter(bed => bed.roomId === formData.roomId).map(bed => ({
      value: bed.id,
      label: `Bed ${bed.bedNumber} - ${bed.bedType} (₹${bed.rent}/month)`
    })) : [];

  // When editing, include the tenant's current bed in options if it's not already there
  const allBedOptions = useMemo(() => {
    if (tenant && tenant.bed && formData.roomId === tenant.bed.roomId) {
      const currentBedOption = {
        value: tenant.bed.id,
        label: `Bed ${tenant.bed.bedNumber} - ${tenant.bed.bedType} (₹${tenant.bed.rent}/month) - Current`
      };
      
      // Check if current bed is already in options
      const isCurrentBedInOptions = bedOptions.some(option => option.value === tenant.bed.id);
      
      if (!isCurrentBedInOptions) {
        return [currentBedOption, ...bedOptions];
      }
    }
    return bedOptions;
  }, [bedOptions, tenant, formData.roomId]);

  // Get selected bed details - include tenant's current bed when editing
  const selectedBed = useMemo(() => {
    if (tenant && tenant.bed && formData.bedId === tenant.bed.id) {
      return tenant.bed;
    }
    return availableBeds.find(bed => bed.id === formData.bedId);
  }, [formData.bedId, availableBeds, tenant]);

  // ID Proof validation configurations
  const idProofConfigs = {
    AADHAR: {
      label: 'Aadhar Card',
      maxLength: 12,
      minLength: 12,
      pattern: /^\d{12}$/,
      placeholder: '123456789012',
      helpText: '12-digit Aadhar number'
    },
    PAN: {
      label: 'PAN Card',
      maxLength: 10,
      minLength: 10,
      pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
      placeholder: 'ABCDE1234F',
      helpText: '10-character PAN (ABCDE1234F)'
    },
    PASSPORT: {
      label: 'Passport',
      maxLength: 8,
      minLength: 8,
      pattern: /^[A-Z]{1}[0-9]{7}$/,
      placeholder: 'A1234567',
      helpText: '8-character Passport (A1234567)'
    },
    DRIVING_LICENSE: {
      label: 'Driving License',
      maxLength: 16,
      minLength: 10,
      pattern: /^[A-Z]{2}[0-9]{2}[0-9]{4}[0-9]{7}$/,
      placeholder: 'DL1420110012345',
      helpText: '15-character DL number'
    },
    VOTER_ID: {
      label: 'Voter ID',
      maxLength: 10,
      minLength: 10,
      pattern: /^[A-Z]{3}[0-9]{7}$/,
      placeholder: 'ABC1234567',
      helpText: '10-character Voter ID (ABC1234567)'
    }
  };

  const currentIdProofConfig = idProofConfigs[formData.idProofType] || idProofConfigs.AADHAR;

  const idProofOptions = [
    { value: 'AADHAR', label: 'Aadhar Card' },
    { value: 'PAN', label: 'PAN Card' },
    { value: 'PASSPORT', label: 'Passport' },
    { value: 'DRIVING_LICENSE', label: 'Driving License' },
    { value: 'VOTER_ID', label: 'Voter ID' }
  ];

  const paymentModeOptions = [
    { value: 'CASH', label: 'Cash Payment' },
    { value: 'UPI', label: 'UPI/Digital Payment' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
    { value: 'CHEQUE', label: 'Cheque' },
    { value: 'CARD', label: 'Debit/Credit Card' },
    { value: 'NET_BANKING', label: 'Net Banking' }
  ];

  // Validate ID proof number
  const validateIdProof = (value) => {
    if (!value) return true; // Allow empty for optional validation
    return currentIdProofConfig.pattern.test(value.toUpperCase());
  };

  // Format ID proof number as user types
  const handleIdProofChange = (e) => {
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Apply specific formatting based on ID type
    if (formData.idProofType === 'AADHAR') {
      value = value.replace(/\D/g, ''); // Only digits
    } else if (formData.idProofType === 'PAN') {
      // Format: ABCDE1234F
      if (value.length > 5) {
        value = value.slice(0, 5) + value.slice(5).replace(/[^0-9]/g, '');
      }
      if (value.length > 9) {
        value = value.slice(0, 9) + value.slice(9).replace(/[^A-Z]/g, '');
      }
    } else if (formData.idProofType === 'PASSPORT') {
      // Format: A1234567
      if (value.length > 1) {
        value = value.slice(0, 1) + value.slice(1).replace(/[^0-9]/g, '');
      }
    }
    
    // Apply max length
    value = value.slice(0, currentIdProofConfig.maxLength);
    
    setFormData(prev => ({ ...prev, idProofNumber: value }));
    setErrors(prev => ({ ...prev, idProofNumber: undefined }));
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.fullName.trim()) {
      nextErrors.fullName = 'Tenant name is required.';
    }

    if (!formData.phone.trim()) {
      nextErrors.phone = 'Primary phone number is required.';
    } else if (!PHONE_REGEX.test(formData.phone.replace(/\s+/g, ''))) {
      nextErrors.phone = 'Enter a valid Indian mobile number.';
    }

    if (formData.alternatePhone && !PHONE_REGEX.test(formData.alternatePhone.replace(/\s+/g, ''))) {
      nextErrors.alternatePhone = 'Enter a valid alternate mobile number.';
    }

    if (formData.emergencyContactPhone && !PHONE_REGEX.test(formData.emergencyContactPhone.replace(/\s+/g, ''))) {
      nextErrors.emergencyContactPhone = 'Enter a valid emergency mobile number.';
    }

    if (formData.email && !EMAIL_REGEX.test(formData.email)) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!formData.address.trim()) {
      nextErrors.address = 'Address is required.';
    }

    if (!formData.idProofNumber.trim()) {
      nextErrors.idProofNumber = `${currentIdProofConfig.label} number is required.`;
    } else if (!validateIdProof(formData.idProofNumber)) {
      nextErrors.idProofNumber = `Use this format: ${currentIdProofConfig.helpText}`;
    }

    if (!formData.floorId) {
      nextErrors.floorId = 'Select a floor.';
    }

    if (!formData.roomId) {
      nextErrors.roomId = 'Select a room.';
    }

    if (!formData.bedId) {
      nextErrors.bedId = 'Select a bed.';
    }

    if (!formData.securityDeposit) {
      nextErrors.securityDeposit = 'Security deposit is required.';
    }

    if (!formData.advanceRent) {
      nextErrors.advanceRent = 'Advance rent is required.';
    }

    if (formData.securityDeposit && Number(formData.securityDeposit) < 0) {
      nextErrors.securityDeposit = 'Security deposit cannot be negative.';
    }

    if (formData.advanceRent && Number(formData.advanceRent) < 0) {
      nextErrors.advanceRent = 'Advance rent cannot be negative.';
    }

    if (!formData.termsAccepted) {
      nextErrors.termsAccepted = 'Confirmation is required before saving the tenant.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      dispatch(addToast({
        title: 'Complete the required fields',
        description: 'Review the highlighted tenant details before saving.',
        variant: 'warning'
      }));
      return;
    }

    const tenantData = {
      ...formData,
      emergencyContact: formatEmergencyContact(formData),
      securityDeposit: formData.securityDeposit ? parseFloat(formData.securityDeposit) : 0,
      advanceRent: formData.advanceRent ? parseFloat(formData.advanceRent) : 0,
      joiningDate: new Date().toISOString(),
      termsAcceptedAt: new Date().toISOString()
    };

    delete tenantData.emergencyContactPhone;

    setLoading(true);
    
    try {
      await onSubmit(tenantData);
      onClose();
    } catch (error) {
      console.error('Error submitting tenant:', error);
      dispatch(addToast({
        title: tenant ? 'Unable to update tenant' : 'Unable to add tenant',
        description: error || 'Please review the tenant details and try again.',
        variant: 'error'
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={tenant ? 'Edit tenant' : 'Add tenant'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="max-h-[72vh] space-y-5 overflow-y-auto pr-1">
            <TenantFormSection
              icon={User}
              title="Resident details"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  premium
                  label="Full name"
                  value={formData.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  placeholder="Enter full name"
                  required
                  error={errors.fullName}
                />
                <Input
                  premium
                  label="Email address"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="name@example.com"
                  error={errors.email}
                />
                <Input
                  premium
                  label="Primary phone"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value.replace(/[^\d+\s-]/g, ''))}
                  placeholder="9876543210"
                  required
                  error={errors.phone}
                />
                <Input
                  premium
                  label="Alternate phone"
                  value={formData.alternatePhone}
                  onChange={(e) => updateField('alternatePhone', e.target.value.replace(/[^\d+\s-]/g, ''))}
                  placeholder="Optional backup contact"
                  error={errors.alternatePhone}
                />
              </div>
            </TenantFormSection>

            <TenantFormSection
              icon={MapPin}
              title="Address and identity"
            >
              <div className="space-y-4">
                <PremiumTextarea
                  label="Complete address"
                  value={formData.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder="Enter the tenant's permanent address"
                  required
                  error={errors.address}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <Dropdown
                    premium
                    label="ID proof type"
                    options={idProofOptions}
                    value={formData.idProofType}
                    onChange={(value) => updateField('idProofType', value)}
                    error={errors.idProofType}
                  />
                  <Input
                    premium
                    label="ID proof number"
                    value={formData.idProofNumber}
                    onChange={handleIdProofChange}
                    placeholder={currentIdProofConfig.placeholder}
                    required
                    maxLength={currentIdProofConfig.maxLength}
                    error={errors.idProofNumber}
                    hint={errors.idProofNumber ? undefined : currentIdProofConfig.helpText}
                    success={formData.idProofNumber && validateIdProof(formData.idProofNumber) ? `${currentIdProofConfig.label} format looks valid.` : undefined}
                  />
                </div>
              </div>
            </TenantFormSection>

            <TenantFormSection
              icon={Briefcase}
              title="Work and emergency details"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  premium
                  label="Occupation"
                  value={formData.occupation}
                  onChange={(e) => updateField('occupation', e.target.value)}
                  placeholder="Software engineer"
                />
                <Input
                  premium
                  label="Company"
                  value={formData.company}
                  onChange={(e) => updateField('company', e.target.value)}
                  placeholder="Company or employer"
                />
              </div>
              <div className="mt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    premium
                    label="Emergency contact name"
                    value={formData.emergencyContact}
                    onChange={(e) => updateField('emergencyContact', e.target.value)}
                    placeholder="Parent, sibling, or guardian name"
                  />
                  <Input
                    premium
                    label="Emergency contact number"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => updateField('emergencyContactPhone', e.target.value.replace(/[^\d+\s-]/g, ''))}
                    placeholder="9876543210"
                    error={errors.emergencyContactPhone}
                    hint="Optional, but recommended for move-out or urgent follow-up."
                  />
                </div>
              </div>
            </TenantFormSection>

            <TenantFormSection
              icon={Home}
              title="Bed assignment and payment setup"
              tone="sky"
            >
              <div className="grid gap-4 md:grid-cols-3">
                <Dropdown
                  premium
                  label="Floor"
                  options={floorOptions}
                  value={formData.floorId}
                  onChange={(value) => updateField('floorId', value)}
                  placeholder="Choose a floor"
                  helpText="Only floors with available beds are enabled."
                  error={errors.floorId}
                />
                <Dropdown
                  premium
                  label="Room"
                  options={roomOptions}
                  value={formData.roomId}
                  onChange={(value) => updateField('roomId', value)}
                  placeholder={formData.floorId ? 'Choose a room' : 'Select a floor first'}
                  disabled={!formData.floorId}
                  helpText="Rooms unlock after floor selection."
                  error={errors.roomId}
                />
                <Dropdown
                  premium
                  label="Bed"
                  options={allBedOptions}
                  value={formData.bedId}
                  onChange={(value) => updateField('bedId', value)}
                  placeholder={formData.roomId ? 'Choose a bed' : 'Select a room first'}
                  disabled={!formData.roomId}
                  helpText="Only available beds are shown."
                  error={errors.bedId}
                />
              </div>

              {selectedBed ? (
                <>
                  <div className="mt-4 rounded-[1.35rem] border border-sky-200/80 bg-white/85 p-4">
                    <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-2 xl:grid-cols-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Bed</p>
                        <p className="mt-1 font-medium text-slate-900">{selectedBed.bedNumber} • {selectedBed.bedType}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Room</p>
                        <p className="mt-1 font-medium text-slate-900">{selectedBed.room?.roomNumber} • {selectedBed.room?.type}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Floor</p>
                        <p className="mt-1 font-medium text-slate-900">{selectedBed.room?.floor?.name || 'Not available'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Monthly rent</p>
                        <p className="mt-1 font-medium text-slate-900">₹{selectedBed.rent}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Suggested deposit</p>
                        <p className="mt-1 font-medium text-slate-900">₹{selectedBed.rent * 2}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Room amenities</p>
                        <p className="mt-1 font-medium text-slate-900">{selectedBed.room?.amenities?.join(', ') || 'None configured'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <Dropdown
                      premium
                      label="Payment mode"
                      options={paymentModeOptions}
                      value={formData.paymentMode}
                      onChange={(value) => updateField('paymentMode', value)}
                      error={errors.paymentMode}
                    />
                    <Input
                      premium
                      label="Security deposit"
                      type="number"
                      min="0"
                      value={formData.securityDeposit}
                      onChange={(e) => updateField('securityDeposit', e.target.value)}
                      placeholder="0"
                      required
                      error={errors.securityDeposit}
                      hint={`Suggested: ₹${selectedBed.rent * 2}`}
                    />
                    <Input
                      premium
                      label="Advance rent"
                      type="number"
                      min="0"
                      value={formData.advanceRent}
                      onChange={(e) => updateField('advanceRent', e.target.value)}
                      placeholder="0"
                      required
                      error={errors.advanceRent}
                      hint={`Suggested: ₹${selectedBed.rent}`}
                    />
                  </div>

                  <div className="mt-4 rounded-[1.35rem] border border-emerald-200/80 bg-emerald-50/80 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Initial payment summary</p>
                        <p className="mt-1 text-sm text-emerald-800">
                          Rent ₹{selectedBed.rent} • Deposit ₹{formData.securityDeposit || 0} • Advance ₹{formData.advanceRent || 0}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-emerald-200/90 bg-white/80 px-4 py-2 text-right">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">Total due now</p>
                        <p className="mt-1 text-lg font-semibold text-emerald-900">
                          ₹{(parseFloat(formData.securityDeposit) || 0) + (parseFloat(formData.advanceRent) || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-4 rounded-[1.35rem] border border-dashed border-sky-200/90 bg-white/75 px-4 py-4 text-sm text-slate-500">
                  Select a floor, room, and bed to lock the tenant into live inventory and see the suggested deposit setup.
                </div>
              )}
            </TenantFormSection>

            <TenantFormSection
              icon={FileText}
              title="Admission confirmation"
              tone="amber"
            >
              <div className="space-y-4">
                <div className="flex flex-col gap-3 rounded-[1.25rem] border border-amber-200/80 bg-white/85 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {termsAndConditions.length > 0 ? 'Property rules are available for review.' : 'No property rules are configured yet.'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {termsAndConditions.length > 0
                        ? 'Review the current house rules before confirming the tenant.'
                        : 'You can still save the tenant record and configure the rules later in Settings.'}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowTermsModal(true)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    {termsAndConditions.length > 0 ? 'View rules' : 'Review note'}
                  </Button>
                </div>

                <label className="flex items-start gap-3 rounded-[1.25rem] border border-slate-200/80 bg-white/85 p-4">
                  <input
                    type="checkbox"
                    checked={formData.termsAccepted}
                    onChange={(e) => updateField('termsAccepted', e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span>
                    <span className="block text-sm font-medium text-slate-900">
                      I confirm the tenant details, bed assignment, and admission terms are accurate.
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      This keeps the current approval step in place without showing placeholder rules.
                    </span>
                    {errors.termsAccepted ? <span className="mt-2 block text-xs text-red-500">{errors.termsAccepted}</span> : null}
                  </span>
                </label>

                {!formData.termsAccepted ? (
                  <div className="rounded-[1.15rem] border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-xs font-medium text-amber-800">
                    Accept the admission rules to enable {tenant ? 'tenant updates' : 'tenant creation'}.
                  </div>
                ) : null}
              </div>
            </TenantFormSection>
          </div>

          <div className="sticky bottom-0 flex items-center justify-end gap-3 rounded-[1.5rem] border border-slate-200/80 bg-white/95 px-4 py-4 shadow-[0_-12px_28px_rgba(15,23,42,0.04)] backdrop-blur">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.termsAccepted}>
              {loading ? (tenant ? 'Updating tenant...' : 'Adding tenant...') : (tenant ? 'Update tenant' : 'Add tenant')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Terms and Conditions Modal */}
      <Modal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} title="House rules" size="lg">
        <div className="space-y-4">
          <div className="max-h-96 overflow-y-auto rounded-[1.5rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.96),rgba(255,255,255,0.98))] p-6">
            <div className="space-y-3">
              {termsAndConditions.length > 0 ? (
                termsAndConditions.map((term, index) => (
                  <div key={index} className="flex items-start gap-3 rounded-[1.15rem] border border-slate-200/80 bg-white/92 px-4 py-4 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-sky-200/80 bg-sky-50 text-xs font-semibold text-sky-700">
                      {index + 1}
                    </span>
                    <p className="text-sm leading-6 text-slate-700">{term}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.25rem] border border-dashed border-slate-200/90 bg-white/92 px-5 py-5 text-sm text-slate-500">
                  <p className="font-medium text-slate-900">No property rules are configured yet.</p>
                  <p className="mt-2">
                    The tenant acknowledgement step still stays in the form so admissions remain intentional. You can configure the house rules later in Settings.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end rounded-[1.5rem] border border-slate-200/80 bg-white/95 px-4 py-4 shadow-[0_-12px_28px_rgba(15,23,42,0.04)]">
            <Button onClick={() => setShowTermsModal(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// Vacate Tenant Drawer
function VacateTenantDrawer({ isOpen, onClose, tenant, onVacate }) {
  const [leavingDate, setLeavingDate] = useState('');
  const [reason, setReason] = useState('Tenant vacated');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Set default leaving date to today
  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      setLeavingDate(today);
      setReason('Tenant vacated');
      setFormError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!leavingDate) {
      setFormError('Select a leaving date to continue.');
      return;
    }

    setLoading(true);
    
    try {
      // Always send leavingDate as local YYYY-MM-DD (set time to 00:00:00)
      const localLeavingDate = (() => {
        const d = new Date(leavingDate);
        d.setHours(0, 0, 0, 0);
        const offset = d.getTimezoneOffset();
        d.setMinutes(d.getMinutes() - offset);
        return d.toISOString().split('T')[0];
      })();
      await onVacate({
        id: tenant.id,
        leavingDate: localLeavingDate,
        reason
      });
      onClose();
    } catch (error) {
      console.error('Error vacating tenant:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!tenant) return null;

  // Calculate stay duration
  const joiningDate = new Date(tenant.joiningDate);
  const leavingDateObj = leavingDate ? new Date(leavingDate) : new Date();
  const stayDays = Math.ceil((leavingDateObj - joiningDate) / (1000 * 60 * 60 * 24));

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Mark Tenant as Vacated"
      size="default"
      headerClassName="px-6 py-4"
      contentClassName="px-6 pb-6 pt-0"
    >
      <form onSubmit={handleSubmit} className="grid gap-5">
            {/* Tenant Info */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Tenant Information
              </h4>
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium text-gray-700">Name:</span>
                    <p className="text-gray-900 mt-1">{tenant.fullName}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">ID:</span>
                    <p className="text-gray-900 mt-1">{tenant.tenantId}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium text-gray-700">Phone:</span>
                    <p className="text-gray-900 mt-1">{tenant.phone}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Joined:</span>
                    <p className="text-gray-900 mt-1">{new Date(tenant.joiningDate).toLocaleDateString()}</p>
                  </div>
                </div>
                {tenant.bed && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium text-gray-700">Bed:</span>
                      <p className="text-gray-900 mt-1">{tenant.bed.bedNumber}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Room:</span>
                      <p className="text-gray-900 mt-1">{tenant.bed.room?.roomNumber}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Leaving Details */}
            <div className="grid gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Leaving Date *
                </label>
                <input
                  type="date"
                  value={leavingDate}
                  onChange={(e) => setLeavingDate(e.target.value)}
                  min={(() => { const d = new Date(tenant.joiningDate); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().split('T')[0]; })()} // Use local date for min
                  max={new Date().toISOString().split('T')[0]} // Can't be future date
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Select the date when the tenant vacated (between {new Date(tenant.joiningDate).toLocaleDateString()} and today)
                </p>
                {formError ? (
                  <p className="mt-2 text-xs text-red-500">{formError}</p>
                ) : null}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Reason for Leaving
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Tenant vacated">Tenant vacated</option>
                  <option value="End of lease">End of lease</option>
                  <option value="Job relocation">Job relocation</option>
                  <option value="Personal reasons">Personal reasons</option>
                  <option value="Found better accommodation">Found better accommodation</option>
                  <option value="Family reasons">Family reasons</option>
                  <option value="Terminated due to violation">Terminated due to violation</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Stay Duration Info */}
              {leavingDate && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h5 className="font-medium text-green-800 mb-3 flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Stay Summary
                  </h5>
                  <div className="grid grid-cols-1 gap-3 text-sm text-green-700">
                    <div className="flex justify-between">
                      <span className="font-medium">Total Stay:</span> 
                      <span>{stayDays} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Stay Period:</span> 
                      <span>{Math.floor(stayDays / 30)} months {stayDays % 30} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Joining Date:</span>
                      <span>{new Date(tenant.joiningDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Leaving Date:</span>
                      <span>{new Date(leavingDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Warnings */}
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-2">Important Notes:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>This will mark the tenant as VACATED and free up the bed</li>
                    <li>The bed will become available for new tenants immediately</li>
                    <li>Any pending payments will remain in the system</li>
                    <li>This action can be reversed if needed</li>
                    <li>Tenant will be moved to "Vacated Tenants" list</li>
                  </ul>
              </div>
            </div>
          </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-orange-600 hover:bg-orange-700 text-white" 
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Mark as Vacated'}
            </Button>
          </div>
        </form>
    </Drawer>
  );
}

export default function TenantsPage() {
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const { tenants, loading } = useSelector((state) => state.tenants);
  const { floors } = useSelector((state) => state.floors);
  const { rooms } = useSelector((state) => state.rooms);
  const { beds } = useSelector((state) => state.beds);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { selectedProperty } = useSelector((state) => state.property);

  const [showTenantModal, setShowTenantModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table');
  const [showVacateModal, setShowVacateModal] = useState(false);
  const [vacatingTenant, setVacatingTenant] = useState(null);

  useEffect(() => {
    const searchValue = searchParams.get('search') || '';
    setSearchTerm(searchValue);
  }, [searchParams]);

  // Calculate tenant statistics
  const tenantStats = {
    total: tenants.length,
    active: tenants.filter(t => t.status === 'ACTIVE').length,
    vacated: tenants.filter(t => t.status === 'VACATED').length,
    pending: tenants.filter(t => t.status === 'PENDING').length
  };

  // Generate unique tenant ID
  const generateTenantId = () => {
    const prefix = selectedProperty?.name?.substring(0, 2).toUpperCase() || 'PG';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `${prefix}${timestamp}${random}`;
  };

  // Fetch data on component mount
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchProperties());
    }
  }, [dispatch, isAuthenticated]);

  // Fetch tenants and related data when property is selected
  useEffect(() => {
    if (selectedProperty) {
      console.log('🔧 Selected property changed:', selectedProperty);
      console.log('🔧 Fetching tenants, floors, rooms, and beds for property:', selectedProperty.id);
      
      // Fetch all data for the selected property
      dispatch(fetchTenants({ propertyId: selectedProperty.id }));
      dispatch(fetchFloors(selectedProperty.id));
      dispatch(fetchRooms({ propertyId: selectedProperty.id }));
      dispatch(fetchBeds({ propertyId: selectedProperty.id }));
    }
  }, [dispatch, selectedProperty]);

  // Filter tenants based on search and status
  const filteredTenants = tenants.filter(tenant => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();
    const matchesSearch = !normalizedSearchTerm ||
      tenant.fullName?.toLowerCase().includes(normalizedSearchTerm);
    
    const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Get available beds (beds without tenants)
  const availableBeds = beds.filter(bed => !bed.tenant);

  // Tenant management functions
  const handleTenantSubmit = async (tenantData) => {
    try {
      if (editingTenant) {
        await dispatch(updateTenant({ id: editingTenant.id, ...tenantData })).unwrap();
        dispatch(addToast({
          title: 'Tenant updated',
          description: `${tenantData.fullName} was updated successfully.`,
          variant: 'success'
        }));
      } else {
        const tenantId = generateTenantId();
        await dispatch(createTenant({
          ...tenantData,
          tenantId,
          propertyId: selectedProperty.id
        })).unwrap();
        dispatch(addToast({
          title: 'Tenant added',
          description: `${tenantData.fullName} is now part of this property.`,
          variant: 'success'
        }));
      }

      setEditingTenant(null);
      setShowTenantModal(false);
    } catch (error) {
      throw error;
    }
  };

  const handleEditTenant = (tenant) => {
    console.log('🔧 Editing tenant:', tenant);
    setEditingTenant(tenant);
    setShowTenantModal(true);
  };

  const handleDeleteTenant = async (tenant) => {
    if (window.confirm(`Are you sure you want to delete tenant "${tenant.fullName}"? This action cannot be undone.`)) {
      try {
        await dispatch(deleteTenant(tenant.id)).unwrap();
        dispatch(addToast({
          title: 'Tenant Deleted',
          description: `Tenant "${tenant.fullName}" has been deleted successfully.`,
          variant: 'success'
        }));
      } catch (error) {
        dispatch(addToast({
          title: 'Delete Failed',
          description: error || 'Failed to delete tenant. Please try again.',
          variant: 'error'
        }));
      }
    }
  };

  const handleVacateTenant = (tenant) => {
    console.log('🔧 Vacating tenant:', tenant);
    setVacatingTenant(tenant);
    setShowVacateModal(true);
  };

  const handleVacateSubmit = async (vacateData) => {
    try {
      await dispatch(vacateTenant(vacateData)).unwrap();
      dispatch(fetchTenants({ propertyId: selectedProperty.id }));
      dispatch(addToast({
        title: 'Tenant marked as vacated',
        description: 'The resident has been moved out and the bed is available again.',
        variant: 'success'
      }));
      setShowVacateModal(false);
      setVacatingTenant(null);
    } catch (error) {
      dispatch(addToast({
        title: 'Unable to vacate tenant',
        description: error || 'Please try again.',
        variant: 'error'
      }));
    }
  };

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'VACATED', label: 'Vacated' },
    { value: 'PENDING', label: 'Pending' }
  ];

  return (
    <div className="app-shell min-h-screen space-y-6 p-4 sm:p-6">
      <section className="app-surface rounded-[2rem] p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Tenants</h1>
          </div>

          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            <Button
              onClick={() => setShowTenantModal(true)}
              disabled={!selectedProperty || availableBeds.length === 0}
              className="min-w-[10rem]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add tenant
            </Button>
          </div>
        </div>

        {selectedProperty ? (
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <TenantMetricCard
              icon={Users}
              label="Total tenants"
              value={tenantStats.total}
              helper="All tenant records in this property"
              tone="blue"
              active={statusFilter === 'all'}
              onClick={() => setStatusFilter('all')}
            />
            <TenantMetricCard
              icon={CheckCircle}
              label="Active tenants"
              value={tenantStats.active}
              helper="Currently occupying a bed"
              tone="emerald"
              active={statusFilter === 'ACTIVE'}
              onClick={() => setStatusFilter('ACTIVE')}
            />
            <TenantMetricCard
              icon={UserMinus}
              label="Vacated"
              value={tenantStats.vacated}
              helper="Residents who already moved out"
              tone="slate"
              active={statusFilter === 'VACATED'}
              onClick={() => setStatusFilter('VACATED')}
            />
            <TenantMetricCard
              icon={Clock}
              label="Pending"
              value={tenantStats.pending}
              helper="Profiles that still need follow-up"
              tone="amber"
              active={statusFilter === 'PENDING'}
              onClick={() => setStatusFilter('PENDING')}
            />
          </div>
        ) : null}
      </section>

      <section className="rounded-[1.75rem] border border-slate-200/80 bg-white/90 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.05)] backdrop-blur sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <Input
              premium
              icon={Search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tenants by name"
              autoComplete="off"
              spellCheck={false}
              name="tenant-list-search"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="min-w-[12rem]">
              <Dropdown
                premium
                options={statusOptions}
                value={statusFilter}
                onChange={setStatusFilter}
                placeholder="Filter by status"
              />
            </div>

            <div className="inline-flex rounded-2xl border border-slate-200/80 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <List className="h-4 w-4" />
                Table
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'cards' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Grid3X3 className="h-4 w-4" />
                Cards
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      {!selectedProperty ? (
        <section className="rounded-[1.75rem] border border-slate-200/80 bg-white/90 px-6 py-14 text-center shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[1.35rem] border border-slate-200/80 bg-slate-50 text-slate-500">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-slate-900">No property selected</h3>
          <p className="mt-2 text-sm text-slate-500">
            Choose a property from the header first, then the tenant list and move-in actions will load here.
          </p>
        </section>
      ) : loading ? (
        <section className="rounded-[1.75rem] border border-slate-200/80 bg-white/90 px-6 py-14 text-center shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
          <p className="mt-4 text-sm text-slate-500">Loading tenants for the selected property...</p>
        </section>
      ) : filteredTenants.length > 0 ? (
        viewMode === 'table' ? (
          <section className="rounded-[1.75rem] border border-slate-200/80 bg-white/90 p-3 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
            <div className="overflow-hidden rounded-[1.35rem]">
              <TenantTable
                tenants={filteredTenants}
                onEdit={handleEditTenant}
                onDelete={handleDeleteTenant}
                onVacate={handleVacateTenant}
                onAssignBed={handleEditTenant}
                viewMode={viewMode}
                loading={loading}
              />
            </div>
          </section>
        ) : (
          <section className="rounded-[1.75rem] border border-slate-200/80 bg-white/90 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
            <TenantTable
              tenants={filteredTenants}
              onEdit={handleEditTenant}
              onDelete={handleDeleteTenant}
              onVacate={handleVacateTenant}
              onAssignBed={handleEditTenant}
              viewMode={viewMode}
              loading={loading}
            />
          </section>
        )
      ) : (
        <section className="rounded-[1.75rem] border border-slate-200/80 bg-white/90 px-6 py-14 text-center shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[1.35rem] border border-slate-200/80 bg-slate-50 text-slate-500">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-slate-900">
              {searchTerm || statusFilter !== 'all' ? 'No Tenants Match Your Filters' : 'No Tenants Found'}
          </h3>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search terms or filters.'
                : 'Start by adding your first tenant to manage occupancy and payments.'
              }
          </p>
            {(!searchTerm && statusFilter === 'all') && (
              <Button
                className="mt-5"
                onClick={() => setShowTenantModal(true)}
                disabled={!selectedProperty || availableBeds.length === 0}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Tenant
              </Button>
            )}
        </section>
      )}

      {/* Tenant Form Modal */}
      <TenantFormModal
        isOpen={showTenantModal}
        onClose={() => {
          setShowTenantModal(false);
          setEditingTenant(null);
        }}
        tenant={editingTenant}
        onSubmit={handleTenantSubmit}
        availableBeds={availableBeds}
      />

      {/* Vacate Tenant Modal */}
      <VacateTenantDrawer
        isOpen={showVacateModal}
        onClose={() => setShowVacateModal(false)}
        tenant={vacatingTenant}
        onVacate={handleVacateSubmit}
      />
    </div>
  );
} 
