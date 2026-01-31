# Plan Testów: Obsługa Błędów

Ten dokument opisuje plan testów dla narzędzi do obsługi błędów w komponentach feature'owych.

## Cel

Zapewnienie, że błędy z API są poprawnie interpretowane i wyświetlane użytkownikowi w czytelnej formie.

## Zakres

- `src/components/features/accounts/utils.ts` (oraz inne podobne pliki utils).

## Scenariusze Testowe

### 1. Ekstrakcja błędów (`extractAccountFormErrors`)

- [ ] **Błąd Walidacji (Zod)**:
  - Wejście: Obiekt błędu z tablicą `details` (pole, wiadomość).
  - Wynik: Obiekt `fieldErrors` z odpowiednimi kluczami.
- [ ] **Błąd Konfliktu (409)**:
  - Wejście: Error ze statusem 409.
  - Wynik: Specyficzna wiadomość dla pola `name` ("Konto o tej nazwie już istnieje").
- [ ] **Błąd Nie Znaleziono (404)**:
  - Wynik: Ogólna wiadomość `generalError` o braku rekordu.
- [ ] **Błąd Serwera (500)**:
  - Wynik: Ogólna wiadomość o błędzie serwera.
- [ ] **Nieoczekiwany obiekt**:
  - Wejście: String lub pusty Error.
  - Wynik: Standardowa wiadomość "Nieoczekiwany błąd".

## Narzędzia

- Vitest
