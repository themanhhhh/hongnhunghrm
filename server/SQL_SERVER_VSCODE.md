# Ket noi SQL Server bang Visual Studio Code

Backend BRAVO HRM dung SQL Server qua SQL Login. Cau hinh mac dinh la:

| Thuoc tinh | Gia tri |
| --- | --- |
| Server | `localhost` |
| Port | `1433` |
| Database | `BRAVO_HRM` |
| User | `sa` |
| Authentication | SQL Login |

Mat khau khong duoc luu trong git. Backend doc mat khau tu bien moi truong `DB_PASSWORD`.

## 1. Cai va cau hinh SQL Server

1. Cai SQL Server Express hoac SQL Server Developer, va SQL Server Management Studio (SSMS) neu can quan tri bang giao dien.
2. Trong qua trinh cai dat, chon **Mixed Mode Authentication** va dat mat khau manh cho tai khoan `sa`.
3. Mo **SQL Server Configuration Manager**.
4. Vao **SQL Server Network Configuration** > **Protocols for MSSQLSERVER** (hoac instance dang dung), sau do bat **TCP/IP**.
5. Mo **TCP/IP Properties** > **IP Addresses**. Tai muc `IPAll`, dat `TCP Port` la `1433` va xoa `TCP Dynamic Ports` neu dang co gia tri.
6. Khoi dong lai dich vu SQL Server trong **SQL Server Services**.
7. Neu SQL Server chay tren may khac, mo firewall cho TCP port `1433` va thay `DB_HOST` bang hostname/IP cua may chu.

> Neu dung SQL Server Express instance `SQLEXPRESS`, thong dung no dung dynamic port. De dung cau hinh hien tai, hay cau hinh TCP port co dinh `1433` nhu buoc 5.

## 2. Cai extension SQL Server trong VS Code

1. Mo VS Code, vao **Extensions** (`Ctrl+Shift+X`).
2. Cai extension **SQL Server (mssql)** cua Microsoft (`ms-mssql.mssql`).
3. Nhan `Ctrl+Shift+P`, chon **MS SQL: Connect**.
4. Chon hoac tao connection profile voi cac gia tri sau:

| Truong trong VS Code | Gia tri |
| --- | --- |
| Server name | `localhost,1433` |
| Authentication type | `SQL Login` |
| User name | `sa` |
| Password | Mat khau SQL Server cua `sa` |
| Database | `master` luc ket noi lan dau; `BRAVO_HRM` sau khi backend da chay |
| Trust server certificate | `Yes` cho may local |
| Encrypt | `Optional` / `No` cho may local |

Sau khi ket noi, tao file `.sql`, chon connection profile o goc phai duoi cua VS Code, va chay truy van bang **MS SQL: Execute Query**.

```sql
SELECT @@SERVERNAME AS server_name, DB_NAME() AS database_name;
```

## 3. Cau hinh backend

Tao file `server/.env` tu mau `server/.env.example`, sau do dat gia tri that cho `DB_PASSWORD` va `JWT_SECRET`.

```dotenv
PORT=5000

DB_HOST=localhost
DB_PORT=1433
DB_NAME=BRAVO_HRM
DB_USER=sa
DB_PASSWORD=mat_khau_sa_cua_ban
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true

JWT_SECRET=chuoi_bi_mat_ngau_nhien_dai_it_nhat_32_ky_tu
```

Khong commit `server/.env`, khong chia se `DB_PASSWORD`, va khong dat mat khau that trong `server/.env.example`.

## 4. Tao database, seed du lieu va chay backend

Tu thu muc `server`, cai package, seed dataset v2 va khoi dong backend:

```powershell
npm install
npm run seed
npm run dev
```

Lenh `npm run seed` se:

1. Ket noi database `master`.
2. Tao `BRAVO_HRM` neu database chua ton tai.
3. Tao schema va cac migration can thiet.
4. Xoa du lieu hien tai trong cac bang HRM.
5. Nap dataset v2 deterministic gom 706 dong tren 47 bang, khong co gia tri `NULL` trong cac dong du lieu.

> `npm run seed` la lenh reset du lieu. Khong chay tren database co du lieu can giu lai.

Sau do `npm run dev` chi khoi dong schema va API tai `http://localhost:5000`; backend khong tu dong chay lai seed cu.

Tai khoan SQL `sa` can co quyen `CREATE DATABASE` de backend tu tao database. Neu tai khoan khong co quyen nay, tao database truoc trong VS Code khi dang ket noi `master`:

```sql
CREATE DATABASE [BRAVO_HRM];
GO
```

Sau do chay lai `npm run seed`, roi `npm run dev`.

## 5. Kiem tra trong VS Code

Sau khi backend da khoi dong, ket noi profile VS Code den `BRAVO_HRM` va chay:

```sql
SELECT name FROM sys.tables ORDER BY name;

SELECT TOP (10)
  employee_code,
  full_name,
  employment_status
FROM Employee
ORDER BY created_date DESC;
```

Kiem tra API tu terminal khac:

```powershell
Invoke-RestMethod http://localhost:5000/api/health
```

## Xu ly loi thuong gap

| Loi | Nguyen nhan va cach xu ly |
| --- | --- |
| `ESOCKET` hoac `Failed to connect` | Kiem tra dich vu SQL Server dang chay, TCP/IP da bat, dung port `1433`, va firewall cho phep port nay. |
| `Login failed for user 'sa'` | Kiem tra Mixed Mode Authentication, tai khoan `sa` da enable, va `DB_PASSWORD` dung. |
| `Cannot open database 'BRAVO_HRM'` | Chay backend bang tai khoan co quyen `CREATE DATABASE`, hoac tao database thu cong theo lenh o buoc 4. |
| `DB_PASSWORD must be set` | Dat `DB_PASSWORD` trong `server/.env`, sau do khoi dong lai backend. |
| Ket noi VS Code duoc nhung backend khong duoc | Doi chieu `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_ENCRYPT`, va `DB_TRUST_SERVER_CERTIFICATE` trong `server/.env`. |
