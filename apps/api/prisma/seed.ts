import {
  PrismaClient,
  Role,
  SellerStatus,
  ProductStatus,
  OrderStatus,
  PaymentStatus,
} from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // -------------------------------------------------------------
  // 1. Password Hashes (precalculated for fast execution)
  // -------------------------------------------------------------
  const adminPasswordHash = await bcrypt.hash('Admin123!', 10);
  const sellerPasswordHash = await bcrypt.hash('Seller123!', 10);
  const customerPasswordHash = await bcrypt.hash('Customer123!', 10);

  // -------------------------------------------------------------
  // 2. Users: 1 Admin, 4 Sellers, 8 Customers
  // -------------------------------------------------------------
  console.log('👤 Seeding users and sellers...');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {
      name: 'System Admin',
      role: Role.ADMIN,
      passwordHash: adminPasswordHash,
    },
    create: {
      email: 'admin@demo.com',
      name: 'System Admin',
      role: Role.ADMIN,
      passwordHash: adminPasswordHash,
    },
  });

  const sellerDefs = [
    {
      email: 'seller1@demo.com',
      name: 'TechHub Store',
      storeName: 'TechHub Official',
      status: SellerStatus.APPROVED,
    },
    {
      email: 'seller2@demo.com',
      name: 'SoundWave Audio',
      storeName: 'SoundWave Electronics',
      status: SellerStatus.APPROVED,
    },
    {
      email: 'seller3@demo.com',
      name: 'GamerForge Depot',
      storeName: 'GamerForge',
      status: SellerStatus.APPROVED,
    },
    {
      email: 'seller4@demo.com',
      name: 'Newbie Gadgets',
      storeName: 'Pending Gadgets',
      status: SellerStatus.PENDING,
    },
  ];

  const sellers: Array<{ id: string; userId: string; storeName: string; status: SellerStatus }> = [];

  for (const s of sellerDefs) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: {
        name: s.name,
        role: Role.SELLER,
        passwordHash: sellerPasswordHash,
      },
      create: {
        email: s.email,
        name: s.name,
        role: Role.SELLER,
        passwordHash: sellerPasswordHash,
      },
    });

    const seller = await prisma.seller.upsert({
      where: { userId: user.id },
      update: {
        storeName: s.storeName,
        status: s.status,
      },
      create: {
        userId: user.id,
        storeName: s.storeName,
        status: s.status,
      },
    });

    sellers.push(seller);
  }

  const customers: Array<{ id: string; email: string; name: string }> = [];
  for (let i = 1; i <= 8; i++) {
    const email = `customer${i}@demo.com`;
    const name = `Customer ${i}`;
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name,
        role: Role.CUSTOMER,
        passwordHash: customerPasswordHash,
      },
      create: {
        email,
        name,
        role: Role.CUSTOMER,
        passwordHash: customerPasswordHash,
      },
    });
    customers.push(user);
  }

  // -------------------------------------------------------------
  // 3. Categories (7 categories)
  // -------------------------------------------------------------
  console.log('📁 Seeding categories...');

  const categoryDefs = [
    { name: 'Tech', slug: 'tech' },
    { name: 'Audio', slug: 'audio' },
    { name: 'Phones', slug: 'phones' },
    { name: 'Laptops', slug: 'laptops' },
    { name: 'Wearables', slug: 'wearables' },
    { name: 'Gaming', slug: 'gaming' },
    { name: 'Smart Home', slug: 'smart-home' },
  ];

  const categories = new Map<string, string>();
  for (const cat of categoryDefs) {
    const record = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: { name: cat.name, slug: cat.slug },
    });
    categories.set(cat.slug, record.id);
  }

  // -------------------------------------------------------------
  // 4. Products (~50 products)
  // Exactly:
  // - 3 out-of-stock (stock: 0)
  // - 3 low-stock (stock: 2, 3, 2 <= 3)
  // - 1 stock exactly 1 (for concurrency testing)
  // - 1 DRAFT product
  // - Near-duplicate titles: "Gaming Mouse" vs "Gaming Mouse Pro"
  // - placehold.co images
  // -------------------------------------------------------------
  console.log('📦 Seeding products...');

  const approvedSellers = sellers.filter((s) => s.status === SellerStatus.APPROVED);

  const productDefs = [
    // Tech (8 products)
    {
      sku: 'SKU-TECH-001',
      title: 'Vintage Mechanical Keyboard',
      categorySlug: 'tech',
      priceCents: 8999,
      stock: 0, // Out of stock #1
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: 'Classic tactile mechanical keyboard with custom switches and vintage grey keycaps.',
    },
    {
      sku: 'SKU-TECH-002',
      title: 'USB-C Multiport Dock 10-in-1',
      categorySlug: 'tech',
      priceCents: 4999,
      stock: 45,
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: 'All-in-one USB-C hub with 4K HDMI, Gigabit Ethernet, SD card reader, and 100W PD passthrough.',
    },
    {
      sku: 'SKU-TECH-003',
      title: 'Ultra-Fast NVMe SSD 1TB',
      categorySlug: 'tech',
      priceCents: 10999,
      stock: 30,
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: 'PCIe Gen 4.0 NVMe M.2 internal solid state drive with up to 7000MB/s read speeds.',
    },
    {
      sku: 'SKU-TECH-004',
      title: '4K Webcam with Dual Mics',
      categorySlug: 'tech',
      priceCents: 7999,
      stock: 25,
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: 'Ultra HD streaming and conference webcam with privacy shutter and AI autofocus.',
    },
    {
      sku: 'SKU-TECH-005',
      title: 'Wireless Charging Pad 15W',
      categorySlug: 'tech',
      priceCents: 2499,
      stock: 80,
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: 'Fast Qi wireless charger with aluminum base and non-slip rubber grip.',
    },
    {
      sku: 'SKU-TECH-006',
      title: 'Ergonomic Vertical Mouse',
      categorySlug: 'tech',
      priceCents: 3499,
      stock: 50,
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: 'Natural handshake angle mouse designed to reduce forearm twist and wrist strain.',
    },
    {
      sku: 'SKU-TECH-007',
      title: 'High-Speed HDMI 2.1 Cable 2m',
      categorySlug: 'tech',
      priceCents: 1499,
      stock: 120,
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: 'Braided nylon 48Gbps ultra high speed cable supporting 8K 60Hz and 4K 120Hz.',
    },
    {
      sku: 'SKU-TECH-008',
      title: 'Thunderbolt 4 Extension Hub',
      categorySlug: 'tech',
      priceCents: 12999,
      stock: 20,
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: 'Certified 40Gbps Thunderbolt 4 expansion dock with dual display support.',
    },

    // Audio (7 products)
    {
      sku: 'SKU-AUD-001',
      title: 'Noise-Cancelling Studio Headphones',
      categorySlug: 'audio',
      priceCents: 19999,
      stock: 0, // Out of stock #2
      status: ProductStatus.ACTIVE,
      sellerIdx: 1,
      description: 'Over-ear wireless headphones with industry-leading hybrid active noise cancellation.',
    },
    {
      sku: 'SKU-AUD-002',
      title: 'Ultra Bass Wireless Earbuds',
      categorySlug: 'audio',
      priceCents: 5999,
      stock: 2, // Low-stock #1 (<= 3)
      status: ProductStatus.ACTIVE,
      sellerIdx: 1,
      description: 'True wireless in-ear headphones with deep punchy bass, IPX7 water resistance.',
    },
    {
      sku: 'SKU-AUD-003',
      title: 'Portable Waterproof Bluetooth Speaker',
      categorySlug: 'audio',
      priceCents: 4499,
      stock: 60,
      status: ProductStatus.ACTIVE,
      sellerIdx: 1,
      description: 'Rugged outdoor speaker delivering 360-degree room-filling acoustic sound.',
    },
    {
      sku: 'SKU-AUD-004',
      title: 'Desktop Hi-Fi DAC & Amp',
      categorySlug: 'audio',
      priceCents: 14999,
      stock: 15,
      status: ProductStatus.ACTIVE,
      sellerIdx: 1,
      description: 'High-resolution audio decoder supporting 32-bit/768kHz PCM with balanced outputs.',
    },
    {
      sku: 'SKU-AUD-005',
      title: 'Condenser Streaming Microphone',
      categorySlug: 'audio',
      priceCents: 8999,
      stock: 40,
      status: ProductStatus.ACTIVE,
      sellerIdx: 1,
      description: 'Cardioid studio capsule microphone with tap-to-mute sensor and gain control.',
    },
    {
      sku: 'SKU-AUD-006',
      title: 'True Wireless Sports Earphones',
      categorySlug: 'audio',
      priceCents: 3999,
      stock: 75,
      status: ProductStatus.ACTIVE,
      sellerIdx: 1,
      description: 'Secure-fit ear hooks with sweat-proof nano coating and 30-hour battery life.',
    },
    {
      sku: 'SKU-AUD-007',
      title: 'Over-Ear Open-Back Reference Cans',
      categorySlug: 'audio',
      priceCents: 24999,
      stock: 18,
      status: ProductStatus.ACTIVE,
      sellerIdx: 1,
      description: 'Audiophile grade open-back planar magnetic headphones for mixing and mastering.',
    },

    // Phones (7 products)
    {
      sku: 'SKU-PHN-001',
      title: 'Foldable Smartphone X Ultra',
      categorySlug: 'phones',
      priceCents: 139999,
      stock: 0, // Out of stock #3
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: 'Next-generation folding display with seamless hinge and flagship triple camera.',
    },
    {
      sku: 'SKU-PHN-002',
      title: 'Flagship 5G Smartphone 256GB',
      categorySlug: 'phones',
      priceCents: 89999,
      stock: 35,
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: '6.7-inch AMOLED 120Hz display with cutting-edge processor and all-day battery.',
    },
    {
      sku: 'SKU-PHN-003',
      title: 'Compact Mid-Range Smartphone',
      categorySlug: 'phones',
      priceCents: 39999,
      stock: 50,
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: 'Lightweight, pocketable phone with sharp camera and clean operating system.',
    },
    {
      sku: 'SKU-PHN-004',
      title: 'Rugged Outdoor Phone Waterproof',
      categorySlug: 'phones',
      priceCents: 49999,
      stock: 22,
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: 'MIL-STD-810H shockproof and IP68 waterproof phone built for extreme environments.',
    },
    {
      sku: 'SKU-PHN-005',
      title: 'MagSafe Silicone Phone Case',
      categorySlug: 'phones',
      priceCents: 1999,
      stock: 150,
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: 'Soft-touch liquid silicone protective case with integrated magnetic alignment ring.',
    },
    {
      sku: 'SKU-PHN-006',
      title: 'Tempered Glass Screen Protector 2-Pack',
      categorySlug: 'phones',
      priceCents: 1199,
      stock: 200,
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: '9H hardness scratch-resistant tempered glass with oleophobic anti-fingerprint coating.',
    },
    {
      sku: 'SKU-PHN-007',
      title: 'Fast GaN Wall Charger 65W',
      categorySlug: 'phones',
      priceCents: 2999,
      stock: 90,
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: 'Compact gallium nitride charger with dual USB-C ports and folding prongs.',
    },

    // Laptops (7 products)
    {
      sku: 'SKU-LAP-001',
      title: 'Limited Edition Cyberpunk Laptop 16-inch',
      categorySlug: 'laptops',
      priceCents: 249999,
      stock: 1, // Concurrency testing: stock exactly 1!
      status: ProductStatus.ACTIVE,
      sellerIdx: 2,
      description: 'High-performance bespoke gaming laptop featuring custom laser engraving and RTX GPU.',
    },
    {
      sku: 'SKU-LAP-002',
      title: 'Ultra-Thin Carbon Laptop 14-inch',
      categorySlug: 'laptops',
      priceCents: 119999,
      stock: 25,
      status: ProductStatus.ACTIVE,
      sellerIdx: 2,
      description: 'Carbon fiber chassis ultrabook weighing just 1kg with 18-hour battery longevity.',
    },
    {
      sku: 'SKU-LAP-003',
      title: 'Creator Studio Laptop 32GB OLED',
      categorySlug: 'laptops',
      priceCents: 189999,
      stock: 14,
      status: ProductStatus.ACTIVE,
      sellerIdx: 2,
      description: 'Calibrated 4K OLED touch display tailored for color grading, 3D rendering, and video editing.',
    },
    {
      sku: 'SKU-LAP-004',
      title: 'Business Notebook 15-inch i7',
      categorySlug: 'laptops',
      priceCents: 84999,
      stock: 40,
      status: ProductStatus.ACTIVE,
      sellerIdx: 2,
      description: 'Dependable workstation with hardware TPM security, fingerprint scanner, and backlit keyboard.',
    },
    {
      sku: 'SKU-LAP-005',
      title: 'Aluminum Laptop Stand Riser',
      categorySlug: 'laptops',
      priceCents: 3499,
      stock: 65,
      status: ProductStatus.ACTIVE,
      sellerIdx: 2,
      description: 'Ergonomic ventilated laptop elevator made from CNC sandblasted aircraft-grade alloy.',
    },
    {
      sku: 'SKU-LAP-006',
      title: 'Water-Resistant Laptop Sleeve 15-inch',
      categorySlug: 'laptops',
      priceCents: 2299,
      stock: 85,
      status: ProductStatus.ACTIVE,
      sellerIdx: 2,
      description: 'Fleece-lined padded protective travel sleeve with accessory zipper pocket.',
    },
    {
      sku: 'SKU-LAP-007',
      title: 'Mechanical Numpad Bluetooth',
      categorySlug: 'laptops',
      priceCents: 2799,
      stock: 40,
      status: ProductStatus.ACTIVE,
      sellerIdx: 2,
      description: 'Wireless numeric keypad with hot-swappable switches for accounting and data entry.',
    },

    // Wearables (7 products)
    {
      sku: 'SKU-WEAR-001',
      title: 'Unreleased Smart Ring Prototype',
      categorySlug: 'wearables',
      priceCents: 17999,
      stock: 10,
      status: ProductStatus.DRAFT, // Exactly 1 DRAFT product!
      sellerIdx: 0,
      description: 'Experimental titanium ring sensor tracking heart rate variability and sleep architecture.',
    },
    {
      sku: 'SKU-WEAR-002',
      title: 'Fitness Tracker Band HR + GPS',
      categorySlug: 'wearables',
      priceCents: 4999,
      stock: 70,
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: 'Lightweight smart fitness bracelet with continuous SpO2 and automatic workout tracking.',
    },
    {
      sku: 'SKU-WEAR-003',
      title: 'Premium Titanium Smartwatch',
      categorySlug: 'wearables',
      priceCents: 34999,
      stock: 28,
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: 'Sapphire crystal glass smartwatch with ECG sensor, cellular connectivity, and offline maps.',
    },
    {
      sku: 'SKU-WEAR-004',
      title: 'Hybrid Analogue Smartwatch',
      categorySlug: 'wearables',
      priceCents: 15999,
      stock: 35,
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: 'Mechanical hands paired with hidden e-ink subdial for subtle notifications.',
    },
    {
      sku: 'SKU-WEAR-005',
      title: 'Breathable Nylon Watch Band',
      categorySlug: 'wearables',
      priceCents: 1499,
      stock: 110,
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: 'Quick-release hook-and-loop woven nylon strap compatible with 20mm and 22mm lugs.',
    },
    {
      sku: 'SKU-WEAR-006',
      title: 'Smart Sleep & Recovery Mask',
      categorySlug: 'wearables',
      priceCents: 7999,
      stock: 45,
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: 'Blackout eye mask with integrated bone-conduction audio and soothing white noise.',
    },
    {
      sku: 'SKU-WEAR-007',
      title: 'Heart Rate Monitor Chest Strap',
      categorySlug: 'wearables',
      priceCents: 5499,
      stock: 55,
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: 'Dual ANT+ and Bluetooth chest sensor for medical-grade ECG workout telemetry.',
    },

    // Gaming (7 products)
    {
      sku: 'SKU-GAM-001',
      title: 'VR Headset Elite 4K 120Hz',
      categorySlug: 'gaming',
      priceCents: 59999,
      stock: 3, // Low-stock #2 (<= 3)
      status: ProductStatus.ACTIVE,
      sellerIdx: 2,
      description: 'Standalone virtual reality headset with inside-out tracking and pancake optics.',
    },
    {
      sku: 'SKU-GAM-002',
      title: 'Gaming Mouse', // Near-duplicate 1
      categorySlug: 'gaming',
      priceCents: 4999,
      stock: 60,
      status: ProductStatus.ACTIVE,
      sellerIdx: 2,
      description: 'Ergonomic optical gaming mouse with 16000 DPI sensor and lightweight braided cable.',
    },
    {
      sku: 'SKU-GAM-003',
      title: 'Gaming Mouse Pro', // Near-duplicate 2
      categorySlug: 'gaming',
      priceCents: 7999,
      stock: 45,
      status: ProductStatus.ACTIVE,
      sellerIdx: 2,
      description: 'Wireless esport tournament grade gaming mouse with ultra-lightweight 58g honeycomb shell.',
    },
    {
      sku: 'SKU-GAM-004',
      title: 'RGB Mechanical Gaming Keyboard',
      categorySlug: 'gaming',
      priceCents: 12999,
      stock: 35,
      status: ProductStatus.ACTIVE,
      sellerIdx: 2,
      description: 'Linear speed switches, per-key RGB illumination, and magnetic memory foam wrist rest.',
    },
    {
      sku: 'SKU-GAM-005',
      title: 'Surround Sound Gaming Headset',
      categorySlug: 'gaming',
      priceCents: 8999,
      stock: 50,
      status: ProductStatus.ACTIVE,
      sellerIdx: 2,
      description: 'Spatial audio headset with 50mm neodymium drivers and broadcast-quality flip mic.',
    },
    {
      sku: 'SKU-GAM-006',
      title: 'XL Anti-Fray Cloth Gaming Mousepad',
      categorySlug: 'gaming',
      priceCents: 1999,
      stock: 130,
      status: ProductStatus.ACTIVE,
      sellerIdx: 2,
      description: 'Desk-sized micro-textured cloth mat with non-slip natural rubber base.',
    },
    {
      sku: 'SKU-GAM-007',
      title: 'Wireless Low-Latency Game Controller',
      categorySlug: 'gaming',
      priceCents: 6499,
      stock: 40,
      status: ProductStatus.ACTIVE,
      sellerIdx: 2,
      description: 'Hall effect magnetic triggers and joysticks with zero stick drift and remappable paddles.',
    },

    // Smart Home (7 products)
    {
      sku: 'SKU-SMH-001',
      title: 'Smart Thermostat Hub Wireless',
      categorySlug: 'smart-home',
      priceCents: 12999,
      stock: 2, // Low-stock #3 (<= 3)
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: 'Adaptive climate control thermostat with remote temperature sensors and energy reports.',
    },
    {
      sku: 'SKU-SMH-002',
      title: 'Color LED Smart Bulb 4-Pack',
      categorySlug: 'smart-home',
      priceCents: 3999,
      stock: 95,
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: '16 million color RGB+W bulbs compatible with voice assistants and scheduled scenes.',
    },
    {
      sku: 'SKU-SMH-003',
      title: 'Video Doorbell with Chime 2K',
      categorySlug: 'smart-home',
      priceCents: 9999,
      stock: 30,
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: 'Head-to-toe 2K HDR video doorbell with PIR motion detection and two-way audio talk.',
    },
    {
      sku: 'SKU-SMH-004',
      title: 'Smart Plug Wi-Fi Energy Monitor 2-Pack',
      categorySlug: 'smart-home',
      priceCents: 2199,
      stock: 140,
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: 'Compact 15A smart outlet timer with real-time power consumption monitoring in watts.',
    },
    {
      sku: 'SKU-SMH-005',
      title: 'Indoor Security Camera Pan & Tilt',
      categorySlug: 'smart-home',
      priceCents: 4599,
      stock: 60,
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: '360-degree motorized pan-and-tilt security camera with infrared night vision up to 10m.',
    },
    {
      sku: 'SKU-SMH-006',
      title: 'Smart Keyless Deadbolt Lock',
      categorySlug: 'smart-home',
      priceCents: 16999,
      stock: 25,
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: 'Biometric fingerprint, PIN touchscreen keypad, and smartphone auto-unlock door lock.',
    },
    {
      sku: 'SKU-SMH-007',
      title: 'Air Quality & CO2 Sensor Monitor',
      categorySlug: 'smart-home',
      priceCents: 6999,
      stock: 38,
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: 'Real-time air sensor measuring particulate PM2.5, volatile organic compounds, and humidity.',
    },
  ];

  const seededProducts: Array<{
    id: string;
    sku: string;
    title: string;
    sellerId: string;
    sellerUserId: string;
    priceCents: number;
    stock: number;
    status: ProductStatus;
  }> = [];

  for (const p of productDefs) {
    const categoryId = categories.get(p.categorySlug)!;
    const seller = approvedSellers[p.sellerIdx % approvedSellers.length];

    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        sellerId: seller.id,
        categoryId,
        title: p.title,
        description: p.description,
        priceCents: p.priceCents,
        currency: 'USD',
        stock: p.stock,
        status: p.status,
      },
      create: {
        sku: p.sku,
        sellerId: seller.id,
        categoryId,
        title: p.title,
        description: p.description,
        priceCents: p.priceCents,
        currency: 'USD',
        stock: p.stock,
        status: p.status,
      },
    });

    // Idempotent image creation: clear existing images for this product, then create
    await prisma.productImage.deleteMany({
      where: { productId: product.id },
    });

    const imageUrl = `https://placehold.co/600x400/png?text=${encodeURIComponent(p.title)}`;
    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: imageUrl,
        sortOrder: 0,
      },
    });

    seededProducts.push({
      id: product.id,
      sku: product.sku,
      title: product.title,
      sellerId: product.sellerId,
      sellerUserId: seller.userId,
      priceCents: product.priceCents,
      stock: product.stock,
      status: product.status,
    });
  }

  // -------------------------------------------------------------
  // 5. Clean up existing seeded orders & notifications
  // -------------------------------------------------------------
  console.log('🧹 Cleaning existing seeded orders & notifications...');

  // Notifications for demo users
  await prisma.notification.deleteMany({
    where: {
      OR: [
        { type: { startsWith: 'ORDER_' } },
        { user: { email: { contains: '@demo.com' } } },
      ],
    },
  });

  // Cascade delete on Order handles OrderItem, Payment, and OrderStatusHistory
  await prisma.order.deleteMany({
    where: {
      idempotencyKey: {
        startsWith: 'seed-order-',
      },
    },
  });

  // -------------------------------------------------------------
  // 6. Orders (~20 orders over last 60 days)
  // Include every OrderStatus:
  // PENDING, PAID, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED
  // Include 1 CANCELLED with Payment.FAILED
  // Include 1 multi-seller order
  // Create OrderItems, Payments, OrderStatusHistories, Notifications
  // -------------------------------------------------------------
  console.log('🛒 Seeding orders, order items, payments, histories & notifications...');

  const activeProducts = seededProducts.filter((p) => p.status === ProductStatus.ACTIVE && p.stock > 0);
  const now = new Date();

  // Define 20 order configurations with varied statuses across the last 60 days
  const orderConfigs: Array<{
    daysAgo: number;
    status: OrderStatus;
    customerIdx: number;
    paymentStatus: PaymentStatus;
    isMultiSeller?: boolean;
    productIndices: number[];
  }> = [
    { daysAgo: 58, status: OrderStatus.DELIVERED, customerIdx: 0, paymentStatus: PaymentStatus.COMPLETED, productIndices: [1, 2] },
    { daysAgo: 54, status: OrderStatus.DELIVERED, customerIdx: 1, paymentStatus: PaymentStatus.COMPLETED, productIndices: [3] },
    { daysAgo: 50, status: OrderStatus.DELIVERED, customerIdx: 2, paymentStatus: PaymentStatus.COMPLETED, productIndices: [4, 5] },
    { daysAgo: 47, status: OrderStatus.DELIVERED, customerIdx: 3, paymentStatus: PaymentStatus.COMPLETED, productIndices: [6] },
    { daysAgo: 44, status: OrderStatus.DELIVERED, customerIdx: 4, paymentStatus: PaymentStatus.COMPLETED, productIndices: [7, 8] },
    { daysAgo: 40, status: OrderStatus.REFUNDED, customerIdx: 5, paymentStatus: PaymentStatus.REFUNDED, productIndices: [9] },
    // Order 7: CANCELLED with Payment.FAILED (Explicit requirement)
    { daysAgo: 36, status: OrderStatus.CANCELLED, customerIdx: 6, paymentStatus: PaymentStatus.FAILED, productIndices: [10] },
    { daysAgo: 33, status: OrderStatus.DELIVERED, customerIdx: 7, paymentStatus: PaymentStatus.COMPLETED, productIndices: [11, 12] },
    { daysAgo: 30, status: OrderStatus.DELIVERED, customerIdx: 0, paymentStatus: PaymentStatus.COMPLETED, productIndices: [13] },
    { daysAgo: 27, status: OrderStatus.SHIPPED, customerIdx: 1, paymentStatus: PaymentStatus.COMPLETED, productIndices: [14, 15] },
    { daysAgo: 24, status: OrderStatus.SHIPPED, customerIdx: 2, paymentStatus: PaymentStatus.COMPLETED, productIndices: [16] },
    { daysAgo: 21, status: OrderStatus.SHIPPED, customerIdx: 3, paymentStatus: PaymentStatus.COMPLETED, productIndices: [17, 18] },
    { daysAgo: 18, status: OrderStatus.PROCESSING, customerIdx: 4, paymentStatus: PaymentStatus.COMPLETED, productIndices: [19] },
    { daysAgo: 15, status: OrderStatus.PROCESSING, customerIdx: 5, paymentStatus: PaymentStatus.COMPLETED, productIndices: [20, 21] },
    // Order 15: Multi-seller order (Explicit requirement)
    { daysAgo: 13, status: OrderStatus.PROCESSING, customerIdx: 6, paymentStatus: PaymentStatus.COMPLETED, isMultiSeller: true, productIndices: [] },
    { daysAgo: 10, status: OrderStatus.PAID, customerIdx: 7, paymentStatus: PaymentStatus.COMPLETED, productIndices: [22] },
    { daysAgo: 7, status: OrderStatus.PAID, customerIdx: 0, paymentStatus: PaymentStatus.COMPLETED, productIndices: [23, 24] },
    { daysAgo: 5, status: OrderStatus.PENDING, customerIdx: 1, paymentStatus: PaymentStatus.PENDING, productIndices: [25] },
    { daysAgo: 2, status: OrderStatus.PENDING, customerIdx: 2, paymentStatus: PaymentStatus.PENDING, productIndices: [26, 27] },
    { daysAgo: 1, status: OrderStatus.DELIVERED, customerIdx: 3, paymentStatus: PaymentStatus.COMPLETED, productIndices: [28] },
  ];

  for (let idx = 0; idx < orderConfigs.length; idx++) {
    const cfg = orderConfigs[idx];
    const orderNum = idx + 1;
    const customer = customers[cfg.customerIdx % customers.length];
    const createdAt = new Date(now.getTime() - cfg.daysAgo * 24 * 60 * 60 * 1000);
    const paidAt =
      cfg.paymentStatus === PaymentStatus.COMPLETED || cfg.paymentStatus === PaymentStatus.REFUNDED
        ? new Date(createdAt.getTime() + 5 * 60 * 1000)
        : null;

    // Pick items for this order
    let chosenProducts: Array<{ id: string; sellerId: string; sellerUserId: string; priceCents: number; quantity: number }> = [];

    if (cfg.isMultiSeller) {
      // Find two active products from distinct sellers
      const p1 = activeProducts.find((p) => p.sellerId === approvedSellers[0].id) || activeProducts[0];
      const p2 = activeProducts.find((p) => p.sellerId === approvedSellers[1].id) || activeProducts[1];
      chosenProducts = [
        { id: p1.id, sellerId: p1.sellerId, sellerUserId: p1.sellerUserId, priceCents: p1.priceCents, quantity: 1 },
        { id: p2.id, sellerId: p2.sellerId, sellerUserId: p2.sellerUserId, priceCents: p2.priceCents, quantity: 2 },
      ];
    } else {
      chosenProducts = cfg.productIndices.map((pIdx) => {
        const prod = activeProducts[pIdx % activeProducts.length];
        return {
          id: prod.id,
          sellerId: prod.sellerId,
          sellerUserId: prod.sellerUserId,
          priceCents: prod.priceCents,
          quantity: 1,
        };
      });
    }

    const totalCents = chosenProducts.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);

    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        status: cfg.status,
        totalCents,
        currency: 'USD',
        idempotencyKey: `seed-order-${orderNum}`,
        shippingName: customer.name,
        shippingLine1: `${100 + orderNum} Market Street`,
        shippingCity: 'San Francisco',
        shippingCountry: 'USA',
        paidAt,
        createdAt,
        updatedAt: createdAt,
      },
    });

    // 1. Order Items
    for (const item of chosenProducts) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.id,
          sellerId: item.sellerId,
          quantity: item.quantity,
          unitPriceCents: item.priceCents,
        },
      });
    }

    // 2. Payment
    await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: 'stripe',
        providerRef: `seed-pay-${orderNum}`,
        amountCents: totalCents,
        currency: 'USD',
        status: cfg.paymentStatus,
        createdAt,
        updatedAt: createdAt,
      },
    });

    // 3. Order Status History audit trail
    // All orders start at PENDING
    await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        fromStatus: null,
        toStatus: OrderStatus.PENDING,
        changedByUserId: customer.id,
        createdAt,
      },
    });

    if (cfg.status === OrderStatus.PAID) {
      await prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: OrderStatus.PENDING,
          toStatus: OrderStatus.PAID,
          changedByUserId: customer.id,
          createdAt: new Date(createdAt.getTime() + 5 * 60 * 1000),
        },
      });
    } else if (cfg.status === OrderStatus.PROCESSING) {
      await prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: OrderStatus.PENDING,
          toStatus: OrderStatus.PAID,
          changedByUserId: customer.id,
          createdAt: new Date(createdAt.getTime() + 5 * 60 * 1000),
        },
      });
      await prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: OrderStatus.PAID,
          toStatus: OrderStatus.PROCESSING,
          changedByUserId: chosenProducts[0].sellerUserId,
          createdAt: new Date(createdAt.getTime() + 60 * 60 * 1000),
        },
      });
    } else if (cfg.status === OrderStatus.SHIPPED) {
      await prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: OrderStatus.PENDING,
          toStatus: OrderStatus.PAID,
          changedByUserId: customer.id,
          createdAt: new Date(createdAt.getTime() + 5 * 60 * 1000),
        },
      });
      await prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: OrderStatus.PAID,
          toStatus: OrderStatus.PROCESSING,
          changedByUserId: chosenProducts[0].sellerUserId,
          createdAt: new Date(createdAt.getTime() + 60 * 60 * 1000),
        },
      });
      await prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: OrderStatus.PROCESSING,
          toStatus: OrderStatus.SHIPPED,
          changedByUserId: chosenProducts[0].sellerUserId,
          createdAt: new Date(createdAt.getTime() + 24 * 60 * 60 * 1000),
        },
      });
    } else if (cfg.status === OrderStatus.DELIVERED) {
      await prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: OrderStatus.PENDING,
          toStatus: OrderStatus.PAID,
          changedByUserId: customer.id,
          createdAt: new Date(createdAt.getTime() + 5 * 60 * 1000),
        },
      });
      await prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: OrderStatus.PAID,
          toStatus: OrderStatus.PROCESSING,
          changedByUserId: chosenProducts[0].sellerUserId,
          createdAt: new Date(createdAt.getTime() + 60 * 60 * 1000),
        },
      });
      await prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: OrderStatus.PROCESSING,
          toStatus: OrderStatus.SHIPPED,
          changedByUserId: chosenProducts[0].sellerUserId,
          createdAt: new Date(createdAt.getTime() + 24 * 60 * 60 * 1000),
        },
      });
      await prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: OrderStatus.SHIPPED,
          toStatus: OrderStatus.DELIVERED,
          changedByUserId: chosenProducts[0].sellerUserId,
          createdAt: new Date(createdAt.getTime() + 72 * 60 * 60 * 1000),
        },
      });
    } else if (cfg.status === OrderStatus.CANCELLED) {
      await prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: OrderStatus.PENDING,
          toStatus: OrderStatus.CANCELLED,
          changedByUserId: customer.id,
          createdAt: new Date(createdAt.getTime() + 10 * 60 * 1000),
        },
      });
    } else if (cfg.status === OrderStatus.REFUNDED) {
      await prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: OrderStatus.PENDING,
          toStatus: OrderStatus.PAID,
          changedByUserId: customer.id,
          createdAt: new Date(createdAt.getTime() + 5 * 60 * 1000),
        },
      });
      await prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: OrderStatus.PAID,
          toStatus: OrderStatus.REFUNDED,
          changedByUserId: admin.id,
          createdAt: new Date(createdAt.getTime() + 48 * 60 * 60 * 1000),
        },
      });
    }

    // 4. Notifications
    const readAt = cfg.daysAgo > 7 ? new Date(createdAt.getTime() + 2 * 60 * 60 * 1000) : null;
    await prisma.notification.create({
      data: {
        userId: customer.id,
        type: `ORDER_${cfg.status}`,
        payload: {
          orderId: order.id,
          status: cfg.status,
          totalCents: order.totalCents,
          seedTag: 'seed',
        },
        readAt,
        createdAt,
      },
    });
  }

  console.log('✅ Seeding completed successfully!');
  console.log(`   - 1 Admin, 4 Sellers, 8 Customers`);
  console.log(`   - 7 Categories`);
  console.log(`   - ${productDefs.length} Products`);
  console.log(`   - ${orderConfigs.length} Orders across all OrderStatuses`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
