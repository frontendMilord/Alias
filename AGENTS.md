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
        [id]/page.tsx           — серверная страница игры: счёт, команды и настройки
        actions.ts               — createGame и startGameRound (server actions)
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

Сверено с удалённой схемой `public` связанного проекта read-only запросами CLI
`db query --linked` 2026-09-30. Сгенерированный снимок таблиц, полей, типов,
RPC и FK лежит в `src/types/database.generated.ts`; обновить его через
`npx.cmd supabase gen types typescript --linked --schema public` после изменений
схемы. `supabase/schema.sql` пустой, миграций в `supabase/migrations/` пока нет.
`db pull`/`db dump` не выполнились без Docker/Podman, поэтому DDL всей схемы не
сохранён; каталог БД использовался для проверки CHECK/UNIQUE/FK, RLS, функций
и триггеров. В снимке нет RLS и триггеров; сверять их повторным запросом каталога.
SQL hotfixes для уже существующего удалённого проекта хранятся в
`supabase/patches/`; они не являются migrations и не предназначены для чистого
`db reset`, пока не будет добавлена базовая migration.

### Таблицы и поля

- `profiles`: `id`, `nickname`, `avatar_url`, `role`,
  `profile_setup_completed`, `created_at`, `updated_at`.
- `lists`: `id`, `name`, `description`, `owner_id`, `is_system`, `created_at`,
  `updated_at`.
- `words`: `id`, `text`, `difficulty`, `owner_id`, `created_at`, `updated_at`.
- `list_words`: `id`, `list_id`, `word_id`, `added_by`, `created_at`.
- `list_permissions`: `id`, `list_id`, `user_id`, `can_view`, `can_add_words`,
  `can_edit_words`, `can_delete_words`, `created_at`, `updated_at`.
- `list_share_links`: `id`, `list_id`, `token`, `created_by`, `can_view`,
  `can_add_words`, `can_edit_words`, `can_delete_words`, `expires_at`, `created_at`.
- `games`: `id`, `owner_id`, `status`, `target_score`, `round_duration_seconds`,
  `subtract_point_for_skip`, `selected_difficulties`, `selected_lists`,
  `current_round_number`, `current_team_id`, `current_explainer_player_id`,
  `created_at`, `finished_at`.
- `game_teams`: `id`, `game_id`, `name`, `team_order`, `score`, `created_at`.
- `game_players`: `id`, `team_id`, `nickname`, `player_order`, `created_at`.
- `game_difficulties`: `id`, `game_id`, `difficulty`.
- `game_lists`: `id`, `game_id`, `list_id`.
- `game_rounds`: `id`, `game_id`, `team_id`, `explainer_player_id`,
  `round_number`, `status`, `started_at`, `ended_at`, `guessed_count`,
  `skipped_count`, `points_earned`, `last_word_id`, `paused_at`, `paused_seconds`,
  `created_at` (pause columns are added by `20260930_game_round_flow.sql`).
- `round_words`: `id`, `round_id`, `word_id`, `word_text`, `difficulty`,
  `displayed_order`, `result`, `guessed_by_team_id`, `is_last_word_for_all`,
  `created_at`.
- У таблиц есть UUID `id` primary key. Nullable поля и точные типы Row/Insert/Update
  см. в сгенерированном `src/types/database.generated.ts`. Views и composite types
  в `public` отсутствуют.

### Enum и ограничения

- `user_role`: `user`, `admin`.
- `word_difficulty`: `easy`, `medium`, `hard`, `insane`.
- `game_status`: `active`, `finished`, `cancelled`.
- `round_status`: `preparation`, `active`, `result`, `finished`.
- `word_result`: `guessed`, `skipped`, `last_word`.
- CHECK: `profiles.nickname` 2–30 символов; `lists.name` 1–100; `words.text`
  после `trim` 1–200; `games.target_score > 0`, `round_duration_seconds` 10–600,
  `current_round_number > 0`, массивы `selected_difficulties` и `selected_lists`
  не пусты; `game_teams.name` после `trim` 1–50 и текущий CHECK `score >= 0`;
  `game_players.nickname` после `trim` 1–50; `game_rounds.guessed_count` и
  `skipped_count >= 0`.
- Подтверждённое правило игры требует разрешить отрицательный общий `game_teams.score`
  (штрафы за пропуски могут опустить счёт ниже нуля); CHECK `score >= 0` нужно
  удалить в последующем SQL-патче.
