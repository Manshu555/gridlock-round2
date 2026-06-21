"use client";
import { MapView } from "@/components/MapView";
import { useAnalytics, useHotspots, usePriorityZones, useSimulation } from "@/hooks/useApi";

export default function Dashboard() {
  const { data: hotspots, isLoading: mapLoading } = useHotspots();
  const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = useAnalytics();
  const { data: zones } = usePriorityZones(10);
  const { data: sim } = useSimulation(5, 0.85);

  const m = analytics?.metrics ?? {};
  const dataLoading = analyticsLoading || mapLoading;

  return (
    <>
      {/* Map Canvas (Left) */}
      <div className="flex-1 relative bg-background border-r border-border">
        
        {/* Actual Map Implementation */}
        <div className="absolute inset-0">
          <MapView data={hotspots} colorBy="pcii" />
        </div>

        {/* Overlay Controls */}
        <div className="absolute top-gutter left-gutter right-gutter flex justify-between items-start pointer-events-none z-10">
          {/* Filter Pill (Left) */}
          <div className="bg-background border border-border flex space-x-2 pointer-events-auto shadow-xl">
            <div className="relative">
              <select className="appearance-none bg-transparent text-foreground font-mono text-label-md rounded-none pl-4 pr-10 py-3 focus:outline-none cursor-pointer">
                <option>Today</option>
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-3 text-muted pointer-events-none">expand_more</span>
            </div>
            <div className="w-px bg-border my-auto h-8"></div>
            <div className="relative">
              <select className="appearance-none bg-transparent text-foreground font-mono text-label-md rounded-none pl-4 pr-10 py-3 focus:outline-none cursor-pointer">
                <option>All Violations</option>
                <option>Double Parking</option>
                <option>No Parking Zone</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-3 text-muted pointer-events-none">expand_more</span>
            </div>
          </div>
          
          {/* Map Legend (Right) */}
          <div className="bg-background border border-border p-4 flex flex-col space-y-3 pointer-events-auto shadow-xl">
            <div className="font-sans text-label-md text-foreground uppercase tracking-wider">H3 Hex Density</div>
            <div className="flex items-center space-x-3">
              <div className="w-32 h-3 bg-gradient-to-r from-[#e5e5e5] via-[#a3a3a3] to-neon"></div>
              <span className="font-mono text-label-sm text-muted">LOW-HIGH</span>
            </div>
          </div>
        </div>

        {/* Simulated Active Hotspot Marker (Visual Flourish) */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-10">
          <div className="absolute w-24 h-24 bg-neon/20 rounded-full animate-ping"></div>
          <div className="w-4 h-4 bg-neon rounded-full shadow-[0_0_20px_#FF3B00]"></div>
        </div>
      </div>

      {/* Data Panel (Right) */}
      <div className="w-[450px] bg-background flex flex-col h-full z-10 overflow-y-auto">
        <div className="p-8 border-b border-border">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-sans text-headline-md font-bold text-foreground tracking-tight uppercase">Hotspot_Details</h2>
            <button className="p-1 text-muted hover:text-foreground transition-colors rounded-none">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          
          <div className="border-l-4 border-neon pl-4 mb-10">
            <div className="font-mono text-label-md text-muted mb-2 uppercase tracking-widest">Selected_Region</div>
            <div className="font-sans text-headline-sm text-foreground uppercase tracking-wide">
              Koramangala 80ft Rd
            </div>
            <div className="font-mono text-body-sm text-muted mt-2">
              IDX: 8a60144062dffff
            </div>
          </div>
          
          {analyticsError ? (
            <div className="border border-neon bg-background p-6 flex items-center gap-4">
              <span className="material-symbols-outlined text-neon">signal_disconnected</span>
              <div>
                <div className="font-mono text-label-md text-neon uppercase tracking-widest">Backend_Offline</div>
                <div className="font-mono text-label-sm text-muted mt-1 uppercase">Start the API server to load live data</div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-px bg-border border border-border">
              <div className="bg-background p-6">
                <div className="font-mono text-label-md text-muted mb-4 uppercase tracking-widest">Violations</div>
                {dataLoading ? (
                  <div className="h-16 w-24 bg-border animate-pulse"></div>
                ) : (
                  <div className="font-mono text-display-massive text-neon tracking-tighter">
                    {m.rows_clean ? (m.rows_clean / 1000).toFixed(1) + 'k' : "—"}
                  </div>
                )}
                <div className="font-sans text-label-md text-muted mt-4 flex items-center uppercase">
                  <span className="material-symbols-outlined text-foreground text-[16px] mr-2">arrow_upward</span>
                  +12% vs LW
                </div>
              </div>

              <div className="bg-background p-6">
                <div className="font-mono text-label-md text-muted mb-4 uppercase tracking-widest">PCII_Score</div>
                {dataLoading ? (
                  <div className="h-16 w-16 bg-border animate-pulse"></div>
                ) : (
                  <div className="font-mono text-display-massive text-foreground tracking-tighter">
                    {m.pcii_max ?? "—"}
                  </div>
                )}
                <div className="font-sans text-label-md text-neon mt-4 uppercase">Severe Impact</div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex-1 flex flex-col p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-mono text-label-md text-muted uppercase tracking-widest">Violation_Breakdown</h3>
            {dataLoading && <div className="font-mono text-label-sm text-neon uppercase animate-pulse-soft">Fetching…</div>}
          </div>

          <div className="flex-1 border-t border-border">
            {/* Breakdown Item 1 */}
            <div className="flex items-center justify-between py-5 border-b border-border group hover:bg-surface transition-colors">
              <div className="flex items-center space-x-4">
                <span className="material-symbols-outlined text-muted group-hover:text-neon transition-colors">no_crash</span>
                <div>
                  <div className="font-sans text-body-lg text-foreground font-medium">Double Parking</div>
                  <div className="font-mono text-label-sm text-muted mt-1 uppercase">Primary Contributor</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-headline-md text-foreground">2,140</div>
                <div className="font-mono text-label-sm text-neon mt-1">50%</div>
              </div>
            </div>
            
            {/* Breakdown Item 2 */}
            <div className="flex items-center justify-between py-5 border-b border-border group hover:bg-surface transition-colors">
              <div className="flex items-center space-x-4">
                <span className="material-symbols-outlined text-muted group-hover:text-foreground transition-colors">block</span>
                <div>
                  <div className="font-sans text-body-lg text-foreground font-medium">No Parking Zone</div>
                  <div className="font-mono text-label-sm text-muted mt-1 uppercase">Secondary</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-headline-md text-foreground">1,581</div>
                <div className="font-mono text-label-sm text-muted mt-1">37%</div>
              </div>
            </div>
            
            {/* Breakdown Item 3 */}
            <div className="flex items-center justify-between py-5 border-b border-border group hover:bg-surface transition-colors">
              <div className="flex items-center space-x-4">
                <span className="material-symbols-outlined text-muted group-hover:text-foreground transition-colors">schedule</span>
                <div>
                  <div className="font-sans text-body-lg text-foreground font-medium">Overstay</div>
                  <div className="font-mono text-label-sm text-muted mt-1 uppercase">Minor Contributor</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-headline-md text-foreground">560</div>
                <div className="font-mono text-label-sm text-muted mt-1">13%</div>
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <button className="w-full bg-neon text-background font-mono text-body-md py-4 font-bold tracking-widest hover:bg-foreground transition-colors uppercase border border-neon flex items-center justify-center space-x-3">
              <span className="material-symbols-outlined">gavel</span>
              <span>Dispatch Unit</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
