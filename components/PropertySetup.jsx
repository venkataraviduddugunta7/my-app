'use client';

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { createProperty } from '@/store/slices/propertySlice';
import { addToast } from '@/store/slices/uiSlice';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Modal, ModalFooter } from '@/components/ui';
import { Building, Plus } from 'lucide-react';

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
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Your First Property" size="lg">
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

export default function PropertySetup({ properties, onPropertyCreated }) {
  const dispatch = useDispatch();
  const [showModal, setShowModal] = useState(false);

  const handleCreateProperty = async (propertyData) => {
    try {
      const result = await dispatch(createProperty(propertyData));
      if (result.type === 'property/createProperty/fulfilled') {
        dispatch(addToast({
          title: 'Property Created',
          description: `${propertyData.name} has been created successfully.`,
          variant: 'success'
        }));
        setShowModal(false);
        if (onPropertyCreated) {
          onPropertyCreated(result.payload);
        }
      }
    } catch (error) {
      dispatch(addToast({
        title: 'Error',
        description: 'Failed to create property. Please try again.',
        variant: 'error'
      }));
    }
  };

  if (properties.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle>Welcome to PG Manager!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              To get started, you need to create your first property. This will be your PG/Hostel that you want to manage.
            </p>
            <Button onClick={() => setShowModal(true)} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Property
            </Button>
          </CardContent>
        </Card>

        <PropertyFormModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={handleCreateProperty}
        />
      </div>
    );
  }

  return null;
} 