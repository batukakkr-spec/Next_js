# Sentinel Nexus / XuchTrack

`Sentinel Nexus` нь `Next.js 15 + React 19 + TypeScript + Supabase` дээр бүтээгдсэн, hunter/system theme-тэй gamified self-improvement вэб апп юм. Хэрэглэгч бүр profile, level, XP, streak-тэй бөгөөд өдөр тутмын quest биелүүлж ахиц гаргана. Мөн admin console-оор quest удирдах, хэрэглэгчийн role олгох, `JIN` AI planner-аар quest санал болгох болон шууд оноох боломжтой.

## Гол боломжууд

- `Supabase Auth` дээр суурилсан бүртгэл, нэвтрэлт
- Автоматаар үүсэх `profile` болон default `user` role
- `Level / XP / streak / rank` систем
- Өдөр тутмын `quest` авах, ахиц хөтлөх, дуусгаад `XP` авах урсгал
- `Leaderboard`, `Achievements`, `Profile`, `Settings` хуудсууд
- `Admin Console`:
  - quest үүсгэх, засах, устгах, идэвхжүүлэх/идэвхгүй болгох
  - хэрэглэгчдэд `moderator` болон `admin` role олгох
- `JIN Smart Planner` AI:
  - хэрэглэгчийн level, XP, streak дээр тулгуурлан quest санал болгоно
  - хүсвэл chat-аас шууд quest assign хийнэ
  - `English / Монгол` хэл солих боломжтой
- `Docker`-оор ажиллуулах бэлэн тохиргоотой

## Ашигласан стек

- `Next.js 15`
- `React 19`
- `TypeScript`
- `Tailwind CSS 4`
- `Supabase`
- `TanStack Router`-ийн route component-уудыг Next App Router wrapper-тай ашигласан бүтэц
- `Radix UI`, `Lucide React`, `Sonner`

## Төслийн бүтэц

```text
app/                         Next.js App Router wrapper, API route
src/routes/                  Гол page/component route logic
src/components/              UI болон layout компонентууд
src/lib/                     auth, helper, rank logic
src/integrations/supabase/   Supabase client/server client/type
src/server/                  Server action/helper
supabase/migrations/         DB schema, policy, seed, admin bootstrap
supabase/functions/          Edge Function (smart-planner)
```

## Гол route-ууд

- `/` landing page
- `/register` бүртгэл
- `/login` хэрэглэгч нэвтрэх
- `/dashboard` үндсэн самбар
- `/quests` идэвхтэй болон авах боломжтой quest-ууд
- `/leaderboard` зэрэглэл
- `/achievements` амжилтууд
- `/ai` JIN smart planner
- `/profile` хэрэглэгчийн profile
- `/settings` тохиргоо
- `/admin-login` admin account нээх/нэвтрэх
- `/admin` admin console

## Environment Variables

`.env` файлд дор хаяж дараах хувьсагчууд хэрэгтэй:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_PUBLISHABLE_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=
LOVABLE_API_KEY=
```

Тайлбар:

- `NEXT_PUBLIC_SUPABASE_URL` болон `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` нь client талд заавал хэрэгтэй
- `SUPABASE_SERVICE_ROLE_KEY` нь `/admin-login` дээр анхны admin claim хийх болон server admin үйлдлүүдэд хэрэгтэй
- `OPENAI_API_KEY` нь `/ai` дээрх `JIN` fitness coach-д заавал хэрэгтэй
- `OPENAI_MODEL` нь optional бөгөөд default нь `gpt-5.4-mini`
- `LOVABLE_API_KEY` нь `supabase/functions/smart-planner` edge function-д хэрэгтэй
- `next.config.ts` дотор `NEXT_PUBLIC_*`, `VITE_*`, `SUPABASE_*` fallback логик байгаа

## Local ажиллуулах

### 1. Dependency суулгах

```bash
npm install
```

### 2. Development server асаах

```bash
npm run dev
```

App default-оор `http://localhost:3000` дээр асна.

## Supabase тохиргоо

Энэ төсөл Supabase schema, policy, seed, helper function-уудаа `supabase/migrations` дотор хадгалсан.

Гол хүснэгтүүд:

- `profiles`
- `user_roles`
- `quests`
- `user_quests`
- `xp_logs`
- `achievements`
- `user_achievements`

Гол DB логик:

- шинэ хэрэглэгч бүртгэгдэхэд `profile` болон default `user` role автоматаар үүснэ
- `award_xp(...)` function нь XP нэмээд level up хийдэг
- хамгийн дээд level нь `100`
- `bootstrap_first_admin()` function нь анхны admin account-ыг bootstrap хийхэд ашиглагдана

## Admin setup

Анхны admin үүсгэх урсгал:

1. `SUPABASE_SERVICE_ROLE_KEY`-гээ зөв тохируулна
2. Аппаа асаана
3. `/admin-login` руу орно
4. Email, password оруулаад `Claim / Create Admin` товч дарна
5. Амжилттай бол хэрэглэгчид `admin` role олгогдоод `/admin` руу орно

Хэрвээ аль хэдийн admin байгаа бол шинэ admin-г `Admin Console` дотроос role олгож нэмнэ.

## AI Planner

`supabase/functions/smart-planner/index.ts` нь `JIN` AI planner edge function.

Тэр нь:

- хэрэглэгчийн `level`, `xp`, `streak` мэдээллийг уншина
- quest каталогоос тохирох даалгавар шүүнэ
- chat-аар санал болгоно
- хэрэглэгч хүсвэл `assign_quests` tool-оор шууд `user_quests` руу нэмнэ

## Docker

Build болон ажиллуулах:

```bash
docker compose up --build
```

`docker-compose.yml` нь `.env` файлыг автоматаар уншаад аппыг `3000:3000` порт дээр асаана.

## Render Deploy

Энэ repo нь `Render` дээр Docker runtime-аар deploy хийхэд бэлэн.

Repo доторх `render.yaml` файлыг ашиглавал:

- `Dockerfile`-оор build хийнэ
- root path `/` дээр health check хийнэ
- шаардлагатай environment variable-уудыг Render dashboard дээрээс бөглөнө

Алхамууд:

1. Repo-оо GitHub руу push хийнэ
2. Render дээр `New +` -> `Blueprint` сонгоно
3. GitHub repo-оо холбоно
4. `render.yaml`-ийг Render автоматаар уншина
5. Dashboard дээр дараах secret env-үүдийг утгатай нь бөглөнө:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_PUBLISHABLE_KEY`
   - `OPENAI_API_KEY`
   - `LOVABLE_API_KEY` optional

`.env.example` файл нь production secret-гүй жишээ тохиргоо өгнө. Жинхэнэ key-үүдийг GitHub-д биш, зөвхөн Render дээр хадгална.

## Script-үүд

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run format
```

## Анхаарах зүйлс

- Repo дээр `package-lock.json` байгаа тул `npm` ашиглах нь хамгийн тохиромжтой
- `bun.lockb` бас байгаа ч одоогийн Docker болон build pipeline нь `npm` дээр төвлөрсөн
- `node_modules/` болон `.next/` folder local орчинд аль хэдийн үүссэн байж болно
- Build үед `eslint.ignoreDuringBuilds = true` тохируулгатай

## Дараа нь сайжруулж болох зүйлс

- README дээр screenshot/GIF нэмэх
- Supabase local хөгжүүлэлтийн командыг тусад нь баримтжуулах
- Deployment хэсгийг Vercel эсвэл Docker server хувилбараар дэлгэрүүлэх
- Quest болон achievement awarding урсгалын бизнес дүрмүүдийг илүү дэлгэрэнгүй бичих
