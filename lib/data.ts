import "server-only";

export type Day = {
  day: string;
  sleep?: number;
  recovery?: number;
  strain?: number;
  steps?: number;
  duration?: number;
  hrv?: number;
  rhr?: number;
};

export type Activity = {
  entryId: string;
  kind: string;
  title: string;
  start: number;
  end?: number;
  strain?: number;
  averageHeartRate?: number;
  maxHeartRate?: number;
  calories?: number;
  sleepScore?: number;
  zonePercents?: number[];
};

export type Status = {
  heartRate?: number;
  heartRateAt?: number;
  battery?: number;
  powerPackBattery?: number;
  connected?: boolean;
  syncedAt: number;
};

export type Dashboard = { days: Day[]; activities: Activity[]; status: Status | null };

/** One Convex read per minute at most, shared by every page view. */
export async function loadDashboard(): Promise<Dashboard> {
  const site = process.env.CONVEX_SITE_URL;
  const token = process.env.WHOOP_WEB_READ_TOKEN;
  if (!site || !token) throw new Error("CONVEX_SITE_URL and WHOOP_WEB_READ_TOKEN must be set");
  const response = await fetch(`${site.replace(/\/$/, "")}/v1/web/dashboard`, {
    headers: { authorization: `Bearer ${token}` },
    next: { revalidate: 60 },
  });
  if (!response.ok) throw new Error(`Dashboard request failed: ${response.status}`);
  return response.json();
}
