/**
 * SEPTA Recovery Atlas - Executive Dashboard
 *
 * Requires:
 *   npm install react-leaflet leaflet recharts lucide-react
 */

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceLine,
  Cell,
} from 'recharts';
import {
  CheckCircle,
  Bus,
  Train,
  MapPin,
  Activity,
  ExternalLink,
  Play,
  Pause,
  Clock,
} from 'lucide-react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Polyline,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// ---------- BRAND COLORS ----------
const SEPTA_BLUE = '#005DAA';
const SEPTA_RED = '#EF3E42';

// ---------- DATA CONSTANTS ----------

// Mode recovery (2019 → 2025)
const modeRecoveryData = [
  {
    mode: 'Bus',
    recovery: 81.4,
    gap: -18.6,
    status: 'Resilient',
    insight: 'Recovery for Bus is 81.4% of 2019 levels.',
  },
  {
    mode: 'CCT',
    recovery: 56.5,
    gap: -43.5,
    status: 'Structural Decline',
    insight: 'Recovery for CCT is 56.5% of 2019 levels.',
  },
  {
    mode: 'Heavy Rail',
    recovery: 69.8,
    gap: -30.2,
    status: 'Mixed',
    insight: 'Recovery for Heavy Rail is 69.8% of 2019 levels.',
  },
  {
    mode: 'Regional Rail',
    recovery: 67.7,
    gap: -32.3,
    status: 'Mixed',
    insight: 'Recovery for Regional Rail is 67.7% of 2019 levels.',
  },
  {
    mode: 'Trackless Trolley',
    recovery: 69.1,
    gap: -30.9,
    status: 'Mixed',
    insight: 'Recovery for Trackless Trolley is 69.1% of 2019 levels.',
  },
  {
    mode: 'Trolley',
    recovery: 72.2,
    gap: -27.8,
    status: 'Mixed',
    insight: 'Recovery for Trolley is 72.2% of 2019 levels.',
  },
];

// Top “system snapshot” KPIs (TransitMatters-style)
const systemSnapshot = [
  {
    id: 'service',
    label: 'Weekday Service',
    metric: '7,820',
    unit: 'trips / weekday',
    chip: 'Service',
    change: '92% of 2019',
    changeTone: 'positive',
    section: 'overview',
    hover: {
      title: 'Service Levels Near Full Restoration',
      content:
        'Scheduled trips have returned to roughly 92% of pre-pandemic levels. Riders experience a system that looks familiar on paper, even as demand has shifted underneath.',
    },
  },
  {
    id: 'speed',
    label: 'Average Bus Speed',
    metric: '9.3',
    unit: 'mph (all routes)',
    chip: 'Speed',
    change: '-0.8 mph vs 2019',
    changeTone: 'negative',
    section: 'trends',
    hover: {
      title: 'Speed Drag from Congestion & Slow Zones',
      content:
        'System-wide bus speeds have fallen below 10 mph. This is a symptom of mixed-traffic running and growing slow zones, not just schedule padding.',
    },
  },
  {
    id: 'slowzones',
    label: 'Rail Slow Zones',
    metric: '41k',
    unit: 'delay minutes / month',
    chip: 'Slow Zones',
    change: '3× 2018 baseline',
    changeTone: 'negative',
    section: 'map',
    hover: {
      title: 'Slow Zones Concentrated on Key Corridors',
      content:
        'Rail slow-zone minutes have tripled relative to 2018, concentrated on a small number of trunk segments. This creates outsized reliability penalties for a minority of track miles.',
    },
  },
  {
    id: 'ridership',
    label: 'Daily Riders',
    metric: '798k',
    unit: 'avg. weekday boardings',
    chip: 'Ridership',
    change: '63% of 2019',
    changeTone: 'neutral',
    section: 'equity',
    hover: {
      title: 'Ridership Recovered, but Unevenly',
      content:
        'Total ridership has recovered to about two-thirds of 2019 levels, but the recovery is uneven by mode and geography. Core bus corridors are crowded; many rail segments are still underutilized.',
    },
  },
];

// Latent demand hotspots – includes lat/lng for the map
const latentDemandTargets = [
  {
    id: 1,
    tract: '42101010106',
    name: 'North Philadelphia - Temple',
    baseline: 12,
    peak: 108,
    spike: '9.0x',
    priority: 'High',
    description:
      'High student density. Current fixed routes miss off-peak demand.',
    action: 'Deploy micro-transit 8pm–2am.',
    lat: 39.98,
    lng: -75.16,
  },
  {
    id: 2,
    tract: '42101010',
    name: 'Germantown',
    baseline: 15,
    peak: 98,
    spike: '6.5x',
    priority: 'High',
    description:
      'Historic neighborhood with gaps in current network coverage.',
    action: 'Connector service to Wayne Junction.',
    lat: 40.0428,
    lng: -75.17,
  },
  {
    id: 3,
    tract: '42101104503',
    name: 'West Philadelphia',
    baseline: 18,
    peak: 95,
    spike: '5.3x',
    priority: 'High',
    description:
      'Dense residential; significant essential worker population.',
    action: 'First-mile/last-mile to Market-Frankford Line.',
    lat: 39.96,
    lng: -75.22,
  },
  {
    id: 4,
    tract: '42101203207',
    name: 'Northeast Philadelphia',
    baseline: 14,
    peak: 89,
    spike: '6.4x',
    priority: 'High',
    description:
      'Transit desert characteristics; high reliance on infrequent routes.',
    action: 'On-demand zone replacing low-frequency bus.',
    lat: 40.04,
    lng: -75.05,
  },
  {
    id: 5,
    tract: '42101308402',
    name: 'South Philadelphia',
    baseline: 16,
    peak: 87,
    spike: '5.4x',
    priority: 'Medium',
    description:
      'High density but narrow streets; ideal for micro-transit.',
    action: 'Small vehicle circulator pilot.',
    lat: 39.92,
    lng: -75.16,
  },
];

// Time series
const timeSeriesData = [
  { date: '2019', Bus: 457781.7, Rail: 424974.6 },
  { date: '2020', Bus: 259231.7, Rail: 165482.2 },
  { date: '2021', Bus: 238124.8, Rail: 152147.8 },
  { date: '2022', Bus: 298306.6, Rail: 192273.7 },
  { date: '2023', Bus: 338974.2, Rail: 220749.8 },
  { date: '2024', Bus: 362268.8, Rail: 276689.1 },
  { date: '2025', Bus: 372465.8, Rail: 294126.0 },
];

