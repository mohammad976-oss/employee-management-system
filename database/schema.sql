-- Employee Management System - Database Schema
-- This is a reference schema. If spring.jpa.hibernate.ddl-auto=update is set,
-- Hibernate will create/maintain these tables automatically on app startup.
-- Run this manually only if you prefer to manage schema yourself (ddl-auto=validate/none).

CREATE DATABASE IF NOT EXISTS ems_db;
USE ems_db;

-- ========================
-- Departments
-- ========================
CREATE TABLE IF NOT EXISTS departments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    head_of_department VARCHAR(100),
    location VARCHAR(100)
);

-- ========================
-- Employees
-- ========================
CREATE TABLE IF NOT EXISTS employees (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    employee_code VARCHAR(20) NOT NULL UNIQUE,
    first_name VARCHAR(60) NOT NULL,
    last_name VARCHAR(60) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(10),
    address VARCHAR(255),
    date_of_joining DATE,
    designation VARCHAR(60),
    department_id BIGINT,
    basic_salary DECIMAL(12,2) NOT NULL,
    hourly_rate DECIMAL(12,2),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    CONSTRAINT fk_employee_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- ========================
-- Attendance
-- ========================
CREATE TABLE IF NOT EXISTS attendance (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    employee_id BIGINT NOT NULL,
    attendance_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL, -- PRESENT, ABSENT, HALF_DAY, LEAVE, HOLIDAY
    hours_worked DOUBLE DEFAULT 0,
    overtime_hours DOUBLE DEFAULT 0,
    remarks VARCHAR(255),
    CONSTRAINT fk_attendance_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    CONSTRAINT uq_attendance_employee_date UNIQUE (employee_id, attendance_date)
);

-- ========================
-- Payroll
-- ========================
CREATE TABLE IF NOT EXISTS payroll (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    employee_id BIGINT NOT NULL,
    pay_month INT NOT NULL,
    pay_year INT NOT NULL,
    days_present INT,
    days_absent INT,
    overtime_hours DOUBLE,
    basic_salary DECIMAL(12,2),
    overtime_pay DECIMAL(12,2),
    gross_salary DECIMAL(12,2),
    absence_deduction DECIMAL(12,2),
    tax_deduction DECIMAL(12,2),
    other_deduction DECIMAL(12,2) DEFAULT 0,
    total_deductions DECIMAL(12,2),
    net_salary DECIMAL(12,2),
    generated_at DATETIME,
    CONSTRAINT fk_payroll_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    CONSTRAINT uq_payroll_employee_month UNIQUE (employee_id, pay_month, pay_year)
);
