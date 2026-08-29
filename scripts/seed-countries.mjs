import { createClient } from "@supabase/supabase-js";
import countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json" with { type: "json" };
import atlas from "world-atlas/countries-110m.json" with { type: "json" };
import { feature } from "topojson-client";
countries.registerLocale(en);
const url=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url||!key) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
const features=feature(atlas,atlas.objects.countries).features;
function center(geometry){const polygons=geometry.type==="Polygon"?[geometry.coordinates]:geometry.coordinates;const ring=polygons.map(p=>p[0]).sort((a,b)=>b.length-a.length)[0]||[];if(!ring.length)return [0,0];let x=0,y=0,z=0;for(const [lng,lat] of ring){const la=lat*Math.PI/180,lo=lng*Math.PI/180;x+=Math.cos(la)*Math.cos(lo);y+=Math.cos(la)*Math.sin(lo);z+=Math.sin(la)}return [Math.atan2(y,x)*180/Math.PI,Math.atan2(z,Math.sqrt(x*x+y*y))*180/Math.PI]}
const rows=features.map(f=>{const iso2=countries.numericToAlpha2(String(f.id).padStart(3,"0"));const [lng,lat]=center(f.geometry);return {iso2,iso3:countries.alpha2ToAlpha3(iso2),name:countries.getName(iso2,"en")||f.properties.name,centroid_lat:lat,centroid_lng:lng}}).filter(x=>x.iso2&&x.iso3&&x.name);
const {error}=await createClient(url,key).from("countries").upsert(rows,{onConflict:"iso3"}); if(error) throw error; console.log(`Seeded ${rows.length} countries`);
