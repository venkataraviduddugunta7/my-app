"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import {
  AlertCircle,
  ArrowUpDown,
  BatteryCharging,
  Bed,
  BookOpen,
  Building2,
  BrushCleaning,
  Camera,
  Car,
  ChefHat,
  Check,
  DollarSign,
  Droplets,
  Dumbbell,
  Edit2,
  GlassWater,
  Home,
  Mail,
  Phone,
  Plus,
  Refrigerator,
  RefreshCw,
  Search,
  Shield,
  Shirt,
  Snowflake,
  Tv,
  Trash2,
  UtensilsCrossed,
  Users,
  Wifi,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import PropertyFormModal from "@/components/property/PropertyFormModal";
import propertyService from "@/services/propertyService";
import { addToast } from "@/store/slices/uiSlice";
import { setSelectedProperty } from "@/store/slices/propertySlice";
import { validateCapacityUpdate } from "@/utils/capacityValidation";
import { formatCurrency } from "@/lib/utils";

const PROPERTY_FILTERS = [
  { id: "all", label: "All" },
  { id: "Men", label: "Men" },
  { id: "Women", label: "Women" },
  { id: "Co-ed", label: "Co-ed" },
];

const TYPE_STYLES = {
  Men: "border-sky-200/80 bg-sky-50 text-sky-700",
  Women: "border-rose-200/80 bg-rose-50 text-rose-700",
  "Co-ed": "border-violet-200/80 bg-violet-50 text-violet-700",
};

const SUMMARY_STYLES = {
  blue: "border-sky-200/80 bg-[linear-gradient(180deg,rgba(240,249,255,0.96),rgba(255,255,255,0.92))] text-sky-700",
  emerald:
    "border-emerald-200/80 bg-[linear-gradient(180deg,rgba(236,253,245,0.96),rgba(255,255,255,0.92))] text-emerald-700",
  violet:
    "border-violet-200/80 bg-[linear-gradient(180deg,rgba(245,243,255,0.96),rgba(255,255,255,0.92))] text-violet-700",
  amber:
    "border-amber-200/80 bg-[linear-gradient(180deg,rgba(255,251,235,0.96),rgba(255,255,255,0.92))] text-amber-700",
};

const AMENITY_META = {
  WiFi: { icon: Wifi, chip: "text-sky-700" },
  AC: { icon: Snowflake, chip: "text-cyan-700" },
  Parking: { icon: Car, chip: "text-slate-700" },
  "Power Backup": { icon: BatteryCharging, chip: "text-amber-700" },
  "Food / Mess": { icon: ChefHat, chip: "text-orange-700" },
  Gym: { icon: Dumbbell, chip: "text-rose-700" },
  "Hot Water": { icon: Droplets, chip: "text-amber-700" },
  "RO Drinking Water": { icon: GlassWater, chip: "text-sky-700" },
  TV: { icon: Tv, chip: "text-violet-700" },
  Kitchen: { icon: UtensilsCrossed, chip: "text-emerald-700" },
  Refrigerator: { icon: Refrigerator, chip: "text-cyan-700" },
  Lift: { icon: ArrowUpDown, chip: "text-slate-700" },
  Security: { icon: Shield, chip: "text-indigo-700" },
  Laundry: { icon: Shirt, chip: "text-fuchsia-700" },
  Housekeeping: { icon: BrushCleaning, chip: "text-teal-700" },
  CCTV: { icon: Camera, chip: "text-slate-700" },
  "Study Area": { icon: BookOpen, chip: "text-blue-700" },
};

const AMENITY_GAP_PX = 8;

