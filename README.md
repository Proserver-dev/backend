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