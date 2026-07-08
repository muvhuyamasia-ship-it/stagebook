import {
  MOCK_CONTRACTS,
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
  type MessageThreadFilter,
  type MessageThreadSummary,
  type StageBookNotification,
  DEFAULT_DISCOVERY_FILTERS,
  type BookingRequest,
  type ChatMessage,
  type ContractRecord,
  type ArtistProfile,
  type PaymentSchedule
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
  contracts: ContractRecord[];
  notifications: StageBookNotification[];
  unreadMessageCount: number;
  filters: DiscoveryFilters;
  setFilters: (patch: Partial<DiscoveryFilters>) => void;
  filteredArtists: ArtistProfile[];
  getArtist: (id: string) => ArtistProfile | undefined;
  getBooking: (id: string) => BookingRequest | undefined;
  getBookingChat: (bookingId: string) => ChatMessage[];
  getMessageThreads: (filter?: MessageThreadFilter) => MessageThreadSummary[];
  getBookingContext: (bookingId: string) => BookingContextItem[];
  getPendingCounterOffer: (bookingId: string) => CounterOffer | undefined;
  getCounterOffer: (offerId: string) => CounterOffer | undefined;
  markThreadRead: (bookingId: string) => void;
  getContract: (bookingId: string) => ContractRecord | undefined;
  getCalendarState: (artistId: string, date: string) => CalendarSlotState;
  createBooking: (draft: BookingDraft) => Promise<{ ok: boolean; error?: string; bookingId?: string }>;
  refreshBookings: () => Promise<void>;
  dataLoading: boolean;
  dataError: string | null;
  updateBookingStatus: (bookingId: string, status: BookingRequest["status"]) => void;
  sendMessage: (bookingId: string, body: string) => void;
  sendCounterOffer: (
    bookingId: string,
    input: { priceZar: number; startTime: string; endTime: string; note?: string }
  ) => void;
  acceptCounterOffer: (offerId: string) => void;
  declineCounterOffer: (offerId: string) => void;
  acceptOffer: (bookingId: string) => void;
  declineOffer: (bookingId: string) => void;
  generateContract: (bookingId: string) => void;
  signContract: (bookingId: string, role: "artist" | "client", signature: string) => void;
  requestAmendment: (bookingId: string, feedback: string) => void;
  getPaymentSchedule: (bookingId: string) => PaymentSchedule | null;
  payDeposit: (bookingId: string) => void;
  confirmBalance: (bookingId: string) => void;
  cancelBooking: (bookingId: string) => void;
  markNotificationRead: (id: string) => void;
  unreadCount: number;
}

const StageBookContext = createContext<StageBookContextValue | null>(null);

function pushNotification(
  list: StageBookNotification[],
  notification: Omit<StageBookNotification, "id" | "createdAt" | "read">
) {
  return [
    {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      read: false
    },
    ...list
  ];
}

