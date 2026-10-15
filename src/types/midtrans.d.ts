interface MidtransCardTokenResponse {
  status_code: string
  status_message?: string
  token_id?: string
  validation_messages?: string[]
}

interface MidtransRegisterCardResponse {
  status_code: string
  status_message?: string
  saved_token_id?: string
  masked_card?: string
  validation_messages?: string[]
}

interface MidtransCardData {
  card_number: string
  card_exp_month: string
  card_exp_year: string
  card_cvv: string
}

/** Midtrans' 3DS script: tokenizes cards in the browser and runs the bank's 3-D Secure step. */
interface MidtransNew3dsApi {
  getCardToken(
    card: MidtransCardData,
    options: {
      onSuccess: (response: MidtransCardTokenResponse) => void
      onFailure: (response: MidtransCardTokenResponse) => void
    }
  ): void
  /** Saves a card for later charges without paying now; returns a saved_token_id. */
  registerCard(
    card: MidtransCardData,
    options: {
      onSuccess: (response: MidtransRegisterCardResponse) => void
      onFailure: (response: MidtransRegisterCardResponse) => void
    }
  ): void
  authenticate(
    redirectUrl: string,
    options: {
      performAuthentication: (url: string) => void
      onSuccess: (response: unknown) => void
      onFailure: (response: unknown) => void
      onPending: (response: unknown) => void
    }
  ): void
}

interface Window {
  /** Loaded on demand by the checkout card form. */
  MidtransNew3ds?: MidtransNew3dsApi
}