const derivePropertyMetrics = (property) => {
  const floors = Array.isArray(property?.floors) ? property.floors : [];

  let actualRooms = 0;
  let actualBeds = 0;
  let occupiedBeds = 0;
  let availableBeds = 0;
  let maintenanceBeds = 0;
  let reservedBeds = 0;
  let activeTenants = 0;

  floors.forEach((floor) => {
    const rooms = Array.isArray(floor?.rooms) ? floor.rooms : [];
    actualRooms += rooms.length;

    rooms.forEach((room) => {
      const beds = Array.isArray(room?.beds) ? room.beds : [];
      actualBeds += beds.length;

      beds.forEach((bed) => {
        if (bed?.tenant?.status === "ACTIVE") {
          activeTenants += 1;
        }

        switch (bed?.status) {
          case "OCCUPIED":
            occupiedBeds += 1;
            break;
          case "AVAILABLE":
            availableBeds += 1;
            break;
          case "MAINTENANCE":
            maintenanceBeds += 1;
            break;
          case "RESERVED":
            reservedBeds += 1;
            break;
          default:
            break;
        }
      });
    });
  });

  const plannedFloors = Number(property?.totalFloors) || 0;
  const plannedRooms = Number(property?.totalRooms) || 0;
  const plannedBeds = Number(property?.totalBeds) || 0;
  const liveFloors = floors.length;
  const occupancyRate = actualBeds > 0 ? (occupiedBeds / actualBeds) * 100 : 0;

  return {
    plannedFloors,
    plannedRooms,
    plannedBeds,
    liveFloors,
    liveRooms: actualRooms,
    liveBeds: actualBeds,
    occupiedBeds,
    availableBeds,
    maintenanceBeds,
    reservedBeds,
    activeTenants,
    occupancyRate,
    hasLiveInventory: actualBeds > 0 || actualRooms > 0 || liveFloors > 0,
  };
};

function SummaryCard({ icon: Icon, label, value, helper, tone = "blue" }) {
  return (
    <div className={`rounded-[1.5rem] border px-4 py-3.5 shadow-[0_12px_30px_rgba(15,23,42,0.04)] ${SUMMARY_STYLES[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
          <p className="mt-1.5 text-[1.75rem] font-semibold tracking-tight text-slate-950">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-[1.1rem] border border-white/70 bg-white/75">
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
      <p className="mt-1.5 text-[11px] text-slate-500">{helper}</p>
    </div>
  );
}

function AmenityChipLabel({ label, icon: Icon, muted = false, labelProps = {} }) {
  const baseClasses = muted ? "text-slate-500" : "text-slate-600";
  const iconTone = muted ? "text-slate-400" : "text-slate-500";

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-xs font-medium ${baseClasses}`}
    >
      {Icon ? <Icon className={`h-3.5 w-3.5 ${iconTone}`} /> : null}
      <span {...labelProps}>{label}</span>
    </span>
  );
}

