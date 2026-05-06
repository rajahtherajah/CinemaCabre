import { supabase } from './supabase';

/**
 * Create a new booking in Supabase
 */
export async function createBooking({ userId, movieId, movieTitle, theaterName, showDate, showTime, seats, totalPrice }) {
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
