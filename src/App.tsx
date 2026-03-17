import React, { useState, useEffect } from 'react';
import { 
  Car, 
  User, 
  Building2, 
  LogIn, 
  LogOut, 
  Plus, 
  Edit, 
  Calendar, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface UserData {
  id: number;
  name: string;
  role: 'customer' | 'agency';
}

interface CarData {
  id: number;
  agency_id: number;
  model: string;
  vehicle_number: string;
  seating_capacity: number;
  rent_per_day: number;
}

interface BookingData {
  id: number;
  car_id: number;
  customer_name: string;
  customer_email: string;
  model: string;
  vehicle_number: string;
  start_date: string;
  days: number;
  total_rent: number;
}

export default function App() {
  const [user, setUser] = useState<UserData | null>(null);
  const [view, setView] = useState<'home' | 'login' | 'register' | 'agency-dashboard' | 'view-bookings'>('home');
  const [roleToRegister, setRoleToRegister] = useState<'customer' | 'agency'>('customer');
  const [cars, setCars] = useState<CarData[]>([]);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form States
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [carForm, setCarForm] = useState({ id: null as number | null, model: '', vehicle_number: '', seating_capacity: 4, rent_per_day: 0 });
  const [bookingForm, setBookingForm] = useState<{ [key: number]: { days: number, startDate: string } }>({});

  useEffect(() => {
    checkAuth();
    fetchCars();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/me');
      const data = await res.json();
      setUser(data);
      if (data?.role === 'agency') {
        fetchAgencyBookings();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCars = async () => {
    try {
      const res = await fetch('/api/cars');
      const data = await res.json();
      setCars(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAgencyBookings = async () => {
    try {
      const res = await fetch('/api/agency/bookings');
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAuth = async (e: React.FormEvent, type: 'login' | 'register') => {
    e.preventDefault();
    setError(null);
    const url = type === 'login' ? '/api/login' : '/api/register';
    const body = type === 'login' 
      ? { email: authForm.email, password: authForm.password }
      : { ...authForm, role: roleToRegister };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      if (type === 'login') {
        setUser(data);
        setView('home');
        if (data.role === 'agency') fetchAgencyBookings();
      } else {
        setView('login');
        alert('Registration successful! Please login.');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    setUser(null);
    setView('home');
  };

  const handleCarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = carForm.id ? 'PUT' : 'POST';
    const url = carForm.id ? `/api/cars/${carForm.id}` : '/api/cars';
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(carForm)
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      fetchCars();
      setCarForm({ id: null, model: '', vehicle_number: '', seating_capacity: 4, rent_per_day: 0 });
      alert(carForm.id ? 'Car updated!' : 'Car added!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRent = async (carId: number) => {
    if (!user) {
      setView('login');
      return;
    }
    if (user.role === 'agency') {
      alert('Agencies cannot rent cars.');
      return;
    }

    const booking = bookingForm[carId];
    if (!booking || !booking.days || !booking.startDate) {
      alert('Please select rental days and start date.');
      return;
    }

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          car_id: carId,
          start_date: booking.startDate,
          days: booking.days
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      alert('Car rented successfully!');
      setBookingForm(prev => ({ ...prev, [carId]: { days: 0, startDate: '' } }));
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
      {/* Navigation */}
      <nav className="bg-white border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('home')}>
              <div className="bg-emerald-600 p-2 rounded-lg text-white">
                <Car size={24} />
              </div>
              <span className="text-xl font-bold tracking-tight">SwiftRent</span>
            </div>
            
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <span className="text-sm font-medium text-stone-600 hidden sm:inline">
                    Welcome, <span className="text-stone-900">{user.name}</span>
                  </span>
                  {user.role === 'agency' && (
                    <>
                      <button 
                        onClick={() => setView('agency-dashboard')}
                        className={`text-sm font-medium px-3 py-2 rounded-md transition ${view === 'agency-dashboard' ? 'bg-stone-100 text-emerald-700' : 'text-stone-600 hover:text-emerald-600'}`}
                      >
                        Manage Fleet
                      </button>
                      <button 
                        onClick={() => { setView('view-bookings'); fetchAgencyBookings(); }}
                        className={`text-sm font-medium px-3 py-2 rounded-md transition ${view === 'view-bookings' ? 'bg-stone-100 text-emerald-700' : 'text-stone-600 hover:text-emerald-600'}`}
                      >
                        Bookings
                      </button>
                    </>
                  )}
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-sm font-medium text-red-600 hover:bg-red-50 px-3 py-2 rounded-md transition"
                  >
                    <LogOut size={18} />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => setView('login')}
                    className="text-sm font-medium text-stone-600 hover:text-emerald-600 transition"
                  >
                    Login
                  </button>
                  <button 
                    onClick={() => { setView('register'); setRoleToRegister('customer'); }}
                    className="bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-emerald-700 transition shadow-sm"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {/* Home View: Available Cars */}
          {view === 'home' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              key="home"
            >
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-stone-900 mb-2">Available Cars</h1>
                <p className="text-stone-500">Find the perfect ride for your next journey.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cars.map(car => (
                  <div key={car.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition group">
                    <div className="h-48 bg-stone-100 flex items-center justify-center relative">
                      <Car size={64} className="text-stone-300 group-hover:scale-110 transition duration-500" />
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-emerald-700 border border-emerald-100">
                        ${car.rent_per_day}/day
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-stone-900">{car.model}</h3>
                          <p className="text-sm text-stone-500 font-mono uppercase tracking-wider">{car.vehicle_number}</p>
                        </div>
                        <div className="flex items-center gap-1 text-stone-600 bg-stone-50 px-2 py-1 rounded">
                          <User size={14} />
                          <span className="text-xs font-medium">{car.seating_capacity} Seats</span>
                        </div>
                      </div>

                      {user?.role === 'customer' || !user ? (
                        <div className="space-y-4">
                          {user?.role === 'customer' && (
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Days</label>
                                <select 
                                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                  value={bookingForm[car.id]?.days || 0}
                                  onChange={(e) => setBookingForm(prev => ({ ...prev, [car.id]: { ...prev[car.id], days: parseInt(e.target.value) } }))}
                                >
                                  <option value="0">Select</option>
                                  {[1, 2, 3, 4, 5, 6, 7, 14, 30].map(d => <option key={d} value={d}>{d} days</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Start Date</label>
                                <input 
                                  type="date" 
                                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                  value={bookingForm[car.id]?.startDate || ''}
                                  onChange={(e) => setBookingForm(prev => ({ ...prev, [car.id]: { ...prev[car.id], startDate: e.target.value } }))}
                                />
                              </div>
                            </div>
                          )}
                          <button 
                            onClick={() => handleRent(car.id)}
                            disabled={user?.role === 'agency'}
                            className={`w-full py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 ${user?.role === 'agency' ? 'bg-stone-100 text-stone-400 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'}`}
                          >
                            <Calendar size={18} />
                            Rent Car
                          </button>
                        </div>
                      ) : (
                        <div className="bg-stone-50 p-3 rounded-xl border border-stone-100 flex items-center gap-2 text-stone-500 text-sm">
                          <AlertCircle size={16} />
                          Agencies cannot rent cars
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Login/Register View */}
          {(view === 'login' || view === 'register') && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key="auth"
              className="max-w-md mx-auto mt-12"
            >
              <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-xl">
                <div className="text-center mb-8">
                  <div className="inline-block p-3 bg-emerald-50 rounded-2xl text-emerald-600 mb-4">
                    {view === 'login' ? <LogIn size={32} /> : <User size={32} />}
                  </div>
                  <h2 className="text-2xl font-bold text-stone-900">{view === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
                  <p className="text-stone-500 text-sm mt-1">
                    {view === 'login' ? 'Login to manage your rentals' : 'Join our car rental community'}
                  </p>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex items-center gap-2">
                    <AlertCircle size={18} />
                    {error}
                  </div>
                )}

                <form onSubmit={(e) => handleAuth(e, view as 'login' | 'register')} className="space-y-4">
                  {view === 'register' && (
                    <>
                      <div className="flex p-1 bg-stone-100 rounded-xl mb-4">
                        <button 
                          type="button"
                          onClick={() => setRoleToRegister('customer')}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition ${roleToRegister === 'customer' ? 'bg-white text-emerald-600 shadow-sm' : 'text-stone-500'}`}
                        >
                          <User size={16} /> Customer
                        </button>
                        <button 
                          type="button"
                          onClick={() => setRoleToRegister('agency')}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition ${roleToRegister === 'agency' ? 'bg-white text-emerald-600 shadow-sm' : 'text-stone-500'}`}
                        >
                          <Building2 size={16} /> Agency
                        </button>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Full Name</label>
                        <input 
                          required
                          type="text" 
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition"
                          placeholder="John Doe"
                          value={authForm.name}
                          onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                        />
                      </div>
                    </>
                  )}
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Email Address</label>
                    <input 
                      required
                      type="email" 
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition"
                      placeholder="john@example.com"
                      value={authForm.email}
                      onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Password</label>
                    <input 
                      required
                      type="password" 
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition"
                      placeholder="••••••••"
                      value={authForm.password}
                      onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-100 mt-4"
                  >
                    {view === 'login' ? 'Sign In' : 'Create Account'}
                  </button>
                </form>

                <div className="mt-8 text-center text-sm text-stone-500">
                  {view === 'login' ? (
                    <p>Don't have an account? <button onClick={() => setView('register')} className="text-emerald-600 font-bold hover:underline">Sign Up</button></p>
                  ) : (
                    <p>Already have an account? <button onClick={() => setView('login')} className="text-emerald-600 font-bold hover:underline">Sign In</button></p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Agency Dashboard: Manage Fleet */}
          {view === 'agency-dashboard' && user?.role === 'agency' && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              key="agency"
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-stone-900">Fleet Management</h1>
                  <p className="text-stone-500">Add and manage your rental vehicles.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Add/Edit Form */}
                <div className="lg:col-span-1">
                  <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm sticky top-24">
                    <h2 className="text-lg font-bold text-stone-900 mb-6 flex items-center gap-2">
                      {carForm.id ? <Edit size={20} className="text-emerald-600" /> : <Plus size={20} className="text-emerald-600" />}
                      {carForm.id ? 'Edit Vehicle' : 'Add New Vehicle'}
                    </h2>
                    <form onSubmit={handleCarSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Model Name</label>
                        <input 
                          required
                          type="text" 
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition"
                          placeholder="Tesla Model 3"
                          value={carForm.model}
                          onChange={(e) => setCarForm({ ...carForm, model: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Vehicle Number</label>
                        <input 
                          required
                          type="text" 
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition"
                          placeholder="ABC-1234"
                          value={carForm.vehicle_number}
                          onChange={(e) => setCarForm({ ...carForm, vehicle_number: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Seats</label>
                          <input 
                            required
                            type="number" 
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition"
                            value={carForm.seating_capacity}
                            onChange={(e) => setCarForm({ ...carForm, seating_capacity: parseInt(e.target.value) })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Rent/Day ($)</label>
                          <input 
                            required
                            type="number" 
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition"
                            value={carForm.rent_per_day}
                            onChange={(e) => setCarForm({ ...carForm, rent_per_day: parseFloat(e.target.value) })}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button 
                          type="submit"
                          className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition shadow-sm"
                        >
                          {carForm.id ? 'Update Car' : 'Add to Fleet'}
                        </button>
                        {carForm.id && (
                          <button 
                            type="button"
                            onClick={() => setCarForm({ id: null, model: '', vehicle_number: '', seating_capacity: 4, rent_per_day: 0 })}
                            className="px-4 py-3 bg-stone-100 text-stone-600 rounded-xl font-bold hover:bg-stone-200 transition"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                </div>

                {/* Fleet List */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-stone-100">
                      <h2 className="font-bold text-stone-900">Your Fleet</h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-stone-50 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                            <th className="px-6 py-4">Vehicle</th>
                            <th className="px-6 py-4">Number</th>
                            <th className="px-6 py-4">Capacity</th>
                            <th className="px-6 py-4">Daily Rent</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {cars.filter(c => c.agency_id === user.id).map(car => (
                            <tr key={car.id} className="hover:bg-stone-50 transition group">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-stone-100 rounded-lg text-stone-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition">
                                    <Car size={18} />
                                  </div>
                                  <span className="font-bold text-stone-900">{car.model}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm font-mono text-stone-500">{car.vehicle_number}</td>
                              <td className="px-6 py-4 text-sm text-stone-600">{car.seating_capacity} Seats</td>
                              <td className="px-6 py-4 text-sm font-bold text-emerald-700">${car.rent_per_day}</td>
                              <td className="px-6 py-4 text-right">
                                <button 
                                  onClick={() => setCarForm({ ...car })}
                                  className="p-2 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                                >
                                  <Edit size={18} />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {cars.filter(c => c.agency_id === user.id).length === 0 && (
                            <tr>
                              <td colSpan={5} className="px-6 py-12 text-center text-stone-400 italic">
                                No vehicles in your fleet yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Agency View: Bookings */}
          {view === 'view-bookings' && user?.role === 'agency' && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              key="bookings"
              className="space-y-8"
            >
              <div>
                <h1 className="text-3xl font-bold text-stone-900">Rental Bookings</h1>
                <p className="text-stone-500">Track who has booked your vehicles.</p>
              </div>

              <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-stone-50 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Vehicle</th>
                        <th className="px-6 py-4">Rental Period</th>
                        <th className="px-6 py-4">Total Revenue</th>
                        <th className="px-6 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {bookings.map(booking => (
                        <tr key={booking.id} className="hover:bg-stone-50 transition">
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-bold text-stone-900">{booking.customer_name}</div>
                              <div className="text-xs text-stone-400">{booking.customer_email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-bold text-stone-700">{booking.model}</div>
                              <div className="text-xs font-mono text-stone-400">{booking.vehicle_number}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-sm text-stone-600">
                              <Calendar size={14} className="text-stone-400" />
                              <span>{booking.start_date}</span>
                              <ChevronRight size={12} className="text-stone-300" />
                              <Clock size={14} className="text-stone-400 ml-1" />
                              <span>{booking.days} days</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-bold text-emerald-700">${booking.total_rent}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider rounded-full">
                              <CheckCircle2 size={10} /> Confirmed
                            </span>
                          </td>
                        </tr>
                      ))}
                      {bookings.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-stone-400 italic">
                            No bookings found for your vehicles.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-emerald-600 p-1.5 rounded text-white">
                  <Car size={18} />
                </div>
                <span className="text-lg font-bold tracking-tight">SwiftRent</span>
              </div>
              <p className="text-stone-500 text-sm max-w-xs">
                The most reliable platform for car rentals. Connecting agencies with customers seamlessly.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-widest mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-stone-500">
                <li><button onClick={() => setView('home')} className="hover:text-emerald-600 transition">Browse Cars</button></li>
                <li><button onClick={() => setView('register')} className="hover:text-emerald-600 transition">Join as Agency</button></li>
                <li><button onClick={() => setView('register')} className="hover:text-emerald-600 transition">Join as Customer</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-widest mb-4">Trust</h4>
              <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                <ShieldCheck size={18} />
                <span>Verified Agencies</span>
              </div>
            </div>
          </div>
          <div className="border-t border-stone-100 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-stone-400">© 2026 SwiftRent Agency. All rights reserved.</p>
            <div className="flex gap-6 text-xs text-stone-400">
              <a href="#" className="hover:text-stone-600">Privacy Policy</a>
              <a href="#" className="hover:text-stone-600">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
