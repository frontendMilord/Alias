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

Авторизация — Google OAuth через Supabase Auth. `src/proxy.ts` экспортирует `proxy`
и вызывает `updateSession` из `src/lib/middleware.ts`; там обновляется сессия и
обрабатываются редиректы на `/login` (кроме публичных маршрутов).

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
      game/                    — ЛЕГАСИ, отдельно от games/. Содержит `cancelGame`
                                  (используется главной страницей) и пустую
                                  заглушку `page.tsx`. Основная логика игр — в games/.
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

Снимок типов схемы удалённого проекта `public` получен через Supabase CLI
`gen types --linked` и хранится в `src/types/database.generated.ts`. Это источник
актуальных таблиц, колонок, связей, RPC и enum для типов. SQL-миграции пока не
выгружены: `db pull` и `db dump` требуют Docker/Podman в текущей CLI-сборке.
`supabase/schema.sql` сейчас пустой. RLS, политики, функции и триггеры проверены
read-only запросом системного каталога связанной базы 2026-09-30; TypeScript-типы
сами по себе эту часть схемы не описывают.

- `profiles` — id, nickname, avatar_url, role, profile_setup_completed, created_at, updated_at
- `lists` — id, name, description, owner_id, is_system, created_at, updated_at
- `words` — id, text, difficulty, owner_id, created_at, updated_at
- `list_words` — id, list_id, word_id, added_by, created_at
- `list_permissions` — id, list_id, user_id, can_view/can_add_words/can_edit_words/can_delete_words, created_at, updated_at
- `list_share_links` — id, list_id, token, created_by, права доступа, expires_at, created_at
- `games` — id, owner_id, status, target_score, round_duration_seconds,
  subtract_point_for_skip, selected_difficulties, selected_lists,
  current_round_number, current_team_id, current_explainer_player_id,
  created_at, finished_at
- `game_teams` — id, game_id, name, team_order, score, created_at
- `game_players` — id, team_id, nickname, player_order, created_at
- `game_difficulties` — id, game_id, difficulty
- `game_lists` — id, game_id, list_id
- `game_rounds` — id, game_id, team_id, explainer_player_id, round_number, status,
  started_at, ended_at, guessed_count, skipped_count, points_earned, last_word_id, created_at
- `round_words` — id, round_id, word_id, word_text (снимок текста), difficulty,
  displayed_order, result, guessed_by_team_id, is_last_word_for_all, created_at
- Enum `game_status`: `active`, `finished`, `cancelled`; `round_status`:
  `preparation`, `active`, `result`, `finished`; `user_role`: `user`, `admin`;
  `word_difficulty`: `easy`, `medium`, `hard`, `insane`; `word_result`:
  `guessed`, `skipped`, `last_word`.
- RPC: `can_add_list_words`, `can_add_to_list`, `can_delete_list_words`,
  `can_edit_list_words`, `can_view_list`, `get_list_preview_words`, `is_admin`,
  `is_list_owner`.
- **RLS:** включён на всех 13 таблицах `public`; `FORCE ROW LEVEL SECURITY` не
  включён. Доступ для списков и слов ограничен владельцем, системными списками,
  администратором и правами из `list_permissions`. `list_words` проверяет права
  на просмотр/добавление/удаление. Профили доступны на чтение всем
  аутентифицированным пользователям, изменять их могут владелец профиля и admin.
  Игры доступны владельцу (и admin на чтение); команды, игроки, раунды и слова
  раунда ограничены владельцем игры (admin — на чтение). Для `game_lists` и
  `game_difficulties` обнаружены только политики INSERT владельцем игры.
  Для `list_share_links` SELECT разрешён владельцу списка или создателю ссылки,
  INSERT/DELETE — владельцу списка.
- **Функции и триггеры:** `on_auth_user_created` на `auth.users` вызывает
  `public.handle_new_user()` (SECURITY DEFINER, фиксированный `search_path=public`)
  и создаёт профиль из OAuth metadata. `update_updated_at()` обновляет timestamp;
  триггеры стоят на `profiles`, `lists`, `words`, `list_permissions`. Функции
  проверки прав списка и `is_admin`/`is_list_owner` — SECURITY DEFINER с
  `search_path=public`; `get_list_preview_words` возвращает до трёх случайных слов
  из каждого запрошенного списка.
- **Нужно исправить:** политика `words_update_by_list_permission` объявлена для
  `PUBLIC`, разрешает UPDATE при праве редактирования слова через список, но её
  `WITH CHECK (owner_id = owner_id)` является тавтологией и не сохраняет владельца.
  Проверка привилегий подтвердила UPDATE на всю таблицу и `owner_id` у ролей
  `anon` и `authenticated`; RLS-предикат ограничивает фактический доступ, но
  аутентифицированный редактор расшаренного списка может сменить `owner_id`.
  Исправить колонковые права или использовать проверяемую RPC/trigger-логику,
  сохраняющую владельца, и покрыть это тестом.

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
6. **Страница игры** (`games/[id]/page.tsx`) — получение игры через `getGame(id)`
   (команды со счётом, игроки, настройки, названия выбранных списков) и отображение
   состояния. Механика запуска/проведения раунда пока не реализована.

## Что дальше (по плану)

- Механика раунда: серверный экшен старта раунда, выбор слова, таймер,
  засчитывание очков/пропусков, переход хода между командами/игроками.
- Обновление статуса игры на «завершена» по достижении `target_score`.
- Реалтайм-синхронизация состояния игры между участниками (Supabase Realtime
  подключений пока в коде нет).
- Разобраться с легаси-папкой `src/app/(app)/game/` (singular): сейчас там
  находится `cancelGame`, используемый главной страницей. При переносе обновить
  импорты; решить, нужна ли заглушка маршрута `/game`.
- Сверить описание Supabase-схемы с фактической схемой проекта и зафиксировать
  проверенные таблицы, поля, enum/check-значения, RPC, RLS и внешние ключи.

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
