import { useMemo } from "react";
import { ObservatoryState } from "../state";
import { useObservatoryState } from "../useObservatoryState";
import { julianDay } from "../astro/time";
import { equatorialToHorizontal } from "../astro/coords";
import { sunPosition } from "../astro/sun";
import { moonInfo } from "../astro/moon";
import { planetPositions } from "../astro/planets";
import { daylightInfo } from "../astro/twilight";
import { GLASS_SURFACE, EYEBROW } from "../../ui/styles";

function formatTime(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * ObservatoryOverlay — glass panel above the celestial sphere.
 *
 * Surfaces:
 *  - Date / time (with pause toggle).
 *  - Location label + Use my location button.
 *  - Currently visible planets (above horizon, with altitude).
 *  - Moon phase summary.
 *  - Sunrise / sunset / twilight times for the chosen day.
 *  - Toggles for the equatorial / azimuthal grids and constellations.
 */
export function ObservatoryOverlay() {
  const s = useObservatoryState();
  const jd = useMemo(() => julianDay(s.date), [s.date]);

  const visiblePlanets = useMemo(() => {
    return planetPositions(jd)
      .map((p) => ({
        ...p,
        horizontal: equatorialToHorizontal(p.equatorial, s.location.latitude, s.location.longitude, jd),
      }))
      .filter((p) => p.horizontal.altitudeDegrees > 0)
      .sort((a, b) => b.horizontal.altitudeDegrees - a.horizontal.altitudeDegrees);
  }, [jd, s.location]);

  const moon = useMemo(() => moonInfo(jd), [jd]);
  const sun = useMemo(
    () => equatorialToHorizontal(sunPosition(jd).equatorial, s.location.latitude, s.location.longitude, jd),
    [jd, s.location],
  );
  const daylight = useMemo(
    () => daylightInfo(s.date, s.location.latitude, s.location.longitude),
    [s.date, s.location],
  );

  const onUseMyLocation = () => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        ObservatoryState.setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          label: "My location",
        });
      },
      undefined,
      { timeout: 10_000 },
    );
  };

  const dateValue = useMemo(() => {
    const d = s.date;
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }, [s.date]);

  return (
    <aside
      className={`pointer-events-auto fixed left-3 top-1/2 z-30 -translate-y-1/2 ${GLASS_SURFACE} flex w-[290px] flex-col gap-3 overflow-hidden p-4 text-[0.78rem] text-white/85`}
      style={{ maxHeight: "calc(100dvh - 1.5rem)" }}
    >
      <div className="flex items-center justify-between">
        <div className={EYEBROW}>Observatory</div>
        <button
          type="button"
          onClick={() => ObservatoryState.setPaused(!s.paused)}
          className="rounded-md border border-white/10 px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.2em] text-white/65 hover:text-white"
        >
          {s.paused ? "Resume" : "Pause"}
        </button>
      </div>

      <div className="space-y-1.5">
        <label className="block text-[0.55rem] uppercase tracking-[0.3em] text-white/45">
          Date & time
        </label>
        <input
          type="datetime-local"
          value={dateValue}
          onChange={(e) => {
            const v = e.target.value;
            if (!v) return;
            ObservatoryState.setDate(new Date(v));
            ObservatoryState.setPaused(true);
          }}
          className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[0.75rem] text-white outline-none focus:border-white/30"
        />
        <button
          type="button"
          onClick={() => { ObservatoryState.setDate(new Date()); ObservatoryState.setPaused(false); }}
          className="text-[0.6rem] uppercase tracking-[0.25em] text-sky-300/85 hover:text-sky-200"
        >
          Now ⟲
        </button>
      </div>

      <div className="space-y-1.5">
        <label className="block text-[0.55rem] uppercase tracking-[0.3em] text-white/45">
          Location
        </label>
        <div className="text-[0.78rem]">{s.location.label ?? "Custom"}</div>
        <div className="text-[0.62rem] text-white/45">
          {s.location.latitude.toFixed(3)}°, {s.location.longitude.toFixed(3)}°
        </div>
        <button
          type="button"
          onClick={onUseMyLocation}
          className="rounded-md border border-white/10 px-2 py-1 text-[0.6rem] uppercase tracking-[0.25em] text-white/75 hover:text-white"
        >
          Use my location
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto space-y-3 [scrollbar-width:thin]">
        <section>
          <div className={`${EYEBROW} mb-1`}>Sun</div>
          <div className="text-[0.72rem] text-white/75">
            Altitude {sun.altitudeDegrees.toFixed(1)}°
          </div>
          <div className="text-[0.66rem] text-white/55">
            Sunrise {formatTime(daylight.sunrise)} · Sunset {formatTime(daylight.sunset)}
          </div>
          <div className="text-[0.66rem] text-white/45">
            Civil twilight {formatTime(daylight.civilDawn)} – {formatTime(daylight.civilDusk)}
          </div>
          <div className="text-[0.66rem] text-white/45">
            Astronomical {formatTime(daylight.astronomicalDawn)} – {formatTime(daylight.astronomicalDusk)}
          </div>
        </section>

        <section>
          <div className={`${EYEBROW} mb-1`}>Moon</div>
          <div className="text-[0.72rem] text-white/75">{moon.phaseName}</div>
          <div className="text-[0.66rem] text-white/55">
            {(moon.illuminatedFraction * 100).toFixed(0)}% illuminated · age {moon.ageDays.toFixed(1)} d
          </div>
        </section>

        <section>
          <div className={`${EYEBROW} mb-1`}>Visible planets</div>
          {visiblePlanets.length === 0 ? (
            <div className="text-[0.66rem] text-white/45">None above the horizon.</div>
          ) : (
            <ul className="space-y-0.5">
              {visiblePlanets.map((p) => (
                <li key={p.id} className="flex items-center justify-between text-[0.72rem]">
                  <span className="text-white/80">{p.name}</span>
                  <span className="text-white/45 tabular-nums">
                    {p.horizontal.altitudeDegrees.toFixed(0)}° · {p.horizontal.azimuthDegrees.toFixed(0)}°
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-1">
          <div className={EYEBROW}>Overlays</div>
          {[
            ["showAzimuthalGrid", "Azimuth grid"],
            ["showEquatorialGrid", "Equatorial grid"],
            ["showConstellationLines", "Constellation lines"],
            ["showConstellationLabels", "Constellation labels"],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center justify-between text-[0.7rem] text-white/70 hover:text-white">
              <span>{label}</span>
              <input
                type="checkbox"
                checked={s[key as keyof typeof s] as boolean}
                onChange={(e) => ObservatoryState.patch({ [key]: e.target.checked })}
                className="h-3 w-3 accent-white"
              />
            </label>
          ))}
        </section>
      </div>
    </aside>
  );
}
