# Jak odpalić projekt?

Aby uruchomić projekt, należy wykonać następujące kroki:

1. Wykonać polecenie `npm ci` (do tego wymagany jest plik `package-lock.json`)
2. Jeśli nie ma pliku `package-lock.json` to wykonać polecenie `npm install`
3. Odpalamy aplikację poleceniem `node app.js`

Opcjonalnie, aby lokalny serwer był widoczny na zewnątrz:

1. Pobrać plik `ngrok.exe` (wersja na windowsa) [STĄD](https://ngrok.com/download), ewentualnie zainstalować go w inny sposób.
2. Odpalamy ngroka w nowym oknie terminala poleceniem `ngrok http 3000` 
3. `3000` to port backendu, jeśli chcesz inny to zmień w `settings.js` wartość `PORT`. 
4. Na windowsie z pobranym plikiem `ngrok.exe` w poleceniu również trzeba dopisać .exe, czyli `ngrok.exe http 3000`

# Wskazówki

1. Po zrobieniu klona repozytorium zrób kopię pliku `settings.example.js` i nazwij go `settings.js`. Uzupełnij w nim dane konfiguracyjne dla Twojego lokalnego środowiska
2. Jeśli dodajesz nowe wartości do pliku `settings.js` uzupełnij je również w pliku example, żeby było wiadomo jakie dane w tym pliku są wymagane. Plik `settings.js` jest tylko dla Ciebie i nie będzie wysyłany do zdalnego repo
3. W katalogu `config` zrób kopię pliku `db_mysql.example.json` i nazwij go `db_mysql.json` - uzupełnij go odpowiednimi danymi dla Twojego środowiska
4. Konieczne jest wygenerowanie pary kluczy `private-key.pem` oraz `public-key.pem` o długości klucza minimum 2048-bit do szyfrowania RS256 dla Refresh-Token. Można to zrobić np [TUTAJ](https://cryptotools.net/rsagen) albo za pomocą skryptu SH (patrz niżej "Generowanie kluczy")

# Baza danych

Odpalenie migracji wraz z wyborem środowiska:
- `npx sequelize db:migrate --env dev`
- `npx sequelize db:migrate --env prod`

Powyższe polecenia wykonają tylko nowe migracje (te, które jeszcze nie były wykonane).

Aby wycofać wszystkie migracje należy wykonać polecenie 
- `npx sequelize db:migrate:undo:all --env dev`
- `npx sequelize db:migrate:undo:all --env prod`


# Generowanie kluczy do alg. RS256

```console
#!/bin/bash

# Ustal nazwy plików
private_key_file="private-key.pem"
public_key_file="public-key.pem"

# Sprawdź, czy klucz prywatny już istnieje
if [ -f "$private_key_file" ]; then
  echo "Plik $private_key_file już istnieje. Usuń go lub zmień nazwę przed uruchomieniem tego skryptu ponownie."
  exit 1
fi

# Generuj klucz prywatny RSA o długości 2048 bitów
openssl genpkey -algorithm RSA -out "$private_key_file" -aes256

# Generuj klucz publiczny RSA na podstawie klucza prywatnego
openssl rsa -pubout -in "$private_key_file" -out "$public_key_file"

echo "Klucze RSA zostały wygenerowane i zapisane do plików: $private_key_file i $public_key_file."
```