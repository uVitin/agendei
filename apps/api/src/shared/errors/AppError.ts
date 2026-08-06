/**
 * Erro esperado de negócio — algo que o cliente da API fez de errado
 * e precisa saber. Diferente de erro inesperado (bug), que vira 500.
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 400,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}
