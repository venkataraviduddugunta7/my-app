'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Input, Modal, Dropdown } from '@/components/ui';
import {
  Building2,
  Compass,
  DollarSign,
  Home,
  Link2,
  Mail,
  MapPin,
  Phone,
  Search,
  Sparkles,
  Users,
} from 'lucide-react';

const PROPERTY_TYPE_OPTIONS = [
  { value: 'Men', label: 'Men Only', icon: Users },
  { value: 'Women', label: 'Women Only', icon: Users },
  { value: 'Co-ed', label: 'Co-ed (Mixed)', icon: Users },
];

const AMENITY_OPTIONS = [
  { value: 'WiFi', label: 'WiFi', icon: Sparkles },
  { value: 'AC', label: 'Air Conditioning', icon: Sparkles },
  { value: 'Parking', label: 'Parking', icon: Sparkles },
  { value: 'Gym', label: 'Gym', icon: Sparkles },
  { value: 'Hot Water', label: 'Hot Water', icon: Sparkles },
  { value: 'TV', label: 'Television', icon: Sparkles },
  { value: 'Kitchen', label: 'Kitchen', icon: Sparkles },
  { value: 'Security', label: '24/7 Security', icon: Sparkles },
  { value: 'Laundry', label: 'Laundry', icon: Sparkles },
  { value: 'CCTV', label: 'CCTV Surveillance', icon: Sparkles },
];

const INDIA_STATE_OPTIONS = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
].map((state) => ({ value: state, label: state }));

const PROPERTY_TYPES = new Set(PROPERTY_TYPE_OPTIONS.map((option) => option.value));
const INDIA_STATES = new Set(INDIA_STATE_OPTIONS.map((option) => option.value));

const PINCODE_REGEX = /^\d{6}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+\-()\s]{7,20}$/;

const COUNTRY_FIXED = 'India';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const GOOGLE_SCRIPT_ID = 'my-pg-google-places-script';

const DEFAULT_PROPERTY_FORM = {
  name: '',
  type: 'Co-ed',
  addressLine1: '',
  addressLine2: '',
  locality: '',
  landmark: '',
  city: '',
  state: '',
  pincode: '',
  description: '',
  totalFloors: '',
  totalRooms: '',
  totalBeds: '',
  monthlyRent: '',
  securityDeposit: '',
  amenities: [],
  phone: '',
  email: '',
  website: '',
};

const cleanString = (value) => (typeof value === 'string' ? value.trim() : '');

const normalizeWebsite = (value) => {
  const text = cleanString(value);
  if (!text) return '';
  const candidate = /^https?:\/\//i.test(text) ? text : `https://${text}`;

  try {
    return new URL(candidate).toString();
  } catch (_error) {
    return null;
  }
};

