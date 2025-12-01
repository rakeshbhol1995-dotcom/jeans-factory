import React, { useState, useEffect } from 'react';
import { ShoppingCart, X, Menu, Search, Filter, Star, CheckCircle, Trash2, User, LogOut, Package, RefreshCw, CreditCard } from 'lucide-react';

// --- Mock Data ---
const MOCK_PRODUCTS = [
  { id: 1, name: 'Classic Blue Regular Fit', price: 1999, category: 'Regular', gender: 'Men', isSale: false, image: 'https://images.unsplash.com/photo-1542272617-08f086302542?auto=format&fit=crop&q=80&w=600', rating: 4.5 },
  { id: 2, name: 'Urban Black Slim Fit', price: 2499, priceBeforeSale: 3200, category: 'Slim', gender: 'Men', isSale: true, image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=600', rating: 4.8 },
  { id: 3, name: 'Vintage Ripped Boyfriend', price: 2999, category: 'Ripped', gender: 'Women', isSale: false, image: 'https://images.unsplash.com/photo-1576995853123-5a297da40306?auto=format&fit=crop&q=80&w=600', rating: 4.2 },
  { id: 4, name: 'Dark Navy Straight Leg', price: 1899, category: 'Straight', gender: 'Men', isSale: false, image: 'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&q=80&w=600', rating: 4.6 },
  { id: 5, name: 'Light Wash High-Waist', price: 2299, priceBeforeSale: 3000, category: 'Tapered', gender: 'Women', isSale: true, image: 'https://images.unsplash.com/photo-1604176354204-9268737828c4?auto=format&fit=crop&q=80&w=600', rating: 4.3 },
];

export default function App() {
  const [products, setProducts] = useState(MOCK_PRODUCTS);
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null); // User info
  const [token, setToken] = useState(localStorage.getItem('token'));
  
  // Navigation State
  const [view, setView] = useState('home'); // home, cart, login, register, myorders
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [myOrders, setMyOrders] = useState([]);

  // Load User & Products on start
  useEffect(() => {
    if (token) {
        // Simulate getting user details from localStorage
        const savedUser = JSON.parse(localStorage.getItem('user'));
        if(savedUser) setUser(savedUser);
        fetchMyOrders();
    }
    fetchProducts();
  }, [token]);

  const fetchProducts = async () => {
    try {
      const res = await fetch('http://localhost:3002/api/products');
      if (res.ok) {
        const data = await res.json();
        if(data.length > 0) setProducts(data);
      }
    } catch (e) { console.log("Using mock data"); }
  };

  const fetchMyOrders = async () => {
      try {
          const res = await fetch('http://localhost:3002/api/myorders', {
              headers: { 'Authorization': token }
          });
          if(res.ok) {
              const data = await res.json();
              setMyOrders(data);
          }
      } catch(e) {}
  };

  const handleLogin = async (e) => {
      e.preventDefault();
      const email = e.target.email.value;
      const password = e.target.password.value;
      
      try {
          const res = await fetch('http://localhost:3002/api/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password })
          });
          const data = await res.json();
          if(res.ok) {
              localStorage.setItem('token', data.token);
              localStorage.setItem('user', JSON.stringify(data.user));
              setToken(data.token);
              setUser(data.user);
              setView('home');
              fetchMyOrders();
          } else {
              alert(data.error);
          }
      } catch(err) { alert("Login failed"); }
  };

  const handleRegister = async (e) => {
      e.preventDefault();
      const name = e.target.name.value;
      const email = e.target.email.value;
      const password = e.target.password.value;
      const address = e.target.address.value;

      try {
          const res = await fetch('http://localhost:3002/api/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, email, password, address })
          });
          if(res.ok) {
              alert("Registration successful! Please login.");
              setView('login');
          } else {
              const data = await res.json();
              alert(data.error);
          }
      } catch(err) { alert("Registration failed"); }
  };

  const handleLogout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
      setView('home');
  };

  const addToCart = (product) => {
      setCart(prev => {
          const exists = prev.find(item => item.id === product.id);
          if (exists) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
          return [...prev, { ...product, quantity: 1 }];
      });
      alert("Added to cart!");
  };

  const handlePayment = async () => {
      if(!user) {
          alert("Please login to place order");
          setView('login');
          return;
      }
      setProcessingPayment(true);
      
      // Simulate Payment Delay
      setTimeout(async () => {
          try {
              const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
              const res = await fetch('http://localhost:3002/api/orders', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                      token, 
                      cart, 
                      total,
                      name: user.name,
                      email: user.email,
                      address: user.address
                  })
              });
              if(res.ok) {
                  setCart([]);
                  setProcessingPayment(false);
                  alert("Payment Successful! Order Placed.");
                  setView('myorders');
                  fetchMyOrders();
              }
          } catch(err) {
              setProcessingPayment(false);
              alert("Order failed");
          }
      }, 2000);
  };

  const handleReturn = async (orderId) => {
      if(confirm("Do you want to return this order?")) {
          await fetch('http://localhost:3002/api/return', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId })
          });
          fetchMyOrders();
          alert("Return Request Sent");
      }
  };

  const filteredProducts = products.filter(p => selectedCategory === 'All' || p.category === selectedCategory || (selectedCategory === 'Men' && p.gender === 'Men') || (selectedCategory === 'Women' && p.gender === 'Women') || (selectedCategory === 'Sale' && p.isSale));

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 text-gray-500">
                <Menu className="h-6 w-6" />
              </button>
              <span onClick={() => setView('home')} className="text-2xl font-bold text-indigo-900 ml-2 cursor-pointer">Jeans<span className="text-indigo-600">Factory</span></span>
            </div>

            <div className="hidden md:flex space-x-4">
                <button onClick={() => setView('home')} className="text-gray-600 hover:text-indigo-600">Home</button>
                <button onClick={() => { setSelectedCategory('Men'); setView('home'); }} className="text-gray-600 hover:text-indigo-600">Men</button>
                <button onClick={() => { setSelectedCategory('Women'); setView('home'); }} className="text-gray-600 hover:text-indigo-600">Women</button>
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                  <div className="relative group">
                      <button className="flex items-center space-x-1 text-gray-700 hover:text-indigo-600">
                          <User className="h-5 w-5" />
                          <span className="hidden sm:inline">{user.name}</span>
                      </button>
                      <div className="absolute right-0 w-48 bg-white border rounded shadow-lg hidden group-hover:block py-2">
                          <button onClick={() => setView('myorders')} className="block px-4 py-2 hover:bg-gray-100 w-full text-left">My Orders</button>
                          <button onClick={handleLogout} className="block px-4 py-2 hover:bg-gray-100 w-full text-left text-red-600">Logout</button>
                      </div>
                  </div>
              ) : (
                  <button onClick={() => setView('login')} className="text-indigo-600 font-medium">Login</button>
              )}
              <button onClick={() => setView('cart')} className="relative p-2 text-gray-400 hover:text-gray-500">
                <ShoppingCart className="h-6 w-6" />
                {cart.length > 0 && <span className="absolute top-0 right-0 bg-indigo-600 text-white rounded-full px-1.5 text-xs">{cart.reduce((a,c)=>a+c.quantity,0)}</span>}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
             <div className="md:hidden bg-white border-b p-4 space-y-2">
                 <button onClick={() => { setView('home'); setIsMobileMenuOpen(false); }} className="block w-full text-left">Home</button>
                 <button onClick={() => { setSelectedCategory('Men'); setView('home'); setIsMobileMenuOpen(false); }} className="block w-full text-left">Men</button>
                 <button onClick={() => { setSelectedCategory('Women'); setView('home'); setIsMobileMenuOpen(false); }} className="block w-full text-left">Women</button>
                 {user && <button onClick={() => { setView('myorders'); setIsMobileMenuOpen(false); }} className="block w-full text-left font-bold text-indigo-600">My Orders</button>}
             </div>
        )}
      </nav>

      {/* Main Content */}
      <div className="flex-grow">
          
          {/* HOME VIEW */}
          {view === 'home' && (
              <>
                <div className="bg-indigo-900 py-12 px-4 text-center">
                    <h1 className="text-4xl font-extrabold text-white">Premium Denim</h1>
                    <p className="mt-2 text-indigo-200">Quality that fits your lifestyle.</p>
                </div>
                <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map(product => (
                        <div key={product.id} className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition">
                            <div className="h-64 bg-gray-200 rounded overflow-hidden relative">
                                {product.isSale && <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">SALE</span>}
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="mt-4">
                                <h3 className="text-lg font-bold">{product.name}</h3>
                                <p className="text-gray-500 text-sm">{product.category}</p>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-indigo-600 font-bold text-lg">₹{product.price}</span>
                                    <button onClick={() => addToCart(product)} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Add</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
              </>
          )}

          {/* LOGIN VIEW */}
          {view === 'login' && (
              <div className="flex justify-center items-center h-[80vh] px-4">
                  <form onSubmit={handleLogin} className="bg-white p-8 rounded shadow-md w-full max-w-sm space-y-4">
                      <h2 className="text-2xl font-bold text-center">Login</h2>
                      <input name="email" type="email" placeholder="Email" required className="w-full border p-2 rounded" />
                      <input name="password" type="password" placeholder="Password" required className="w-full border p-2 rounded" />
                      <button type="submit" className="w-full bg-indigo-600 text-white p-2 rounded">Sign In</button>
                      <p className="text-center text-sm">New here? <button type="button" onClick={() => setView('register')} className="text-indigo-600">Create Account</button></p>
                  </form>
              </div>
          )}

          {/* REGISTER VIEW */}
          {view === 'register' && (
              <div className="flex justify-center items-center h-[80vh] px-4">
                  <form onSubmit={handleRegister} className="bg-white p-8 rounded shadow-md w-full max-w-sm space-y-4">
                      <h2 className="text-2xl font-bold text-center">Create Account</h2>
                      <input name="name" type="text" placeholder="Full Name" required className="w-full border p-2 rounded" />
                      <input name="email" type="email" placeholder="Email" required className="w-full border p-2 rounded" />
                      <input name="password" type="password" placeholder="Password" required className="w-full border p-2 rounded" />
                      <textarea name="address" placeholder="Delivery Address" required className="w-full border p-2 rounded"></textarea>
                      <button type="submit" className="w-full bg-indigo-600 text-white p-2 rounded">Register</button>
                      <p className="text-center text-sm">Already have an account? <button type="button" onClick={() => setView('login')} className="text-indigo-600">Login</button></p>
                  </form>
              </div>
          )}

          {/* CART VIEW */}
          {view === 'cart' && (
              <div className="max-w-3xl mx-auto px-4 py-8">
                  <h2 className="text-2xl font-bold mb-4">Shopping Cart</h2>
                  {cart.length === 0 ? (
                      <div className="text-center py-10">
                          <p className="text-gray-500">Cart is empty</p>
                          <button onClick={() => setView('home')} className="text-indigo-600 mt-2">Go Shopping</button>
                      </div>
                  ) : (
                      <>
                        <div className="space-y-4">
                            {cart.map(item => (
                                <div key={item.id} className="flex justify-between items-center bg-white p-4 rounded shadow">
                                    <div className="flex items-center space-x-4">
                                        <img src={item.image} className="w-16 h-16 object-cover rounded" />
                                        <div>
                                            <h4 className="font-bold">{item.name}</h4>
                                            <p className="text-sm text-gray-500">₹{item.price} x {item.quantity}</p>
                                        </div>
                                    </div>
                                    <div className="font-bold">₹{item.price * item.quantity}</div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 border-t pt-4">
                            <div className="flex justify-between text-xl font-bold">
                                <span>Total:</span>
                                <span>₹{cart.reduce((s,i)=>s+i.price*i.quantity, 0)}</span>
                            </div>
                            {user ? (
                                <button onClick={handlePayment} disabled={processingPayment} className="w-full mt-4 bg-green-600 text-white py-3 rounded font-bold hover:bg-green-700 flex justify-center items-center">
                                    {processingPayment ? <RefreshCw className="animate-spin mr-2" /> : <CreditCard className="mr-2" />}
                                    {processingPayment ? "Processing..." : "Pay Now"}
                                </button>
                            ) : (
                                <button onClick={() => setView('login')} className="w-full mt-4 bg-indigo-600 text-white py-3 rounded font-bold hover:bg-indigo-700">Login to Checkout</button>
                            )}
                        </div>
                      </>
                  )}
              </div>
          )}

          {/* MY ORDERS VIEW */}
          {view === 'myorders' && (
              <div className="max-w-4xl mx-auto px-4 py-8">
                  <h2 className="text-2xl font-bold mb-6">My Orders</h2>
                  <div className="space-y-6">
                      {myOrders.length === 0 && <p>No orders found.</p>}
                      {myOrders.map(order => (
                          <div key={order._id} className="bg-white p-6 rounded shadow border-l-4 border-indigo-600">
                              <div className="flex justify-between items-start mb-4">
                                  <div>
                                      <p className="text-sm text-gray-500">Order ID: {order._id}</p>
                                      <p className="text-sm text-gray-500">{new Date(order.orderDate).toLocaleDateString()}</p>
                                      <span className={`inline-block px-2 py-1 text-xs rounded mt-2 font-bold ${order.status === 'Returned' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                          {order.status}
                                      </span>
                                  </div>
                                  <div className="text-right">
                                      <p className="font-bold text-xl">₹{order.totalAmount}</p>
                                  </div>
                              </div>
                              <div className="space-y-2">
                                  {order.cartItems.map((item, idx) => (
                                      <div key={idx} className="flex justify-between text-sm">
                                          <span>{item.name} (x{item.quantity})</span>
                                          <span>₹{item.price * item.quantity}</span>
                                      </div>
                                  ))}
                              </div>
                              {order.status !== 'Returned' && (
                                  <button onClick={() => handleReturn(order._id)} className="mt-4 text-red-600 hover:text-red-800 text-sm flex items-center">
                                      <LogOut className="h-4 w-4 mr-1" /> Return Order
                                  </button>
                              )}
                          </div>
                      ))}
                  </div>
              </div>
          )}
      </div>
      
      <footer className="bg-gray-800 text-gray-400 py-8 text-center">
          <p>&copy; 2025 Jeans Factory. All rights reserved.</p>
      </footer>
    </div>
  );
}