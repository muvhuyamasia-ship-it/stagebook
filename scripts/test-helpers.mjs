const RUN_EPOCH = Date.now();
let slotCounter = 0;
const TIME_SLOTS = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];

export function uniqueBookingSlot(seed = 0) {
  slotCounter += 1;
  const offset = slotCounter + seed;
  const eventDate = new Date(RUN_EPOCH + offset * 86_400_000).toISOString().slice(0, 10);
  const startTime = TIME_SLOTS[offset % TIME_SLOTS.length];
  const [h] = startTime.split(":").map(Number);
  const endTime = `${String(h + 2).padStart(2, "0")}:00`;
  return { eventDate, startTime, endTime };
}