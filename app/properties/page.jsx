"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import propertyService from "@/services/propertyService";
import { fetchFloors } from "@/store/slices/floorsSlice";
import { fetchRooms } from "@/store/slices/roomsSlice";
import { fetchBeds } from "@/store/slices/bedsSlice";
import { validateCapacityUpdate, getCapacitySummary } from '@/utils/capacityValidation';
import { CapacityIndicator } from '@/components/ui/CapacityIndicator';
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
import { Dropdown } from "@/components/ui/Dropdown";
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

const PROPERTY_TYPE_OPTIONS = [
  { value: "Men", label: "Men Only", icon: Users },
  { value: "Women", label: "Women Only", icon: Users },
  { value: "Co-ed", label: "Co-ed (Mixed)", icon: Users },
];

export default function PropertiesPage() {
  const dispatch = useDispatch();
  const { selectedProperty } = useSelector((state) => state.property);
  const { floors } = useSelector((state) => state.floors);
  const { rooms } = useSelector((state) => state.rooms);
  const { beds } = useSelector((state) => state.beds);
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
    fetchAllPropertyData();
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

  // Fetch floors, rooms, and beds data for all properties
  const fetchAllPropertyData = async () => {
    try {
      // Fetch all floors, rooms, and beds
      await Promise.all([
        dispatch(fetchFloors()),
        dispatch(fetchRooms({ propertyId: null })), // Fetch all rooms
        dispatch(fetchBeds({ propertyId: null }))   // Fetch all beds
      ]);
    } catch (error) {
      console.error('Error fetching property data:', error);
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

    // Validate capacity update if editing
    if (editingProperty) {
      const capacityValidation = validateCapacityUpdate(editingProperty, formData);
      if (!capacityValidation.isValid) {
        dispatch(addToast({
          title: 'Capacity Validation Failed',
          description: capacityValidation.errors.join(', '),
          variant: 'error'
        }));
        return;
      }
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
    <div className="space-y-6 p-6 bg-gradient-to-br from-gray-50 via-white to-blue-50 min-h-screen">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
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
              >
                <div className="relative group">
                  <Card
                    className={`overflow-hidden h-full flex flex-col ${
                      isSelected ? "ring-2 ring-primary-500 shadow-glow" : ""
                    }`}
                    hover={true}
                    glow={isSelected}
                  >
                  {/* Selected Badge */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 z-10">
                      <span className="px-2 py-1 bg-primary-500 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                        <Check className="h-3 w-3" />
                      </span>
                    </div>
                  )}

                  {/* Card Header */}
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white shadow-lg">
                          <Building2 className="h-7 w-7" />
                        </div>
                        <div className="flex flex-col justify-center">
                          <h3 className="font-bold text-xl text-gray-900">
                            {property.name}
                          </h3>
                          <span className="text-sm px-3 py-1 bg-gradient-to-r from-primary-100 to-secondary-100 text-primary-700 rounded-full w-fit font-medium">
                            {property.type}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Property Info */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <MapPin className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="text-sm text-gray-700 font-medium truncate" title={property.address || 'No address'}>
                          {property.address || 'No address'}
                        </span>
                      </div>
                      {property.phone && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                            <Phone className="h-4 w-4 text-green-600" />
                          </div>
                          <span className="text-sm text-gray-700 font-medium truncate" title={property.phone}>
                            {property.phone}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                        <p className="text-xs text-blue-600 font-medium mb-1">Total Beds</p>
                        <p className="text-2xl font-bold text-blue-700">{totalBeds}</p>
                      </div>
                      <div className="text-center p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg">
                        <p className="text-xs text-emerald-600 font-medium mb-1">Occupied</p>
                        <p className="text-2xl font-bold text-emerald-700">{occupiedBeds}</p>
                      </div>
                      <div className="text-center p-3 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg">
                        <p className="text-xs text-yellow-600 font-medium mb-1">Monthly Rent</p>
                        <p className="text-lg font-bold text-yellow-700">
                          {property.monthlyRent ? formatCurrency(property.monthlyRent) : 'N/A'}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                        <p className="text-xs text-purple-600 font-medium mb-1">Occupancy</p>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${getOccupancyColor(
                            occupancyRate
                          )}`}
                        >
                          {occupancyRate.toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {/* Amenities */}
                    {property.amenities && property.amenities.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                          {property.amenities.slice(0, 4).map((amenity) => (
                            <span
                              key={amenity}
                              className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-md"
                            >
                              {amenity}
                            </span>
                          ))}
                           {property.amenities.length > 3 && (
                             <div className="relative group/more">
                               <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-md cursor-help hover:bg-gray-200 transition-colors">
                                 +{property.amenities.length - 3} more
                               </span>
                               
                               {/* Tooltip for +X more button */}
                               <div className="absolute bottom-full right-0 mb-2 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-2xl opacity-0 group-hover/more:opacity-100 transition-all duration-300 pointer-events-none z-[9999] w-64" style={{ background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.95), rgba(17, 24, 39, 0.95))' }}>
                                 <div className="font-semibold mb-2 text-white">All Amenities:</div>
                                 <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                                   {property.amenities.map((amenity, index) => (
                                     <span key={index} className="bg-gray-700 px-2 py-1 rounded text-xs whitespace-nowrap">
                                       {amenity}
                                     </span>
                                   ))}
                                 </div>
                                 <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                               </div>
                             </div>
                           )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 mt-auto pt-4 border-t border-gray-100">
                      {!isSelected && (
                        <Button
                          variant="primary"
                          size="md"
                          className="flex-1 min-w-0 font-semibold"
                          onClick={() => handleSelectProperty(property)}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          <span className="truncate">Select Property</span>
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="md"
                        className={`${isSelected ? "flex-1 min-w-0" : ""} flex-shrink-0 font-medium`}
                        onClick={() => handleEditProperty(property)}
                        title="Edit Property"
                      >
                        <Edit2 className="h-4 w-4" />
                        {isSelected && <span className="ml-2 truncate">Edit Property</span>}
                      </Button>
                      <Button
                        variant="outline"
                        size="md"
                        onClick={() => handleDeleteProperty(property.id)}
                        className="text-red-600 hover:bg-red-50 hover:border-red-300 flex-shrink-0 font-medium"
                        disabled={submitting}
                        title="Delete Property"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Capacity Overview */}
                    <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <Home className="h-4 w-4 text-primary-600" />
                          Capacity Overview
                        </h4>
                        <div className="text-xs text-gray-500">
                          {property.amenities?.length || 0} amenities
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3">
                        {/* Floors */}
                        <div className="text-center p-2 bg-white rounded-lg border border-gray-200">
                          <div className="text-lg font-bold text-primary-600">
                            {property.totalFloors || 0}
                          </div>
                          <div className="text-xs text-gray-600">Floors</div>
                        </div>
                        
                        {/* Rooms */}
                        <div className="text-center p-2 bg-white rounded-lg border border-gray-200">
                          <div className="text-lg font-bold text-emerald-600">
                            {property.totalRooms || 0}
                          </div>
                          <div className="text-xs text-gray-600">Rooms</div>
                        </div>
                        
                        {/* Beds */}
                        <div className="text-center p-2 bg-white rounded-lg border border-gray-200">
                          <div className="text-lg font-bold text-blue-600">
                            {totalBeds}
                          </div>
                          <div className="text-xs text-gray-600">Beds</div>
                        </div>
                      </div>
                      
                      {/* Occupancy Bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Occupancy</span>
                          <span>{occupancyRate.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              occupancyRate >= 90 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                              occupancyRate >= 70 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                              'bg-gradient-to-r from-green-500 to-green-600'
                            }`}
                            style={{ width: `${Math.min(occupancyRate, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  </Card>
                  
                </div>
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
        size="xl"
      >
        <div className="max-h-[80vh] flex flex-col">
          <div className="flex-1 overflow-y-auto p-1">
            <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Basic Information
              </h3>
            </div>
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
              <Dropdown
                label="Property Type"
                options={PROPERTY_TYPE_OPTIONS}
                value={formData.type}
                onChange={(value) => setFormData({ ...formData, type: value })}
                placeholder="Select property type..."
                premium
              />
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Address
              </h3>
            </div>
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
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                <Home className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Property Details
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Total Floors"
                type="number"
                value={formData.totalFloors || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  const numValue = value === '' ? 0 : parseInt(value);
                  setFormData({ ...formData, totalFloors: isNaN(numValue) ? 0 : numValue });
                }}
                placeholder="e.g., 4"
              />
              <Input
                label="Total Rooms"
                type="number"
                value={formData.totalRooms || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  const numValue = value === '' ? 0 : parseInt(value);
                  setFormData({ ...formData, totalRooms: isNaN(numValue) ? 0 : numValue });
                }}
                placeholder="e.g., 16"
              />
              <Input
                label="Total Beds"
                type="number"
                required
                value={formData.totalBeds || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  const numValue = value === '' ? 0 : parseInt(value);
                  setFormData({ ...formData, totalBeds: isNaN(numValue) ? 0 : numValue });
                }}
                placeholder="e.g., 48"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Pricing
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Monthly Rent (₹)"
                type="number"
                required
                value={formData.monthlyRent || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  const numValue = value === '' ? 0 : parseFloat(value);
                  setFormData({ ...formData, monthlyRent: isNaN(numValue) ? 0 : numValue });
                }}
                placeholder="e.g., 8000"
              />
              <Input
                label="Security Deposit (₹)"
                type="number"
                value={formData.securityDeposit || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  const numValue = value === '' ? 0 : parseFloat(value);
                  setFormData({ ...formData, securityDeposit: isNaN(numValue) ? 0 : numValue });
                }}
                placeholder="e.g., 16000"
              />
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <Phone className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Contact Information
              </h3>
            </div>
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
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Amenities
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {AMENITY_OPTIONS.map((amenity) => {
                const Icon = amenity.icon;
                const isSelected = formData.amenities.includes(amenity.value);
                return (
                  <button
                    key={amenity.value}
                    type="button"
                    onClick={() => toggleAmenity(amenity.value)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      isSelected
                        ? "border-primary-500 bg-primary-50 text-primary-700 shadow-sm"
                        : "border-gray-200 hover:border-primary-300 hover:bg-gray-50"
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
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 ">
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
            </div>
          </form>
          </div>
        </div>
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
