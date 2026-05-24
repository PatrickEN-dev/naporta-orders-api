export interface CreateOrderItemInput {
  description: string;
  priceCents: number;
  quantity: number;
}

export interface CreateOrderAddressInput {
  zipCode: string;
  street: string;
  number: string;
  complement?: string | null;
  district: string;
  city: string;
  state: string;
  country?: string;
}

export interface CreateOrderInput {
  customerName: string;
  customerDocument: string;
  deliveryAddress: CreateOrderAddressInput;
  deliveryForecastAt: Date;
  items: CreateOrderItemInput[];
  actorId: string | null;
}
