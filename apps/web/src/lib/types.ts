export interface Service {
  id: string;
  name: string;
  durationMinutes: number;
  priceCents: number;
}

export interface PublicProfile {
  name: string;
  slug: string;
  timezone: string;
  services: Service[];
}

export interface Slot {
  startsAt: string;
  endsAt: string;
  label: string;
}

export interface AvailabilityResponse {
  date: string;
  timezone: string;
  service: Service;
  slots: Slot[];
}

export interface AppointmentConfirmation {
  id: string;
  status: string;
  startsAt: string;
  endsAt: string;
  label: string;
  professional: { name: string; slug: string };
  service: Service;
  client: { name: string; email: string | null; phone: string | null };
}

export interface AuthenticatedProfessional {
  id: string;
  name: string;
  email: string;
  slug: string;
}

export interface AuthResponse {
  token: string;
  professional: AuthenticatedProfessional;
}
