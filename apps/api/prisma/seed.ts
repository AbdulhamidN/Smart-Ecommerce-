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
  console.log('🌱 Starting database seed with GibeMart ETB data...');

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
      name: 'Abyssinia Tech & Trade',
      storeName: 'Abyssinia Official',
      status: SellerStatus.APPROVED,
    },
    {
      email: 'seller2@demo.com',
      name: 'Addis Artisan Crafts',
      storeName: 'Addis Heritage & Coffee',
      status: SellerStatus.APPROVED,
    },
    {
      email: 'seller3@demo.com',
      name: 'Sheger Gamer & Electronics',
      storeName: 'Sheger Hub',
      status: SellerStatus.APPROVED,
    },
    {
      email: 'seller4@demo.com',
      name: 'Entoto Modern Gadgets',
      storeName: 'Entoto Gadgets',
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
  const customerNames = [
    'Abebe Bikila',
    'Tirunesh Dibaba',
    'Haile Gebrselassie',
    'Derartu Tulu',
    'Kenenisa Bekele',
    'Meseret Defar',
    'Almaz Ayana',
    'Selemon Barega',
  ];

  for (let i = 1; i <= 8; i++) {
    const email = `customer${i}@demo.com`;
    const name = customerNames[i - 1] || `Customer ${i}`;
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
  // 3. Categories (Ethiopian specialties + Modern Tech)
  // -------------------------------------------------------------
  console.log('📁 Seeding categories...');

  const categoryDefs = [
    { name: 'Coffee & Spices', slug: 'coffee-spices' },
    { name: 'Traditional & Heritage', slug: 'traditional-heritage' },
    { name: 'Tech & Electronics', slug: 'tech' },
    { name: 'Audio & Sound', slug: 'audio' },
    { name: 'Phones & Accessories', slug: 'phones' },
    { name: 'Computers & Laptops', slug: 'laptops' },
    { name: 'Wearables & Fitness', slug: 'wearables' },
    { name: 'Gaming & Setup', slug: 'gaming' },
    { name: 'Smart Home & Living', slug: 'smart-home' },
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
  // 4. Products (~40 products with realistic Ethiopian context)
  // Exactly:
  // - 3 out-of-stock (stock: 0)
  // - 3 low-stock (stock: 2, 3, 2 <= 3)
  // - 1 stock exactly 1 (SKU-LAP-001 for concurrency testing)
  // - 1 DRAFT product
  // - Near-duplicate titles: "Gaming Mouse" vs "Gaming Mouse Pro"
  // - High quality real Unsplash image URLs
  // - Currency: "ETB" and priceCents multiplied by 150
  // -------------------------------------------------------------
  console.log('📦 Seeding products with ETB and Unsplash photos...');

  const approvedSellers = sellers.filter((s) => s.status === SellerStatus.APPROVED);

  const productDefs = [
    // --- Ethiopian Specialty & Heritage Products (New & Contextual) ---
    {
      sku: 'SKU-ETH-COF-001',
      title: 'Ethiopian Yirgacheffe Specialty Coffee Beans (1kg)',
      categorySlug: 'coffee-spices',
      priceCents: 1250 * 150, // ETB 1,875.00
      stock: 50,
      status: ProductStatus.ACTIVE,
      sellerIdx: 1,
      description: 'Single-origin washed grade 1 arabica beans known for floral aroma, bright citrus acidity, and rich jasmine notes.',
      imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'SKU-ETH-COF-002',
      title: 'Harar Sun-Dried Wild Coffee (Dark Roast, 500g)',
      categorySlug: 'coffee-spices',
      priceCents: 980 * 150, // ETB 1,470.00
      stock: 40,
      status: ProductStatus.ACTIVE,
      sellerIdx: 1,
      description: 'Authentic heirloom sun-dried Ethiopian coffee with intense mocha and dark berry undertones.',
      imageUrl: 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'SKU-ETH-JEB-001',
      title: 'Traditional Handcrafted Clay Jebena Coffee Pot',
      categorySlug: 'traditional-heritage',
      priceCents: 1100 * 150, // ETB 1,650.00
      stock: 25,
      status: ProductStatus.ACTIVE,
      sellerIdx: 1,
      description: 'Masterfully shaped clay Jebena pot with ornate engravings, made for genuine Ethiopian Buna coffee ceremonies.',
      imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'SKU-ETH-KEM-001',
      title: 'Handwoven Habesha Kemis Dress with Tibeb Embroidery',
      categorySlug: 'traditional-heritage',
      priceCents: 4800 * 150, // ETB 7,200.00
      stock: 12,
      status: ProductStatus.ACTIVE,
      sellerIdx: 1,
      description: 'Exquisite 100% Ethiopian organic cotton dress featuring intricate colorful Tibeb border hand-embroidery.',
      imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'SKU-ETH-LEA-001',
      title: 'Addis Hand-Stitched Genuine Ethiopian Leather Bag',
      categorySlug: 'traditional-heritage',
      priceCents: 3900 * 150, // ETB 5,850.00
      stock: 18,
      status: ProductStatus.ACTIVE,
      sellerIdx: 1,
      description: 'Full-grain Ethiopian highland cow leather briefcase with durable antique brass fittings and padded laptop sleeve.',
      imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'SKU-ETH-SCF-001',
      title: 'Handloom Shemma Cotton Netela Shawl',
      categorySlug: 'traditional-heritage',
      priceCents: 850 * 150, // ETB 1,275.00
      stock: 35,
      status: ProductStatus.ACTIVE,
      sellerIdx: 1,
      description: 'Gossamer two-layered woven cotton scarf with delicate golden cross pattern edges.',
      imageUrl: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'SKU-ETH-SPC-001',
      title: 'Authentic Ethiopian Berbere Spice Blend (1kg)',
      categorySlug: 'coffee-spices',
      priceCents: 650 * 150, // ETB 975.00
      stock: 60,
      status: ProductStatus.ACTIVE,
      sellerIdx: 1,
      description: 'Sun-dried red chili blend infused with korarima, garlic, rue seed, and ginger, perfect for Doro Wat.',
      imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'SKU-ETH-BSK-001',
      title: 'Handwoven Colorful Mesob Traditional Dining Basket',
      categorySlug: 'traditional-heritage',
      priceCents: 2600 * 150, // ETB 3,900.00
      stock: 15,
      status: ProductStatus.ACTIVE,
      sellerIdx: 1,
      description: 'Iconic straw and grass hand-braided Mesob table centerpiece used for authentic communal Injera dining.',
      imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'SKU-ETH-HNY-001',
      title: 'Organic Ethiopian Highland White Forest Honey (500g)',
      categorySlug: 'coffee-spices',
      priceCents: 780 * 150, // ETB 1,170.00
      stock: 45,
      status: ProductStatus.ACTIVE,
      sellerIdx: 1,
      description: 'Pure, raw crystallised white honey collected sustainably from the Tigray highlands and wild eucalyptus blossoms.',
      imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'SKU-ETH-TEF-001',
      title: 'Organic White & Brown Teff Grain (5kg)',
      categorySlug: 'coffee-spices',
      priceCents: 1100 * 150, // ETB 1,650.00
      stock: 70,
      status: ProductStatus.ACTIVE,
      sellerIdx: 1,
      description: 'Gluten-free ancient grain packed with iron and calcium, freshly harvested from the fertile soils of Debre Zeit.',
      imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80',
    },

    // --- Tech (8 products) ---
    {
      sku: 'SKU-TECH-001',
      title: 'Vintage Mechanical Keyboard',
      categorySlug: 'tech',
      priceCents: 8999 * 150,
      stock: 0, // Out of stock #1
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: 'Classic tactile mechanical keyboard with custom switches and vintage grey keycaps.',
      imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'SKU-TECH-002',
      title: 'USB-C Multiport Dock 10-in-1',
      categorySlug: 'tech',
      priceCents: 4999 * 150,
      stock: 45,
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: 'All-in-one USB-C hub with 4K HDMI, Gigabit Ethernet, SD card reader, and 100W PD passthrough.',
      imageUrl: 'https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'SKU-TECH-003',
      title: 'Ultra-Fast NVMe SSD 1TB',
      categorySlug: 'tech',
      priceCents: 10999 * 150,
      stock: 30,
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: 'PCIe Gen 4.0 NVMe M.2 internal solid state drive with up to 7000MB/s read speeds.',
      imageUrl: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'SKU-TECH-004',
      title: '4K Webcam with Dual Mics',
      categorySlug: 'tech',
      priceCents: 7999 * 150,
      stock: 25,
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: 'Ultra HD streaming and conference webcam with privacy shutter and AI autofocus.',
      imageUrl: 'https://images.unsplash.com/photo-1588702547919-26089e690ecc?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'SKU-TECH-005',
      title: 'Wireless Charging Pad 15W',
      categorySlug: 'tech',
      priceCents: 2499 * 150,
      stock: 80,
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: 'Fast Qi wireless charger with aluminum base and non-slip rubber grip.',
      imageUrl: 'https://images.unsplash.com/photo-1586816879360-004f5b0c51e5?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'SKU-TECH-006',
      title: 'Ergonomic Vertical Mouse',
      categorySlug: 'tech',
      priceCents: 3499 * 150,
      stock: 50,
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: 'Natural handshake angle mouse designed to reduce forearm twist and wrist strain.',
      imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'SKU-TECH-007',
      title: 'High-Speed HDMI 2.1 Cable 2m',
      categorySlug: 'tech',
      priceCents: 1499 * 150,
      stock: 120,
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: 'Braided nylon 48Gbps ultra high speed cable supporting 8K 60Hz and 4K 120Hz.',
      imageUrl: 'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'SKU-TECH-008',
      title: 'Thunderbolt 4 Extension Hub',
      categorySlug: 'tech',
      priceCents: 12999 * 150,
      stock: 20,
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: 'Certified 40Gbps Thunderbolt 4 expansion dock with dual display support.',
      imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    },

    // --- Audio (7 products) ---
    {
      sku: 'SKU-AUD-001',
      title: 'Noise-Cancelling Studio Headphones',
      categorySlug: 'audio',
      priceCents: 19999 * 150,
      stock: 0, // Out of stock #2
      status: ProductStatus.ACTIVE,
      sellerIdx: 1,
      description: 'Over-ear wireless headphones with industry-leading hybrid active noise cancellation.',
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'SKU-AUD-002',
      title: 'Ultra Bass Wireless Earbuds',
      categorySlug: 'audio',
      priceCents: 5999 * 150,
      stock: 2, // Low-stock #1 (<= 3)
      status: ProductStatus.ACTIVE,
      sellerIdx: 1,
      description: 'True wireless in-ear headphones with deep punchy bass, IPX7 water resistance.',
      imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'SKU-AUD-003',
      title: 'Portable Waterproof Bluetooth Speaker',
      categorySlug: 'audio',
      priceCents: 4499 * 150,
      stock: 60,
      status: ProductStatus.ACTIVE,
      sellerIdx: 1,
      description: 'Rugged outdoor speaker delivering 360-degree room-filling acoustic sound.',
      imageUrl: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'SKU-AUD-004',
      title: 'Desktop Hi-Fi DAC & Amp',
      categorySlug: 'audio',
      priceCents: 14999 * 150,
      stock: 15,
      status: ProductStatus.ACTIVE,
      sellerIdx: 1,
      description: 'High-resolution audio decoder supporting 32-bit/768kHz PCM with balanced outputs.',
      imageUrl: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'SKU-AUD-005',
      title: 'Condenser Streaming Microphone',
      categorySlug: 'audio',
      priceCents: 8999 * 150,
      stock: 40,
      status: ProductStatus.ACTIVE,
      sellerIdx: 1,
      description: 'Cardioid studio capsule microphone with tap-to-mute sensor and gain control.',
      imageUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'SKU-AUD-006',
      title: 'True Wireless Sports Earphones',
      categorySlug: 'audio',
      priceCents: 3999 * 150,
      stock: 75,
      status: ProductStatus.ACTIVE,
      sellerIdx: 1,
      description: 'Secure-fit ear hooks with sweat-proof nano coating and 30-hour battery life.',
      imageUrl: 'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'SKU-AUD-007',
      title: 'Over-Ear Open-Back Reference Cans',
      categorySlug: 'audio',
      priceCents: 24999 * 150,
      stock: 18,
      status: ProductStatus.ACTIVE,
      sellerIdx: 1,
      description: 'Audiophile grade open-back planar magnetic headphones for mixing and mastering.',
      imageUrl: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80',
    },

    // --- Phones (7 products) ---
    {
      sku: 'SKU-PHN-001',
      title: 'Foldable Smartphone X Ultra',
      categorySlug: 'phones',
      priceCents: 139999 * 150,
      stock: 0, // Out of stock #3
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: 'Next-generation folding display with seamless hinge and flagship triple camera.',
      imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'SKU-PHN-002',
      title: 'Flagship 5G Smartphone 256GB',
      categorySlug: 'phones',
      priceCents: 89999 * 150,
      stock: 35,
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: '6.7-inch AMOLED 120Hz display with cutting-edge processor and all-day battery.',
      imageUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'SKU-PHN-003',
      title: 'Compact Mid-Range Smartphone',
      categorySlug: 'phones',
      priceCents: 39999 * 150,
      stock: 50,
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: 'Lightweight, pocketable phone with sharp camera and clean operating system.',
      imageUrl: 'https://images.unsplash.com/photo-1567581935884-3349723552ca?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'SKU-PHN-004',
      title: 'Rugged Outdoor Phone Waterproof',
      categorySlug: 'phones',
      priceCents: 49999 * 150,
      stock: 22,
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: 'MIL-STD-810H shockproof and IP68 waterproof phone built for extreme environments.',
      imageUrl: 'https://images.unsplash.com/photo-1533228896884-6a8f9312804b?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'SKU-PHN-005',
      title: 'MagSafe Silicone Phone Case',
      categorySlug: 'phones',
      priceCents: 1999 * 150,
      stock: 150,
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: 'Soft-touch liquid silicone protective case with integrated magnetic alignment ring.',
      imageUrl: 'https://images.unsplash.com/photo-1601593346740-925612772716?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'SKU-PHN-006',
      title: 'Tempered Glass Screen Protector 2-Pack',
      categorySlug: 'phones',
      priceCents: 1199 * 150,
      stock: 200,
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: '9H hardness scratch-resistant tempered glass with oleophobic anti-fingerprint coating.',
      imageUrl: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'SKU-PHN-007',
      title: 'Fast GaN Wall Charger 65W',
      categorySlug: 'phones',
      priceCents: 2999 * 150,
      stock: 90,
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: 'Compact gallium nitride charger with dual USB-C ports and folding prongs.',
      imageUrl: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80',
    },

    // --- Laptops (7 products) ---
    {
      sku: 'SKU-LAP-001', // Stock 1 for concurrency testing!
      title: 'Limited Edition Cyberpunk Laptop 16-inch',
      categorySlug: 'laptops',
      priceCents: 249999 * 150,
      stock: 1,
      status: ProductStatus.ACTIVE,
      sellerIdx: 2,
      description: 'High-performance bespoke gaming laptop featuring custom laser engraving and RTX GPU.',
      imageUrl: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'SKU-LAP-002',
      title: 'Ultra-Thin Carbon Laptop 14-inch',
      categorySlug: 'laptops',
      priceCents: 119999 * 150,
      stock: 25,
      status: ProductStatus.ACTIVE,
      sellerIdx: 2,
      description: 'Carbon fiber chassis ultrabook weighing just 1kg with 18-hour battery longevity.',
      imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'SKU-LAP-003',
      title: 'Creator Studio Laptop 32GB OLED',
      categorySlug: 'laptops',
      priceCents: 189999 * 150,
      stock: 14,
      status: ProductStatus.ACTIVE,
      sellerIdx: 2,
      description: 'Calibrated 4K OLED touch display tailored for color grading, 3D rendering, and video editing.',
      imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'SKU-LAP-004',
      title: 'Business Notebook 15-inch i7',
      categorySlug: 'laptops',
      priceCents: 84999 * 150,
      stock: 40,
      status: ProductStatus.ACTIVE,
      sellerIdx: 2,
      description: 'Dependable workstation with hardware TPM security, fingerprint scanner, and backlit keyboard.',
      imageUrl: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'SKU-LAP-005',
      title: 'Aluminum Laptop Stand Riser',
      categorySlug: 'laptops',
      priceCents: 3499 * 150,
      stock: 65,
      status: ProductStatus.ACTIVE,
      sellerIdx: 2,
      description: 'Ergonomic ventilated laptop elevator made from CNC sandblasted aircraft-grade alloy.',
      imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'SKU-LAP-006',
      title: 'Water-Resistant Laptop Sleeve 15-inch',
      categorySlug: 'laptops',
      priceCents: 2299 * 150,
      stock: 85,
      status: ProductStatus.ACTIVE,
      sellerIdx: 2,
      description: 'Fleece-lined padded protective travel sleeve with accessory zipper pocket.',
      imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'SKU-LAP-007',
      title: 'Mechanical Numpad Bluetooth',
      categorySlug: 'laptops',
      priceCents: 2799 * 150,
      stock: 40,
      status: ProductStatus.ACTIVE,
      sellerIdx: 2,
      description: 'Wireless numeric keypad with hot-swappable switches for accounting and data entry.',
      imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
    },

    // --- Wearables (7 products) ---
    {
      sku: 'SKU-WEAR-001',
      title: 'Unreleased Smart Ring Prototype',
      categorySlug: 'wearables',
      priceCents: 17999 * 150,
      stock: 10,
      status: ProductStatus.DRAFT, // Exactly 1 DRAFT product!
      sellerIdx: 0,
      description: 'Experimental titanium ring sensor tracking heart rate variability and sleep architecture.',
      imageUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'SKU-WEAR-002',
      title: 'Fitness Tracker Band HR + GPS',
      categorySlug: 'wearables',
      priceCents: 4999 * 150,
      stock: 70,
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: 'Lightweight smart fitness bracelet with continuous SpO2 and automatic workout tracking.',
      imageUrl: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'SKU-WEAR-003',
      title: 'Premium Titanium Smartwatch',
      categorySlug: 'wearables',
      priceCents: 34999 * 150,
      stock: 28,
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: 'Sapphire crystal glass smartwatch with ECG sensor, cellular connectivity, and offline maps.',
      imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'SKU-WEAR-004',
      title: 'Hybrid Analogue Smartwatch',
      categorySlug: 'wearables',
      priceCents: 15999 * 150,
      stock: 35,
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: 'Mechanical hands paired with hidden e-ink subdial for subtle notifications.',
      imageUrl: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'SKU-WEAR-005',
      title: 'Breathable Nylon Watch Band',
      categorySlug: 'wearables',
      priceCents: 1499 * 150,
      stock: 110,
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: 'Quick-release hook-and-loop woven nylon strap compatible with 20mm and 22mm lugs.',
      imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'SKU-WEAR-006',
      title: 'Smart Sleep & Recovery Mask',
      categorySlug: 'wearables',
      priceCents: 7999 * 150,
      stock: 45,
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: 'Blackout eye mask with integrated bone-conduction audio and soothing white noise.',
      imageUrl: 'https://images.unsplash.com/photo-1518444065439-e933c06ce9cd?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'SKU-WEAR-007',
      title: 'Heart Rate Monitor Chest Strap',
      categorySlug: 'wearables',
      priceCents: 5499 * 150,
      stock: 55,
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: 'Dual ANT+ and Bluetooth chest sensor for medical-grade ECG workout telemetry.',
      imageUrl: 'https://images.unsplash.com/photo-1510519138197-06b8628cbf47?auto=format&fit=crop&w=800&q=80',
    },

    // --- Gaming (7 products) ---
    {
      sku: 'SKU-GAM-001',
      title: 'VR Headset Elite 4K 120Hz',
      categorySlug: 'gaming',
      priceCents: 59999 * 150,
      stock: 3, // Low-stock #2 (<= 3)
      status: ProductStatus.ACTIVE,
      sellerIdx: 2,
      description: 'Standalone virtual reality headset with inside-out tracking and pancake optics.',
      imageUrl: 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'SKU-GAM-002',
      title: 'Gaming Mouse', // Near-duplicate 1
      categorySlug: 'gaming',
      priceCents: 4999 * 150,
      stock: 60,
      status: ProductStatus.ACTIVE,
      sellerIdx: 2,
      description: 'Ergonomic optical gaming mouse with 16000 DPI sensor and lightweight braided cable.',
      imageUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'SKU-GAM-003',
      title: 'Gaming Mouse Pro', // Near-duplicate 2
      categorySlug: 'gaming',
      priceCents: 7999 * 150,
      stock: 45,
      status: ProductStatus.ACTIVE,
      sellerIdx: 2,
      description: 'Wireless esport tournament grade gaming mouse with ultra-lightweight 58g honeycomb shell.',
      imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'SKU-GAM-004',
      title: 'RGB Mechanical Gaming Keyboard',
      categorySlug: 'gaming',
      priceCents: 12999 * 150,
      stock: 35,
      status: ProductStatus.ACTIVE,
      sellerIdx: 2,
      description: 'Linear speed switches, per-key RGB illumination, and magnetic memory foam wrist rest.',
      imageUrl: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'SKU-GAM-005',
      title: 'Surround Sound Gaming Headset',
      categorySlug: 'gaming',
      priceCents: 8999 * 150,
      stock: 50,
      status: ProductStatus.ACTIVE,
      sellerIdx: 2,
      description: 'Spatial audio headset with 50mm neodymium drivers and broadcast-quality flip mic.',
      imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'SKU-GAM-006',
      title: 'XL Anti-Fray Cloth Gaming Mousepad',
      categorySlug: 'gaming',
      priceCents: 1999 * 150,
      stock: 130,
      status: ProductStatus.ACTIVE,
      sellerIdx: 2,
      description: 'Desk-sized micro-textured cloth mat with non-slip natural rubber base.',
      imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'SKU-GAM-007',
      title: 'Wireless Low-Latency Game Controller',
      categorySlug: 'gaming',
      priceCents: 6499 * 150,
      stock: 40,
      status: ProductStatus.ACTIVE,
      sellerIdx: 2,
      description: 'Hall effect magnetic triggers and joysticks with zero stick drift and remappable paddles.',
      imageUrl: 'https://images.unsplash.com/photo-1592840496694-26d035b52b48?auto=format&fit=crop&w=800&q=80',
    },

    // --- Smart Home (7 products) ---
    {
      sku: 'SKU-SMH-001',
      title: 'Smart Thermostat Hub Wireless',
      categorySlug: 'smart-home',
      priceCents: 12999 * 150,
      stock: 2, // Low-stock #3 (<= 3)
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: 'Adaptive climate control thermostat with remote temperature sensors and energy reports.',
      imageUrl: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'SKU-SMH-002',
      title: 'Color LED Smart Bulb 4-Pack',
      categorySlug: 'smart-home',
      priceCents: 3999 * 150,
      stock: 95,
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: '16 million color RGB+W bulbs compatible with voice assistants and scheduled scenes.',
      imageUrl: 'https://images.unsplash.com/photo-1550524514-9b69b60fae2f?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'SKU-SMH-003',
      title: 'Video Doorbell with Chime 2K',
      categorySlug: 'smart-home',
      priceCents: 9999 * 150,
      stock: 30,
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: 'Head-to-toe 2K HDR video doorbell with PIR motion detection and two-way audio talk.',
      imageUrl: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'SKU-SMH-004',
      title: 'Smart Plug Wi-Fi Energy Monitor 2-Pack',
      categorySlug: 'smart-home',
      priceCents: 2199 * 150,
      stock: 140,
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: 'Compact 15A smart outlet timer with real-time power consumption monitoring in watts.',
      imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'SKU-SMH-005',
      title: 'Indoor Security Camera Pan & Tilt',
      categorySlug: 'smart-home',
      priceCents: 4599 * 150,
      stock: 60,
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: '360-degree motorized pan-and-tilt security camera with infrared night vision up to 10m.',
      imageUrl: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'SKU-SMH-006',
      title: 'Smart Keyless Deadbolt Lock',
      categorySlug: 'smart-home',
      priceCents: 16999 * 150,
      stock: 25,
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: 'Biometric fingerprint, PIN touchscreen keypad, and smartphone auto-unlock door lock.',
      imageUrl: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'SKU-SMH-007',
      title: 'Air Quality & CO2 Sensor Monitor',
      categorySlug: 'smart-home',
      priceCents: 6999 * 150,
      stock: 38,
      status: ProductStatus.ACTIVE,
      sellerIdx: 0,
      description: 'Real-time air sensor measuring particulate PM2.5, volatile organic compounds, and humidity.',
      imageUrl: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=800&q=80',
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
        currency: 'ETB',
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
        currency: 'ETB',
        stock: p.stock,
        status: p.status,
      },
    });

    // Idempotent image creation
    await prisma.productImage.deleteMany({
      where: { productId: product.id },
    });

    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: p.imageUrl,
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

  await prisma.notification.deleteMany({
    where: {
      OR: [
        { type: { startsWith: 'ORDER_' } },
        { user: { email: { contains: '@demo.com' } } },
      ],
    },
  });

  await prisma.order.deleteMany({
    where: {
      idempotencyKey: {
        startsWith: 'seed-order-',
      },
    },
  });

  // -------------------------------------------------------------
  // 6. Orders (~20 orders over last 60 days in ETB)
  // -------------------------------------------------------------
  console.log('🛒 Seeding orders in ETB...');

  const activeProducts = seededProducts.filter((p) => p.status === ProductStatus.ACTIVE && p.stock > 0);
  const now = new Date();

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
    { daysAgo: 36, status: OrderStatus.CANCELLED, customerIdx: 6, paymentStatus: PaymentStatus.FAILED, productIndices: [10] },
    { daysAgo: 33, status: OrderStatus.DELIVERED, customerIdx: 7, paymentStatus: PaymentStatus.COMPLETED, productIndices: [11, 12] },
    { daysAgo: 30, status: OrderStatus.DELIVERED, customerIdx: 0, paymentStatus: PaymentStatus.COMPLETED, productIndices: [13] },
    { daysAgo: 27, status: OrderStatus.SHIPPED, customerIdx: 1, paymentStatus: PaymentStatus.COMPLETED, productIndices: [14, 15] },
    { daysAgo: 24, status: OrderStatus.SHIPPED, customerIdx: 2, paymentStatus: PaymentStatus.COMPLETED, productIndices: [16] },
    { daysAgo: 21, status: OrderStatus.SHIPPED, customerIdx: 3, paymentStatus: PaymentStatus.COMPLETED, productIndices: [17, 18] },
    { daysAgo: 18, status: OrderStatus.PROCESSING, customerIdx: 4, paymentStatus: PaymentStatus.COMPLETED, productIndices: [19] },
    { daysAgo: 15, status: OrderStatus.PROCESSING, customerIdx: 5, paymentStatus: PaymentStatus.COMPLETED, productIndices: [20, 21] },
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

    let chosenProducts: Array<{ id: string; sellerId: string; sellerUserId: string; priceCents: number; quantity: number }> = [];

    if (cfg.isMultiSeller) {
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
        currency: 'ETB',
        idempotencyKey: `seed-order-${orderNum}`,
        shippingName: customer.name,
        shippingLine1: `Bole Subcity, Woreda ${orderNum}`,
        shippingCity: 'Addis Ababa',
        shippingCountry: 'Ethiopia',
        paidAt,
        createdAt,
        updatedAt: createdAt,
      },
    });

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

    await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: 'telebirr',
        providerRef: `seed-pay-${orderNum}`,
        amountCents: totalCents,
        currency: 'ETB',
        status: cfg.paymentStatus,
        createdAt,
        updatedAt: createdAt,
      },
    });

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

  console.log('✅ GibeMart database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
