# Jak odpalić projekt?

Aby uruchomić projekt, należy wykonać następujące kroki:

1. Wykonać polecenie `npm ci` (do tego wymagany jest plik `package-lock.json`)
2. Jeśli nie ma pliku `package-lock.json` to wykonać polecenie `npm install`
3. Trzeba pobrać plik `ngrok.exe` (wersja na windowsa) [STĄD](https://ngrok.com/download), ewentualnie zainstalować go w inny sposób. Trzeba go mieć :)
4. Odpalamy ngroka w 1 oknie terminalu poleceniem `ngrok http 3000` (3000 to port backendu, jeśli chcesz inny to zmień w `app.js` wartość stałej `const port`). Na windowsie z pobranym plikiem `ngrok.exe` w poleceniu również trzeba dopisać .exe, czyli `ngrok.exe http 3000`
5. Odpalamy aplikację poleceniem `node app.js`