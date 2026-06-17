# Łowca Okazji

Panel dla autohandlu do wyszukiwania samochodów wystawionych na OLX i Otomoto
**poniżej ceny rynkowej**. Aplikacja skanuje prawdziwe ogłoszenia z obu
serwisów, wylicza orientacyjną cenę rynkową na podstawie porównywalnych
ofert, oznacza okazje i prezentuje je na dashboardzie wraz z pełnymi
szczegółami (opis, wyposażenie, zdjęcia, link do oryginalnego ogłoszenia).

**Domyślnie pobiera prawdziwe dane** (`SCRAPER_MODE=live`) - nie ma żadnych
danych przykładowych w dostawie.

## Stack technologiczny

- **Next.js 16** (App Router, Turbopack)
- **TypeScript**
- **styled-components 6** (SSR registry dla App Routera, kolorystyka czarno-biała z jasnoniebieskim akcentem)
- **Drizzle ORM** + SQLite/libSQL (plik lokalny, bez potrzeby stawiania serwera bazy danych)
- Scrapery OLX i Otomoto (`cheerio` do parsowania HTML)

## Bardzo ważna uwaga: brak oficjalnego API OLX/Otomoto

OLX i Otomoto **nie udostępniają publicznego API do wyszukiwania ofert** dla
zewnętrznych aplikacji (Otomoto ma wewnętrzne API tylko dla partnerów/dealerów
po podpisaniu umowy z OLX Group). Jedynym sposobem na automatyczne zbieranie
ofert jest scraping stron wynikowych - to właśnie robi `SCRAPER_MODE=live`.

### Co zweryfikowałem ręcznie, a co jest "best effort"

Adresy URL kategorii i ogłoszeń, format strony wyników oraz to, jakie dane są
faktycznie widoczne bez logowania (tytuł, cena, rok, przebieg, opis,
wyposażenie, zdjęcia) - **zweryfikowałem na żywych stronach** olx.pl i
otomoto.pl. Parsery w `lib/scrapers/olx.ts` i `otomoto.ts` budują się na tej
podstawie: tagach `<title>`/`<meta name="description">`/`<meta
property="og:title">` (najbardziej stabilne, krytyczne dla SEO obu
serwisów), adresach zdjęć z CDN `olxcdn.com` i etykietach tekstowych takich
jak "Rok produkcji" czy "Przebieg".

Czego nie mogłem zweryfikować: **dokładnego układu HTML** (nazw klas CSS,
głębokości zagnieżdżenia elementów) - środowisko, w którym napisałem ten kod,
nie miało dostępu do olx.pl/otomoto.pl, tylko do narzędzia do przeszukiwania
sieci, które zwraca przetworzony tekst, a nie surowy HTML. Dlatego parsowanie
pól ze strony szczegółów opiera się na kilku strategiach naraz (szukanie
elementu-sąsiada w DOM, potem regex na tekście jako fallback) - powinno
działać, ale **Ty masz możliwość przetestowania tego naprawdę**, czego ja nie
miałem. Jeśli po uruchomieniu `npm run scrape` jakieś pole jest puste albo
błędne:

```bash
npm run scrape:debug -- https://www.olx.pl/motoryzacja/samochody/volkswagen/golf/
npm run scrape:debug -- https://www.otomoto.pl/osobowe/oferta/przyklad-ID123abc.html
```

Zapisze to surowy HTML do `debug/`, żebyś mógł go otworzyć i poprawić
selektor/regex w `lib/scrapers/parseHelpers.ts`, `olx.ts` albo `otomoto.ts`.

### Czego scraper NIE pobiera (i nie będzie)

**Numer telefonu sprzedającego.** Na obu serwisach jest zasłonięty (`xxx xxx
xxx` + przycisk "Pokaż"/"Wyświetl numer"), który dociąga prawdziwy numer
asynchronicznie po kliknięciu - to wymaga wykonania JS w przeglądarce, nie da
się tego wyciągnąć ze statycznego HTML. Panel kontaktowy w aplikacji zamiast
numeru pokazuje link do oryginalnego ogłoszenia, gdzie numer można zobaczyć
ręcznie jednym kliknięciem.

### Ryzyko blokady

OLX/Otomoto mogą ograniczać ruch z adresów IP centrów danych (gdzie często
hostowane są aplikacje produkcyjne) albo wymagać captchy przy podejrzanym
ruchu. `lib/scrapers/httpClient.ts` ustawia nagłówki jak w normalnej
przeglądarce i wymusza odstęp między requestami (`SCRAPER_DELAY_MS`), ale to
nie gwarantuje, że nie zostaniesz zablokowany - jeśli `npm run scrape` zwraca
same błędy 403, to najpewniejsza przyczyna.

