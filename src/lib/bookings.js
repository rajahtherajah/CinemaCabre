import { supabase } from './supabase';

/**
 * Create a new booking in Supabase
 */
export async function createBooking({ userId, movieId, movieTitle, theaterName, showDate, showTime, seats, totalPrice }) {
  let userEmail = '';
  let userUsername = '';
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      userEmail = user.email || '';
      userUsername = user.user_metadata?.username || '';
    }
  } catch (e) {
    console.error("Error retrieving user info for booking:", e);
  }

  const { data, error } = await supabase
    .from('bookings')
    .insert([{
      user_id: userId,
      user_email: userEmail,
      user_username: userUsername,
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
  const { data, error } = await supabase
    .from('bookings')
    .update({ status: 'refund_initiated' })
    .eq('id', bookingId)
    .select()
    .single();

  return { data, error };
}
