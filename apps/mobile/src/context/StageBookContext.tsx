import {
  StagebookApiError,
  buildBookingContext,
  buildMessageThreads,
  buildPaymentSchedule,
  deriveCounterOffersFromChat,
  formatCounterOfferBody,
  type BookingContextItem,
  type CounterOffer,
  type DiscoveryFilters,
  type MessageThreadFilter,
  type MessageThreadSummary,
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
}

const StageBookContext = createContext<StageBookContextValue | null>(null);

export function StageBookProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [artists, setArtists] = useState<ArtistProfile[]>([]);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [readAtByBooking, setReadAtByBooking] = useState<Record<string, string>>({});
  const [notifications] = useState<StageBookNotification[]>([]);
  const [filters, setFiltersState] = useState(DEFAULT_DISCOVERY_FILTERS);
  const [contracts, setContracts] = useState<ContractRecord[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

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
      const contractResults = await Promise.allSettled(
        nextBookings.map((booking) => stagebookApi.getContract(booking.id))
      );
      setContracts(
        contractResults
          .filter((result): result is PromiseFulfilledResult<ContractRecord> => result.status === "fulfilled")
          .map((result) => result.value)
      );
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

  const setFilters = (patch: Partial<DiscoveryFilters>) =>
    setFiltersState((current) => ({ ...current, ...patch }));

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

  const getArtist = (id: string) => artists.find((artist) => artist.id === id);
  const getBooking = (id: string) => bookings.find((booking) => booking.id === id);
  const getBookingChat = (id: string) =>
    chatMessages
      .filter((message) => message.bookingId === id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

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

  const getBookingContext = (bookingId: string) => {
    const booking = bookings.find((entry) => entry.id === bookingId);
    if (!booking) return [];
    return buildBookingContext(booking, artistNameById[booking.artistProfileId] ?? "Artist");
  };

  const getPendingCounterOffer = (bookingId: string) =>
    counterOffers.find((offer) => offer.bookingId === bookingId && offer.status === "pending");

  const getCounterOffer = (offerId: string) => counterOffers.find((offer) => offer.id === offerId);

  const markThreadRead = (bookingId: string) => {
    setReadAtByBooking((prev) => ({ ...prev, [bookingId]: new Date().toISOString() }));
  };

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
            counterPriceZar: input.priceZar
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
          counterPriceZar: offer.proposedPriceZar
        });
        setBookings((prev) =>
          prev.map((entry) => (entry.id === offer.bookingId ? decision.booking : entry))
        );
        const message = await stagebookApi.sendChat(offer.bookingId, {
          body: `Counter-offer accepted at R${offer.proposedPriceZar.toLocaleString("en-ZA")}.`,
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

  const getContract = (bookingId: string) => contracts.find((entry) => entry.bookingId === bookingId);

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

  return (
    <StageBookContext.Provider
      value={{
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
        completePayfastPayment
      }}
    >
      {children}
    </StageBookContext.Provider>
  );
}

export function useStageBook() {
  const ctx = useContext(StageBookContext);
  if (!ctx) throw new Error("useStageBook requires provider");
  return ctx;
}