# Alias — AGENTS.md

Контекст проекта для AI-ассистентов (Claude Code, Cursor, ChatGPT и т.д.), работающих
над репозиторием. Держи этот файл в актуальном состоянии по мере разработки —
это единственный источник правды о том, что уже сделано.

## О проекте

Веб-версия командной игры «Alias» (объясни слово словами-синонимами, команда
угадывает). Владелец создаёт игру, настраивает команды/правила/списки слов,
играются раунды, счёт ведётся до целевого количества очков.

## Стек

- **Next.js 16** (App Router, Server Components по умолчанию, async `params`/`cookies`)
- **TypeScript**
- **Supabase** (Postgres + Auth + RLS) — `@supabase/ssr`, `@supabase/supabase-js`
- **Tailwind CSS v4** + shadcn-стиль компонентов на базе `@base-ui/react`
- **zustand** — подключён в зависимостях, пока нигде не используется
- **lucide-react** — иконки
- ESLint (flat config), без Prettier — форматирование см. в разделе «Конвенции»

Авторизация — Google OAuth через Supabase Auth. `src/lib/middleware.ts` редиректит
неавторизованных пользователей на `/login` (кроме `/login`, `/auth/*`, `/oauth/consent`).

## Структура проекта

```
src/
  app/
    (auth)/
      login/page.tsx         — экран входа через Google
      setup/page.tsx         — установка никнейма после первого входа
    (app)/                   — приватная зона, обёрнута в AppContainer (max-w-640px)
      layout.tsx
      page.tsx                — главная: активная игра или кнопка "Новая игра"
      profile/page.tsx        — никнейм, роль, кнопка выхода
      games/
        new/page.tsx           — мастер создания игры (4 шага)
        [id]/page.tsx           — страница игры: команды, настройки, списки, старт раунда
        actions.ts               — createGame (server action)
      lists/
        page.tsx / [id]/page.tsx — списки слов (свои/публичные/расшаренные)
      game/                    — ЛЕГАСИ, отдельно от games/. Осталась только
                                  cancelGame (server action) + пустая заглушка
                                  page.tsx. Основная логика игр — в games/.
    admin/page.tsx            — заглушка для роли admin
    auth/callback/route.ts    — обмен OAuth code → сессия, редирект на /setup или /
    layout.tsx                — root layout, шрифты Geist, тема dark
  components/
    ui/                       — shadcn-примитивы (button, card, dialog, input, select, ...)
    auth/logout-button.tsx
    home/home-page.tsx        — клиентский компонент главной страницы
    layout/app-container.tsx  — общий контейнер приватной зоны
    games/
      new-game-page.tsx        — клиентский компонент мастера создания игры
      team-editor.tsx
    lists/                     — карточки списков, диалоги создания/шаринга/добавления слов
  lib/
    server.ts / client.ts     — Supabase-клиенты (server components/actions vs browser)
    middleware.ts             — session refresh + редирект неавторизованных
    consts.ts                 — словари подписей (сложности, шаги мастера, типы списков)
    utils.ts                  — cn(), pluralizeWordsCount(), getListType()
    auth/                     — getCurrentProfile, requireUser, requireAdmin
    games/
      game.ts                  — getGame(id): полная игра (команды/игроки/списки)
      get-active-game.ts        — последняя активная игра текущего owner'а
    lists/                    — getLists, getList, getListWords, getAvailableLists,
                                 getListPermissions
  types/                      — Game, GameTeamDraft/CreateGameInput, List, Word, Profile
  proxy.ts
```

## Модель данных (Supabase)

Таблиц-миграций в репозитории нет (схема управляется через Supabase dashboard/CLI
отдельно от кода) — актуальная структура восстановлена по запросам в коде:

