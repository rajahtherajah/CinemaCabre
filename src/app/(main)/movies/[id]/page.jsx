'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Star, Clock, Film, Users, Calendar, MapPin, ChevronRight, Ticket, AlertTriangle, Skull } from 'lucide-react';
import { movies, theaters, showtimes, getNextDates } from '@/data/movies';
import { useAuth } from '@/context/AuthContext';
import { createBooking } from '@/lib/bookings';

const STEPS = { INFO: 0, SHOWTIME: 1, SEATS: 2, SUMMARY: 3 };

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

  const seatRows = [
    { label: 'PREMIUM', rows: ['A', 'B', 'C'], cols: 16, priceKey: 'premium' },
    { label: 'EXECUTIVE', rows: ['D', 'E', 'F', 'G'], cols: 16, priceKey: 'executive' },
    { label: 'NORMAL', rows: ['H', 'I', 'J', 'K', 'L'], cols: 16, priceKey: 'normal' },
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

  const handleBook = async () => {
    if (!user) {
      router.push(`/login?redirect=/movies/${movie.id}`);
      return;
    }
    setIsBooking(true);
    setBookingError('');

    const theaterObj = theaters.find(t => t.id === selectedTheater);
    const { data, error } = await createBooking({
      userId: user.id,
      movieId: movie.id,
      movieTitle: movie.title,
      theaterName: theaterObj?.name || 'Unknown',
      showDate: selectedDate,
      showTime: selectedTime,
      seats: selectedSeats,
      totalPrice: totalPrice,
    });

    if (error) {
      console.error('Booking error:', error);
      setBookingError(error.message || 'Booking failed. Please try again.');
      setIsBooking(false);
      return;
    }

    setStep(STEPS.SUMMARY);
    setIsBooking(false);
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
                        onClick={handleBook}
                        disabled={isBooking}
                        style={{ padding: '14px 36px', fontSize: '1rem' }}
                      >
                        {isBooking ? (
                          <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                            Summoning...
                          </motion.span>
                        ) : (
                          <>Pay ₹{totalPrice.toLocaleString()}</>
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* STEP 3: BOOKING CONFIRMATION */}
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
                        <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--blood-bright)' }}>₹{totalPrice.toLocaleString()}</div>
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
