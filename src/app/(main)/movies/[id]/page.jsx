'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Star, Clock, Film, Users, Calendar, MapPin, ChevronRight, Ticket, AlertTriangle, Skull, CreditCard, Wallet, Smartphone, Building, Check, Loader } from 'lucide-react';
import { movies, theaters, showtimes, getNextDates } from '@/data/movies';
import { useAuth } from '@/context/AuthContext';
import { createBooking } from '@/lib/bookings';

const STEPS = { INFO: 0, SHOWTIME: 1, SEATS: 2, PAYMENT: 3, SUMMARY: 4 };

// Generate random sold seats
const generateSoldSeats = () => {
  const sold = new Set();
  const count = Math.floor(Math.random() * 15) + 5;
  for (let i = 0; i < count; i++) {
    sold.add(Math.floor(Math.random() * 80) + 1);
  }
  return sold;
};

export default function MovieDetailPage({ params }) {
  const router = useRouter();
  const { user } = useAuth();
  const movie = movies.find(m => m.id === params.id) || movies[0];
  const dates = useMemo(() => getNextDates(7), []);
  const soldSeats = useMemo(() => generateSoldSeats(), []);

  const [step, setStep] = useState(STEPS.INFO);
  const [selectedDate, setSelectedDate] = useState(dates[0].full);
  const [selectedTheater, setSelectedTheater] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [upiId, setUpiId] = useState('');
  const [selectedBank, setSelectedBank] = useState('SBI');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentStepMessage, setPaymentStepMessage] = useState('');

  const seatRows = [
    { label: 'NORMAL', rows: ['A', 'B', 'C', 'D', 'E'], cols: 16, priceKey: 'normal' },
    { label: 'EXECUTIVE', rows: ['F', 'G', 'H', 'I'], cols: 16, priceKey: 'executive' },
    { label: 'PREMIUM', rows: ['J', 'K', 'L'], cols: 16, priceKey: 'premium' },
  ];

  const toggleSeat = (seatId) => {
    if (soldSeats.has(parseInt(seatId.split('-')[1]))) return;
    setSelectedSeats(prev =>
      prev.includes(seatId) ? prev.filter(s => s !== seatId) : [...prev, seatId]
    );
  };

  const getSeatPrice = (seatId) => {
    const row = seatId.split('-')[0];
    for (const section of seatRows) {
      if (section.rows.includes(row)) return movie.price[section.priceKey];
    }
    return 0;
  };

  const totalPrice = selectedSeats.reduce((sum, s) => sum + getSeatPrice(s), 0);

  // Billing breakdown calculations
  const ticketSubtotal = totalPrice;
  const convenienceFee = 30 * selectedSeats.length;
  const cgst = Math.round(convenienceFee * 0.09 * 100) / 100;
  const sgst = Math.round(convenienceFee * 0.09 * 100) / 100;
  const grandTotal = Math.round(ticketSubtotal + convenienceFee + cgst + sgst);

  const handlePayment = async () => {
    if (!user) {
      router.push(`/login?redirect=/movies/${movie.id}`);
      return;
    }

    setPaymentProcessing(true);
    setBookingError('');

    const messages = [
      "Securing connection with payment gateway...",
      "Authorizing transaction credentials...",
      "Exchanging security tokens...",
      "Confirming payment with banking servers..."
    ];

    for (let i = 0; i < messages.length; i++) {
      setPaymentStepMessage(messages[i]);
      await new Promise(r => setTimeout(r, 1000));
    }

    setPaymentStepMessage("Sealing your fate...");
    await new Promise(r => setTimeout(r, 800));

    const theaterObj = theaters.find(t => t.id === selectedTheater);
    const { data, error } = await createBooking({
      userId: user.id,
      movieId: movie.id,
      movieTitle: movie.title,
      theaterName: theaterObj?.name || 'Unknown',
      showDate: selectedDate,
      showTime: selectedTime,
      seats: selectedSeats,
      totalPrice: grandTotal,
    });

    if (error) {
      console.error('Booking error:', error);
      setBookingError(error.message || 'Booking failed. Please try again.');
      setPaymentProcessing(false);
      return;
    }

    setStep(STEPS.SUMMARY);
    setPaymentProcessing(false);
  };

  const handleStartBooking = () => {
    if (!user) {
      router.push(`/login?redirect=/movies/${movie.id}`);
      return;
    }
    setStep(STEPS.SHOWTIME);
  };

  const stepVariants = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, x: -40, transition: { duration: 0.25 } },
  };

  return (
    <div className="page-wrapper">

      {/* ===== BACKDROP ===== */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '50vh', zIndex: -1,
        backgroundImage: `url(${movie.banner})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        filter: 'blur(30px) brightness(0.2) saturate(0.6)',
        maskImage: 'linear-gradient(to bottom, black, transparent)',
        WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)',
      }} />

      <div className="container" style={{ paddingBottom: '100px' }}>

        {/* ===== MOVIE INFO HEADER ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', gap: '32px', marginBottom: '40px', flexWrap: 'wrap' }}
        >
          {/* Poster */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            style={{ flex: '0 0 260px' }}
          >
            <img
              src={movie.image}
              alt={movie.title}
              style={{
                width: '100%', borderRadius: 'var(--radius-lg)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
                border: '1px solid var(--border)',
              }}
            />
          </motion.div>

          {/* Details */}
          <div style={{ flex: '1 1 400px', paddingTop: '8px' }}>
            <h1 className="creepy-font" style={{ fontSize: '3rem', marginBottom: '12px', color: '#fff' }}>
              {movie.title}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <span className="rating-badge" style={{ fontSize: '0.9rem', padding: '4px 12px' }}>
                <Star size={14} fill="#4ade80" /> {movie.rating}/5
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{movie.votes} votes</span>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <span className="genre-tag" style={{ fontSize: '0.85rem' }}><Clock size={12} style={{ marginRight: '4px' }} />{movie.duration}</span>
              {movie.genre.map(g => <span key={g} className="genre-tag" style={{ fontSize: '0.85rem' }}>{g}</span>)}
              <span className="genre-tag" style={{ fontSize: '0.85rem' }}>{movie.language}</span>
              <span className="genre-tag" style={{ fontSize: '0.85rem', color: 'var(--blood-bright)' }}>{movie.certification}</span>
            </div>

            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '24px', fontSize: '0.95rem' }}>
              {movie.synopsis}
            </p>

            <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <div><span style={{ color: 'var(--text-secondary)' }}>Director:</span> {movie.director}</div>
              <div><span style={{ color: 'var(--text-secondary)' }}>Cast:</span> {movie.cast.join(', ')}</div>
            </div>

            {step === STEPS.INFO && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-blood"
                style={{ padding: '14px 36px', fontSize: '1rem' }}
                onClick={handleStartBooking}
              >
                <Ticket size={18} /> {user ? 'Book Tickets' : 'Sign In to Book'}
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* ===== BOOKING FLOW ===== */}
        <AnimatePresence mode="wait">

          {/* STEP 1: SELECT DATE + SHOWTIME */}
          {step === STEPS.SHOWTIME && (
            <motion.div key="showtime" variants={stepVariants} initial="enter" animate="center" exit="exit">
              <div className="glass" style={{ padding: '32px' }}>

                {/* Date Picker */}
                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.3rem' }}>
                  <Calendar size={20} color="var(--blood)" /> Select Date
                </h3>
                <div className="date-picker" style={{ marginBottom: '36px' }}>
                  {dates.map(d => (
                    <motion.button
                      key={d.full}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`date-chip ${selectedDate === d.full ? 'date-chip-active' : ''}`}
                      onClick={() => setSelectedDate(d.full)}
                    >
                      <span className="date-chip-day">{d.isToday ? 'TODAY' : d.day}</span>
                      <span className="date-chip-date">{d.date}</span>
                      <span className="date-chip-month">{d.month}</span>
                    </motion.button>
                  ))}
                </div>

                {/* Theaters + Showtimes */}
                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.3rem' }}>
                  <MapPin size={20} color="var(--blood)" /> Select Theater & Showtime
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {theaters.map(theater => (
                    <div key={theater.id} style={{
                      padding: '20px 24px',
                      background: 'var(--bg-card)',
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${selectedTheater === theater.id ? 'var(--border-hover)' : 'var(--border)'}`,
                      transition: 'var(--transition)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <div>
                          <h4 style={{ fontFamily: "'Cinzel', serif", fontSize: '1.1rem', marginBottom: '4px' }}>{theater.name}</h4>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{theater.location} • {theater.screens} Screens</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {showtimes.map(time => {
                          const isActive = selectedTheater === theater.id && selectedTime === time;
                          return (
                            <motion.button
                              key={time}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className={`showtime-btn ${isActive ? 'showtime-btn-active' : ''}`}
                              onClick={() => { setSelectedTheater(theater.id); setSelectedTime(time); }}
                            >
                              {time}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
                  <motion.button
                    whileHover={selectedTime ? { scale: 1.02 } : {}}
                    whileTap={selectedTime ? { scale: 0.98 } : {}}
                    className="btn-blood"
                    disabled={!selectedTime}
                    onClick={() => setStep(STEPS.SEATS)}
                    style={{ padding: '12px 32px' }}
                  >
                    Select Seats <ChevronRight size={16} />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: SEAT SELECTION */}
          {step === STEPS.SEATS && (
            <motion.div key="seats" variants={stepVariants} initial="enter" animate="center" exit="exit">
              <div className="glass" style={{ padding: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.3rem' }}>
                    <Users size={20} color="var(--blood)" /> Select Seats
                  </h3>
                  <button className="btn-ghost" onClick={() => setStep(STEPS.SHOWTIME)} style={{ fontSize: '0.85rem' }}>
                    ← Change Showtime
                  </button>
                </div>

                {/* Screen indicator */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <div style={{
                    width: '60%', maxWidth: '400px', height: '6px', margin: '0 auto 12px',
                    background: 'linear-gradient(90deg, transparent, var(--blood), transparent)',
                    borderRadius: '0 0 50% 50%',
                    boxShadow: '0 0 30px var(--blood-glow), 0 0 60px rgba(139,0,0,0.1)',
                  }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '3px', textTransform: 'uppercase' }}>
                    Screen This Way
                  </span>
                </div>

                {/* Seat Map */}
                <div style={{ overflowX: 'auto', paddingBottom: '16px' }}>
                  {seatRows.map((section, si) => (
                    <div key={section.label} style={{ marginBottom: '24px' }}>
                      <div style={{
                        fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '2px',
                        textTransform: 'uppercase', marginBottom: '10px', textAlign: 'center',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                      }}>
                        <span style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                        {section.label} — ₹{movie.price[section.priceKey]}
                        <span style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                      </div>
                      {section.rows.map(row => {
                        const globalRowIdx = seatRows.slice(0, si).reduce((sum, s) => sum + s.rows.length, 0) +
                          section.rows.indexOf(row);
                        return (
                          <div key={row} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '4px' }}>
                            <span style={{ width: '24px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{row}</span>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              {Array.from({ length: section.cols }, (_, col) => {
                                const seatNum = globalRowIdx * section.cols + col + 1;
                                const seatId = `${row}-${seatNum}`;
                                const isSold = soldSeats.has(seatNum);
                                const isSelected = selectedSeats.includes(seatId);
                                // Add aisle gap
                                const hasGap = col === 3 || col === 11;
                                return (
                                  <div key={col} style={{ display: 'flex', gap: '4px' }}>
                                    <motion.button
                                      whileHover={!isSold ? { scale: 1.2 } : {}}
                                      whileTap={!isSold ? { scale: 0.9 } : {}}
                                      className={`seat ${isSold ? 'seat-sold' : isSelected ? 'seat-selected' : 'seat-available'}`}
                                      onClick={() => !isSold && toggleSeat(seatId)}
                                      disabled={isSold}
                                    >
                                      {col + 1}
                                    </motion.button>
                                    {hasGap && <div style={{ width: '12px' }} />}
                                  </div>
                                );
                              })}
                            </div>
                            <span style={{ width: '24px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{row}</span>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="seat-legend">
                  <div className="seat-legend-item">
                    <div className="seat-legend-box" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }} />
                    Available
                  </div>
                  <div className="seat-legend-item">
                    <div className="seat-legend-box" style={{ background: 'var(--blood)', boxShadow: '0 0 8px var(--blood-glow)' }} />
                    Selected
                  </div>
                  <div className="seat-legend-item">
                    <div className="seat-legend-box" style={{ background: 'rgba(255,255,255,0.03)' }} />
                    Sold
                  </div>
                </div>
              </div>

              {/* Sticky Bottom Bar */}
              <AnimatePresence>
                {selectedSeats.length > 0 && (
                  <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    style={{
                      position: 'fixed', bottom: 0, left: 0, right: 0,
                      background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(20px)',
                      borderTop: '1px solid var(--border)', zIndex: 100,
                      padding: '16px 0',
                    }}
                  >
                    <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          {selectedSeats.length} Ticket{selectedSeats.length > 1 ? 's' : ''} Selected
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>
                          ₹{totalPrice.toLocaleString()}
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="btn-blood"
                        onClick={() => {
                          if (!user) {
                            router.push(`/login?redirect=/movies/${movie.id}`);
                            return;
                          }
                          setStep(STEPS.PAYMENT);
                        }}
                        style={{ padding: '14px 36px', fontSize: '1rem' }}
                      >
                        Continue to Pay
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* STEP 3: SANDBOX PAYMENT SCREEN */}
          {step === STEPS.PAYMENT && (
            <motion.div key="payment" variants={stepVariants} initial="enter" animate="center" exit="exit">
              {paymentProcessing ? (
                /* LOADING/PROCESSING PANEL */
                <div className="glass" style={{ padding: '60px 24px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    style={{ marginBottom: '24px', display: 'inline-block' }}
                  >
                    <Loader size={48} color="var(--blood-bright)" />
                  </motion.div>
                  <h3 className="creepy-font" style={{ fontSize: '1.8rem', marginBottom: '16px' }}>Processing Demonic Transaction</h3>
                  <motion.p 
                    key={paymentStepMessage}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', minHeight: '30px' }}
                  >
                    {paymentStepMessage}
                  </motion.p>
                </div>
              ) : (
                /* MAIN PAYMENT PANEL */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
                  
                  {/* Left Column: Methods & Sandbox Mode */}
                  <div className="glass" style={{ padding: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                      <h3 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <CreditCard size={20} color="var(--blood)" /> Payment Method
                      </h3>
                      <button className="btn-ghost" onClick={() => setStep(STEPS.SEATS)} style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
                        ← Change Seats
                      </button>
                    </div>

                    {bookingError && (
                      <div style={{ padding: '16px', background: 'var(--blood-subtle)', border: '1px solid var(--border-hover)', borderRadius: 'var(--radius-md)', marginBottom: '24px', color: 'var(--blood-bright)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <AlertTriangle size={16} />
                        <div>{bookingError}</div>
                      </div>
                    )}

                    {/* Method tabs */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '24px' }}>
                      <button 
                        type="button"
                        className={`showtime-btn ${paymentMethod === 'card' ? 'showtime-btn-active' : ''}`}
                        onClick={() => setPaymentMethod('card')}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '12px 6px', fontSize: '0.8rem' }}
                      >
                        <CreditCard size={18} />
                        Card
                      </button>
                      <button 
                        type="button"
                        className={`showtime-btn ${paymentMethod === 'upi' ? 'showtime-btn-active' : ''}`}
                        onClick={() => setPaymentMethod('upi')}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '12px 6px', fontSize: '0.8rem' }}
                      >
                        <Smartphone size={18} />
                        UPI
                      </button>
                      <button 
                        type="button"
                        className={`showtime-btn ${paymentMethod === 'netbanking' ? 'showtime-btn-active' : ''}`}
                        onClick={() => setPaymentMethod('netbanking')}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '12px 6px', fontSize: '0.8rem' }}
                      >
                        <Building size={18} />
                        Net Banking
                      </button>
                    </div>

                    {/* Card Form */}
                    {paymentMethod === 'card' && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Card Number</label>
                          <input 
                            type="text" 
                            className="input-dark" 
                            placeholder="4111 2222 3333 4444" 
                            maxLength={19}
                            value={cardDetails.number}
                            onChange={(e) => {
                              const v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                              const matches = v.match(/\d{4,16}/g);
                              const match = matches && matches[0] || '';
                              const parts = [];
                              for (let i=0, len=match.length; i<len; i+=4) {
                                parts.push(match.substring(i, i+4));
                              }
                              const formatted = parts.length > 0 ? parts.join(' ') : v;
                              setCardDetails(prev => ({ ...prev, number: formatted }));
                            }}
                          />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Expiry Date</label>
                            <input 
                              type="text" 
                              className="input-dark" 
                              placeholder="MM/YY" 
                              maxLength={5}
                              value={cardDetails.expiry}
                              onChange={(e) => {
                                let v = e.target.value.replace(/\//g, '').replace(/[^0-9]/gi, '');
                                if (v.length > 2) {
                                  v = v.substring(0, 2) + '/' + v.substring(2, 4);
                                }
                                setCardDetails(prev => ({ ...prev, expiry: v }));
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>CVV</label>
                            <input 
                              type="password" 
                              className="input-dark" 
                              placeholder="***" 
                              maxLength={3}
                              value={cardDetails.cvv}
                              onChange={(e) => {
                                const v = e.target.value.replace(/[^0-9]/gi, '');
                                setCardDetails(prev => ({ ...prev, cvv: v }));
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cardholder Name</label>
                          <input 
                            type="text" 
                            className="input-dark" 
                            placeholder="Cardholder Name" 
                            value={cardDetails.name}
                            onChange={(e) => setCardDetails(prev => ({ ...prev, name: e.target.value }))}
                          />
                        </div>
                      </motion.div>
                    )}

                    {/* UPI Form */}
                    {paymentMethod === 'upi' && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>UPI ID (VPA)</label>
                          <input 
                            type="text" 
                            className="input-dark" 
                            placeholder="username@okaxis" 
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                          />
                        </div>
                        <div style={{ textAlign: 'center', padding: '16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border)' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '10px' }}>Or scan this mock QR Code to pay</span>
                          <div style={{ width: '120px', height: '120px', background: '#fff', padding: '10px', margin: '0 auto', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ width: '100px', height: '100px', backgroundImage: 'radial-gradient(#111 25%, transparent 25%), radial-gradient(#111 25%, transparent 25%)', backgroundSize: '10px 10px', backgroundPosition: '0 0, 5px 5px', opacity: 0.8 }} />
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#fff', padding: '4px', borderRadius: '4px' }}>
                              <Skull size={20} color="var(--blood)" />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Net Banking Form */}
                    {paymentMethod === 'netbanking' && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Select Bank</label>
                          <select 
                            className="input-dark" 
                            value={selectedBank} 
                            onChange={(e) => setSelectedBank(e.target.value)}
                            style={{ cursor: 'pointer' }}
                          >
                            <option value="SBI">State Bank of India</option>
                            <option value="HDFC">HDFC Bank</option>
                            <option value="ICICI">ICICI Bank</option>
                            <option value="AXIS">Axis Bank</option>
                            <option value="KOTAK">Kotak Mahindra Bank</option>
                          </select>
                        </div>
                      </motion.div>
                    )}

                    {/* Pay Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="btn-blood"
                      onClick={handlePayment}
                      style={{ width: '100%', padding: '16px', fontSize: '1.05rem', justifyContent: 'center', marginTop: '24px' }}
                    >
                      Pay & Seal Fate (₹{grandTotal.toLocaleString()})
                    </motion.button>
                  </div>

                  {/* Right Column: Invoice Receipt */}
                  <div>
                    <div className="glass" style={{ padding: '32px', position: 'sticky', top: '100px' }}>
                      <h3 style={{ fontFamily: "'Cinzel', serif", borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px', fontSize: '1.3rem' }}>
                        Order Summary
                      </h3>
                      
                      {/* Movie mini info */}
                      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                        <img 
                          src={movie.image} 
                          alt={movie.title} 
                          style={{ width: '64px', height: '96px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border)' }} 
                        />
                        <div>
                          <h4 style={{ fontSize: '1.05rem', marginBottom: '4px', fontFamily: "'Cinzel', serif" }}>{movie.title}</h4>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
                            <span className="genre-tag" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>{movie.language}</span>
                            <span className="genre-tag" style={{ fontSize: '0.7rem', padding: '2px 8px', color: 'var(--blood-bright)' }}>{movie.certification}</span>
                          </div>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{theaters.find(t => t.id === selectedTheater)?.name}</span>
                        </div>
                      </div>

                      {/* Date & Time, Seats details */}
                      <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '12px', borderBottom: '1px dashed var(--border)', paddingBottom: '20px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Showtime</span>
                          <span style={{ color: '#fff', fontWeight: 500 }}>
                            {dates.find(d => d.full === selectedDate)?.date} {dates.find(d => d.full === selectedDate)?.month}, {selectedTime}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Seats ({selectedSeats.length})</span>
                          <span style={{ color: '#fff', fontWeight: 500, wordBreak: 'break-all', textAlign: 'right', maxWidth: '200px' }}>
                            {selectedSeats.join(', ')}
                          </span>
                        </div>
                      </div>

                      {/* Detailed billing itemization */}
                      <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '20px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Ticket Subtotal</span>
                          <span style={{ color: '#fff' }}>₹{ticketSubtotal.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Convenience Charge</span>
                          <span style={{ color: '#fff' }}>₹{convenienceFee.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '12px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>CGST (9%)</span>
                          <span style={{ color: 'var(--text-muted)' }}>₹{cgst.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '12px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>SGST (9%)</span>
                          <span style={{ color: 'var(--text-muted)' }}>₹{sgst.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Grand total */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontFamily: "'Cinzel', serif", fontSize: '1.1rem', fontWeight: 600 }}>Total Amount</span>
                        <span style={{ color: 'var(--blood-bright)', fontSize: '1.4rem', fontWeight: 700 }}>
                          ₹{grandTotal.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </motion.div>
          )}

          {/* STEP 4: BOOKING CONFIRMATION */}
          {step === STEPS.SUMMARY && (
            <motion.div key="summary" variants={stepVariants} initial="enter" animate="center" exit="exit">
              <div style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>

                {/* Success animation */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                  style={{ marginBottom: '24px' }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.15, 1], rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <Skull size={64} color="var(--blood)" />
                  </motion.div>
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="creepy-font"
                  style={{ fontSize: '2.5rem', marginBottom: '8px' }}
                >
                  Fate Sealed
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  style={{ color: 'var(--text-muted)', marginBottom: '32px' }}
                >
                  Your tickets have been booked. There is no turning back.
                </motion.p>

                {/* Ticket Card */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="ticket-card"
                >
                  <div style={{ padding: '28px 28px 20px' }}>
                    <h3 className="creepy-font" style={{ fontSize: '1.8rem', marginBottom: '12px' }}>{movie.title}</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-around', color: 'var(--text-secondary)', fontSize: '0.9rem', gap: '8px', flexWrap: 'wrap' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Date</div>
                        {dates.find(d => d.full === selectedDate)?.date} {dates.find(d => d.full === selectedDate)?.month}
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Time</div>
                        {selectedTime}
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Screen</div>
                        {theaters.find(t => t.id === selectedTheater)?.name}
                      </div>
                    </div>
                  </div>

                  <hr className="ticket-divider" />

                  <div style={{ padding: '20px 28px 28px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Seats</div>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {selectedSeats.map(s => (
                            <span key={s} style={{ padding: '3px 10px', background: 'var(--blood-subtle)', border: '1px solid var(--border-hover)', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600 }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Total</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--blood-bright)' }}>₹{grandTotal.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  style={{ marginTop: '32px', display: 'flex', gap: '12px', justifyContent: 'center' }}
                >
                  <button className="btn-blood" onClick={() => router.push('/tickets')} style={{ padding: '12px 28px' }}>
                    View My Bookings
                  </button>
                  <button className="btn-ghost" onClick={() => router.push('/movies')}>
                    Browse More
                  </button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 }}
                  style={{ marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--blood)', fontSize: '0.85rem' }}
                >
                  <AlertTriangle size={14} /> No refunds. No cancellations. No escape.
                </motion.div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