const distributionData = [
  {
    range: 'Cold Spots',
    label: 'Cold Spots (<50)',
    count: 19,
    desc: 'Cold tracts with total (On_ + Off_) < 50 over all seasons/days.',
  },
  {
    range: 'Standard',
    label: 'Standard (50–1000)',
    count: 190,
    desc: 'Tracts with moderate total ridership between 50 and 1000.',
  },
  {
    range: 'High',
    label: 'High Volume (1000+)',
    count: 643,
    desc: 'High-volume tracts with total ridership of 1000 or more.',
  },
];

// --- NETWORK & PRIORITY MOCK DATA ---

const busSegments = [
  {
    id: '23_north_1',
    line: 'Route 23',
    direction: 'Northbound',
    from: 'South Philadelphia',
    to: 'Center City',
    freq_per_hr: 18,
    avg_delay_min: 4,
    load_factor: 0.85,
    coords: [
      [39.92, -75.16],
      [39.94, -75.16],
      [39.96, -75.16],
    ],
  },
  {
    id: '23_south_1',
    line: 'Route 23',
    direction: 'Southbound',
    from: 'Center City',
    to: 'South Philadelphia',
    freq_per_hr: 18,
    avg_delay_min: 6,
    load_factor: 0.9,
    coords: [
      [39.96, -75.158],
      [39.94, -75.158],
      [39.92, -75.158],
    ],
  },
  {
    id: '47_north_1',
    line: 'Route 47',
    direction: 'Northbound',
    from: 'South Philadelphia',
    to: 'North Philadelphia',
    freq_per_hr: 14,
    avg_delay_min: 5,
    load_factor: 0.8,
    coords: [
      [39.92, -75.15],
      [39.95, -75.15],
      [39.98, -75.15],
    ],
  },
  {
    id: '47_south_1',
    line: 'Route 47',
    direction: 'Southbound',
    from: 'North Philadelphia',
    to: 'South Philadelphia',
    freq_per_hr: 14,
    avg_delay_min: 3,
    load_factor: 0.7,
    coords: [
      [39.98, -75.148],
      [39.95, -75.148],
      [39.92, -75.148],
    ],
  },
  {
    id: '52_east_1',
    line: 'Route 52',
    direction: 'Eastbound',
    from: 'West Philadelphia',
    to: 'Center City',
    freq_per_hr: 10,
    avg_delay_min: 7,
    load_factor: 0.92,
    coords: [
      [39.96, -75.23],
      [39.96, -75.21],
      [39.96, -75.19],
      [39.96, -75.17],
    ],
  },
  {
    id: '52_west_1',
    line: 'Route 52',
    direction: 'Westbound',
    from: 'Center City',
    to: 'West Philadelphia',
    freq_per_hr: 10,
    avg_delay_min: 5,
    load_factor: 0.75,
    coords: [
      [39.958, -75.17],
      [39.958, -75.19],
      [39.958, -75.21],
      [39.958, -75.23],
    ],
  },
];

// Simple "day in the life" snapshots for animated vehicles
const animatedTripFrames = [
  {
    time: '06:00',
    vehicles: [
      { id: '23', label: '23', lat: 39.93, lng: -75.16 },
      { id: '47', label: '47', lat: 39.93, lng: -75.15 },
      { id: '52', label: '52', lat: 39.96, lng: -75.22 },
    ],
  },
  {
    time: '08:00',
    vehicles: [
      { id: '23', label: '23', lat: 39.955, lng: -75.16 },
      { id: '47', label: '47', lat: 39.965, lng: -75.15 },
      { id: '52', label: '52', lat: 39.96, lng: -75.2 },
    ],
  },
  {
    time: '12:00',
    vehicles: [
      { id: '23', label: '23', lat: 39.96, lng: -75.16 },
      { id: '47', label: '47', lat: 39.97, lng: -75.15 },
      { id: '52', label: '52', lat: 39.96, lng: -75.18 },
    ],
  },
  {
    time: '17:30',
    vehicles: [
      { id: '23', label: '23', lat: 39.95, lng: -75.16 },
      { id: '47', label: '47', lat: 39.96, lng: -75.15 },
      { id: '52', label: '52', lat: 39.96, lng: -75.19 },
    ],
  },
  {
    time: '22:30',
    vehicles: [
      { id: '23', label: '23', lat: 39.935, lng: -75.16 },
      { id: '47', label: '47', lat: 39.94, lng: -75.15 },
      { id: '52', label: '52', lat: 39.96, lng: -75.215 },
    ],
  },
];

// Utility: 0–1 score -> blue→red color
function getColorForScore(score) {
  const clamped = Math.max(0, Math.min(1, score || 0));
  const rStart = 0,
    gStart = 93,
    bStart = 170; // #005DAA
  const rEnd = 239,
    gEnd = 62,
    bEnd = 66; // #EF3E42
  const r = Math.round(rStart + (rEnd - rStart) * clamped);
  const g = Math.round(gStart + (gEnd - gStart) * clamped);
  const b = Math.round(bStart + (bEnd - bStart) * clamped);
  return `rgb(${r}, ${g}, ${b})`;
}

// Utility: compute composite priority score for a segment
function computeSegmentScore(segment, weights) {
  const maxFreq = 20;
  const maxDelay = 10;
  const maxLoad = 1;

  const freqScore = segment.freq_per_hr / maxFreq;
  const delayScore = 1 - Math.min(segment.avg_delay_min / maxDelay, 1);
  const loadScore = segment.load_factor / maxLoad;

  const totalWeight =
    (weights.freq || 0) + (weights.delay || 0) + (weights.load || 0) || 1;
  const wFreq = (weights.freq || 0) / totalWeight;
  const wDelay = (weights.delay || 0) / totalWeight;
  const wLoad = (weights.load || 0) / totalWeight;

  return wFreq * freqScore + wDelay * delayScore + wLoad * loadScore;
}

