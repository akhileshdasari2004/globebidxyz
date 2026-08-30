export type Brand = { id: string; name: string; website_url: string; logo_url: string };
export type CountryState = { id?: string; iso2: string; iso3: string; name: string; centroid_lat: number; centroid_lng: number; current_stake: number; brand: Brand | null };
