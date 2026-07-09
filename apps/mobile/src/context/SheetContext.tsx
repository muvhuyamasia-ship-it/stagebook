import { createContext, useContext, useRef, type ReactNode } from "react";
import {
  BookingWizardSheet,
  type BookingWizardOpenOptions,
  type BookingWizardSheetRef
} from "../components/BookingWizardSheet";
import {
  FiltersBottomSheet,
  type FiltersBottomSheetRef
} from "../components/FiltersBottomSheet";
import { useStageBook } from "./StageBookContext";

interface SheetContextValue {
  openFilters: () => void;
  closeFilters: () => void;
  openBookingWizard: (artistId: string, options?: BookingWizardOpenOptions) => void;
  closeBookingWizard: () => void;
}

const SheetContext = createContext<SheetContextValue | null>(null);

export function SheetProvider({ children }: { children: ReactNode }) {
  const filtersRef = useRef<FiltersBottomSheetRef>(null);
  const bookingRef = useRef<BookingWizardSheetRef>(null);
  const { filters, setFilters, filteredArtists } = useStageBook();

  const value: SheetContextValue = {
    openFilters: () => filtersRef.current?.open(),
    closeFilters: () => filtersRef.current?.close(),
    openBookingWizard: (artistId, options) => bookingRef.current?.open(artistId, options),
    closeBookingWizard: () => bookingRef.current?.close()
  };

  return (
    <SheetContext.Provider value={value}>
      {children}
      <FiltersBottomSheet
        ref={filtersRef}
        filters={filters}
        onChange={setFilters}
        resultCount={filteredArtists.length}
      />
      <BookingWizardSheet ref={bookingRef} />
    </SheetContext.Provider>
  );
}

export function useSheets() {
  const ctx = useContext(SheetContext);
  if (!ctx) throw new Error("useSheets requires SheetProvider");
  return ctx;
}