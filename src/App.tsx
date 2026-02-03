import { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area } from 'recharts';
import { Cloud, Activity, Database, Cpu, TrendingUp, AlertTriangle, CheckCircle, Globe, MapPin, Thermometer, Droplets, Sun, Leaf, Users } from 'lucide-react';
import { cn } from './utils/cn';

// Kenya Counties Data
const kenyaCounties = [
  { id: 'nakuru', name: 'Nakuru', region: 'Rift Valley', lat: -0.3031, lng: 36.0800 },
  { id: 'uasin-gishu', name: 'Uasin Gishu', region: 'Rift Valley', lat: 0.5143, lng: 35.2698 },
  { id: 'trans-nzoia', name: 'Trans Nzoia', region: 'Rift Valley', lat: 1.0567, lng: 34.9507 },
  { id: 'nyandarua', name: 'Nyandarua', region: 'Central', lat: -0.1804, lng: 36.5232 },
  { id: 'kiambu', name: 'Kiambu', region: 'Central', lat: -1.1714, lng: 36.8356 },
  { id: 'meru', name: 'Meru', region: 'Eastern', lat: 0.0500, lng: 37.6500 },
  { id: 'machakos', name: 'Machakos', region: 'Eastern', lat: -1.5177, lng: 37.2634 },
  { id: 'kakamega', name: 'Kakamega', region: 'Western', lat: 0.2827, lng: 34.7519 },
  { id: 'bungoma', name: 'Bungoma', region: 'Western', lat: 0.5635, lng: 34.5606 },
  { id: 'kisumu', name: 'Kisumu', region: 'Nyanza', lat: -0.1022, lng: 34.7617 },
  { id: 'nyeri', name: 'Nyeri', region: 'Central', lat: -0.4197, lng: 36.9553 },
  { id: 'kirinyaga', name: 'Kirinyaga', region: 'Central', lat: -0.5000, lng: 37.2833 },
  { id: 'embu', name: 'Embu', region: 'Eastern', lat: -0.5389, lng: 37.4583 },
  { id: 'laikipia', name: 'Laikipia', region: 'Rift Valley', lat: 0.3606, lng: 36.7820 },
  { id: 'narok', name: 'Narok', region: 'Rift Valley', lat: -1.0918, lng: 35.8603 },
  { id: 'kericho', name: 'Kericho', region: 'Rift Valley', lat: -0.3692, lng: 35.2863 },
  { id: 'bomet', name: 'Bomet', region: 'Rift Valley', lat: -0.7827, lng: 35.3428 },
  { id: 'taita-taveta', name: 'Taita Taveta', region: 'Coast', lat: -3.3161, lng: 38.4850 }
];

// Kenyan Crops
const kenyaCrops = [
  { id: 'maize', name: 'Maize (Mahindi)', color: '#fbbf24', icon: '🌽' },
  { id: 'tea', name: 'Tea (Chai)', color: '#22c55e', icon: '🍵' },
  { id: 'coffee', name: 'Coffee (Kahawa)', color: '#8b5cf6', icon: '☕' },
  { id: 'wheat', name: 'Wheat (Ngano)', color: '#f59e0b', icon: '🌾' },
  { id: 'sugarcane', name: 'Sugarcane (Miwa)', color: '#10b981', icon: '🎋' },
  { id: 'beans', name: 'Beans (Maharagwe)', color: '#ef4444', icon: '🫘' },
  { id: 'potatoes', name: 'Potatoes (Viazi)', color: '#a855f7', icon: '🥔' },
  { id: 'rice', name: 'Rice (Mchele)', color: '#06b6d4', icon: '🍚' },
  { id: 'sorghum', name: 'Sorghum (Mtama)', color: '#f97316', icon: '🌿' },
  { id: 'millet', name: 'Millet (Wimbi)', color: '#84cc16', icon: '🌾' },
  { id: 'cassava', name: 'Cassava (Muhogo)', color: '#ec4899', icon: '🌿' },
  { id: 'bananas', name: 'Bananas (Ndizi)', color: '#eab308', icon: '🍌' },
  { id: 'avocado', name: 'Avocado (Parachichi)', color: '#65a30d', icon: '🥑' },
  { id: 'mangoes', name: 'Mangoes (Maembe)', color: '#fb923c', icon: '🥭' },
  { id: 'tomatoes', name: 'Tomatoes (Nyanya)', color: '#dc2626', icon: '🍅' },
  { id: 'onions', name: 'Onions (Vitunguu)', color: '#c084fc', icon: '🧅' }
];

