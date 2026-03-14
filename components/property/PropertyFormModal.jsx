'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Input, Modal, Dropdown } from '@/components/ui';
import {
  ArrowUpDown,
  BatteryCharging,
  BookOpen,
  Building2,
  BrushCleaning,
  Camera,
  Car,
  ChefHat,
  ChevronDown,
  Compass,
  DollarSign,
  Droplets,
  Dumbbell,
  GlassWater,
  Home,
  Link2,
  Mail,
  MapPin,
  Phone,
  Refrigerator,
  Search,
  Shield,
  Shirt,
  Snowflake,
  Sparkles,
  Tv,
  UtensilsCrossed,
  Users,
  Wifi,
} from 'lucide-react';

const PROPERTY_TYPE_OPTIONS = [
  { value: 'Men', label: 'Men Only', icon: Users },
  { value: 'Women', label: 'Women Only', icon: Users },
  { value: 'Co-ed', label: 'Co-ed (Mixed)', icon: Users },
];

const AMENITY_OPTIONS = [
  { value: 'WiFi', label: 'WiFi', icon: Wifi },
  { value: 'AC', label: 'Air Conditioning', icon: Snowflake },
  { value: 'Parking', label: 'Parking', icon: Car },
  { value: 'Power Backup', label: 'Power Backup', icon: BatteryCharging },
  { value: 'Food / Mess', label: 'Food / Mess', icon: ChefHat },
  { value: 'Gym', label: 'Gym', icon: Dumbbell },
  { value: 'Hot Water', label: 'Hot Water', icon: Droplets },
  { value: 'RO Drinking Water', label: 'RO Drinking Water', icon: GlassWater },
  { value: 'TV', label: 'Television', icon: Tv },
  { value: 'Kitchen', label: 'Kitchen', icon: UtensilsCrossed },
  { value: 'Refrigerator', label: 'Refrigerator', icon: Refrigerator },
  { value: 'Lift', label: 'Lift', icon: ArrowUpDown },
  { value: 'Security', label: '24/7 Security', icon: Shield },
  { value: 'Laundry', label: 'Laundry', icon: Shirt },
  { value: 'Housekeeping', label: 'Housekeeping', icon: BrushCleaning },
  { value: 'CCTV', label: 'CCTV Surveillance', icon: Camera },
  { value: 'Study Area', label: 'Study Area', icon: BookOpen },
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

const SECTION_TONES = {
  slate: 'from-slate-700 to-slate-900',
  blue: 'from-sky-500 to-blue-600',
  emerald: 'from-emerald-500 to-teal-600',
  amber: 'from-amber-500 to-orange-500',
  violet: 'from-violet-500 to-fuchsia-600',
  rose: 'from-rose-500 to-pink-600',
};

function FormSection({ icon: Icon, title, description, tone = 'slate', children }) {
  return (
    <section className="overflow-visible rounded-[1.35rem] border border-slate-200/80 bg-white/95 shadow-[0_12px_30px_rgba(15,23,42,0.045)]">
      <div className="border-b border-slate-100 bg-[linear-gradient(180deg,rgba(248,250,252,0.9),rgba(255,255,255,0.85))] px-4 py-3.5 sm:px-5">
        <div className="flex items-start gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-sm ${SECTION_TONES[tone]}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-slate-950">{title}</h3>
            {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
          </div>
        </div>
      </div>
      <div className="px-4 py-4 sm:px-5">{children}</div>
    </section>
  );
}

function CollapsibleFormSection({
  icon: Icon,
  title,
  description,
  tone = 'slate',
  summary = 'Optional',
  isOpen,
  onToggle,
  children,
}) {
  return (
    <section className="overflow-visible rounded-[1.35rem] border border-slate-200/80 bg-white/95 shadow-[0_12px_30px_rgba(15,23,42,0.045)]">
      <button
        type="button"
        onClick={onToggle}
        className="w-full border-b border-slate-100 bg-[linear-gradient(180deg,rgba(248,250,252,0.9),rgba(255,255,255,0.85))] px-4 py-3.5 text-left sm:px-5"
      >
        <div className="flex items-start gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-sm ${SECTION_TONES[tone]}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[15px] font-semibold text-slate-950">{title}</h3>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500">
                  {summary}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
              </div>
            </div>
            {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
          </div>
        </div>
      </button>
      {isOpen ? <div className="px-4 py-4 sm:px-5">{children}</div> : null}
    </section>
  );
}

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
  const [optionalSections, setOptionalSections] = useState({
    contact: false,
    amenities: false,
    notes: false,
  });

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
    setOptionalSections({
      contact: false,
      amenities: false,
      notes: false,
    });

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

    if (!validation.isValid) {
      setOptionalSections((current) => ({
        contact:
          current.contact ||
          Boolean(validation.errors.phone || validation.errors.email || validation.errors.website),
        amenities: current.amenities,
        notes: current.notes || Boolean(validation.errors.description),
      }));
      return;
    }

    await onSubmit(validation.payload);
  };

  const contactSummary =
    formData.phone || formData.email || formData.website ? 'Added' : 'Optional';
  const amenitiesSummary =
    formData.amenities.length > 0 ? `${formData.amenities.length} selected` : 'Optional';
  const notesSummary = cleanString(formData.description) ? 'Added' : 'Optional';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="lg"
      className="border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.98))]"
    >
      <div className="max-h-[82vh] overflow-y-auto">
        <form onSubmit={submitForm} className="space-y-3">
          <FormSection
            icon={Building2}
            title="Basic information"
            description="Start with the property identity and who the PG is intended for."
            tone="slate"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Property Name"
                required
                value={formData.name}
                onChange={(event) => updateField('name', event.target.value)}
                placeholder="e.g., Sunrise PG"
                error={formErrors.name}
                premium
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
          </FormSection>

          <FormSection
            icon={MapPin}
            title="Address"
            description="Use address search or GPS, then review each field before saving."
            tone="blue"
          >
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
                  premium
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
                  <div className="max-h-48 overflow-y-auto rounded-2xl border border-slate-200/80 bg-white shadow-[0_14px_28px_rgba(15,23,42,0.08)]">
                    {addressSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        type="button"
                        onClick={() => selectAddressSuggestion(suggestion)}
                        className="w-full border-b border-slate-100 px-4 py-3 text-left text-sm text-slate-700 last:border-b-0 hover:bg-slate-50"
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
                  premium
                />
                <Input
                  label="Address Line 2"
                  value={formData.addressLine2}
                  onChange={(event) => updateField('addressLine2', event.target.value)}
                  placeholder="Apartment, block, sector (optional)"
                  premium
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
                  premium
                />
                <Input
                  label="Landmark"
                  value={formData.landmark}
                  onChange={(event) => updateField('landmark', event.target.value)}
                  placeholder="e.g., Near Metro Station"
                  premium
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
                  premium
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
                  premium
                />

                <Input label="Country" value={COUNTRY_FIXED} disabled premium />
              </div>
            </div>
          </FormSection>

          <FormSection
            icon={Home}
            title="Capacity planning"
            description="These are planned values for the property profile. Live inventory starts after floor, room, and bed setup."
            tone="emerald"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Input
                label="Total Floors"
                type="number"
                value={formData.totalFloors}
                onChange={(event) => updateField('totalFloors', event.target.value)}
                placeholder="e.g., 4"
                error={formErrors.totalFloors}
                premium
              />
              <Input
                label="Total Rooms"
                type="number"
                value={formData.totalRooms}
                onChange={(event) => updateField('totalRooms', event.target.value)}
                placeholder="e.g., 16"
                error={formErrors.totalRooms}
                premium
              />
              <Input
                label="Total Beds"
                type="number"
                required
                value={formData.totalBeds}
                onChange={(event) => updateField('totalBeds', event.target.value)}
                placeholder="e.g., 48"
                error={formErrors.totalBeds}
                premium
              />
            </div>
          </FormSection>

          <FormSection
            icon={DollarSign}
            title="Pricing"
            description="Set the base monthly rent and deposit for this property profile."
            tone="amber"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Monthly Rent (₹)"
                type="number"
                required
                value={formData.monthlyRent}
                onChange={(event) => updateField('monthlyRent', event.target.value)}
                placeholder="e.g., 8000"
                error={formErrors.monthlyRent}
                premium
              />
              <Input
                label="Security Deposit (₹)"
                type="number"
                value={formData.securityDeposit}
                onChange={(event) => updateField('securityDeposit', event.target.value)}
                placeholder="e.g., 16000"
                error={formErrors.securityDeposit}
                premium
              />
            </div>
          </FormSection>

          <CollapsibleFormSection
            icon={Phone}
            title="Contact information"
            description="Optional, but useful for residents and future operational workflows."
            tone="violet"
            summary={contactSummary}
            isOpen={optionalSections.contact}
            onToggle={() =>
              setOptionalSections((current) => ({ ...current, contact: !current.contact }))
            }
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Input
                label="Phone"
                type="tel"
                value={formData.phone}
                onChange={(event) => updateField('phone', event.target.value)}
                placeholder="+91 9876543210"
                icon={Phone}
                error={formErrors.phone}
                premium
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(event) => updateField('email', event.target.value)}
                placeholder="property@example.com"
                icon={Mail}
                error={formErrors.email}
                premium
              />
              <Input
                label="Website"
                type="text"
                value={formData.website}
                onChange={(event) => updateField('website', event.target.value)}
                placeholder="example.com"
                icon={Link2}
                error={formErrors.website}
                premium
              />
            </div>
          </CollapsibleFormSection>

          <CollapsibleFormSection
            icon={Sparkles}
            title="Amenities"
            description="Pick the facilities residents can expect at this property."
            tone="rose"
            summary={amenitiesSummary}
            isOpen={optionalSections.amenities}
            onToggle={() =>
              setOptionalSections((current) => ({ ...current, amenities: !current.amenities }))
            }
          >
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {AMENITY_OPTIONS.map((amenity) => {
                const Icon = amenity.icon;
                const isSelected = formData.amenities.includes(amenity.value);
                return (
                  <button
                    key={amenity.value}
                    type="button"
                    onClick={() => toggleAmenity(amenity.value)}
                    className={`rounded-2xl border p-3.5 text-left transition-all duration-200 ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50/80 text-primary-700 shadow-[0_10px_24px_rgba(59,130,246,0.10)]'
                        : 'border-slate-200 bg-white hover:border-primary-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                        isSelected ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium">{amenity.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </CollapsibleFormSection>

          <CollapsibleFormSection
            icon={Users}
            title="Additional notes"
            description="Add a short internal description for this property profile."
            tone="slate"
            summary={notesSummary}
            isOpen={optionalSections.notes}
            onToggle={() =>
              setOptionalSections((current) => ({ ...current, notes: !current.notes }))
            }
          >
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(event) => updateField('description', event.target.value)}
              rows={4}
              className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 transition-all focus:outline-none focus:ring-2 ${
                formErrors.description
                  ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
                  : 'border-slate-200 focus:border-primary-500 focus:ring-primary-500/15'
              }`}
              placeholder="Brief description about the property, resident profile, or setup notes"
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              {formErrors.description ? (
                <p className="text-xs text-red-600">{formErrors.description}</p>
              ) : (
                <p className="text-xs text-slate-500">Keep it concise. This description is limited to 500 characters.</p>
              )}
              <p className="text-xs font-medium text-slate-400">
                {formData.description.length}/500
              </p>
            </div>
          </CollapsibleFormSection>

          <div className="sticky bottom-0 rounded-[1.35rem] border border-slate-200/80 bg-white/95 p-3.5 shadow-[0_-10px_24px_rgba(15,23,42,0.06)] backdrop-blur">
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
