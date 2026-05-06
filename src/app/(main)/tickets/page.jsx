'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Ticket, Calendar, Clock, MapPin, Skull, Film, Loader, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getUserBookings } from '@/lib/bookings';

export default function TicketsPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login?redirect=/tickets');
      return;
    }

    async function fetchBookings() {
      setLoading(true);
      const { data, error } = await getUserBookings(user.id);
      if (error) {
        setError('Failed to load bookings.');
        console.error(error);
      } else {
        setBookings(data);
      }
      setLoading(false);
    }

    fetchBookings();
  }, [user, authLoading, router]);

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/';
  };

  if (authLoading || loading) {
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

  return (
    <div className="page-wrapper">
      <div className="container" style={{ padding: '32px 24px 80px', maxWidth: '800px' }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}
        >
          <div>
            <h1 style={{ fontSize: '2.2rem', marginBottom: '4px' }}>My Bookings</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'} found
              {user && <span> • {user.email}</span>}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-ghost"
            onClick={handleLogout}
            style={{ fontSize: '0.85rem' }}
          >
            <LogOut size={14} /> Sign Out
          </motion.button>
        </motion.div>

        {/* Error State */}
        {error && (
          <div style={{ padding: '16px', background: 'var(--blood-subtle)', border: '1px solid var(--border-hover)', borderRadius: 'var(--radius-md)', marginBottom: '24px', color: 'var(--blood-bright)', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        {/* Empty State */}
        {bookings.length === 0 && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', padding: '80px 0' }}
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              style={{ marginBottom: '20px' }}
            >
              <Ticket size={56} color="var(--text-muted)" />
            </motion.div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>No Bookings Yet</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>You haven't sealed your fate with any screenings.</p>
            <button className="btn-blood" onClick={() => router.push('/movies')} style={{ padding: '12px 28px' }}>
              Browse Movies
            </button>
          </motion.div>
        )}

        {/* Bookings List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {bookings.map((booking, index) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="ticket-card"
              whileHover={{ scale: 1.01 }}
            >
              {/* Top section */}
              <div style={{ padding: '24px 28px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <h3 className="creepy-font" style={{ fontSize: '1.5rem', marginBottom: '8px', color: '#fff' }}>
                      {booking.movie_title}
                    </h3>
                    <div style={{ display: 'flex', gap: '16px', color: 'var(--text-muted)', fontSize: '0.85rem', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={14} /> {booking.theater_name}
                      </span>
                    </div>
                  </div>
                  <div style={{
                    padding: '4px 12px', borderRadius: 'var(--radius-sm)',
                    background: booking.status === 'confirmed' ? 'rgba(74,222,128,0.1)' : 'var(--blood-subtle)',
                    color: booking.status === 'confirmed' ? '#4ade80' : 'var(--blood-bright)',
                    fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px',
                  }}>
                    {booking.status}
                  </div>
                </div>
              </div>

              <hr className="ticket-divider" />

              {/* Bottom section */}
              <div style={{ padding: '18px 28px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Date</div>
                    <div style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} color="var(--blood)" />
                      {new Date(booking.show_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Time</div>
                    <div style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={14} color="var(--blood)" /> {booking.show_time}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Seats</div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {(booking.seats || []).map(s => (
                        <span key={s} style={{
                          padding: '2px 10px', background: 'var(--blood-subtle)',
                          border: '1px solid var(--border-hover)', borderRadius: '4px',
                          fontSize: '0.85rem', fontWeight: 600
                        }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Total</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--blood-bright)' }}>₹{booking.total_price?.toLocaleString()}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Warning */}
        {bookings.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{
              marginTop: '48px', textAlign: 'center', padding: '24px',
              border: '1px dashed var(--border-hover)', borderRadius: 'var(--radius-lg)',
              background: 'var(--blood-subtle)',
            }}
          >
            <Skull size={32} color="var(--blood)" style={{ marginBottom: '12px' }} />
            <h4 style={{ fontFamily: "'Cinzel', serif", marginBottom: '6px', color: 'var(--text-primary)' }}>NO CANCELLATIONS</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Once booked, your fate is sealed. Refunds are not available in the underworld.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