// Insight content for the right-hand panel
const SECTION_INSIGHTS = {
  overview: {
    title: 'System Recovery Analysis',
    content:
      'Bus has recovered to roughly 81% of 2019 weekday ridership, while most rail modes sit in the high-60s. That gap matters: bus is now the backbone of day-to-day mobility, especially for riders without cars, while rail’s peak-commute market has permanently shrunk. A uniform percentage target for “system recovery” hides this split and would push resources toward already-underused capacity instead of the corridors that carry the most riders today.',
  },
  trends: {
    title: 'Long-Term Trend Analysis',
    content:
      'The 2020 collapse is a structural break, not a one-year anomaly. Pre-2020, bus and rail moved largely in parallel. After 2020, bus rebounds sharply and then resumes a slow growth path, while rail stabilizes at a lower plateau. This suggests that the riders who left rail had strong substitutes — remote work, driving, or flexible jobs — while bus riders did not. Any long-range plan that assumes rail will “naturally” climb back to 2019 levels is working against the direction of the data.',
  },
  equity: {
    title: 'Geographic Service Distribution',
    content:
      'Only 19 tracts fall into the true “Cold Spot” category with fewer than 50 boardings and alightings in total, but 643 tracts clear the 1,000-trip threshold. Median ridership in the high-volume group is almost 10,000 trips, compared with fewer than 20 in the coldest tracts. That 500-to-1 gap is not just about demand; it reflects where frequent, legible service exists and where it does not. Equity work here is less about spreading thin service everywhere and more about surgically upgrading access in a defined set of cold spots while protecting the corridors that tens of thousands already use.',
  },
  map: {
    title: 'Spatial Pattern of Latent Demand',
    content:
      'Latent demand tracts cluster around Temple, Germantown, West and South Philadelphia, and the lower Northeast. Across these areas, the pattern is the same: modest all-day usage with occasional peaks 5–9× higher than the baseline. Those peaks often line up with nightlife, shift changes, or campus schedules. Fixed-route bus struggles to match these spikes without running empty most of the day; flexible, smaller vehicles can match them much more closely.',
  },
  targets: {
    title: 'Latent Demand Identification',
    content:
      'Instead of writing off “low-ridership” zones, looking at spikes reveals a different story. A tract that averages 12–18 riders per day but occasionally surges above 80 or 100 riders is not a dead zone — it is a mismatch problem. Across roughly two hundred such tracts, the recurring pattern is: steep spikes at predictable times, weak coverage at all other times, and limited walk access to frequent routes. That is exactly the profile where micro-transit, demand-responsive shuttles, or targeted evening service can outperform traditional fixed routes.',
  },
  network: {
    title: 'Network View of Core Corridors',
    content:
      'Routes 23, 47, and 52 form a crude but powerful spine: north–south coverage through South and North Philadelphia and an east–west bridge between West Philadelphia and Center City. They run often, stay busy, and cover neighborhoods with low car ownership. In practice, this means these bus corridors now carry a share of the region’s mobility far larger than their mileage would suggest. If these routes slow down or become unreliable, the riders they serve have few substitutes — which is why they are the first places to protect with transit-first street design.',
  },
  priority: {
    title: 'Multi-Criteria Priority Scoring',
    content:
      'The priority tool surfaces segments where three things line up: a lot of buses, a lot of riders on those buses, and measurable delay that is fixable with street design. When you weight frequency more heavily, the busiest headways climb the list. When you weight reliability, segments where buses crawl along at single-digit speeds rise. When you weight load, places where every delayed trip affects a packed bus rise. The goal is not to produce a single “true” ranking, but to give elected officials and planners a transparent way to see how their priorities change the map.',
  },
  animation: {
    title: 'A Day in the Network',
    content:
      'Stepping through the day shows how much of the city depends on a small number of core routes: early-morning trips already follow the 23 and 47 spines, mid-day service keeps those same streets moving, and late-night snapshots reveal that buses are still running where the rail network has long since gone quiet. The animation also hints at where gaps open up — places that are busy at 17:30 but quiet at 22:30 despite nearby nightlife or job sites. Those are candidates for targeted night or shift-change service.',
  },
  roadmap: {
    title: 'Implementation Strategy',
    content:
      'The roadmap moves from stabilizing the network to reshaping it. First, lock in bus reliability on the highest-ridership corridors so current riders are not punished while bigger changes are studied. Second, run tightly scoped micro-transit pilots in a handful of latent-demand tracts with different street layouts. Third, pivot Regional Rail toward all-day service patterns that match today’s travel, not yesterday’s commutes. Finally, build an annual feedback loop so that each round of capital and operating decisions is driven by the latest ridership, equity, and reliability evidence, not just historical practice.',
  },
};

// ---------- COMPONENT ----------

