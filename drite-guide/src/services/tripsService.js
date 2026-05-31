import { assertSupabaseConfigured, supabase } from '../lib/supabase';
import { getPlacesByIds } from './placesService';
import { getProfileByUsername } from './profileService';
import { getAuthenticatedProfileId, throwIfSupabaseError } from './supabaseService';

function createTripPlaceId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

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

function createTripMemberId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `member-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createOwnerTripMember(tripId, ownerId) {
  const now = new Date().toISOString();

  return {
    id: `owner-${tripId || ownerId || createTripMemberId()}`,
    trip_id: tripId || null,
    user_id: ownerId,
    role: 'owner',
    status: 'accepted',
    invited_by_user_id: ownerId,
    created_at: now,
    updated_at: now,
  };
}

function normalizeStoredTripMembers(trip) {
  const now = new Date().toISOString();
  const ownerMember = trip?.owner_id
    ? {
        ...createOwnerTripMember(trip.id, trip.owner_id),
        created_at: trip.created_at || now,
        updated_at: trip.updated_at || trip.created_at || now,
      }
    : null;

  const storedMembers = Array.isArray(trip?.members) ? trip.members : [];
  const memberByUserId = new Map();

  if (ownerMember) {
    memberByUserId.set(String(ownerMember.user_id), ownerMember);
  }

  storedMembers.filter(Boolean).forEach((member) => {
    const userId = member.user_id || member.userId;

    if (!userId || memberByUserId.has(String(userId))) {
      return;
    }

    memberByUserId.set(String(userId), {
      ...member,
      id: member.id || createTripMemberId(),
      trip_id: member.trip_id || trip?.id,
      user_id: userId,
      role: member.role === 'owner' ? 'owner' : 'member',
      status: member.status || 'invited',
      invited_by_user_id: member.invited_by_user_id || member.invitedByUserId || null,
      created_at: member.created_at || now,
      updated_at: member.updated_at || member.created_at || now,
    });
  });

  return Array.from(memberByUserId.values());
}

async function hydrateTripMembers(trip) {
  const data = normalizeStoredTripMembers(trip);
  const userIds = data.map((member) => member.user_id).filter(Boolean);

  if (userIds.length === 0) {
    return [];
  }

  const { data: profiles, error: profilesError } = await supabase
    .from('user_profile')
    .select('*')
    .in('id', userIds);

  throwIfSupabaseError(profilesError, 'Could not load trip members.');

  const profileById = new Map(
    (profiles || []).map((profile) => [profile.id, profile])
  );

  return (data || []).map((member) => ({
    ...member,
    user: profileById.get(member.user_id) || null,
  }));
}

function normalizeStoredTripPlaces(trip) {
  const places = Array.isArray(trip?.places) ? trip.places : [];

  return places
    .filter(Boolean)
    .map((tripPlace, index) => ({
      ...tripPlace,
      id: tripPlace.id || createTripPlaceId(),
      trip_id: tripPlace.trip_id || trip?.id,
      place_id: tripPlace.place_id || tripPlace.placeId,
      visit_date: tripPlace.visit_date || tripPlace.visitDate || null,
      visit_start_time:
        tripPlace.visit_start_time || tripPlace.visitStartTime || null,
      visit_end_time:
        tripPlace.visit_end_time || tripPlace.visitEndTime || null,
      note: tripPlace.note || null,
      order_index: tripPlace.order_index ?? tripPlace.orderIndex ?? index,
      created_at: tripPlace.created_at || new Date().toISOString(),
      updated_at: tripPlace.updated_at || tripPlace.created_at || new Date().toISOString(),
    }))
    .filter((tripPlace) => tripPlace.place_id)
    .sort((left, right) => (left.order_index ?? 0) - (right.order_index ?? 0));
}

async function hydrateTripPlaces(trip) {
  const data = normalizeStoredTripPlaces(trip);
  const placeIds = data.map((tripPlace) => tripPlace.place_id).filter(Boolean);
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
    hydrateTripMembers(trip),
    hydrateTripPlaces(trip),
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

function getCurrentUserTripMember(trip, userId) {
  if (!trip?.id || !userId) {
    return null;
  }

  if (String(trip.owner_id) === String(userId)) {
    return {
      id: `owner-${trip.id}`,
      trip_id: trip.id,
      user_id: userId,
      role: 'owner',
      status: 'accepted',
    };
  }

  return (trip.members || []).find(
    (member) => String(member.user_id || member.userId) === String(userId)
  ) || null;
}

function annotateTripForUser(trip, userId) {
  const currentMember = getCurrentUserTripMember(trip, userId);
  const currentMemberStatus = currentMember?.status || null;
  const isOwner = String(trip?.owner_id) === String(userId);

  return {
    ...trip,
    role: isOwner ? 'owner' : currentMember?.role || trip.role,
    currentMember,
    currentMemberStatus,
    isPendingInvite: !isOwner && currentMemberStatus === 'invited',
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

  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .order('start_date', { ascending: true });

  throwIfSupabaseError(error, 'Could not load trips.');

  const allTrips = (data || []).filter((trip) =>
    normalizeStoredTripMembers(trip).some(
      (member) => String(member.user_id) === String(userId)
    )
  );

  const hydratedTrips = await Promise.all(allTrips.map(hydrateTrip));
  return hydratedTrips.map((trip) => annotateTripForUser(trip, userId));
}

export async function createTrip(userId, payload) {
  assertSupabaseConfigured();
  const profileId = await getAuthenticatedProfileId(userId);
  const ownerMember = createOwnerTripMember(null, profileId);

  const { data, error } = await supabase
    .from('trips')
    .insert({
      owner_id: profileId,
      members: [ownerMember],
      ...normalizeDatePayload(payload),
    })
    .select('*')
    .single();

  throwIfSupabaseError(error, 'Trip creation failed.');
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

  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single();

  throwIfSupabaseError(tripError, 'Could not add this place to the trip.');

  const currentPlaces = normalizeStoredTripPlaces(trip);
  const placeExists = currentPlaces.some(
    (tripPlace) => String(tripPlace.place_id) === String(payload.place_id)
  );

  if (placeExists) {
    throw new Error('This place is already in the trip.');
  }

  const now = new Date().toISOString();
  const nextTripPlace = {
    id: createTripPlaceId(),
    trip_id: tripId,
    place_id: payload.place_id,
    visit_date: payload.visit_date || null,
    visit_start_time: payload.visit_start_time || null,
    visit_end_time: payload.visit_end_time || null,
    note: payload.note || null,
    order_index: payload.order_index ?? currentPlaces.length,
    created_at: now,
    updated_at: now,
  };

  const { error } = await supabase
    .from('trips')
    .update({
      places: [...currentPlaces, nextTripPlace],
      updated_at: now,
    })
    .eq('id', tripId)
    .select('places')
    .single();

  throwIfSupabaseError(error, 'Could not add this place to the trip.');

  const places = await getPlacesByIds([nextTripPlace.place_id]);
  return {
    ...nextTripPlace,
    place: places[0] || null,
  };
}

export async function updateTripPlace(tripId, tripPlaceId, payload) {
  assertSupabaseConfigured();
  await getAuthenticatedProfileId();

  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single();

  throwIfSupabaseError(tripError, 'Could not update this trip place.');

  const now = new Date().toISOString();
  let updatedTripPlace = null;
  const nextPlaces = normalizeStoredTripPlaces(trip).map((tripPlace) => {
    if (String(tripPlace.id) !== String(tripPlaceId)) {
      return tripPlace;
    }

    updatedTripPlace = {
      ...tripPlace,
      visit_date: payload.visit_date || null,
      visit_start_time: payload.visit_start_time || null,
      visit_end_time: payload.visit_end_time || null,
      note: payload.note || null,
      order_index: payload.order_index ?? tripPlace.order_index,
      updated_at: now,
    };

    return updatedTripPlace;
  });

  if (!updatedTripPlace) {
    throw new Error('Trip place could not be found.');
  }

  const { error } = await supabase
    .from('trips')
    .update({
      places: nextPlaces,
      updated_at: now,
    })
    .eq('id', tripId)
    .select('id')
    .single();

  throwIfSupabaseError(error, 'Could not update this trip place.');

  const places = await getPlacesByIds([updatedTripPlace.place_id]);
  return {
    ...updatedTripPlace,
    place: places[0] || null,
  };
}

export async function removeTripPlace(tripId, tripPlaceId) {
  assertSupabaseConfigured();
  await getAuthenticatedProfileId();

  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single();

  throwIfSupabaseError(tripError, 'Could not remove this place from the trip.');

  const currentPlaces = normalizeStoredTripPlaces(trip);
  const nextPlaces = currentPlaces.filter(
    (tripPlace) => String(tripPlace.id) !== String(tripPlaceId)
  );

  if (nextPlaces.length === currentPlaces.length) {
    throw new Error('Trip place could not be found.');
  }

  const { error } = await supabase
    .from('trips')
    .update({
      places: nextPlaces,
      updated_at: new Date().toISOString(),
    })
    .eq('id', tripId);

  throwIfSupabaseError(error, 'Could not remove this place from the trip.');
}

export async function inviteUserToTrip(tripId, username, invitedByUserId) {
  assertSupabaseConfigured();
  const profileId = await getAuthenticatedProfileId(invitedByUserId);

  const targetProfile = await getProfileByUsername(username, profileId);

  if (!targetProfile?.id) {
    throw new Error('User account could not be found.');
  }

  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single();

  throwIfSupabaseError(tripError, 'Could not invite this user.');

  if (String(trip.owner_id) === String(targetProfile.id)) {
    throw new Error('This user already owns the trip.');
  }

  const now = new Date().toISOString();
  const currentMembers = normalizeStoredTripMembers(trip).filter(
    (member) => member.role !== 'owner'
  );
  const existingMember = currentMembers.find(
    (member) => String(member.user_id) === String(targetProfile.id)
  );
  const nextMember = {
    ...(existingMember || {}),
    id: existingMember?.id || createTripMemberId(),
    trip_id: tripId,
    user_id: targetProfile.id,
    role: 'member',
    status: existingMember?.status || 'invited',
    invited_by_user_id: existingMember?.invited_by_user_id || profileId,
    created_at: existingMember?.created_at || now,
    updated_at: now,
  };
  const nextMembers = existingMember
    ? currentMembers.map((member) =>
        String(member.user_id) === String(targetProfile.id) ? nextMember : member
      )
    : [...currentMembers, nextMember];

  const { error } = await supabase
    .from('trips')
    .update({
      members: nextMembers,
      updated_at: now,
    })
    .eq('id', tripId)
    .eq('owner_id', profileId)
    .select('id')
    .single();

  throwIfSupabaseError(error, 'Could not invite this user.');

  return {
    ...nextMember,
    user: targetProfile,
  };
}

export async function acceptTripInvite(tripId, userId) {
  assertSupabaseConfigured();
  await getAuthenticatedProfileId(userId);

  const { data, error } = await supabase.rpc('accept_trip_invite', {
    trip_uuid: tripId,
  });

  throwIfSupabaseError(error, 'Could not accept this trip invite.');
  return hydrateTrip(data);
}

export async function declineTripInvite(tripId, userId) {
  assertSupabaseConfigured();
  await getAuthenticatedProfileId(userId);

  const { error } = await supabase.rpc('decline_trip_invite', {
    trip_uuid: tripId,
  });

  throwIfSupabaseError(error, 'Could not decline this trip invite.');
}

export async function removeTripMember(tripId, userId) {
  assertSupabaseConfigured();
  const profileId = await getAuthenticatedProfileId();

  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single();

  throwIfSupabaseError(tripError, 'Could not remove this member.');

  const nextMembers = normalizeStoredTripMembers(trip).filter(
    (member) => member.role !== 'owner' && String(member.user_id) !== String(userId)
  );

  const { error } = await supabase
    .from('trips')
    .update({
      members: nextMembers,
      updated_at: new Date().toISOString(),
    })
    .eq('id', tripId)
    .eq('owner_id', profileId)
    .select('id')
    .single();

  throwIfSupabaseError(error, 'Could not remove this member.');
}
