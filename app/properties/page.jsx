"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import propertyService from "@/services/propertyService";
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Bed,
  Users,
  DollarSign,
  Check,
  X,
  Home,
  Phone,
  Mail,
  Globe,
  Calendar,
  Shield,
  Wifi,
  Car,
  Coffee,
  Dumbbell,
  ShowerHead,
  Tv,
  Wind,
  ChefHat,
  ShieldCheck,
  Sparkles,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { addToast } from "@/store/slices/uiSlice";
import {
  selectProperty,
  setSelectedProperty,
} from "@/store/slices/propertySlice";
import { formatCurrency } from "@/lib/utils";

// Default property structure for form initialization
const DEFAULT_PROPERTY = {
  name: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  description: "",
  totalFloors: "",
  totalRooms: "",
  totalBeds: "",
  monthlyRent: "",
  securityDeposit: "",
  amenities: [],
  phone: "",
  email: "",
  website: "",
  type: "Co-ed",
};

const AMENITY_OPTIONS = [
  { value: "WiFi", label: "WiFi", icon: Wifi },
  { value: "AC", label: "Air Conditioning", icon: Wind },
  { value: "Parking", label: "Parking", icon: Car },
  { value: "Gym", label: "Gym", icon: Dumbbell },
  { value: "Hot Water", label: "Hot Water", icon: ShowerHead },
  { value: "TV", label: "Television", icon: Tv },
  { value: "Kitchen", label: "Kitchen", icon: ChefHat },
  { value: "Security", label: "24/7 Security", icon: ShieldCheck },
  { value: "Laundry", label: "Laundry", icon: Coffee },
  { value: "CCTV", label: "CCTV Surveillance", icon: Shield },
];

