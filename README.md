# Ledger — Employee Management System

A complete Employee Management System: **Spring Boot + MySQL** backend, and a plain **HTML/CSS/JS** frontend (no build step required).

```
Employee → Personal + Contact Details → Department → Attendance → Payroll → Net Salary
```

## What's included

| Module | Description |
|---|---|
| **Employee info** | Name, employee code, DOB, gender, address, contact info, department, designation, salary basis |
| **Department info** | Name, head of department, location, description; which employees belong to it |
| **Database** | MySQL, accessed via Spring Data JPA (Hibernate). Schema auto-creates on first run |
| **Attendance** | Mark present/absent/half-day/leave/holiday per employee per day, with hours worked and overtime hours |
| **Payroll** | Generates a payslip per employee per month from that month's attendance: basic pay (pro-rated by days present) + overtime pay − tax − other deductions = **net salary** |

## Project structure

```
employee-management-system/
├── backend/                     Spring Boot (Java 17, Maven)
│   ├── pom.xml
│   ├── src/main/java/com/ems/
│   │   ├── EmsApplication.java
│   │   ├── entity/               Employee, Department, Attendance, Payroll
│   │   ├── repository/           Spring Data JPA repositories
│   │   ├── service/               Business logic (payroll math lives in PayrollService)
│   │   ├── controller/            REST endpoints (/api/...)
│   │   ├── dto/                  Request payloads
│   │   ├── exception/             Centralized error handling
│   │   └── config/                CORS config
│   └── src/main/resources/application.properties
├── database/
│   ├── schema.sql                 Reference schema (Hibernate can also auto-create this)
│   └── seed.sql                   Sample departments/employees/attendance to try out
├── frontend/
│   ├── index.html
│   ├── css/style.css
│   └── js/api.js, app.js
└── README.md
```

## 1. Set up MySQL

```sql
CREATE DATABASE ems_db;
```

(Or let the app do it automatically — the JDBC URL includes `createDatabaseIfNotExist=true`.)

Then edit `backend/src/main/resources/application.properties` with your MySQL username/password:

```properties
spring.datasource.username=root
spring.datasource.password=your_mysql_password
```

Optional: run `database/seed.sql` after the app has started once (so tables exist) to load sample data.

## 2. Run the backend

Requires Java 17+ and Maven.

```bash
cd backend
mvn spring-boot:run
```

The API starts on **http://localhost:8099/api/employees**. On first run, Hibernate creates all tables automatically (`spring.jpa.hibernate.ddl-auto=update`).

### API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET/POST | `/api/departments` | List / create departments |
| PUT/DELETE | `/api/departments/{id}` | Update / delete a department |
| GET/POST | `/api/employees` | List / create employees (`?departmentId=` to filter) |
| PUT/DELETE | `/api/employees/{id}` | Update / delete an employee |
| GET/POST | `/api/attendance` | List / mark attendance (`?employeeId=&month=&year=` to filter) |
| DELETE | `/api/attendance/{id}` | Delete an attendance record |
| GET | `/api/payroll` | List payslips (`?employeeId=` to filter) |
| POST | `/api/payroll/generate` | Calculate and store a payslip for an employee/month |
| DELETE | `/api/payroll/{id}` | Delete a payslip |

Example — generate August 2026 payroll for employee #1:

```bash
curl -X POST http://localhost:8099/api/payroll/generate \
  -H "Content-Type: application/json" \
  -d '{"employeeId": 1, "payMonth": 8, "payYear": 2026}'
```

## 3. Run the frontend

No build step is required. The frontend can be served using a static server.

```bash
cd frontend
npx serve
```

Then open:

```text
http://localhost:3000
```

> Make sure the Java/Spring Boot backend is also running before using features that require the API.


The frontend calls the API at `http://localhost:8099/api` (see `API_BASE` in `js/api.js` — change it if your backend runs elsewhere). CORS is already enabled on the backend for local development.

## How the salary calculation works

For a given employee and month, `PayrollService.generatePayroll()`:

1. Reads that employee's attendance records for the month.
2. Tallies **days present** (PRESENT/HOLIDAY = 1 day, HALF_DAY = 0.5) and **days absent**, plus total **overtime hours**.
3. **Basic pay** = `(basic monthly salary ÷ 26 standard working days) × days present`
4. **Overtime pay** = `hourly rate × 1.5 × overtime hours` (hourly rate is either set on the employee, or auto-derived from basic salary ÷ 26 ÷ 8)
5. **Gross salary** = basic pay + overtime pay
6. **Tax deduction** = gross salary × tax rate (defaults to 10%, overridable per payslip)
7. **Net salary** = gross salary − tax deduction − other deductions

Adjust the constants at the top of `PayrollService.java` (`STANDARD_WORKING_DAYS_PER_MONTH`, `STANDARD_HOURS_PER_DAY`, `OVERTIME_MULTIPLIER`, `DEFAULT_TAX_RATE`) to match your actual company policy.

## Notes for extending this

- **Authentication**: none is included — add Spring Security if this needs to be internet-facing.
- **Validation**: request bodies are validated with Bean Validation (`@NotBlank`, `@Email`, etc.); errors return a structured JSON `400` response.
- **Employee codes**: auto-generated as `EMP-1000`, `EMP-1001`, ... if not supplied.
- **Leave types, shift schedules, bonuses**: not modeled yet — the `Attendance` and `Payroll` entities are the places to extend for those.
