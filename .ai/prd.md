# Dokument wymagań produktu (PRD) - 10xPersonal Finance

## 1. Przegląd produktu

Celem projektu "10xPersonal Finance" jest stworzenie aplikacji internetowej w wersji MVP (Minimum Viable Product), która umożliwi użytkownikom świadome zarządzanie finansami osobistymi. Aplikacja skupi się na ręcznym śledzeniu wydatków, przychodów oraz transferów między kontami, a także na prostym mechanizmie budżetowania. Głównym założeniem jest dostarczenie narzędzia, które w jednym miejscu gromadzi informacje o stanie finansów użytkownika, pomagając w ten sposób w lepszym planowaniu i oszczędzaniu.

## 2. Problem użytkownika

Użytkownicy często borykają się z problemem braku kontroli nad swoimi finansami, co wynika z kilku czynników:
- Posiadanie wielu kont bankowych utrudnia całościowe spojrzenie na sytuację finansową.
- Łatwość dokonywania płatności bezgotówkowych (kartą, telefonem) sprawia, że użytkownicy nie są świadomi dokładnych kwot swoich wydatków i nie "czują" odpływu pieniędzy.
- Brak jednego, scentralizowanego miejsca do agregacji danych o transakcjach prowadzi do trudności w analizie wydatków, planowaniu oszczędności i efektywnym zarządzaniu budżetem domowym.
- Określenie i monitorowanie miesięcznego budżetu jest często procesem żmudnym i nieintuicyjnym.

## 3. Wymagania funkcjonalne

### 3.1. Autentykacja i Zarządzanie Użytkownikiem
- Użytkownicy muszą mieć możliwość założenia konta za pomocą adresu e-mail i hasła.
- Użytkownicy muszą mieć możliwość zalogowania się do aplikacji.
- System musi zapewniać możliwość wylogowania się.
- Musi istnieć funkcja resetowania zapomnianego hasła.
- Dane każdego użytkownika muszą być odizolowane i niedostępne dla innych.
- Użytkownik ma dostęp do podstawowych ustawień profilu (w MVP placeholder lub prosta edycja).
- Użytkownik może przełączać motyw aplikacji (Jasny/Ciemny/System).

### 3.2. Zarządzanie Kontami
- Użytkownik może dodawać konta, podając ich nazwę, saldo początkowe i walutę (w MVP domyślnie PLN).
- Użytkownik może edytować nazwę i saldo początkowe istniejących kont.
- Użytkownik może usuwać konta. Usunięcie konta powinno wiązać się z usunięciem powiązanych z nim transakcji.

### 3.3. Zarządzanie Kategoriami
- Aplikacja dostarcza predefiniowaną listę kategorii dla wydatków i przychodów.
- Użytkownik ma dedykowaną sekcję do zarządzania kategoriami (dodawanie, edycja, usuwanie).

### 3.4. Zarządzanie Transakcjami
- Użytkownik może dodawać trzy typy transakcji: Wydatek, Przychód, Transfer.
- Wprowadzanie transakcji odbywa się za pomocą jednego formularza, który dynamicznie dostosowuje pola w zależności od wybranego typu.
- Każda transakcja musi zawierać kwotę i datę. Opcjonalnie można dodać opis.
- Wydatki i przychody muszą być przypisane do konta i kategorii.
- Transfery muszą być przypisane do konta źródłowego i docelowego.
- Użytkownik ma dostęp do strony z historią wszystkich transakcji, posortowaną domyślnie od najnowszej.
- Lista transakcji jest filtrowalna (po dacie, koncie, kategorii).

### 3.5. Budżetowanie
- Użytkownik może tworzyć miesięczne budżety.
- Każdy budżet ma nazwę, kwotę i przypisane do niego kategorie wydatków.
- Jedna kategoria może należeć tylko do jednego budżetu.
- Użytkownik może edytować i usuwać istniejące budżety.

### 3.6. Pulpit (Dashboard)
- Jest to główny ekran aplikacji widoczny po zalogowaniu.
- Domyślnie wyświetla dane dla bieżącego miesiąca, z możliwością zmiany okresu.
- Prezentuje podsumowanie sumy przychodów i wydatków.
- Zawiera wykres kołowy przedstawiający strukturę wydatków w podziale na kategorie.
- Wyświetla listę ostatnich transakcji.
- Prezentuje listę wszystkich zdefiniowanych budżetów wraz z paskami postępu ich wykorzystania.