- UNIQUE: `list_words(list_id, word_id)`, `list_permissions(list_id, user_id)`,
  `list_share_links(token)`, `game_lists(game_id, list_id)`,
  `game_difficulties(game_id, difficulty)`, `game_teams(game_id, team_order)`,
  `game_players(team_id, player_order)`, `game_rounds(game_id, round_number)`,
  `round_words(round_id, displayed_order)`.
- Уникальный индекс `games_one_active_per_owner` не допускает более одной
  активной игры у одного владельца.
- Внешние ключи (если не указано иное — `ON DELETE CASCADE`): `profiles.id` →
  `auth.users.id`; `lists.owner_id`, `games.owner_id`, `words.owner_id` →
  `profiles.id`; `list_words.list_id` → `lists.id`, `word_id` → `words.id`,
  `added_by` → `profiles.id`; `list_permissions.list_id` → `lists.id`,
  `user_id` → `profiles.id`; `list_share_links.list_id` → `lists.id`,
  `created_by` → `profiles.id`; `game_teams.game_id` → `games.id`;
  `game_players.team_id` → `game_teams.id`; `game_rounds.game_id` → `games.id`,
  `team_id` → `game_teams.id`, `explainer_player_id` → `game_players.id`;
  `round_words.round_id` → `game_rounds.id`. `games.current_team_id` и
  `current_explainer_player_id` ссылаются на `game_teams.id`/`game_players.id`
  с `ON DELETE SET NULL`; `game_rounds.last_word_id` → `round_words.id`
  с `SET NULL`; `round_words.guessed_by_team_id` → `game_teams.id` с `SET NULL`;
  `round_words.word_id` → `words.id` с `ON DELETE RESTRICT`; `game_lists.list_id` →
  `lists.id` с `RESTRICT`.
- **Пробелы целостности:** у `game_lists.game_id` и `game_difficulties.game_id`
  нет FK к `games`; также нет ограничения, что выбранные `games.current_team_id`,
  `current_explainer_player_id` и `game_rounds.explainer_player_id` относятся
  к той же игре/команде.

### RPC, функции и триггеры

- RPC `is_admin()` проверяет `profiles.role`; `is_list_owner(p_list_id)` проверяет
  владельца списка. `can_view_list`, `can_add_to_list`, `can_add_list_words`,
  `can_edit_list_words`, `can_delete_list_words` дают владельцу доступ либо
  проверяют соответствующий флаг `list_permissions`. `can_add_list_words` и
  `can_add_to_list` сейчас дублируют логику.
- `get_list_preview_words(p_list_ids)` возвращает до трёх случайных слов на список.
- `start_game_round(p_game_id)` атомарно готовит раунд и снимок слов. Первую версию
  патча пользователь применил 2026-09-30; `20260930_game_round_flow.sql` переводит
  новый раунд в `preparation`, запускает таймер отдельной кнопкой и добавляет pause
  RPC `set_game_round_paused`.
- `resolve_current_game_round_word`, `expire_current_game_round`,
  `assign_shared_game_round_word`, `edit_game_round_word_result` и `next_game_round`
  определены в `supabase/patches/20260930_game_round_results.sql`; патч применён
  после `20260930_game_round_flow.sql` 30 сентября 2026 года.
- `on_auth_user_created` — AFTER INSERT на `auth.users`; вызывает
  `public.handle_new_user()` и создаёт `profiles` из OAuth metadata. Функция
  SECURITY DEFINER с `search_path=public`.
- `update_updated_at()` задаёт `new.updated_at = now()`; BEFORE UPDATE триггеры
  есть на `profiles`, `lists`, `words`, `list_permissions`.
- RPC-помощники проверки доступа и `is_admin`/`is_list_owner` используют
  SECURITY DEFINER и фиксированный `search_path=public`; `get_list_preview_words`
  — не SECURITY DEFINER.

### RLS

RLS включён на всех 13 таблицах `public`; `FORCE ROW LEVEL SECURITY` нигде не
включён. Политики сгруппированы по фактическому доступу:

- `profiles`: SELECT всем authenticated; UPDATE своего профиля или admin.
- `lists`: SELECT владелец/system/can_view/admin; INSERT владелец, только
  `is_system=false`; UPDATE/DELETE владелец несистемного списка или admin.
- `words`: SELECT владелец/admin/через список с правом просмотра; INSERT/DELETE
  владелец; UPDATE разрешён редактору списка через `can_edit_list_words`.
- `list_words`: SELECT can_view/admin; INSERT can_add и `added_by=auth.uid()`;
  DELETE can_delete/admin.
- `list_permissions`: SELECT владелец списка/получатель/admin; INSERT/UPDATE/DELETE
  владелец списка.
- `list_share_links`: SELECT владелец списка или создатель ссылки; INSERT/DELETE
  владелец списка.
