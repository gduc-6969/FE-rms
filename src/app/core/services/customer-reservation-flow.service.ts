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

@Injectable({
  providedIn: 'root'
})
export class CustomerReservationFlowService {
  readonly selectedDraft = signal<CustomerReservationDraft | null>(null);

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
  }

  clearDraft(): void {
    this.selectedDraft.set(null);
  }
}