### 3.7. Interfejs i Nawigacja (Global Layout)
- Przycisk "Dodaj transakcję" jest widoczny w najbardziej eksponowanym miejscu (Góra paska bocznego na Desktop, FAB na Mobile).
- Logo aplikacji jest interaktywnym linkiem prowadzącym do Pulpitu.

## 4. Granice produktu

### W zakresie MVP:
- Pełny cykl autentykacji użytkownika.
- Ręczne dodawanie i zarządzanie kontami, kategoriami, transakcjami i budżetami.
- Obsługa wyłącznie jednej waluty: PLN.
- Podstawowy pulpit analityczny i historia transakcji.
- Obsługa transferów między kontami użytkownika.
- Obsługa trybu ciemnego i jasnego.

### Poza zakresem MVP:
- Automatyczna integracja z systemami bankowymi.
- Zaawansowane raporty, statystyki i wykresy.
- System powiadomień (np. o przekroczeniu budżetu).
- Obsługa wielu walut i automatyczne przeliczanie kursów.
- Dedykowany kreator onboardingowy dla nowych użytkowników.
- Globalna paleta komend (Command Palette).

## 5. Historyjki użytkowników

### Autentykacja

- ID: US-001
- Tytuł: Rejestracja nowego użytkownika
- Opis: Jako nowy użytkownik, chcę móc założyć konto w aplikacji przy użyciu mojego adresu e-mail i hasła, aby uzyskać dostęp do jej funkcjonalności.
- Kryteria akceptacji:
  1. Formularz rejestracji zawiera pola na adres e-mail, hasło i potwierdzenie hasła.
  2. System waliduje poprawność formatu adresu e-mail.
  3. System sprawdza, czy hasła w obu polach są identyczne.
  4. Po pomyślnej rejestracji, użytkownik jest automatycznie zalogowany i przekierowany na pulpit.
  5. W przypadku, gdy e-mail jest już zajęty, wyświetlany jest stosowny komunikat.

- ID: US-002
- Tytuł: Logowanie użytkownika
- Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się do aplikacji przy użyciu mojego e-maila i hasła, aby kontynuować zarządzanie moimi finansami.
- Kryteria akceptacji:
  1. Formularz logowania zawiera pola na adres e-mail i hasło.
  2. Po poprawnym wprowadzeniu danych, użytkownik jest przekierowany na pulpit.
  3. W przypadku błędnych danych, wyświetlany jest odpowiedni komunikat.

- ID: US-003
- Tytuł: Wylogowanie użytkownika
- Opis: Jako zalogowany użytkownik, chcę móc się wylogować z aplikacji, aby zabezpieczyć dostęp do moich danych.
- Kryteria akceptacji:
  1. W interfejsie aplikacji znajduje się widoczny przycisk "Wyloguj" (w menu użytkownika).
  2. Po kliknięciu przycisku sesja użytkownika jest kończona i jest on przekierowywany na stronę logowania.

- ID: US-004
- Tytuł: Resetowanie hasła
- Opis: Jako zarejestrowany użytkownik, który zapomniał hasła, chcę mieć możliwość jego zresetowania, aby odzyskać dostęp do mojego konta.
- Kryteria akceptacji:
  1. Na stronie logowania znajduje się link "Zapomniałem hasła".
  2. Po jego kliknięciu użytkownik jest proszony o podanie swojego adresu e-mail.
  3. Na podany adres e-mail wysyłany jest link z instrukcją do zresetowania hasła.
  4. Po kliknięciu w link, użytkownik może ustawić nowe hasło.

### Zarządzanie Kontami bankowymi

- ID: US-005
- Tytuł: Dodawanie nowego konta bankowego
- Opis: Jako użytkownik, chcę móc dodać swoje konto bankowe, podając jego nazwę i saldo początkowe, aby rozpocząć śledzenie transakcji.
- Kryteria akceptacji:
  1. Użytkownik może otworzyć formularz dodawania nowego konta.
  2. Formularz wymaga podania nazwy konta i salda początkowego.
  3. Waluta jest domyślnie ustawiona na PLN bez możliwości zmiany w MVP.
  4. Po dodaniu, nowe konto jest widoczne na liście kont, a jego saldo jest równe saldu początkowemu.

