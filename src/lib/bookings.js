import { supabase } from './supabase';

/**
 * Create a new booking in Supabase
 */
export async function createBooking({ userId, movieId, movieTitle, theaterName, showDate, showTime, seats, totalPrice }) {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('crtugbydvjhgdrrxnbye')) {
    let userEmail = 'guest@macabre.com';
    try {
      const demoUser = JSON.parse(localStorage.getItem('demo_user') || '{}');
      userEmail = demoUser.email || userEmail;
    } catch (e) {
      console.error("Error reading demo_user for booking:", e);
    }

    const mockBooking = {
      id: 'mock-booking-' + Math.random().toString(36).substring(2, 9),
      user_id: userId,
      user_email: userEmail,
      movie_id: movieId,
      movie_title: movieTitle,
      theater_name: theaterName,
      show_date: showDate,
      show_time: showTime,
      seats: seats,
      total_price: totalPrice,
      status: 'confirmed',
      created_at: new Date().toISOString()
    };
    const localBookings = JSON.parse(localStorage.getItem('mock_bookings') || '[]');
    localBookings.unshift(mockBooking);
    localStorage.setItem('mock_bookings', JSON.stringify(localBookings));
    return { data: mockBooking, error: null };
  }

  const { data, error } = await supabase
    .from('bookings')
    .insert([{
      user_id: userId,
      movie_id: movieId,
      movie_title: movieTitle,
      theater_name: theaterName,
      show_date: showDate,
      show_time: showTime,
      seats: seats,
      total_price: totalPrice,
      status: 'confirmed',
    }])
    .select()
    .single();

  return { data, error };
}

/**
 * Get all bookings for a user
 */
export async function getUserBookings(userId) {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('crtugbydvjhgdrrxnbye')) {
    const localBookings = JSON.parse(localStorage.getItem('mock_bookings') || '[]');
    const userBookings = localBookings.filter(b => b.user_id === userId);
    return { data: userBookings, error: null };
  }

  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return { data: data || [], error };
}

/**
 * Get a single booking by ID
 */
export async function getBookingById(bookingId) {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('crtugbydvjhgdrrxnbye')) {
    const localBookings = JSON.parse(localStorage.getItem('mock_bookings') || '[]');
    const booking = localBookings.find(b => b.id === bookingId);
    return { data: booking, error: booking ? null : { message: 'Booking not found.' } };
  }

  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  return { data, error };
}

/**
 * Get all bookings across the entire system (Admin access)
 */
export async function getAllBookings() {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('crtugbydvjhgdrrxnbye')) {
    const localBookings = JSON.parse(localStorage.getItem('mock_bookings') || '[]');
    return { data: localBookings, error: null };
  }

  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false });

  return { data: data || [], error };
}

/**
 * Cancel a booking and set status to 'refund_initiated'
 */
export async function cancelBooking(bookingId) {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('crtugbydvjhgdrrxnbye')) {
    const localBookings = JSON.parse(localStorage.getItem('mock_bookings') || '[]');
    const updated = localBookings.map(b => 
      b.id === bookingId ? { ...b, status: 'refund_initiated' } : b
    );
    localStorage.setItem('mock_bookings', JSON.stringify(updated));
    const targetBooking = updated.find(b => b.id === bookingId);
    return { data: targetBooking, error: targetBooking ? null : { message: 'Booking not found.' } };
  }

  const { data, error } = await supabase
    .from('bookings')
    .update({ status: 'refund_initiated' })
    .eq('id', bookingId)
    .select()
    .single();

  return { data, error };
}
