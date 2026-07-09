import {
  StagebookApiError,
  assessTravelGap,
  buildBookingContext,
  buildMessageThreads,
  buildPaymentSchedule,
  calculateCancellationRefund,
  deriveCounterOffersFromChat,
  formatCounterOfferBody,
  slotOverlaps,
  type BookingContextItem,
  type CalendarSlotState,
  type CounterOffer,
  type DiscoveryFilters,
  type IdentityVerificationStatus,
  type MessageThreadFilter,
  type MessageThreadSummary,
  type PayoutBalances,
  type PayoutRequest,
  type StageBookNotification,
  DEFAULT_DISCOVERY_FILTERS,
  type BookingRequest,
  type ChatMessage,
  type ArtistProfile,
  type ContractRecord,
  type PaymentSchedule,
  type PayfastCheckoutSession,
  type PayfastPaymentPhase
} from "@stagebook/shared";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { useAuth } from "./AuthContext";
import { stagebookApi } from "../lib/stagebook-api";

interface BookingDraft {
  artistId: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  locationLabel: string;
  latitude: number;
  longitude: number;
  quotedPriceZar: number;
  eventName: string;
  eventType: string;
  specialRequests: string;
  technicalRider: string;
  guestCount: number;
}

interface StageBookContextValue {
  artists: ArtistProfile[];
  bookings: BookingRequest[];
  chatMessages: ChatMessage[];
  counterOffers: CounterOffer[];
  notifications: StageBookNotification[];
  filters: DiscoveryFilters;
  setFilters: (patch: Partial<DiscoveryFilters>) => void;
  filteredArtists: ArtistProfile[];
  dataLoading: boolean;
  dataError: string | null;
  refreshBookings: () => Promise<void>;
  getArtist: (id: string) => ArtistProfile | undefined;
  getBooking: (id: string) => BookingRequest | undefined;
  getBookingChat: (id: string) => ChatMessage[];
  getMessageThreads: (filter?: MessageThreadFilter) => MessageThreadSummary[];
  getBookingContext: (bookingId: string) => BookingContextItem[];
  getPendingCounterOffer: (bookingId: string) => CounterOffer | undefined;
  getCounterOffer: (offerId: string) => CounterOffer | undefined;
  markThreadRead: (bookingId: string) => void;
  unreadMessageCount: number;
  sendMessage: (bookingId: string, body: string) => Promise<void>;
  sendCounterOffer: (
    bookingId: string,
    input: { priceZar: number; startTime: string; endTime: string; note?: string }
  ) => Promise<void>;
  acceptCounterOffer: (offerId: string) => Promise<void>;
  declineCounterOffer: (offerId: string) => Promise<void>;
  acceptOffer: (bookingId: string) => Promise<void>;
  declineOffer: (bookingId: string) => Promise<void>;
  refreshThread: (bookingId: string) => Promise<void>;
  contracts: ContractRecord[];
  getContract: (bookingId: string) => ContractRecord | undefined;
  loadContract: (bookingId: string) => Promise<void>;
  generateContract: (bookingId: string) => Promise<void>;
  signContract: (bookingId: string, signature: string) => Promise<void>;
  requestAmendment: (bookingId: string, feedback: string) => Promise<void>;
  getPaymentSchedule: (bookingId: string) => PaymentSchedule | null;
  createPayfastCheckout: (
    bookingId: string,
    phase: PayfastPaymentPhase
  ) => Promise<PayfastCheckoutSession | null>;
  completePayfastPayment: (bookingId: string, phase: PayfastPaymentPhase) => Promise<void>;
  getCalendarState: (artistId: string, date: string) => CalendarSlotState;
  createBooking: (draft: BookingDraft) => Promise<{ ok: boolean; error?: string; bookingId?: string }>;
  cancelBooking: (bookingId: string) => Promise<void>;
  completeBooking: (bookingId: string) => Promise<void>;
  myArtistProfile: ArtistProfile | null;
  payoutBalances: PayoutBalances | null;
  payouts: PayoutRequest[];
  verificationStatus: IdentityVerificationStatus | null;
  loadArtistDashboard: () => Promise<void>;
  updateMyArtistProfile: (patch: Partial<ArtistProfile>) => Promise<void>;
  requestPayout: (amountZar: number) => Promise<void>;
  submitArtistVerification: () => Promise<void>;
}

