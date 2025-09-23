'use client';

import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addToast } from '@/store/slices/uiSlice';
import { fetchFloors, createFloor, updateFloor, deleteFloor, clearFloors } from '@/store/slices/floorsSlice';
import { fetchProperties, createProperty } from '@/store/slices/propertySlice';
import propertyService from '@/services/propertyService';
import { createRoom, updateRoom, deleteRoom, fetchRooms } from '@/store/slices/roomsSlice';
import { addBed, updateBed, deleteBed, fetchBeds, assignTenantToBed, vacateBed } from '@/store/slices/bedsSlice';
import { validateCapacity, getCapacitySummary } from '@/utils/capacityValidation';
import { CapacityIndicator } from '@/components/ui/CapacityIndicator';

import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Button,
  Input,
  Dropdown,
  Modal,
  ModalFooter
} from '@/components/ui';
import {
  Building,
  Plus,
  Edit,
  Trash2,
  Eye,
  Users,
  Bed,
  Home,
  CheckCircle,
  AlertCircle,
  User,
  Grid3X3,
  List,
  AlertTriangle,
  Search,
  Filter,
  Save,
  Shield,
  Download,
  Upload,
  FileText,
  Bell,
  Settings,
  UserPlus,
  UserMinus,
  MapPin,
  Briefcase
} from 'lucide-react';

