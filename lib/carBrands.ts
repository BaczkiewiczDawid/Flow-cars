export interface BrandEntry {
  brand: string;
  models: string[];
}

export const CAR_BRANDS: BrandEntry[] = [
  { brand: 'Alfa Romeo', models: ['145', '146', '147', '155', '156', '159', '164', '166', 'Brera', 'Giulia', 'Giulietta', 'GT', 'GTA', 'GTV', 'Mito', 'Spider', 'Stelvio', 'Tonale'] },
  { brand: 'Audi', models: ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'e-tron', 'Q2', 'Q3', 'Q4', 'Q5', 'Q7', 'Q8', 'R8', 'RS3', 'RS4', 'RS5', 'RS6', 'RS7', 'S3', 'S4', 'S5', 'S6', 'S8', 'SQ5', 'SQ7', 'TT', 'TTS'] },
  { brand: 'BMW', models: ['Seria 1', 'Seria 2', 'Seria 3', 'Seria 4', 'Seria 5', 'Seria 6', 'Seria 7', 'Seria 8', 'i3', 'i4', 'i5', 'i7', 'iX', 'iX3', 'M2', 'M3', 'M4', 'M5', 'M6', 'M8', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'Z3', 'Z4'] },
  { brand: 'Chevrolet', models: ['Aveo', 'Camaro', 'Captiva', 'Corvette', 'Cruze', 'Epica', 'Lacetti', 'Matiz', 'Orlando', 'Spark', 'Trax'] },
  { brand: 'Chrysler', models: ['300C', 'Grand Voyager', 'Pacifica', 'PT Cruiser', 'Sebring', 'Voyager'] },
  { brand: 'Citroën', models: ['Berlingo', 'C1', 'C2', 'C3', 'C3 Aircross', 'C3 Picasso', 'C4', 'C4 Cactus', 'C4 Picasso', 'C5', 'C5 Aircross', 'C5 X', 'C6', 'C8', 'DS3', 'DS4', 'DS5', 'Jumpy', 'Nemo', 'Saxo', 'SpaceTourer', 'Xsara', 'Xsara Picasso', 'ZX'] },
  { brand: 'Cupra', models: ['Ateca', 'Born', 'Formentor', 'Leon'] },
  { brand: 'Dacia', models: ['Duster', 'Jogger', 'Logan', 'Logan MCV', 'Lodgy', 'Sandero', 'Sandero Stepway', 'Spring'] },
  { brand: 'Dodge', models: ['Avenger', 'Caliber', 'Challenger', 'Charger', 'Durango', 'Journey', 'Nitro', 'Ram', 'Viper'] },
  { brand: 'DS Automobiles', models: ['DS 3', 'DS 3 Crossback', 'DS 4', 'DS 5', 'DS 7', 'DS 9'] },
  { brand: 'Fiat', models: ['124 Spider', '500', '500C', '500L', '500X', 'Barchetta', 'Bravo', 'Croma', 'Doblo', 'Freemont', 'Grande Punto', 'Linea', 'Marea', 'Multipla', 'Panda', 'Punto', 'Qubo', 'Scudo', 'Sedici', 'Stilo', 'Tipo', 'Ulysse'] },
  { brand: 'Ford', models: ['B-Max', 'C-Max', 'EcoSport', 'Edge', 'Explorer', 'Fiesta', 'Focus', 'Fusion', 'Galaxy', 'Grand C-Max', 'Ka', 'Ka+', 'Kuga', 'Mondeo', 'Mustang', 'Puma', 'Ranger', 'S-Max', 'Tourneo', 'Transit'] },
  { brand: 'Honda', models: ['Accord', 'Civic', 'CR-V', 'CR-Z', 'e', 'FR-V', 'HR-V', 'Insight', 'Jazz', 'Legend', 'Odyssey', 'Pilot'] },
  { brand: 'Hyundai', models: ['Bayon', 'Elantra', 'Genesis', 'Grand Santa Fe', 'i10', 'i20', 'i30', 'i40', 'i50', 'IONIQ', 'IONIQ 5', 'IONIQ 6', 'ix20', 'ix35', 'Kona', 'Matrix', 'Santa Fe', 'Sonata', 'Terracan', 'Tucson'] },
  { brand: 'Infiniti', models: ['EX', 'FX', 'G', 'M', 'Q30', 'Q50', 'Q60', 'Q70', 'QX30', 'QX50', 'QX60', 'QX70', 'QX80'] },
  { brand: 'Jaguar', models: ['E-Pace', 'E-Type', 'F-Pace', 'F-Type', 'I-Pace', 'S-Type', 'X-Type', 'XE', 'XF', 'XJ'] },
  { brand: 'Jeep', models: ['Avenger', 'Cherokee', 'Commander', 'Compass', 'Grand Cherokee', 'Patriot', 'Renegade', 'Wrangler'] },
  { brand: 'Kia', models: ['Carens', 'Ceed', 'EV6', 'Niro', 'Picanto', 'ProCeed', 'Rio', 'Sorento', 'Soul', 'Sportage', 'Stinger', 'Stonic', 'Venga', 'XCeed'] },
  { brand: 'Land Rover', models: ['Defender', 'Discovery', 'Discovery Sport', 'Freelander', 'Range Rover', 'Range Rover Evoque', 'Range Rover Sport', 'Range Rover Velar'] },
  { brand: 'Lexus', models: ['CT', 'ES', 'GS', 'GX', 'IS', 'LC', 'LM', 'LS', 'LX', 'NX', 'RC', 'RX', 'UX'] },
  { brand: 'Maserati', models: ['Ghibli', 'GranTurismo', 'Grecale', 'Levante', 'MC20', 'Quattroporte'] },
  { brand: 'Mazda', models: ['2', '3', '5', '6', 'CX-3', 'CX-30', 'CX-5', 'CX-60', 'CX-7', 'CX-9', 'MX-5', 'MX-30', 'RX-8'] },
  { brand: 'Mercedes-Benz', models: ['A', 'AMG GT', 'B', 'C', 'CLA', 'CLK', 'CLS', 'E', 'EQA', 'EQB', 'EQC', 'EQS', 'G', 'GLA', 'GLB', 'GLC', 'GLE', 'GLK', 'GLS', 'M', 'ML', 'R', 'S', 'SL', 'SLC', 'SLK', 'SLS', 'Sprinter', 'V', 'Viano', 'Vito'] },
  { brand: 'Mini', models: ['Cabrio', 'Clubman', 'Cooper', 'Cooper S', 'Countryman', 'Coupe', 'Electric', 'Hatch', 'John Cooper Works', 'One', 'Paceman', 'Roadster'] },
  { brand: 'Mitsubishi', models: ['ASX', 'Carisma', 'Colt', 'Eclipse Cross', 'Galant', 'Grandis', 'L200', 'Lancer', 'Outlander', 'Pajero', 'Space Star'] },
  { brand: 'Nissan', models: ['350Z', '370Z', 'Ariya', 'Juke', 'Leaf', 'Micra', 'Murano', 'Navara', 'Note', 'Pathfinder', 'Primera', 'Pulsar', 'Qashqai', 'Tiida', 'X-Trail'] },
  { brand: 'Opel', models: ['Adam', 'Agila', 'Ampera', 'Astra', 'Cascada', 'Corsa', 'Crossland', 'Frontera', 'Grandland', 'Insignia', 'Meriva', 'Mokka', 'Omega', 'Signum', 'Tigra', 'Vectra', 'Vivaro', 'Zafira'] },
  { brand: 'Peugeot', models: ['1007', '107', '108', '2008', '206', '207', '208', '3008', '301', '306', '307', '308', '4007', '4008', '406', '407', '408', '5008', '508', '607', 'Boxer', 'e-208', 'e-2008', 'Partner', 'Rifter', 'Traveller'] },
  { brand: 'Porsche', models: ['718', '911', 'Boxster', 'Cayenne', 'Cayman', 'Macan', 'Panamera', 'Taycan'] },
  { brand: 'Renault', models: ['Arkana', 'Austral', 'Captur', 'Clio', 'Espace', 'Fluence', 'Grand Scenic', 'Kadjar', 'Kangoo', 'Koleos', 'Laguna', 'Latitude', 'Logan', 'Master', 'Megane', 'Modus', 'Rafale', 'Sandero', 'Scenic', 'Symbol', 'Thalia', 'Trafic', 'Twingo', 'Vel Satis', 'Zoe'] },
  { brand: 'Seat', models: ['Alhambra', 'Altea', 'Arona', 'Ateca', 'Cordoba', 'Exeo', 'Ibiza', 'Leon', 'Mii', 'Tarraco', 'Toledo'] },
  { brand: 'Skoda', models: ['Citigo', 'Enyaq', 'Fabia', 'Kamiq', 'Karoq', 'Kodiaq', 'Octavia', 'Praktik', 'Rapid', 'Roomster', 'Scala', 'Superb', 'Yeti'] },
  { brand: 'Smart', models: ['ForFour', 'ForTwo', 'Roadster'] },
  { brand: 'Subaru', models: ['BRZ', 'Forester', 'Impreza', 'Legacy', 'Levorg', 'Outback', 'Solterra', 'WRX', 'XV'] },
  { brand: 'Suzuki', models: ['Alto', 'Baleno', 'Celerio', 'Ignis', 'Jimny', 'Kizashi', 'S-Cross', 'SX4', 'Splash', 'Swift', 'Vitara', 'Wagon R'] },
  { brand: 'Tesla', models: ['Cybertruck', 'Model 3', 'Model S', 'Model X', 'Model Y', 'Roadster'] },
  { brand: 'Toyota', models: ['Auris', 'Avensis', 'Aygo', 'bZ4X', 'C-HR', 'Camry', 'Corolla', 'Corolla Cross', 'GR86', 'GR Yaris', 'Highlander', 'Land Cruiser', 'Previa', 'Prius', 'Proace', 'RAV4', 'Supra', 'Urban Cruiser', 'Verso', 'Yaris', 'Yaris Cross'] },
  { brand: 'Volkswagen', models: ['Amarok', 'Arteon', 'Beetle', 'Bora', 'Caddy', 'California', 'Caravelle', 'Golf', 'Golf Plus', 'ID.3', 'ID.4', 'ID.5', 'ID.7', 'Jetta', 'Multivan', 'Passat', 'Phaeton', 'Polo', 'Scirocco', 'Sharan', 'T-Cross', 'T-Roc', 'Tiguan', 'Touareg', 'Touran', 'Transporter', 'Up!'] },
  { brand: 'Volvo', models: ['C30', 'C40', 'C70', 'EX30', 'EX90', 'S40', 'S60', 'S80', 'S90', 'V40', 'V50', 'V60', 'V70', 'V90', 'XC40', 'XC60', 'XC70', 'XC90'] },
];

export const BRAND_NAMES = CAR_BRANDS.map((b) => b.brand);

export function getModels(brand: string): string[] {
  return CAR_BRANDS.find((b) => b.brand === brand)?.models ?? [];
}
