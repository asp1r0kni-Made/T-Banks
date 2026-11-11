Gram Wallet — проект для сборки APK (GitHub Actions)

Загрузите ВСЁ содержимое этой папки в репозиторий (папки www и res, файлы debug.keystore,
package.json, capacitor.config.json, .gitignore). Файл .github/workflows/build-apk.yml
должен лежать именно по этому пути (если папка .github не загрузилась — создайте файл через
Add file -> Create new file и вставьте содержимое build-apk.yml).

Сервер: wallet_app.py (отдельный файл) — на PythonAnywhere, папка mysite, затем Web -> Reload.
В приложении: экран входа -> "изменить" рядом с "Сервер" -> https://ВАШЛОГИН.pythonanywhere.com
