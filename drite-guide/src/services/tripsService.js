import { assertSupabaseConfigured, supabase } from '../lib/supabase';
import { getPlacesByIds } from './placesService';
import { getProfileByUsername } from './profileService';
import { getAuthenticatedProfileId, throwIfSupabaseError } from './supabaseService';

function normalizeDatePayload(payload) {
  const nextPayload = {};

  if (Object.prototype.hasOwnProperty.call(payload, 'title')) {
    nextPayload.title = payload.title;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'description')) {
    nextPayload.description = payload.description || null;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'start_date')) {
    nextPayload.start_date = payload.start_date;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'end_date')) {
    nextPayload.end_date = payload.end_date;
  }

  if (
    Object.prototype.hasOwnProperty.call(payload, 'shared_note') ||
    Object.prototype.hasOwnProperty.call(payload, 'sharedNote')
  ) {
    nextPayload.shared_note = payload.shared_note ?? payload.sharedNote ?? null;
  }

  return nextPayload;
}

async function getTripMembers(tripId) {
  const { data, error } = await supabase
    .from('trip_members')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true });

  throwIfSupabaseError(error, 'Could not load trip members.');

  const userIds = (data || []).map((member) => member.user_id).filter(Boolean);

  if (userIds.length === 0) {
    return [];
  }

  const { data: profiles, error: profilesError } = await supabase
    .from('users')
    .select('*')
    .in('id', userIds);

  throwIfSupabaseError(profilesError, 'Could not load trip members.');

  const profileById = new Map((profiles || []).map((profile) => [profile.id, profile]));

  return (data || []).map((member) => ({
    ...member,
    user: profileById.get(member.user_id) || null,
  }));
}

async function getTripPlaces(tripId) {
  const { data, error } = await supabase
    .from('trip_places')
    .select('*')
    .eq('trip_id', tripId)
    .order('order_index', { ascending: true });

  throwIfSupabaseError(error, 'Could not load trip places.');

  const placeIds = (data || []).map((tripPlace) => tripPlace.place_id).filter(Boolean);
  const places = await getPlacesByIds(placeIds);
  const placeById = new Map(places.map((place) => [String(place.id), place]));

  return (data || []).map((tripPlace) => ({
    ...tripPlace,
    place: placeById.get(String(tripPlace.place_id)) || null,
  }));
}

export async function hydrateTrip(trip) {
  if (!trip?.id) {
    return null;
  }

  const [members, places] = await Promise.all([
    getTripMembers(trip.id),
    getTripPlaces(trip.id),
  ]);

  const ownerMembership = members.find(
    (member) => member.user_id === trip.owner_id && member.role === 'owner'
  );

  return {
    ...trip,
    role: ownerMembership ? 'owner' : trip.role,
    members,
    places,
    places_count: places.length,
    invited_users_count: members.filter((member) => member.role !== 'owner').length,
  };
}

export async function getTrip(tripId) {
  assertSupabaseConfigured();

  if (!tripId) {
    return null;
  }

  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .maybeSingle();

  throwIfSupabaseError(error, 'Trip could not be loaded.');
  return hydrateTrip(data);
}

export async function getTripsForUser(userId) {
  assertSupabaseConfigured();

  if (!userId) {
    return [];
  }

  const [ownedTripsResult, memberTripsResult] = await Promise.all([
    supabase.from('trips').select('*').eq('owner_id', userId),
    supabase.from('trip_members').select('trip_id').eq('user_id', userId),
  ]);

  throwIfSupabaseError(ownedTripsResult.error, 'Could not load trips.');
  throwIfSupabaseError(memberTripsResult.error, 'Could not load trips.');

  const ownedTrips = ownedTripsResult.data || [];
  const memberTripIds = (memberTripsResult.data || [])
    .map((item) => item.trip_id)
    .filter(Boolean);
  const ownedTripIds = new Set(ownedTrips.map((trip) => String(trip.id)));
  const missingMemberTripIds = memberTripIds.filter(
    (tripId) => !ownedTripIds.has(String(tripId))
  );

  let memberTrips = [];

  if (missingMemberTripIds.length > 0) {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .in('id', missingMemberTripIds);

    throwIfSupabaseError(error, 'Could not load trips.');
    memberTrips = data || [];
  }

  const allTrips = [...ownedTrips, ...memberTrips].sort((left, right) =>
    String(left.start_date || '').localeCompare(String(right.start_date || ''))
  );

  return Promise.all(allTrips.map(hydrateTrip));
}