function TooltipChip({ label, tooltip, icon: Icon, muted = false }) {
  const buttonRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0, placement: "top" });

  useEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    const updatePosition = () => {
      if (!buttonRef.current) return;

      const rect = buttonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const tooltipHalfWidth = 112;
      const left = Math.min(
        viewportWidth - 16 - tooltipHalfWidth,
        Math.max(16 + tooltipHalfWidth, rect.left + rect.width / 2)
      );

      const showBelow = rect.top < 72;

      setTooltipPosition({
        left,
        top: showBelow ? rect.bottom + 10 : rect.top - 10,
        placement: showBelow ? "bottom" : "top",
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        ref={buttonRef}
        className="rounded-full focus:outline-none focus:ring-2 focus:ring-slate-300"
        aria-label={tooltip}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
      >
        <AmenityChipLabel label={label} icon={Icon} muted={muted} />
      </button>
      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              className="pointer-events-none fixed z-[9999] w-max max-w-[14rem] rounded-xl bg-slate-950 px-3 py-2 text-center text-[11px] font-medium leading-5 text-white shadow-[0_18px_40px_rgba(15,23,42,0.28)]"
              style={{
                left: tooltipPosition.left,
                top: tooltipPosition.top,
                transform:
                  tooltipPosition.placement === "top"
                    ? "translate(-50%, calc(-100% - 2px))"
                    : "translate(-50%, 2px)",
              }}
            >
              <div className="whitespace-normal">{tooltip}</div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}

function AmenitiesPreview({ amenities }) {
  const measureRef = useRef(null);
  const [visibleCount, setVisibleCount] = useState(amenities.length);

  useEffect(() => {
    if (!measureRef.current || amenities.length === 0) {
      setVisibleCount(amenities.length);
      return;
    }

    let animationFrameId;

    const updateVisibleCount = () => {
      if (!measureRef.current) return;

      const chips = Array.from(measureRef.current.querySelectorAll("[data-amenity-chip='true']"));
      const overflowChip = measureRef.current.querySelector("[data-overflow-chip='true']");
      const overflowLabel = measureRef.current.querySelector("[data-overflow-label='true']");
      const availableWidth = measureRef.current.clientWidth;

      if (!overflowChip || !overflowLabel || availableWidth === 0) {
        setVisibleCount(amenities.length);
        return;
      }

      if (chips.length === 0) {
        setVisibleCount(0);
        return;
      }

      let usedWidth = 0;
      let count = 0;

      for (let index = 0; index < chips.length; index += 1) {
        const chipWidth = chips[index].offsetWidth;
        const nextUsedWidth = usedWidth + (count > 0 ? AMENITY_GAP_PX : 0) + chipWidth;
        const hiddenCount = amenities.length - (index + 1);

        let totalWidth = nextUsedWidth;
        if (hiddenCount > 0) {
          overflowLabel.textContent = `+${hiddenCount} more`;
          totalWidth += AMENITY_GAP_PX + overflowChip.offsetWidth;
        }

        if (totalWidth <= availableWidth || count === 0) {
          usedWidth = nextUsedWidth;
          count += 1;
          continue;
        }

        break;
      }

      setVisibleCount(Math.max(1, Math.min(count, amenities.length)));
    };

    const runMeasurement = () => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = window.requestAnimationFrame(updateVisibleCount);
    };

    runMeasurement();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(runMeasurement);
      observer.observe(measureRef.current);
      return () => {
        cancelAnimationFrame(animationFrameId);
        observer.disconnect();
      };
    }

    window.addEventListener("resize", runMeasurement);
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", runMeasurement);
    };
  }, [amenities]);

  const visibleAmenities = amenities.slice(0, visibleCount);
  const hiddenAmenities = amenities.slice(visibleCount);

  return (
    <div className="relative mt-5">
      <div ref={measureRef} className="pointer-events-none absolute inset-x-0 top-0 -z-10 flex items-start gap-2 opacity-0">
        {amenities.map((amenity) => {
          const amenityMeta = AMENITY_META[amenity] || {};

          return (
            <div key={`measure-${amenity}`} data-amenity-chip="true">
              <AmenityChipLabel label={amenity} icon={amenityMeta.icon} />
            </div>
          );
        })}
        <div data-overflow-chip="true">
          <AmenityChipLabel label="+0 more" muted labelProps={{ "data-overflow-label": "true" }} />
        </div>
      </div>

      <div className="flex min-w-0 items-center gap-2">
        <div className="flex min-w-0 items-center gap-2 overflow-hidden">
          {visibleAmenities.map((amenity) => {
            const amenityMeta = AMENITY_META[amenity] || {};

            return <AmenityChipLabel key={amenity} label={amenity} icon={amenityMeta.icon} />;
          })}
        </div>
        {hiddenAmenities.length > 0 ? (
          <div className="shrink-0">
            <TooltipChip
              label={`+${hiddenAmenities.length} more`}
              tooltip={hiddenAmenities.join(", ")}
              muted
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function PropertiesLoadingState() {
  return (
    <div className="app-shell min-h-screen space-y-6 p-4 sm:p-6">
      <div className="app-surface rounded-[2rem] p-6 sm:p-7">
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-3">
            <div className="h-4 w-28 animate-pulse rounded-full bg-slate-200" />
            <div className="h-10 w-72 animate-pulse rounded-2xl bg-slate-200" />
            <div className="h-4 w-full max-w-2xl animate-pulse rounded-full bg-slate-200" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-[1.65rem] bg-slate-200/80" />
            ))}
          </div>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-[1.65rem] bg-slate-200/80" />
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-[28rem] animate-pulse rounded-[1.75rem] bg-slate-200/80" />
        ))}
      </div>
    </div>
  );
}

