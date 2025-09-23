'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchTenants, createTenant, updateTenant, deleteTenant, assignTenantToBed, vacateTenant } from '@/store/slices/tenantsSlice';
import { fetchFloors } from '@/store/slices/floorsSlice';
import { fetchRooms } from '@/store/slices/roomsSlice';
import { fetchBeds } from '@/store/slices/bedsSlice';
import { fetchProperties } from '@/store/slices/propertySlice';
import { addToast } from '@/store/slices/uiSlice';
import apiService from '@/services/api';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dropdown } from '@/components/ui/Dropdown';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { TenantTable } from '@/components/tables/TenantTable';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Users,
  Plus,
  Edit,
  Trash2,
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
  UserPlus,
  UserMinus,
  Search
} from 'lucide-react';
import { Drawer } from '@/components/ui';

// Tenant Form Modal with Terms and Conditions
function TenantFormModal({ isOpen, onClose, tenant = null, onSubmit, availableBeds = [] }) {
  const { floors } = useSelector((state) => state.floors);
  const { rooms } = useSelector((state) => state.rooms);
  const { properties, selectedProperty } = useSelector((state) => state.property);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    alternatePhone: '',
    address: '',
    idProofType: 'AADHAR',
    idProofNumber: '',
    occupation: '',
    company: '',
    monthlyIncome: '',
    emergencyContact: '',
    floorId: '',
    roomId: '',
    bedId: '',
    securityDeposit: '',
    advanceRent: '',
    paymentMode: 'CASH',
    termsAccepted: false
  });

  const [termsAndConditions, setTermsAndConditions] = useState([]);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [loading, setLoading] = useState(false);

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
      setTermsAndConditions([
        "The tenant agrees to pay rent on or before the 5th of every month.",
        "No smoking or consumption of alcohol is allowed on the premises.",
        "Visitors are allowed only between 9:00 AM to 9:00 PM.",
        "The tenant must maintain cleanliness in their room and common areas.",
        "Any damage to property will be charged from the security deposit."
      ]);
    }
  };

  // Update form data when tenant prop changes (for editing)
  useEffect(() => {
    if (tenant) {
      console.log('🔧 Editing tenant, populating form with:', tenant);
      setFormData({
        fullName: tenant.fullName || '',
        email: tenant.email || '',
        phone: tenant.phone || '',
        alternatePhone: tenant.alternatePhone || '',
        address: tenant.address || '',
        idProofType: tenant.idProofType || 'AADHAR',
        idProofNumber: tenant.idProofNumber || '',
        occupation: tenant.occupation || '',
        company: tenant.company || '',
        monthlyIncome: tenant.monthlyIncome || '',
        emergencyContact: tenant.emergencyContact || '',
        floorId: tenant.bed?.room?.floorId || '',
        roomId: tenant.bed?.roomId || '',
        bedId: tenant.bed?.id || '',
        securityDeposit: tenant.securityDeposit || '',
        advanceRent: tenant.advanceRent || '',
        paymentMode: tenant.paymentMode || 'CASH',
        termsAccepted: true // Assume existing tenants have accepted terms
      });
    } else {
      console.log('🔧 Creating new tenant, resetting form');
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        alternatePhone: '',
        address: '',
        idProofType: 'AADHAR',
        idProofNumber: '',
        occupation: '',
        company: '',
        monthlyIncome: '',
        emergencyContact: '',
        floorId: '',
        roomId: '',
        bedId: '',
        securityDeposit: '',
        advanceRent: '',
        paymentMode: 'CASH',
        termsAccepted: false
      });
    }
  }, [tenant]);

  // Auto-populate financial data when bed is selected
  useEffect(() => {
    if (formData.bedId && availableBeds.length > 0) {
      const selectedBed = availableBeds.find(bed => bed.id === formData.bedId);
      if (selectedBed) {
        console.log('🔧 Auto-populating financial data for bed:', selectedBed);
        
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.fullName.trim()) {
      alert('Please enter tenant full name');
      return;
    }
    
    if (!formData.phone.trim()) {
      alert('Please enter phone number');
      return;
    }
    
    if (!formData.address.trim()) {
      alert('Please enter address');
      return;
    }

    if (!formData.bedId) {
      alert('Please select a bed for the tenant');
      return;
    }

    // Validate ID proof if provided
    if (formData.idProofNumber && !validateIdProof(formData.idProofNumber)) {
      alert(`Please enter a valid ${currentIdProofConfig.label} number. Format: ${currentIdProofConfig.helpText}`);
      return;
    }

    if (!formData.termsAccepted) {
      alert('Please accept the terms and conditions to proceed');
      return;
    }

    const tenantData = {
      ...formData,
      monthlyIncome: formData.monthlyIncome ? parseFloat(formData.monthlyIncome) : null,
      securityDeposit: formData.securityDeposit ? parseFloat(formData.securityDeposit) : 0,
      advanceRent: formData.advanceRent ? parseFloat(formData.advanceRent) : 0,
      joiningDate: new Date().toISOString(),
      termsAcceptedAt: new Date().toISOString()
    };

    console.log('🔧 Submitting tenant data:', tenantData);
    setLoading(true);
    
    try {
      await onSubmit(tenantData);
      onClose();
    } catch (error) {
      console.error('Error submitting tenant:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={tenant ? 'Edit Tenant' : 'Add New Tenant'} size="xl">
        <div className="max-h-[80vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Personal Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Full Name *"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Enter full name"
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                />
                <Input
                  label="Phone Number *"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                  required
                />
                <Input
                  label="Alternate Phone"
                  value={formData.alternatePhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, alternatePhone: e.target.value }))}
                  placeholder="Enter alternate phone"
                />
              </div>
            </div>

            {/* Address & ID Proof Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-green-600" />
                Address & Identification
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Complete Address *</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter complete permanent address"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Dropdown
                    label="ID Proof Type"
                    options={idProofOptions}
                    value={formData.idProofType}
                    onChange={(value) => setFormData(prev => ({ ...prev, idProofType: value }))}
                  />
                  <Input
                    label="ID Proof Number"
                    value={formData.idProofNumber}
                    onChange={handleIdProofChange}
                    placeholder={currentIdProofConfig.placeholder}
                    helpText={
                      formData.idProofNumber 
                        ? (validateIdProof(formData.idProofNumber) 
                          ? `✅ Valid ${currentIdProofConfig.label} number` 
                          : `❌ Invalid format. ${currentIdProofConfig.helpText}`)
                        : currentIdProofConfig.helpText
                    }
                    className={
                      formData.idProofNumber 
                        ? (validateIdProof(formData.idProofNumber) 
                          ? 'border-green-300 focus:border-green-500' 
                          : 'border-red-300 focus:border-red-500')
                        : ''
                    }
                    maxLength={currentIdProofConfig.maxLength}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Occupation Details Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Briefcase className="w-5 h-5 mr-2 text-purple-600" />
                Occupation Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Occupation"
                  value={formData.occupation}
                  onChange={(e) => setFormData(prev => ({ ...prev, occupation: e.target.value }))}
                  placeholder="e.g., Software Engineer"
                />
                <Input
                  label="Company"
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="Company name"
                />
                <Input
                  label="Monthly Income (₹)"
                  type="number"
                  min="0"
                  value={formData.monthlyIncome}
                  onChange={(e) => setFormData(prev => ({ ...prev, monthlyIncome: e.target.value }))}
                  placeholder="Enter monthly income"
                />
              </div>
              
              <div className="mt-4">
                <Input
                  label="Emergency Contact"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                  placeholder="Emergency contact name and phone"
                />
              </div>
            </div>

            {/* Bed Assignment & Financial Section */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Home className="w-5 h-5 mr-2 text-blue-600" />
                Bed Assignment & Financial Details
              </h4>
              
              <div className="space-y-4">
                {/* Floor Selection */}
                <Dropdown
                  label="Select Floor *"
                  options={floorOptions}
                  value={formData.floorId}
                  onChange={(value) => setFormData(prev => ({ ...prev, floorId: value }))}
                  placeholder="Choose a floor"
                  helpText="Select floor to see available rooms"
                />

                {/* Room Selection */}
                {formData.floorId && (
                  <Dropdown
                    label="Select Room *"
                    options={roomOptions}
                    value={formData.roomId}
                    onChange={(value) => setFormData(prev => ({ ...prev, roomId: value }))}
                    placeholder="Choose a room"
                    helpText="Select room to see available beds"
                  />
                )}

                {/* Bed Selection */}
                {formData.roomId && (
                  <Dropdown
                    label="Select Bed *"
                    options={allBedOptions}
                    value={formData.bedId}
                    onChange={(value) => setFormData(prev => ({ ...prev, bedId: value }))}
                    placeholder="Choose a bed"
                    helpText="Select bed to assign to tenant"
                  />
                )}

                {/* Selected Bed Details */}
                {selectedBed && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
                    <h5 className="font-medium text-gray-900 mb-2">Selected Bed Details</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Bed:</span> {selectedBed.bedNumber} ({selectedBed.bedType})
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Room:</span> {selectedBed.room?.roomNumber} ({selectedBed.room?.type})
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Floor:</span> {selectedBed.room?.floor?.name}
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Monthly Rent:</span> ₹{selectedBed.rent}
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Bed Deposit:</span> ₹{selectedBed.deposit}
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Room Amenities:</span> {selectedBed.room?.amenities?.join(', ') || 'None'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Financial Fields */}
                {selectedBed && (
                  <div className="space-y-4">
                    {/* Payment Mode Selection */}
                    <div className="grid grid-cols-1 gap-4">
                      <Dropdown
                        label="Payment Mode *"
                        options={paymentModeOptions}
                        value={formData.paymentMode}
                        onChange={(value) => setFormData(prev => ({ ...prev, paymentMode: value }))}
                        helpText="Select how the initial payment will be made"
                      />
                    </div>
                    
                    {/* Amount Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Security Deposit (₹) *"
                        type="number"
                        min="0"
                        value={formData.securityDeposit}
                        onChange={(e) => setFormData(prev => ({ ...prev, securityDeposit: e.target.value }))}
                        placeholder="Security deposit amount"
                        helpText={`Suggested: ₹${selectedBed.rent * 2} (2 months rent)`}
                        required
                      />
                      <Input
                        label="Advance Rent (₹) *"
                        type="number"
                        min="0"
                        value={formData.advanceRent}
                        onChange={(e) => setFormData(prev => ({ ...prev, advanceRent: e.target.value }))}
                        placeholder="Advance rent paid"
                        helpText={`Suggested: ₹${selectedBed.rent} (1 month rent)`}
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Financial Summary */}
                {selectedBed && formData.securityDeposit && formData.advanceRent && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <h5 className="font-medium text-green-800 mb-2">💰 Financial Summary</h5>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-green-700">
                      <div>
                        <span className="font-medium">Monthly Rent:</span> ₹{selectedBed.rent}
                      </div>
                      <div>
                        <span className="font-medium">Security Deposit:</span> ₹{formData.securityDeposit || 0}
                      </div>
                      <div>
                        <span className="font-medium">Advance Rent:</span> ₹{formData.advanceRent || 0}
                      </div>
                      <div>
                        <span className="font-medium">Payment Mode:</span> {paymentModeOptions.find(opt => opt.value === formData.paymentMode)?.label || 'Cash'}
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-green-300">
                      <span className="font-semibold text-green-800">
                        Total Initial Payment: ₹{(parseFloat(formData.securityDeposit) || 0) + (parseFloat(formData.advanceRent) || 0)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Terms and Conditions Section */}
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-yellow-600" />
                Terms and Conditions
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-700">
                    Please review and accept the terms and conditions before adding the tenant.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTermsModal(true)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Terms
                  </Button>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="termsAccepted"
                    checked={formData.termsAccepted}
                    onChange={(e) => setFormData(prev => ({ ...prev, termsAccepted: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    required
                  />
                  <label htmlFor="termsAccepted" className="text-sm text-gray-700">
                    I agree to the <button type="button" onClick={() => setShowTermsModal(true)} className="text-blue-600 underline">terms and conditions</button> *
                  </label>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
                {loading ? 'Processing...' : (tenant ? 'Update Tenant' : 'Add Tenant')}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Terms and Conditions Modal */}
      <Modal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} title="Terms and Conditions" size="lg">
        <div className="space-y-4">
          <div className="bg-gray-50 p-6 rounded-lg border max-h-96 overflow-y-auto">
            <h3 className="text-xl font-bold text-center mb-6 text-gray-900">
              Terms and Conditions
            </h3>
            <div className="space-y-3">
              <p className="text-gray-700 mb-4">
                By registering as a tenant, you agree to comply with the following terms and conditions:
              </p>
              {termsAndConditions.length > 0 ? (
                termsAndConditions.map((term, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <span className="font-semibold text-blue-600 min-w-[20px]">{index + 1}.</span>
                    <p className="text-gray-700 leading-relaxed">{term}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 italic text-center">
                  No terms and conditions configured yet.
                </p>
              )}
            </div>
          </div>
          <ModalFooter>
            <Button onClick={() => setShowTermsModal(false)}>
              Close
            </Button>
          </ModalFooter>
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

  // Set default leaving date to today
  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      setLeavingDate(today);
      setReason('Tenant vacated');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!leavingDate) {
      alert('Please select a leaving date');
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
    <Drawer isOpen={isOpen} onClose={onClose} title="Mark Tenant as Vacated" size="default">
      <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tenant Info */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
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
            <div className="space-y-4 mb-6">
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
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-6">
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
  const { tenants, loading, error } = useSelector((state) => state.tenants);
  const { floors } = useSelector((state) => state.floors);
  const { rooms } = useSelector((state) => state.rooms);
  const { beds } = useSelector((state) => state.beds);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { properties, selectedProperty } = useSelector((state) => state.property);

  const [showTenantModal, setShowTenantModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table');
  const [showVacateModal, setShowVacateModal] = useState(false);
  const [vacatingTenant, setVacatingTenant] = useState(null);

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
    const matchesSearch = tenant.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.phone?.includes(searchTerm) ||
                         tenant.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Get available beds (beds without tenants)
  const availableBeds = beds.filter(bed => !bed.tenant);

  // Tenant management functions
  const handleTenantSubmit = (tenantData) => {
    console.log('🔧 Submitting tenant:', tenantData);
    
    if (editingTenant) {
      dispatch(updateTenant({ id: editingTenant.id, ...tenantData }));
    } else {
      // Generate unique tenant ID for new tenant
      const tenantId = generateTenantId();
      dispatch(createTenant({ 
        ...tenantData, 
        tenantId,
        propertyId: selectedProperty.id 
      }));
    }
    
    setEditingTenant(null);
    setShowTenantModal(false);
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

  const handleAssignTenantToBed = (tenantId, bedId) => {
    console.log('🔧 Assigning tenant to bed:', { tenantId, bedId });
    dispatch(assignTenantToBed({ tenantId, bedId }));
  };

  const handleVacateTenant = (tenant) => {
    console.log('🔧 Vacating tenant:', tenant);
    setVacatingTenant(tenant);
    setShowVacateModal(true);
  };

  const handleVacateSubmit = async (vacateData) => {
    console.log('🔧 Submitting vacate:', vacateData);
    try {
      await dispatch(vacateTenant(vacateData)).unwrap();
      // Refresh the tenants list
      dispatch(fetchTenants({ propertyId: selectedProperty.id }));
    } catch (error) {
      console.error('Error vacating tenant:', error);
      alert('Failed to vacate tenant: ' + error);
    }
  };

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'VACATED', label: 'Vacated' },
    { value: 'PENDING', label: 'Pending' }
  ];

  return (
    <div className="relative space-y-6 p-6 bg-gradient-to-br from-gray-50 via-white to-blue-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tenants Management</h1>
          <p className="text-gray-600 mt-2">
            View, manage, and track all tenants in your PG
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button 
            onClick={() => setShowTenantModal(true)}
            className="flex items-center space-x-2"
            disabled={!selectedProperty || availableBeds.length === 0}
          >
            <Plus className="w-4 h-4" />
            <span>Add Tenant</span>
          </Button>
        </div>
      </div>
      <div className="my-6" />

      {/* Stats Cards */}
      {selectedProperty && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card 
              className={`cursor-pointer transition-all duration-200 ${
                statusFilter === 'all' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-lg'
              }`}
              onClick={() => setStatusFilter('all')}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Tenants</p>
                    <p className="text-xl font-bold">{tenantStats.total}</p>
                    {statusFilter === 'all' && (
                      <span className="text-xs text-blue-600 font-medium">Active Filter</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card 
              className={`cursor-pointer transition-all duration-200 ${
                statusFilter === 'ACTIVE' ? 'ring-2 ring-green-500 bg-green-50' : 'hover:shadow-lg'
              }`}
              onClick={() => setStatusFilter('ACTIVE')}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Active Tenants</p>
                    <p className="text-xl font-bold text-green-600">{tenantStats.active}</p>
                    {statusFilter === 'ACTIVE' && (
                      <span className="text-xs text-green-600 font-medium">Active Filter</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card 
              className={`cursor-pointer transition-all duration-200 ${
                statusFilter === 'VACATED' ? 'ring-2 ring-gray-500 bg-gray-50' : 'hover:shadow-lg'
              }`}
              onClick={() => setStatusFilter('VACATED')}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <UserMinus className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Vacated Tenants</p>
                    <p className="text-xl font-bold text-gray-600">{tenantStats.vacated}</p>
                    {statusFilter === 'VACATED' && (
                      <span className="text-xs text-gray-600 font-medium">Active Filter</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card 
              className={`cursor-pointer transition-all duration-200 ${
                statusFilter === 'PENDING' ? 'ring-2 ring-yellow-500 bg-yellow-50' : 'hover:shadow-lg'
              }`}
              onClick={() => setStatusFilter('PENDING')}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-yellow-50 rounded-lg">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pending Tenants</p>
                    <p className="text-xl font-bold text-yellow-600">{tenantStats.pending}</p>
                    {statusFilter === 'PENDING' && (
                      <span className="text-xs text-yellow-600 font-medium">Active Filter</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="my-6" />
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search tenants by name, phone, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Dropdown
                options={statusOptions}
                value={statusFilter}
                onChange={setStatusFilter}
                placeholder="Filter by status"
              />
              
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'table'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="w-4 h-4" />
                  <span>Table</span>
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'cards'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                  <span>Cards</span>
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="my-6" />

      {/* Content */}
      {!selectedProperty ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Property Selected</h3>
            <p className="text-gray-500">
              Please select a property to view and manage tenants.
            </p>
          </CardContent>
        </Card>
      ) : loading ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading tenants...</p>
          </CardContent>
        </Card>
      ) : filteredTenants.length > 0 ? (
        viewMode === 'table' ? (
          <Card>
            <CardContent className="p-0">
              <TenantTable
                tenants={filteredTenants}
                onEdit={handleEditTenant}
                onDelete={handleDeleteTenant}
                onVacate={handleVacateTenant}
                onAssignBed={(tenant) => {
                  // Handle bed assignment - could open a modal or redirect
                  console.log('Assign bed to tenant:', tenant);
                  // For now, just log - you can implement bed assignment modal here
                }}
                viewMode={viewMode}
                loading={loading}
              />
                </CardContent>
          </Card>
        ) : (
          <TenantTable
            tenants={filteredTenants}
            onEdit={handleEditTenant}
            onDelete={handleDeleteTenant}
            onVacate={handleVacateTenant}
            onAssignBed={(tenant) => {
              // Handle bed assignment - could open a modal or redirect
              console.log('Assign bed to tenant:', tenant);
              // For now, just log - you can implement bed assignment modal here
            }}
            viewMode={viewMode}
            loading={loading}
          />
        )
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'all' ? 'No Tenants Match Your Filters' : 'No Tenants Found'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search terms or filters.'
                : 'Start by adding your first tenant to manage occupancy and payments.'
              }
            </p>
            {(!searchTerm && statusFilter === 'all') && (
              <Button 
                onClick={() => setShowTenantModal(true)}
                disabled={!selectedProperty || availableBeds.length === 0}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Tenant
              </Button>
            )}
          </CardContent>
        </Card>
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