- ID: US-006
- Tytuł: Edycja istniejącego konta
- Opis: Jako użytkownik, chcę mieć możliwość edycji nazwy i salda początkowego moich kont, aby poprawić ewentualne błędy.
- Kryteria akceptacji:
  1. Na liście kont przy każdej pozycji znajduje się opcja edycji.
  2. Formularz edycji pozwala na zmianę nazwy i salda początkowego.
  3. Zmiana salda początkowego powoduje ponowne przeliczenie aktualnego salda konta.

- ID: US-007
- Tytuł: Usuwanie konta
- Opis: Jako użytkownik, chcę móc usunąć konto, którego już nie używam, aby utrzymać porządek w aplikacji.
- Kryteria akceptacji:
  1. Użytkownik może zainicjować akcję usunięcia konta.
  2. Przed ostatecznym usunięciem wyświetlane jest okno z prośbą o potwierdzenie.
  3. Usunięcie konta powoduje usunięcie wszystkich powiązanych z nim transakcji i jest nieodwracalne.

### Zarządzanie Transakcjami

- ID: US-008
- Tytuł: Dodawanie nowego wydatku
- Opis: Jako użytkownik, chcę móc szybko dodać nowy wydatek, określając kwotę, datę, kategorię i konto, z którego dokonano płatności, aby na bieżąco śledzić moje koszty.
- Kryteria akceptacji:
  1. W formularzu transakcji, po wybraniu typu "Wydatek", widoczne są pola: kwota, data, kategoria, konto, opis (opcjonalny).
  2. Pole "kategoria" zawiera listę kategorii wydatkowych.
  3. Pole "konto" zawiera listę moich dodanych kont.
  4. Po dodaniu wydatku, saldo wybranego konta jest pomniejszane o jego kwotę.
  5. Nowa transakcja jest widoczna na liście transakcji i na pulpicie.

- ID: US-009
- Tytuł: Dodawanie nowego przychodu
- Opis: Jako użytkownik, chcę móc zarejestrować przychód, podając jego kwotę, datę, kategorię i konto, na które wpłynęły środki, aby mieć pełny obraz moich finansów.
- Kryteria akceptacji:
  1. W formularzu transakcji, po wybraniu typu "Przychód", widoczne są pola: kwota, data, kategoria, konto, opis (opcjonalny).
  2. Pole "kategoria" zawiera listę kategorii przychodowych.
  3. Po dodaniu przychodu, saldo wybranego konta jest powiększane o jego kwotę.
  4. Nowa transakcja jest widoczna na liście transakcji i na pulpicie.

- ID: US-010
- Tytuł: Rejestrowanie transferu między kontami
- Opis: Jako użytkownik, chcę móc zarejestrować transfer pieniędzy między moimi kontami, aby salda w aplikacji zgadzały się ze stanem faktycznym.
- Kryteria akceptacji:
  1. W formularzu transakcji, po wybraniu typu "Transfer", widoczne są pola: kwota, data, konto źródłowe, konto docelowe, opis (opcjonalny).
  2. Po zarejestrowaniu transferu, saldo konta źródłowego jest pomniejszane, a docelowego powiększane o kwotę transferu.
  3. Transfer jest widoczny na liście transakcji, ale nie jest wliczany do sumy przychodów i wydatków na pulpicie.

- ID: US-011
- Tytuł: Przeglądanie historii transakcji
- Opis: Jako użytkownik, chcę mieć dostęp do listy wszystkich moich transakcji, z możliwością filtrowania, abym mógł analizować moje finanse.
- Kryteria akceptacji:
  1. Istnieje dedykowana strona "Historia" z listą wszystkich transakcji.
  2. Domyślnie transakcje są posortowane od najnowszej do najstarszej.
  3. Użytkownik może filtrować listę transakcji po zakresie dat, koncie, kategorii i typie transakcji.

### Zarządzanie Kategoriami

- ID: US-012
- Tytuł: Zarządzanie kategoriami
- Opis: Jako użytkownik, chcę mieć możliwość dodawania, edytowania i usuwania kategorii, aby dostosować je do moich indywidualnych potrzeb.
- Kryteria akceptacji:
  1. Istnieje dedykowana sekcja do zarządzania kategoriami.
  2. Użytkownik widzi listę predefiniowanych i własnych kategorii.
  3. Użytkownik może dodać nową kategorię, podając jej nazwę i typ (wydatek/przychód).
  4. Użytkownik może edytować nazwę istniejącej kategorii.
  5. Użytkownik może usunąć kategorię, o ile nie jest ona powiązana z żadną transakcją.