export function StageBookProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [artists, setArtists] = useState<ArtistProfile[]>([]);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [readAtByBooking, setReadAtByBooking] = useState<Record<string, string>>({});
  const [contracts, setContracts] = useState(MOCK_CONTRACTS);
  const [notifications, setNotifications] = useState<StageBookNotification[]>([
    {
      id: "seed-1",
      type: "booking_request",
      title: "New booking request",
      body: "Velvet Wedding Reception awaiting your response.",
      createdAt: new Date().toISOString(),
      read: false,
      bookingId: "booking-2"
    }
  ]);
  const [filters, setFiltersState] = useState<DiscoveryFilters>(DEFAULT_DISCOVERY_FILTERS);

  const counterOffers = useMemo(() => deriveCounterOffersFromChat(chatMessages), [chatMessages]);

  const refreshBookings = useCallback(async () => {
    if (!session) {
      setBookings([]);
      setChatMessages([]);
      return;
    }

    setDataLoading(true);
    setDataError(null);
    try {
      const nextBookings = await stagebookApi.listMyBookings();
      setBookings(nextBookings);
      const chats = await Promise.all(nextBookings.map((booking) => stagebookApi.listChat(booking.id)));
      setChatMessages(chats.flat());
    } catch (error) {
      const message =
        error instanceof StagebookApiError ? error.message : "Unable to load bookings";
      setDataError(message);
    } finally {
      setDataLoading(false);
    }
  }, [session]);

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
    void refreshBookings();

    return () => {
      cancelled = true;
    };
  }, [refreshBookings]);

  const setFilters = useCallback((patch: Partial<DiscoveryFilters>) => {
    setFiltersState((current) => ({ ...current, ...patch }));
  }, []);

  const filteredArtists = useMemo(() => {
    return artists.filter((artist) => {
      const q = filters.query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        artist.stageName.toLowerCase().includes(q) ||
        artist.genres.some((g) => g.toLowerCase().includes(q));
      const matchesGenre =
        filters.genre === "all" || artist.genres.some((g) => g.toLowerCase() === filters.genre.toLowerCase());
      const matchesBudget =
        artist.basePriceZar >= filters.minBudget && artist.basePriceZar <= filters.maxBudget;
      const matchesCity = !filters.city || artist.city.toLowerCase().includes(filters.city.toLowerCase());
      return matchesQuery && matchesGenre && matchesBudget && matchesCity;
    });
  }, [artists, filters]);

  const getArtist = useCallback((id: string) => artists.find((a) => a.id === id), [artists]);
  const getBooking = useCallback((id: string) => bookings.find((b) => b.id === id), [bookings]);
  const getBookingChat = useCallback(
    (bookingId: string) =>
      chatMessages
        .filter((m) => m.bookingId === bookingId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [chatMessages]
  );

  const artistNameById = useMemo(
    () => Object.fromEntries(artists.map((a) => [a.id, a.stageName])),
    [artists]
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
      const booking = bookings.find((b) => b.id === bookingId);
      if (!booking) return [];
      return buildBookingContext(booking, artistNameById[booking.artistProfileId] ?? "Artist");
    },
    [bookings, artistNameById]
  );

  const getPendingCounterOffer = useCallback(
    (bookingId: string) =>
      counterOffers.find((o) => o.bookingId === bookingId && o.status === "pending"),
    [counterOffers]
  );

  const getCounterOffer = useCallback(
    (offerId: string) => counterOffers.find((o) => o.id === offerId),
    [counterOffers]
  );

  const markThreadRead = useCallback((bookingId: string) => {
    setReadAtByBooking((prev) => ({ ...prev, [bookingId]: new Date().toISOString() }));
  }, []);

  const unreadMessageCount = useMemo(
    () => getMessageThreads("unread").reduce((sum, t) => sum + t.unreadCount, 0),
    [getMessageThreads]
  );
  const getContract = useCallback(
    (bookingId: string) => contracts.find((c) => c.bookingId === bookingId),
    [contracts]
  );

  const getCalendarState = useCallback(
    (artistId: string, date: string): CalendarSlotState => {
      const today = new Date().toISOString().slice(0, 10);
      if (date < today) return "past";
      const dayBookings = bookings.filter(
        (b) => b.artistProfileId === artistId && b.eventDate === date && b.status !== "cancelled"
      );
      if (dayBookings.length >= 3) return "booked";
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
        setNotifications((prev) =>
          pushNotification(prev, {
            type: result.booking.travelWarning ? "travel_warning" : "booking_request",
            title: result.booking.travelWarning
              ? "Booking created with travel warning"
              : "Booking request sent",
            body: `${draft.eventName} submitted to ${artist.stageName}.`,
            bookingId: result.booking.id
          })
        );

        return { ok: true, bookingId: result.booking.id };
      } catch (error) {
        const message =
          error instanceof StagebookApiError ? error.message : "Unable to create booking";
        return { ok: false, error: message };
      }
    },
    [artists, bookings, session]
  );

  const updateBookingStatus = useCallback((bookingId: string, status: BookingRequest["status"]) => {
    setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status } : b)));
  }, []);

  const sendMessage = useCallback(
    async (bookingId: string, body: string) => {
      if (!session) return;
      try {
        const message = await stagebookApi.sendChat(bookingId, { body });
        setChatMessages((prev) => [...prev, message]);
        setNotifications((prev) =>
          pushNotification(prev, {
            type: "chat_message",
            title: "New message",
            body,
            bookingId
          })
        );
      } catch (error) {
        const message =
          error instanceof StagebookApiError ? error.message : "Unable to send message";
        setDataError(message);
      }
    },
    [session]
  );

  const injectSystemTile = useCallback((bookingId: string, body: string, systemAction: ChatMessage["systemAction"]) => {
    setChatMessages((prev) => [
      ...prev,
      {
        id: `chat-${Date.now()}`,
        bookingId,
        senderUserId: "system",
        senderRole: "admin",
        body,
        createdAt: new Date().toISOString(),
        systemAction,
        messageType: "notification_tile"
      }
    ]);
  }, []);

  const sendCounterOffer = useCallback(
    async (
      bookingId: string,
      input: { priceZar: number; startTime: string; endTime: string; note?: string }
    ) => {
      if (!session) return;
      const booking = bookings.find((b) => b.id === bookingId);
      if (!booking) return;

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
            counterPriceZar: input.priceZar
          });
          setBookings((prev) =>
            prev.map((entry) => (entry.id === bookingId ? decision.booking : entry))
          );
        }

        const body = formatCounterOfferBody(draftOffer);
        const message = await stagebookApi.sendChat(bookingId, {
          body,
          systemAction: "counter_offer"
        });
        setChatMessages((prev) => [...prev, message]);
        setNotifications((prev) =>
          pushNotification(prev, {
            type: "counter_offer",
            title: "Counter-offer sent",
            body,
            bookingId
          })
        );
      } catch (error) {
        const message =
          error instanceof StagebookApiError ? error.message : "Unable to send counter-offer";
        setDataError(message);
      }
    },
    [bookings, session]
  );

  const acceptCounterOffer = useCallback(
    async (offerId: string) => {
      const offer = counterOffers.find((o) => o.id === offerId);
      if (!offer || !session) return;

      try {
        const decision = await stagebookApi.bookingDecision(offer.bookingId, {
          status: "agreement",
          counterPriceZar: offer.proposedPriceZar
        });
        setBookings((prev) =>
          prev.map((entry) => (entry.id === offer.bookingId ? decision.booking : entry))
        );
        const message = await stagebookApi.sendChat(offer.bookingId, {
          body: `Counter-offer accepted at R${offer.proposedPriceZar.toLocaleString("en-ZA")}. Proceed to contract and deposit.`,
          systemAction: "accept"
        });
        setChatMessages((prev) => [...prev, message]);
        setNotifications((prev) =>
          pushNotification(prev, {
            type: "counter_offer",
            title: "Counter-offer accepted",
            body: `Terms updated for booking ${offer.bookingId}.`,
            bookingId: offer.bookingId
          })
        );
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
      const offer = counterOffers.find((o) => o.id === offerId);
      if (!offer || !session) return;

      try {
        const decision = await stagebookApi.bookingDecision(offer.bookingId, { status: "declined" });
        setBookings((prev) =>
          prev.map((entry) => (entry.id === offer.bookingId ? decision.booking : entry))
        );
        const message = await stagebookApi.sendChat(offer.bookingId, {
          body: "Counter-offer declined. Continue negotiating or close the request.",
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
          body: "Offer accepted. Proceed to contract generation and deposit payment.",
          systemAction: "accept"
        });
        setChatMessages((prev) => [...prev, message]);
        setNotifications((prev) =>
          pushNotification(prev, {
            type: "booking_request",
            title: "Offer accepted",
            body: "Agreement reached. Contract and escrow deposit are next.",
            bookingId
          })
        );
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

  const generateContract = useCallback(
    (bookingId: string) => {
      const booking = bookings.find((b) => b.id === bookingId);
      if (!booking) return;
      const artist = artists.find((a) => a.id === booking.artistProfileId);
      const weddingClause =
        booking.eventType === "Wedding"
          ? "\n\n## Wedding Liability Waiver\nSpecial event indemnity and venue coordination clauses apply."
          : "";
      const riderClause = booking.technicalRider
        ? `\n\n## Technical Rider\n${booking.technicalRider}`
        : "";

      const contract: ContractRecord = {
        id: `contract-${Date.now()}`,
        bookingId,
        status: "pending_signatures",
        bodyMarkdown: `# Performance Agreement (Version 1)\n\n**Client Event:** ${booking.eventName}\n**Artist:** ${artist?.stageName}\n**Venue:** ${booking.locationLabel}\n**Date:** ${booking.eventDate}\n**Final Price:** R${booking.quotedPriceZar.toLocaleString()} ZAR${weddingClause}${riderClause}\n\n## Escrow\n30% deposit due at signing. Balance due 48h before performance.`,
        pdfUrl: undefined
      };

      setContracts((prev) => [...prev.filter((c) => c.bookingId !== bookingId), contract]);
      setNotifications((prev) =>
        pushNotification(prev, {
          type: "contract_signature",
          title: "Contract ready for signature",
          body: `${booking.eventName} agreement generated.`,
          bookingId
        })
      );
    },
    [artists, bookings]
  );

  const signContract = useCallback(
    (bookingId: string, role: "artist" | "client", signature: string) => {
      setContracts((prev) =>
        prev.map((contract) => {
          if (contract.bookingId !== bookingId) return contract;
          const patch =
            role === "artist"
              ? {
                  artistSignature: {
                    signerUserId: session?.user.id ?? role,
                    signerRole: session?.user.role ?? "artist",
                    method: "draw" as const,
                    value: signature,
                    signedAt: new Date().toISOString()
                  }
                }
              : {
                  clientSignature: {
                    signerUserId: session?.user.id ?? role,
                    signerRole: "client" as const,
                    method: "draw" as const,
                    value: signature,
                    signedAt: new Date().toISOString()
                  }
                };
          const next = { ...contract, ...patch };
          if (next.artistSignature && next.clientSignature) {
            next.status = "signed";
            next.pdfUrl = `/contracts/${bookingId}.pdf`;
          }
          return next;
        })
      );
    },
    [session]
  );

  const requestAmendment = useCallback((bookingId: string, feedback: string) => {
    setContracts((prev) =>
      prev.map((contract) =>
        contract.bookingId === bookingId
          ? {
              ...contract,
              status: "revision_requested",
              bodyMarkdown: `${contract.bodyMarkdown}\n\n---\n**Amendment Request (Version 2 - Edited):** ${feedback}`
            }
          : contract
      )
    );
  }, []);

  const getPaymentSchedule = useCallback(
    (bookingId: string) => {
      const booking = bookings.find((b) => b.id === bookingId);
      if (!booking) return null;
      return buildPaymentSchedule(booking.quotedPriceZar, booking.eventDate);
    },
    [bookings]
  );

  const payDeposit = useCallback(
    (bookingId: string) => {
      updateBookingStatus(bookingId, "paid");
      injectSystemTile(
        bookingId,
        "Payment confirmed: 30% escrow deposit captured. Calendar slot locked globally across StageBook.",
        "payment"
      );
      setNotifications((prev) =>
        pushNotification(prev, {
          type: "payment_confirmed",
          title: "Deposit confirmed",
          body: "30% escrow deposit captured. Calendar slot locked globally.",
          bookingId
        })
      );
    },
    [updateBookingStatus, injectSystemTile]
  );

  const confirmBalance = useCallback(
    (bookingId: string) => {
      updateBookingStatus(bookingId, "confirmed");
      setNotifications((prev) =>
        pushNotification(prev, {
          type: "payment_confirmed",
          title: "Booking confirmed",
          body: "Remaining 70% balance collected. Engagement fully confirmed.",
          bookingId
        })
      );
    },
    [updateBookingStatus]
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
        const refund = calculateCancellationRefund(booking.quotedPriceZar, booking.eventDate);
        setNotifications((prev) =>
          pushNotification(prev, {
            type: "cancellation",
            title: "Booking cancelled",
            body: `${refund.policyLabel}. Refund: R${refund.refundAmountZar.toLocaleString()}.`,
            bookingId
          })
        );
      } catch (error) {
        const message =
          error instanceof StagebookApiError ? error.message : "Unable to cancel booking";
        setDataError(message);
      }
    },
    [bookings, session]
  );

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const value = useMemo(
    () => ({
      artists,
      bookings,
      chatMessages,
      counterOffers,
      contracts,
      notifications,
      unreadMessageCount,
      filters,
      setFilters,
      filteredArtists,
      getArtist,
      getBooking,
      getBookingChat,
      getMessageThreads,
      getBookingContext,
      getPendingCounterOffer,
      getCounterOffer,
      markThreadRead,
      getContract,
      getCalendarState,
      createBooking,
      refreshBookings,
      dataLoading,
      dataError,
      updateBookingStatus,
      sendMessage,
      sendCounterOffer,
      acceptCounterOffer,
      declineCounterOffer,
      acceptOffer,
      declineOffer,
      generateContract,
      signContract,
      requestAmendment,
      getPaymentSchedule,
      payDeposit,
      confirmBalance,
      cancelBooking,
      markNotificationRead,
      unreadCount
    }),
    [
      artists,
      bookings,
      chatMessages,
      counterOffers,
      contracts,
      notifications,
      unreadMessageCount,
      filters,
      setFilters,
      filteredArtists,
      getArtist,
      getBooking,
      getBookingChat,
      getMessageThreads,
      getBookingContext,
      getPendingCounterOffer,
      getCounterOffer,
      markThreadRead,
      getContract,
      getCalendarState,
      createBooking,
      refreshBookings,
      dataLoading,
      dataError,
      updateBookingStatus,
      sendMessage,
      sendCounterOffer,
      acceptCounterOffer,
      declineCounterOffer,
      acceptOffer,
      declineOffer,
      generateContract,
      signContract,
      requestAmendment,
      getPaymentSchedule,
      payDeposit,
      confirmBalance,
      cancelBooking,
      markNotificationRead,
      unreadCount
    ]
  );

  return <StageBookContext.Provider value={value}>{children}</StageBookContext.Provider>;
}

export function useStageBook() {
  const ctx = useContext(StageBookContext);
  if (!ctx) throw new Error("useStageBook must be used within StageBookProvider");
  return ctx;
}