function PropertyCard({
  property,
  metrics,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  deleting,
}) {
  const occupancyTone =
    metrics.liveBeds === 0
      ? "border-slate-200/80 bg-slate-50 text-slate-600"
      : metrics.occupancyRate >= 85
      ? "border-emerald-200/80 bg-emerald-50 text-emerald-700"
      : metrics.occupancyRate >= 60
      ? "border-amber-200/80 bg-amber-50 text-amber-700"
      : "border-rose-200/80 bg-rose-50 text-rose-700";

  const capacityLabel = metrics.hasLiveInventory ? "Live inventory" : "Inventory not configured";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      className={`relative overflow-hidden rounded-[1.85rem] border bg-white/88 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl ${
        isSelected ? "border-slate-900/15 ring-2 ring-slate-900/10" : "border-white/70"
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.12),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.10),transparent_26%)]" />
      <div className="relative flex h-full flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.35rem] border border-sky-200/80 bg-sky-100/80 text-sky-700 shadow-[0_12px_24px_rgba(56,189,248,0.15)]">
              <Building2 className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-xl font-semibold tracking-tight text-slate-950">{property.name}</h2>
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
                    TYPE_STYLES[property.type] || TYPE_STYLES["Co-ed"]
                  }`}
                >
                  {property.type}
                </span>
              </div>
            </div>
          </div>

          {isSelected ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              <Check className="h-3.5 w-3.5" />
              Selected
            </span>
          ) : null}
        </div>

        <div className="mt-5 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-200/80 bg-emerald-100/80 text-emerald-700">
                <Phone className="h-4 w-4" />
              </div>
              <p className="truncate text-sm text-slate-700">{property.phone || "Phone not added"}</p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-200/80 bg-violet-100/80 text-violet-700">
                <Mail className="h-4 w-4" />
              </div>
              <p className="truncate text-sm text-slate-700">{property.email || "Email not added"}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white/84 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Planned beds</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{metrics.plannedBeds}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white/84 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Live beds</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{metrics.liveBeds}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white/84 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Occupied</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{metrics.occupiedBeds}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white/84 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Base rent</p>
            <p className="mt-2 text-lg font-semibold tracking-tight text-slate-950">
              {property.monthlyRent ? formatCurrency(property.monthlyRent) : "Not set"}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-[1.5rem] border border-slate-200/80 bg-white/82 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">{capacityLabel}</p>
              <p className="mt-1 text-xs text-slate-500">
                Floors {metrics.liveFloors}/{metrics.plannedFloors || 0} • Rooms {metrics.liveRooms}/
                {metrics.plannedRooms || 0}
              </p>
            </div>
            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${occupancyTone}`}>
              {metrics.liveBeds > 0 ? `${metrics.occupancyRate.toFixed(0)}% occupied` : "Setup pending"}
            </span>
          </div>

          {metrics.liveBeds > 0 ? (
            <>
              <div className="mt-4 h-2 rounded-full bg-slate-200/80">
                <div
                  className="h-2 rounded-full bg-slate-900 transition-all duration-300"
                  style={{ width: `${Math.min(metrics.occupancyRate, 100)}%` }}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                <span className="rounded-full border border-slate-200/80 bg-slate-50 px-2.5 py-1">
                  Available {metrics.availableBeds}
                </span>
                <span className="rounded-full border border-slate-200/80 bg-slate-50 px-2.5 py-1">
                  Maintenance {metrics.maintenanceBeds}
                </span>
                <span className="rounded-full border border-slate-200/80 bg-slate-50 px-2.5 py-1">
                  Active tenants {metrics.activeTenants}
                </span>
              </div>
            </>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200/90 bg-slate-50/80 px-3 py-3 text-sm text-slate-500">
              Rooms and beds are not configured yet. Planned capacity is saved, but live occupancy starts only
              after room and bed setup.
            </div>
          )}
        </div>

        {Array.isArray(property.amenities) && property.amenities.length > 0 ? (
          <AmenitiesPreview amenities={property.amenities} />
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-200/80 pt-5">
          {!isSelected ? (
            <Button onClick={() => onSelect(property)} className="flex-1 min-w-[10rem]">
              <Check className="h-4 w-4" />
              <span>Select property</span>
            </Button>
          ) : (
            <div className="flex flex-1 min-w-[10rem] items-center justify-center rounded-2xl border border-emerald-200/80 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700">
              Active property context
            </div>
          )}

          <Button variant="outline" onClick={() => onEdit(property)}>
            <Edit2 className="h-4 w-4" />
            <span>Edit</span>
          </Button>

          <Button variant="destructive" onClick={() => onDelete(property)} disabled={deleting}>
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </Button>
        </div>
      </div>
    </motion.article>
  );
}

export default function PropertiesPage() {
  const dispatch = useDispatch();
  const { selectedProperty } = useSelector((state) => state.property);

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState(null);

  const selectedPropertyIdRef = useRef(null);

  useEffect(() => {
    selectedPropertyIdRef.current = selectedProperty?.id || null;
  }, [selectedProperty?.id]);

  const refreshProperties = async ({ silent = false, preferredSelectionId = null } = {}) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);
      const response = await propertyService.getProperties();

      if (!response.success) {
        throw new Error(response.message || "Failed to fetch properties");
      }

      const nextProperties = Array.isArray(response.data) ? response.data : [];
      setProperties(nextProperties);

      const preferredId = preferredSelectionId || selectedPropertyIdRef.current;
      const preferredSelection = preferredId
        ? nextProperties.find((property) => property.id === preferredId)
        : null;

      if (preferredSelection) {
        dispatch(setSelectedProperty(preferredSelection));
      } else if (nextProperties.length > 0) {
        dispatch(setSelectedProperty(nextProperties[0]));
      } else {
        dispatch(setSelectedProperty(null));
      }
    } catch (fetchError) {
      console.error("Error fetching properties:", fetchError);
      setError(fetchError.message);
      dispatch(
        addToast({
          title: "Error",
          description: fetchError.message || "Failed to load properties. Please try again.",
          variant: "error",
        })
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    refreshProperties();
  }, []);

  useEffect(() => {
    const handlePropertyUpdate = () => {
      refreshProperties({ silent: true });
    };

    if (typeof window !== "undefined") {
      window.addEventListener("property-update", handlePropertyUpdate);
      window.addEventListener("property-metrics-update", handlePropertyUpdate);
      return () => {
        window.removeEventListener("property-update", handlePropertyUpdate);
        window.removeEventListener("property-metrics-update", handlePropertyUpdate);
      };
    }
  }, []);

  const derivedProperties = useMemo(
    () =>
      properties.map((property) => ({
        ...property,
        metrics: derivePropertyMetrics(property),
      })),
    [properties]
  );

  const portfolioMetrics = useMemo(() => {
    return derivedProperties.reduce(
      (accumulator, property) => {
        accumulator.properties += 1;
        accumulator.plannedBeds += property.metrics.plannedBeds;
        accumulator.liveBeds += property.metrics.liveBeds;
        accumulator.occupiedBeds += property.metrics.occupiedBeds;
        return accumulator;
      },
      { properties: 0, plannedBeds: 0, liveBeds: 0, occupiedBeds: 0 }
    );
  }, [derivedProperties]);

  const filteredProperties = useMemo(() => {
    return derivedProperties.filter((property) => {
      const query = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !query ||
        property.name?.toLowerCase().includes(query) ||
        property.address?.toLowerCase().includes(query) ||
        property.city?.toLowerCase().includes(query) ||
        property.state?.toLowerCase().includes(query) ||
        property.phone?.toLowerCase().includes(query) ||
        property.email?.toLowerCase().includes(query);

      const matchesType = filterType === "all" || property.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [derivedProperties, filterType, searchTerm]);

  const handleAddProperty = () => {
    setEditingProperty(null);
    setShowModal(true);
  };

  const handleEditProperty = (property) => {
    setEditingProperty(property);
    setShowModal(true);
  };

  const handleSelectProperty = (property) => {
    dispatch(setSelectedProperty(property));
    dispatch(
      addToast({
        title: "Property selected",
        description: `${property.name} is now the active property context.`,
        variant: "success",
      })
    );
  };

  const handleDeleteProperty = (property) => {
    setPropertyToDelete(property);
    setShowDeleteModal(true);
  };

  const confirmDeleteProperty = async () => {
    if (!propertyToDelete) return;

    try {
      setSubmitting(true);
      const response = await propertyService.deleteProperty(propertyToDelete.id);

      if (!response.success) {
        throw new Error(response.message || "Failed to delete property");
      }

      await refreshProperties({ silent: true });

      dispatch(
        addToast({
          title: "Property deleted",
          description: response.message || `${propertyToDelete.name} was deleted successfully.`,
          variant: "success",
        })
      );

      setShowDeleteModal(false);
      setPropertyToDelete(null);
    } catch (deleteError) {
      console.error("Error deleting property:", deleteError);
      dispatch(
        addToast({
          title: "Error",
          description: deleteError.message || "Failed to delete property. Please try again.",
          variant: "error",
        })
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handlePropertyFormSubmit = async (payload) => {
    if (editingProperty) {
      const capacityValidation = validateCapacityUpdate(editingProperty, payload);
      if (!capacityValidation.isValid) {
        dispatch(
          addToast({
            title: "Capacity validation failed",
            description: capacityValidation.errors.join(", "),
            variant: "error",
          })
        );
        return;
      }
    }

    try {
      setSubmitting(true);

      const response = editingProperty
        ? await propertyService.updateProperty(editingProperty.id, payload)
        : await propertyService.createProperty(payload);

      if (!response.success) {
        throw new Error(response.message || "Failed to save property");
      }

      const nextSelectedId = response.data?.id || editingProperty?.id || null;
      await refreshProperties({ silent: true, preferredSelectionId: nextSelectedId });

      dispatch(
        addToast({
          title: editingProperty ? "Property updated" : "Property added",
          description:
            response.message ||
            `${payload.name} has been ${editingProperty ? "updated" : "added"} successfully.`,
          variant: "success",
        })
      );

      setShowModal(false);
      setEditingProperty(null);
    } catch (saveError) {
      console.error("Error saving property:", saveError);
      dispatch(
        addToast({
          title: "Error",
          description: saveError.message || "Failed to save property. Please try again.",
          variant: "error",
        })
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && properties.length === 0) {
    return <PropertiesLoadingState />;
  }

  return (
    <div className="app-shell min-h-screen space-y-6 p-4 sm:space-y-8 sm:p-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.92),rgba(255,255,255,0.78)_34%,rgba(248,250,252,0.95)_100%)] p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_18%,rgba(56,189,248,0.16),transparent_22%),radial-gradient(circle_at_10%_85%,rgba(16,185,129,0.12),transparent_20%)]" />
        <div className="relative flex flex-col gap-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Properties</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-[2rem]">
                Clear property setup, live inventory, one view.
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                Set planned capacity, then track real rooms, beds, and occupancy as they go live.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button variant="outline" onClick={() => refreshProperties({ silent: true })} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </Button>
              <Button onClick={handleAddProperty} disabled={submitting}>
                <Plus className="h-4 w-4" />
                <span>Add property</span>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              icon={Building2}
              label="Properties"
              value={portfolioMetrics.properties}
              helper="Total PG properties in your portfolio"
              tone="blue"
            />
            <SummaryCard
              icon={Home}
              label="Planned capacity"
              value={portfolioMetrics.plannedBeds}
              helper="Beds planned in the property profile"
              tone="violet"
            />
            <SummaryCard
              icon={Bed}
              label="Live inventory"
              value={portfolioMetrics.liveBeds}
              helper="Beds configured through rooms and beds"
              tone="emerald"
            />
            <SummaryCard
              icon={Users}
              label="Occupied beds"
              value={portfolioMetrics.occupiedBeds}
              helper="Current live occupancy from configured beds"
              tone="amber"
            />
          </div>

          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="flex-1">
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by property, city, address, phone, or email"
                icon={Search}
                premium
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {PROPERTY_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setFilterType(filter.id)}
                  className={`rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
                    filterType === filter.id
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-[1.65rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5" />
            <div>
              <p className="font-semibold">Unable to load properties</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        </div>
      ) : null}

      {filteredProperties.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filteredProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                metrics={property.metrics}
                isSelected={selectedProperty?.id === property.id}
                onSelect={handleSelectProperty}
                onEdit={handleEditProperty}
                onDelete={handleDeleteProperty}
                deleting={submitting}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <section className="app-surface rounded-[2rem] p-10 text-center">
          <div className="mx-auto flex max-w-xl flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] border border-slate-200/80 bg-white/85 text-slate-700">
              <Building2 className="h-7 w-7" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
              {searchTerm || filterType !== "all" ? "No matching properties" : "Add your first property"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
              {searchTerm || filterType !== "all"
                ? "Try a different search or filter. The list is powered by live property records only."
                : "Create the property profile first, then configure rooms and beds to start live occupancy tracking."}
            </p>
            {!searchTerm && filterType === "all" ? (
              <Button className="mt-6" onClick={handleAddProperty}>
                <Plus className="h-4 w-4" />
                <span>Add property</span>
              </Button>
            ) : null}
          </div>
        </section>
      )}

      <PropertyFormModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingProperty(null);
        }}
        onSubmit={handlePropertyFormSubmit}
        initialValues={editingProperty}
        loading={submitting}
        title={editingProperty ? "Edit property" : "Add new property"}
        submitLabel={editingProperty ? "Update property" : "Save property"}
      />

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete property"
        size="sm"
      >
        <div className="space-y-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-200/80 bg-rose-100/80 text-rose-700">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-950">Delete this property?</h3>
              <p className="mt-1 text-sm text-slate-500">
                This action cannot be undone. Floors, rooms, and beds will be removed with it.
              </p>
            </div>
          </div>

          {propertyToDelete ? (
            <div className="rounded-[1.5rem] border border-slate-200/80 bg-slate-50/80 p-4 text-sm text-slate-600">
              <p>
                <span className="font-semibold text-slate-900">Property:</span> {propertyToDelete.name}
              </p>
              <p className="mt-2">
                <span className="font-semibold text-slate-900">Address:</span> {propertyToDelete.address}
              </p>
              <p className="mt-2">
                <span className="font-semibold text-slate-900">Type:</span> {propertyToDelete.type}
              </p>
            </div>
          ) : null}

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteProperty} loading={submitting}>
              {!submitting && <Trash2 className="h-4 w-4" />}
              <span>Delete property</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
