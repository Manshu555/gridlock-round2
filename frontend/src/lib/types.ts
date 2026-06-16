export interface HotspotProperties {
  h3: string;
  violations: number;
  gi_z?: number;
  gi_p?: number;
  hotspot_category?: string;
  hotspot_score?: number;
  is_hotspot?: number;
  pcii?: number;
  police_station?: string;
  top_violation?: string;
}

export interface GeoJSONFeature {
  type: "Feature";
  geometry: { type: "Polygon"; coordinates: number[][][] };
  properties: HotspotProperties & Record<string, unknown>;
}

export interface FeatureCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

export interface PriorityZone {
  priority_rank: number;
  h3: string;
  police_station?: string;
  eps: number;
  pcii: number;
  violations: number;
  hotspot_category?: string;
  road_class?: string;
  eps_pcii_component?: number;
  eps_freq_component?: number;
  eps_crit_component?: number;
}

export interface ForecastPoint {
  h3: string;
  date: string;
  violations: number;
  prediction: number;
}

export interface ForecastResponse {
  available: boolean;
  metrics?: Record<string, unknown>;  // present in /forecast, absent in /db/forecast
  count?: number;                      // present in /db/forecast
  points: ForecastPoint[];
}

export interface SimulationResponse {
  k: number;
  ranked_by: string;
  cells_cleared: number;
  compliance_factor: number;
  city_impact_before: number;
  city_impact_after: number;
  absolute_reduction: number;
  reduction_pct: number;
  violations_addressed: number;
  cleared_cell_ids: string[];
}

export interface Analytics {
  metrics: Record<string, any>;
  data_profile: Record<string, any>;
}
