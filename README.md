# installation

You need [bun](https://bun.sh/) installed.

```bash
bun install
```

## Generate Migration and create Sqlite database

```bash
bun generate
```

### Run Migration

```bash
bun migrate
```

### Run Seeding (optional)

```bash
bun seed
```

### testing

make sure you're running seeding

```bash
bun test
```

### run server

```bash
bun dev
open http://localhost:4000
```

### Available Routes

#### Auth Routes

```bash
GET     /api/v1/auth/validate
POST    /api/v1/auth/signup
POST    /api/v1/auth/signin
POST    /api/v1/auth/signout
```

#### Novel Routes

```bash
GET     /api/v1/novels
GET     /api/v1/novels/featured/hot
GET     /api/v1/novels/featured/top
GET     /api/v1/novels/:id

GET     /api/v1/chapters
GET     /api/v1/chapters/:id

GET     /api/v1/favorites/:novelId
POST    /api/v1/favorites

GET     /api/v1/subscribes/:novelId
POST    /api/v1/subscribes/notify

GET     /api/v1/ratings/:novelId
POST    /api/v1/ratings/rate
```

#### Admin Routes

```bash
POST    /api/v1/admin/novel
PUT     /api/v1/admin/novel/:id
DELETE  /api/v1/admin/novel/:id
POST    /api/v1/admin/chapter
PUT     /api/v1/admin/chapter/:id
DELETE  /api/v1/admin/chapter/:id
```

#### Notification Routes

```bash
GET     /api/v1/notifications
PATCH   /api/v1/notifications
DELETE  /api/v1/notifications
```