export async function createTrip(userId, payload) {
  assertSupabaseConfigured();
  const profileId = await getAuthenticatedProfileId(userId);

  const { data, error } = await supabase
    .from('trips')
    .insert({
      owner_id: profileId,
      ...normalizeDatePayload(payload),
    })
    .select('*')
    .single();

  throwIfSupabaseError(error, 'Trip creation failed.');

  const { error: memberError } = await supabase
    .from('trip_members')
    .insert({
      trip_id: data.id,
      user_id: profileId,
      role: 'owner',
      status: 'accepted',
      invited_by_user_id: profileId,
    });

  throwIfSupabaseError(memberError, 'Trip owner could not be added.');
  return hydrateTrip(data);
}

export async function updateTrip(tripId, userId, payload) {
  assertSupabaseConfigured();
  const profileId = await getAuthenticatedProfileId(userId);

  const { data, error } = await supabase
    .from('trips')
    .update({
      ...normalizeDatePayload(payload),
      updated_at: new Date().toISOString(),
    })
    .eq('id', tripId)
    .eq('owner_id', profileId)
    .select('*')
    .single();

  throwIfSupabaseError(error, 'Trip update failed.');
  return hydrateTrip(data);
}

export async function deleteTrip(tripId, userId) {
  assertSupabaseConfigured();
  const profileId = await getAuthenticatedProfileId(userId);

  const { error } = await supabase
    .from('trips')
    .delete()
    .eq('id', tripId)
    .eq('owner_id', profileId);

  throwIfSupabaseError(error, 'Trip deletion failed.');
}

export async function addPlaceToTrip(tripId, payload) {
  assertSupabaseConfigured();
  await getAuthenticatedProfileId();

  const { count } = await supabase
    .from('trip_places')
    .select('*', { count: 'exact', head: true })
    .eq('trip_id', tripId);

  const { data, error } = await supabase
    .from('trip_places')
    .insert({
      trip_id: tripId,
      place_id: payload.place_id,
      visit_date: payload.visit_date || null,
      visit_start_time: payload.visit_start_time || null,
      visit_end_time: payload.visit_end_time || null,
      note: payload.note || null,
      order_index: payload.order_index ?? count ?? 0,
    })
    .select('*')
    .single();

  throwIfSupabaseError(error, 'Could not add this place to the trip.');

  const places = await getPlacesByIds([data.place_id]);
  return {
    ...data,
    place: places[0] || null,
  };
}

export async function updateTripPlace(tripId, tripPlaceId, payload) {
  assertSupabaseConfigured();
  await getAuthenticatedProfileId();

  const { data, error } = await supabase
    .from('trip_places')
    .update({
      visit_date: payload.visit_date || null,
      visit_start_time: payload.visit_start_time || null,
      visit_end_time: payload.visit_end_time || null,
      note: payload.note || null,
      order_index: payload.order_index,
      updated_at: new Date().toISOString(),
    })
    .eq('trip_id', tripId)
    .eq('id', tripPlaceId)
    .select('*')
    .single();

  throwIfSupabaseError(error, 'Could not update this trip place.');

  const places = await getPlacesByIds([data.place_id]);
  return {
    ...data,
    place: places[0] || null,
  };
}

export async function removeTripPlace(tripId, tripPlaceId) {
  assertSupabaseConfigured();
  await getAuthenticatedProfileId();

  const { error } = await supabase
    .from('trip_places')
    .delete()
    .eq('trip_id', tripId)
    .eq('id', tripPlaceId);

  throwIfSupabaseError(error, 'Could not remove this place from the trip.');
}

export async function inviteUserToTrip(tripId, username, invitedByUserId) {
  assertSupabaseConfigured();
  const profileId = await getAuthenticatedProfileId(invitedByUserId);

  const targetProfile = await getProfileByUsername(username, profileId);

  if (!targetProfile?.id) {
    throw new Error('User account could not be found.');
  }

  const { data, error } = await supabase
    .from('trip_members')
    .upsert(
      {
        trip_id: tripId,
        user_id: targetProfile.id,
        role: 'member',
        status: 'invited',
        invited_by_user_id: profileId,
      },
      { onConflict: 'trip_id,user_id' }
    )
    .select('*')
    .single();

  throwIfSupabaseError(error, 'Could not invite this user.');

  return {
    ...data,
    user: targetProfile,
  };
}

export async function removeTripMember(tripId, userId) {
  assertSupabaseConfigured();
  await getAuthenticatedProfileId();

  const { error } = await supabase
    .from('trip_members')
    .delete()
    .eq('trip_id', tripId)
    .eq('user_id', userId)
    .neq('role', 'owner');

  throwIfSupabaseError(error, 'Could not remove this member.');
}
