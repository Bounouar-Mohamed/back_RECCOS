import { UserRole } from '../enums/user-role.enum';

export interface JwtPayload {
  sub: string; // user id
  email: string;
  role?: UserRole;
}
