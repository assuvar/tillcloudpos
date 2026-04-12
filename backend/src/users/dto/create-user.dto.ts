export class CreateUserDto {
  name?: string;
  fullName: string;
  email: string;
  phone?: string;
  role?: 'ADMIN' | 'MANAGER' | 'CASHIER' | 'KITCHEN';
  password?: string;
  pin?: string;
  isActive?: boolean;
}
