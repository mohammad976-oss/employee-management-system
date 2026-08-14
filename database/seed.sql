-- Sample data to try out the Employee Management System
USE ems_db;

INSERT INTO departments (name, description, head_of_department, location) VALUES
('Engineering', 'Builds and maintains all software products', 'Anita Rao', 'Hyderabad'),
('Human Resources', 'Handles hiring, payroll policy, and employee welfare', 'Kunal Mehta', 'Hyderabad'),
('Sales', 'Manages client relationships and revenue', 'Priya Nair', 'Bengaluru');

INSERT INTO employees
(employee_code, first_name, last_name, email, phone, date_of_birth, gender, address, date_of_joining, designation, department_id, basic_salary, hourly_rate, status)
VALUES
('EMP-1000', 'Ravi', 'Kumar', 'ravi.kumar@example.com', '9876543210', '1995-03-14', 'Male', 'Miryalaguda, Telangana', '2023-06-01', 'Software Engineer', 1, 45000.00, NULL, 'ACTIVE'),
('EMP-1001', 'Sneha', 'Patil', 'sneha.patil@example.com', '9876543211', '1997-08-22', 'Female', 'Pune, Maharashtra', '2022-11-15', 'HR Executive', 2, 32000.00, NULL, 'ACTIVE'),
('EMP-1002', 'Arjun', 'Verma', 'arjun.verma@example.com', '9876543212', '1993-01-05', 'Male', 'Bengaluru, Karnataka', '2021-04-10', 'Sales Manager', 3, 55000.00, NULL, 'ACTIVE');

-- Sample attendance for August 2026 for Ravi Kumar (employee_id = 1)
INSERT INTO attendance (employee_id, attendance_date, status, hours_worked, overtime_hours, remarks) VALUES
(1, '2026-08-01', 'PRESENT', 8, 0, NULL),
(1, '2026-08-02', 'PRESENT', 8, 2, 'Stayed late for release'),
(1, '2026-08-03', 'PRESENT', 8, 0, NULL),
(1, '2026-08-04', 'ABSENT', 0, 0, 'Sick leave'),
(1, '2026-08-05', 'PRESENT', 8, 3, 'Deployment support');

-- Generate payroll for Ravi Kumar via the API:
-- POST /api/payroll/generate  { "employeeId": 1, "payMonth": 8, "payYear": 2026 }
