import type { Company } from "./types";

// Simulated sourcing plane. In phase 1 this array is replaced by the live
// crawl + enrichment adapter (Apollo / Clay / custom crawler) — every stage
// downstream consumes the same Company shape, so nothing else changes.
// All companies here are fictional; the domains are placeholders.

type Row = [
  name: string,
  domain: string,
  industry: string,
  subvertical: string,
  employees: number,
  city: string,
  region: string,
  country: string,
  revenueBand: string,
  founded: number,
  tech: string,
  signals: string
];

const ROWS: Row[] = [
  ["Northvale HVAC", "northvalehvac.example", "Home Services", "HVAC", 74, "Laval", "QC", "CA", "$10-25M", 2004, "WordPress,GA4,CallRail", "hiring:Marketing Manager,new location Q3"],
  ["Beaumont Roofing Co", "beaumontroofing.example", "Home Services", "Roofing", 46, "Montreal", "QC", "CA", "$5-10M", 2011, "Wix,GTM", "ad spend started 60d ago"],
  ["Perreault Plomberie", "perreaultplomberie.example", "Home Services", "Plumbing", 31, "Longueuil", "QC", "CA", "$2-5M", 1998, "WordPress", "site redesign 90d ago"],
  ["Kestrel Dental Group", "kestreldental.example", "Healthcare", "Dental DSO", 128, "Toronto", "ON", "CA", "$25-50M", 2009, "HubSpot,GA4", "acquired 2 clinics,hiring:Growth Lead"],
  ["Rivera Orthodontics", "riveraortho.example", "Healthcare", "Orthodontics", 38, "Ottawa", "ON", "CA", "$5-10M", 2013, "Squarespace", "new partner joined"],
  ["Lumen Medspa", "lumenmedspa.example", "Healthcare", "Med Spa", 22, "Montreal", "QC", "CA", "$2-5M", 2018, "Shopify,Meta Pixel", "franchise plan announced"],
  ["Ashcroft Legal LLP", "ashcroftlegal.example", "Legal", "Personal Injury", 64, "Montreal", "QC", "CA", "$10-25M", 2001, "WordPress,CallRail", "competitor raised ad budget"],
  ["Dufresne Family Law", "dufresnefamilylaw.example", "Legal", "Family Law", 19, "Quebec City", "QC", "CA", "$1-2M", 2015, "Wix", "first marketing hire posted"],
  ["Harlow Immigration", "harlowimmigration.example", "Legal", "Immigration", 41, "Toronto", "ON", "CA", "$5-10M", 2010, "WordPress,GA4", "policy-driven demand spike"],
  ["Cedarline Manufacturing", "cedarline.example", "Manufacturing", "Industrial Components", 240, "Mississauga", "ON", "CA", "$50-100M", 1986, "Drupal", "new export market"],
  ["Vantage Packaging", "vantagepackaging.example", "Manufacturing", "Packaging", 158, "Montreal", "QC", "CA", "$25-50M", 1994, "WordPress,Pardot", "rebrand in progress"],
  ["Thornton Metalworks", "thorntonmetal.example", "Manufacturing", "Fabrication", 96, "Hamilton", "ON", "CA", "$10-25M", 1979, "Static HTML", "no marketing team"],
  ["Northpeak Logistics", "northpeaklogistics.example", "Logistics", "3PL", 310, "Montreal", "QC", "CA", "$50-100M", 2006, "WordPress,HubSpot", "hiring:Demand Gen"],
  ["Fairmount Freight", "fairmountfreight.example", "Logistics", "Freight Brokerage", 87, "Toronto", "ON", "CA", "$25-50M", 2012, "WordPress", "competitor acquired rival"],
  ["Solvent Cloud", "solventcloud.example", "B2B SaaS", "FinOps", 118, "Montreal", "QC", "CA", "$10-25M", 2019, "Webflow,HubSpot,Segment", "Series B 4 months ago"],
  ["Arboreal Analytics", "arborealanalytics.example", "B2B SaaS", "Data Tooling", 64, "Toronto", "ON", "CA", "$5-10M", 2020, "Webflow,GA4", "hiring:Head of Growth"],
  ["Corvid Security", "corvidsecurity.example", "B2B SaaS", "Cybersecurity", 205, "Ottawa", "ON", "CA", "$25-50M", 2016, "Next.js,Marketo", "new CMO started 45d ago"],
  ["Halden Robotics", "haldenrobotics.example", "B2B SaaS", "Industrial Software", 92, "Sherbrooke", "QC", "CA", "$10-25M", 2017, "Webflow", "enterprise pivot"],
  ["Maison Brulee", "maisonbrulee.example", "Ecommerce", "Home Goods DTC", 44, "Montreal", "QC", "CA", "$5-10M", 2016, "Shopify,Klaviyo", "wholesale launch"],
  ["Peak Ridge Outfitters", "peakridgeoutfitters.example", "Ecommerce", "Outdoor DTC", 68, "Calgary", "AB", "CA", "$10-25M", 2014, "Shopify Plus,Klaviyo", "iOS attribution loss"],
  ["Terra Nine Skincare", "terranineskincare.example", "Ecommerce", "Beauty DTC", 29, "Montreal", "QC", "CA", "$2-5M", 2019, "Shopify,Meta Pixel", "CAC up 40% YoY"],
  ["Grandview Realty Partners", "grandviewrealty.example", "Real Estate", "Commercial Brokerage", 76, "Montreal", "QC", "CA", "$10-25M", 2003, "WordPress", "new leadership"],
  ["Sablon Property Group", "sablonproperty.example", "Real Estate", "Property Management", 134, "Montreal", "QC", "CA", "$25-50M", 1999, "Custom,GA4", "portfolio expansion"],
  ["Hartley Wealth Advisors", "hartleywealth.example", "Financial Services", "Wealth Management", 52, "Toronto", "ON", "CA", "$10-25M", 2008, "WordPress,HubSpot", "compliance-driven rebuild"],
  ["Meridian Lending", "meridianlending.example", "Financial Services", "Mortgage", 88, "Montreal", "QC", "CA", "$10-25M", 2011, "WordPress,CallRail", "rate-cycle demand shift"],
  ["Ferro Insurance Brokers", "ferroinsurance.example", "Financial Services", "Insurance Brokerage", 61, "Laval", "QC", "CA", "$5-10M", 1992, "Static HTML", "no organic strategy"],
  ["Belmont Private Schools", "belmontschools.example", "Education", "Private K-12", 180, "Montreal", "QC", "CA", "$25-50M", 1988, "WordPress", "enrolment down 8%"],
  ["Cadence Trade School", "cadencetradeschool.example", "Education", "Vocational", 95, "Toronto", "ON", "CA", "$10-25M", 2010, "WordPress,GA4", "gov funding change"],
  ["Ironwood Fitness Group", "ironwoodfitness.example", "Hospitality", "Fitness Chain", 240, "Montreal", "QC", "CA", "$25-50M", 2013, "Custom,Meta Pixel", "6 new locations"],
  ["Verrier Hotels", "verrierhotels.example", "Hospitality", "Boutique Hotels", 320, "Quebec City", "QC", "CA", "$50-100M", 1997, "WordPress,GA4", "OTA dependency rising"],
  ["Stonebridge Dental Partners", "stonebridgedental.example", "Healthcare", "Dental DSO", 410, "Boston", "MA", "US", "$50-100M", 2005, "HubSpot,GA4", "PE-backed rollup"],
  ["Kingsley Home Services", "kingsleyhome.example", "Home Services", "Multi-trade", 520, "Chicago", "IL", "US", "$100M+", 1991, "Custom,Salesforce", "national expansion"],
  ["Atlas Freight Systems", "atlasfreight.example", "Logistics", "Freight Brokerage", 640, "Dallas", "TX", "US", "$100M+", 1984, "Custom,Salesforce", "enterprise RFP season"],
  ["Juniper Legal Group", "juniperlegal.example", "Legal", "Personal Injury", 210, "Phoenix", "AZ", "US", "$50-100M", 2002, "WordPress,CallRail", "TV spend shifting to digital"],
  ["Wexford Manufacturing", "wexfordmfg.example", "Manufacturing", "Industrial Components", 780, "Cleveland", "OH", "US", "$100M+", 1972, "Drupal", "distributor conflict"],
  ["Halcyon Skin Clinics", "halcyonskin.example", "Healthcare", "Med Spa", 155, "Miami", "FL", "US", "$25-50M", 2015, "Shopify,Klaviyo", "aggressive local competitor"],
];

export const UNIVERSE: Company[] = ROWS.map((r) => ({
  id: r[1].split(".")[0],
  name: r[0],
  domain: r[1],
  industry: r[2],
  subvertical: r[3],
  employees: r[4],
  city: r[5],
  region: r[6],
  country: r[7],
  revenueBand: r[8],
  founded: r[9],
  techSignals: r[10].split(","),
  signals: r[11].split(","),
}));

export const INDUSTRIES = Array.from(new Set(UNIVERSE.map((c) => c.industry))).sort();
export const REGIONS = Array.from(new Set(UNIVERSE.map((c) => c.region))).sort();
