import type { Lang } from "./i18n";

export type SyncState = "synced" | "pending" | "failed";
export type Role = "collector" | "recycler" | "admin";

export interface Collector {
  collector_id: string;
  nickname?: string;
  mobile: string;
  preferred_language: Lang;
  general_location: string;
  photo?: string;
  created_at: string;
}

export type VerificationStatus = "verified" | "pending" | "rejected" | "suspended";

export interface Recycler {
  recycler_id: string;
  recycler_name: string;
  facility_name: string;
  location: string;
  latitude: number;
  longitude: number;
  materials_accepted: string[];
  authorization_number: string;
  authorization_status: VerificationStatus;
  contact: string;
  offered_rate: Record<string, number>;
  pickup_available: boolean;
  service_area: string[];
  rating: number;
  distance_km: number;
  verification_date?: string;
  created_at: string;
}

export interface Material {
  material_id: string;
  category: string;
  subcategory: string;
  description: string;
  icon: string;
  approximate_weight: number;
  condition: string;
  source_type: string;
  estimated_value: number;
  created_at: string;
  updated_at: string;
}

export interface Price {
  price_id: string;
  material_category: string;
  subcategory: string;
  location: string;
  date_time: string;
  buying_price: number;
  selling_price: number;
  unit: string;
  market_range_min: number;
  market_range_max: number;
  recycler_id: string;
  created_at: string;
}

export type LotStatus =
  | "available"
  | "pickup_requested"
  | "accepted"
  | "scheduled"
  | "collected"
  | "handover_confirmed"
  | "paid";

export interface LotItem {
  material_category: string;
  subcategory: string;
  weight: number;
  condition: string;
  photo?: string;
}

export interface TimelineEvent {
  step: string;
  icon: string;
  at: string;
  location?: string;
}

export interface Lot {
  lot_id: string;
  collector_id: string;
  items: LotItem[];
  description: string;
  photo?: string;
  weight: number;
  source_type: string;
  collection_location: string;
  gps: { lat: number; lng: number };
  created_at: string;
  estimated_value: number;
  final_value?: number;
  recycler_id?: string;
  status: LotStatus;
  sync: SyncState;
  timeline: TimelineEvent[];
  pickup?: { date: string; time: string; location: string };
  handover_id?: string;
}

export type PaymentStatus =
  | "pending"
  | "cash_paid"
  | "upi_paid"
  | "partially_paid"
  | "failed";

export interface Transaction {
  transaction_id: string;
  lot_id: string;
  collector_id: string;
  material_category: string;
  quantity: number;
  weight: number;
  quoted_price: number;
  final_price: number;
  recycler_id: string;
  collection_location: string;
  handover_location: string;
  date_time: string;
  payment_status: PaymentStatus;
  transaction_status: LotStatus;
  flagged?: string;
}

export interface Traceability {
  traceability_id: string;
  lot_id: string;
  photograph_reference?: string;
  weight: number;
  timestamp: string;
  gps_location: string;
  handover_reference: string;
  collector_confirmation: boolean;
  recycler_confirmation: boolean;
  transaction_status: LotStatus;
  final_price: number;
  collector_id: string;
  recycler_id: string;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  at: string;
  role: Role;
  read: boolean;
}

export interface Session {
  role: Role;
  id: string;
  name: string;
}

export interface DB {
  collectors: Collector[];
  recyclers: Recycler[];
  materials: Material[];
  prices: Price[];
  lots: Lot[];
  transactions: Transaction[];
  traceability: Traceability[];
  notifications: AppNotification[];
  settings: { commission_pct: number; pickup_cost: number; ops_cost: number };
  session: Session | null;
  lang: Lang;
  queue: { id: string; label: string; at: string; state: SyncState }[];
}