- `profiles` — id, nickname, avatar_url, role (`user` | `admin`), profile_setup_completed
- `lists` — id, name, description, owner_id, is_system, created_at, updated_at
- `words` — id, text, difficulty (`easy|medium|hard|insane`), owner_id
- `list_words` — связь list ↔ word, added_by
- `list_permissions` — list_id, user_id, can_view/can_add_words/can_edit_words/can_delete_words
- `games` — id, owner_id, status, target_score, round_duration_seconds,
  subtract_point_for_skip, selected_difficulties (jsonb), selected_lists (jsonb),
  current_round_number, current_team_id, current_explainer_player_id,
  created_at, finished_at
  - **`status`**: подтверждённые значения — `active`, `cancelled` (см. `cancelGame` в
    `game/actions.ts`). Значение для «игра успешно завершена по очкам» ещё
    **не подтверждено в коде** — не факт что `finished`, возможно `completed`.
    Проверить в Supabase перед реализацией логики завершения игры.
- `game_teams` — id, game_id, name, team_order, score
- `game_players` — id, team_id, nickname, player_order
- `game_difficulties` — game_id, difficulty (дублирует `games.selected_difficulties`)
- `game_lists` — game_id, list_id (дублирует `games.selected_lists`)
- RPC `get_list_preview_words(p_list_ids)` — превью слов для карточек списков

## Что уже реализовано

1. **Авторизация**: вход через Google (Supabase OAuth), онбординг никнейма (`/setup`),
   `middleware.ts` защищает приватные роуты.
2. **Профиль**: просмотр никнейма/роли, выход.
3. **Списки слов**: создание, просмотр (свои/публичные/расшаренные), добавление/
   редактирование/удаление слов, шаринг с правами доступа (`list_permissions`).
4. **Создание игры** (`games/new`): 4-шаговый мастер —
   1) команды и игроки, 2) настройки (очки до победы, время раунда, штраф за
   пропуск, сложности), 3) выбор списков слов, 4) подтверждение и создание
   (`createGame` server action — создаёт запись в `games`, `game_teams`,
   `game_players`, `game_difficulties`, `game_lists`).
5. **Главная страница**: показывает активную игру владельца, позволяет начать
   новую (с подтверждением отмены текущей — `cancelGame`).
6. **Страница игры** (`games/[id]/page.tsx`) — **первая версия, без запуска
   раунда**: получение игры через `getGame(id)` (команды со счётом, игроки,
   настройки, названия выбранных списков), отображение состояния, кнопка
   «Начать раунд» пока неактивна (заглушка).

## Что дальше (по плану)

- Механика раунда: серверный экшен старта раунда, выбор слова, таймер,
  засчитывание очков/пропусков, переход хода между командами/игроками.
- Обновление статуса игры на «завершена» по достижении `target_score`.
- Реалтайм-синхронизация состояния игры между участниками (Supabase Realtime
  подключений пока в коде нет).
- Разобраться с легаси-папкой `src/app/(app)/game/` (singular) — либо удалить,
  либо перенести `cancelGame` в `games/actions.ts` для консистентности.

## Конвенции кода

- Табы для отступов (не пробелы), одинарные кавычки, без точки с запятой —
  весь код в `src/` кроме `components/ui/*` (shadcn-генерируемые файлы —
  там 2 пробела и другой стиль, их руками не трогаем).
- Импорты через алиас `@/*` → `src/*`.
- Supabase-клиент в server components/actions — `createClient()` из
  `@/lib/server` (асинхронный, per-request); в клиентских компонентах —
  `@/lib/client`.
- Паттерн для страниц с данными: `page.tsx` — тонкий async server component
  (auth guard через `requireUser`/`requireAdmin` + загрузка данных), тяжёлая
  интерактивная разметка выносится в клиентский компонент в `src/components/...`
  (см. `games/new/page.tsx` → `NewGamePage`), простая страница без интерактива
  может рендериться прямо в `page.tsx` (см. `lists/[id]/page.tsx`,
  `games/[id]/page.tsx`).
- Server actions — в `actions.ts` рядом с роутом, с `'use server'` наверху,
  всегда возвращают `{ success, error }` (иногда + доп. поля), без throw наружу.
- Типы БД → доменные объекты преобразуются вручную в `lib/*` (snake_case из
  Supabase не протекает в компоненты, см. `getGame`, `getLists`).
- UI-примитивы — из `src/components/ui` (shadcn/base-ui), не писать разметку
  кнопок/карточек/инпутов с нуля.
- Все тексты интерфейса — на русском.
