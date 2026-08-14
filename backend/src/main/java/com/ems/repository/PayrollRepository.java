package com.ems.repository;

import com.ems.entity.Payroll;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PayrollRepository extends JpaRepository<Payroll, Long> {
    List<Payroll> findByEmployee_Id(Long employeeId);
    Optional<Payroll> findByEmployee_IdAndPayMonthAndPayYear(Long employeeId, Integer month, Integer year);
    List<Payroll> findByPayMonthAndPayYear(Integer month, Integer year);
}
