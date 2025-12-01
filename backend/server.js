const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;
const SECRET_KEY = "super-secret-key-jeans-factory"; // Real app re .env re rakhiba

app.use(cors());
app.use(bodyParser.json());

// --- Database Connection ---
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rakeshbhol1995_db_user:jeans123@cluster0.s5wqb4d.mongodb.net/jeansfactory?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.log('❌ DB Error:', err));

// --- Schemas ---
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    address: String
});

const productSchema = new mongoose.Schema({
    id: Number,
    name: String,
    price: Number,
    priceBeforeSale: Number,
    category: String,
    gender: String,
    isSale: Boolean,
    image: String,
    rating: Number
});

const orderSchema = new mongoose.Schema({
    userId: String, // User sangare link kariba pain
    customerName: String,
    email: String,
    address: String,
    cartItems: Array,
    totalAmount: Number,
    status: { type: String, default: 'Ordered' }, // Ordered, Delivered, Returned
    orderDate: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);

// --- Routes ---

// 1. Get Products
app.get('/api/products', async (req, res) => {
    const products = await Product.find();
    res.json(products);
});

// 2. Register User
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password, address } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword, address });
        await newUser.save();
        res.status(201).json({ message: "User created successfully" });
    } catch (err) {
        res.status(400).json({ error: "Email already exists" });
    }
});

// 3. Login User
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

        const token = jwt.sign({ userId: user._id, name: user.name, email: user.email, address: user.address }, SECRET_KEY);
        res.json({ token, user: { name: user.name, email: user.email, address: user.address } });
    } catch (err) {
        res.status(500).json({ error: "Login failed" });
    }
});

// 4. Place Order (Protected)
app.post('/api/orders', async (req, res) => {
    const { token, cart, total, name, email, address } = req.body;
    try {
        // Verify user if logged in (Optional: Allow guest checkout too, but here we enforce login for tracking)
        const decoded = jwt.verify(token, SECRET_KEY);
        
        const newOrder = new Order({
            userId: decoded.userId,
            customerName: name,
            email: email,
            address: address,
            cartItems: cart,
            totalAmount: total
        });
        await newOrder.save();
        res.json({ message: "Order placed" });
    } catch (err) {
        res.status(401).json({ error: "Unauthorized" });
    }
});

// 5. Get User Orders
app.get('/api/myorders', async (req, res) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ error: "No token" });

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const orders = await Order.find({ userId: decoded.userId }).sort({ orderDate: -1 });
        res.json(orders);
    } catch (err) {
        res.status(401).json({ error: "Invalid token" });
    }
});

// 6. Return Order
app.post('/api/return', async (req, res) => {
    const { orderId } = req.body;
    await Order.findByIdAndUpdate(orderId, { status: 'Returned' });
    res.json({ message: "Order returned" });
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));