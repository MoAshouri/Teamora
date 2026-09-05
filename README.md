# تیمورا (Teamora) — Human Resource Management

Monorepo فول‌استک:

- `apps/web` — Next.js 15 (لندینگ SEO، i18n: fa/hy/en، داشبورد ادمین/کارمند)
- `apps/api` — NestJS (Auth، چندمستأجری، ساعات، مرخصی، تقویم، WebSocket)
- `packages/shared` — Zod schemas مشترک
- `assets/` — پروتوتایپ‌ها و برند (gavit/hayat)
- `scripts/` — بهینه‌سازی تصویر

## پیش‌نیاز

- Node.js 20+
- pnpm 9+
- Docker (برای Postgres + Redis)

## راه‌اندازی سریع

```bash
cp .env.example .env
# Prisma از apps/api/.env می‌خواند — یک‌بار کپی کنید:
cp .env apps/api/.env
docker compose up -d postgres redis
corepack enable
pnpm install
pnpm --filter @teamora/shared build
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

- وب: http://localhost:3000/fa
- API: http://localhost:4000

## نقش‌ها

- **Admin**: ثبت‌نام شرکت، کد دعوت ۶ رقمی، تأیید مرخصی/کارکرد، حضور زنده
- **Employee**: پیوستن با کد، ثبت ساعات، درخواست مرخصی، مشاهده تقویم

## احراز هویت

- رمز عبور + نام کاربری/ایمیل
- OTP ایمیل (بدون SMTP در لاگ API چاپ می‌شود)
- Google OAuth (نیاز به `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`)