const toSafeNumber = (value) => {
  if (value === '' || value === null || value === undefined) return undefined;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const toSafeInteger = (value) => {
  if (value === '' || value === null || value === undefined) return undefined;
  const numeric = Number(value);
  return Number.isInteger(numeric) ? numeric : null;
};

const firstNonEmpty = (...values) => {
  for (const value of values) {
    const text = cleanString(value);
    if (text) return text;
  }
  return '';
};

const joinAddressParts = (...values) =>
  values
    .map((value) => cleanString(value))
    .filter(Boolean)
    .join(', ');

const normalizeTextToken = (value) =>
  cleanString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const STATE_ALIAS_MAP = {
  nctofdelhi: 'Delhi',
  delhi: 'Delhi',
  orissa: 'Odisha',
  odisha: 'Odisha',
  pondicherry: 'Puducherry',
  puducherry: 'Puducherry',
  'dadraandnagarhavelianddamananddiu': 'Dadra and Nagar Haveli and Daman and Diu',
};

const normalizeIndianState = (value) => {
  const text = cleanString(value);
  if (!text) return '';

  if (INDIA_STATES.has(text)) {
    return text;
  }

  const token = normalizeTextToken(text);
  if (STATE_ALIAS_MAP[token]) {
    return STATE_ALIAS_MAP[token];
  }

  for (const option of INDIA_STATE_OPTIONS) {
    if (normalizeTextToken(option.value) === token) {
      return option.value;
    }
  }

  return text;
};

const parseAddressToParts = (rawAddress) => {
  const text = cleanString(rawAddress);
  if (!text) {
    return {
      addressLine1: '',
      addressLine2: '',
      locality: '',
      landmark: '',
    };
  }

  const parts = text
    .split(',')
    .map((entry) => cleanString(entry))
    .filter(Boolean);

  return {
    addressLine1: parts[0] || text,
    addressLine2: parts[1] || '',
    locality: parts[2] || '',
    landmark: parts.slice(3).join(', '),
  };
};

const normalizeInitialValues = (property) => {
  if (!property) return { ...DEFAULT_PROPERTY_FORM };

  const parsedAddress = parseAddressToParts(property.address);

  return {
    ...DEFAULT_PROPERTY_FORM,
    name: property.name || '',
    type: property.type || 'Co-ed',
    addressLine1: parsedAddress.addressLine1,
    addressLine2: parsedAddress.addressLine2,
    locality: parsedAddress.locality,
    landmark: parsedAddress.landmark,
    city: property.city || '',
    state: normalizeIndianState(property.state || ''),
    pincode: property.pincode || '',
    description: property.description || '',
    totalFloors: property.totalFloors ?? '',
    totalRooms: property.totalRooms ?? '',
    totalBeds: property.totalBeds ?? '',
    monthlyRent: property.monthlyRent ?? '',
    securityDeposit: property.securityDeposit ?? '',
    amenities: Array.isArray(property.amenities) ? property.amenities : [],
    phone: property.phone || '',
    email: property.email || '',
    website: property.website || '',
  };
};

const validatePropertyForm = (values) => {
  const errors = {};

  const name = cleanString(values.name);
  const type = cleanString(values.type);
  const addressLine1 = cleanString(values.addressLine1);
  const addressLine2 = cleanString(values.addressLine2);
  const locality = cleanString(values.locality);
  const landmark = cleanString(values.landmark);
  const city = cleanString(values.city);
  const state = normalizeIndianState(values.state);
  const pincode = cleanString(values.pincode);
  const description = cleanString(values.description);
  const phone = cleanString(values.phone);
  const email = cleanString(values.email);
  const website = cleanString(values.website);

  const totalBeds = toSafeInteger(values.totalBeds);
  const monthlyRent = toSafeNumber(values.monthlyRent);
  const totalFloors = toSafeInteger(values.totalFloors);
  const totalRooms = toSafeInteger(values.totalRooms);
  const securityDeposit = toSafeNumber(values.securityDeposit);
  const normalizedWebsite = normalizeWebsite(website);

  if (!name) errors.name = 'Property name is required.';
  if (!PROPERTY_TYPES.has(type)) errors.type = 'Select a valid property type.';

  if (!addressLine1) errors.addressLine1 = 'Address Line 1 is required.';
  if (!locality) errors.locality = 'Area / Locality is required.';
  if (!city) errors.city = 'City is required.';

  if (!state) {
    errors.state = 'State is required.';
  } else if (!INDIA_STATES.has(state)) {
    errors.state = 'Select a valid Indian state/UT.';
  }

  if (!pincode) {
    errors.pincode = 'Pincode is required.';
  } else if (!PINCODE_REGEX.test(pincode)) {
    errors.pincode = 'Pincode must be a 6-digit number.';
  }

  if (totalBeds === null || totalBeds < 1) {
    errors.totalBeds = 'Total beds must be at least 1.';
  }

  if (monthlyRent === null || monthlyRent <= 0) {
    errors.monthlyRent = 'Monthly rent must be greater than 0.';
  }

  if (totalFloors === null || (totalFloors !== undefined && totalFloors < 0)) {
    errors.totalFloors = 'Total floors must be 0 or more.';
  }

  if (totalRooms === null || (totalRooms !== undefined && totalRooms < 0)) {
    errors.totalRooms = 'Total rooms must be 0 or more.';
  }

  if (
    totalRooms !== undefined &&
    totalBeds !== undefined &&
    totalBeds !== null &&
    totalRooms !== null &&
    totalRooms > totalBeds
  ) {
    errors.totalRooms = 'Total rooms cannot be greater than total beds.';
  }

  if (
    totalFloors !== undefined &&
    totalRooms !== undefined &&
    totalFloors !== null &&
    totalRooms !== null &&
    totalFloors > 0 &&
    totalRooms > 0 &&
    totalRooms < totalFloors
  ) {
    errors.totalRooms = 'Total rooms should be greater than or equal to total floors.';
  }

  if (securityDeposit === null || (securityDeposit !== undefined && securityDeposit < 0)) {
    errors.securityDeposit = 'Security deposit cannot be negative.';
  }

  if (phone && !PHONE_REGEX.test(phone)) {
    errors.phone = 'Enter a valid phone number.';
  }

  if (email && !EMAIL_REGEX.test(email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (website && normalizedWebsite === null) {
    errors.website = 'Enter a valid website URL.';
  }

  if (description.length > 500) {
    errors.description = 'Description should be 500 characters or fewer.';
  }

  const address = [addressLine1, addressLine2, locality, landmark]
    .map((entry) => cleanString(entry))
    .filter(Boolean)
    .join(', ');

  const payload = {
    name,
    type,
    address,
    city,
    state,
    pincode,
    description: description || undefined,
    totalBeds,
    monthlyRent,
    totalFloors,
    totalRooms,
    securityDeposit,
    amenities: Array.isArray(values.amenities)
      ? [...new Set(values.amenities.map((item) => cleanString(item)).filter(Boolean))]
      : [],
    phone: phone || undefined,
    email: email || undefined,
    website: normalizedWebsite || undefined,
  };

  return {
    errors,
    payload,
    isValid: Object.keys(errors).length === 0,
  };
};

const getAddressPart = (components, types) => {
  for (const type of types) {
    const component = components.find((entry) => Array.isArray(entry.types) && entry.types.includes(type));
    if (component?.long_name) return component.long_name;
  }

  return '';
};

const getGoogleCountryCode = (components) => {
  const country = components.find((entry) => Array.isArray(entry.types) && entry.types.includes('country'));
  return (country?.short_name || '').toUpperCase();
};

const mapGoogleAddress = (result) => {
  const components = result?.address_components || [];

  const streetNumber = getAddressPart(components, ['street_number']);
  const route = getAddressPart(components, ['route']);
  const premise = getAddressPart(components, ['premise']);
  const subpremise = getAddressPart(components, ['subpremise']);
  const sublocality = getAddressPart(components, [
    'sublocality_level_1',
    'sublocality',
    'sublocality_level_2',
    'neighborhood',
  ]);
  const landmark = getAddressPart(components, ['point_of_interest', 'establishment']);
  const areaLevel3 = getAddressPart(components, ['administrative_area_level_3']);
  const areaLevel2 = getAddressPart(components, ['administrative_area_level_2']);
  const streetAddress = [streetNumber, route].filter(Boolean).join(' ').trim();

  const city = getAddressPart(components, ['locality', 'administrative_area_level_2']);
  const state = normalizeIndianState(getAddressPart(components, ['administrative_area_level_1']));
  const postalCode = cleanString(getAddressPart(components, ['postal_code'])).replace(/\D/g, '').slice(0, 6);

  const addressLine1 = firstNonEmpty(streetAddress, premise, sublocality, landmark);
  const addressLine2 = joinAddressParts(
    subpremise,
    streetAddress ? premise : '',
    !streetAddress && premise ? sublocality : ''
  );
  const locality = firstNonEmpty(sublocality, areaLevel3, areaLevel2);

  return {
    addressLine1,
    addressLine2,
    locality: locality || '',
    landmark: landmark || '',
    city: city || '',
    state: state || '',
    pincode: postalCode,
    countryCode: getGoogleCountryCode(components),
  };
};

const mapOsmAddress = (record) => {
  const address = record?.address || {};
  const road = cleanString(address.road || address.pedestrian || address.footway || '');
  const houseNumber = cleanString(address.house_number || '');
  const building = cleanString(address.building || address.house || address.commercial || '');
  const unit = cleanString(address.unit || address.block || '');
  const neighborhood = cleanString(
    address.neighbourhood || address.suburb || address.hamlet || address.residential || ''
  );
  const locality = cleanString(
    address.city_district || address.suburb || address.quarter || address.residential || address.county || ''
  );
  const landmark = cleanString(address.attraction || address.amenity || address.shop || address.tourism || '');

  const city =
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.county ||
    '';

  const state = normalizeIndianState(address.state || address.state_district || '');
  const postalCode = cleanString(address.postcode).replace(/\D/g, '').slice(0, 6);
  const line1FromStreet = [houseNumber, road].filter(Boolean).join(' ').trim();
  const addressLine1 = firstNonEmpty(line1FromStreet, building, locality, city);
  const addressLine2 = joinAddressParts(unit, neighborhood);

  return {
    addressLine1,
    addressLine2,
    locality,
    landmark,
    city: cleanString(city),
    state,
    pincode: postalCode,
    countryCode: cleanString(address.country_code).toUpperCase(),
  };
};

const hasGooglePlaces = () =>
  typeof window !== 'undefined' &&
  Boolean(window.google?.maps?.places?.AutocompleteService) &&
  Boolean(window.google?.maps?.Geocoder);

const createGooglePlacesService = () => new window.google.maps.places.AutocompleteService();
const createGoogleGeocoder = () => new window.google.maps.Geocoder();

export default function PropertyFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialValues = null,
  loading = false,
  title = 'Add New Property',
  submitLabel = 'Save Property',
}) {
  const [formData, setFormData] = useState(DEFAULT_PROPERTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [didSubmit, setDidSubmit] = useState(false);

  const [addressSearch, setAddressSearch] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(hasGooglePlaces());

  const normalizedInitialValues = useMemo(
    () => normalizeInitialValues(initialValues),
    [initialValues]
  );

  useEffect(() => {
    if (!isOpen) return;

    setFormData(normalizedInitialValues);
    setFormErrors({});
    setDidSubmit(false);
    setAddressError('');
    setAddressSuggestions([]);

    const initialSearch = [
      cleanString(normalizedInitialValues.addressLine1),
      cleanString(normalizedInitialValues.city),
      cleanString(normalizedInitialValues.state),
    ]
      .filter(Boolean)
      .join(', ');

    setAddressSearch(initialSearch);
  }, [isOpen, normalizedInitialValues]);

  useEffect(() => {
    if (!isOpen || !GOOGLE_MAPS_API_KEY || hasGooglePlaces()) {
      setGoogleReady(hasGooglePlaces());
      return;
    }

    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID);
    if (existingScript) {
      existingScript.addEventListener('load', () => setGoogleReady(hasGooglePlaces()));
      return () => {
        existingScript.removeEventListener('load', () => setGoogleReady(hasGooglePlaces()));
      };
    }

    const script = document.createElement('script');
    script.id = GOOGLE_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.onload = () => setGoogleReady(hasGooglePlaces());
    script.onerror = () => setGoogleReady(false);
    document.head.appendChild(script);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (addressSearch.trim().length < 3) {
      setAddressSuggestions([]);
      setAddressError('');
      return;
    }

    const query = addressSearch.trim();
    const timeout = setTimeout(async () => {
      setAddressLoading(true);
      setAddressError('');

      try {
        if (googleReady && hasGooglePlaces()) {
          const service = createGooglePlacesService();
          const predictions = await new Promise((resolve, reject) => {
            service.getPlacePredictions(
              {
                input: query,
                types: ['geocode'],
                componentRestrictions: { country: 'in' },
              },
              (items, status) => {
                if (
                  status === window.google.maps.places.PlacesServiceStatus.OK &&
                  Array.isArray(items)
                ) {
                  resolve(items);
                  return;
                }

                if (
                  status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS
                ) {
                  resolve([]);
                  return;
                }

                reject(new Error('Google address lookup failed'));
              }
            );
          });

          setAddressSuggestions(
            predictions.slice(0, 6).map((item) => ({
              id: `google-${item.place_id}`,
              label: item.description,
              source: 'google',
              placeId: item.place_id,
            }))
          );
          return;
        }

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=in&limit=6&q=${encodeURIComponent(
            query
          )}`
        );

        if (!response.ok) {
          throw new Error('Address lookup failed');
        }

        const data = await response.json();
        setAddressSuggestions(
          Array.isArray(data)
            ? data.map((item) => ({
                id: `osm-${item.place_id}`,
                label: item.display_name,
                source: 'osm',
                raw: item,
              }))
            : []
        );
      } catch (error) {
        setAddressSuggestions([]);
        setAddressError(error.message || 'Unable to fetch address suggestions right now.');
      } finally {
        setAddressLoading(false);
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [addressSearch, googleReady, isOpen]);

  const applyAddressData = (addressData) => {
    if (addressData.countryCode && addressData.countryCode !== 'IN') {
      setAddressError('Only Indian addresses are supported for this property form.');
      return;
    }

    const nextFormData = {
      ...formData,
      addressLine1: addressData.addressLine1 || formData.addressLine1,
      addressLine2: addressData.addressLine2 || formData.addressLine2,
      locality: addressData.locality || formData.locality,
      landmark: addressData.landmark || formData.landmark,
      city: addressData.city || formData.city,
      state: addressData.state || formData.state,
      pincode: addressData.pincode || formData.pincode,
    };

    setFormData(nextFormData);

    if (didSubmit) {
      setFormErrors(validatePropertyForm(nextFormData).errors);
    }
  };

  const selectAddressSuggestion = async (suggestion) => {
    try {
      setAddressLoading(true);
      setAddressError('');

      if (suggestion.source === 'google' && suggestion.placeId && hasGooglePlaces()) {
        const geocoder = createGoogleGeocoder();
        const results = await new Promise((resolve, reject) => {
          geocoder.geocode({ placeId: suggestion.placeId }, (items, status) => {
            if (status === 'OK' && Array.isArray(items) && items.length > 0) {
              resolve(items);
              return;
            }
            reject(new Error('Unable to load selected address details.'));
          });
        });

        const selectedResult = results[0];
        applyAddressData(mapGoogleAddress(selectedResult));
        setAddressSearch(selectedResult.formatted_address || suggestion.label);
      } else if (suggestion.source === 'osm' && suggestion.raw) {
        applyAddressData(mapOsmAddress(suggestion.raw));
        setAddressSearch(suggestion.label);
      }

      setAddressSuggestions([]);
    } catch (error) {
      setAddressError(error.message || 'Unable to apply selected address.');
    } finally {
      setAddressLoading(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setAddressError('Location is not supported on this device/browser.');
      return;
    }

    setLocationLoading(true);
    setAddressError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        try {
          if (googleReady && hasGooglePlaces()) {
            const geocoder = createGoogleGeocoder();
            const results = await new Promise((resolve, reject) => {
              geocoder.geocode(
                { location: { lat: latitude, lng: longitude } },
                (items, status) => {
                  if (status === 'OK' && Array.isArray(items) && items.length > 0) {
                    resolve(items);
                    return;
                  }
                  reject(new Error('Unable to fetch current location address.'));
                }
              );
            });

            const selectedResult = results[0];
            applyAddressData(mapGoogleAddress(selectedResult));
            setAddressSearch(selectedResult.formatted_address || '');
          } else {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${encodeURIComponent(
                latitude
              )}&lon=${encodeURIComponent(longitude)}`
            );

            if (!response.ok) {
              throw new Error('Unable to reverse geocode your location.');
            }

            const data = await response.json();
            const mapped = mapOsmAddress(data);
            applyAddressData(mapped);
            setAddressSearch(data.display_name || '');
          }
        } catch (error) {
          setAddressError(error.message || 'Unable to use current location.');
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        const message =
          error?.code === error.PERMISSION_DENIED
            ? 'Location permission denied. Enable permission and try again.'
            : 'Unable to read your current location.';
        setAddressError(message);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const updateField = (field, value) => {
    const nextFormData = { ...formData, [field]: value };
    setFormData(nextFormData);

    if (didSubmit || formErrors[field]) {
      setFormErrors(validatePropertyForm(nextFormData).errors);
    }
  };

  const toggleAmenity = (amenity) => {
    const nextAmenities = formData.amenities.includes(amenity)
      ? formData.amenities.filter((item) => item !== amenity)
      : [...formData.amenities, amenity];
    updateField('amenities', nextAmenities);
  };

  const submitForm = async (event) => {
    event.preventDefault();
    setDidSubmit(true);

    const validation = validatePropertyForm(formData);
    setFormErrors(validation.errors);

    if (!validation.isValid) return;

    await onSubmit(validation.payload);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="xl">
      <div className="max-h-[80vh] overflow-y-auto p-1">
        <form onSubmit={submitForm} className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-600">
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Property Name"
                required
                value={formData.name}
                onChange={(event) => updateField('name', event.target.value)}
                placeholder="e.g., Sunrise PG"
                error={formErrors.name}
              />
              <Dropdown
                label="Property Type"
                options={PROPERTY_TYPE_OPTIONS}
                value={formData.type}
                onChange={(value) => updateField('type', value)}
                placeholder="Select property type..."
                premium
                error={formErrors.type}
              />
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                <MapPin className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Address (India)</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  label="Search Address"
                  value={addressSearch}
                  onChange={(event) => setAddressSearch(event.target.value)}
                  placeholder="Search locality, street, landmark in India"
                  icon={Search}
                  hint={
                    googleReady
                      ? 'Google Places suggestions enabled (India only).'
                      : 'Using open address suggestions (India only). Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY for Google Places.'
                  }
                />

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={useCurrentLocation}
                    loading={locationLoading}
                  >
                    {!locationLoading && <Compass className="h-3.5 w-3.5" />}
                    <span>Use GPS</span>
                  </Button>
                </div>

                {addressLoading && (
                  <p className="text-xs text-gray-500">Finding address suggestions...</p>
                )}

                {addressError && <p className="text-xs text-red-600">{addressError}</p>}

                {addressSuggestions.length > 0 && (
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-200 bg-white">
                    {addressSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        type="button"
                        onClick={() => selectAddressSuggestion(suggestion)}
                        className="w-full border-b border-gray-100 px-3 py-2 text-left text-sm text-gray-700 last:border-b-0 hover:bg-gray-50"
                      >
                        {suggestion.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  label="Address Line 1"
                  required
                  value={formData.addressLine1}
                  onChange={(event) => updateField('addressLine1', event.target.value)}
                  placeholder="House/Flat No, Building, Street"
                  error={formErrors.addressLine1}
                />
                <Input
                  label="Address Line 2"
                  value={formData.addressLine2}
                  onChange={(event) => updateField('addressLine2', event.target.value)}
                  placeholder="Apartment, block, sector (optional)"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  label="Area / Locality"
                  required
                  value={formData.locality}
                  onChange={(event) => updateField('locality', event.target.value)}
                  placeholder="e.g., Koramangala"
                  error={formErrors.locality}
                />
                <Input
                  label="Landmark"
                  value={formData.landmark}
                  onChange={(event) => updateField('landmark', event.target.value)}
                  placeholder="e.g., Near Metro Station"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <Input
                  label="City"
                  required
                  value={formData.city}
                  onChange={(event) => updateField('city', event.target.value)}
                  placeholder="e.g., Bangalore"
                  error={formErrors.city}
                />

                <Dropdown
                  label="State / UT"
                  options={INDIA_STATE_OPTIONS}
                  value={formData.state}
                  onChange={(value) => updateField('state', value)}
                  placeholder="Select state"
                  premium
                  error={formErrors.state}
                />

                <Input
                  label="Pincode"
                  required
                  value={formData.pincode}
                  onChange={(event) =>
                    updateField('pincode', event.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  placeholder="e.g., 560001"
                  error={formErrors.pincode}
                />

                <Input label="Country" value={COUNTRY_FIXED} disabled />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600">
                <Home className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Property Details</h3>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Input
                label="Total Floors"
                type="number"
                value={formData.totalFloors}
                onChange={(event) => updateField('totalFloors', event.target.value)}
                placeholder="e.g., 4"
                error={formErrors.totalFloors}
              />
              <Input
                label="Total Rooms"
                type="number"
                value={formData.totalRooms}
                onChange={(event) => updateField('totalRooms', event.target.value)}
                placeholder="e.g., 16"
                error={formErrors.totalRooms}
              />
              <Input
                label="Total Beds"
                type="number"
                required
                value={formData.totalBeds}
                onChange={(event) => updateField('totalBeds', event.target.value)}
                placeholder="e.g., 48"
                error={formErrors.totalBeds}
              />
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-600">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Pricing</h3>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Monthly Rent (₹)"
                type="number"
                required
                value={formData.monthlyRent}
                onChange={(event) => updateField('monthlyRent', event.target.value)}
                placeholder="e.g., 8000"
                error={formErrors.monthlyRent}
              />
              <Input
                label="Security Deposit (₹)"
                type="number"
                value={formData.securityDeposit}
                onChange={(event) => updateField('securityDeposit', event.target.value)}
                placeholder="e.g., 16000"
                error={formErrors.securityDeposit}
              />
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-purple-600">
                <Phone className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Input
                label="Phone"
                type="tel"
                value={formData.phone}
                onChange={(event) => updateField('phone', event.target.value)}
                placeholder="+91 9876543210"
                icon={Phone}
                error={formErrors.phone}
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(event) => updateField('email', event.target.value)}
                placeholder="property@example.com"
                icon={Mail}
                error={formErrors.email}
              />
              <Input
                label="Website"
                type="text"
                value={formData.website}
                onChange={(event) => updateField('website', event.target.value)}
                placeholder="example.com"
                icon={Link2}
                error={formErrors.website}
              />
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-orange-600">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Amenities</h3>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {AMENITY_OPTIONS.map((amenity) => {
                const Icon = amenity.icon;
                const isSelected = formData.amenities.includes(amenity.value);
                return (
                  <button
                    key={amenity.value}
                    type="button"
                    onClick={() => toggleAmenity(amenity.value)}
                    className={`rounded-xl border-2 p-4 text-left transition-all duration-200 ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm'
                        : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{amenity.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(event) => updateField('description', event.target.value)}
              rows={4}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                formErrors.description
                  ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'
              }`}
              placeholder="Brief description about your property"
            />
            {formErrors.description && (
              <p className="mt-1 text-xs text-red-600">{formErrors.description}</p>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                    Saving...
                  </>
                ) : (
                  submitLabel
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}