export default function SeptaExecutiveDashboard() {
  const [activeSection, setActiveSection] = useState('overview');
  const [hoveredChartData, setHoveredChartData] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(latentDemandTargets[0]);

  const [priorityWeights, setPriorityWeights] = useState({
    freq: 40,
    delay: 30,
    load: 30,
  });
  const [activeNetworkMetric, setActiveNetworkMetric] = useState('freq');
  const [animationFrameIndex, setAnimationFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const scoredSegments = busSegments
    .map((seg) => ({
      ...seg,
      score: computeSegmentScore(seg, priorityWeights),
    }))
    .sort((a, b) => b.score - a.score);

  useEffect(() => {
    setHoveredChartData(null);
  }, [activeSection]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setAnimationFrameIndex((prev) => (prev + 1) % animatedTripFrames.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const InsightPanel = () => {
    const displayData = hoveredChartData || SECTION_INSIGHTS[activeSection];

    return (
      <div
        className="h-full text-white p-6 rounded-xl shadow-2xl flex flex-col border-l-4"
        style={{ backgroundColor: SEPTA_BLUE, borderColor: SEPTA_RED }}
      >
        <div className="flex items-center gap-2 mb-4 border-b border-white/20 pb-2">
          <Activity size={18} className="text-white" />
          <span className="text-xs font-bold uppercase tracking-wider">
            Analysis Context
          </span>
        </div>

        <div key={displayData?.title}>
          <h3 className="text-xl font-bold mb-3 leading-tight">
            {displayData?.title}
          </h3>

          <div className="text-sm leading-relaxed space-y-4 text-white/90">
            <p>{displayData?.content}</p>
          </div>
        </div>

        <div className="mt-auto pt-6">
          <div className="p-3 rounded-lg border border-white/20 bg-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-white/80">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="font-medium">
                  Active:{' '}
                  {activeSection.charAt(0).toUpperCase() +
                    activeSection.slice(1)}
                </span>
              </div>
              <div className="text-xs text-white/60">
                {hoveredChartData ? 'Hover Detail' : 'Section Overview'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm p-4 border border-slate-200 rounded-lg shadow-xl">
          <p className="font-bold text-slate-800 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-slate-600 capitalize">{entry.name}:</span>
              <span className="font-mono font-bold text-slate-900">
                {typeof entry.value === 'number'
                  ? entry.value.toLocaleString()
                  : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const LatentDemandMap = ({ height = 600, showHeader = true }) => (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
      {showHeader && (
        <div className="flex justify-between items-center mb-4 px-4 pt-2">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Latent Demand Map
            </h2>
            <p className="text-slate-500 text-sm">
              Interactive GIS analysis of high-priority micro-transit zones.
            </p>
          </div>
          <a
            href="https://www.septa.org/maps/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-xs hover:underline"
            style={{ color: SEPTA_BLUE }}
          >
            <ExternalLink size={12} /> Official SEPTA Maps
          </a>
        </div>
      )}

      <div
        className="relative w-full rounded-lg overflow-hidden border-2 border-slate-300"
        style={{ height: `${height}px` }}
      >
        <MapContainer
          center={[39.98, -75.16]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
          className="z-0"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors & CARTO"
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />

          {latentDemandTargets.map((target, index) => (
            <CircleMarker
              key={target.id}
              center={[target.lat, target.lng]}
              pathOptions={{
                color: SEPTA_RED,
                fillColor: SEPTA_RED,
                fillOpacity: 0.7,
                weight: 3,
              }}
              radius={15}
              eventHandlers={{
                click: () => {
                  setSelectedTarget(target);
                  setHoveredChartData({
                    title: `Hotspot ${index + 1}: ${target.name}`,
                    content: `This zone shows a ${target.spike} demand spike above its baseline of ${target.baseline} daily riders, reaching peaks of ${target.peak} riders. ${target.description} Recommended action: ${target.action}`,
                  });
                },
              }}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <div className="font-bold text-sm mb-2 text-slate-900">
                    {target.name}
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Baseline:</span>
                      <span className="font-semibold">
                        {target.baseline} riders/day
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Peak:</span>
                      <span className="font-semibold">
                        {target.peak} riders/day
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                      <span className="text-slate-600">Spike:</span>
                      <span className="font-bold" style={{ color: SEPTA_RED }}>
                        {target.spike}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-200 text-[10px] text-slate-500">
                    Click marker for full analysis →
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-xl border border-slate-200 z-[1000] max-w-[180px]">
          <div className="font-bold text-[11px] text-slate-900 mb-2 flex items-center gap-1.5">
            <MapPin size={12} style={{ color: SEPTA_RED }} />
            Legend
          </div>
          <div className="space-y-1.5 text-[10px]">
            <div className="flex items-center gap-1.5">
              <div
                className="w-4 h-4 rounded-full border-2 shrink-0"
                style={{ backgroundColor: SEPTA_RED, borderColor: SEPTA_RED }}
              />
              <span className="text-slate-700 leading-tight">
                Demand Hotspot
              </span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-200">
            <p className="text-[9px] text-slate-500 italic">
              Click markers for details
            </p>
            <p className="text-[9px] text-slate-400 mt-0.5">
              Scroll to zoom map
            </p>
          </div>
        </div>

        {/* Count badge */}
        <div
          className="absolute top-4 left-4 text-white px-3 py-2 rounded-lg shadow-lg z-[1000]"
          style={{
            backgroundImage: `linear-gradient(to bottom right, ${SEPTA_BLUE}, ${SEPTA_RED})`,
          }}
        >
          <div className="text-[9px] font-semibold uppercase tracking-wide opacity-90">
            Priority Zones
          </div>
          <div className="text-2xl font-bold leading-none">
            {latentDemandTargets.length}
          </div>
        </div>

        {/* Map type */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-md shadow-md border border-slate-200 z-[1000]">
          <div className="text-[10px] text-slate-500">
            GIS Layer: CartoDB Streets
          </div>
        </div>
      </div>
    </div>
  );

  const changeColorClass = (tone) => {
    if (tone === 'positive') return 'text-[#005DAA]';
    if (tone === 'negative') return 'text-[#EF3E42]';
    return 'text-slate-500';
  };

  const currentFrame = animatedTripFrames[animationFrameIndex];

  return (
    <div
      className="min-h-screen font-sans text-slate-900 pb-12"
      style={{ backgroundColor: '#f5f7fb' }}
    >
      {/* Header / Nav */}
      <header
        className="sticky top-0 z-40 shadow-sm border-b"
        style={{ backgroundColor: '#ffffff', borderColor: '#d1d5db' }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg text-white"
                style={{ backgroundColor: SEPTA_BLUE }}
              >
                <Train size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  SEPTA Recovery Atlas
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Executive Master Report (2014–2025)
                </p>
              </div>
            </div>

            <nav
              className="flex p-1 rounded-lg"
              style={{ backgroundColor: '#e5edf6' }}
            >
              {[
                'overview',
                'trends',
                'equity',
                'map',
                'targets',
                'network',
                'priority',
                'animation',
                'roadmap',
              ].map((section) => (
                <button
                  key={section}
                  onClick={() => setActiveSection(section)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeSection === section
                      ? 'bg-white shadow-sm border border-slate-200'
                      : 'hover:bg-slate-200 text-slate-600'
                  }`}
                  style={
                    activeSection === section
                      ? { color: SEPTA_BLUE }
                      : undefined
                  }
                >
                  {section.charAt(0).toUpperCase() + section.slice(1)}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* System Snapshot row */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                System Snapshot
              </h2>
              <p className="text-xs text-slate-500">
                At-a-glance view of service, speed, slow zones, and ridership.
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {systemSnapshot.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => {
                  setActiveSection(card.section);
                  if (card.hover) setHoveredChartData(card.hover);
                }}
                onMouseEnter={() => {
                  if (card.hover) setHoveredChartData(card.hover);
                }}
                onMouseLeave={() => setHoveredChartData(null)}
                className="group text-left bg-white rounded-xl border border-slate-200 shadow-sm hover:border-[#005DAA] hover:shadow-md transition-all p-4 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {card.chip}
                  </span>
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-50 border ${changeColorClass(
                      card.changeTone,
                    )} border-slate-200`}
                  >
                    {card.change}
                  </span>
                </div>
                <div>
                  <p className="text-[13px] text-slate-500">{card.label}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-slate-900">
                      {card.metric}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {card.unit}
                    </span>
                  </div>
                </div>
                <div
                  className="mt-1 text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                  style={{ color: SEPTA_BLUE }}
                >
                  <BarChart size={12} />
                  <span>Jump to {card.section} analysis</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* MAIN COLUMN */}
          <div className="lg:col-span-2 space-y-8">
            {/* OVERVIEW */}
            {activeSection === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {/* Bus card */}
                  <div
                    className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:border-[#005DAA] transition-colors group"
                    onMouseEnter={() =>
                      setHoveredChartData({
                        title: 'Bus Mode: Resilient Recovery',
                        content:
                          'Bus ridership has recovered to just over four-fifths of its 2019 weekday baseline. That recovery is broad-based: high-ridership routes in North, West, and South Philadelphia carry riders throughout the day, not just in the peaks. Essential workers, riders without cars, and riders making short local trips rely on this network even as office commuters have shifted to remote or hybrid work.',
                      })
                    }
                    onMouseLeave={() => setHoveredChartData(null)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div
                        className="p-2 rounded-md group-hover:opacity-90 transition-colors"
                        style={{
                          backgroundColor: `${SEPTA_BLUE}20`,
                          color: SEPTA_BLUE,
                        }}
                      >
                        <Bus size={20} />
                      </div>
                      <span
                        className="text-xs font-bold px-2 py-1 rounded"
                        style={{
                          backgroundColor: `${SEPTA_BLUE}15`,
                          color: SEPTA_BLUE,
                        }}
                      >
                        Strongest
                      </span>
                    </div>
                    <p className="text-slate-500 text-sm">Bus Recovery</p>
                    <p className="text-3xl font-bold text-slate-900">81%</p>
                  </div>

                  {/* Rail card */}
                  <div
                    className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:border-[#EF3E42] transition-colors group"
                    onMouseEnter={() =>
                      setHoveredChartData({
                        title: 'Rail Modes: Structural Demand Loss',
                        content:
                          'Regional and Heavy Rail together sit below 70% of their 2019 weekday ridership, with growth flattening out as hybrid work stabilizes. This is less a slow comeback and more a reset: many former rail riders now travel fewer days per week or not at all. The remaining core rail riders need reliable, all-day service, but the peak-only model that shaped earlier timetables no longer matches observed demand.',
                      })
                    }
                    onMouseLeave={() => setHoveredChartData(null)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div
                        className="p-2 rounded-md group-hover:opacity-90 transition-colors"
                        style={{
                          backgroundColor: `${SEPTA_RED}20`,
                          color: SEPTA_RED,
                        }}
                      >
                        <Train size={20} />
                      </div>
                      <span
                        className="text-xs font-bold px-2 py-1 rounded"
                        style={{
                          backgroundColor: `${SEPTA_RED}15`,
                          color: SEPTA_RED,
                        }}
                      >
                        Critical
                      </span>
                    </div>
                    <p className="text-slate-500 text-sm">Rail Recovery</p>
                    <p className="text-3xl font-bold text-slate-900">≈69%</p>
                  </div>
                </div>

                {/* Recovery bar chart */}
                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                  <h2 className="text-lg font-bold mb-6 text-slate-800">
                    System Recovery Status (2025 vs 2019)
                  </h2>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={modeRecoveryData}
                        layout="vertical"
                        margin={{ left: 20 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          horizontal
                          vertical={false}
                        />
                        <XAxis type="number" domain={[0, 100]} hide />
                        <YAxis
                          dataKey="mode"
                          type="category"
                          width={120}
                          tick={{ fontSize: 12, fill: '#64748b' }}
                        />
                        <Tooltip
                          cursor={{ fill: '#f8fafc' }}
                          content={<CustomTooltip />}
                        />
                        <Bar
                          dataKey="recovery"
                          radius={[0, 4, 4, 0]}
                          barSize={32}
                        >
                          {modeRecoveryData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                entry.mode === 'Bus'
                                  ? SEPTA_BLUE
                                  : entry.mode.includes('Rail')
                                  ? SEPTA_RED
                                  : '#64748b'
                              }
                              className="cursor-pointer hover:opacity-80 transition-opacity"
                              onMouseEnter={() =>
                                setHoveredChartData({
                                  title: `${entry.mode}: ${entry.status}`,
                                  content: entry.insight,
                                })
                              }
                              onMouseLeave={() => setHoveredChartData(null)}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* TRENDS */}
            {activeSection === 'trends' && (
              <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-slate-900">
                    The “Structural Break”
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">
                    Visualizing the permanent divergence of Bus and Rail demand.
                  </p>
                </div>

                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timeSeriesData}>
                      <defs>
                        <linearGradient
                          id="colorBus"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor={SEPTA_BLUE}
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor={SEPTA_BLUE}
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#e2e8f0"
                      />
                      <XAxis
                        dataKey="date"
                        stroke="#94a3b8"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        tickFormatter={(val) => `${val / 1000}k`}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />

                      <ReferenceLine
                        x="2020"
                        stroke="#64748b"
                        strokeDasharray="3 3"
                        label={{
                          value: 'COVID-19 Break',
                          position: 'top',
                          fill: '#475569',
                          fontSize: 12,
                        }}
                      />

                      <Area
                        type="monotone"
                        dataKey="Bus"
                        stroke={SEPTA_BLUE}
                        fill="url(#colorBus)"
                        strokeWidth={3}
                        onMouseEnter={() =>
                          setHoveredChartData({
                            title: 'Bus Trend: Elastic Recovery',
                            content:
                              'Bus ridership falls sharply in 2020 but then rebounds year after year. By 2025 it has regained most of its 2019 volume, with the trajectory pointing toward slow continued growth. That curve reflects a rider base whose trips are hard to cancel — work, school, caregiving, and errands concentrated in neighborhoods with limited car access.',
                          })
                        }
                        onMouseLeave={() => setHoveredChartData(null)}
                      />
                      <Area
                        type="monotone"
                        dataKey="Rail"
                        stroke={SEPTA_RED}
                        fill="transparent"
                        strokeWidth={3}
                        onMouseEnter={() =>
                          setHoveredChartData({
                            title: 'Rail Trend: New Equilibrium',
                            content:
                              'Rail ridership also collapses in 2020 but then rebounds to a much lower new normal. The line flattens after 2022, suggesting that the riders who have returned represent a stable core market — but the massive commuter peaks that once shaped Regional Rail are not coming back on their own.',
                          })
                        }
                        onMouseLeave={() => setHoveredChartData(null)}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* EQUITY */}
            {activeSection === 'equity' && (
              <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  The Inequality Curve
                </h2>
                <p className="text-slate-500 text-sm mb-6">
                  Distribution of ridership across census tracts reveals an
                  extreme disparity between cold spots and high-volume
                  corridors.
                </p>

                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={distributionData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#e2e8f0"
                      />
                      <XAxis dataKey="range" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {distributionData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.range === 'High'
                                ? SEPTA_BLUE
                                : entry.range === 'Cold Spots'
                                ? SEPTA_RED
                                : '#94a3b8'
                            }
                            className="cursor-pointer hover:opacity-80 transition-opacity"
                            onMouseEnter={() =>
                              setHoveredChartData({
                                title: `${entry.label} Analysis`,
                                content:
                                  entry.desc +
                                  (entry.range === 'Cold Spots'
                                    ? ' A closer look shows that many of these tracts still exhibit high-ridership spikes at particular times, suggesting that strategic, well-timed service could unlock much more usage than the averages imply.'
                                    : ''),
                              })
                            }
                            onMouseLeave={() => setHoveredChartData(null)}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* MAP */}
            {activeSection === 'map' && (
              <LatentDemandMap height={600} showHeader />
            )}

            {/* TARGETS */}
            {activeSection === 'targets' && (
              <div className="space-y-6">
                <div
                  className="border p-6 rounded-xl"
                  style={{
                    backgroundColor: `${SEPTA_BLUE}0D`,
                    borderColor: `${SEPTA_BLUE}33`,
                  }}
                >
                  <h2
                    className="text-lg font-bold mb-2"
                    style={{ color: SEPTA_BLUE }}
                  >
                    Latent Demand Explorer
                  </h2>
                  <p className="text-sm text-slate-700">
                    A subset of census tracts shows irregular ridership spikes
                    well above their all-day baseline. These areas are prime
                    candidates for flexible service that can respond to
                    real-world travel patterns rather than fixed schedules.
                  </p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <LatentDemandMap height={420} showHeader={false} />

                  <div className="flex flex-col gap-4">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                      <div
                        className="p-4 border-b font-bold text-xs uppercase tracking-wider"
                        style={{
                          backgroundColor: `${SEPTA_BLUE}0D`,
                          borderColor: `${SEPTA_BLUE}26`,
                          color: SEPTA_BLUE,
                        }}
                      >
                        High Priority Tracts
                      </div>
                      <div className="divide-y divide-slate-100">
                        {latentDemandTargets.map((target) => (
                          <div
                            key={target.id}
                            onClick={() => {
                              setSelectedTarget(target);
                              setHoveredChartData({
                                title: `Pilot Strategy: ${target.name}`,
                                content: `This tract shows a ${target.spike} spike in demand above its ${target.baseline} daily baseline, reaching peaks of ${target.peak} riders. A micro-transit or shuttle pilot here would replace long periods of empty fixed-route service with targeted trips that appear when riders actually need them.`,
                              });
                            }}
                            className={`p-4 cursor-pointer transition-all hover:bg-slate-50 ${
                              selectedTarget.id === target.id
                                ? 'border-l-4'
                                : 'border-l-4 border-transparent'
                            }`}
                            style={
                              selectedTarget.id === target.id
                                ? {
                                    borderColor: SEPTA_BLUE,
                                    backgroundColor: '#f1f5f9',
                                  }
                                : undefined
                            }
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-slate-700 text-sm">
                                {target.name}
                              </span>
                              <span
                                className="text-xs font-bold px-2 py-1 rounded-full"
                                style={{
                                  backgroundColor: `${SEPTA_RED}12`,
                                  color: SEPTA_RED,
                                }}
                              >
                                {target.spike} Spike
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <MapPin style={{ color: SEPTA_BLUE }} />
                          <h3 className="text-xl font-bold text-slate-900">
                            {selectedTarget.name}
                          </h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="p-3 bg-slate-50 rounded-lg">
                            <p className="text-xs text-slate-500 uppercase">
                              Baseline Riders
                            </p>
                            <p className="text-xl font-mono font-bold text-slate-700">
                              {selectedTarget.baseline}/day
                            </p>
                          </div>
                          <div
                            className="p-3 rounded-lg"
                            style={{ backgroundColor: `${SEPTA_BLUE}0D` }}
                          >
                            <p
                              className="text-xs uppercase"
                              style={{ color: SEPTA_BLUE }}
                            >
                              Peak Spike
                            </p>
                            <p className="text-xl font-mono font-bold text-slate-800">
                              {selectedTarget.peak}/day
                            </p>
                          </div>
                        </div>

                        <p className="text-sm text-slate-600 leading-relaxed mb-4">
                          <strong>Context:</strong> {selectedTarget.description}
                        </p>
                      </div>

                      <div
                        className="border p-4 rounded-lg"
                        style={{
                          backgroundColor: `${SEPTA_RED}0F`,
                          borderColor: `${SEPTA_RED}33`,
                        }}
                      >
                        <p
                          className="text-xs font-bold uppercase mb-1 flex items-center gap-2"
                          style={{ color: SEPTA_RED }}
                        >
                          <CheckCircle size={14} /> Recommended Pilot
                        </p>
                        <p className="text-sm text-slate-800 font-medium">
                          {selectedTarget.action}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* NETWORK */}
            {activeSection === 'network' && (
              <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Network View: High-Value Bus Corridors
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                      A simplified view of SEPTA&apos;s core bus spine, colored
                      by the performance metric that matters most for a given
                      decision.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-slate-500">Color by:</span>
                    <div
                      className="flex rounded-lg overflow-hidden border border-slate-200"
                      style={{ backgroundColor: '#e5edf6' }}
                    >
                      {[
                        { key: 'freq', label: 'Frequency' },
                        { key: 'delay', label: 'Reliability' },
                        { key: 'load', label: 'Load' },
                      ].map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => setActiveNetworkMetric(opt.key)}
                          className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                            activeNetworkMetric === opt.key
                              ? 'bg-white text-slate-900 shadow-inner'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                          style={
                            activeNetworkMetric === opt.key
                              ? { borderBottom: `2px solid ${SEPTA_BLUE}` }
                              : undefined
                          }
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {/* Map */}
                  <div className="xl:col-span-2">
                    <div className="rounded-xl overflow-hidden border border-slate-200">
                      <MapContainer
                        center={[39.96, -75.17]}
                        zoom={12}
                        style={{ height: '480px', width: '100%' }}
                        scrollWheelZoom
                      >
                        <TileLayer
                          attribution="&copy; OpenStreetMap contributors"
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {busSegments.map((seg) => {
                          let baseScore;
                          if (activeNetworkMetric === 'freq') {
                            baseScore = seg.freq_per_hr / 20;
                          } else if (activeNetworkMetric === 'delay') {
                            baseScore =
                              1 - Math.min(seg.avg_delay_min / 10, 1);
                          } else {
                            baseScore = seg.load_factor;
                          }
                          const color = getColorForScore(baseScore);

                          return (
                            <Polyline
                              key={seg.id}
                              positions={seg.coords}
                              pathOptions={{
                                color,
                                weight: 5,
                                opacity: 0.9,
                              }}
                              eventHandlers={{
                                mouseover: () =>
                                  setHoveredChartData({
                                    title: `${seg.line} – ${seg.direction}`,
                                    content: `This segment carries about ${
                                      seg.freq_per_hr
                                    } buses per hour, with an average delay of ${
                                      seg.avg_delay_min
                                    } minutes and a peak load factor near ${(
                                      seg.load_factor * 100
                                    ).toFixed(
                                      0,
                                    )}%. In practice, each minute of delay here affects a large share of riders on the spine network.`,
                                  }),
                                mouseout: () => setHoveredChartData(null),
                              }}
                            />
                          );
                        })}
                      </MapContainer>
                    </div>
                  </div>

                  {/* Legend / Summary */}
                  <div className="space-y-4">
                    <div
                      className="p-4 rounded-xl border border-slate-200"
                      style={{ backgroundColor: '#f3f6fb' }}
                    >
                      <h3 className="text-sm font-bold text-slate-900 mb-2">
                        Metric Legend
                      </h3>
                      <p className="text-xs text-slate-600 mb-3">
                        Lines shift from SEPTA blue toward SEPTA red as the
                        underlying score increases for the selected metric.
                        High-frequency, high-load, or highly delayed segments
                        stand out immediately.
                      </p>
                      <div
                        className="h-2 w-full rounded-full"
                        style={{
                          backgroundImage: `linear-gradient(to right, ${SEPTA_BLUE}, ${SEPTA_RED})`,
                        }}
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                        <span>Lower score</span>
                        <span>Higher score</span>
                      </div>
                    </div>

                    <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs space-y-2">
                      <p className="font-semibold text-slate-800">
                        How to read this:
                      </p>
                      <ul className="list-disc pl-4 space-y-1 text-slate-600">
                        <li>
                          Use <span className="font-mono">Color by</span> to
                          flip between different performance lenses.
                        </li>
                        <li>
                          Hover over a line segment to push its details into the
                          analysis panel on the right.
                        </li>
                        <li>
                          In a full build, this map would draw from GTFS and
                          performance data to cover all bus routes regionwide.
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

                        {/* PRIORITY */}
            {activeSection === 'priority' && (
              <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Bus Priority Finder (Prototype)
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                      Adjust frequency, delay, and passenger load weights to see
                      which segments rise to the top as bus-lane candidates.
                    </p>
                  </div>
                  <div className="text-xs text-slate-500">
                    Color scale uses SEPTA blue → red for score.
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {/* Left: Sliders & table */}
                  <div className="space-y-6 xl:col-span-1">
                    {/* Sliders */}
                    <div
                      className="p-4 rounded-xl border border-slate-200"
                      style={{ backgroundColor: '#f3f6fb' }}
                    >
                      <h3 className="text-sm font-bold text-slate-900">
                        Priority Weights
                      </h3>

                      {[
                        {
                          key: 'freq',
                          label: 'Frequency (buses/hour)',
                          color: SEPTA_BLUE,
                        },
                        {
                          key: 'delay',
                          label: 'Reliability (low delay)',
                          color: '#f59e0b',
                        },
                        {
                          key: 'load',
                          label: 'Passenger load',
                          color: SEPTA_RED,
                        },
                      ].map((w) => (
                        <div key={w.key} className="space-y-1 mt-2">
                          <div className="flex justify-between text-xs">
                            <span
                              className="font-medium"
                              style={{ color: w.color }}
                            >
                              {w.label}
                            </span>
                            <span className="font-mono text-slate-500">
                              {priorityWeights[w.key]}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={priorityWeights[w.key]}
                            onChange={(e) =>
                              setPriorityWeights((prev) => ({
                                ...prev,
                                [w.key]: Number(e.target.value),
                              }))
                            }
                            className="w-full accent-blue-600"
                          />
                        </div>
                      ))}

                      <p className="text-[11px] text-slate-500 mt-2">
                        Weights are normalized internally, so the shape of the
                        ranking changes even if the totals do not.
                      </p>
                    </div>

                    {/* Ranked segments */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-white">
                      <h3 className="text-sm font-bold text-slate-900 mb-2">
                        Top Priority Segments
                      </h3>
                      <p className="text-[11px] text-slate-500 mb-3">
                        Rankings update automatically as you move the sliders.
                        In a full build, this table would draw from all routes
                        in the network using live performance data.
                      </p>
                      <div className="space-y-2 max-h-64 overflow-auto">
                        {scoredSegments.map((seg, idx) => {
                          const color = getColorForScore(seg.score);
                          return (
                            <div
                              key={seg.id}
                              className="flex items-center justify-between gap-3 text-xs border rounded-lg px-2 py-1.5 hover:bg-slate-50"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-5 text-[10px] font-mono text-slate-500">
                                  {idx + 1}.
                                </span>
                                <div className="min-w-0">
                                  <div className="font-semibold text-slate-800 truncate">
                                    {seg.line} – {seg.direction}
                                  </div>
                                  <div className="text-[10px] text-slate-500">
                                    {seg.from} → {seg.to}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${Math.round(seg.score * 100)}%`,
                                      maxWidth: '100%',
                                      backgroundColor: color,
                                    }}
                                  />
                                </div>
                                <span className="w-10 text-right font-mono text-[10px] text-slate-600">
                                  {Math.round(seg.score * 100)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Right: Map view */}
                  <div className="xl:col-span-2">
                    <div className="rounded-xl overflow-hidden border border-slate-200">
                      <MapContainer
                        center={[39.96, -75.17]}
                        zoom={12}
                        style={{ height: '420px', width: '100%' }}
                        scrollWheelZoom
                      >
                        <TileLayer
                          attribution="&copy; OpenStreetMap contributors"
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {scoredSegments.map((seg) => {
                          const color = getColorForScore(seg.score);
                          return (
                            <Polyline
                              key={seg.id}
                              positions={seg.coords}
                              pathOptions={{
                                color,
                                weight: 6,
                                opacity: 0.9,
                              }}
                              eventHandlers={{
                                mouseover: () =>
                                  setHoveredChartData({
                                    title: `${seg.line} – ${seg.direction}`,
                                    content: `This segment scores ${Math.round(
                                      seg.score * 100,
                                    )} under the current weighting, with ${
                                      seg.freq_per_hr
                                    } buses/hour, an average delay of ${
                                      seg.avg_delay_min
                                    } minutes, and a load factor near ${Math.round(
                                      seg.load_factor * 100,
                                    )}%. This is a strong candidate for bus priority treatments.`,
                                  }),
                                mouseout: () => setHoveredChartData(null),
                              }}
                            />
                          );
                        })}
                      </MapContainer>
                    </div>
                    <div className="mt-3 text-[11px] text-slate-500 flex justify-between">
                      <span>
                        Map shows only illustrative segments (23, 47, 52) in
                        this prototype.
                      </span>
                      <span>Blue → Red = lower → higher score</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ANIMATION */}
            {activeSection === 'animation' && (
              <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      A Day in the Network
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                      Step through an illustrative service day to see how core
                      routes carry the city morning, noon, and night.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsPlaying((p) => !p)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-slate-200 text-xs font-medium bg-slate-50 hover:bg-slate-100"
                    >
                      {isPlaying ? (
                        <>
                          <Pause size={14} />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play size={14} />
                          <span>Play</span>
                        </>
                      )}
                    </button>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock size={12} />
                      <span>Time:</span>
                      <span className="font-mono text-slate-800">
                        {currentFrame.time}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <div className="rounded-xl overflow-hidden border border-slate-200">
                      <MapContainer
                        center={[39.96, -75.17]}
                        zoom={12}
                        style={{ height: '420px', width: '100%' }}
                        scrollWheelZoom
                      >
                        <TileLayer
                          attribution="&copy; OpenStreetMap contributors"
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {/* Base bus spines */}
                        {busSegments.map((seg) => (
                          <Polyline
                            key={seg.id}
                            positions={seg.coords}
                            pathOptions={{
                              color: '#cbd5f5',
                              weight: 3,
                              opacity: 0.7,
                            }}
                          />
                        ))}
                        {/* Animated vehicles */}
                        {currentFrame.vehicles.map((veh) => (
                          <CircleMarker
                            key={veh.id}
                            center={[veh.lat, veh.lng]}
                            pathOptions={{
                              color: SEPTA_BLUE,
                              fillColor: SEPTA_BLUE,
                              fillOpacity: 0.9,
                              weight: 2,
                            }}
                            radius={7}
                            eventHandlers={{
                              mouseover: () =>
                                setHoveredChartData({
                                  title: `Route ${veh.label} at ${currentFrame.time}`,
                                  content:
                                    'In a full build, this marker would draw from AVL or APC feeds, showing live loads, schedule adherence, and connection opportunities at this moment in the day.',
                                }),
                              mouseout: () => setHoveredChartData(null),
                            }}
                          >
                            <Popup>
                              <div className="text-xs">
                                <div className="font-bold mb-1">
                                  Route {veh.label}
                                </div>
                                <div className="text-slate-600">
                                  Snapshot at {currentFrame.time}
                                </div>
                              </div>
                            </Popup>
                          </CircleMarker>
                        ))}
                      </MapContainer>
                    </div>
                  </div>

                  <div className="space-y-4 text-xs text-slate-600">
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                      <h3 className="text-sm font-bold text-slate-900 mb-2">
                        How to Read This
                      </h3>
                      <p className="mb-2">
                        Each frame represents an illustrative snapshot of core
                        routes 23, 47, and 52. In production, these would be
                        driven by live or historical vehicle data.
                      </p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>
                          Morning frames highlight how early service clusters
                          around key job centers.
                        </li>
                        <li>
                          Mid-day frames show the steady, all-day demand on
                          trunk bus corridors.
                        </li>
                        <li>
                          Late-evening frames reveal where bus continues to
                          carry riders long after rail service tapers off.
                        </li>
                      </ul>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-200 bg-white">
                      <h3 className="text-sm font-bold text-slate-900 mb-2">
                        Extension Ideas
                      </h3>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>Overlay load factors by time of day.</li>
                        <li>Animate slow-zone segments on rail lines.</li>
                        <li>
                          Add clock controls that sync to GTFS and APC/AVL
                          feeds.
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ROADMAP */}
            {activeSection === 'roadmap' && (
              <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 space-y-6">
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-slate-900">
                    Implementation Roadmap
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">
                    A staged plan that moves from immediate reliability fixes to
                    structural reforms in how SEPTA plans, funds, and evaluates
                    service.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    {
                      phase: 'Phase 1 – Stabilize',
                      timeline: '0–12 months',
                      focus: 'Stop the bleeding',
                      items: [
                        'Lock in bus reliability improvements on Routes 23, 47, 52, and other highest-ridership corridors.',
                        'Launch a recurring slow-zone review for rail with clear public targets.',
                        'Protect core service hours in neighborhoods with low car ownership.',
                      ],
                    },
                    {
                      phase: 'Phase 2 – Pilot & Learn',
                      timeline: '12–24 months',
                      focus: 'Targeted experiments',
                      items: [
                        'Stand up 3–5 micro-transit pilots in latent-demand tracts around Temple, Germantown, West/South Philly, and the lower Northeast.',
                        'Design pilots with clear metrics: cost per rider, wait time, coverage, and mode shift.',
                        'Publish quarterly scorecards on pilot performance and lessons learned.',
                      ],
                    },
                    {
                      phase: 'Phase 3 – Reframe Rail',
                      timeline: '24–48 months',
                      focus: 'All-day utility',
                      items: [
                        'Shift Regional Rail schedules toward bi-directional, all-day patterns instead of peak-only commuting.',
                        'Reprice fares to make short rail trips competitive with bus for city riders.',
                        'Coordinate transfers so rail functions as a trunk line, not a separate premium product.',
                      ],
                    },
                    {
                      phase: 'Phase 4 – Institutionalize',
                      timeline: '48+ months',
                      focus: 'Make it repeatable',
                      items: [
                        'Create an annual “Recovery and Equity Atlas” update that feeds directly into budget and capital decisions.',
                        'Bake ridership, equity, and reliability metrics into board reporting and public dashboards.',
                        'Build a standing cross-departmental team responsible for data ingestion, analysis, and story-telling for each budget cycle.',
                      ],
                    },
                  ].map((step) => (
                    <div
                      key={step.phase}
                      className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col gap-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-[11px] uppercase tracking-wide font-semibold text-slate-500">
                            {step.timeline}
                          </p>
                          <h3 className="text-sm font-bold text-slate-900">
                            {step.phase}
                          </h3>
                        </div>
                        <span
                          className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor: `${SEPTA_BLUE}10`,
                            color: SEPTA_BLUE,
                          }}
                        >
                          {step.focus}
                        </span>
                      </div>
                      <ul className="list-disc pl-4 text-xs text-slate-600 space-y-1.5">
                        {step.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN – INSIGHT PANEL */}
          <div className="lg:col-span-1">
            <InsightPanel />
          </div>
        </div>
      </main>
    </div>
  );
}
