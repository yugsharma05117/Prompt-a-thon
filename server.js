const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const crypto = require('crypto');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.'));

// ==================== IN-MEMORY STORAGE ====================
let deals = [];
let users = [];
let orders = [];
let payments = [];
let tokens = {};

// ==================== AUTH HELPERS ====================

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.createHash('sha256').update(password + salt).digest('hex');
    return { salt, hash };
}

function verifyPassword(password, salt, hash) {
    return crypto.createHash('sha256').update(password + salt).digest('hex') === hash;
}

function generateToken(userId) {
    const token = crypto.randomBytes(32).toString('hex');
    tokens[token] = { userId, createdAt: Date.now() };
    return token;
}

function authMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const token = authHeader.split(' ')[1];
    const tokenData = tokens[token];
    if (!tokenData) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    req.userId = tokenData.userId;
    req.token = token;
    next();
}

// ==================== SEED 20 DEALS ====================
deals = [
    { id:1,  store:"Pizza Palace",        category:"food",        offer:"50% OFF",              description:"Get 50% off on all large pizzas. Valid on dine-in and takeaway.",         address:"123 Main Street, Downtown",            lat:27.4924, lng:77.6737, validity:"Valid until Feb 15, 2026", fullDescription:"Enjoy our authentic Italian pizzas with fresh ingredients. This limited-time offer includes all our specialty pizzas including Margherita, Pepperoni, BBQ Chicken, and Vegetarian options. Made with imported cheese and baked in traditional wood-fired ovens for that perfect crispy crust every time.",               badge:"hot",      savings:"$15-25",  popularity:85, rating:4.5, peopleViewed:342, basePrice:50,  discountPercent:50, stock:100, createdAt:new Date(), active:true },
    { id:2,  store:"TechHub Electronics", category:"electronics", offer:"30% OFF Headphones",   description:"Premium wireless headphones at 30% discount with noise cancellation.",    address:"456 Tech Avenue, City Center",          lat:27.4984, lng:77.6797, validity:"Valid until Feb 10, 2026", fullDescription:"Shop from leading brands including Sony, Bose, and JBL. All headphones come with 1-year warranty and free shipping on orders above $50. Experience studio-quality sound with active noise cancellation technology that seamlessly adapts to your environment.",                badge:"trending", savings:"$40-80",  popularity:92, rating:4.8, peopleViewed:578, basePrice:120, discountPercent:30, stock:50,  createdAt:new Date(), active:true },
    { id:3,  store:"Fashion Forward",     category:"clothing",    offer:"Buy 2 Get 1 Free",     description:"Purchase any 2 items and get the third absolutely free on winter collection.", address:"789 Style Street, Fashion District",    lat:27.4864, lng:77.6697, validity:"Valid until Feb 28, 2026", fullDescription:"Update your wardrobe with our latest winter collection. Offer includes jackets, sweaters, jeans, and accessories. Mix and match any items from our premium fabrics and trendy designs crafted for every occasion and lifestyle.",                                                    badge:"vip",      savings:"$30-60",  popularity:78, rating:4.3, peopleViewed:267, basePrice:90,  discountPercent:33, stock:75,  createdAt:new Date(), active:true },
    { id:4,  store:"Glow Hair Salon",     category:"services",    offer:"40% OFF Haircuts",     description:"Professional haircut and styling at 40% off. Book your appointment now.",  address:"321 Beauty Lane, Uptown",              lat:27.5024, lng:77.6837, validity:"Valid until Feb 20, 2026", fullDescription:"Our expert stylists provide personalized consultations and premium hair services. Includes wash, cut, and blow-dry. First-time customers get an additional 10% off. Using only premium salon-grade products for exceptional results.",                                                   savings:"$20-35",  popularity:65, rating:4.6, peopleViewed:189, basePrice:55,  discountPercent:40, stock:40,  createdAt:new Date(), active:true },
    { id:5,  store:"Burger Bros",         category:"food",        offer:"Free Fries & Drink",   description:"Free medium fries and drink with any burger combo. Limited time.",       address:"555 Food Court, Mall Plaza",           lat:27.4944, lng:77.6657, validity:"Valid until Feb 12, 2026", fullDescription:"Choose from our signature beef, chicken, or veggie burgers. Made with fresh ingredients and served with crispy fries and your choice of beverage. 100% fresh, never frozen patties grilled to perfection on every single order.",                                                      badge:"trending", savings:"$8-12",   popularity:88, rating:4.4, peopleViewed:445, basePrice:18,  discountPercent:50, stock:200, createdAt:new Date(), active:true },
    { id:6,  store:"GameZone",            category:"electronics", offer:"25% OFF Gaming",       description:"Get 25% off on all gaming accessories and controllers.",                 address:"888 Gaming Street, Tech Park",         lat:27.5004, lng:77.6717, validity:"Valid until Feb 25, 2026", fullDescription:"Shop controllers, headsets, keyboards, and mice from top gaming brands. Compatible with PS5, Xbox Series X, and high-end PC setups. Pro-level equipment trusted by competitive esports professionals worldwide.",                                                                    savings:"$25-75",  popularity:90, rating:4.7, peopleViewed:523, basePrice:100, discountPercent:25, stock:60,  createdAt:new Date(), active:true },
    { id:7,  store:"Casual Wear Co",      category:"clothing",    offer:"Flat $20 OFF",         description:"Flat $20 discount on purchases above $100. Premium casual wear.",       address:"234 Casual Avenue, Shopping Center",   lat:27.4884, lng:77.6777, validity:"Valid until Feb 18, 2026", fullDescription:"Trendy t-shirts, shirts, pants, and dresses. New arrivals added weekly. Comfortable and stylish options for all occasions, made from premium cotton and breathable fabrics that keep you cool all day long.",                                                                            savings:"$20",     popularity:70, rating:4.2, peopleViewed:198, basePrice:120, discountPercent:17, stock:80,  createdAt:new Date(), active:true },
    { id:8,  store:"Spa Serenity",        category:"services",    offer:"50% OFF Massage",      description:"Relaxing full-body massage at half price. Perfect for unwinding.",       address:"777 Wellness Road, Spa District",      lat:27.4904, lng:77.6817, validity:"Valid until Feb 22, 2026", fullDescription:"Choose from Swedish, deep tissue, or aromatherapy massage. 60-minute sessions by certified therapists in a serene, peaceful environment. Premium essential oils and heated stones included for the ultimate relaxation experience.",                                                badge:"vip",      savings:"$40-60",  popularity:75, rating:4.9, peopleViewed:312, basePrice:100, discountPercent:50, stock:30,  createdAt:new Date(), active:true },
    { id:9,  store:"Sushi Express",       category:"food",        offer:"20% OFF Platters",     description:"Fresh sushi platters at 20% discount. Perfect for sharing.",            address:"999 Sushi Lane, Food Street",          lat:27.4964, lng:77.6677, validity:"Valid until Feb 14, 2026", fullDescription:"Hand-rolled sushi made fresh daily by master chefs. Choose from signature rolls, nigiri, and sashimi platters. Vegetarian options available. Premium-grade fish imported daily from the freshest coastal markets around the world.",                                                           savings:"$12-25",  popularity:82, rating:4.6, peopleViewed:289, basePrice:60,  discountPercent:20, stock:90,  createdAt:new Date(), active:true },
    { id:10, store:"SmartHome Tech",      category:"electronics", offer:"35% OFF Smart Bulbs",  description:"Smart LED bulbs with app control at 35% off. Transform your home.",    address:"444 Innovation Drive, Tech Valley",    lat:27.5044, lng:77.6857, validity:"Valid until Feb 16, 2026", fullDescription:"WiFi-enabled smart bulbs compatible with Alexa and Google Home. Customize 16 million colors, set automated schedules, and control from anywhere. Energy-efficient LED technology that lasts 25x longer than standard bulbs.",                                                     badge:"hot",      savings:"$15-30",  popularity:87, rating:4.5, peopleViewed:401, basePrice:45,  discountPercent:35, stock:150, createdAt:new Date(), active:true },
    { id:11, store:"Denim Depot",         category:"clothing",    offer:"40% OFF Jeans",        description:"Premium denim jeans at amazing prices. All fits and washes.",          address:"666 Denim Street, Fashion Hub",        lat:27.4824, lng:77.6757, validity:"Valid until Feb 24, 2026", fullDescription:"Classic, slim, and relaxed fits in our entire range. High-quality denim that lasts season after season. Multiple washes from light blue to deep black. Imported premium stretch denim engineered for comfort and effortless style.",                                                        savings:"$30-50",  popularity:73, rating:4.4, peopleViewed:234, basePrice:85,  discountPercent:40, stock:65,  createdAt:new Date(), active:true },
    { id:12, store:"Nail Art Studio",     category:"services",    offer:"Buy 1 Get 1",          description:"Get two manicures for the price of one. Bring a friend!",            address:"111 Beauty Plaza, Salon Row",          lat:27.4844, lng:77.6877, validity:"Valid until Feb 11, 2026", fullDescription:"Professional nail services including manicure, pedicure, and stunning nail art designs. Wide selection of OPI and Essie polishes. Gel and acrylic options available with expert technicians certified in Korean nail techniques.",                                                badge:"trending", savings:"$25-35",  popularity:80, rating:4.7, peopleViewed:356, basePrice:70,  discountPercent:50, stock:45,  createdAt:new Date(), active:true },
    { id:13, store:"Taco Fiesta",         category:"food",        offer:"Free Guacamole",       description:"Free guacamole and chips with any taco order. Authentic Mexican.",     address:"222 Fiesta Avenue, Restaurant Row",    lat:27.4984, lng:77.6617, validity:"Valid until Feb 13, 2026", fullDescription:"Authentic tacos made with fresh, hand-selected ingredients. Choose from slow-cooked beef, marinated chicken, fresh fish, or vibrant vegetarian options. Handmade corn tortillas rolled daily with our legendary 7-salsa fresh bar.",                                                   savings:"$6-10",   popularity:86, rating:4.5, peopleViewed:412, basePrice:22,  discountPercent:30, stock:180, createdAt:new Date(), active:true },
    { id:14, store:"Camera Corner",       category:"electronics", offer:"15% OFF Cameras",      description:"Digital cameras and accessories at special prices.",                   address:"333 Photo Street, Electronics Mall",   lat:27.5064, lng:77.6797, validity:"Valid until Feb 26, 2026", fullDescription:"DSLR and mirrorless cameras from Canon, Nikon, and Sony. Professional lenses, carbon fiber tripods, and premium camera bags at bundled prices. In-store photography workshops included with every purchase over $200.",                                                                    savings:"$50-150", popularity:68, rating:4.3, peopleViewed:176, basePrice:350, discountPercent:15, stock:25,  createdAt:new Date(), active:true },
    { id:15, store:"Shoe Haven",          category:"clothing",    offer:"30% OFF Sneakers",     description:"Latest sneaker collection at 30% discount. Limited stock.",            address:"888 Footwear Lane, Shoe District",     lat:27.4804, lng:77.6637, validity:"Valid until Feb 19, 2026", fullDescription:"Athletic and casual sneakers from Nike, Adidas, and New Balance. Various sizes and colorways available including limited edition releases and exclusive colorways not found anywhere else. Perfect for running or everyday streetwear.",                                                  badge:"hot",      savings:"$40-80",  popularity:91, rating:4.6, peopleViewed:534, basePrice:130, discountPercent:30, stock:55,  createdAt:new Date(), active:true },
    { id:16, store:"Fitness First Gym",   category:"services",    offer:"First Month Free",     description:"Sign up for a year and get your first month free. Premium gym.",       address:"555 Fitness Boulevard, Health Zone",   lat:27.5084, lng:77.6897, validity:"Valid until Feb 29, 2026", fullDescription:"State-of-the-art equipment, certified personal trainers, group fitness classes, and luxury sauna. Open 24/7 with full locker rooms, secure parking, and an Olympic-size pool. Nutrition counseling and meal planning included with annual membership.",                              badge:"vip",      savings:"$80",     popularity:79, rating:4.8, peopleViewed:298, basePrice:160, discountPercent:50, stock:20,  createdAt:new Date(), active:true },
    { id:17, store:"Coffee Culture",      category:"food",        offer:"Buy 3 Get 1 Free",     description:"Buy three coffees and get the fourth free. Premium artisan coffee.",   address:"777 Brew Street, Café Corner",         lat:27.4924, lng:77.6597, validity:"Valid until Feb 17, 2026", fullDescription:"Specialty coffee drinks crafted by expert baristas. Choose from single-origin espresso, velvety cappuccino, smooth latte, and refreshing cold brew. Freshly roasted beans sourced from sustainable farms across Ethiopia and Colombia.",                                                savings:"$5-8",    popularity:84, rating:4.7, peopleViewed:467, basePrice:16,  discountPercent:25, stock:300, createdAt:new Date(), active:true },
    { id:18, store:"Mobile Mania",        category:"electronics", offer:"Trade-In Bonus",       description:"Extra $100 trade-in value on your old phone. Upgrade today!",         address:"999 Mobile Plaza, Phone Market",       lat:27.5104, lng:77.6737, validity:"Valid until Feb 21, 2026", fullDescription:"Latest smartphones from Apple, Samsung, and Google Pixel. Free premium screen protector and case with every purchase. Extended 3-year warranty available. Certified technicians handle the entire trade-in and activation process on-site for you.",                              badge:"trending", savings:"$100+",   popularity:93, rating:4.6, peopleViewed:612, basePrice:800, discountPercent:12, stock:15,  createdAt:new Date(), active:true },
    { id:19, store:"Kids Fashion",        category:"clothing",    offer:"50% OFF Clearance",    description:"End of season clearance - 50% off on all kids clothing.",              address:"444 Children Lane, Family Mall",       lat:27.4784, lng:77.6917, validity:"Valid until Feb 23, 2026", fullDescription:"Quality children's clothing including vibrant shirts, pants, playful dresses, and warm jackets. Hypoallergenic fabrics safe for sensitive skin. Sizes newborn to 14 years. New season arrivals also 20% off when you buy clearance items.",                                                  savings:"$20-40",  popularity:72, rating:4.4, peopleViewed:223, basePrice:65,  discountPercent:50, stock:110, createdAt:new Date(), active:true },
    { id:20, store:"Auto Care Plus",      category:"services",    offer:"Free Oil Change",      description:"Free oil change with any service package. Keep your car running smooth.", address:"123 Auto Street, Service Center",     lat:27.5124, lng:77.6677, validity:"Valid until Feb 27, 2026", fullDescription:"Professional car maintenance by ASE-certified mechanics. Quality OEM and aftermarket parts with full warranty. Quick turnaround — most services completed same day. Complete 150-point vehicle inspection included with every visit.",                                                  savings:"$35-50",  popularity:76, rating:4.5, peopleViewed:287, basePrice:90,  discountPercent:40, stock:35,  createdAt:new Date(), active:true }
];

