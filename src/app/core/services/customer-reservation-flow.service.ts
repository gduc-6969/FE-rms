import { Injectable, signal } from '@angular/core';
import { MockDataService } from './mock-data.service';

export interface ReservationTableOption {
  id: number;
  name: string;
  capacity: number;
  area: string;
  status: 'available' | 'occupied' | 'disabled';
}

export interface CustomerReservationDraft {
  guests: number;
  date: string;
  time: string;
  table: ReservationTableOption;
}

export interface CustomerReservation {
  id: number;
  guests: number;
  date: string;
  time: string;
  table: ReservationTableOption;
  status: 'pending' | 'accepted' | 'denied';
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class CustomerReservationFlowService {
  private static readonly DRAFT_KEY = 'rms-reservation-draft';

  readonly selectedDraft = signal<CustomerReservationDraft | null>(this.hydrateDraft());
  readonly myReservations = signal<CustomerReservation[]>([]);

  readonly tableLayout = signal<ReservationTableOption[]>(
    this.mockDataService.getDiningTables().map(table => ({
      id: table.id,
      name: table.name,
      capacity: table.capacity,
      area: table.area,
      status: table.status === 'available' ? 'available' : table.status === 'disabled' ? 'disabled' : 'occupied'
    }))
  );

  constructor(private readonly mockDataService: MockDataService) {}

  setDraft(payload: CustomerReservationDraft): void {
    this.selectedDraft.set(payload);
    sessionStorage.setItem(CustomerReservationFlowService.DRAFT_KEY, JSON.stringify(payload));
  }

  clearDraft(): void {
    this.selectedDraft.set(null);
    sessionStorage.removeItem(CustomerReservationFlowService.DRAFT_KEY);
  }

  submitReservation(): void {
    const draft = this.selectedDraft();
    if (!draft) return;

    const newReservation: CustomerReservation = {
      id: Date.now(),
      guests: draft.guests,
      date: draft.date,
      time: draft.time,
      table: draft.table,
      status: 'pending',
      createdAt: new Date()
    };

    this.myReservations.update(reservations => [...reservations, newReservation]);
    this.clearDraft();
  }

  private hydrateDraft(): CustomerReservationDraft | null {
    const raw = sessionStorage.getItem(CustomerReservationFlowService.DRAFT_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as CustomerReservationDraft;
    } catch {
      sessionStorage.removeItem(CustomerReservationFlowService.DRAFT_KEY);
      return null;
    }
  }
}