interface CountyYieldData {
  county: string;
  maize: number;
  wheat: number;
  tea: number;
  coffee: number;
  potatoes: number;
  beans: number;
}

interface MonthlyWeatherData {
  month: string;
  temperature: number;
  rainfall: number;
  humidity: number;
  yieldIndex: number;
}

interface CropYieldTrend {
  year: string;
  maize: number;
  wheat: number;
  tea: number;
  coffee: number;
  sugarcane: number;
}

// Available years for selection
const availableYears = ['2026', '2025', '2024', '2023', '2022'];

// Year-based data multipliers for realistic data variation
const yearMultipliers: Record<string, { yield: number; rainfall: number; temp: number }> = {
  '2022': { yield: 0.85, rainfall: 0.90, temp: 0.98 },
  '2023': { yield: 0.92, rainfall: 0.95, temp: 0.99 },
  '2024': { yield: 0.96, rainfall: 1.02, temp: 1.00 },
  '2025': { yield: 1.00, rainfall: 0.98, temp: 1.01 },
  '2026': { yield: 1.05, rainfall: 1.05, temp: 1.02 }
};

export function App() {
  const [selectedCounty, setSelectedCounty] = useState('nakuru');
  const [selectedCrop, setSelectedCrop] = useState('maize');
  const [selectedYear, setSelectedYear] = useState('2026');

  const currentMultiplier = yearMultipliers[selectedYear] || yearMultipliers['2026'];

  // Dynamic county yield data based on selected year
  const countyYieldData: CountyYieldData[] = [
    { county: 'Trans Nzoia', maize: Math.round(32 * currentMultiplier.yield), wheat: Math.round(28 * currentMultiplier.yield), tea: 0, coffee: Math.round(5 * currentMultiplier.yield), potatoes: Math.round(18 * currentMultiplier.yield), beans: Math.round(22 * currentMultiplier.yield) },
    { county: 'Uasin Gishu', maize: Math.round(28 * currentMultiplier.yield), wheat: Math.round(35 * currentMultiplier.yield), tea: 0, coffee: Math.round(3 * currentMultiplier.yield), potatoes: Math.round(15 * currentMultiplier.yield), beans: Math.round(20 * currentMultiplier.yield) },
    { county: 'Nakuru', maize: Math.round(25 * currentMultiplier.yield), wheat: Math.round(22 * currentMultiplier.yield), tea: Math.round(8 * currentMultiplier.yield), coffee: Math.round(12 * currentMultiplier.yield), potatoes: Math.round(30 * currentMultiplier.yield), beans: Math.round(18 * currentMultiplier.yield) },
    { county: 'Nyandarua', maize: Math.round(18 * currentMultiplier.yield), wheat: Math.round(15 * currentMultiplier.yield), tea: Math.round(5 * currentMultiplier.yield), coffee: Math.round(8 * currentMultiplier.yield), potatoes: Math.round(45 * currentMultiplier.yield), beans: Math.round(25 * currentMultiplier.yield) },
    { county: 'Kericho', maize: Math.round(12 * currentMultiplier.yield), wheat: Math.round(5 * currentMultiplier.yield), tea: Math.round(48 * currentMultiplier.yield), coffee: Math.round(2 * currentMultiplier.yield), potatoes: Math.round(8 * currentMultiplier.yield), beans: Math.round(15 * currentMultiplier.yield) },
    { county: 'Meru', maize: Math.round(20 * currentMultiplier.yield), wheat: Math.round(8 * currentMultiplier.yield), tea: Math.round(22 * currentMultiplier.yield), coffee: Math.round(35 * currentMultiplier.yield), potatoes: Math.round(25 * currentMultiplier.yield), beans: Math.round(28 * currentMultiplier.yield) },
    { county: 'Kiambu', maize: Math.round(15 * currentMultiplier.yield), wheat: Math.round(5 * currentMultiplier.yield), tea: Math.round(18 * currentMultiplier.yield), coffee: Math.round(42 * currentMultiplier.yield), potatoes: Math.round(20 * currentMultiplier.yield), beans: Math.round(22 * currentMultiplier.yield) },
    { county: 'Kakamega', maize: Math.round(30 * currentMultiplier.yield), wheat: Math.round(2 * currentMultiplier.yield), tea: Math.round(5 * currentMultiplier.yield), coffee: Math.round(3 * currentMultiplier.yield), potatoes: Math.round(8 * currentMultiplier.yield), beans: Math.round(35 * currentMultiplier.yield) }
  ];

  // Dynamic weather data based on selected year
  const weatherData: MonthlyWeatherData[] = [
    { month: 'Jan', temperature: Math.round(24 * currentMultiplier.temp), rainfall: Math.round(45 * currentMultiplier.rainfall), humidity: 58, yieldIndex: Math.round(72 * currentMultiplier.yield) },
    { month: 'Feb', temperature: Math.round(25 * currentMultiplier.temp), rainfall: Math.round(38 * currentMultiplier.rainfall), humidity: 55, yieldIndex: Math.round(70 * currentMultiplier.yield) },
    { month: 'Mar', temperature: Math.round(26 * currentMultiplier.temp), rainfall: Math.round(85 * currentMultiplier.rainfall), humidity: 68, yieldIndex: Math.round(78 * currentMultiplier.yield) },
    { month: 'Apr', temperature: Math.round(24 * currentMultiplier.temp), rainfall: Math.round(165 * currentMultiplier.rainfall), humidity: 78, yieldIndex: Math.round(88 * currentMultiplier.yield) },
    { month: 'May', temperature: Math.round(23 * currentMultiplier.temp), rainfall: Math.round(145 * currentMultiplier.rainfall), humidity: 75, yieldIndex: Math.round(92 * currentMultiplier.yield) },
    { month: 'Jun', temperature: Math.round(21 * currentMultiplier.temp), rainfall: Math.round(55 * currentMultiplier.rainfall), humidity: 65, yieldIndex: Math.round(85 * currentMultiplier.yield) },
    { month: 'Jul', temperature: Math.round(20 * currentMultiplier.temp), rainfall: Math.round(42 * currentMultiplier.rainfall), humidity: 62, yieldIndex: Math.round(80 * currentMultiplier.yield) },
    { month: 'Aug', temperature: Math.round(21 * currentMultiplier.temp), rainfall: Math.round(48 * currentMultiplier.rainfall), humidity: 60, yieldIndex: Math.round(78 * currentMultiplier.yield) },
    { month: 'Sep', temperature: Math.round(22 * currentMultiplier.temp), rainfall: Math.round(52 * currentMultiplier.rainfall), humidity: 58, yieldIndex: Math.round(75 * currentMultiplier.yield) },
    { month: 'Oct', temperature: Math.round(24 * currentMultiplier.temp), rainfall: Math.round(95 * currentMultiplier.rainfall), humidity: 68, yieldIndex: Math.round(82 * currentMultiplier.yield) },
    { month: 'Nov', temperature: Math.round(23 * currentMultiplier.temp), rainfall: Math.round(145 * currentMultiplier.rainfall), humidity: 75, yieldIndex: Math.round(90 * currentMultiplier.yield) },
    { month: 'Dec', temperature: Math.round(23 * currentMultiplier.temp), rainfall: Math.round(85 * currentMultiplier.rainfall), humidity: 70, yieldIndex: Math.round(85 * currentMultiplier.yield) }
  ];

  const yieldTrends: CropYieldTrend[] = [
    { year: '2022', maize: 3.8, wheat: 3.2, tea: 2.7, coffee: 0.85, sugarcane: 72 },
    { year: '2023', maize: 4.0, wheat: 3.4, tea: 2.8, coffee: 0.88, sugarcane: 75 },
    { year: '2024', maize: 4.2, wheat: 3.5, tea: 2.9, coffee: 0.92, sugarcane: 78 },
    { year: '2025', maize: 4.4, wheat: 3.7, tea: 3.0, coffee: 0.95, sugarcane: 80 },
    { year: '2026', maize: 4.6, wheat: 3.9, tea: 3.1, coffee: 0.98, sugarcane: 82 }
  ];

  const cropDistribution = [
    { name: 'Maize', value: 32, color: '#fbbf24' },
    { name: 'Tea', value: 18, color: '#22c55e' },
    { name: 'Coffee', value: 12, color: '#8b5cf6' },
    { name: 'Wheat', value: 10, color: '#f59e0b' },
    { name: 'Sugarcane', value: 8, color: '#10b981' },
    { name: 'Beans', value: 8, color: '#ef4444' },
    { name: 'Potatoes', value: 7, color: '#a855f7' },
    { name: 'Others', value: 5, color: '#6b7280' }
  ];

  const radarData = [
    { metric: 'Temperature', current: 82, optimal: 88 },
    { metric: 'Soil Moisture', current: 78, optimal: 85 },
    { metric: 'Nutrients', current: 88, optimal: 92 },
    { metric: 'Rainfall', current: 75, optimal: 80 },
    { metric: 'pH Level', current: 85, optimal: 90 },
    { metric: 'Sunlight', current: 90, optimal: 88 }
  ];

  // Dynamic soil data based on year
  const soilMultiplier = currentMultiplier.yield;
  const soilData = [
    { depth: '0-15cm', moisture: Math.round(72 * soilMultiplier), nitrogen: Math.round(45 * soilMultiplier), phosphorus: Math.round(38 * soilMultiplier), potassium: Math.round(52 * soilMultiplier) },
    { depth: '15-30cm', moisture: Math.round(68 * soilMultiplier), nitrogen: Math.round(42 * soilMultiplier), phosphorus: Math.round(35 * soilMultiplier), potassium: Math.round(48 * soilMultiplier) },
    { depth: '30-45cm', moisture: Math.round(65 * soilMultiplier), nitrogen: Math.round(38 * soilMultiplier), phosphorus: Math.round(32 * soilMultiplier), potassium: Math.round(45 * soilMultiplier) },
    { depth: '45-60cm', moisture: Math.round(62 * soilMultiplier), nitrogen: Math.round(35 * soilMultiplier), phosphorus: Math.round(28 * soilMultiplier), potassium: Math.round(42 * soilMultiplier) }
  ];

  const modelPerformance = [
    { model: 'Random Forest', accuracy: 92.5, mae: 0.32, rmse: 0.45, crop: 'Maize' },
    { model: 'Gradient Boost', accuracy: 94.2, mae: 0.28, rmse: 0.38, crop: 'Wheat' },
    { model: 'CNN (Satellite)', accuracy: 95.8, mae: 0.22, rmse: 0.32, crop: 'Tea' },
    { model: 'Ensemble', accuracy: 96.5, mae: 0.18, rmse: 0.25, crop: 'All Crops' }
  ];

  const bigDataStats = [
    { label: 'Satellite Images', value: '1.8M', subtext: 'Sentinel-2 & Landsat', icon: Globe },
    { label: 'Weather Records', value: '8.5TB', subtext: 'KMD Data', icon: Cloud },
    { label: 'Soil Sensors', value: '25K', subtext: 'Across 47 Counties', icon: Activity },
    { label: 'Farmers Served', value: '850K', subtext: 'Smallholders', icon: Users }
  ];

  // Year-specific alerts
  const alertsByYear: Record<string, Array<{ type: string; message: string; time: string }>> = {
    '2026': [
      { type: 'warning', message: 'Drought conditions developing in Turkana and Marsabit counties', time: '1 hour ago' },
      { type: 'success', message: 'Optimal planting conditions for long rains in Central Kenya', time: '3 hours ago' },
      { type: 'info', message: 'New satellite imagery processed for Rift Valley region', time: '5 hours ago' },
      { type: 'warning', message: 'Fall Armyworm outbreak detected in Trans Nzoia maize fields', time: '8 hours ago' }
    ],
    '2025': [
      { type: 'success', message: 'Record maize harvest recorded in Trans Nzoia County', time: 'Dec 2025' },
      { type: 'info', message: 'El Niño conditions affected short rains season', time: 'Oct 2025' },
      { type: 'warning', message: 'Coffee leaf rust detected in Kiambu plantations', time: 'Aug 2025' },
      { type: 'success', message: 'Tea exports reached 5-year high in Kericho region', time: 'Jul 2025' }
    ],
    '2024': [
      { type: 'warning', message: 'La Niña caused below-average rainfall in Eastern Kenya', time: 'Nov 2024' },
      { type: 'success', message: 'Wheat production increased 12% in Narok County', time: 'Sep 2024' },
      { type: 'info', message: 'New irrigation schemes launched in Machakos', time: 'Jun 2024' },
      { type: 'success', message: 'Avocado exports to EU market reached record levels', time: 'Mar 2024' }
    ],
    '2023': [
      { type: 'warning', message: 'Severe drought affected pastoral counties', time: 'Aug 2023' },
      { type: 'info', message: 'Digital soil mapping completed for 35 counties', time: 'Jun 2023' },
      { type: 'success', message: 'Miraa exports increased significantly to Somalia', time: 'Apr 2023' },
      { type: 'warning', message: 'Locust invasion in Northern Kenya controlled', time: 'Feb 2023' }
    ],
    '2022': [
      { type: 'warning', message: 'Prolonged drought in ASAL regions affected livestock', time: 'Oct 2022' },
      { type: 'info', message: 'Kenya AgriPredict platform launched nationwide', time: 'Jul 2022' },
      { type: 'success', message: 'Potato production in Nyandarua exceeded targets', time: 'May 2022' },
      { type: 'warning', message: 'Fertilizer prices increased due to global supply issues', time: 'Mar 2022' }
    ]
  };

  const alerts = alertsByYear[selectedYear] || alertsByYear['2026'];

  const countyDetails = kenyaCounties.find(c => c.id === selectedCounty);
  const selectedCropDetails = kenyaCrops.find(c => c.id === selectedCrop);

  // Generate field health grid based on selected county
  const generateFieldHealth = () => {
    const baseHealth = selectedCounty === 'nakuru' ? 85 : 
                       selectedCounty === 'trans-nzoia' ? 88 :
                       selectedCounty === 'kericho' ? 92 : 80;
    return Array.from({ length: 100 }).map(() => Math.random() * 25 + baseHealth - 15);
  };

  const fieldHealthData = generateFieldHealth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-amber-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-green-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl">
                <Leaf className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Kenya AgriPredict</h1>
                <p className="text-sm text-green-700">Climate-Smart Agriculture for Kenya 🇰🇪</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <select 
                value={selectedCounty}
                onChange={(e) => setSelectedCounty(e.target.value)}
                className="px-4 py-2 border border-green-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                {kenyaCounties.map(county => (
                  <option key={county.id} value={county.id}>{county.name} County</option>
                ))}
              </select>
              <select 
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="px-4 py-2 border border-green-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                {kenyaCrops.map(crop => (
                  <option key={crop.id} value={crop.id}>{crop.icon} {crop.name}</option>
                ))}
              </select>
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-4 py-2 border border-green-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>
                    {year} {year === '2026' ? '(Current)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {bigDataStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-green-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                    <p className="text-xs text-green-600 mt-1">{stat.subtext}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-xl">
                    <Icon className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Year & County Info Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
          {/* Year Summary Card */}
          <div className="lg:col-span-1 bg-gradient-to-br from-slate-800 to-slate-900 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-slate-400">Selected Year</span>
              {selectedYear === '2026' && (
                <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-medium rounded-full">Current</span>
              )}
            </div>
            <p className="text-4xl font-bold mb-4">{selectedYear}</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Yield Index</span>
                <span className="font-medium text-green-400">
                  {selectedYear === '2026' ? '+5%' : selectedYear === '2025' ? '+0%' : selectedYear === '2024' ? '-4%' : selectedYear === '2023' ? '-8%' : '-15%'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Rainfall</span>
                <span className="font-medium text-blue-400">
                  {selectedYear === '2026' ? '+5%' : selectedYear === '2025' ? '-2%' : selectedYear === '2024' ? '+2%' : selectedYear === '2023' ? '-5%' : '-10%'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Data Status</span>
                <span className={cn(
                  "font-medium",
                  selectedYear === '2026' ? "text-green-400" : "text-amber-400"
                )}>
                  {selectedYear === '2026' ? 'Live' : 'Archived'}
                </span>
              </div>
            </div>
          </div>

          {/* County Info Card */}
          <div className="lg:col-span-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white p-6 rounded-xl shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <MapPin className="h-8 w-8" />
                <div>
                  <h2 className="text-2xl font-bold">{countyDetails?.name} County</h2>
                  <p className="text-green-100">{countyDetails?.region} Region • {selectedCropDetails?.icon} {selectedCropDetails?.name} • {selectedYear}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <Thermometer className="h-6 w-6 mx-auto mb-1" />
                  <p className="text-2xl font-bold">{Math.round(24 * currentMultiplier.temp)}°C</p>
                  <p className="text-xs text-green-100">Avg Temp</p>
                </div>
                <div className="text-center">
                  <Droplets className="h-6 w-6 mx-auto mb-1" />
                  <p className="text-2xl font-bold">{Math.round(85 * currentMultiplier.rainfall)}mm</p>
                  <p className="text-xs text-green-100">Monthly Rain</p>
                </div>
                <div className="text-center">
                  <Sun className="h-6 w-6 mx-auto mb-1" />
                  <p className="text-2xl font-bold">7.2h</p>
                  <p className="text-xs text-green-100">Sunlight/Day</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Satellite Field Health */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-green-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Satellite Field Health - {countyDetails?.name}</h2>
                <p className="text-sm text-slate-500">NDVI Analysis from Sentinel-2 • {selectedYear}</p>
              </div>
              <span className={cn(
                "px-3 py-1 text-sm rounded-full flex items-center",
                selectedYear === '2026' ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
              )}>
                {selectedYear === '2026' ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    Live
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>
                    Historical
                  </>
                )}
              </span>
            </div>
            <div className="relative">
              <div className="h-80 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg relative overflow-hidden border border-green-200">
                <div className="absolute inset-0 grid grid-cols-10 grid-rows-10">
                  {fieldHealthData.map((health, i) => {
                    let bgColor = 'rgba(34, 197, 94, 0.8)'; // green
                    if (health < 70) bgColor = 'rgba(239, 68, 68, 0.7)'; // red
                    else if (health < 80) bgColor = 'rgba(251, 191, 36, 0.7)'; // yellow
                    return (
                      <div
                        key={i}
                        className="border border-green-300/30 hover:border-white hover:z-10 transition-all cursor-pointer"
                        style={{ backgroundColor: bgColor }}
                        title={`Health: ${health.toFixed(1)}%`}
                      />
                    );
                  })}
                </div>
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-2 rounded-lg shadow">
                  <p className="text-xs font-medium text-slate-700">Average Field Health</p>
                  <p className="text-xl font-bold text-green-600">
                    {(fieldHealthData.reduce((a, b) => a + b, 0) / fieldHealthData.length).toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-center space-x-6">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-400 rounded"></div>
                  <span className="text-sm text-slate-600">Poor (&lt;70%)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                  <span className="text-sm text-slate-600">Fair (70-80%)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-sm text-slate-600">Good (&gt;80%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-900">Kenya Agricultural Alerts</h2>
              <span className={cn(
                "px-2 py-1 text-xs font-medium rounded-full",
                selectedYear === '2026' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
              )}>
                {selectedYear === '2026' ? 'Live' : `Archive ${selectedYear}`}
              </span>
            </div>
            <div className="space-y-4">
              {alerts.map((alert, index) => (
                <div key={index} className={cn(
                  'p-4 rounded-lg border',
                  alert.type === 'warning' && 'bg-amber-50 border-amber-200',
                  alert.type === 'success' && 'bg-green-50 border-green-200',
                  alert.type === 'info' && 'bg-blue-50 border-blue-200'
                )}>
                  <div className="flex items-start space-x-3">
                    {alert.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />}
                    {alert.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />}
                    {alert.type === 'info' && <Activity className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{alert.message}</p>
                      <p className="text-xs text-slate-500 mt-1">{alert.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Weather & Yield */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Weather Patterns & Yield Index - {selectedYear}</h2>
            <p className="text-sm text-slate-500 mb-6">Kenya Meteorological Department Data {selectedYear === '2026' && <span className="text-green-600 font-medium">(Live Data)</span>}</p>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={weatherData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="rainfall" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="Rainfall (mm)" />
                <Area type="monotone" dataKey="yieldIndex" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} name="Yield Index (%)" />
                <Line type="monotone" dataKey="temperature" stroke="#ef4444" name="Temperature (°C)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* County Comparison */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">County Yield Comparison - {selectedYear}</h2>
            <p className="text-sm text-slate-500 mb-6">Bags per Hectare by County {selectedYear !== '2026' && <span className="text-amber-600">(Historical)</span>}</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={countyYieldData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#64748b" />
                <YAxis dataKey="county" type="category" stroke="#64748b" width={90} />
                <Tooltip />
                <Legend />
                <Bar dataKey="maize" fill="#fbbf24" name="Maize" />
                <Bar dataKey="wheat" fill="#f59e0b" name="Wheat" />
                <Bar dataKey="potatoes" fill="#a855f7" name="Potatoes" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Crop Distribution */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Kenya Crop Distribution</h2>
            <p className="text-sm text-slate-500 mb-4">% of Agricultural Land</p>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={cropDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                  labelLine={false}
                >
                  {cropDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Growing Conditions Radar */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Growing Conditions</h2>
            <p className="text-sm text-slate-500 mb-4">{countyDetails?.name} County</p>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="metric" stroke="#64748b" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#64748b" />
                <Radar name="Current" dataKey="current" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} />
                <Radar name="Optimal" dataKey="optimal" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                <Tooltip />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Yield Trends */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Yield Trends (Tonnes/Ha)</h2>
            <p className="text-sm text-slate-500 mb-4">2022-2026 Performance</p>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={yieldTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="year" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="maize" stroke="#fbbf24" strokeWidth={2} name="Maize" />
                <Line type="monotone" dataKey="wheat" stroke="#f59e0b" strokeWidth={2} name="Wheat" />
                <Line type="monotone" dataKey="tea" stroke="#22c55e" strokeWidth={2} name="Tea" />
                <Line type="monotone" dataKey="coffee" stroke="#8b5cf6" strokeWidth={2} name="Coffee" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Soil Sensors & Model Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Soil Sensors */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Soil Sensor Network - {selectedYear}</h2>
            <p className="text-sm text-slate-500 mb-6">NPK Analysis by Depth - {countyDetails?.name}</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={soilData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="depth" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Legend />
                <Bar dataKey="moisture" fill="#3b82f6" name="Moisture (%)" />
                <Bar dataKey="nitrogen" fill="#22c55e" name="Nitrogen" />
                <Bar dataKey="phosphorus" fill="#f59e0b" name="Phosphorus" />
                <Bar dataKey="potassium" fill="#8b5cf6" name="Potassium" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Model Performance */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">ML Model Performance</h2>
            <p className="text-sm text-slate-500 mb-6">Yield Prediction Accuracy</p>
            <div className="space-y-4">
              {modelPerformance.map((model, index) => (
                <div key={index} className="border-b border-slate-100 pb-4 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-sm font-medium text-slate-900">{model.model}</span>
                      <span className="text-xs text-slate-500 ml-2">({model.crop})</span>
                    </div>
                    <span className="text-sm font-bold text-green-600">{model.accuracy}%</span>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-slate-500 mb-2">
                    <span>MAE: {model.mae}</span>
                    <span>RMSE: {model.rmse}</span>
                  </div>
                  <div className="bg-slate-100 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${model.accuracy}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Processing Pipeline */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Distributed Processing Pipeline</h2>
              <p className="text-sm text-slate-500">Terabytes of geospatial data from Kenya's 47 counties</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-slate-600">System Active</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <Database className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-medium text-slate-900">Data Ingestion</h3>
              <p className="text-sm text-slate-600 mt-1">8,500 records/sec</p>
              <p className="text-xs text-blue-600 mt-1">KMD, Sentinel-2, Landsat</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <Cpu className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-medium text-slate-900">ML Processing</h3>
              <p className="text-sm text-slate-600 mt-1">425 compute nodes</p>
              <p className="text-xs text-purple-600 mt-1">Random Forest, CNN, XGBoost</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-medium text-slate-900">Prediction Output</h3>
              <p className="text-sm text-slate-600 mt-1">96.5% accuracy</p>
              <p className="text-xs text-green-600 mt-1">County-level forecasts</p>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-xl">
              <Users className="h-8 w-8 text-amber-600 mx-auto mb-2" />
              <h3 className="font-medium text-slate-900">Farmer Delivery</h3>
              <p className="text-sm text-slate-600 mt-1">850K+ farmers</p>
              <p className="text-xs text-amber-600 mt-1">SMS, USSD, Mobile App</p>
            </div>
          </div>
        </div>

        {/* Kenya Crops Overview */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Kenya Major Crops Overview</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {kenyaCrops.slice(0, 8).map((crop) => (
              <button
                key={crop.id}
                onClick={() => setSelectedCrop(crop.id)}
                className={cn(
                  'p-4 rounded-xl border-2 transition-all text-center hover:shadow-md',
                  selectedCrop === crop.id 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-slate-200 bg-white hover:border-green-300'
                )}
              >
                <span className="text-3xl">{crop.icon}</span>
                <p className="text-xs font-medium text-slate-700 mt-2">{crop.name.split(' ')[0]}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-slate-500">
          <p>Kenya AgriPredict © 2026 • Empowering Farmers with Climate-Smart Agriculture</p>
          <p className="mt-1">Data Sources: Kenya Meteorological Department • Sentinel-2 • KALRO • County Governments</p>
        </footer>
      </main>
    </div>
  );
}