### Budżetowanie

- ID: US-013
- Tytuł: Tworzenie nowego budżetu
- Opis: Jako użytkownik, chcę móc zdefiniować miesięczny budżet na wybrane kategorie wydatków, aby kontrolować, czy nie wydaję za dużo.
- Kryteria akceptacji:
  1. Użytkownik może otworzyć formularz tworzenia budżetu.
  2. Formularz wymaga podania nazwy budżetu (np. "Dom", "Samochód") i miesięcznej kwoty.
  3. Użytkownik może wybrać jedną lub więcej kategorii wydatków, które mają być wliczane do tego budżetu.
  4. Kategoria, która jest już przypisana do innego budżetu, nie jest dostępna do wyboru.
  5. Nowo utworzony budżet jest widoczny na pulpicie.

- ID: US-014
- Tytuł: Edycja i usuwanie budżetu
- Opis: Jako użytkownik, chcę móc modyfikować i usuwać moje budżety, aby dostosowywać je do zmieniających się planów finansowych.
- Kryteria akceptacji:
  1. Użytkownik może edytować nazwę, kwotę i listę przypisanych kategorii dla istniejącego budżetu.
  2. Użytkownik może usunąć budżet. Usunięcie budżetu nie usuwa powiązanych z nim kategorii ani transakcji.

### Pulpit

- ID: US-015
- Tytuł: Widok pulpitu dla nowego użytkownika
- Opis: Jako nowy użytkownik, po pierwszym zalogowaniu chcę zobaczyć czytelny ekran z zachętą do podjęcia pierwszych kroków, np. dodania konta.
- Kryteria akceptacji:
  1. Jeśli użytkownik nie dodał jeszcze żadnego konta, pulpit wyświetla stan zerowy (empty state).
  2. Stan zerowy zawiera wyraźne wezwanie do działania (Call To Action), np. przycisk "Dodaj swoje pierwsze konto".

- ID: US-016
- Tytuł: Przeglądanie podsumowania finansowego na pulpicie
- Opis: Jako użytkownik, chcę po wejściu do aplikacji widzieć na pulpicie kluczowe informacje o moich finansach w bieżącym miesiącu, aby szybko ocenić swoją sytuację.
- Kryteria akceptacji:
  1. Pulpit domyślnie pokazuje dane dla bieżącego miesiąca.
  2. Użytkownik może przełączać widok na poprzednie miesiące.
  3. Na pulpicie widoczne są: suma przychodów, suma wydatków i saldo (przychody - wydatki).
  4. Wyświetlany jest wykres kołowy z procentowym udziałem poszczególnych kategorii w sumie wydatków.
  5. Widoczna jest lista ostatnich kilku transakcji (niezależnie od typu).
  6. Widoczna jest lista wszystkich budżetów z graficznym wskaźnikiem postępu (np. progress bar) i kwotą wydaną/pozostałą.
  7. Budżet najbliższy przekroczenia jest wizualnie wyróżniony.

### Ustawienia i Personalizacja

- ID: US-017
- Tytuł: Zmiana motywu aplikacji
- Opis: Jako użytkownik, chcę móc zmienić motyw aplikacji na ciemny lub jasny, aby korzystanie z niej było komfortowe w różnych warunkach oświetleniowych.
- Kryteria akceptacji:
  1. W menu użytkownika dostępna jest opcja zmiany motywu.
  2. Wybrany motyw jest zapamiętywany.

## 6. Metryki sukcesu

Kluczowe wskaźniki (KPIs), które pozwolą ocenić sukces wdrożenia wersji MVP, są następujące:
- Adopcja kont: 80% zarejestrowanych użytkowników dodało co najmniej jedno konto bankowe w pierwszym tygodniu od rejestracji. (Mierzone przez analizę danych w bazie).
- Angażowanie przez transakcje: 70% użytkowników dodało co najmniej 5 transakcji (wydatków lub przychodów) w ciągu pierwszego miesiąca. (Mierzone przez analizę danych).
- Retencja użytkowników: 50% użytkowników korzysta z aplikacji regularnie (loguje się co najmniej 3 razy w tygodniu) przez co najmniej 3 miesiące. (Mierzone przez analitykę logowań i transakcji).
