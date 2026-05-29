'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Ticket, Calendar, Clock, MapPin, Skull, Film, Loader, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getUserBookings, cancelBooking } from '@/lib/bookings';

export default function TicketsPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedQrBooking, setSelectedQrBooking] = useState(null);

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

  const handleCancelClick = async (booking) => {
    const refundAmount = Math.round(booking.total_price * 0.7);
    const confirmed = window.confirm(
      `Are you sure you want to cancel your booking for "${booking.movie_title}"?\n\n` +
      `Per underworld policies, only 70% (₹${refundAmount.toLocaleString()}) of the total amount (₹${booking.total_price.toLocaleString()}) will be refunded.`
    );
    if (!confirmed) return;

    try {
      setLoading(true);
      setError('');
      const { data, error } = await cancelBooking(booking.id);
      if (error) {
        setError('Failed to cancel booking.');
        console.error(error);
      } else {
        setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: 'refund_initiated' } : b));
      }
    } catch (err) {
      setError('An error occurred during cancellation.');
      console.error(err);
    } finally {
      setLoading(false);
    }
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
                    background: booking.status === 'confirmed' ? 'rgba(74,222,128,0.1)' : 'rgba(234,179,8,0.15)',
                    color: booking.status === 'confirmed' ? '#4ade80' : '#eab308',
                    fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px',
                    border: booking.status === 'confirmed' ? '1px solid rgba(74,222,128,0.2)' : '1px solid rgba(234,179,8,0.3)',
                  }}>
                    {booking.status === 'refund_initiated' ? 'Refund Initiated' : booking.status}
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
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Total</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--blood-bright)' }}>₹{booking.total_price?.toLocaleString()}</div>
                  </div>
                  {booking.status === 'confirmed' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="btn-blood"
                        onClick={() => setSelectedQrBooking(booking)}
                        style={{ 
                          padding: '6px 14px', 
                          fontSize: '0.75rem', 
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer'
                        }}
                      >
                        View Gate Pass
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="btn-ghost"
                        onClick={() => handleCancelClick(booking)}
                        style={{ 
                          padding: '6px 14px', 
                          fontSize: '0.75rem', 
                          color: 'var(--blood-bright)', 
                          borderColor: 'rgba(139, 0, 0, 0.4)',
                          borderWidth: '1px',
                          borderStyle: 'solid',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer'
                        }}
                      >
                        Cancel Booking
                      </motion.button>
                    </div>
                  )}
                  {booking.status === 'refund_initiated' && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'right', fontStyle: 'italic' }}>
                      70% Refund (₹{Math.round(booking.total_price * 0.7).toLocaleString()}) initiated
                    </div>
                  )}
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
            <h4 style={{ fontFamily: "'Cinzel', serif", marginBottom: '6px', color: 'var(--text-primary)' }}>CANCELLATION POLICY</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Need to rewrite your destiny? Cancellations are allowed up to the showtime. A 30% retention fee applies, and 70% of the ticket price will be refunded.</p>
          </motion.div>
        )}
      </div>

      {/* QR Code Modal Overlay */}
      <AnimatePresence>
        {selectedQrBooking && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedQrBooking(null)}
            style={{
              position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.85)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
              backdropFilter: 'blur(5px)'
            }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="glass"
              style={{ padding: '40px', textAlign: 'center', maxWidth: '360px', width: '100%', position: 'relative' }}
            >
              <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: '#fff' }}>{selectedQrBooking.movie_title}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>Scan this at the theater gate</p>
              
              <div style={{ background: '#fff', padding: '20px', display: 'inline-block', borderRadius: '8px', marginBottom: '24px' }}>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${typeof window !== 'undefined' ? window.location.origin : ''}/scan/${selectedQrBooking.id}`} 
                  alt="Gate Entry QR" 
                  width="200" 
                  height="200"
                  style={{ display: 'block' }}
                />
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Booking ID: {selectedQrBooking.id.split('-')[0]}
              </div>

              <button 
                onClick={() => setSelectedQrBooking(null)}
                style={{ 
                  marginTop: '24px', width: '100%', padding: '12px', background: 'transparent',
                  border: '1px solid var(--border-hover)', color: 'var(--text-muted)',
                  borderRadius: 'var(--radius-sm)', cursor: 'pointer'
                }}
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