- `games`: SELECT владелец/admin; INSERT/UPDATE/DELETE владелец.
- `game_teams`, `game_players`: SELECT владелец игры/admin; INSERT/UPDATE/DELETE
  владелец игры.
- `game_rounds`, `round_words`: SELECT владелец игры/admin; INSERT/UPDATE владелец;
  DELETE-политик нет.
- `game_lists`, `game_difficulties`: есть только INSERT-политики владельца игры;
  SELECT/UPDATE/DELETE-политик нет.
- **Исправлено 2026-09-30:** для `words_update_by_list_permission` оставлена роль
  `authenticated`, а `WITH CHECK` повторяет проверку права редактирования списка.
  Table-level и column-level UPDATE отозваны у `anon` и `authenticated`, затем
  `authenticated` получил UPDATE только для `text`, `difficulty`, `updated_at`.
  Проверка удалённой БД подтвердила, что `owner_id` недоступен для UPDATE обеим
  ролям, нужные приложению колонки обновляемы, и политика применена. SQL находится
  в `supabase/patches/20260930_words_update_authorization.sql`; повторно применять
  его допустимо, однако это не migration для чистой базы.

## Что уже реализовано

- **Общий header приватной зоны**: навигация на главную, списки слов и профиль
  доступна на всех страницах группы `(app)`.
- **Брендинг**: на главной странице отображается логотип из `public/logo-transparent.svg`,
  а favicon и Apple touch icon подключены через metadata root layout.
- **Завершение игры после полного круга**: RPC `next_game_round` проверяет цель по
  очкам только после завершения раунда последней команды в текущем круге. Патч
  находится в `supabase/patches/20261001_finish_after_full_round.sql`.

1. **Авторизация**: вход через Google (Supabase OAuth), онбординг никнейма (`/setup`),
   `middleware.ts` защищает приватные роуты.
2. **Профиль**: просмотр никнейма/роли, выход.
3. **Списки слов**: создание, просмотр (свои/публичные/расшаренные), добавление/
   редактирование/удаление слов, шаринг с правами доступа (`list_permissions`).
4. **Создание игры** (`games/new`): 4-шаговый мастер —
   1. команды и игроки, 2) настройки (очки до победы, время раунда, штраф за
      пропуск, сложности), 3) выбор списков слов, 4) подтверждение и создание
      (`createGame` server action — создаёт запись в `games`, `game_teams`,
      `game_players`, `game_difficulties`, `game_lists`).
      Если в настройках не выбрана отдельная сложность, это означает «все сложности»;
      server action сохраняет все enum-значения, так как БД запрещает пустой массив.
      Перед созданием action проверяет наличие активной игры и преобразует конфликт
      `games_one_active_per_owner` в понятную ошибку при гонке запросов. Прямой
      переход на `/games/new` при активной игре перенаправляет на главную, где
      доступен сценарий подтверждения отмены.
5. **Главная страница**: показывает активную игру владельца; переход по ней
   продолжает игру. Создание новой открывает подтверждение отмены текущей
   (`cancelGame`); подтверждение успешно только если запись действительно
   обновлена.
6. **Страница игры** (`games/[id]/page.tsx`): защищена `requireUser`, загружает игру
   через `getGame(id)`. Экран игры переключается между настройкой/подготовкой,
   таймером и словом с контролами «угадано/пропуск», общим последним словом и
   редактируемыми результатами. Очки пересчитываются из результатов слов; общий
   счёт допускает отрицательные значения. SQL-патчи потока и результатов применены
   в Supabase 30 сентября 2026 года. Для завершённой игры отображается отдельный
   итоговый экран с победителем, итоговыми счетами команд, игроками, длительностью
   и статистикой раундов.
7. **История игр в профиле**: завершённые и отменённые игры владельца отображаются
   в профиле; для завершённых игр доступен переход к итогам. История поддерживает
   время создания, фильтры по статусу и пагинацию.

## Что дальше (по плану)

- Добавить звуковые сигналы для паузы, начала раунда, угаданного и пропущенного
  слова, общего слова после окончания таймера и завершения игры.
- Обновить `README.md`: описать реализованные возможности веб-версии, которых нет
  в оригинальной игре.
- Добавить реалтайм-синхронизацию состояния игры между участниками (Supabase
  Realtime подключений пока в коде нет).
- Разобраться с легаси-папкой `src/app/(app)/game/` (singular): сейчас там
  находится `cancelGame`, используемый главной страницей. При переносе обновить
  импорты; решить, нужна ли заглушка маршрута `/game`.
- Обновить UI страницы профиля
- Проверить нужна ли валидация форм