### Prawne i RODO - przed użyciem produkcyjnym

1. **Regulamin serwisów** - automatyczne pozyskiwanie danych może naruszać ToS
   OLX/Otomoto. To nie jest porada prawna - jeśli planujesz korzystać z tego
   produkcyjnie/komercyjnie, skonsultuj się z prawnikiem.
2. **RODO** - aplikacja zapisuje imię/nazwę sprzedającego (osoby prywatne),
   czyli dane osobowe. Jako administrator takich danych masz obowiązki
   wynikające z RODO (podstawa prawna przetwarzania, retencja, możliwość
   usunięcia danych na żądanie itd.).

## Pierwsze uruchomienie

```bash
npm install
cp .env.example .env       # domyślnie SCRAPER_MODE=live
npm run db:push            # tworzy tabele w lokalnej, PUSTEJ bazie SQLite
npm run scrape              # pobiera prawdziwe ogłoszenia z OLX i Otomoto
npm run dev
```

Pierwszy `npm run scrape` skanuje listę obserwowanych modeli (`WATCHLIST` w
`lib/scrapers/catalog.ts` - domyślnie 7 popularnych modeli) na obu serwisach.
Przy domyślnych ustawieniach to ok. 100-150 requestów z odstępem 1,5 s, czyli
**kilka minut** - tyle, ile trzeba, żeby nie zarzucać serwisów zapytaniami.
Postęp widać w terminalu.

Otwórz `http://localhost:3000` - zobaczysz dashboard z realnymi okazjami
cenowymi (albo informację "Brak okazji", jeśli żadna zeskanowana oferta nie
jest wystarczająco poniżej rynku - to normalne, szczególnie przy pierwszym
uruchomieniu z małą próbką).

Jeśli chcesz tylko obejrzeć UI bez wysyłania żadnych requestów (np. do dalszego
developmentu), masz dwie opcje: ustaw `SCRAPER_MODE=mock` w `.env` przed
`npm run scrape`, albo uruchom `npm run db:seed`, który zawsze generuje dane
przykładowe niezależnie od `.env`.

## Jak to działa

1. **Scraper** (`lib/scrapers/`) zwraca listę ofert (`ScrapedListingDraft`).
   W trybie `live` (domyślnym): dla każdego modelu z `WATCHLIST` pobiera
   stronę wyników (`olx.ts`/`otomoto.ts` → `parseSearchResultsHtml`), zbiera
   linki do ogłoszeń, potem dla każdego pobiera i parsuje pełną stronę
   szczegółów (`parseListingDetail`). W trybie `mock`: generuje dane z
   `lib/scrapers/catalog.ts`.
2. **Ingest** (`lib/ingestListings.ts`) zapisuje/aktualizuje oferty w tabeli
   `cars` (Drizzle, `db/schema.ts`), z unikalnym indeksem na `(source,
   externalId)`, żeby nie duplikować ogłoszeń przy ponownym skanie.
3. **Wycena rynkowa** (`lib/marketAnalysis.ts`) po każdym imporcie przelicza
   dla każdego auta medianę ceny porównywalnych ogłoszeń (ta sama marka i
   model, rocznik ±1, przebieg ±25%, z odcięciem 10% górnych/dolnych
   wartości jako outlierów). Jeśli cena ogłoszenia jest co najmniej
   `UNDERPRICED_THRESHOLD_PERCENT` (domyślnie 15%) niższa od tej mediany,
   ogłoszenie oznaczane jest jako okazja (`isUnderpriced`). Im więcej
   ogłoszeń w bazie, tym wiarygodniejsza wycena - po pierwszym skanie próbka
   bywa mała.
4. **Dashboard** (`app/page.tsx`) pokazuje tylko oznaczone okazje, sortowane
   od najgłębszego rabatu, razem z liczbą przeskanowanych ofert, średnim
   rabatem i czasem ostatniego skanu.
5. **Strona szczegółów** (`app/cars/[id]/page.tsx`) pokazuje galerię zdjęć,
   pełny opis, wyposażenie, porównanie cena/rynek oraz panel kontaktowy z
   linkiem do oryginalnego ogłoszenia (tam jest numer telefonu, patrz wyżej).

Przycisk **"Szukaj nowych ofert"** na dashboardzie wywołuje `POST
/api/scrape`, który robi to samo co `npm run scrape`. Dla pełnych/regularnych
skanów lepiej użyć terminala - request HTTP z przycisku może mieć limit czasu
w zależności od hostingu, a skan kilku-kilkunastu modeli trwa minuty.

## Struktura projektu