// ==================== DEALS ENDPOINTS ====================

app.get('/api/deals', (req, res) => {
    const { category, search, sort, limit } = req.query;
    let f = [...deals.filter(d => d.active)];
    if (category && category !== 'all') f = f.filter(d => d.category === category);
    if (search) { const s = search.toLowerCase(); f = f.filter(d => d.store.toLowerCase().includes(s) || d.offer.toLowerCase().includes(s) || d.description.toLowerCase().includes(s)); }
    if (sort === 'popularity') f.sort((a, b) => b.popularity - a.popularity);
    else if (sort === 'discount') f.sort((a, b) => b.discountPercent - a.discountPercent);
    else if (sort === 'rating') f.sort((a, b) => b.rating - a.rating);
    if (limit) f = f.slice(0, parseInt(limit));
    res.json({ success: true, count: f.length, deals: f });
});

app.get('/api/deals/:id', (req, res) => {
    const deal = deals.find(d => d.id === parseInt(req.params.id));
    if (!deal) return res.status(404).json({ success: false, message: 'Deal not found' });
    deal.peopleViewed += 1;
    res.json({ success: true, deal });
});

app.post('/api/deals', (req, res) => {
    const d = { id: deals.length + 1, ...req.body, peopleViewed: 0, createdAt: new Date(), active: true };
    deals.push(d);
    res.status(201).json({ success: true, deal: d });
});

