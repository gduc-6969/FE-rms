export type Role = 'QUAN_LY' | 'NHAN_VIEN' | 'KHACH_HANG';
export type UserStatus = 'hoat_dong' | 'ngung_hoat_dong';

export interface UserResponse {
  id: number;
  role: Role;
  fullName: string;
  phone: string;
  email: string;
  username: string;
  status: UserStatus;
  createdAt: string; 
  }