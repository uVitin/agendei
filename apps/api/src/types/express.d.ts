/**
 * Adiciona campos nossos ao Request do Express.
 * O middleware `authenticate` preenche professionalId a partir do token.
 */
declare global {
  namespace Express {
    interface Request {
      professionalId?: string;
    }
  }
}

export {};
