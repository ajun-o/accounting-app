export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  avatar?: string;
  coupleId?: string;
  createdAt: string;
}

export interface Couple {
  id: string;
  name: string;
  user1Id: string;
  user2Id?: string;
  createdAt: string;
}

export interface Bill {
  id: string;
  amount: number;
  description: string;
  category: string;
  payerId: string;
  coupleId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
}
