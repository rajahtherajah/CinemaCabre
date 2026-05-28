'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Loader, ShieldAlert, Skull, TrendingUp, Users, Film, Search, 
  RefreshCw, LogOut, ArrowLeft, Calendar, Ticket 
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getAllBookings } from '@/lib/bookings';

export default function AdminDashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [movieFilter, setMovieFilter] = useState('all');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.email !== 'admin@admin.com') {
      router.push('/login?redirect=/admin');
      return;
    }

    async function fetchAllBookingsData() {
      setLoading(true);
      setError('');
      try {
        const { data, error } = await getAllBookings();
        if (error) {
          setError('Failed to fetch system bookings.');
          console.error(error);
        } else {
          setBookings(data || []);
        }
      } catch (err) {
        setError('An unexpected error occurred while fetching bookings.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchAllBookingsData();
  }, [user, authLoading, router, refreshTrigger]);

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/';
  };

  // Auth/Loading check
  if (authLoading || (!user && loading)) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader size={32} color="var(--blood)" />
        </motion.div>
      </div>
    );
  }

  if (user && user.email !== 'admin@admin.com') {
    return (
      <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div className="glass" style={{ padding: '40px', textAlign: 'center', maxWidth: '450px', border: '1px solid var(--blood)' }}>
          <ShieldAlert size={48} color="var(--blood-bright)" style={{ marginBottom: '16px', marginInline: 'auto' }} />
          <h2 style={{ fontFamily: "'Cinzel', serif", color: '#fff', marginBottom: '12px' }}>Access Denied</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: '1.5' }}>
            Your soul does not possess the credentials to enter the Admin sanctum.
          </p>
          <button className="btn-blood" onClick={() => router.push('/')}>
            <ArrowLeft size={16} /> Return to Sanctum
          </button>
        </div>
      </div>
    );
  }

  // Aggregate Metrics
  const totalBookings = bookings.length;
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
  const totalTickets = bookings.reduce((sum, b) => sum + (b.seats ? b.seats.length : 0), 0);
  const averageTicketPrice = totalBookings ? Math.round(totalRevenue / totalBookings) : 0;

  // Extract unique movies for filter dropdown
  const uniqueMovies = Array.from(new Set(bookings.map(b => b.movie_title)));

  // Filter & Search Logic
  const filteredBookings = bookings.filter(b => {
    const matchesSearch = 
      (b.movie_title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.theater_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.user_email || b.user_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.id || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesMovie = movieFilter === 'all' || b.movie_title === movieFilter;

    return matchesSearch && matchesMovie;
  });

  return (
    <div className="page-wrapper">
      <div className="container" style={{ padding: '40px 24px 80px', maxWidth: '1200px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '40px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <ShieldAlert size={24} color="var(--blood-bright)" />
              <h1 style={{ fontSize: '2.4rem', fontFamily: "'Cinzel', serif", margin: 0, letterSpacing: '1px' }}>Admin Dashboard</h1>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              System-wide ticket logs & real-time booking metrics
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              className="btn-ghost" 
              onClick={() => setRefreshTrigger(prev => prev + 1)}
              style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Refresh Logs"
            >
              <RefreshCw size={16} className={loading ? 'spin-animation' : ''} />
            </button>
            <button className="btn-blood" onClick={handleLogout} style={{ fontSize: '0.85rem', gap: '8px' }}>
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{ padding: '16px', background: 'rgba(139, 0, 0, 0.2)', border: '1px solid var(--blood)', borderRadius: 'var(--radius-md)', marginBottom: '24px', color: 'var(--blood-bright)', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
          marginBottom: '40px'
        }}>
          {/* Stat 1: Total Revenue */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="glass" 
            style={{ padding: '24px', position: 'relative', overflow: 'hidden', borderLeft: '4px solid var(--blood)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Revenue</span>
              <TrendingUp size={20} color="var(--blood-bright)" />
            </div>
            <h2 style={{ fontSize: '2rem', margin: 0, fontFamily: "'Cinzel', serif" }}>₹{totalRevenue.toLocaleString()}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '4px 0 0' }}>Cumulative ticket sales + fees</p>
          </motion.div>

          {/* Stat 2: Total Bookings */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="glass" 
            style={{ padding: '24px', position: 'relative', overflow: 'hidden', borderLeft: '4px solid var(--blood)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Bookings</span>
              <Ticket size={20} color="var(--blood-bright)" />
            </div>
            <h2 style={{ fontSize: '2rem', margin: 0, fontFamily: "'Cinzel', serif" }}>{totalBookings}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '4px 0 0' }}>Successful checkout operations</p>
          </motion.div>

          {/* Stat 3: Tickets Sold */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="glass" 
            style={{ padding: '24px', position: 'relative', overflow: 'hidden', borderLeft: '4px solid var(--blood)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tickets Sold</span>
              <Users size={20} color="var(--blood-bright)" />
            </div>
            <h2 style={{ fontSize: '2rem', margin: 0, fontFamily: "'Cinzel', serif" }}>{totalTickets}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '4px 0 0' }}>Allocated theatre seats</p>
          </motion.div>

          {/* Stat 4: Avg Order Price */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="glass" 
            style={{ padding: '24px', position: 'relative', overflow: 'hidden', borderLeft: '4px solid var(--blood)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Avg Checkout Value</span>
              <Skull size={20} color="var(--blood-bright)" />
            </div>
            <h2 style={{ fontSize: '2rem', margin: 0, fontFamily: "'Cinzel', serif" }}>₹{averageTicketPrice.toLocaleString()}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '4px 0 0' }}>Average billing per session</p>
          </motion.div>
        </div>

        {/* Filters Controls Panel */}
        <div className="glass" style={{ padding: '20px', marginBottom: '30px', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <Search size={16} />
            </span>
            <input 
              type="text"
              className="input-dark"
              placeholder="Search by Movie, Theater, User Email, Booking ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', paddingLeft: '40px', fontSize: '0.9rem' }}
            />
          </div>

          {/* Filter dropdowns */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Filter by Movie:</label>
            <select
              className="input-dark"
              value={movieFilter}
              onChange={(e) => setMovieFilter(e.target.value)}
              style={{ minWidth: '180px', padding: '10px 14px', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              <option value="all">All Movies</option>
              {uniqueMovies.map(movieTitle => (
                <option key={movieTitle} value={movieTitle}>{movieTitle}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bookings Logs Table */}
        <div className="glass" style={{ overflow: 'hidden', padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontFamily: "'Cinzel', serif", margin: 0, fontSize: '1.2rem', color: '#fff' }}>Booking Ledger</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Showing {filteredBookings.length} of {bookings.length} records
            </span>
          </div>

          {loading ? (
            <div style={{ padding: '60px', display: 'flex', justifyContent: 'center' }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                <Loader size={24} color="var(--blood)" />
              </motion.div>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div style={{ padding: '80px 24px', textAlign: 'center' }}>
              <Film size={40} color="var(--text-muted)" style={{ marginBottom: '16px', marginInline: 'auto', opacity: 0.4 }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>No bookings match the search criteria.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 600 }}>Booking ID</th>
                    <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 600 }}>Username</th>
                    <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 600 }}>Movie & Theater</th>
                    <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 600 }}>Show Details</th>
                    <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 600 }}>Seats</th>
                    <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'right' }}>Paid Amount</th>
                    <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'right' }}>Booking Date</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filteredBookings.map((b) => {
                      const displayId = b.id.startsWith('mock-booking-') 
                        ? b.id.replace('mock-booking-', '#') 
                        : b.id.substring(0, 8).toUpperCase();
                      const displayUsername = b.user_username || b.user_email?.split('@')[0] || (b.user_id === 'admin-user-id' ? 'Admin Demonic' : `User_${b.user_id.substring(0, 6)}`);
                      const displayEmail = b.user_email || (b.user_id === 'admin-user-id' ? 'admin@admin.com' : '');
                      
                      return (
                        <tr 
                          key={b.id} 
                          style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.2s' }}
                          className="table-row-hover"
                        >
                          {/* Booking ID */}
                          <td style={{ padding: '16px 24px', fontFamily: 'monospace', color: 'var(--blood-bright)', fontWeight: 600 }}>
                            {displayId}
                          </td>
                          {/* Username & Email */}
                          <td style={{ padding: '16px 24px' }}>
                            <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem', marginBottom: '2px' }}>
                              {displayUsername}
                            </div>
                            {displayEmail && (
                              <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                                {displayEmail}
                              </div>
                            )}
                          </td>
                          {/* Movie & Theater */}
                          <td style={{ padding: '16px 24px' }}>
                            <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem', marginBottom: '2px' }}>{b.movie_title}</div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{b.theater_name}</div>
                          </td>
                          {/* Showtime Details */}
                          <td style={{ padding: '16px 24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fff', marginBottom: '2px' }}>
                              <Calendar size={12} color="var(--text-muted)" />
                              <span>{b.show_date}</span>
                            </div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', paddingLeft: '18px' }}>
                              {b.show_time}
                            </div>
                          </td>
                          {/* Seats */}
                          <td style={{ padding: '16px 24px' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '150px' }}>
                              {b.seats.map((seat) => (
                                <span 
                                  key={seat} 
                                  style={{ 
                                    padding: '2px 6px', 
                                    background: 'rgba(139, 0, 0, 0.15)', 
                                    border: '1px solid rgba(139, 0, 0, 0.4)', 
                                    borderRadius: '3px', 
                                    fontSize: '0.7rem', 
                                    color: 'var(--blood-bright)',
                                    fontWeight: 500
                                  }}
                                >
                                  {seat}
                                </span>
                              ))}
                            </div>
                          </td>
                          {/* Status */}
                          <td style={{ padding: '16px 24px' }}>
                            <span style={{ 
                              padding: '4px 10px', 
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              background: b.status === 'confirmed' ? 'rgba(74,222,128,0.1)' : 'rgba(234,179,8,0.15)',
                              color: b.status === 'confirmed' ? '#4ade80' : '#eab308',
                              border: b.status === 'confirmed' ? '1px solid rgba(74,222,128,0.2)' : '1px solid rgba(234,179,8,0.3)',
                            }}>
                              {b.status === 'refund_initiated' ? 'Refund Initiated' : b.status}
                            </span>
                          </td>
                          {/* Total Paid Amount */}
                          <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>
                            ₹{b.total_price.toLocaleString()}
                          </td>
                          {/* Booking Date */}
                          <td style={{ padding: '16px 24px', textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                            {new Date(b.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </td>
                        </tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      <style jsx global>{`
        .table-row-hover:hover {
          background-color: rgba(255, 255, 255, 0.02) !important;
        }
        .spin-animation {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
