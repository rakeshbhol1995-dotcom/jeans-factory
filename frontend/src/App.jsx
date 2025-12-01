import React, { useState, useEffect } from 'react';
import { ShoppingCart, X, Menu, Search, Filter, Star, CheckCircle, Trash2, User, LogOut, Package, RefreshCw, CreditCard, Wifi, WifiOff, Plus, Image as ImageIcon, Heart, LayoutDashboard, KeyRound } from 'lucide-react';

// --- CONFIGURATION ---
const API_URL = "http://localhost:3002";
const CLOUDINARY_CLOUD_NAME = "dxyzsample"; // Tuma Cloud Name
const CLOUDINARY_PRESET = "jeans_upload";   // Tuma Upload Preset

// --- COMPONENTS ---
const Toast = ({ message, type, onClose }) => (
  <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-xl text-white transform transition-all duration-500 flex items-center ${type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
    {type === 'success' ? <CheckCircle className="w-5 h-5 mr-2"/> : <X className="w-5 h-5 mr-2"/>}
    {message}
  </div>
);

const ProductCard = ({ product, addToCart, toggleWishlist, isWishlisted }) => (
  <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
    <div className="relative h-72 bg-gray-100 overflow-hidden">
      {product.isSale && <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full z-10 shadow-md">SALE</span>}
      <button 
        onClick={() => toggleWishlist(product)}
        className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full z-10 hover:bg-white transition-colors"
      >
        <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
      </button>
      <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
      
      <button 
        onClick={() => addToCart(product)}
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-11/12 bg-white text-indigo-900 font-bold py-3 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0 flex justify-center items-center gap-2 hover:bg-indigo-50"
      >
        <ShoppingCart className="w-4 h-4" /> Add to Cart
      </button>
    </div>
    <div className="p-5">
      <div className="flex justify-between items-start mb-2">
        <div>
            <p className="text-xs text-indigo-600 font-semibold tracking-wide uppercase">{product.category}</p>
            <h3 className="font-bold text-gray-900 text-lg leading-tight mt-1">{product.name}</h3>
        </div>
        <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-md">
            <Star className="w-3 h-3 text-yellow-500 fill-current" />
            <span className="text-xs font-bold text-yellow-700 ml-1">{product.rating || 4.5}</span>
        </div>
      </div>
      <div className="flex items-end justify-between mt-4">
        <div>
            {product.isSale && <span className="text-sm text-gray-400 line-through mr-2">₹{Math.round(product.price * 1.2)}</span>}
            <span className="text-2xl font-bold text-indigo-900">₹{product.price}</span>
        </div>
        <span className="text-xs text-gray-500 font-medium">{product.gender}</span>
      </div>
    </div>
  </div>
);

// --- MAIN APP ---
export default function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [user, setUser] = useState(null); 
  const [token, setToken] = useState(localStorage.getItem('token'));
  
  const [view, setView] = useState('home'); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [myOrders, setMyOrders] = useState([]);
  const [backendStatus, setBackendStatus] = useState('Checking...');
  const [toast, setToast] = useState(null); 

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

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

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
    } catch (e) { 
        setBackendStatus('offline');
        showToast("Server Offline - Using Demo Mode", "error");
    }
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
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password })
          });
          const data = await res.json();
          if(res.ok) {
              localStorage.setItem('token', data.token);
              localStorage.setItem('user', JSON.stringify(data.user));
              setToken(data.token); setUser(data.user);
              setView('home'); fetchMyOrders();
              showToast(`Welcome back, ${data.user.name}!`);
          } else { showToast(data.error, "error"); }
      } catch(err) { showToast("Login failed", "error"); }
  };

  const handleRegister = async (e) => {
      e.preventDefault();
      const name = e.target.name.value;
      const email = e.target.email.value;
      const password = e.target.password.value;
      const address = e.target.address.value;

      try {
          const res = await fetch(`${API_URL}/api/register`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, email, password, address })
          });
          if(res.ok) { showToast("Account created! Please login."); setView('login'); } 
          else { const data = await res.json(); showToast(data.error, "error"); }
      } catch(err) { showToast("Registration failed", "error"); }
  };

  // --- RESET PASSWORD FUNCTION ---
  const handleResetPassword = async (e) => {
      e.preventDefault();
      const email = e.target.email.value;
      const newPassword = e.target.newPassword.value;

      try {
          const res = await fetch(`${API_URL}/api/reset-password`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, newPassword })
          });
          const data = await res.json();
          if(res.ok) {
              showToast("Password updated! Please login.");
              setView('login');
          } else {
              showToast(data.error, "error");
          }
      } catch(err) { showToast("Failed to reset password", "error"); }
  };

  const handleLogout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null); setUser(null);
      setView('home');
      showToast("Logged out successfully");
  };

  const addToCart = (product) => {
      setCart(prev => {
          const exists = prev.find(item => item.id === product.id);
          if (exists) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
          return [...prev, { ...product, quantity: 1 }];
      });
      showToast(`${product.name} added to cart!`);
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(item => item.id !== id));

  const toggleWishlist = (product) => {
      setWishlist(prev => {
          const exists = prev.find(item => item.id === product.id);
          if (exists) {
              showToast("Removed from wishlist", "error");
              return prev.filter(item => item.id !== product.id);
          }
          showToast("Added to wishlist");
          return [...prev, product];
      });
  };

  const handleImageUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      setUploadingImage(true);
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", CLOUDINARY_PRESET);
      data.append("cloud_name", CLOUDINARY_CLOUD_NAME);

      try {
          const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
              method: "POST", body: data
          });
          const uploadedImage = await res.json();
          setNewProduct({ ...newProduct, image: uploadedImage.url });
          setUploadingImage(false);
          showToast("Image Uploaded Successfully!");
      } catch (err) {
          console.error(err);
          setUploadingImage(false);
          showToast("Image upload failed", "error");
      }
  };

  const handleAddProduct = async (e) => {
      e.preventDefault();
      if (!newProduct.image) { showToast("Please upload an image first!", "error"); return; }

      try {
          const res = await fetch(`${API_URL}/api/products`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...newProduct, id: Date.now(), rating: 5, isSale: false })
          });
          if(res.ok) {
              showToast("Product Added Successfully!");
              setView('home'); fetchProducts();
              setNewProduct({ name: '', price: '', category: 'Slim', gender: 'Men', image: '' });
          }
      } catch(err) { showToast("Failed to add product", "error"); }
  };

  const handlePayment = async () => {
      if(!user) { showToast("Please login to place order", "error"); setView('login'); return; }
      setProcessingPayment(true);
      setTimeout(async () => {
          try {
              const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
              const res = await fetch(`${API_URL}/api/orders`, {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ token, cart, total, name: user.name, email: user.email, address: user.address })
              });
              if(res.ok) { 
                  setCart([]); setProcessingPayment(false); 
                  showToast("Payment Successful!"); setView('myorders'); fetchMyOrders(); 
              }
          } catch(err) { setProcessingPayment(false); showToast("Order failed", "error"); }
      }, 2000);
  };

  const handleReturn = async (orderId) => {
      if(confirm("Return this order?")) {
          await fetch(`${API_URL}/api/return`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId }) });
          fetchMyOrders(); showToast("Return Request Sent");
      }
  };

  const filteredProducts = products.filter(p => 
    (selectedCategory === 'All' || p.category === selectedCategory || p.gender === selectedCategory) &&
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 flex flex-col">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-4">
            <div className="flex items-center flex-shrink-0">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 mr-2 text-gray-600"><Menu className="h-6 w-6" /></button>
              <span onClick={() => setView('home')} className="text-2xl font-extrabold text-indigo-900 tracking-tighter cursor-pointer">Jeans<span className="text-indigo-600">Factory</span></span>
            </div>

            <div className="hidden md:flex flex-1 max-w-lg mx-4">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input 
                        type="text" placeholder="Search jeans..." 
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                        value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setView('home'); }}
                    />
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {/* Only show "Sell" button if user is admin (Case Insensitive Fix) */}
              {user?.email?.toLowerCase() === "admin@jeans.com" && (
                  <button onClick={() => setView('add_product')} className="hidden sm:flex items-center gap-1 text-indigo-600 font-bold border border-indigo-600 px-3 py-1.5 rounded-full hover:bg-indigo-50 text-sm">
                      <Plus className="w-4 h-4"/> Sell
                  </button>
              )}

              {user ? (
                  <div className="relative group">
                      <button className="flex items-center space-x-1 text-gray-700 hover:text-indigo-600"><User className="h-6 w-6" /></button>
                      <div className="absolute right-0 mt-2 w-48 bg-white border rounded-xl shadow-lg hidden group-hover:block py-1 z-50">
                          <div className="px-4 py-2 bg-gray-50 border-b"><p className="text-xs text-gray-500">Hi, {user.name}</p></div>
                          <button onClick={() => setView('myorders')} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"><Package className="w-4 h-4"/> Orders</button>
                          <button onClick={handleLogout} className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2"><LogOut className="w-4 h-4"/> Logout</button>
                      </div>
                  </div>
              ) : ( <button onClick={() => setView('login')} className="text-indigo-600 font-bold px-3 py-2">Login</button> )}
              
              <button onClick={() => setView('wishlist')} className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Heart className="w-6 h-6 text-gray-600" />
                {wishlist.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">{wishlist.length}</span>}
              </button>

              <button onClick={() => setView('cart')} className="relative p-2 hover:bg-gray-100 rounded-full">
                <ShoppingCart className="h-6 w-6 text-gray-600" />
                {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-indigo-600 text-white rounded-full px-1.5 text-xs border-2 border-white">{cart.reduce((a,c)=>a+c.quantity,0)}</span>}
              </button>
            </div>
          </div>
          
          <div className="md:hidden py-2 pb-3">
             <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input type="text" placeholder="Search..." className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg bg-gray-50 outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
             </div>
          </div>
        </div>
      </nav>

      <div className="flex-grow">
          {view === 'home' && (
              <>
                <div className="bg-white border-b border-gray-100 sticky top-16 z-40 overflow-x-auto no-scrollbar">
                    <div className="max-w-7xl mx-auto px-4 py-3 flex gap-2">
                        {['All', 'Men', 'Women', 'Slim', 'Regular', 'Sale'].map(cat => (
                            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-indigo-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {selectedCategory === 'All' && !searchTerm && (
                    <div className="bg-indigo-900 py-12 px-4 text-center relative overflow-hidden">
                        <div className="relative z-10">
                            <h1 className="text-4xl font-black text-white tracking-tight">PREMIUM <span className="text-indigo-400">DENIM</span></h1>
                            <p className="mt-2 text-indigo-200">Engineered for comfort. Designed for you.</p>
                        </div>
                    </div>
                )}

                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="flex justify-between items-end mb-6">
                        <h2 className="text-xl font-bold text-gray-900">{searchTerm ? `Results for "${searchTerm}"` : `${selectedCategory} Collection`}</h2>
                        <span className="text-sm text-gray-500">{filteredProducts.length} items</span>
                    </div>
                    
                    {filteredProducts.length === 0 ? (
                        <div className="text-center py-20"><p className="text-gray-500">No products found.</p></div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredProducts.map(product => (
                                <ProductCard 
                                    key={product.id} 
                                    product={product} 
                                    addToCart={addToCart} 
                                    toggleWishlist={toggleWishlist}
                                    isWishlisted={wishlist.some(w => w.id === product.id)}
                                />
                            ))}
                        </div>
                    )}
                </div>
              </>
          )}

          {view === 'wishlist' && (
              <div className="max-w-7xl mx-auto px-4 py-8">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                      <Heart className="w-6 h-6 text-red-500 fill-current"/> My Wishlist
                  </h2>
                  {wishlist.length === 0 ? (
                      <div className="text-center py-20 bg-white rounded-2xl">
                          <p className="text-gray-500 mb-4">Your wishlist is empty.</p>
                          <button onClick={() => setView('home')} className="text-indigo-600 font-bold hover:underline">Start Shopping</button>
                      </div>
                  ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                          {wishlist.map(product => (
                              <ProductCard 
                                  key={product.id} 
                                  product={product} 
                                  addToCart={addToCart} 
                                  toggleWishlist={toggleWishlist}
                                  isWishlisted={true}
                              />
                          ))}
                      </div>
                  )}
              </div>
          )}

          {/* ADMIN */}
          {view === 'add_product' && (
              <div className="max-w-2xl mx-auto px-4 py-8">
                  <div className="bg-white p-8 rounded-2xl shadow-lg border border-indigo-50">
                      <div className="flex items-center gap-3 mb-6 border-b pb-4">
                          <LayoutDashboard className="w-8 h-8 text-indigo-600"/>
                          <div><h2 className="text-2xl font-bold">Admin Dashboard</h2><p className="text-sm text-gray-500">Add new inventory</p></div>
                      </div>
                      <form onSubmit={handleAddProduct} className="space-y-5">
                          <div className="grid grid-cols-2 gap-4">
                              <input type="text" placeholder="Product Name" required className="w-full border p-3 rounded-lg" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                              <input type="number" placeholder="Price (₹)" required className="w-full border p-3 rounded-lg" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <select className="w-full border p-3 rounded-lg" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})}>
                                  <option value="Slim">Slim Fit</option>
                                  <option value="Regular">Regular Fit</option>
                                  <option value="Skinny">Skinny Fit</option>
                              </select>
                              <select className="w-full border p-3 rounded-lg" value={newProduct.gender} onChange={e => setNewProduct({...newProduct, gender: e.target.value})}>
                                  <option value="Men">Men</option>
                                  <option value="Women">Women</option>
                              </select>
                          </div>
                          <div className="border-2 border-dashed p-6 rounded-xl text-center bg-gray-50">
                              {uploadingImage ? <p className="text-indigo-600 animate-pulse">Uploading...</p> : 
                               newProduct.image ? <div className="relative inline-block"><img src={newProduct.image} className="h-32 rounded-lg shadow" /><button type="button" onClick={() => setNewProduct({...newProduct, image: ''})} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X className="w-4 h-4"/></button></div> :
                               <label className="cursor-pointer block"><ImageIcon className="mx-auto text-gray-400 w-10 h-10 mb-2"/><span className="text-sm font-bold text-indigo-600">Click to Upload Image</span><input type="file" className="hidden" onChange={handleImageUpload} /></label>
                              }
                          </div>
                          <button type="submit" disabled={uploadingImage} className="w-full bg-indigo-900 text-white py-4 rounded-xl font-bold hover:bg-indigo-800 shadow-lg">{uploadingImage ? "Processing..." : "Publish Product"}</button>
                      </form>
                  </div>
              </div>
          )}

          {/* AUTH (LOGIN/REGISTER/FORGOT PASSWORD) */}
          {(view === 'login' || view === 'register' || view === 'forgot_password') && (
              <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 bg-gray-50">
                  <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
                      <div className="text-center mb-8">
                          <h2 className="text-3xl font-extrabold">
                              {view === 'login' ? 'Welcome Back' : view === 'register' ? 'Join Us' : 'Reset Password'}
                          </h2>
                      </div>
                      
                      {/* LOGIN FORM */}
                      {view === 'login' && (
                          <form onSubmit={handleLogin} className="space-y-4">
                              <input name="email" type="email" placeholder="Email" required className="w-full border p-3 rounded-lg" />
                              <input name="password" type="password" placeholder="Password" required className="w-full border p-3 rounded-lg" />
                              <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold">Sign In</button>
                              <div className="flex justify-between mt-4 text-sm">
                                  <button type="button" onClick={() => setView('register')} className="text-indigo-600 font-medium">Create Account</button>
                                  <button type="button" onClick={() => setView('forgot_password')} className="text-gray-500 hover:text-gray-700">Forgot Password?</button>
                              </div>
                          </form>
                      )}

                      {/* REGISTER FORM */}
                      {view === 'register' && (
                          <form onSubmit={handleRegister} className="space-y-4">
                              <input name="name" type="text" placeholder="Full Name" required className="w-full border p-3 rounded-lg" />
                              <input name="email" type="email" placeholder="Email" required className="w-full border p-3 rounded-lg" />
                              <input name="password" type="password" placeholder="Password" required className="w-full border p-3 rounded-lg" />
                              <textarea name="address" placeholder="Address" required className="w-full border p-3 rounded-lg" />
                              <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold">Sign Up</button>
                              <button type="button" onClick={() => setView('login')} className="text-indigo-600 text-sm w-full text-center mt-4">Back to Login</button>
                          </form>
                      )}

                      {/* FORGOT PASSWORD FORM */}
                      {view === 'forgot_password' && (
                          <form onSubmit={handleResetPassword} className="space-y-4">
                              <div className="bg-yellow-50 p-3 rounded text-xs text-yellow-800 mb-4 border border-yellow-200">
                                  Note: For this demo, just enter your email and a new password directly.
                              </div>
                              <input name="email" type="email" placeholder="Enter your email" required className="w-full border p-3 rounded-lg" />
                              <input name="newPassword" type="password" placeholder="Enter New Password" required className="w-full border p-3 rounded-lg" />
                              <button type="submit" className="w-full bg-green-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2">
                                  <KeyRound className="w-4 h-4"/> Reset Password
                              </button>
                              <button type="button" onClick={() => setView('login')} className="text-indigo-600 text-sm w-full text-center mt-4">Back to Login</button>
                          </form>
                      )}
                  </div>
              </div>
          )}

          {/* CART VIEW */}
          {view === 'cart' && (
              <div className="max-w-4xl mx-auto px-4 py-8">
                  <h2 className="text-3xl font-bold mb-8 flex items-center gap-2"><ShoppingCart className="w-8 h-8"/> Cart</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-2 space-y-4">
                          {cart.length === 0 ? <div className="text-center py-12 bg-white rounded-xl"><p className="text-gray-500 mb-4">Cart empty</p><button onClick={() => setView('home')} className="text-indigo-600 font-bold border border-indigo-600 px-6 py-2 rounded-full">Shop Now</button></div> : 
                              cart.map(item => (
                                  <div key={item.id} className="flex gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                      <img src={item.image} className="w-24 h-24 object-cover rounded-lg bg-gray-100" />
                                      <div className="flex-1"><h3 className="font-bold">{item.name}</h3><p className="text-sm text-gray-500 mb-2">{item.category}</p><div className="flex justify-between items-center"><span className="font-bold text-indigo-600">₹{item.price * item.quantity}</span><button onClick={() => removeFromCart(item.id)} className="text-red-500 p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4"/></button></div></div>
                                  </div>
                              ))
                          }
                      </div>
                      {cart.length > 0 && (
                          <div className="lg:col-span-1"><div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24"><h3 className="font-bold text-lg mb-4">Summary</h3><div className="space-y-2 mb-4 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>₹{cart.reduce((s,i)=>s+i.price*i.quantity, 0)}</span></div><div className="flex justify-between"><span>Shipping</span><span className="text-green-600">Free</span></div></div><div className="border-t pt-4 mb-6"><div className="flex justify-between font-bold text-xl"><span>Total</span><span>₹{cart.reduce((s,i)=>s+i.price*i.quantity, 0)}</span></div></div>{user ? <button onClick={handlePayment} disabled={processingPayment} className="w-full bg-green-600 text-white py-3.5 rounded-xl font-bold shadow-lg flex justify-center items-center gap-2">{processingPayment ? <RefreshCw className="animate-spin w-5 h-5"/> : <CreditCard className="w-5 h-5"/>}{processingPayment ? "Processing..." : "Pay Now"}</button> : <button onClick={() => setView('login')} className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold shadow-lg">Login to Checkout</button>}</div></div>
                      )}
                  </div>
              </div>
          )}

          {/* MY ORDERS */}
          {view === 'myorders' && (
              <div className="max-w-3xl mx-auto px-4 py-8">
                  <h2 className="text-3xl font-bold mb-8">History</h2>
                  <div className="space-y-6">
                      {myOrders.length === 0 && <p className="text-gray-500">No orders found.</p>}
                      {myOrders.map(order => (
                          <div key={order._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                              <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center"><div><p className="text-xs text-gray-500 uppercase font-bold">Order ID</p><p className="text-sm font-mono">#{order._id.slice(-6)}</p></div><div className="text-right"><p className="text-xs text-gray-500 uppercase font-bold">Total</p><p className="font-bold text-indigo-900">₹{order.totalAmount}</p></div></div>
                              <div className="p-6">
                                  <div className="flex items-center gap-3 mb-6"><span className={`text-sm font-bold px-3 py-1 rounded-full ${order.status === 'Returned' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>{order.status || 'Processing'}</span></div>
                                  <div className="space-y-3">{order.cartItems.map((item, idx) => (<div key={idx} className="flex justify-between items-center text-sm"><span className="text-gray-700 font-medium">{item.quantity} x {item.name}</span><span className="text-gray-900">₹{item.price * item.quantity}</span></div>))}</div>
                                  {order.status !== 'Returned' && <button onClick={() => handleReturn(order._id)} className="mt-4 text-red-600 hover:text-red-800 text-sm flex items-center font-medium"><LogOut className="h-4 w-4 mr-1" /> Return Order</button>}
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}
      </div>
      
      <footer className="bg-gray-900 text-gray-400 py-12 mt-12 text-center"><p>&copy; 2025 Jeans Factory. All rights reserved.</p></footer>
    </div>
  );
}