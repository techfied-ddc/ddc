/**
 * Development seed — run with: pnpm --filter api seed
 * Creates: 1 super-admin, 1 demo store + owner + rider, 7 categories, 33 services,
 *          full store config (serviceArea, pickupSlots, SLA, operatingHours).
 * Safe to re-run: uses upsert patterns.
 */
import 'dotenv/config';
// On Windows, Node's c-ares sometimes fails SRV DNS — use public DNS as fallback.
import { setServers } from 'dns';
setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../../lib/config.js';
import { logger } from '../../lib/logger.js';
import {
  Role, StoreStatus, ServiceUnit,
  DEFAULT_TAX_PERCENT, DEFAULT_COMMISSION_PERCENT,
} from '@ddc/shared';

const run = async () => {
  await mongoose.connect(config.MONGODB_URI);
  logger.info('Seed: connected to MongoDB');

  // Inline minimal models — strict: false lets us write extra embedded fields
  // without redefining the full nested sub-schemas here.
  const UserSchema = new mongoose.Schema({
    name:         String,
    email:        { type: String, unique: true, sparse: true },
    phone:        { type: String, unique: true, sparse: true },
    passwordHash: String,
    role:         { type: String, enum: Object.values(Role) },
    storeId:      mongoose.Schema.Types.ObjectId,
    status:       { type: String, default: 'ACTIVE' },
  }, { timestamps: true });

  const StoreSchema = new mongoose.Schema({
    name:              String,
    ownerUserId:       mongoose.Schema.Types.ObjectId,
    phone:             String,
    status:            { type: String, default: StoreStatus.APPROVED },
    address:           Object,
    commissionPercent: Number,
    taxPercent:        Number,
    serviceArea:       Object,
    pickupSlots:       Object,
    sla:               Object,
    operatingHours:    Object,
  }, { timestamps: true, strict: false });

  const CategorySchema = new mongoose.Schema({
    name:        String,
    description: String,
    sortOrder:   { type: Number, default: 0 },
    enabled:     { type: Boolean, default: true },
  }, { timestamps: true });

  const ServiceSchema = new mongoose.Schema({
    categoryId:  mongoose.Schema.Types.ObjectId,
    name:        String,
    description: String,
    unit:        String,
    basePrice:   Number,
    taxPercent:  Number,
    enabled:     { type: Boolean, default: true },
    sortOrder:   { type: Number, default: 0 },
  }, { timestamps: true });

  const User     = mongoose.models['User']     ?? mongoose.model('User',     UserSchema);
  const Store    = mongoose.models['Store']    ?? mongoose.model('Store',    StoreSchema);
  const Category = mongoose.models['Category'] ?? mongoose.model('Category', CategorySchema);
  const Service  = mongoose.models['Service']  ?? mongoose.model('Service',  ServiceSchema);

  // ── Super admin ────────────────────────────────────────────
  await User.findOneAndUpdate(
    { email: 'superadmin@desiredrycleaning.in' },
    {
      name:         'Super Admin',
      email:        'superadmin@desiredrycleaning.in',
      passwordHash: await bcrypt.hash('Admin@123!', 12),
      role:         Role.SUPER_ADMIN,
      status:       'ACTIVE',
    },
    { upsert: true, new: true },
  );
  logger.info('Seed: super-admin upserted');

  // ── Demo store owner ───────────────────────────────────────
  const owner = await User.findOneAndUpdate(
    { email: 'owner@demo-store.in' },
    {
      name:         'Demo Store Owner',
      email:        'owner@demo-store.in',
      phone:        '+919999000001',
      passwordHash: await bcrypt.hash('Store@123!', 12),
      role:         Role.STORE_OWNER,
      status:       'ACTIVE',
    },
    { upsert: true, new: true },
  );

  // ── Demo store ─────────────────────────────────────────────
  const store = await Store.findOneAndUpdate(
    { name: 'Desire — Greater Noida West' },
    {
      name:              'Desire — Greater Noida West',
      ownerUserId:       owner._id,
      phone:             '+919118678519',
      status:            StoreStatus.APPROVED,
      commissionPercent: DEFAULT_COMMISSION_PERCENT,
      taxPercent:        DEFAULT_TAX_PERCENT,
      address: {
        line1:   'Plot 5, Sector 1, Gaur City 2',
        city:    'Greater Noida West',
        state:   'Uttar Pradesh',
        pincode: '201309',
        country: 'IN',
        lat:     28.6139,
        lng:     77.4291,
      },
      // Pincodes served by this store
      serviceArea: {
        pincodes: [
          '201301', '201302', '201303', '201304', '201305',
          '201306', '201307', '201308', '201309', '201310',
          '201318', '201320',
        ],
      },
      // Pickup time windows (24-h strings, capacity per slot)
      pickupSlots: {
        enabled:         true,
        leadTimeMinutes: 60,
        horizonDays:     7,
        windows: [
          {
            _id:        new mongoose.Types.ObjectId(),
            label:      'Early Morning (7–10 AM)',
            start:      '07:00',
            end:        '10:00',
            daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
            capacity:   15,
            enabled:    true,
          },
          {
            _id:        new mongoose.Types.ObjectId(),
            label:      'Midday (11 AM–2 PM)',
            start:      '11:00',
            end:        '14:00',
            daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
            capacity:   20,
            enabled:    true,
          },
          {
            _id:        new mongoose.Types.ObjectId(),
            label:      'Afternoon (3–6 PM)',
            start:      '15:00',
            end:        '18:00',
            daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
            capacity:   20,
            enabled:    true,
          },
          {
            _id:        new mongoose.Types.ObjectId(),
            label:      'Evening (6–9 PM)',
            start:      '18:00',
            end:        '21:00',
            daysOfWeek: [1, 2, 3, 4, 5, 6],   // Mon–Sat only
            capacity:   10,
            enabled:    true,
          },
        ],
      },
      // Turnaround time (48 h default; longer for delicate categories)
      sla: {
        defaultTatHours: 48,
        categoryOverrides: [], // filled below after categories are created
      },
      operatingHours: {
        monday:    { open: '07:00', close: '20:00', closed: false },
        tuesday:   { open: '07:00', close: '20:00', closed: false },
        wednesday: { open: '07:00', close: '20:00', closed: false },
        thursday:  { open: '07:00', close: '20:00', closed: false },
        friday:    { open: '07:00', close: '20:00', closed: false },
        saturday:  { open: '07:00', close: '20:00', closed: false },
        sunday:    { open: '08:00', close: '18:00', closed: false },
      },
    },
    { upsert: true, new: true },
  );

  await User.findByIdAndUpdate(owner._id, { storeId: store._id });
  logger.info({ storeId: store._id }, 'Seed: demo store upserted');

  // ── Demo rider ─────────────────────────────────────────────
  const rider = await User.findOneAndUpdate(
    { phone: '+919999000002' },
    {
      name:         'Demo Rider',
      phone:        '+919999000002',
      email:        'rider@demo-store.in',
      passwordHash: await bcrypt.hash('Rider@123!', 12),
      role:         Role.RIDER,
      storeId:      store._id,
      status:       'ACTIVE',
    },
    { upsert: true, new: true },
  );
  logger.info({ riderId: rider._id }, 'Seed: demo rider upserted');

  // ── Catalog — categories ───────────────────────────────────
  const categoryDefs = [
    { name: 'Shirts & Tops',       description: 'Formal shirts, casual tops, T-shirts',          sortOrder: 0 },
    { name: 'Trousers & Jeans',    description: 'Formal trousers, chinos, denim jeans',           sortOrder: 1 },
    { name: 'Suits & Formal Wear', description: '2-piece suits, 3-piece suits, blazers',          sortOrder: 2 },
    { name: 'Ethnic Wear',         description: 'Sarees, salwar kameez, lehengas, kurtas',        sortOrder: 3 },
    { name: 'Winter Wear',         description: 'Jackets, coats, sweaters, blankets, comforters', sortOrder: 4 },
    { name: 'Home Textiles',       description: 'Curtains, bed sheets, pillow covers, sofa covers', sortOrder: 5 },
    { name: 'Accessories & Leather', description: 'Leather jackets, bags, shoes, belts, ties',   sortOrder: 6 },
  ];

  const catDocs = await Promise.all(
    categoryDefs.map((c) =>
      Category.findOneAndUpdate({ name: c.name }, c, { upsert: true, new: true }),
    ),
  );

  const catMap: Record<string, mongoose.Types.ObjectId> = {};
  for (const doc of catDocs) {
    if (doc) catMap[doc.name] = doc._id as mongoose.Types.ObjectId;
  }

  // ── Catalog — services (33 total) ─────────────────────────
  // Prices in paise (₹1 = 100 paise). Reflect real Delhi-NCR premium dry-clean rates.
  const serviceDefs = [
    // ── Shirts & Tops ──────────────────────────────────────
    { cat: 'Shirts & Tops', name: 'Wash & Iron',    unit: ServiceUnit.PER_PIECE, price:  4900, desc: 'Machine wash + steam iron', sort: 0 },
    { cat: 'Shirts & Tops', name: 'Dry Clean',       unit: ServiceUnit.PER_PIECE, price: 12000, desc: 'Full dry-clean treatment',   sort: 1 },
    { cat: 'Shirts & Tops', name: 'Steam Press Only', unit: ServiceUnit.PER_PIECE, price:  3500, desc: 'Professional steam press',   sort: 2 },
    { cat: 'Shirts & Tops', name: 'Wash Only',       unit: ServiceUnit.PER_PIECE, price:  3000, desc: 'Wash without ironing',       sort: 3 },

    // ── Trousers & Jeans ───────────────────────────────────
    { cat: 'Trousers & Jeans', name: 'Wash & Iron',    unit: ServiceUnit.PER_PIECE, price:  5900, desc: 'Machine wash + crease press', sort: 0 },
    { cat: 'Trousers & Jeans', name: 'Dry Clean',       unit: ServiceUnit.PER_PIECE, price: 14900, desc: 'Full dry-clean treatment',    sort: 1 },
    { cat: 'Trousers & Jeans', name: 'Steam Press Only', unit: ServiceUnit.PER_PIECE, price:  4000, desc: 'Professional crease press',  sort: 2 },
    { cat: 'Trousers & Jeans', name: 'Wash Only',       unit: ServiceUnit.PER_PIECE, price:  3900, desc: 'Wash without ironing',        sort: 3 },

    // ── Suits & Formal Wear ────────────────────────────────
    { cat: 'Suits & Formal Wear', name: 'Dry Clean (2-piece)', unit: ServiceUnit.PER_PIECE, price: 39900, desc: 'Jacket + trouser dry clean', sort: 0 },
    { cat: 'Suits & Formal Wear', name: 'Dry Clean (3-piece)', unit: ServiceUnit.PER_PIECE, price: 54900, desc: 'Jacket + trouser + waistcoat', sort: 1 },
    { cat: 'Suits & Formal Wear', name: 'Blazer Dry Clean',    unit: ServiceUnit.PER_PIECE, price: 19900, desc: 'Single blazer / jacket',       sort: 2 },
    { cat: 'Suits & Formal Wear', name: 'Steam Press (per piece)', unit: ServiceUnit.PER_PIECE, price: 7900, desc: 'Light steam press for suits', sort: 3 },

    // ── Ethnic Wear ────────────────────────────────────────
    { cat: 'Ethnic Wear', name: 'Saree Dry Clean',       unit: ServiceUnit.PER_PIECE, price: 24900, desc: 'Including embroidery care',      sort: 0 },
    { cat: 'Ethnic Wear', name: 'Salwar Kameez',          unit: ServiceUnit.PER_PIECE, price: 19900, desc: '2-piece (kameez + salwar)',       sort: 1 },
    { cat: 'Ethnic Wear', name: 'Lehenga Dry Clean',      unit: ServiceUnit.PER_PIECE, price: 49900, desc: 'Lehenga + blouse + dupatta',      sort: 2 },
    { cat: 'Ethnic Wear', name: 'Kurta Pajama',           unit: ServiceUnit.PER_PIECE, price: 17900, desc: 'Kurta + pajama set',              sort: 3 },
    { cat: 'Ethnic Wear', name: 'Sherwani Dry Clean',     unit: ServiceUnit.PER_PIECE, price: 59900, desc: 'Heavy embroidery specialist care', sort: 4 },

    // ── Winter Wear ────────────────────────────────────────
    { cat: 'Winter Wear', name: 'Jacket Dry Clean',      unit: ServiceUnit.PER_PIECE, price: 34900, desc: 'Down, quilted or leather jacket', sort: 0 },
    { cat: 'Winter Wear', name: 'Blanket Wash (single)', unit: ServiceUnit.PER_PIECE, price: 39900, desc: 'Single-bed blanket deep clean',   sort: 1 },
    { cat: 'Winter Wear', name: 'Blanket Wash (double)', unit: ServiceUnit.PER_PIECE, price: 49900, desc: 'Double-bed blanket deep clean',   sort: 2 },
    { cat: 'Winter Wear', name: 'Sweater Dry Clean',     unit: ServiceUnit.PER_PIECE, price: 19900, desc: 'Woollen or cashmere sweater',     sort: 3 },
    { cat: 'Winter Wear', name: 'Comforter / Quilt Wash', unit: ServiceUnit.PER_PIECE, price: 59900, desc: 'Full comforter deep clean',       sort: 4 },

    // ── Home Textiles ──────────────────────────────────────
    { cat: 'Home Textiles', name: 'Curtain (per panel)',   unit: ServiceUnit.PER_PIECE, price: 15900, desc: 'Sheer, blackout or velvet panels', sort: 0 },
    { cat: 'Home Textiles', name: 'Bed Sheet (double)',     unit: ServiceUnit.PER_PIECE, price: 19900, desc: 'Double-bed flat or fitted sheet', sort: 1 },
    { cat: 'Home Textiles', name: 'Bed Sheet (single)',     unit: ServiceUnit.PER_PIECE, price: 12900, desc: 'Single-bed flat or fitted sheet', sort: 2 },
    { cat: 'Home Textiles', name: 'Pillow Cover (each)',    unit: ServiceUnit.PER_PIECE, price:  5900, desc: 'Standard pillow cover',          sort: 3 },
    { cat: 'Home Textiles', name: 'Sofa Cover (per seat)',  unit: ServiceUnit.PER_PIECE, price: 24900, desc: 'Removable sofa / chair cover',   sort: 4 },

    // ── Accessories & Leather ──────────────────────────────
    { cat: 'Accessories & Leather', name: 'Leather Jacket Clean', unit: ServiceUnit.PER_PIECE, price: 59900, desc: 'Clean, condition & restore',       sort: 0 },
    { cat: 'Accessories & Leather', name: 'Leather Bag Clean',    unit: ServiceUnit.PER_PIECE, price: 39900, desc: 'Handbag or messenger bag',          sort: 1 },
    { cat: 'Accessories & Leather', name: 'Shoes (per pair)',     unit: ServiceUnit.PER_PIECE, price: 29900, desc: 'Leather / suede / fabric shoes',   sort: 2 },
    { cat: 'Accessories & Leather', name: 'Belt Clean',           unit: ServiceUnit.PER_PIECE, price:  9900, desc: 'Leather or fabric belt',           sort: 3 },
    { cat: 'Accessories & Leather', name: 'Tie Dry Clean',        unit: ServiceUnit.PER_PIECE, price:  6900, desc: 'Silk, wool or polyester tie',      sort: 4 },
    { cat: 'Accessories & Leather', name: 'Scarf / Stole',        unit: ServiceUnit.PER_PIECE, price: 14900, desc: 'Silk, cotton or woollen scarf',    sort: 5 },
  ];

  await Promise.all(
    serviceDefs.map((s) => {
      const catId = catMap[s.cat];
      if (!catId) { logger.warn({ cat: s.cat }, 'Seed: category not found, skipping service'); return; }
      return Service.findOneAndUpdate(
        { categoryId: catId, name: s.name },
        {
          categoryId:  catId,
          name:        s.name,
          description: s.desc,
          unit:        s.unit,
          basePrice:   s.price,
          sortOrder:   s.sort,
          enabled:     true,
        },
        { upsert: true, new: true },
      );
    }),
  );

  // Back-fill SLA overrides now that we have category IDs
  const ethnicWearId    = catMap['Ethnic Wear'];
  const homeTextilesId  = catMap['Home Textiles'];
  const winterWearId    = catMap['Winter Wear'];
  const leatherCatId    = catMap['Accessories & Leather'];
  const slaOverrides = [
    ...(ethnicWearId   ? [{ categoryId: ethnicWearId,   tatHours: 72 }] : []),
    ...(homeTextilesId ? [{ categoryId: homeTextilesId, tatHours: 72 }] : []),
    ...(winterWearId   ? [{ categoryId: winterWearId,   tatHours: 72 }] : []),
    ...(leatherCatId   ? [{ categoryId: leatherCatId,   tatHours: 96 }] : []),
  ];
  await Store.findByIdAndUpdate(store._id, { 'sla.categoryOverrides': slaOverrides });

  logger.info('Seed: catalog upserted — 7 categories, 33 services');
  logger.info('─── Seed complete ───────────────────────────────────────');
  logger.info('Super admin : superadmin@desiredrycleaning.in / Admin@123!');
  logger.info('Store owner : owner@demo-store.in / Store@123!');
  logger.info('Demo rider  : +919999000002 / Rider@123! (phone login)');
  logger.info('─────────────────────────────────────────────────────────');

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  logger.error({ err }, 'Seed failed');
  process.exit(1);
});