export default function PropertiesPage() {
  const dispatch = useDispatch();
  const { selectedProperty } = useSelector((state) => state.property);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState(null);

  const [formData, setFormData] = useState(DEFAULT_PROPERTY);

  // Fetch properties on component mount
  useEffect(() => {
    fetchProperties();
  }, []);

  // Listen for real-time property updates
  useEffect(() => {
    const handlePropertyUpdate = () => {
      fetchProperties(); // Refresh the properties list
    };

    // Listen for property updates from WebSocket
    if (typeof window !== 'undefined') {
      window.addEventListener('property-update', handlePropertyUpdate);
      return () => {
        window.removeEventListener('property-update', handlePropertyUpdate);
      };
    }
  }, []);

  // Set the first property as selected if none is selected
  useEffect(() => {
    if (!selectedProperty && properties.length > 0) {
      handleSelectProperty(properties[0]);
    }
  }, [selectedProperty, properties]);

  // Fetch properties from API
  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await propertyService.getProperties();
      
      if (response.success) {
        setProperties(response.data || []);
      } else {
        throw new Error('Failed to fetch properties');
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      setError(error.message);
      dispatch(
        addToast({
          title: "Error",
          description: "Failed to load properties. Please try again.",
          variant: "error",
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProperty = (property) => {
    dispatch(setSelectedProperty(property));
    dispatch(
      addToast({
        title: "Property Selected",
        description: `Switched to ${property.name}`,
        variant: "success",
      })
    );
  };

  const handleAddProperty = () => {
    setEditingProperty(null);
    setFormData(DEFAULT_PROPERTY);
    setShowModal(true);
  };

  const handleEditProperty = (property) => {
    setEditingProperty(property);
    setFormData({
      name: property.name || "",
      address: property.address || "",
      city: property.city || "",
      state: property.state || "",
      pincode: property.pincode || "",
      description: property.description || "",
      totalFloors: property.totalFloors || "",
      totalRooms: property.totalRooms || "",
      totalBeds: property.totalBeds || "",
      monthlyRent: property.monthlyRent || "",
      securityDeposit: property.securityDeposit || "",
      amenities: property.amenities || [],
      phone: property.phone || "",
      email: property.email || "",
      website: property.website || "",
      type: property.type || "Co-ed",
    });
    setShowModal(true);
  };

  const handleDeleteProperty = (propertyId) => {
    const property = properties.find(p => p.id === propertyId);
    setPropertyToDelete(property);
    setShowDeleteModal(true);
  };

  const confirmDeleteProperty = async () => {
    if (!propertyToDelete) return;

    try {
      setSubmitting(true);
      const response = await propertyService.deleteProperty(propertyToDelete.id);
      
      if (response.success) {
        // Refresh properties list
        await fetchProperties();
        
        // Clear selected property if it was deleted
        if (selectedProperty?.id === propertyToDelete.id) {
          dispatch(setSelectedProperty(null));
        }
        
        dispatch(
          addToast({
            title: "Property Deleted",
            description: response.message || "Property has been deleted successfully",
            variant: "success",
          })
        );
        
        setShowDeleteModal(false);
        setPropertyToDelete(null);
      } else {
        throw new Error(response.message || 'Failed to delete property');
      }
    } catch (error) {
      console.error('Error deleting property:', error);
      dispatch(
        addToast({
          title: "Error",
          description: error.message || "Failed to delete property. Please try again.",
          variant: "error",
        })
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.address || !formData.totalBeds) {
      dispatch(
        addToast({
          title: "Missing Information",
          description: "Please fill in all required fields",
          variant: "warning",
        })
      );
      return;
    }

    try {
      setSubmitting(true);
      let response;

      if (editingProperty) {
        // Update existing property
        response = await propertyService.updateProperty(editingProperty.id, formData);
      } else {
        // Add new property
        response = await propertyService.createProperty(formData);
      }

      if (response.success) {
        // Refresh properties list
        await fetchProperties();
        
        dispatch(
          addToast({
            title: editingProperty ? "Property Updated" : "Property Added",
            description: response.message || `${formData.name} has been ${editingProperty ? 'updated' : 'added'} successfully`,
            variant: "success",
          })
        );
        
        setShowModal(false);
      } else {
        throw new Error(response.message || 'Failed to save property');
      }
    } catch (error) {
      console.error('Error saving property:', error);
      dispatch(
        addToast({
          title: "Error",
          description: error.message || "Failed to save property. Please try again.",
          variant: "error",
        })
      );
    } finally {
      setSubmitting(false);
    }
  };

  const toggleAmenity = (amenity) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  // Filter properties based on search and filter criteria
  const filteredProperties = properties.filter((property) => {
    const matchesSearch = !searchTerm || 
      property.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.city?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterType === "all" || property.type === filterType;

    return matchesSearch && matchesFilter;
  });

  const getOccupancyColor = (occupancy) => {
    if (occupancy >= 90) return "text-green-600 bg-green-100";
    if (occupancy >= 70) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  // Show loading state
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Properties</h1>
            <p className="text-gray-600 mt-1">
              Manage all your PG properties in one place
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          <span className="ml-2 text-gray-600">Loading properties...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Properties</h1>
            <p className="text-gray-600 mt-1">
              Manage all your PG properties in one place
            </p>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <Building2 className="h-12 w-12 mx-auto mb-2" />
            <h3 className="text-lg font-semibold">Error Loading Properties</h3>
            <p className="text-gray-600">{error}</p>
          </div>
          <Button onClick={fetchProperties} className="gap-2">
            <Building2 className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Properties</h1>
          <p className="text-gray-600 mt-1">
            Manage all your PG properties in one place
          </p>
        </div>
        <Button 
          onClick={handleAddProperty} 
          className="gap-2"
          disabled={submitting}
        >
          <Plus className="h-4 w-4" />
          Add Property
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search properties..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={Search}
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          {["all", "Men", "Women", "Co-ed"].map((type) => (
            <Button
              key={type}
              variant={filterType === type ? "primary" : "outline"}
              onClick={() => setFilterType(type)}
              size="sm"
            >
              {type === "all" ? "All" : type}
            </Button>
          ))}
        </div>
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredProperties.map((property, index) => {
            // Calculate occupancy rate safely
            const totalBeds = property.totalBeds || 0;
            const occupiedBeds = property.occupiedBeds || 0;
            const occupancyRate = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;
            const isSelected = selectedProperty?.id === property.id;

            return (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`relative overflow-hidden hover:shadow-xl transition-all duration-300 ${
                    isSelected ? "ring-2 ring-primary-500 shadow-glow" : ""
                  }`}
                >
                  {/* Selected Badge */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 z-10">
                      <span className="px-2 py-1 bg-primary-500 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Active
                      </span>
                    </div>
                  )}

                  {/* Card Header */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white shadow-glow-sm">
                          <Building2 className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {property.name}
                          </h3>
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                            {property.type}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Property Info */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{property.address || 'No address'}</span>
                      </div>
                      {property.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-4 w-4" />
                          <span>{property.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">Total Beds</p>
                        <p className="text-xl font-bold">{totalBeds}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Occupied</p>
                        <p className="text-xl font-bold">{occupiedBeds}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Monthly Rent</p>
                        <p className="text-lg font-semibold">
                          {property.monthlyRent ? formatCurrency(property.monthlyRent) : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Occupancy</p>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${getOccupancyColor(
                            occupancyRate
                          )}`}
                        >
                          {occupancyRate.toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {/* Amenities */}
                    {property.amenities && property.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {property.amenities.slice(0, 3).map((amenity) => (
                          <span
                            key={amenity}
                            className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded"
                          >
                            {amenity}
                          </span>
                        ))}
                        {property.amenities.length > 3 && (
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                            +{property.amenities.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      {!isSelected && (
                        <Button
                          variant="primary"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleSelectProperty(property)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Select
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className={isSelected ? "flex-1" : ""}
                        onClick={() => handleEditProperty(property)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteProperty(property.id)}
                        className="text-red-600 hover:bg-red-50"
                        disabled={submitting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredProperties.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No properties found
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm
              ? "Try adjusting your search criteria"
              : "Get started by adding your first property"}
          </p>
          {!searchTerm && (
            <Button onClick={handleAddProperty}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Property
            </Button>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingProperty ? "Edit Property" : "Add New Property"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Property Name"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Sunrise PG"
              />
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-lg bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                >
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                  <option value="Co-ed">Co-ed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Address
            </h3>
            <div className="space-y-4">
              <Input
                label="Street Address"
                required
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="e.g., 123 Main Street"
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="City"
                  required
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  placeholder="e.g., Bangalore"
                />
                <Input
                  label="State"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                  placeholder="e.g., Karnataka"
                />
                <Input
                  label="Pincode"
                  value={formData.pincode}
                  onChange={(e) =>
                    setFormData({ ...formData, pincode: e.target.value })
                  }
                  placeholder="e.g., 560001"
                />
              </div>
            </div>
          </div>

          {/* Property Details */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Property Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Total Floors"
                type="number"
                value={formData.totalFloors}
                onChange={(e) =>
                  setFormData({ ...formData, totalFloors: e.target.value })
                }
                placeholder="e.g., 4"
              />
              <Input
                label="Total Rooms"
                type="number"
                value={formData.totalRooms}
                onChange={(e) =>
                  setFormData({ ...formData, totalRooms: e.target.value })
                }
                placeholder="e.g., 16"
              />
              <Input
                label="Total Beds"
                type="number"
                required
                value={formData.totalBeds}
                onChange={(e) =>
                  setFormData({ ...formData, totalBeds: e.target.value })
                }
                placeholder="e.g., 48"
              />
            </div>
          </div>

          {/* Pricing */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Pricing
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Monthly Rent (₹)"
                type="number"
                required
                value={formData.monthlyRent}
                onChange={(e) =>
                  setFormData({ ...formData, monthlyRent: e.target.value })
                }
                placeholder="e.g., 8000"
              />
              <Input
                label="Security Deposit (₹)"
                type="number"
                value={formData.securityDeposit}
                onChange={(e) =>
                  setFormData({ ...formData, securityDeposit: e.target.value })
                }
                placeholder="e.g., 16000"
              />
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+91 9876543210"
                icon={Phone}
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="property@example.com"
                icon={Mail}
              />
              <Input
                label="Website"
                value={formData.website}
                onChange={(e) =>
                  setFormData({ ...formData, website: e.target.value })
                }
                placeholder="www.example.com"
                icon={Globe}
              />
            </div>
          </div>

          {/* Amenities */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Amenities
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {AMENITY_OPTIONS.map((amenity) => {
                const Icon = amenity.icon;
                const isSelected = formData.amenities.includes(amenity.value);
                return (
                  <button
                    key={amenity.value}
                    type="button"
                    onClick={() => toggleAmenity(amenity.value)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? "border-primary-500 bg-primary-50 text-primary-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {amenity.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {editingProperty ? "Updating..." : "Adding..."}
                </>
              ) : (
                editingProperty ? "Update Property" : "Add Property"
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Property"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Delete Property
              </h3>
              <p className="text-sm text-gray-500">
                This action cannot be undone.
              </p>
            </div>
          </div>
          
          {propertyToDelete && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Property:</strong> {propertyToDelete.name}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Address:</strong> {propertyToDelete.address}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Type:</strong> {propertyToDelete.type}
              </p>
            </div>
          )}
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDeleteProperty}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Property
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