```
app/
  page.tsx                  - dashboard (lista okazji)
  cars/[id]/page.tsx         - szczegóły ogłoszenia
  api/cars/route.ts          - GET lista ofert (?underpriced=true)
  api/cars/[id]/route.ts     - GET jedna oferta
  api/scrape/route.ts        - POST wyzwala skan + zapis + przeliczenie rynku
components/
  layout/                   - Sidebar, Shell, kontener stron
  dashboard/                - nagłówek, kafelki statystyk
  cars/                     - karta auta, siatka, znaczek rabatu, przycisk skanu
  car-detail/               - galeria, specyfikacja, opis, wyposażenie, panel kontaktowy
lib/
  scrapers/
    olx.ts, otomoto.ts       - scrapery (live + mock)
    parseHelpers.ts          - wspólne funkcje wyciągania danych z tekstu/DOM
    catalog.ts                - WATCHLIST (modele do skanowania) + generator danych mock
    httpClient.ts             - "uprzejmy" fetch z throttlingiem i UA przeglądarki
    mode.ts                   - jedno źródło prawdy o trybie scrapera (live/mock)
  marketAnalysis.ts          - wyliczanie ceny rynkowej i progu okazji
  ingestListings.ts          - zapisywanie ofert + log przebiegów skanu
  styled/                   - theme, registry SSR, global style
db/
  schema.ts                 - tabele cars i scrape_runs (Drizzle)
  seed.ts                   - generator danych przykładowych (zawsze mock, do dev/testów)
scripts/
  run-scrape.ts              - CLI: `npm run scrape`
  debug-fetch.ts              - CLI: `npm run scrape:debug -- <url>`, zapisuje surowy HTML
```

## Konfiguracja (`.env`)

| Zmienna | Domyślna wartość | Opis |
|---|---|---|
| `DATABASE_URL` | `file:./local.db` | lokalny plik SQLite; podaj URL Turso (`libsql://...`) do wdrożenia produkcyjnego |
| `SCRAPER_MODE` | `live` | `live` (prawdziwe dane) lub `mock` (dane przykładowe, offline) |
| `SCRAPER_MAX_LISTINGS` | `8` | ile ogłoszeń ze szczegółami pobieramy maks. na model na skan |
| `SCRAPER_DELAY_MS` | `1500` | minimalny odstęp między requestami w trybie `live` |
| `UNDERPRICED_THRESHOLD_PERCENT` | `15` | próg % poniżej mediany rynkowej, żeby oznaczyć okazję |
| `MIN_COMPARABLE_SAMPLE` | `3` | minimalna liczba porównywalnych ofert, żeby wycena była wiarygodna |

## Lista obserwowanych modeli (WATCHLIST)

Gdy skan jest wywołany bez konkretnej marki/modelu (przycisk na dashboardzie,
`npm run scrape`), aplikacja skanuje listę z `CAR_CATALOG` /`WATCHLIST` w
`lib/scrapers/catalog.ts` - domyślnie: VW Golf, Skoda Octavia, Toyota
Corolla, Audi A4, BMW serii 3, Ford Focus, Opel Astra. Dodaj/usuń wpisy w
`CAR_CATALOG`, żeby obserwować inne modele - pamiętaj, że pole `model` trafia
też do adresu URL kategorii (slugified), więc dla modeli o nietypowych
nazwach (jak BMW "seria-3") może być potrzebne pole `urlSlug`.

## Co dalej (rozbudowa panelu)

Menu nawigacyjne ma już miejsca przygotowane na kolejne moduły (oznaczone
"soon" w sidebarze): **Wyszukiwania** (zapisane filtry/automatyczne
powiadomienia), **Ulubione**, **Statystyki** (np. wykresy średniego rabatu w
czasie - tabela `scrape_runs` już loguje historię skanów), **Ustawienia**
(np. zmiana progu okazji z UI). Tabela `cars` ma już pole `status`
(`nowa / do_sprawdzenia / kontakt_wyslany / odrzucona / kupiona`) gotowe pod
przyszły mini-CRM do śledzenia kontaktu ze sprzedającymi.

## Wdrożenie produkcyjne

Do hostingu typu Vercel/serverless lokalny plik SQLite nie jest trwały -
zamień `DATABASE_URL` na bazę Turso (libSQL w chmurze, kompatybilna z tym
samym kodem Drizzle) albo dowolną bazę Postgres po zmianie sterownika w
`db/index.ts` i `drizzle.config.ts` (dialect `postgresql`). Do regularnych
skanów rozważ harmonogram poza requestem HTTP (np. cron job wywołujący
`npm run scrape`), żeby nie zależeć od limitu czasu requestu na hostingu.
