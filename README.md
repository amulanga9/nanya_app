# Nanya — расписание няни

PWA для записи на слоты к няне у School 21 Tashkent. React + Vite + Supabase (без Auth).

## Локальный запуск

```bash
npm install
cp .env.example .env
# заполнить VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY
npm run dev
```

Режим няни: `/?admin=1`. Режим мамы: `/` (без параметра).

## Supabase

Выполнить `supabase/schema.sql` в SQL Editor проекта Supabase. Создаёт таблицы
`windows`, `bookings`, открытые RLS-политики для anon-доступа (без Auth) и
включает Realtime для обеих таблиц.

## Тесты

Бизнес-логика капасити (правило "максимум 3 ребёнка на ячейку 30 мин")
покрыта тестами в `src/lib/capacity.test.ts`, включая все сценарии из
acceptance criteria ТЗ.

```bash
npm test -- --run
```

## Деплой

GitHub Actions (`.github/workflows/deploy.yml`) собирает проект и публикует
`dist` на GitHub Pages при пуше в `main`. Нужно задать секреты репозитория
`VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`, и включить Pages source =
GitHub Actions в настройках репозитория.