const StageBookContext = createContext<StageBookContextValue | null>(null);

function bookingsAreEqual(current: BookingRequest[], next: BookingRequest[]) {
  if (current.length !== next.length) return false;
  return current.every((booking, index) => {
    const candidate = next[index];
    return (
      booking.id === candidate.id &&
      booking.status === candidate.status &&
      booking.eventDate === candidate.eventDate &&
      booking.quotedPriceZar === candidate.quotedPriceZar
    );
  });
}

export function StageBookProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const sessionUserId = session?.user.id ?? null;
  const sessionRole = session?.user.role ?? null;
  const [artists, setArtists] = useState<ArtistProfile[]>([]);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [readAtByBooking, setReadAtByBooking] = useState<Record<string, string>>({});
  const [notifications] = useState<StageBookNotification[]>([]);
  const [filters, setFiltersState] = useState(DEFAULT_DISCOVERY_FILTERS);
  const [contracts, setContracts] = useState<ContractRecord[]>([]);
  const [myArtistProfile, setMyArtistProfile] = useState<ArtistProfile | null>(null);
  const [payoutBalances, setPayoutBalances] = useState<PayoutBalances | null>(null);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [verificationStatus, setVerificationStatus] = useState<IdentityVerificationStatus | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const counterOffers = useMemo(() => deriveCounterOffersFromChat(chatMessages), [chatMessages]);

  const refreshBookings = useCallback(async () => {
    if (!sessionUserId) {
      setBookings([]);
      setChatMessages([]);
      setContracts([]);
      return;
    }

    setDataLoading(true);
    setDataError(null);
    try {
      const nextBookings = await stagebookApi.listMyBookings();
      setBookings((prev) => (bookingsAreEqual(prev, nextBookings) ? prev : nextBookings));
      const chats = await Promise.all(nextBookings.map((booking) => stagebookApi.listChat(booking.id)));
      setChatMessages(chats.flat());
      const contractResults = await Promise.allSettled(
        nextBookings.map((booking) => stagebookApi.getContract(booking.id))
      );
      const nextContracts = contractResults
        .filter((result): result is PromiseFulfilledResult<ContractRecord> => result.status === "fulfilled")
        .map((result) => result.value);
      setContracts(nextContracts);
    } catch (error) {
      const message =
        error instanceof StagebookApiError ? error.message : "Unable to load bookings";
      setDataError(message);
    } finally {
      setDataLoading(false);
    }
  }, [sessionUserId]);

  useEffect(() => {
    let cancelled = false;

    async function loadArtists() {
      try {
        const nextArtists = await stagebookApi.listArtists();
        if (!cancelled) setArtists(nextArtists);
      } catch {
        if (!cancelled) setArtists([]);
      }
    }

    void loadArtists();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void refreshBookings();
  }, [sessionUserId, refreshBookings]);

  const setFilters = useCallback((patch: Partial<DiscoveryFilters>) => {
    setFiltersState((current) => ({ ...current, ...patch }));
  }, []);

  const artistNameById = useMemo(
    () => Object.fromEntries(artists.map((artist) => [artist.id, artist.stageName])),
    [artists]
  );

  const filteredArtists = useMemo(
    () =>
      artists.filter((artist) => {
        const q = filters.query.toLowerCase();
        return !q || artist.stageName.toLowerCase().includes(q);
      }),
    [artists, filters]
  );

  const getArtist = useCallback((id: string) => artists.find((artist) => artist.id === id), [artists]);
  const getBooking = useCallback((id: string) => bookings.find((booking) => booking.id === id), [bookings]);
  const getBookingChat = useCallback(
    (id: string) =>
      chatMessages
        .filter((message) => message.bookingId === id)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [chatMessages]
  );

  const getMessageThreads = useCallback(
    (filter: MessageThreadFilter = "all") =>
      buildMessageThreads({
        bookings,
        messages: chatMessages,
        counterOffers,
        readAtByBooking,
        artistNameById,
        filter
      }),
    [bookings, chatMessages, counterOffers, readAtByBooking, artistNameById]
  );

  const getBookingContext = useCallback(
    (bookingId: string) => {
      const booking = bookings.find((entry) => entry.id === bookingId);
      if (!booking) return [];
      return buildBookingContext(booking, artistNameById[booking.artistProfileId] ?? "Artist");
    },
    [bookings, artistNameById]
  );

  const getPendingCounterOffer = useCallback(
    (bookingId: string) =>
      counterOffers.find((offer) => offer.bookingId === bookingId && offer.status === "pending"),
    [counterOffers]
  );

  const getCounterOffer = useCallback(
    (offerId: string) => counterOffers.find((offer) => offer.id === offerId),
    [counterOffers]
  );

  const markThreadRead = useCallback((bookingId: string) => {
    setReadAtByBooking((prev) => ({ ...prev, [bookingId]: new Date().toISOString() }));
  }, []);

  const unreadMessageCount = useMemo(
    () => getMessageThreads("unread").reduce((sum, thread) => sum + thread.unreadCount, 0),
    [getMessageThreads]
  );

  const sendMessage = useCallback(
    async (bookingId: string, body: string) => {
      if (!session) return;
      try {
        const message = await stagebookApi.sendChat(bookingId, { body });
        setChatMessages((prev) => [...prev, message]);
      } catch (error) {
        const message =
          error instanceof StagebookApiError ? error.message : "Unable to send message";
        setDataError(message);
      }
    },
    [session]
  );

  const sendCounterOffer = useCallback(
    async (
      bookingId: string,
      input: { priceZar: number; startTime: string; endTime: string; note?: string }
    ) => {
      if (!session) return;

      const draftOffer: CounterOffer = {
        id: `counter-${Date.now()}`,
        bookingId,
        proposedPriceZar: input.priceZar,
        proposedStartTime: input.startTime,
        proposedEndTime: input.endTime,
        note: input.note,
        issuedByUserId: session.user.id,
        issuedByRole: session.user.role,
        status: "pending",
        createdAt: new Date().toISOString()
      };

      try {
        if (session.user.role === "artist" || session.user.role === "representative") {
          const decision = await stagebookApi.bookingDecision(bookingId, {
            status: "agreement",
            counterPriceZar: input.priceZar,
            counterStartTime: input.startTime,
            counterEndTime: input.endTime
          });
          setBookings((prev) =>
            prev.map((entry) => (entry.id === bookingId ? decision.booking : entry))
          );
        }

        const message = await stagebookApi.sendChat(bookingId, {
          body: formatCounterOfferBody(draftOffer),
          systemAction: "counter_offer"
        });
        setChatMessages((prev) => [...prev, message]);
      } catch (error) {
        const message =
          error instanceof StagebookApiError ? error.message : "Unable to send counter-offer";
        setDataError(message);
      }
    },
    [session]
  );

  const acceptCounterOffer = useCallback(
    async (offerId: string) => {
      const offer = counterOffers.find((entry) => entry.id === offerId);
      if (!offer || !session) return;

      try {
        const decision = await stagebookApi.bookingDecision(offer.bookingId, {
          status: "agreement",
          counterPriceZar: offer.proposedPriceZar,
          counterStartTime: offer.proposedStartTime,
          counterEndTime: offer.proposedEndTime
        });
        setBookings((prev) =>
          prev.map((entry) => (entry.id === offer.bookingId ? decision.booking : entry))
        );
        const message = await stagebookApi.sendChat(offer.bookingId, {
          body: `Counter-offer accepted at R${offer.proposedPriceZar.toLocaleString("en-ZA")} · ${offer.proposedStartTime}–${offer.proposedEndTime}.`,
          systemAction: "accept"
        });
        setChatMessages((prev) => [...prev, message]);
      } catch (error) {
        const message =
          error instanceof StagebookApiError ? error.message : "Unable to accept counter-offer";
        setDataError(message);
      }
    },
    [counterOffers, session]
  );

  const declineCounterOffer = useCallback(
    async (offerId: string) => {
      const offer = counterOffers.find((entry) => entry.id === offerId);
      if (!offer || !session) return;

      try {
        const decision = await stagebookApi.bookingDecision(offer.bookingId, { status: "declined" });
        setBookings((prev) =>
          prev.map((entry) => (entry.id === offer.bookingId ? decision.booking : entry))
        );
        const message = await stagebookApi.sendChat(offer.bookingId, {
          body: "Counter-offer declined.",
          systemAction: "decline"
        });
        setChatMessages((prev) => [...prev, message]);
      } catch (error) {
        const message =
          error instanceof StagebookApiError ? error.message : "Unable to decline counter-offer";
        setDataError(message);
      }
    },
    [counterOffers, session]
  );

  const acceptOffer = useCallback(
    async (bookingId: string) => {
      if (!session) return;
      try {
        const decision = await stagebookApi.bookingDecision(bookingId, { status: "agreement" });
        setBookings((prev) => prev.map((entry) => (entry.id === bookingId ? decision.booking : entry)));
        const message = await stagebookApi.sendChat(bookingId, {
          body: "Offer accepted.",
          systemAction: "accept"
        });
        setChatMessages((prev) => [...prev, message]);
      } catch (error) {
        const message =
          error instanceof StagebookApiError ? error.message : "Unable to accept offer";
        setDataError(message);
      }
    },
    [session]
  );

  const declineOffer = useCallback(
    async (bookingId: string) => {
      if (!session) return;
      try {
        const decision = await stagebookApi.bookingDecision(bookingId, { status: "declined" });
        setBookings((prev) => prev.map((entry) => (entry.id === bookingId ? decision.booking : entry)));
        const message = await stagebookApi.sendChat(bookingId, {
          body: "Offer declined.",
          systemAction: "decline"
        });
        setChatMessages((prev) => [...prev, message]);
      } catch (error) {
        const message =
          error instanceof StagebookApiError ? error.message : "Unable to decline offer";
        setDataError(message);
      }
    },
    [session]
  );

  const refreshThread = useCallback(async (bookingId: string) => {
    try {
      const [messages, bookingList] = await Promise.all([
        stagebookApi.listChat(bookingId),
        stagebookApi.listMyBookings()
      ]);
      setChatMessages((prev) => [
        ...prev.filter((message) => message.bookingId !== bookingId),
        ...messages
      ]);
      setBookings(bookingList);
    } catch {
      // silent polling refresh
    }
  }, []);

  const getContract = useCallback(
    (bookingId: string) => contracts.find((entry) => entry.bookingId === bookingId),
    [contracts]
  );

  const loadContract = useCallback(async (bookingId: string) => {
    try {
      const contract = await stagebookApi.getContract(bookingId);
      setContracts((prev) => [...prev.filter((entry) => entry.bookingId !== bookingId), contract]);
    } catch (error) {
      if (error instanceof StagebookApiError && error.status === 404) return;
    }
  }, []);

  const generateContract = useCallback(async (bookingId: string) => {
    try {
      const contract = await stagebookApi.generateContract(bookingId);
      setContracts((prev) => [...prev.filter((entry) => entry.bookingId !== bookingId), contract]);
    } catch (error) {
      const message =
        error instanceof StagebookApiError ? error.message : "Unable to generate contract";
      setDataError(message);
    }
  }, []);

  const signContract = useCallback(
    async (bookingId: string, signature: string) => {
      if (!session) return;
      try {
        const contract = await stagebookApi.signContract(bookingId, { method: "draw", value: signature });
        setContracts((prev) => prev.map((entry) => (entry.bookingId === bookingId ? contract : entry)));
        if (contract.status === "signed") {
          const message = await stagebookApi.sendChat(bookingId, {
            body: "Contract fully executed by artist and client.",
            systemAction: "contract"
          });
          setChatMessages((prev) => [...prev, message]);
        }
      } catch (error) {
        const message =
          error instanceof StagebookApiError ? error.message : "Unable to save signature";
        setDataError(message);
      }
    },
    [session]
  );

  const requestAmendment = useCallback(async (bookingId: string, feedback: string) => {
    try {
      const contract = await stagebookApi.requestContractRevision(bookingId, feedback);
      setContracts((prev) => prev.map((entry) => (entry.bookingId === bookingId ? contract : entry)));
    } catch (error) {
      const message =
        error instanceof StagebookApiError ? error.message : "Unable to request amendment";
      setDataError(message);
    }
  }, []);

  const getPaymentSchedule = useCallback(
    (bookingId: string) => {
      const booking = bookings.find((entry) => entry.id === bookingId);
      if (!booking) return null;
      return buildPaymentSchedule(booking.quotedPriceZar, booking.eventDate);
    },
    [bookings]
  );

  const createPayfastCheckout = useCallback(
    async (bookingId: string, phase: PayfastPaymentPhase) => {
      if (!session) return null;
      try {
        return await stagebookApi.createPayfastCheckout(bookingId, phase);
      } catch (error) {
        const message =
          error instanceof StagebookApiError ? error.message : "Unable to start PayFast checkout";
        setDataError(message);
        return null;
      }
    },
    [session]
  );

  const completePayfastPayment = useCallback(
    async (bookingId: string, phase: PayfastPaymentPhase) => {
      if (!session) return;
      try {
        const result = await stagebookApi.completePayfastSandbox(bookingId, phase);
        setBookings((prev) =>
          prev.map((entry) => (entry.id === bookingId ? result.booking : entry))
        );
        await refreshThread(bookingId);
      } catch (error) {
        const message =
          error instanceof StagebookApiError ? error.message : "Unable to complete payment";
        setDataError(message);
      }
    },
    [session, refreshThread]
  );

  const getCalendarState = useCallback(
    (artistId: string, date: string): CalendarSlotState => {
      const today = new Date().toISOString().slice(0, 10);
      if (date < today) return "past";
      const dayBookings = bookings.filter(
        (b) => b.artistProfileId === artistId && b.eventDate === date && b.status !== "cancelled"
      );
      const locked = dayBookings.some((b) => ["paid", "confirmed"].includes(b.status));
      if (locked || dayBookings.length >= 3) return "booked";
      if (dayBookings.length > 0) return "partial";
      return "available";
    },
    [bookings]
  );

  const createBooking = useCallback(
    async (draft: BookingDraft) => {
      if (!session) return { ok: false, error: "Sign in to create a booking." };

      const artist = artists.find((a) => a.id === draft.artistId);
      if (!artist) return { ok: false, error: "Artist not found" };

      const sameDay = bookings.filter(
        (b) => b.artistProfileId === draft.artistId && b.eventDate === draft.eventDate && b.status !== "cancelled"
      );

      for (const existing of sameDay) {
        if (slotOverlaps(draft.startTime, draft.endTime, existing.startTime, existing.endTime)) {
          return { ok: false, error: "This time slot overlaps an existing booking." };
        }
        const travel = assessTravelGap(
          {
            eventDate: draft.eventDate,
            startTime: draft.startTime,
            endTime: draft.endTime,
            latitude: draft.latitude,
            longitude: draft.longitude
          },
          existing
        );
        if (travel.blocked) return { ok: false, error: travel.message };
      }

      try {
        const result = await stagebookApi.createBooking({
          artistProfileId: draft.artistId,
          eventName: draft.eventName,
          eventType: draft.eventType,
          eventDate: draft.eventDate,
          startTime: draft.startTime,
          endTime: draft.endTime,
          locationLabel: draft.locationLabel,
          latitude: draft.latitude,
          longitude: draft.longitude,
          guestCount: draft.guestCount,
          quotedPriceZar: draft.quotedPriceZar,
          specialRequests: draft.specialRequests || undefined,
          technicalRider: draft.technicalRider || undefined
        });

        setBookings((prev) => [...prev, result.booking]);
        const intro = await stagebookApi.sendChat(result.booking.id, {
          body: `Booking request sent for ${draft.eventName} on ${draft.eventDate}.`,
          systemAction: "notification"
        });
        setChatMessages((prev) => [...prev, intro]);
        return { ok: true, bookingId: result.booking.id };
      } catch (error) {
        const message =
          error instanceof StagebookApiError ? error.message : "Unable to create booking";
        setDataError(message);
        return { ok: false, error: message };
      }
    },
    [session, artists, bookings]
  );

  const cancelBooking = useCallback(
    async (bookingId: string) => {
      const booking = bookings.find((b) => b.id === bookingId);
      if (!booking || !session) return;

      try {
        const result = await stagebookApi.cancelBooking(bookingId, "Cancelled by user");
        setBookings((prev) =>
          prev.map((entry) => (entry.id === bookingId ? result.booking : entry))
        );
        calculateCancellationRefund(booking.quotedPriceZar, booking.eventDate);
      } catch (error) {
        const message =
          error instanceof StagebookApiError ? error.message : "Unable to cancel booking";
        setDataError(message);
      }
    },
    [bookings, session]
  );

  const loadArtistDashboard = useCallback(async () => {
    if (!sessionUserId || sessionRole !== "artist") {
      setMyArtistProfile(null);
      setPayoutBalances(null);
      setPayouts([]);
      setVerificationStatus(null);
      return;
    }

    try {
      const profile = await stagebookApi.getMyArtistProfile();
      setMyArtistProfile((prev) =>
        prev?.id === profile.id && prev.stageName === profile.stageName ? prev : profile
      );
      setArtists((prev) => {
        const existing = prev.find((artist) => artist.id === profile.id);
        if (existing?.stageName === profile.stageName && existing.basePriceZar === profile.basePriceZar) {
          return prev;
        }
        return [...prev.filter((artist) => artist.id !== profile.id), profile];
      });
      const [balances, payoutList] = await Promise.all([
        stagebookApi.getPayoutBalances(profile.id),
        stagebookApi.listPayouts(profile.id)
      ]);
      setPayoutBalances(balances);
      setPayouts(payoutList);
      try {
        const verification = await stagebookApi.getVerification(profile.id);
        setVerificationStatus(verification.status);
      } catch {
        setVerificationStatus("unverified");
      }
    } catch (error) {
      const message =
        error instanceof StagebookApiError ? error.message : "Unable to load artist dashboard";
      setDataError(message);
    }
  }, [sessionUserId, sessionRole]);

  useEffect(() => {
    void loadArtistDashboard();
  }, [sessionUserId, sessionRole, loadArtistDashboard]);

  const completeBooking = useCallback(
    async (bookingId: string) => {
      if (!session) return;
      try {
        const result = await stagebookApi.completeBooking(bookingId);
        setBookings((prev) =>
          prev.map((entry) => (entry.id === bookingId ? result.booking : entry))
        );
        void loadArtistDashboard();
      } catch (error) {
        const message =
          error instanceof StagebookApiError ? error.message : "Unable to complete booking";
        setDataError(message);
      }
    },
    [session, loadArtistDashboard]
  );

  const updateMyArtistProfile = useCallback(
    async (patch: Partial<ArtistProfile>) => {
      if (!session || session.user.role !== "artist") return;
      try {
        const profile = await stagebookApi.updateArtistProfile(patch);
        setMyArtistProfile(profile);
        setArtists((prev) => prev.map((a) => (a.id === profile.id ? profile : a)));
      } catch (error) {
        const message =
          error instanceof StagebookApiError ? error.message : "Unable to update profile";
        setDataError(message);
      }
    },
    [session]
  );

  const requestPayout = useCallback(
    async (amountZar: number) => {
      if (!myArtistProfile) return;
      try {
        const payout = await stagebookApi.requestPayout(myArtistProfile.id, amountZar);
        setPayouts((prev) => [payout, ...prev]);
        const balances = await stagebookApi.getPayoutBalances(myArtistProfile.id);
        setPayoutBalances(balances);
      } catch (error) {
        const message =
          error instanceof StagebookApiError ? error.message : "Unable to request payout";
        setDataError(message);
      }
    },
    [myArtistProfile]
  );

  const submitArtistVerification = useCallback(async () => {
    if (!myArtistProfile) return;
    try {
      await stagebookApi.submitVerification(myArtistProfile.id, {
        southAfricanIdNumber: "9001015800084",
        idDocumentUrl: "https://docs.stagebook.local/id-scan.pdf",
        faceScanUrl: "https://docs.stagebook.local/face-scan.jpg"
      });
      const approved = await stagebookApi.approveVerification(myArtistProfile.id);
      setVerificationStatus(approved.status);
    } catch (error) {
      const message =
        error instanceof StagebookApiError ? error.message : "Unable to submit verification";
      setDataError(message);
    }
  }, [myArtistProfile]);

  const value = useMemo(
    () => ({
      artists,
      bookings,
      chatMessages,
      counterOffers,
      notifications,
      filters,
      setFilters,
      filteredArtists,
      dataLoading,
      dataError,
      refreshBookings,
      getArtist,
      getBooking,
      getBookingChat,
      getMessageThreads,
      getBookingContext,
      getPendingCounterOffer,
      getCounterOffer,
      markThreadRead,
      unreadMessageCount,
      sendMessage,
      sendCounterOffer,
      acceptCounterOffer,
      declineCounterOffer,
      acceptOffer,
      declineOffer,
      refreshThread,
      contracts,
      getContract,
      loadContract,
      generateContract,
      signContract,
      requestAmendment,
      getPaymentSchedule,
      createPayfastCheckout,
      completePayfastPayment,
      getCalendarState,
      createBooking,
      cancelBooking,
      completeBooking,
      myArtistProfile,
      payoutBalances,
      payouts,
      verificationStatus,
      loadArtistDashboard,
      updateMyArtistProfile,
      requestPayout,
      submitArtistVerification
    }),
    [
      artists,
      bookings,
      chatMessages,
      counterOffers,
      notifications,
      filters,
      setFilters,
      filteredArtists,
      dataLoading,
      dataError,
      refreshBookings,
      getArtist,
      getBooking,
      getBookingChat,
      getMessageThreads,
      getBookingContext,
      getPendingCounterOffer,
      getCounterOffer,
      markThreadRead,
      unreadMessageCount,
      sendMessage,
      sendCounterOffer,
      acceptCounterOffer,
      declineCounterOffer,
      acceptOffer,
      declineOffer,
      refreshThread,
      contracts,
      getContract,
      loadContract,
      generateContract,
      signContract,
      requestAmendment,
      getPaymentSchedule,
      createPayfastCheckout,
      completePayfastPayment,
      getCalendarState,
      createBooking,
      cancelBooking,
      completeBooking,
      myArtistProfile,
      payoutBalances,
      payouts,
      verificationStatus,
      loadArtistDashboard,
      updateMyArtistProfile,
      requestPayout,
      submitArtistVerification
    ]
  );

  return <StageBookContext.Provider value={value}>{children}</StageBookContext.Provider>;
}

export function useStageBook() {
  const ctx = useContext(StageBookContext);
  if (!ctx) throw new Error("useStageBook requires provider");
  return ctx;
}