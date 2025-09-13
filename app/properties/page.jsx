"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
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

// Demo properties data
const DEMO_PROPERTIES = [
  {
    id: "prop-1",
    name: "Sunrise PG",
    address: "123 Main Street, Koramangala, Bangalore",
    city: "Bangalore",
    state: "Karnataka",
    pincode: "560001",
    totalFloors: 4,
    totalRooms: 16,
    totalBeds: 48,
    occupiedBeds: 42,
    availableBeds: 6,
    monthlyRent: 8000,
    securityDeposit: 16000,
    amenities: ["WiFi", "AC", "Hot Water", "Laundry", "Kitchen", "Security"],
    phone: "+91 9876543210",
    email: "sunrise.pg@example.com",
    website: "www.sunrisepg.com",
    establishedYear: 2018,
    type: "Men",
    status: "ACTIVE",
  },
  {
    id: "prop-2",
    name: "Green Valley PG",
    address: "456 Park Road, Indiranagar, Bangalore",
    city: "Bangalore",
    state: "Karnataka",
    pincode: "560002",
    totalFloors: 3,
    totalRooms: 12,
    totalBeds: 36,
    occupiedBeds: 30,
    availableBeds: 6,
    monthlyRent: 9000,
    securityDeposit: 18000,
    amenities: ["WiFi", "AC", "Gym", "Parking", "CCTV", "Power Backup"],
    phone: "+91 9876543211",
    email: "greenvalley@example.com",
    website: "www.greenvalleypg.com",
    establishedYear: 2020,
    type: "Women",
    status: "ACTIVE",
  },
  {
    id: "prop-3",
    name: "Blue Sky Residency",
    address: "789 Lake View, Whitefield, Bangalore",
    city: "Bangalore",
    state: "Karnataka",
    pincode: "560003",
    totalFloors: 5,
    totalRooms: 20,
    totalBeds: 60,
    occupiedBeds: 55,
    availableBeds: 5,
    monthlyRent: 10000,
    securityDeposit: 20000,
    amenities: ["WiFi", "AC", "Gym", "Swimming Pool", "Cafeteria", "Library"],
    phone: "+91 9876543212",
    email: "bluesky@example.com",
    website: "www.blueskyresidency.com",
    establishedYear: 2019,
    type: "Co-ed",
    status: "ACTIVE",
  },
];

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
  const [properties, setProperties] = useState(DEMO_PROPERTIES);
  const [showModal, setShowModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
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
  });

  useEffect(() => {
    // Set the first property as selected if none is selected
    if (!selectedProperty && properties.length > 0) {
      handleSelectProperty(properties[0]);
    }
  }, [selectedProperty, properties]);

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
    setFormData({
      name: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
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
    });
    setShowModal(true);
  };

  const handleEditProperty = (property) => {
    setEditingProperty(property);
    setFormData({
      name: property.name,
      address: property.address,
      city: property.city,
      state: property.state,
      pincode: property.pincode,
      totalFloors: property.totalFloors,
      totalRooms: property.totalRooms,
      totalBeds: property.totalBeds,
      monthlyRent: property.monthlyRent,
      securityDeposit: property.securityDeposit,
      amenities: property.amenities || [],
      phone: property.phone,
      email: property.email,
      website: property.website,
      type: property.type,
    });
    setShowModal(true);
  };

  const handleDeleteProperty = (propertyId) => {
    if (confirm("Are you sure you want to delete this property?")) {
      setProperties(properties.filter((p) => p.id !== propertyId));
      dispatch(
        addToast({
          title: "Property Deleted",
          description: "Property has been deleted successfully",
          variant: "success",
        })
      );
    }
  };

  const handleSubmit = (e) => {
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

    if (editingProperty) {
      // Update existing property
      setProperties(
        properties.map((p) =>
          p.id === editingProperty.id
            ? {
                ...editingProperty,
                ...formData,
                occupiedBeds: editingProperty.occupiedBeds || 0,
                availableBeds: formData.totalBeds - (editingProperty.occupiedBeds || 0),
              }
            : p
        )
      );
      dispatch(
        addToast({
          title: "Property Updated",
          description: `${formData.name} has been updated successfully`,
          variant: "success",
        })
      );
    } else {
      // Add new property
      const newProperty = {
        id: `prop-${Date.now()}`,
        ...formData,
        occupiedBeds: 0,
        availableBeds: formData.totalBeds,
        establishedYear: new Date().getFullYear(),
        status: "ACTIVE",
      };
      setProperties([...properties, newProperty]);
      dispatch(
        addToast({
          title: "Property Added",
          description: `${formData.name} has been added successfully`,
          variant: "success",
        })
      );
    }

    setShowModal(false);
  };

  const toggleAmenity = (amenity) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const filteredProperties = properties.filter((property) => {
    const matchesSearch =
      property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.city.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterType === "all" || property.type === filterType;

    return matchesSearch && matchesFilter;
  });

  const getOccupancyColor = (occupancy) => {
    if (occupancy >= 90) return "text-green-600 bg-green-100";
    if (occupancy >= 70) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

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
        <Button onClick={handleAddProperty} className="gap-2">
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
            const occupancyRate = property.totalBeds
              ? (property.occupiedBeds / property.totalBeds) * 100
              : 0;
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
                        <span className="truncate">{property.address}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{property.phone}</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">Total Beds</p>
                        <p className="text-xl font-bold">{property.totalBeds}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Occupied</p>
                        <p className="text-xl font-bold">
                          {property.occupiedBeds}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Monthly Rent</p>
                        <p className="text-lg font-semibold">
                          {formatCurrency(property.monthlyRent)}
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
              <Input
                label="Type"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                as="select"
              >
                <option value="Men">Men</option>
                <option value="Women">Women</option>
                <option value="Co-ed">Co-ed</option>
              </Input>
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
            <Button type="submit">
              {editingProperty ? "Update Property" : "Add Property"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