app.put('/api/deals/:id', (req, res) => {
    const i = deals.findIndex(d => d.id === parseInt(req.params.id));
    if (i === -1) return res.status(404).json({ success: false, message: 'Deal not found' });
    deals[i] = { ...deals[i], ...req.body, updatedAt: new Date() };
    res.json({ success: true, deal: deals[i] });
});

app.delete('/api/deals/:id', (req, res) => {
    const i = deals.findIndex(d => d.id === parseInt(req.params.id));
    if (i === -1) return res.status(404).json({ success: false, message: 'Deal not found' });
    deals[i].active = false;
    res.json({ success: true, message: 'Deal deleted' });
});

// ==================== AUTH ENDPOINTS ====================

app.post('/api/users/register', (req, res) => {
    try {
        const { name, email, password, phone } = req.body;
        if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
        if (password.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        if (users.find(u => u.email === email.toLowerCase())) return res.status(400).json({ success: false, message: 'An account with this email already exists' });

        const { salt, hash } = hashPassword(password);
        const newUser = {
            id: users.length + 1, name, email: email.toLowerCase(),
            passwordSalt: salt, passwordHash: hash,
            phone: phone || '',
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
            createdAt: new Date(), favorites: [], orders: []
        };
        users.push(newUser);
        const token = generateToken(newUser.id);

        res.status(201).json({
            success: true, message: 'Account created successfully! Welcome aboard 🎉',
            user: { id: newUser.id, name: newUser.name, email: newUser.email, phone: newUser.phone, avatar: newUser.avatar },
            token
        });
    } catch (e) { res.status(500).json({ success: false, message: 'Server error' }); }
});

app.post('/api/users/login', (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required' });

        const user = users.find(u => u.email === email.toLowerCase());
        if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const token = generateToken(user.id);
        res.json({
            success: true, message: 'Welcome back! 👋',
            user: { id: user.id, name: user.name, email: user.email, phone: user.phone, avatar: user.avatar },
            token
        });
    } catch (e) { res.status(500).json({ success: false, message: 'Server error' }); }
});

