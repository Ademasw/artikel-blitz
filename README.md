# Artikel Blitz

Аркадный тренажёр немецких артиклей der / die / das. ТЗ: [docs/TZ_v1.1.md](docs/TZ_v1.1.md).

```bash
npm install      # .npmrc включает legacy-peer-deps (обход бага npm с peer-зависимостями vitest 4)
npm run dev      # dev-сервер
npm run build    # проверка типов + сборка в dist/ (статический сайт, base: './')
npm test         # Vitest: движок очереди, mastery, очки, таймеры, сессия, словарь, хранилище
npm run lint
```

Управление: A / S / D или ← / ↓(↑) / →, свайпы влево / вверх / вправо, Esc для паузы.

## Структура

- `src/engine/` — чистая логика без React: `wordQueue` (корзины, быстрый возврат, защита от повторов), `mastery`, `scoring`, `timer`, `session` (ERROR_LOCK, жизни, спринт, пауза).
- `src/data/` — словарь (210 слов) и `dictionaryRepository` (точка расширения для импорта в v2).
- `src/state/` — хранилище `artikel_blitz_v1` с проверкой данных и работой в памяти, если localStorage недоступен.
- `src/screens/`, `src/components/` — UI.
