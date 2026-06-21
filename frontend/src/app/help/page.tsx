export default function HelpPage() {
  return (
    <div className="p-10 overflow-y-auto flex-1 space-y-10 bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border pb-8">
        <div className="font-mono text-label-md text-muted uppercase tracking-widest mb-2">Module / Help & Documentation</div>
        <h1 className="font-sans text-headline-lg text-foreground uppercase tracking-tight">System_Help</h1>
        <p className="font-sans text-body-md text-muted mt-2">
          Documentation and guidance on using the Sentinel Hotspot Detection platform.
        </p>
      </div>

      {/* Content */}
      <div className="grid gap-6">
        <div className="border border-border bg-surface p-6">
          <h2 className="font-mono text-headline-md text-neon uppercase tracking-wider mb-4">1. Dashboard & Overview</h2>
          <p className="font-sans text-body-md text-muted leading-relaxed">
            The Overview page provides a bird&apos;s-eye view of all recorded violations across the city. Use the top filters to narrow down the time window (Today, Last 7 Days, Last 30 Days) or the type of violation (Double Parking, No Parking Zone). The map aggregates data into H3 hexagonal cells for density analysis.
          </p>
        </div>

        <div className="border border-border bg-surface p-6">
          <h2 className="font-mono text-headline-md text-neon uppercase tracking-wider mb-4">2. Hotspot Detection</h2>
          <p className="font-sans text-body-md text-muted leading-relaxed">
            This module highlights statistically significant spatial clusters of parking violations using the Getis-Ord Gi* statistic. Toggle &quot;Significant Only&quot; to filter out low-confidence clusters, and use the &quot;Color By&quot; dropdown to switch between raw cluster intensity (Gi*) and the calculated PCII (Parking Congestion Impact Index) score.
          </p>
        </div>

        <div className="border border-border bg-surface p-6">
          <h2 className="font-mono text-headline-md text-neon uppercase tracking-wider mb-4">3. Congestion Impact & Forecasting</h2>
          <p className="font-sans text-body-md text-muted leading-relaxed">
            The Forecasting engine uses an advanced LightGBM model to predict future hotspot risk probabilities across the grid. The model is validated using a temporal holdout strategy, and performance metrics (AUC-ROC, F1 Score, RMSE) are displayed at the top to indicate reliability.
          </p>
        </div>

        <div className="border border-border bg-surface p-6">
          <h2 className="font-mono text-headline-md text-neon uppercase tracking-wider mb-4">4. Enforcement Ranking</h2>
          <p className="font-sans text-body-md text-muted leading-relaxed">
            Our Enforcement Priority Score (EPS) ranks zones based on a weighted formula (0.5·PCII + 0.3·frequency + 0.2·criticality). This dynamically generated queue ensures that dispatch units are directed to the most critical locations first, maximizing the efficiency of limited municipal resources.
          </p>
        </div>

        <div className="border border-border bg-surface p-6">
          <h2 className="font-mono text-headline-md text-neon uppercase tracking-wider mb-4">5. Simulator</h2>
          <p className="font-sans text-body-md text-muted leading-relaxed">
            The What-If Simulator allows you to model the city-wide impact of enforcing the top-K priority zones. Adjust the compliance rate and the number of dispatched units to project the potential reduction in overall congestion.
          </p>
        </div>

        <div className="border border-border bg-surface p-6 mt-4">
          <h2 className="font-mono text-headline-md text-neon uppercase tracking-wider mb-4">6. Frequently Asked Questions (FAQ)</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-sans text-body-md font-bold text-foreground">How often is the hotspot data updated?</h3>
              <p className="font-sans text-body-sm text-muted mt-1">Data is ingested in real-time from municipal sensors and refreshed on the dashboard every 5 minutes.</p>
            </div>
            <div>
              <h3 className="font-sans text-body-md font-bold text-foreground">What does PCII stand for?</h3>
              <p className="font-sans text-body-sm text-muted mt-1">PCII stands for Parking Congestion Impact Index. It is a proprietary score from 0-100 that measures the severity of traffic disruption caused by illegal parking in a specific H3 cell.</p>
            </div>
          </div>
        </div>

        <div className="border border-border bg-surface p-6 mt-8 flex items-center justify-between">
          <div>
            <h2 className="font-mono text-headline-sm text-foreground uppercase tracking-wider mb-2">Need further assistance?</h2>
            <p className="font-sans text-body-sm text-muted">
              Contact the system administrator or raise a ticket on the municipal IT portal.
            </p>
          </div>
          <button className="bg-neon text-background font-mono text-label-md px-6 py-3 font-bold uppercase tracking-widest hover:bg-foreground transition-colors">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}
