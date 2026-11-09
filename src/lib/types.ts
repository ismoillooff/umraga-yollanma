import defaults from "../../shared/default-config.json";
export type SiteConfig = typeof defaults;
export type Package = SiteConfig["packages"][number];
export type LeadStatus = "new" | "contacted" | "confirmed" | "archived";
export interface Lead {
  id: string;
  name: string;
  phone: string;
  note: string;
  month: string;
  duration: number;
  travelers: number;
  packageId: string;
  package: string;
  price: number;
  status: LeadStatus;
  adminNote: string;
  createdAt: string;
  source: string;
}
export interface AdminState {
  config: SiteConfig;
  revision: number;
  leads: Lead[];
  activity: { id: number; message: string; created_at: string }[];
  username: string;
}
export const imageSrc = (value: string) =>
  value.startsWith("/") || value.startsWith("https://")
    ? value
    : `/images/${value}.jpg`;
