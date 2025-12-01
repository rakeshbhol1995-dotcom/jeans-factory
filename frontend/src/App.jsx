import React, { useState, useEffect } from 'react';
import { ShoppingCart, X, Menu, Search, Filter, Star, CheckCircle, Trash2, User, LogOut, Package, RefreshCw, CreditCard, Wifi, WifiOff, Plus, Image as ImageIcon } from 'lucide-react';

// --- LIVE BACKEND URL ---
const API_URL = "https://jeans-factory.onrender.com"; 

export default function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null); 
  const [token, setToken] = useState(localStorage.getItem('token'));
  
  const [view, setView] = useState('home'); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [myOrders, setMyOrders] = useState([]);
  const [backendStatus, setBackendStatus] = useState('Checking...');

  // --- Add Product States ---
  const [newProduct, setNewProduct] = useState({ name: '', price: '', category: 'Slim', gender: 'Men', image: '' });
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (token) {
        const savedUser = JSON.parse(localStorage.getItem('user'));
        if(savedUser) setUser(savedUser);
        fetchMyOrders();
    }
    fetchProducts();
  }, [token]);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/products`);
      if (res.ok) {
        const data = await res.json();
        if(data.length > 0) {
            setProducts(data);
            setBackendStatus('online');
        } else {
            setBackendStatus('empty');
        }
      } else { setBackendStatus('offline'); }
    } catch (e) { setBackendStatus('offline'); }
  };

  const fetchMyOrders = async () => {
      try {
          const res = await fetch(`${API_URL}/api/myorders`, { headers: { 'Authorization': token } });
          if(res.ok) { const data = await res.json(); setMyOrders(data); }
      } catch(e) {}
  };

  const handleLogin = async (e) => {
      e.preventDefault();
      const email = e.target.email.value;
      const password = e.target.password.value;
      
      try {
          const res = await fetch(`${API_URL}/api/login`, {
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
          } else { alert(data.error); }
      } catch(err) { alert("Login failed"); }
  };

  const handleRegister = async (e) => {
      e.preventDefault();
      const name = e.target.name.value;
      const email = e.target.email.value;
      const password = e.target.password.value;
      const address = e.target.address.value;

      try {
          const res = await fetch(`${API_URL}/api/register`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, email, password, address })
          });
          if(res.ok) { alert("Registration successful! Please login."); setView('login'); } 
          else { const data = await res.json(); alert(data.error); }
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

  // --- IMAGE UPLOAD FUNCTION ---
  const handleImageUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      setUploadingImage(true);
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", "jeans_upload"); // ⚠️ Cloudinary Preset Name eithi Dia
      data.append("cloud_name", "dxyzsample"); // ⚠️ Cloudinary Cloud Name eithi Dia

      try {
          // Replace 'dxyzsample' with your actual Cloud Name
          const res = await fetch("https://api.cloudinary.com/v1_1/dxyzsample/image/upload", {
              method: "POST",
              body: data
          });
          const uploadedImage = await res.json();
          setNewProduct({ ...newProduct, image: uploadedImage.url });
          setUploadingImage(false);
      } catch (err) {
          console.error(err);
          setUploadingImage(false);
          alert("Image upload failed");
      }
  };

  const handleAddProduct = async (e) => {
      e.preventDefault();
      if (!newProduct.image) { alert("Please upload an image first!"); return; }

      try {
          const res = await fetch(`${API_URL}/api/products`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  ...newProduct, 
                  id: Date.now(), // Unique ID based on time
                  rating: 4.5,
                  isSale: false
              })
          });
          if(res.ok) {
              alert("Product Added Successfully!");
              setView('home');
              fetchProducts();
              setNewProduct({ name: '', price: '', category: 'Slim', gender: 'Men', image: '' });
          }
      } catch(err) { alert("Failed to add product"); }
  };

  const handlePayment = async () => {
      if(!user) { alert("Please login to place order"); setView('login'); return; }
      setProcessingPayment(true);
      setTimeout(async () => {
          try {
              const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
              const res = await fetch(`${API_URL}/api/orders`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ token, cart, total, name: user.name, email: user.email, address: user.address })
              });
              if(res.ok) { setCart([]); setProcessingPayment(false); alert("Payment Successful!"); setView('myorders'); fetchMyOrders(); }
          } catch(err) { setProcessingPayment(false); alert("Order failed"); }
      }, 2000);
  };

  const handleReturn = async (orderId) => {
      if(confirm("Return this order?")) {
          await fetch(`${API_URL}/api/return`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId }) });
          fetchMyOrders(); alert("Return Request Sent");
      }
  };

  const filteredProducts = products.filter(p => selectedCategory === 'All' || p.category === selectedCategory || (selectedCategory === 'Men' && p.gender === 'Men') || (selectedCategory === 'Women' && p.gender === 'Women'));

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 flex flex-col">
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 text-gray-500"><Menu className="h-6 w-6" /></button>
              <span onClick={() => setView('home')} className="text-2xl font-bold text-indigo-900 ml-2 cursor-pointer">Jeans<span className="text-indigo-600">Factory</span></span>
            </div>
            <div className="hidden md:flex space-x-4">
                <button onClick={() => setView('home')} className="text-gray-600 hover:text-indigo-600">Home</button>
                <button onClick={() => { setSelectedCategory('Men'); setView('home'); }} className="text-gray-600 hover:text-indigo-600">Men</button>
                <button onClick={() => { setSelectedCategory('Women'); setView('home'); }} className="text-gray-600 hover:text-indigo-600">Women</button>
                <button onClick={() => setView('add_product')} className="text-indigo-600 font-bold border border-indigo-600 px-2 py-1 rounded hover:bg-indigo-50">+ Sell Jeans</button>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                  <div className="relative group">
                      <button className="flex items-center space-x-1 text-gray-700 hover:text-indigo-600"><User className="h-5 w-5" /><span className="hidden sm:inline">{user.name}</span></button>
                      <div className="absolute right-0 w-48 bg-white border rounded shadow-lg hidden group-hover:block py-2">
                          <button onClick={() => setView('myorders')} className="block px-4 py-2 hover:bg-gray-100 w-full text-left">My Orders</button>
                          <button onClick={handleLogout} className="block px-4 py-2 hover:bg-gray-100 w-full text-left text-red-600">Logout</button>
                      </div>
                  </div>
              ) : ( <button onClick={() => setView('login')} className="text-indigo-600 font-medium">Login</button> )}
              <button onClick={() => setView('cart')} className="relative p-2 text-gray-400 hover:text-gray-500">
                <ShoppingCart className="h-6 w-6" />
                {cart.length > 0 && <span className="absolute top-0 right-0 bg-indigo-600 text-white rounded-full px-1.5 text-xs">{cart.reduce((a,c)=>a+c.quantity,0)}</span>}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-grow">
          {view === 'home' && (
              <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map(product => (
                      <div key={product.id} className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition">
                          <div className="h-64 bg-gray-200 rounded overflow-hidden relative">
                              {product.isSale && <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">SALE</span>}
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="mt-4">
                              <h3 className="text-lg font-bold">{product.name}</h3>
                              <p className="text-gray-500 text-sm">{product.category} ({product.gender})</p>
                              <div className="flex justify-between items-center mt-2">
                                  <span className="text-indigo-600 font-bold text-lg">₹{product.price}</span>
                                  <button onClick={() => addToCart(product)} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Add</button>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          )}

          {/* ADD PRODUCT VIEW */}
          {view === 'add_product' && (
              <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded shadow">
                  <h2 className="text-2xl font-bold mb-6">Add New Jeans</h2>
                  <form onSubmit={handleAddProduct} className="space-y-4">
                      <input type="text" placeholder="Product Name" required className="w-full border p-2 rounded" 
                          value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                      
                      <div className="flex gap-4">
                          <input type="number" placeholder="Price (₹)" required className="w-full border p-2 rounded" 
                              value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
                          <select className="w-full border p-2 rounded" value={newProduct.gender} onChange={e => setNewProduct({...newProduct, gender: e.target.value})}>
                              <option value="Men">Men</option>
                              <option value="Women">Women</option>
                          </select>
                      </div>

                      <select className="w-full border p-2 rounded" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})}>
                          <option value="Slim">Slim Fit</option>
                          <option value="Regular">Regular Fit</option>
                          <option value="Skinny">Skinny Fit</option>
                      </select>

                      {/* Image Upload */}
                      <div className="border-2 border-dashed p-4 rounded text-center">
                          {uploadingImage ? <p className="text-indigo-600">Uploading...</p> : 
                           newProduct.image ? <img src={newProduct.image} className="h-32 mx-auto object-cover" /> :
                           <label className="cursor-pointer">
                               <ImageIcon className="mx-auto text-gray-400 mb-2"/>
                               <span className="text-sm text-gray-500">Click to Upload Image</span>
                               <input type="file" className="hidden" onChange={handleImageUpload} />
                           </label>
                          }
                      </div>

                      <button type="submit" disabled={uploadingImage} className="w-full bg-green-600 text-white p-2 rounded font-bold hover:bg-green-700">
                          {uploadingImage ? "Wait..." : "Save Product"}
                      </button>
                  </form>
              </div>
          )}

          {/* LOGIN & REGISTER & CART & ORDERS (Same as before) */}
          {view === 'login' && (
              <div className="flex justify-center items-center h-[80vh] px-4">
                  <form onSubmit={handleLogin} className="bg-white p-8 rounded shadow-md w-full max-w-sm space-y-4">
                      <h2 className="text-2xl font-bold">Login</h2>
                      <input name="email" type="email" placeholder="Email" required className="w-full border p-2 rounded" />
                      <input name="password" type="password" placeholder="Password" required className="w-full border p-2 rounded" />
                      <button type="submit" className="w-full bg-indigo-600 text-white p-2 rounded">Sign In</button>
                      <button type="button" onClick={() => setView('register')} className="text-indigo-600 text-sm w-full text-center">Create Account</button>
                  </form>
              </div>
          )}
          {view === 'register' && (
              <div className="flex justify-center items-center h-[80vh] px-4">
                  <form onSubmit={handleRegister} className="bg-white p-8 rounded shadow-md w-full max-w-sm space-y-4">
                      <h2 className="text-2xl font-bold">Register</h2>
                      <input name="name" type="text" placeholder="Name" required className="w-full border p-2 rounded" />
                      <input name="email" type="email" placeholder="Email" required className="w-full border p-2 rounded" />
                      <input name="password" type="password" placeholder="Password" required className="w-full border p-2 rounded" />
                      <textarea name="address" placeholder="Address" required className="w-full border p-2 rounded" />
                      <button type="submit" className="w-full bg-indigo-600 text-white p-2 rounded">Sign Up</button>
                      <button type="button" onClick={() => setView('login')} className="text-indigo-600 text-sm w-full text-center">Back to Login</button>
                  </form>
              </div>
          )}
          {view === 'cart' && (
              <div className="max-w-3xl mx-auto px-4 py-8">
                  <h2 className="text-2xl font-bold mb-4">Cart</h2>
                  {cart.map(item => (
                      <div key={item.id} className="flex justify-between items-center bg-white p-4 rounded shadow mb-2">
                          <div>{item.name} (x{item.quantity})</div>
                          <div className="font-bold">₹{item.price * item.quantity}</div>
                      </div>
                  ))}
                  {cart.length > 0 && <button onClick={handlePayment} disabled={processingPayment} className="w-full mt-4 bg-green-600 text-white py-3 rounded">{processingPayment ? "Processing..." : "Pay Now"}</button>}
              </div>
          )}
          {view === 'myorders' && (
              <div className="max-w-4xl mx-auto px-4 py-8">
                  <h2 className="text-2xl font-bold mb-6">My Orders</h2>
                  {myOrders.map(order => (
                      <div key={order._id} className="bg-white p-6 rounded shadow mb-4">
                          <p className="font-bold">Order ID: {order._id}</p>
                          <p>Total: ₹{order.totalAmount}</p>
                          <p>Status: {order.status}</p>
                          {order.status !== 'Returned' && <button onClick={() => handleReturn(order._id)} className="text-red-600 text-sm mt-2">Return</button>}
                      </div>
                  ))}
              </div>
          )}
      </div>
    </div>
  );
}