// Property Form Modal
function PropertyFormModal({ isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    description: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      name: '', address: '', city: '', state: '', pincode: '', description: ''
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Property" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Property Name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., Green Valley PG, Sunrise Hostel"
          required
        />
        
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Address</label>
          <textarea
            value={formData.address}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Complete address with landmarks"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="City"
            value={formData.city}
            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
            placeholder="e.g., Bangalore"
            required
          />
          <Input
            label="State"
            value={formData.state}
            onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
            placeholder="e.g., Karnataka"
            required
          />
          <Input
            label="Pincode"
            value={formData.pincode}
            onChange={(e) => setFormData(prev => ({ ...prev, pincode: e.target.value }))}
            placeholder="e.g., 560001"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Description (Optional)</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Brief description about your property"
          />
        </div>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            Create Property
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

// Floor Form Modal
function FloorFormModal({ isOpen, onClose, floor = null, onSubmit, loading = false }) {
  const [formData, setFormData] = useState({
    name: '',
    floorNumber: 0,
    description: ''
  });

  // Real-time validation
  const isFormValid = formData.name && formData.name.trim() && 
                     formData.floorNumber !== undefined && 
                     formData.floorNumber !== null && 
                     formData.floorNumber !== '';

  // Update form data when floor prop changes (for editing)
  useEffect(() => {
    if (floor) {
      console.log('🔧 Editing floor, populating form with:', floor);
      setFormData({
        name: floor.name || floor.floorName || '',
        floorNumber: floor.floorNumber || 0,
        description: floor.description || ''
      });
    } else {
      console.log('🔧 Creating new floor, resetting form');
      setFormData({
        name: '',
        floorNumber: 0,
        description: ''
      });
    }
  }, [floor]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={floor ? 'Edit Floor' : 'Add New Floor'}>
      <div className="max-h-[80vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Floor Name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., Ground Floor, First Floor"
          required
        />
        <Input
          label="Floor Number"
          type="number"
          value={formData.floorNumber || ''}
          onChange={(e) => {
            const value = e.target.value;
            const numValue = value === '' ? 0 : parseInt(value);
            setFormData(prev => ({ ...prev, floorNumber: isNaN(numValue) ? 0 : numValue }));
          }}
          placeholder="0, 1, 2..."
          required
        />
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Optional description about this floor"
          />
        </div>
        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !isFormValid}>
            {loading ? 'Processing...' : (floor ? 'Update Floor' : 'Add Floor')}
          </Button>
        </ModalFooter>
        </form>
      </div>
    </Modal>
  );
}

// Room Form Modal
function RoomFormModal({ isOpen, onClose, room = null, onSubmit, loading = false }) {
  const dispatch = useDispatch();
  const { floors } = useSelector((state) => state.floors);
  const { selectedProperty } = useSelector((state) => state.property);
  
  const [formData, setFormData] = useState({
    roomNumber: '',
    name: '',
    floorId: '',
    type: 'Shared',
    capacity: 2,
    amenities: [],
    description: ''
  });

  // Real-time validation
  const isFormValid = formData.roomNumber && formData.roomNumber.trim() && 
                     formData.floorId && 
                     formData.capacity && 
                     formData.capacity >= 1 && 
                     formData.capacity <= 12;

  // Update form data when room prop changes (for editing)
  useEffect(() => {
    if (room) {
      console.log('🔧 Editing room, populating form with:', room);
      setFormData({
        roomNumber: room.roomNumber || '',
        name: room.name || '',
        floorId: room.floorId || '',
        type: room.type || 'Shared',
        capacity: room.capacity || 2,
        amenities: room.amenities || [],
        description: room.description || ''
      });
    } else {
      console.log('🔧 Creating new room, resetting form');
      setFormData({
        roomNumber: '',
        name: '',
        floorId: '',
        type: 'Shared',
        capacity: 2,
        amenities: [],
        description: ''
      });
    }
  }, [room]);

  // Fetch floors when modal opens if not already loaded
  useEffect(() => {
    if (isOpen && selectedProperty && floors.length === 0) {
      console.log('🔧 Room modal opened, fetching floors for property:', selectedProperty.id);
      dispatch(fetchFloors(selectedProperty.id));
    }
  }, [isOpen, selectedProperty, floors.length, dispatch]);

  // Debug floors
  console.log('🔧 RoomFormModal - Selected Property:', selectedProperty);
  console.log('🔧 RoomFormModal - Floors available:', floors);
  console.log('🔧 RoomFormModal - Floor count:', floors.length);

  const floorOptions = floors.map(floor => {
    console.log('🔧 Mapping floor:', floor);
    return {
      value: floor.id,
      label: floor.name || floor.floorName || `Floor ${floor.floorNumber}`
    };
  });

  console.log('🔧 Floor options for dropdown:', floorOptions);

  const typeOptions = [
    { value: 'Single', label: 'Single Bed Room' },
    { value: 'Shared', label: 'Shared Room (2-4 beds)' },
    { value: 'Dormitory', label: 'Dormitory (5+ beds)' }
  ];

  const amenityOptions = [
    { value: 'AC', label: 'Air Conditioning' },
    { value: 'Wi-Fi', label: 'Wi-Fi' },
    { value: 'Attached Bathroom', label: 'Attached Bathroom' },
    { value: 'Balcony', label: 'Balcony' },
    { value: 'Study Table', label: 'Study Table' },
    { value: 'Wardrobe', label: 'Wardrobe' },
    { value: 'TV', label: 'Television' },
    { value: 'Geyser', label: 'Geyser' },
    { value: 'Fan', label: 'Ceiling Fan' },
    { value: 'Window', label: 'Window' },
    { value: 'Cupboard', label: 'Cupboard' }
  ];

  // Auto-adjust capacity based on room type
  const handleTypeChange = (type) => {
    let defaultCapacity = 2;
    switch (type) {
      case 'Single':
        defaultCapacity = 1;
        break;
      case 'Shared':
        defaultCapacity = 2;
        break;
      case 'Dormitory':
        defaultCapacity = 6;
        break;
    }
    setFormData(prev => ({ 
      ...prev, 
      type, 
      capacity: defaultCapacity 
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    const capacity = parseInt(formData.capacity);
    if (isNaN(capacity) || capacity < 1 || capacity > 12) {
      alert('Room capacity must be between 1 and 12 beds');
      return;
    }

    onSubmit({
      ...formData,
      floorId: formData.floorId,
      capacity: capacity
    });
    
    setFormData({
      roomNumber: '', 
      name: '', 
      floorId: '', 
      type: 'Shared',
      capacity: 2, 
      amenities: [], 
      description: ''
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={room ? 'Edit Room' : 'Add New Room'} size="lg">
      <div className="max-h-[80vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Room Number"
            value={formData.roomNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, roomNumber: e.target.value }))}
            placeholder="e.g., 101, 201A, R-05"
            required
          />
          <Input
            label="Room Name (Optional)"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Deluxe Room, Corner Room"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Dropdown
              label="Floor"
              options={floorOptions}
              value={formData.floorId}
              onChange={(value) => {
                console.log('🔧 Floor selected:', value);
                setFormData(prev => ({ ...prev, floorId: value }));
              }}
              placeholder={floors.length === 0 ? "No floors available" : "Select floor"}
              required
            />
            {floors.length === 0 && (
              <p className="text-xs text-red-500 mt-1">
                No floors found. Please create a floor first.
                {selectedProperty && (
                  <button 
                    type="button"
                    onClick={() => {
                      console.log('🔧 Manual floor refresh for property:', selectedProperty.id);
                      dispatch(fetchFloors(selectedProperty.id));
                    }}
                    className="ml-2 text-blue-600 underline"
                  >
                    Refresh floors
                  </button>
                )}
              </p>
            )}
            {floors.length > 0 && floorOptions.length === 0 && (
              <p className="text-xs text-yellow-600 mt-1">
                Floors available but options not loading properly.
              </p>
            )}
          </div>
          <Dropdown
            label="Room Type"
            options={typeOptions}
            value={formData.type}
            onChange={handleTypeChange}
          />
        </div>

        <div>
          <Input
            label="Bed Capacity"
            type="number"
            min="1"
            max="12"
            value={formData.capacity || ''}
            onChange={(e) => {
              const value = e.target.value;
              const numValue = value === '' ? 1 : parseInt(value);
              setFormData(prev => ({ ...prev, capacity: isNaN(numValue) ? 1 : numValue }));
            }}
            placeholder="Maximum number of beds this room can have"
            required
            helpText={`Current type: ${formData.type} (recommended: ${
              formData.type === 'Single' ? '1' : 
              formData.type === 'Shared' ? '2-4' : '5-12'
            } beds)`}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Room Amenities
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3">
            {amenityOptions.map((amenity) => (
              <label key={amenity.value} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.amenities.includes(amenity.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData(prev => ({ 
                        ...prev, 
                        amenities: [...prev.amenities, amenity.value] 
                      }));
                    } else {
                      setFormData(prev => ({ 
                        ...prev, 
                        amenities: prev.amenities.filter(a => a !== amenity.value) 
                      }));
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{amenity.label}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Select all amenities available in this room
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Description (Optional)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Additional room details, special features, or notes"
          />
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Rent and deposits are set individually for each bed, not for the room. 
            After creating this room, you can add beds with their specific rent amounts.
          </p>
        </div>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !isFormValid}>
            {loading ? 'Processing...' : (room ? 'Update Room' : 'Create Room')}
          </Button>
        </ModalFooter>
        </form>
      </div>
    </Modal>
  );
}

// Bed Form Modal
function BedFormModal({ isOpen, onClose, bed = null, onSubmit, loading = false }) {
  const { rooms } = useSelector((state) => state.rooms);
  const { floors } = useSelector((state) => state.floors);
  const { beds } = useSelector((state) => state.beds);
  
  const [formData, setFormData] = useState({
    bedNumber: '',
    roomId: '',
    bedType: 'Single',
    rent: 5000,
    deposit: 10000,
    description: ''
  });

  // Real-time validation
  const isFormValid = formData.bedNumber && formData.bedNumber.trim() && 
                     formData.roomId && 
                     formData.rent && 
                     formData.rent >= 1000 && 
                     formData.deposit !== undefined && 
                     formData.deposit >= 0;

  // Update form data when bed prop changes (for editing)
  useEffect(() => {
    if (bed) {
      console.log('🔧 Editing bed, populating form with:', bed);
      setFormData({
        bedNumber: bed.bedNumber || '',
        roomId: bed.roomId || '',
        bedType: bed.bedType || 'Single',
        rent: bed.rent || 5000,
        deposit: bed.deposit || 10000,
        description: bed.description || ''
      });
    } else {
      console.log('🔧 Creating new bed, resetting form');
      setFormData({
        bedNumber: '',
        roomId: '',
        bedType: 'Single',
        rent: 5000,
        deposit: 10000,
        description: ''
      });
    }
  }, [bed]);

  const bedTypeOptions = [
    { value: 'Single', label: 'Single Bed' },
    { value: 'Double', label: 'Double/Queen Bed' },
    { value: 'Bunk', label: 'Bunk Bed (2 sleeping spaces)' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate room capacity
    const selectedRoom = rooms.find(r => r.id === formData.roomId);
    const roomBeds = beds.filter(b => b.roomId === formData.roomId);
    
    if (!bed && selectedRoom && roomBeds.length >= selectedRoom.capacity) {
      alert(`Room ${selectedRoom.roomNumber} is at full capacity (${selectedRoom.capacity} beds). Cannot add more beds.`);
      return;
    }

    // Validate rent amount
    if (parseFloat(formData.rent) < 1000) {
      alert('Rent amount should be at least ₹1,000');
      return;
    }

    onSubmit({
      ...formData,
      roomId: formData.roomId,
      rent: parseFloat(formData.rent),
      deposit: parseFloat(formData.deposit)
    });
    
    setFormData({
      bedNumber: '', 
      roomId: '', 
      bedType: 'Single', 
      rent: 5000, 
      deposit: 10000, 
      description: ''
    });
    onClose();
  };

  // Get selected room info
  const selectedRoom = rooms.find(r => r.id === formData.roomId);
  const selectedRoomBeds = beds.filter(b => b.roomId === formData.roomId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={bed ? 'Edit Bed' : 'Add New Bed'} size="lg">
      <div className="max-h-[80vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Bed Number/ID"
            value={formData.bedNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, bedNumber: e.target.value }))}
            placeholder="e.g., B001, BED-101-A, Bed-1"
            required
          />
          <Dropdown
            label="Bed Type"
            options={bedTypeOptions}
            value={formData.bedType}
            onChange={(value) => setFormData(prev => ({ ...prev, bedType: value }))}
          />
        </div>

        <div>
          <Dropdown
            label="Room"
            options={rooms.map(room => ({
              value: room.id,
              label: `${room.roomNumber} - ${room.name || 'Room'}`
            }))}
            value={formData.roomId}
            onChange={(value) => setFormData(prev => ({ ...prev, roomId: value }))}
            placeholder="Select room for this bed"
            required
          />
          {selectedRoom && (
            <div className="mt-2 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Room:</strong> {selectedRoom.roomNumber} ({selectedRoom.type})
              </p>
              <p className="text-sm text-gray-600">
                <strong>Capacity:</strong> {selectedRoomBeds.length}/{selectedRoom.capacity} beds occupied
              </p>
              <p className="text-sm text-gray-600">
                <strong>Amenities:</strong> {selectedRoom.amenities?.join(', ') || 'None listed'}
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Monthly Rent (₹)"
            type="number"
            min="1000"
            value={formData.rent || ''}
            onChange={(e) => {
              const value = e.target.value;
              const numValue = value === '' ? 0 : parseFloat(value);
              setFormData(prev => ({ ...prev, rent: isNaN(numValue) ? 0 : numValue }));
            }}
            placeholder="e.g., 5000, 7500"
            required
            helpText="Amount tenant pays per month for this bed"
          />
          <Input
            label="Security Deposit (₹)"
            type="number"
            min="0"
            value={formData.deposit || ''}
            onChange={(e) => {
              const value = e.target.value;
              const numValue = value === '' ? 0 : parseFloat(value);
              setFormData(prev => ({ ...prev, deposit: isNaN(numValue) ? 0 : numValue }));
            }}
            placeholder="e.g., 10000, 15000"
            required
            helpText="One-time refundable deposit"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Bed Description (Optional)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Bed-specific details, location in room, special features"
          />
        </div>

        {!selectedRoom && (
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Please select a room first to see capacity information.
            </p>
          </div>
        )}

        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>Pricing Info:</strong> This bed will be available for rent at ₹{formData.rent || 0}/month 
            with a security deposit of ₹{formData.deposit || 0}.
          </p>
        </div>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !isFormValid}>
            {loading ? 'Processing...' : (bed ? 'Update Bed' : 'Create Bed')}
          </Button>
        </ModalFooter>
        </form>
      </div>
    </Modal>
  );
}

// Floor Card Component
function FloorCard({ floor, onEdit, onDelete, onClick }) {
  const { rooms } = useSelector((state) => state.rooms);
  const roomsInFloor = rooms.filter(room => room.floorId === floor.id);

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onClick && onClick(floor.id)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Building className="w-5 h-5 text-blue-600" />
            <span>{floor.floorName}</span>
          </CardTitle>
          <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
            <Button variant="outline" size="sm" onClick={() => onEdit(floor)}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => onDelete(floor.id)}
              disabled={roomsInFloor.length > 0}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Floor Number: {floor.floorNumber}</p>
          <p className="text-sm text-gray-600 flex items-center">
            Rooms: {roomsInFloor.length}
            {roomsInFloor.length > 0 && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                Click to view rooms
              </span>
            )}
          </p>
          {floor.description && (
            <p className="text-sm text-gray-500">{floor.description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Floor Table Component
function FloorTable({ floors, onEdit, onDelete, onClick }) {
  const { rooms } = useSelector((state) => state.rooms);

  const getRoomCount = (floorId) => {
    return rooms.filter(room => room.floorId === floorId).length;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Floor Details
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Floor Number
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rooms Count
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Description
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {floors.map((floor) => {
            const roomCount = getRoomCount(floor.id);
            return (
              <tr key={floor.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onClick && onClick(floor.id)}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <Building className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {floor.floorName || floor.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Floor {floor.floorNumber}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {floor.floorNumber}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="text-sm text-gray-900">{roomCount} rooms</div>
                    {roomCount > 0 && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                        Click to view
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {roomCount === 0 ? 'No rooms' : `${roomCount} room${roomCount !== 1 ? 's' : ''}`}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-xs truncate">
                    {floor.description || 'No description'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(floor)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDelete(floor.id)}
                      disabled={roomCount > 0}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {floors.length === 0 && (
        <div className="text-center py-12">
          <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No floors found</h3>
          <p className="text-gray-500">Add floors to start organizing your PG structure.</p>
        </div>
      )}
    </div>
  );
}

// Room Table Component
function RoomTable({ rooms, onEdit, onDelete, onClick }) {
  const { floors } = useSelector((state) => state.floors);
  const { beds } = useSelector((state) => state.beds);

  const getFloorName = (floorId) => {
    console.log('🔧 Looking for floor with ID:', floorId);
    console.log('🔧 Available floors:', floors);
    
    const floor = floors.find(f => f.id === floorId);
    console.log('🔧 Found floor:', floor);
    
    if (floor) {
      console.log('🔧 Floor properties:', Object.keys(floor));
      console.log('🔧 Floor name options:', {
        floorName: floor.floorName,
        name: floor.name,
        floorNumber: floor.floorNumber
      });
    }
    
    return floor?.floorName || floor?.name || `Floor ${floor?.floorNumber}` || 'Unknown';
  };

  const getRoomBedInfo = (roomId) => {
    const roomBeds = beds.filter(bed => bed.roomId === roomId);
    const occupiedBeds = roomBeds.filter(bed => bed.status === 'Occupied');
    return { total: roomBeds.length, occupied: occupiedBeds.length };
  };

  const getStatusColor = (status) => {
    const colors = {
      available: 'text-green-600 bg-green-50',
      occupied: 'text-red-600 bg-red-50',
      maintenance: 'text-yellow-600 bg-yellow-50'
    };
    return colors[status] || 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Room Details
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Floor
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type & Capacity
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Bed Occupancy
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amenities
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {rooms.map((room) => {
            const bedInfo = getRoomBedInfo(room.id);
            const occupancyRate = bedInfo.total > 0 ? (bedInfo.occupied / bedInfo.total) * 100 : 0;
            const availableSlots = room.capacity - bedInfo.total;
            
            return (
              <tr key={room.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onClick && onClick(room.id)}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <Home className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        Room {room.roomNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        {room.name || 'No name set'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">
                    {getFloorName(room.floorId)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{room.type}</div>
                  <div className="text-sm text-gray-500">Max: {room.capacity} beds</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-3">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {bedInfo.total}/{room.capacity} beds created
                      </div>
                      <div className="text-sm text-gray-500">
                        {bedInfo.occupied} occupied, {bedInfo.total - bedInfo.occupied} vacant
                      </div>
                      {availableSlots > 0 && (
                        <div className="text-xs text-green-600 font-medium">
                          {availableSlots} slots available
                        </div>
                      )}
                    </div>
                    {bedInfo.total > 0 && (
                      <div className="flex items-center">
                        <div className="w-12 h-2 bg-gray-200 rounded-full mr-2">
                          <div 
                            className="h-2 bg-blue-600 rounded-full" 
                            style={{ width: `${occupancyRate}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">{Math.round(occupancyRate)}%</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {room.amenities?.slice(0, 3).map((amenity, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {amenity}
                      </span>
                    ))}
                    {room.amenities?.length > 3 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        +{room.amenities.length - 3} more
                      </span>
                    )}
                    {!room.amenities?.length && (
                      <span className="text-xs text-gray-400 italic">No amenities listed</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(room)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDelete(room.id)}
                      disabled={bedInfo.total > 0}
                      className="text-red-600 hover:text-red-900"
                      title={bedInfo.total > 0 ? 'Cannot delete room with beds' : 'Delete room'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {rooms.length === 0 && (
        <div className="text-center py-12">
          <Home className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms found</h3>
          <p className="text-gray-500">Add rooms to your floors to start managing accommodations.</p>
        </div>
      )}
    </div>
  );
}

// Room Card Component
function RoomCard({ room, onEdit, onDelete, onClick }) {
  const { floors } = useSelector((state) => state.floors);
  const { beds } = useSelector((state) => state.beds);
  const floor = floors.find(f => f.id === room.floorId);
  const roomBeds = beds.filter(bed => bed.roomId === room.id);
  const occupiedBeds = roomBeds.filter(bed => bed.status === 'Occupied');

  const statusColors = {
    available: 'text-green-600 bg-green-50',
    occupied: 'text-red-600 bg-red-50',
    maintenance: 'text-yellow-600 bg-yellow-50'
  };

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onClick && onClick(room.id)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Home className="w-5 h-5 text-blue-600" />
            <span>{room.roomNumber} - {room.name}</span>
          </CardTitle>
          <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
            <Button variant="outline" size="sm" onClick={() => onEdit(room)}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => onDelete(room.id)}
              disabled={roomBeds.length > 0}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Floor:</span>
            <span className="text-sm font-medium">{floor?.floorName || 'Unknown'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Type:</span>
            <span className="text-sm font-medium">{room.type}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Beds:</span>
            <div className="flex items-center">
              <span className="text-sm font-medium">{occupiedBeds.length}/{roomBeds.length} occupied</span>
              {roomBeds.length > 0 && (
                <span className="ml-2 text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                  Click to view beds
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Rent:</span>
            <span className="text-sm font-medium">₹{room.rent}/month</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {room.amenities?.slice(0, 3).map((amenity, index) => (
              <span key={index} className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded">
                {amenity}
              </span>
            ))}
            {room.amenities?.length > 3 && (
              <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded">
                +{room.amenities.length - 3} more
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Bed Card Component
function BedCard({ bed, onEdit, onDelete }) {
  const { rooms } = useSelector((state) => state.rooms);
  const { floors } = useSelector((state) => state.floors);
  
  const room = rooms.find(r => r.id === bed.roomId);
  const floor = floors.find(f => f.id === room?.floorId);

  const statusColors = {
    Available: 'text-green-600 bg-green-50',
    Occupied: 'text-red-600 bg-red-50',
    Maintenance: 'text-yellow-600 bg-yellow-50'
  };

  const StatusIcon = bed.status === 'Available' ? CheckCircle : 
                    bed.status === 'Occupied' ? User : AlertCircle;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Bed className="w-5 h-5 text-blue-600" />
            <span>{bed.bedNumber}</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${statusColors[bed.status]}`}>
              <StatusIcon className="w-3 h-3" />
              <span>{bed.status}</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => onEdit(bed)}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => onDelete(bed.id)}
              disabled={bed.status === 'Occupied'}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Room:</span>
            <span className="text-sm font-medium">{room?.roomNumber || 'Unknown'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Floor:</span>
            <span className="text-sm font-medium">{floor?.name || floor?.floorName || `Floor ${floor?.floorNumber}` || 'Unknown Floor'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Type:</span>
            <span className="text-sm font-medium">{bed.bedType}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Rent:</span>
            <span className="text-sm font-medium">₹{bed.rent}/month</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Bed Table Component
function BedTable({ beds, onEdit, onDelete }) {
  const { rooms } = useSelector((state) => state.rooms);
  const { floors } = useSelector((state) => state.floors);

  const getRoomInfo = (roomId) => {
    return rooms.find(r => r.id === roomId);
  };

  const getFloorInfo = (floorId) => {
    return floors.find(f => f.id === floorId);
  };

  const getStatusColor = (status) => {
    const colors = {
      Available: 'bg-green-100 text-green-800',
      Occupied: 'bg-red-100 text-red-800',
      Maintenance: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const StatusIcon = ({ status }) => {
    const icons = {
      Available: CheckCircle,
      Occupied: User,
      Maintenance: AlertCircle
    };
    const IconComponent = icons[status] || AlertCircle;
    return <IconComponent className="w-4 h-4" />;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Bed Details
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Room & Floor
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type & Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rent & Deposit
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tenant
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {beds.map((bed) => {
            const room = getRoomInfo(bed.roomId);
            const floor = getFloorInfo(room?.floorId);
            
            return (
              <tr key={bed.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <Bed className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        Bed {bed.bedNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        {bed.description || 'Standard bed'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    Room {room?.roomNumber || 'Unknown'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {floor?.name || floor?.floorName || `Floor ${floor?.floorNumber}` || 'Unknown Floor'}
                  </div>
                  {room?.amenities && room.amenities.length > 0 && (
                    <div className="text-xs text-gray-400 mt-1">
                      {room.amenities.slice(0, 2).join(', ')}
                      {room.amenities.length > 2 && ` +${room.amenities.length - 2} more`}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 mb-1">{bed.bedType} Bed</div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(bed.status)}`}>
                    <StatusIcon status={bed.status} />
                    <span className="ml-1">{bed.status}</span>
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    ₹{bed.rent?.toLocaleString() || '0'}/month
                  </div>
                  <div className="text-sm text-gray-500">
                    ₹{bed.deposit?.toLocaleString() || '0'} deposit
                  </div>
                  {bed.status === 'Available' && (
                    <div className="text-xs text-green-600 font-medium mt-1">
                      Available for rent
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {bed.tenant ? (
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {bed.tenant.fullName || bed.tenant.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {bed.tenant.phone || 'No phone'}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400 italic">
                      {bed.status === 'Available' ? 'No tenant' : 'Vacant'}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(bed)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDelete(bed.id)}
                      disabled={bed.status === 'Occupied'}
                      className="text-red-600 hover:text-red-900"
                      title={bed.status === 'Occupied' ? 'Cannot delete occupied bed' : 'Delete bed'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {beds.length === 0 && (
        <div className="text-center py-12">
          <Bed className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No beds found</h3>
          <p className="text-gray-500 mb-4">
            Add beds to your rooms to manage individual tenant assignments.
          </p>
          <Button onClick={() => setShowBedModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Bed
          </Button>
        </div>
      )}
    </div>
  );
}

// Tenant Form Modal
function TenantFormModal({ isOpen, onClose, tenant = null, onSubmit, availableBeds = [] }) {
  const { floors } = useSelector((state) => state.floors);
  const { rooms } = useSelector((state) => state.rooms);
  
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
    advanceRent: ''
  });

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
        advanceRent: tenant.advanceRent || ''
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
        advanceRent: ''
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

  const idProofOptions = [
    { value: 'AADHAR', label: 'Aadhar Card' },
    { value: 'PAN', label: 'PAN Card' },
    { value: 'PASSPORT', label: 'Passport' },
    { value: 'DRIVING_LICENSE', label: 'Driving License' },
    { value: 'VOTER_ID', label: 'Voter ID' }
  ];

  // Get floors with availability info
  const floorOptions = floors.map(floor => {
    const floorRooms = rooms.filter(room => room.floorId === floor.id);
    const floorBeds = availableBeds.filter(bed => bed.room?.floorId === floor.id);
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

  // Get selected bed details
  const selectedBed = availableBeds.find(bed => bed.id === formData.bedId);

  const handleSubmit = (e) => {
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

    const tenantData = {
      ...formData,
      monthlyIncome: formData.monthlyIncome ? parseFloat(formData.monthlyIncome) : null,
      securityDeposit: formData.securityDeposit ? parseFloat(formData.securityDeposit) : 0,
      advanceRent: formData.advanceRent ? parseFloat(formData.advanceRent) : 0,
      joiningDate: new Date().toISOString()
    };

    console.log('🔧 Submitting tenant data:', tenantData);
    onSubmit(tenantData);
    onClose();
  };

  return (
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
                  onChange={(e) => setFormData(prev => ({ ...prev, idProofNumber: e.target.value }))}
                  placeholder="Enter ID number"
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
                value={formData.monthlyIncome || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  const numValue = value === '' ? 0 : parseFloat(value);
                  setFormData(prev => ({ ...prev, monthlyIncome: isNaN(numValue) ? 0 : numValue }));
                }}
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
                  options={bedOptions}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Security Deposit (₹) *"
                    type="number"
                    min="0"
                    value={formData.securityDeposit || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      const numValue = value === '' ? 0 : parseFloat(value);
                      setFormData(prev => ({ ...prev, securityDeposit: isNaN(numValue) ? 0 : numValue }));
                    }}
                    placeholder="Security deposit amount"
                    helpText={`Suggested: ₹${selectedBed.rent * 2} (2 months rent)`}
                    required
                  />
                  <Input
                    label="Advance Rent (₹) *"
                    type="number"
                    min="0"
                    value={formData.advanceRent || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      const numValue = value === '' ? 0 : parseFloat(value);
                      setFormData(prev => ({ ...prev, advanceRent: isNaN(numValue) ? 0 : numValue }));
                    }}
                    placeholder="Advance rent paid"
                    helpText={`Suggested: ₹${selectedBed.rent} (1 month rent)`}
                    required
                  />
                </div>
              )}

              {/* Financial Summary */}
              {selectedBed && formData.securityDeposit && formData.advanceRent && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <h5 className="font-medium text-green-800 mb-2">💰 Financial Summary</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-green-700">
                    <div>
                      <span className="font-medium">Monthly Rent:</span> ₹{selectedBed.rent}
                    </div>
                    <div>
                      <span className="font-medium">Security Deposit:</span> ₹{formData.securityDeposit || 0}
                    </div>
                    <div>
                      <span className="font-medium">Advance Rent:</span> ₹{formData.advanceRent || 0}
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

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {tenant ? 'Update Tenant' : 'Add Tenant'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

// Confirmation Modal for Delete Operations
function ConfirmDeleteModal({ isOpen, onClose, onConfirm, title, message, cascadeInfo = null, loading = false }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="text-gray-900 font-medium mb-2">{message}</p>
            
            {cascadeInfo && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800 mb-1">
                      Warning: This will also delete:
                    </p>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {cascadeInfo.map((item, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <span className="w-1 h-1 bg-yellow-600 rounded-full"></span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            <p className="text-sm text-gray-600 mt-3">
              This action cannot be undone.
            </p>
          </div>
        </div>
      </div>
      
      <ModalFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          type="button" 
          variant="destructive" 
          onClick={onConfirm} 
          disabled={loading}
          className="bg-red-600 hover:bg-red-700"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Deleting...
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </>
          )}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export default function RoomsPage() {
  const dispatch = useDispatch();
  const { floors } = useSelector((state) => state.floors);
  const { rooms } = useSelector((state) => state.rooms);
  const { beds } = useSelector((state) => state.beds);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { properties, selectedProperty } = useSelector((state) => state.property);

  const [activeTab, setActiveTab] = useState('floors');
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);

  // Fetch data on component mount
  useEffect(() => {
    const loadProperties = async () => {
      try {
        const response = await propertyService.getProperties();
        if (response.success) {
          // Dispatch to Redux store
          dispatch(fetchProperties.fulfilled(response.data));
        }
      } catch (error) {
        console.error('Error loading properties:', error);
        dispatch(addToast({
          title: 'Error',
          description: 'Failed to load properties',
          variant: 'error'
        }));
      }
    };

    if (isAuthenticated) {
      loadProperties();
    }
  }, [dispatch, isAuthenticated]);

  // Fetch floors when property is selected
  useEffect(() => {
    if (selectedProperty) {
      console.log('🔧 Selected property changed:', selectedProperty);
      console.log('🔧 Fetching floors, rooms, and beds for property:', selectedProperty.id);
      
      // Fetch all data for the selected property
      dispatch(fetchFloors(selectedProperty.id));
      dispatch(fetchRooms({ propertyId: selectedProperty.id }));
      dispatch(fetchBeds({ propertyId: selectedProperty.id }));
    } else {
      console.log('🔧 No property selected, clearing data');
      dispatch(clearFloors());
    }
  }, [dispatch, selectedProperty]);

  // Debug floors state
  useEffect(() => {
    console.log('🔧 Floors state updated:', floors);
    console.log('🔧 Floors count:', floors.length);
  }, [floors]);

  const [showFloorModal, setShowFloorModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showBedModal, setShowBedModal] = useState(false);
  const [editingFloor, setEditingFloor] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);
  const [editingBed, setEditingBed] = useState(null);
  
  // Loading states
  const [floorLoading, setFloorLoading] = useState(false);
  const [roomLoading, setRoomLoading] = useState(false);
  const [bedLoading, setBedLoading] = useState(false);
  
  // View modes for each tab
  const [floorViewMode, setFloorViewMode] = useState('table');
  const [roomViewMode, setRoomViewMode] = useState('table');
  const [bedViewMode, setBedViewMode] = useState('table');
  
  // Search states for each tab
  const [floorSearchTerm, setFloorSearchTerm] = useState('');
  const [roomSearchTerm, setRoomSearchTerm] = useState('');
  const [bedSearchTerm, setBedSearchTerm] = useState('');
  
  // Filter states
  const [selectedFloorFilter, setSelectedFloorFilter] = useState('all'); // for rooms tab
  const [selectedRoomFilter, setSelectedRoomFilter] = useState('all'); // for beds tab

  // Filter data based on search terms
  const filteredFloors = floors.filter(floor =>
    floor.name?.toLowerCase().includes(floorSearchTerm.toLowerCase()) ||
    floor.description?.toLowerCase().includes(floorSearchTerm.toLowerCase()) ||
    floor.floorNumber?.toString().includes(floorSearchTerm)
  );

  const filteredRooms = rooms.filter(room => {
    const floor = floors.find(f => f.id === room.floorId);
    
    // Floor filter - fix: compare strings, not integers
    const matchesFloorFilter = selectedFloorFilter === 'all' || room.floorId === selectedFloorFilter;
    
    // Search filter
    const matchesSearch = roomSearchTerm === '' || (
      room.roomNumber?.toLowerCase().includes(roomSearchTerm.toLowerCase()) ||
      room.name?.toLowerCase().includes(roomSearchTerm.toLowerCase()) ||
      room.type?.toLowerCase().includes(roomSearchTerm.toLowerCase()) ||
      floor?.name?.toLowerCase().includes(roomSearchTerm.toLowerCase()) ||
      room.amenities?.some(amenity => amenity?.toLowerCase().includes(roomSearchTerm.toLowerCase()))
    );
    
    return matchesFloorFilter && matchesSearch;
  });

  const filteredBeds = beds.filter(bed => {
    const room = rooms.find(r => r.id === bed.roomId);
    const floor = floors.find(f => f.id === room?.floorId);
    
    // Room filter - fix: compare strings, not integers
    const matchesRoomFilter = selectedRoomFilter === 'all' || bed.roomId === selectedRoomFilter;
    
    // Search filter
    const matchesSearch = bedSearchTerm === '' || (
      bed.bedNumber?.toLowerCase().includes(bedSearchTerm.toLowerCase()) ||
      bed.bedType?.toLowerCase().includes(bedSearchTerm.toLowerCase()) ||
      room?.roomNumber?.toLowerCase().includes(bedSearchTerm.toLowerCase()) ||
      room?.name?.toLowerCase().includes(bedSearchTerm.toLowerCase()) ||
      floor?.name?.toLowerCase().includes(bedSearchTerm.toLowerCase())
    );
    
    return matchesRoomFilter && matchesSearch;
  });

  const tabs = [
    { id: 'floors', label: 'Floors', icon: Building, count: filteredFloors.length, total: floors.length },
    { id: 'rooms', label: 'Rooms', icon: Home, count: filteredRooms.length, total: rooms.length },
    { id: 'beds', label: 'Beds', icon: Bed, count: filteredBeds.length, total: beds.length }
  ];

  // Property handlers
  const handleCreateProperty = async (propertyData) => {
    try {
      const response = await propertyService.createProperty(propertyData);
      if (response.success) {
        // Update Redux store
        dispatch(createProperty.fulfilled(response.data));
        dispatch(addToast({
          title: 'Property Created',
          description: `${propertyData.name} has been created successfully.`,
          variant: 'success'
        }));
        setShowPropertyModal(false);
      } else {
        throw new Error(response.message || 'Failed to create property');
      }
    } catch (error) {
      console.error('Error creating property:', error);
      dispatch(addToast({
        title: 'Error',
        description: error.message || 'Failed to create property. Please try again.',
        variant: 'error'
      }));
    }
  };

  // Floor handlers
  const handleAddFloor = () => {
    // Check if user has a property first
    if (!selectedProperty?.id) {
      dispatch(addToast({
        title: 'Property Required',
        description: 'Please create a property first before adding floors.',
        variant: 'error'
      }));
      setShowPropertyModal(true);
      return;
    }
    
    setEditingFloor(null);
    setShowFloorModal(true);
  };

  const handleEditFloor = (floor) => {
    setEditingFloor(floor);
    setShowFloorModal(true);
  };

  const handleFloorSubmit = async (floorData) => {
    // Check if user has a property selected
    if (!selectedProperty?.id) {
      dispatch(addToast({
        title: 'Property Required',
        description: 'Please create a property first before adding floors.',
        variant: 'error'
      }));
      setShowPropertyModal(true);
      return;
    }

    // Validate required fields (this should not happen due to button disabled state, but keeping as safety)
    if (!floorData.name || !floorData.name.trim()) {
      dispatch(addToast({
        title: 'Validation Error',
        description: 'Floor name is required.',
        variant: 'error'
      }));
      return;
    }

    if (floorData.floorNumber === undefined || floorData.floorNumber === null || floorData.floorNumber === '') {
      dispatch(addToast({
        title: 'Validation Error',
        description: 'Floor number is required.',
        variant: 'error'
      }));
      return;
    }

    // Validate capacity for new floor
    if (!editingFloor) {
      const propertyWithCurrentData = {
        ...selectedProperty,
        floors: floors
      };
      
      const capacityValidation = validateCapacity(propertyWithCurrentData, floorData, 'floor');
      if (!capacityValidation.isValid) {
        dispatch(addToast({
          title: 'Capacity Limit Reached',
          description: capacityValidation.errors.join(', '),
          variant: 'error'
        }));
        return;
      }
    }

    try {
      setFloorLoading(true);
      
      if (editingFloor) {
        await dispatch(updateFloor({ id: editingFloor.id, ...floorData })).unwrap();
        dispatch(addToast({
          title: 'Floor Updated',
          description: 'Floor has been updated successfully.',
          variant: 'success'
        }));
      } else {
        const floorDataWithProperty = {
          name: floorData.name.trim(),
          floorNumber: parseInt(floorData.floorNumber),
          description: floorData.description?.trim() || '',
          propertyId: selectedProperty.id
        };
        
        await dispatch(createFloor(floorDataWithProperty)).unwrap();
        dispatch(addToast({
          title: 'Floor Added',
          description: 'New floor has been added successfully.',
          variant: 'success'
        }));
      }

      setEditingFloor(null);
      setShowFloorModal(false);
    } catch (error) {
      console.error('Error with floor operation:', error);
      dispatch(addToast({
        title: 'Error',
        description: error || 'Failed to process floor operation',
        variant: 'error'
      }));
    } finally {
      setFloorLoading(false);
    }
  };

  const handleDeleteFloor = (floorId) => {
    const floor = floors.find(f => f.id === floorId);
    const roomsInFloor = rooms.filter(room => room.floorId === floorId);
    const bedsInFloor = beds.filter(bed => {
      const room = rooms.find(r => r.id === bed.roomId);
      return room && room.floorId === floorId;
    });

    const cascadeInfo = [];
    if (roomsInFloor.length > 0) {
      cascadeInfo.push(`${roomsInFloor.length} room${roomsInFloor.length > 1 ? 's' : ''}`);
    }
    if (bedsInFloor.length > 0) {
      cascadeInfo.push(`${bedsInFloor.length} bed${bedsInFloor.length > 1 ? 's' : ''}`);
    }

    setDeleteConfirmation({
      isOpen: true,
      type: 'floor',
      item: floor,
      cascadeInfo: cascadeInfo.length > 0 ? cascadeInfo : null,
      loading: false
    });
  };

  const handleDeleteRoom = (roomId) => {
    const room = rooms.find(r => r.id === roomId);
    const roomBeds = beds.filter(bed => bed.roomId === roomId);

    const cascadeInfo = [];
    if (roomBeds.length > 0) {
      cascadeInfo.push(`${roomBeds.length} bed${roomBeds.length > 1 ? 's' : ''}`);
    }

    setDeleteConfirmation({
      isOpen: true,
      type: 'room',
      item: room,
      cascadeInfo: cascadeInfo.length > 0 ? cascadeInfo : null,
      loading: false
    });
  };

  const handleDeleteBed = (bedId) => {
    const bed = beds.find(b => b.id === bedId);
    
    setDeleteConfirmation({
      isOpen: true,
      type: 'bed',
      item: bed,
      cascadeInfo: null, // Beds don't have cascade deletes
      loading: false
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmation.type || !deleteConfirmation.item) return;

    setDeleteConfirmation(prev => ({ ...prev, loading: true }));

    switch (deleteConfirmation.type) {
      case 'floor':
        dispatch(deleteFloor(deleteConfirmation.item.id));
        break;
      case 'room':
        dispatch(deleteRoom(deleteConfirmation.item.id));
        break;
      case 'bed':
        dispatch(deleteBed(deleteConfirmation.item.id));
        break;
      case 'tenant':
        dispatch(deleteTenant(deleteConfirmation.item.id));
        break;
      default:
        console.warn('Unknown delete type:', deleteConfirmation.type);
    }

    setDeleteConfirmation({ isOpen: false, type: null, item: null, loading: false });
  };

  // Navigation handlers
  const handleFloorClick = (floorId) => {
    // Set the floor filter and navigate to rooms tab
    setSelectedFloorFilter(floorId.toString());
    setActiveTab('rooms');
    // Clear room search to show all rooms for the selected floor
    setRoomSearchTerm('');
  };

  const handleRoomClick = (roomId) => {
    // Set the room filter and navigate to beds tab
    setSelectedRoomFilter(roomId.toString());
    setActiveTab('beds');
    // Clear bed search to show all beds for the selected room
    setBedSearchTerm('');
  };

  // Room handlers
  const handleAddRoom = () => {
    setEditingRoom(null);
    setShowRoomModal(true);
  };

  const handleEditRoom = (room) => {
    setEditingRoom(room);
    setShowRoomModal(true);
  };

  const handleRoomSubmit = async (roomData) => {
    // Validate required fields (this should not happen due to button disabled state, but keeping as safety)
    if (!roomData.roomNumber || !roomData.roomNumber.trim()) {
      dispatch(addToast({
        title: 'Validation Error',
        description: 'Room number is required.',
        variant: 'error'
      }));
      return;
    }

    if (!roomData.floorId) {
      dispatch(addToast({
        title: 'Validation Error',
        description: 'Please select a floor for this room.',
        variant: 'error'
      }));
      return;
    }

    if (!roomData.capacity || roomData.capacity < 1 || roomData.capacity > 12) {
      dispatch(addToast({
        title: 'Validation Error',
        description: 'Room capacity must be between 1 and 12 beds.',
        variant: 'error'
      }));
      return;
    }

    // Validate capacity for new room
    if (!editingRoom && selectedProperty) {
      const propertyWithCurrentData = {
        ...selectedProperty,
        floors: floors.map(floor => ({
          ...floor,
          rooms: rooms.filter(room => room.floorId === floor.id)
        }))
      };
      
      const capacityValidation = validateCapacity(propertyWithCurrentData, roomData, 'room');
      if (!capacityValidation.isValid) {
        dispatch(addToast({
          title: 'Capacity Limit Reached',
          description: capacityValidation.errors.join(', '),
          variant: 'error'
        }));
        return;
      }
    }

    try {
      setRoomLoading(true);
      
      if (editingRoom) {
        await dispatch(updateRoom({ id: editingRoom.id, ...roomData })).unwrap();
        dispatch(addToast({
          title: 'Room Updated',
          description: 'Room has been updated successfully.',
          variant: 'success'
        }));
      } else {
        await dispatch(createRoom(roomData)).unwrap();
        dispatch(addToast({
          title: 'Room Added',
          description: 'New room has been added successfully.',
          variant: 'success'
        }));
      }

      setEditingRoom(null);
      setShowRoomModal(false);
    } catch (error) {
      console.error('Error with room operation:', error);
      dispatch(addToast({
        title: 'Error',
        description: error || 'Failed to process room operation',
        variant: 'error'
      }));
    } finally {
      setRoomLoading(false);
    }
  };

  // Bed handlers
  const handleAddBed = () => {
    setEditingBed(null);
    setShowBedModal(true);
  };

  const handleEditBed = (bed) => {
    setEditingBed(bed);
    setShowBedModal(true);
  };

  const handleBedSubmit = async (bedData) => {
    // Validate required fields (this should not happen due to button disabled state, but keeping as safety)
    if (!bedData.bedNumber || !bedData.bedNumber.trim()) {
      dispatch(addToast({
        title: 'Validation Error',
        description: 'Bed number is required.',
        variant: 'error'
      }));
      return;
    }

    if (!bedData.roomId) {
      dispatch(addToast({
        title: 'Validation Error',
        description: 'Please select a room for this bed.',
        variant: 'error'
      }));
      return;
    }

    if (!bedData.rent || bedData.rent < 1000) {
      dispatch(addToast({
        title: 'Validation Error',
        description: 'Monthly rent must be at least ₹1,000.',
        variant: 'error'
      }));
      return;
    }

    if (!bedData.deposit || bedData.deposit < 0) {
      dispatch(addToast({
        title: 'Validation Error',
        description: 'Security deposit cannot be negative.',
        variant: 'error'
      }));
      return;
    }

    // Validate capacity for new bed
    if (!editingBed && selectedProperty) {
      const propertyWithCurrentData = {
        ...selectedProperty,
        floors: floors.map(floor => ({
          ...floor,
          rooms: rooms.filter(room => room.floorId === floor.id).map(room => ({
            ...room,
            beds: beds.filter(bed => bed.roomId === room.id)
          }))
        }))
      };
      
      const capacityValidation = validateCapacity(propertyWithCurrentData, bedData, 'bed');
      if (!capacityValidation.isValid) {
        dispatch(addToast({
          title: 'Capacity Limit Reached',
          description: capacityValidation.errors.join(', '),
          variant: 'error'
        }));
        return;
      }
    }

    try {
      setBedLoading(true);
      
      if (editingBed) {
        await dispatch(updateBed({ id: editingBed.id, ...bedData })).unwrap();
        dispatch(addToast({
          title: 'Bed Updated',
          description: 'Bed has been updated successfully.',
          variant: 'success'
        }));
      } else {
        await dispatch(addBed(bedData)).unwrap();
        dispatch(addToast({
          title: 'Bed Added',
          description: 'New bed has been added successfully.',
          variant: 'success'
        }));
      }

      setEditingBed(null);
      setShowBedModal(false);
    } catch (error) {
      console.error('Error with bed operation:', error);
      dispatch(addToast({
        title: 'Error',
        description: error || 'Failed to process bed operation',
        variant: 'error'
      }));
    } finally {
      setBedLoading(false);
    }
  };

  // Floor filter options for rooms tab
  const floorFilterOptions = [
    { value: 'all', label: 'All Floors' },
    ...floors.map(floor => ({
      value: floor.id,
      label: floor.name || `Floor ${floor.floorNumber}`
    }))
  ];

  // Delete confirmation states
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    type: null, // 'floor', 'room', 'bed'
    item: null,
    loading: false
  });

  // Tenant management functions
  const handleTenantSubmit = (tenantData) => {
    console.log('🔧 Submitting tenant:', tenantData);
    
    if (editingTenant) {
      dispatch(updateTenant({ id: editingTenant.id, ...tenantData }));
    } else {
      dispatch(createTenant({ ...tenantData, propertyId: selectedProperty.id }));
    }
    
    setEditingTenant(null);
    setShowTenantModal(false);
  };

  const handleEditTenant = (tenant) => {
    console.log('🔧 Editing tenant:', tenant);
    setEditingTenant(tenant);
    setShowTenantModal(true);
  };

  const handleDeleteTenant = (tenant) => {
    const bedInfo = tenant.bed ? `Bed ${tenant.bed.bedNumber} in Room ${tenant.bed.room?.roomNumber}` : 'No bed assigned';
    
    setDeleteItem({
      type: 'tenant',
      item: tenant,
      title: `Delete Tenant: ${tenant.fullName}`,
      message: `Are you sure you want to delete tenant "${tenant.fullName}"?`,
      details: [
        `📱 Phone: ${tenant.phone}`,
        `🏠 Current Assignment: ${bedInfo}`,
        `💰 Security Deposit: ₹${tenant.securityDeposit || 0}`,
        `📅 Joined: ${new Date(tenant.joiningDate).toLocaleDateString()}`
      ],
      warnings: tenant.bed ? [
        '⚠️ This will vacate the assigned bed',
        '⚠️ Any pending payments will need to be settled separately'
      ] : []
    });
    setShowDeleteConfirm(true);
  };

  const handleAssignTenantToBed = (tenantId, bedId) => {
    console.log('🔧 Assigning tenant to bed:', { tenantId, bedId });
    dispatch(assignTenant({ tenantId, bedId }));
  };

  const handleVacateTenant = (tenantId) => {
    console.log('🔧 Vacating tenant:', tenantId);
    dispatch(vacateTenant(tenantId));
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-gray-50 via-white to-blue-50 min-h-screen">
      {/* Page Header with Property Selection */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Rooms Management</h1>
        <div className="flex items-center justify-between mt-2">
          <p className="text-gray-600">Manage your floors, rooms, and bed assignments</p>
          
          {/* Property Selection Info */}
          <div className="flex items-center space-x-3">
            {selectedProperty ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-lg">
                  <Building className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    {selectedProperty.name}
                  </span>
                </div>
                <CapacityIndicator 
                  property={{
                    ...selectedProperty,
                    floors: floors.map(floor => ({
                      ...floor,
                      rooms: rooms.filter(room => room.floorId === floor.id).map(room => ({
                        ...room,
                        beds: beds.filter(bed => bed.roomId === room.id)
                      }))
                    }))
                  }} 
                  showDetails={false} 
                />
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">No property selected</span>
                <Button size="sm" onClick={() => setShowPropertyModal(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Create Property
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Show property creation prompt if no property exists */}
      {properties.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">Welcome to Rooms Management!</h3>
            <p className="text-gray-600 mb-6">
              To get started, you need to create your first property. This will be your PG/Hostel that you want to manage.
            </p>
            <Button onClick={() => setShowPropertyModal(true)} size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Property
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Tab Navigation */}
          <nav className="flex space-x-8 border-b border-gray-200">
            {['floors', 'rooms', 'beds'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>

          {/* Tab Content */}
          <div>
            {/* Floors Tab */}
            {activeTab === 'floors' && (
              <div className="space-y-6">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                  <h2 className="text-xl font-semibold">
                    Floors ({filteredFloors.length}{filteredFloors.length !== floors.length ? `/${floors.length}` : ''})
                  </h2>
                  
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {/* Search Bar */}
                    {floors.length > 0 && (
                      <div className="w-full sm:w-80">
                        <Input
                          placeholder="Search floors by name, number, or description..."
                          value={floorSearchTerm}
                          onChange={(e) => setFloorSearchTerm(e.target.value)}
                          className="w-full"
                        />
                      </div>
                    )}

                    <div className="flex items-center space-x-3">
                      {/* View Mode Toggle */}
                      {floors.length > 0 && (
                        <div className="flex items-center bg-gray-100 rounded-lg p-1">
                          <button
                            onClick={() => setFloorViewMode('table')}
                            className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                              floorViewMode === 'table'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            <List className="w-4 h-4" />
                            <span>Table</span>
                          </button>
                          <button
                            onClick={() => setFloorViewMode('cards')}
                            className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                              floorViewMode === 'cards'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            <Grid3X3 className="w-4 h-4" />
                            <span>Cards</span>
                          </button>
                        </div>
                      )}
                      
                      <Button onClick={handleAddFloor}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Floor
                      </Button>
                    </div>
                  </div>
                </div>
                
                {floors.length > 0 && filteredFloors.length > 0 && (
                  <div>
                    {floorViewMode === 'table' ? (
                      <Card>
                        <CardContent className="p-0">
                          <FloorTable
                            floors={filteredFloors}
                            onEdit={handleEditFloor}
                            onDelete={handleDeleteFloor}
                            onClick={handleFloorClick}
                          />
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredFloors.map((floor) => (
                          <FloorCard
                            key={floor.id}
                            floor={floor}
                            onEdit={handleEditFloor}
                            onDelete={handleDeleteFloor}
                            onClick={handleFloorClick}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {floors.length === 0 && (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No floors found</h3>
                      <p className="text-gray-500 mb-4">
                        Get started by adding your first floor.
                      </p>
                      <Button onClick={handleAddFloor}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Floor
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {floors.length > 0 && filteredFloors.length === 0 && (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No floors match your search</h3>
                      <p className="text-gray-500 mb-4">
                        Try adjusting your search terms or clear the search to see all floors.
                      </p>
                      <Button variant="outline" onClick={() => setFloorSearchTerm('')}>
                        Clear Search
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Rooms Tab */}
            {activeTab === 'rooms' && (
              <div className="space-y-6">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                  <h2 className="text-xl font-semibold">
                    Rooms ({filteredRooms.length}{filteredRooms.length !== rooms.length ? `/${rooms.length}` : ''})
                  </h2>
                  
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {/* Search Bar and Floor Filter */}
                    {floors.length > 0 && rooms.length > 0 && (
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="w-full sm:w-80">
                          <Input
                            placeholder="Search rooms by number, name, type, floor, or amenities..."
                            value={roomSearchTerm}
                            onChange={(e) => setRoomSearchTerm(e.target.value)}
                            className="w-full"
                          />
                        </div>
                        <div className="w-full sm:w-48">
                          <Dropdown
                            options={floorFilterOptions}
                            value={selectedFloorFilter}
                            onChange={setSelectedFloorFilter}
                            placeholder="Filter by floor"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-3">
                      {/* View Mode Toggle */}
                      {rooms.length > 0 && (
                        <div className="flex items-center bg-gray-100 rounded-lg p-1">
                          <button
                            onClick={() => setRoomViewMode('table')}
                            className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                              roomViewMode === 'table'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            <List className="w-4 h-4" />
                            <span>Table</span>
                          </button>
                          <button
                            onClick={() => setRoomViewMode('cards')}
                            className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                              roomViewMode === 'cards'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            <Grid3X3 className="w-4 h-4" />
                            <span>Cards</span>
                          </button>
                        </div>
                      )}
                      
                      <Button onClick={handleAddRoom} disabled={floors.length === 0}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Room
                      </Button>
                    </div>
                  </div>
                </div>

                {floors.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Building className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Please add at least one floor before creating rooms.</p>
                    </CardContent>
                  </Card>
                )}
                
                {floors.length > 0 && rooms.length > 0 && filteredRooms.length > 0 && (
                  <div>
                    {roomViewMode === 'table' ? (
                      <Card>
                        <CardContent className="p-0">
                          <RoomTable
                            rooms={filteredRooms}
                            onEdit={handleEditRoom}
                            onDelete={handleDeleteRoom}
                            onClick={handleRoomClick}
                          />
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRooms.map((room) => (
                          <RoomCard
                            key={room.id}
                            room={room}
                            onEdit={handleEditRoom}
                            onDelete={handleDeleteRoom}
                            onClick={handleRoomClick}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {rooms.length === 0 && floors.length > 0 && (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Home className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms found</h3>
                      <p className="text-gray-500 mb-4">
                        Add rooms to your floors to start managing accommodations.
                      </p>
                      <Button onClick={handleAddRoom}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Room
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {floors.length > 0 && rooms.length > 0 && filteredRooms.length === 0 && (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Home className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms match your search</h3>
                      <p className="text-gray-500 mb-4">
                        Try adjusting your search terms or clear the search to see all rooms.
                      </p>
                      <Button variant="outline" onClick={() => {
                        setRoomSearchTerm('');
                        setSelectedFloorFilter('all');
                      }}>
                        Clear Filters
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Beds Tab */}
            {activeTab === 'beds' && (
              <div className="space-y-6">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                  <h2 className="text-xl font-semibold">
                    Beds ({filteredBeds.length}{filteredBeds.length !== beds.length ? `/${beds.length}` : ''})
                  </h2>
                  
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {/* Search Bar and Room Filter */}
                    {rooms.length > 0 && beds.length > 0 && (
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="w-full sm:w-80">
                          <Input
                            placeholder="Search beds by number, type, status, room, or tenant..."
                            value={bedSearchTerm}
                            onChange={(e) => setBedSearchTerm(e.target.value)}
                            className="w-full"
                          />
                        </div>
                        <div className="w-full sm:w-48">
                          <Dropdown
                            options={[
                              { value: 'all', label: 'All Rooms' },
                              ...rooms.map(room => {
                                const floor = floors.find(f => f.id === room.floorId);
                                return {
                                  value: room.id.toString(),
                                  label: `${room.roomNumber} (${floor?.floorName || 'Unknown Floor'})`
                                };
                              })
                            ]}
                            value={selectedRoomFilter}
                            onChange={setSelectedRoomFilter}
                            placeholder="Filter by room"
                            searchable
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-3">
                      {/* View Mode Toggle */}
                      {beds.length > 0 && (
                        <div className="flex items-center bg-gray-100 rounded-lg p-1">
                          <button
                            onClick={() => setBedViewMode('table')}
                            className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                              bedViewMode === 'table'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            <List className="w-4 h-4" />
                            <span>Table</span>
                          </button>
                          <button
                            onClick={() => setBedViewMode('cards')}
                            className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                              bedViewMode === 'cards'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            <Grid3X3 className="w-4 h-4" />
                            <span>Cards</span>
                          </button>
                        </div>
                      )}
                      
                      <Button onClick={handleAddBed} disabled={rooms.length === 0}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Bed
                      </Button>
                    </div>
                  </div>
                </div>

                {rooms.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Home className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Please add at least one room before creating beds.</p>
                    </CardContent>
                  </Card>
                )}
                
                {rooms.length > 0 && beds.length > 0 && filteredBeds.length > 0 && (
                  <div>
                    {bedViewMode === 'table' ? (
                      <Card>
                        <CardContent className="p-0">
                          <BedTable
                            beds={filteredBeds}
                            onEdit={handleEditBed}
                            onDelete={handleDeleteBed}
                          />
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredBeds.map((bed) => (
                          <BedCard
                            key={bed.id}
                            bed={bed}
                            onEdit={handleEditBed}
                            onDelete={handleDeleteBed}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {beds.length === 0 && rooms.length > 0 && (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Bed className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No beds found</h3>
                      <p className="text-gray-500 mb-4">
                        Add beds to your rooms to manage individual tenant assignments.
                      </p>
                      <Button onClick={handleAddBed}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Bed
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {rooms.length > 0 && beds.length > 0 && filteredBeds.length === 0 && (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Bed className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No beds match your search</h3>
                      <p className="text-gray-500 mb-4">
                        Try adjusting your search terms or clear the search to see all beds.
                      </p>
                      <Button variant="outline" onClick={() => {
                        setBedSearchTerm('');
                        setSelectedRoomFilter('all');
                      }}>
                        Clear Filters
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Modals */}
      <PropertyFormModal
        isOpen={showPropertyModal}
        onClose={() => setShowPropertyModal(false)}
        onSubmit={handleCreateProperty}
      />

      <FloorFormModal
        isOpen={showFloorModal}
        onClose={() => {
          setShowFloorModal(false);
          setEditingFloor(null);
        }}
        floor={editingFloor}
        onSubmit={handleFloorSubmit}
        loading={floorLoading}
      />

      <RoomFormModal
        isOpen={showRoomModal}
        onClose={() => {
          setShowRoomModal(false);
          setEditingRoom(null);
        }}
        room={editingRoom}
        onSubmit={handleRoomSubmit}
        loading={roomLoading}
      />

      <BedFormModal
        isOpen={showBedModal}
        onClose={() => {
          setShowBedModal(false);
          setEditingBed(null);
        }}
        bed={editingBed}
        onSubmit={handleBedSubmit}
        loading={bedLoading}
      />

      <TenantFormModal
        isOpen={showTenantModal}
        onClose={() => {
          setShowTenantModal(false);
          setEditingTenant(null);
        }}
        tenant={editingTenant}
        onSubmit={handleTenantSubmit}
        availableBeds={beds.filter(bed => !bed.tenant)}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, type: null, item: null, loading: false })}
        onConfirm={handleConfirmDelete}
        loading={deleteConfirmation.loading}
        title={`Delete ${deleteConfirmation.type ? deleteConfirmation.type.charAt(0).toUpperCase() + deleteConfirmation.type.slice(1) : ''}`}
        message={`Are you sure you want to delete ${
          deleteConfirmation.type === 'floor' ? `${deleteConfirmation.item?.name}` :
          deleteConfirmation.type === 'room' ? `Room ${deleteConfirmation.item?.roomNumber}` :
          deleteConfirmation.type === 'bed' ? `Bed ${deleteConfirmation.item?.bedNumber}` :
          deleteConfirmation.type === 'tenant' ? `${deleteConfirmation.item?.fullName}` : 'this item'
        }?`}
        cascadeInfo={deleteConfirmation.cascadeInfo}
      />
    </div>
  );
} 