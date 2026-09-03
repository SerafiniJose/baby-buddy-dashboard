import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, ReferenceLine, LabelList,
} from "recharts";
import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";
import RhythmHeatmap from "../components/RhythmHeatmap";
import { Icons } from "../components/Icons";
import { colors } from "../utils/colors";
import { useUnits } from "../utils/units";
import { formatDurationShort, feedingDurationMs } from "../utils/formatters";
import {
  rhythmGrid, dailySums, diaperTypeSeries, feedingTypeMix, durationBuckets,
} from "../utils/reports";

const RANGES = [7, 14, 30];

// Identity encoding, so these are categorical - taken from the validated categorical order
// rather than picked by eye. Diaper types reuse the colors the badges already use, which
// clear every check on both surfaces; the feeding-type slots are the reference order's
// first four (an ad-hoc set failed CVD separation at deltaE 1.6 under deuteranopia).
const DIAPER_COLORS = { wet: "#3B82F6", solid: "#D97706", both: "#8B5CF6" };
const FEEDING_TYPE_COLORS = ["#3987e5", "#d95926", "#199e70", "#c98500"];

const TYPE_LABELS = {
  "breast milk": "Breast milk",
  "formula": "Formula",
  "fortified breast milk": "Fortified",
  "solid food": "Solid food",
  other: "Other",
};

function RangePicker({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
      {RANGES.map((r) => (
        <button
          key={r}
          className={`child-chip${value === r ? " child-chip-active" : ""}`}
          onClick={() => onChange(r)}
          aria-pressed={value === r}
        >
          {r} days
        </button>
      ))}
    </div>
  );
}

function ChartFrame({ height = 170, children }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

const axis = { fontSize: 11, fill: "var(--text-dim)" };

function ReportTooltip({ active, payload, label, suffix = "" }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--tooltip-bg)", border: "1px solid var(--border)",
        borderRadius: 10, padding: "8px 10px", fontSize: 12, color: "var(--text)",
      }}
    >
      <div style={{ color: "var(--text-muted)", marginBottom: 4 }}>{label}</div>
      {payload
        .filter((p) => p.value > 0)
        .map((p) => (
          <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: p.color }} />
            <span style={{ textTransform: "capitalize" }}>{p.name}</span>
            <strong style={{ marginLeft: "auto" }}>
              {Math.round(p.value)}{suffix}
            </strong>
          </div>
        ))}
    </div>
  );
}