app.post('/api/users/logout', authMiddleware, (req, res) => {
    delete tokens[req.token];
    res.json({ success: true, message: 'Logged out successfully' });
});

app.get('/api/users/me', authMiddleware, (req, res) => {
    const user = users.find(u => u.id === req.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({
        success: true,
        user: { id: user.id, name: user.name, email: user.email, phone: user.phone, avatar: user.avatar, favorites: user.favorites, orderCount: user.orders.length, memberSince: user.createdAt }
    });
});

app.put('/api/users/me', authMiddleware, (req, res) => {
    const user = users.find(u => u.id === req.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (req.body.name) user.name = req.body.name;
    if (req.body.phone !== undefined) user.phone = req.body.phone;
    res.json({ success: true, message: 'Profile updated', user: { id: user.id, name: user.name, email: user.email, phone: user.phone, avatar: user.avatar } });
});

app.put('/api/users/me/password', authMiddleware, (req, res) => {
    const user = users.find(u => u.id === req.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ success: false, message: 'Both passwords required' });
    if (!verifyPassword(currentPassword, user.passwordSalt, user.passwordHash)) return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    if (newPassword.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    const { salt, hash } = hashPassword(newPassword);
    user.passwordSalt = salt; user.passwordHash = hash;
    res.json({ success: true, message: 'Password changed successfully' });
});

// Favorites (protected)
app.post('/api/users/me/favorites/:dealId', authMiddleware, (req, res) => {
    const user = users.find(u => u.id === req.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const dealId = parseInt(req.params.dealId);
    if (!user.favorites.includes(dealId)) user.favorites.push(dealId);
    res.json({ success: true, favorites: user.favorites });
});

app.delete('/api/users/me/favorites/:dealId', authMiddleware, (req, res) => {
    const user = users.find(u => u.id === req.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.favorites = user.favorites.filter(id => id !== parseInt(req.params.dealId));
    res.json({ success: true, favorites: user.favorites });
});

// ==================== ORDERS ====================

app.post('/api/orders', (req, res) => {
    try {
        const { userId, dealId, quantity, customerName, customerEmail, customerPhone, scheduledDate, scheduledTime, specialRequests, paymentMethod } = req.body;
        const deal = deals.find(d => d.id === parseInt(dealId));
        if (!deal) return res.status(404).json({ success: false, message: 'Deal not found' });
        if (deal.stock < quantity) return res.status(400).json({ success: false, message: 'Insufficient stock' });

        const basePrice = deal.basePrice * quantity;
        const discount = (basePrice * deal.discountPercent) / 100;
        const total = basePrice - discount;

        const newOrder = {
            id: `DH${Date.now().toString().slice(-8)}`, userId: parseInt(userId), dealId: parseInt(dealId),
            deal: deal.offer, store: deal.store, category: deal.category,
            quantity, basePrice, discount, total, savings: discount,
            customerName, customerEmail, customerPhone, scheduledDate, scheduledTime, specialRequests, paymentMethod,
            status: 'pending', createdAt: new Date(), updatedAt: new Date()
        };
        orders.push(newOrder);
        deal.stock -= quantity;

        const user = users.find(u => u.id === parseInt(userId));
        if (user) user.orders.push(newOrder.id);

        res.status(201).json({ success: true, message: 'Order created successfully', order: newOrder });
    } catch (e) { res.status(500).json({ success: false, message: 'Server error' }); }
});

app.get('/api/orders/user/:userId', (req, res) => {
    const o = orders.filter(o => o.userId === parseInt(req.params.userId));
    res.json({ success: true, count: o.length, orders: o.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) });
});

app.get('/api/orders/:id', (req, res) => {
    const order = orders.find(o => o.id === req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
});

app.patch('/api/orders/:id/status', (req, res) => {
    const order = orders.find(o => o.id === req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    const valid = ['pending','confirmed','processing','completed','cancelled'];
    if (!valid.includes(req.body.status)) return res.status(400).json({ success: false, message: 'Invalid status' });
    order.status = req.body.status; order.updatedAt = new Date();
    res.json({ success: true, order });
});

app.delete('/api/orders/:id', (req, res) => {
    const order = orders.find(o => o.id === req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status === 'completed' || order.status === 'cancelled') return res.status(400).json({ success: false, message: 'Cannot cancel this order' });
    const deal = deals.find(d => d.id === order.dealId);
    if (deal) deal.stock += order.quantity;
    order.status = 'cancelled'; order.updatedAt = new Date();
    res.json({ success: true, order });
});

// ==================== PAYMENTS ====================

app.post('/api/payments/process', (req, res) => {
    try {
        const { orderId, paymentMethod, amount } = req.body;
        const order = orders.find(o => o.id === orderId);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        const payment = { id: `PAY${Date.now().toString().slice(-8)}`, orderId, amount, paymentMethod, status: 'success', transactionId: `TXN${Date.now()}`, processedAt: new Date() };
        payments.push(payment);
        order.status = 'confirmed'; order.paymentId = payment.id; order.updatedAt = new Date();

        res.json({ success: true, message: 'Payment processed successfully', payment, order });
    } catch (e) { res.status(500).json({ success: false, message: 'Payment failed' }); }
});

// ==================== ANALYTICS ====================

app.get('/api/analytics/stats', (req, res) => {
    res.json({ success: true, stats: {
        totalDeals: deals.filter(d => d.active).length, totalOrders: orders.length,
        totalRevenue: orders.reduce((s, o) => s + o.total, 0).toFixed(2),
        totalSavings: orders.reduce((s, o) => s + o.savings, 0).toFixed(2),
        totalUsers: users.length
    }});
});

// ==================== HEALTH ====================

app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'DealHunter API v2.0 ✅', timestamp: new Date(), stats: { deals: deals.length, users: users.length, orders: orders.length } });
});

app.use((err, req, res, next) => { console.error(err.stack); res.status(500).json({ success: false, message: 'Server error' }); });
app.use((req, res) => { res.status(404).json({ success: false, message: 'Route not found' }); });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => { console.log(`\n🚀 DealHunter API v2.0 running on port ${PORT}\n   Auth: register / login / logout / profile / password\n   Deals: 20 seeded | Orders: full flow | Payments: simulated\n`); });
module.exports = app;
