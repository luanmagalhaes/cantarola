export class ServiceError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ServiceError";
  }
}

export const messages = {
  400: "Faltou alguma informação no pedido.",
  401: "Você não está nessa sala.",
  403: "Essa jogada não é sua.",
  404: "Essa sala não existe.",
  409: "A sala mudou enquanto você jogava. Recarregue a página.",
  500: "Deu ruim aqui do nosso lado. Tente de novo.",
} as const;

export function messageFor(status: number): string {
  if (status in messages) {
    return messages[status as keyof typeof messages];
  }

  return messages[500];
}