export default function ReportsTab({ monthlyFeedings = [], monthlyChanges = [] }) {
  const units = useUnits();
  const [days, setDays] = useState(14);

  const inRange = (entries, key) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (days - 1));
    cutoff.setHours(0, 0, 0, 0);
    return entries.filter((e) => new Date(e[key]) >= cutoff);
  };

  const feeds = useMemo(() => inRange(monthlyFeedings, "start"), [monthlyFeedings, days]);
  const changes = useMemo(() => inRange(monthlyChanges, "time"), [monthlyChanges, days]);

  const feedGrid = useMemo(() => rhythmGrid(feeds, "start", days), [feeds, days]);
  const changeGrid = useMemo(() => rhythmGrid(changes, "time", days), [changes, days]);
  const amounts = useMemo(() => dailySums(feeds, "start", days, (f) => f.amount), [feeds, days]);
  const diaperDaily = useMemo(() => diaperTypeSeries(changes, days), [changes, days]);
  const typeMix = useMemo(() => feedingTypeMix(feeds), [feeds]);
  const buckets = useMemo(() => durationBuckets(feeds), [feeds]);

  // headline figures - stat tiles, not one-bar charts
  const daysWithAmount = amounts.filter((d) => d.value > 0);
  const avgVolume = daysWithAmount.length
    ? Math.round(daysWithAmount.reduce((s, d) => s + d.value, 0) / daysWithAmount.length)
    : 0;
  const avgFeeds = days ? (feeds.length / days).toFixed(1) : "0";
  const avgChanges = days ? (changes.length / days).toFixed(1) : "0";
  const durations = feeds.map(feedingDurationMs).filter(Boolean);
  const avgDuration = durations.length
    ? formatDurationShort(durations.reduce((s, ms) => s + ms, 0) / durations.length)
    : "—";
  const meanAmount = daysWithAmount.length ? avgVolume : 0;

  const typeTotal = typeMix.reduce((s, t) => s + t.count, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <RangePicker value={days} onChange={setDays} />

      <div
        className="fade-in"
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}
      >
        <StatCard
          icon={<Icons.Bottle />} label="Feeds / day" value={avgFeeds}
          sub={`${feeds.length} in ${days} days`} color={colors.feeding}
        />
        <StatCard
          icon={<Icons.Bottle />} label="Volume / day" value={avgVolume ? `${avgVolume} ${units.volume}` : "—"}
          sub="days with a recorded amount" color={colors.feeding}
        />
        <StatCard
          icon={<Icons.Clock />} label="Avg feed" value={avgDuration}
          sub={`${durations.length} timed sessions`} color={colors.feeding}
        />
        <StatCard
          icon={<Icons.Droplet />} label="Changes / day" value={avgChanges}
          sub={`${changes.length} in ${days} days`} color={colors.diaper}
        />
      </div>

      <div className="fade-in fade-in-2">
        <SectionCard title="Feeding rhythm" icon={<Icons.Bottle />} color={colors.feeding}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>
            When feeds happen, hour by hour. Darker means more feeds in that hour.
          </div>
          <RhythmHeatmap grid={feedGrid} hue={colors.feeding} unitLabel="feeds" />
        </SectionCard>
      </div>

      <div className="fade-in fade-in-2">
        <SectionCard title="Daily amounts" icon={<Icons.Bottle />} color={colors.feeding}>
          <ChartFrame>
            <BarChart data={amounts} barSize={14} margin={{ top: 16, right: 4, bottom: 0, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={axis} axisLine={false} tickLine={false} width={34} />
              <Tooltip content={<ReportTooltip suffix={` ${units.volume}`} />} cursor={{ fill: "var(--overlay-subtle)" }} />
              {meanAmount > 0 && (
                <ReferenceLine
                  y={meanAmount} stroke="var(--text-dim)" strokeDasharray="4 4"
                  label={{ value: `avg ${meanAmount}`, position: "insideTopRight", fill: "var(--text-dim)", fontSize: 10 }}
                />
              )}
              <Bar dataKey="value" name="amount" fill={colors.feeding} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartFrame>
        </SectionCard>
      </div>

      <div className="fade-in fade-in-3">
        <SectionCard title="Session length" icon={<Icons.Clock />} color={colors.feeding}>
          <ChartFrame height={150}>
            <BarChart data={buckets} barSize={22} margin={{ top: 16, right: 4, bottom: 0, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={{ ...axis, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={axis} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
              <Tooltip content={<ReportTooltip suffix=" feeds" />} cursor={{ fill: "var(--overlay-subtle)" }} />
              <Bar dataKey="count" name="feeds" fill={colors.feeding} radius={[4, 4, 0, 0]}>
                <LabelList dataKey="count" position="top" fontSize={10} fill="var(--text-dim)" formatter={(v) => (v > 0 ? v : "")} />
              </Bar>
            </BarChart>
          </ChartFrame>
        </SectionCard>
      </div>

      <div className="fade-in fade-in-3">
        <SectionCard title="Feeding types" icon={<Icons.Bottle />} color={colors.feeding}>
          {typeTotal > 0 ? (
            <>
              <div style={{ display: "flex", height: 26, borderRadius: 8, overflow: "hidden", gap: 2 }}>
                {typeMix.map((t, i) => (
                  <div
                    key={t.key}
                    title={`${TYPE_LABELS[t.key] || t.key}: ${t.count} (${t.pct.toFixed(0)}%)`}
                    style={{
                      width: `${t.pct}%`,
                      background: FEEDING_TYPE_COLORS[i % FEEDING_TYPE_COLORS.length],
                      minWidth: 2,
                    }}
                  />
                ))}
              </div>
              {/* legend + direct labels: identity is never carried by colour alone */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", marginTop: 12 }}>
                {typeMix.map((t, i) => (
                  <div key={t.key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                    <span
                      style={{
                        width: 10, height: 10, borderRadius: 3, flexShrink: 0,
                        background: FEEDING_TYPE_COLORS[i % FEEDING_TYPE_COLORS.length],
                      }}
                    />
                    <span style={{ color: "var(--text-muted)" }}>{TYPE_LABELS[t.key] || t.key}</span>
                    <strong style={{ color: "var(--text)" }}>{t.pct.toFixed(0)}%</strong>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ color: "var(--text-dim)", fontSize: 13, textAlign: "center", padding: 20 }}>
              No feedings in this range
            </div>
          )}
        </SectionCard>
      </div>

      <div className="fade-in fade-in-4">
        <SectionCard title="Diaper changes by type" icon={<Icons.Droplet />} color={colors.diaper}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>
            Each bar's height is that day's total, split by type.
          </div>
          <ChartFrame>
            <BarChart data={diaperDaily} barSize={14} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={axis} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
              <Tooltip content={<ReportTooltip />} cursor={{ fill: "var(--overlay-subtle)" }} />
              <Legend wrapperStyle={{ fontSize: 12, textTransform: "capitalize" }} />
              {/* stroking each segment in the card colour is what produces the 2px
                  surface gap between stacked segments called for by the mark spec */}
              <Bar dataKey="wet" stackId="d" fill={DIAPER_COLORS.wet} name="wet" stroke="var(--card-bg)" strokeWidth={2} />
              <Bar dataKey="solid" stackId="d" fill={DIAPER_COLORS.solid} name="solid" stroke="var(--card-bg)" strokeWidth={2} />
              <Bar dataKey="both" stackId="d" fill={DIAPER_COLORS.both} name="both" stroke="var(--card-bg)" strokeWidth={2} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartFrame>
        </SectionCard>
      </div>

      <div className="fade-in fade-in-4">
        <SectionCard title="Diaper rhythm" icon={<Icons.Droplet />} color={colors.diaper}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>
            When changes happen, hour by hour.
          </div>
          <RhythmHeatmap grid={changeGrid} hue={colors.diaper} unitLabel="changes" />
        </SectionCard>
      </div>
    </div>
  );
}
