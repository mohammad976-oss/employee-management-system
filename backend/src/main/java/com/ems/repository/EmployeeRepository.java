package com.ems.repository;

import com.ems.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    Optional<Employee> findByEmployeeCode(String employeeCode);
    List<Employee> findByDepartment_Id(Long departmentId);
    List<Employee> findByStatus(String status);
    boolean existsByEmail(String email);
    boolean existsByEmployeeCode(String employeeCode);
}
