'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, ShieldAlert, CheckCircle, Ticket } from 'lucide-react';
import { getBookingById, scanBooking } from '@/lib/bookings';

export default function ScanPage({ params }) {
  const router = useRouter();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scanProcessing, setScanProcessing] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState([]);

  useEffect(() => {
    async function fetchBooking() {
      const { data, error } = await getBookingById(params.id);
      if (error || !data) {
        setError('Booking not found or invalid QR code.');
      } else {
        setBooking(data);
      }
      setLoading(false);
    }
    fetchBooking();
  }, [params.id]);

  const toggleSeat = (seat) => {
    setSelectedSeats(prev => 
      prev.includes(seat) ? prev.filter(s => s !== seat) : [...prev, seat]
    );
  };

  const handleScan = async () => {
    if (!booking || selectedSeats.length === 0) return;
    
    setScanProcessing(true);
    await new Promise(r => setTimeout(r, 800));

    const { data, error } = await scanBooking(booking.id, booking.scanned_count, selectedSeats.length);
    
    if (error) {
      setError('Failed to scan ticket. Please try again.');
    } else if (data) {
      setBooking(data);
      setSelectedSeats([]);
    }
    
    setScanProcessing(false);
  };

  if (loading) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div style={{ color: 'var(--blood)', fontFamily: "'Cinzel', serif", fontSize: '1.5rem' }}>Accessing Gate Protocols...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div className="glass" style={{ padding: '40px', textAlign: 'center', maxWidth: '400px' }}>
          <ShieldAlert size={48} color="var(--blood-bright)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Access Denied</h2>
          <p style={{ color: 'var(--text-muted)' }}>{error}</p>
        </div>
      </div>
    );
  }

  const totalTickets = booking.seats.length;
  const remainingTickets = totalTickets - (booking.scanned_count || 0);
  const gateClosed = remainingTickets <= 0;

  return (
    <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '20px' }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass" 
        style={{ width: '100%', maxWidth: '450px', padding: '40px', position: 'relative', overflow: 'hidden' }}
      >
        {gateClosed && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'var(--blood)' }} />
        )}

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ 
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', 
            width: '64px', height: '64px', borderRadius: '50%', 
            background: gateClosed ? 'var(--blood-subtle)' : 'rgba(74, 222, 128, 0.1)', 
            color: gateClosed ? 'var(--blood-bright)' : '#4ade80',
            marginBottom: '16px'
          }}>
            {gateClosed ? <ShieldAlert size={32} /> : <CheckCircle size={32} />}
          </div>
          <h1 className="creepy-font" style={{ fontSize: '2rem', marginBottom: '8px' }}>
            Gate Scanner
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Booking ID: <span style={{ fontFamily: 'monospace' }}>{booking.id.split('-')[0]}</span>
          </p>
        </div>

        <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: 'var(--radius-md)', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            {booking.movie_title}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.9rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Date & Time</span>
              {booking.show_date} • {booking.show_time}
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Theater</span>
              {booking.theater_name}
            </div>
          </div>
        </div>

        {/* Ticket Selector */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
            Select Tickets to Scan
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {booking.seats.map((seat, index) => {
              const isAlreadyScanned = index < (booking.scanned_count || 0);
              const isSelected = selectedSeats.includes(seat);
              
              return (
                <div 
                  key={seat}
                  onClick={() => !isAlreadyScanned && toggleSeat(seat)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', borderRadius: 'var(--radius-sm)',
                    background: isAlreadyScanned ? 'rgba(0,0,0,0.2)' : (isSelected ? 'rgba(139,0,0,0.1)' : 'var(--bg-secondary)'),
                    border: `1px solid ${isAlreadyScanned ? 'transparent' : (isSelected ? 'var(--blood)' : 'var(--border-color)')}`,
                    cursor: isAlreadyScanned ? 'not-allowed' : 'pointer',
                    opacity: isAlreadyScanned ? 0.6 : 1,
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                      width: '20px', height: '20px', borderRadius: '4px',
                      border: `1px solid ${isAlreadyScanned ? '#666' : (isSelected ? 'var(--blood)' : 'var(--border-hover)')}`,
                      background: isAlreadyScanned ? '#4ade80' : (isSelected ? 'var(--blood)' : 'transparent'),
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {(isAlreadyScanned || isSelected) && <Check size={14} color={isAlreadyScanned ? '#000' : '#fff'} />}
                    </div>
                    <span style={{ fontWeight: 600 }}>Seat {seat}</span>
                  </div>
                  {isAlreadyScanned && (
                    <span style={{ fontSize: '0.75rem', color: '#4ade80', fontWeight: 600 }}>SCANNED</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <button 
          onClick={handleScan}
          disabled={gateClosed || scanProcessing || selectedSeats.length === 0}
          style={{ 
            width: '100%', padding: '16px', fontSize: '1.1rem', fontWeight: 600,
            background: (gateClosed || selectedSeats.length === 0) ? 'var(--bg-secondary)' : 'var(--blood)',
            color: (gateClosed || selectedSeats.length === 0) ? 'var(--text-muted)' : '#fff',
            border: 'none', borderRadius: 'var(--radius-sm)',
            cursor: (gateClosed || selectedSeats.length === 0) ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
          }}
        >
          {scanProcessing ? (
            'Processing...'
          ) : gateClosed ? (
            'All Tickets Scanned'
          ) : selectedSeats.length === 0 ? (
            'Select a ticket'
          ) : (
            <>Confirm Scan ({selectedSeats.length}) <Check size={20} /></>
          )}
        </button>

      </motion.div>
    </div>
  );
}
