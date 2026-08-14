package com.ems.service;

import com.ems.entity.Department;
import com.ems.entity.Employee;
import com.ems.exception.BadRequestException;
import com.ems.exception.ResourceNotFoundException;
import com.ems.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final DepartmentService departmentService;

    public List<Employee> getAll() {
        return employeeRepository.findAll();
    }

    public Employee getById(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));
    }

    public List<Employee> getByDepartment(Long departmentId) {
        return employeeRepository.findByDepartment_Id(departmentId);
    }

    public Employee create(Employee employee) {
        if (employeeRepository.existsByEmail(employee.getEmail())) {
            throw new BadRequestException("An employee with this email already exists: " + employee.getEmail());
        }

        // Auto-generate a human-friendly employee code if not supplied: EMP-1000, EMP-1001, ...
        if (employee.getEmployeeCode() == null || employee.getEmployeeCode().isBlank()) {
            long nextSeq = employeeRepository.count() + 1000;
            String candidate = "EMP-" + nextSeq;
            while (employeeRepository.existsByEmployeeCode(candidate)) {
                nextSeq++;
                candidate = "EMP-" + nextSeq;
            }
            employee.setEmployeeCode(candidate);
        } else if (employeeRepository.existsByEmployeeCode(employee.getEmployeeCode())) {
            throw new BadRequestException("Employee code already in use: " + employee.getEmployeeCode());
        }

        // Validate and attach the department if provided
        if (employee.getDepartment() != null && employee.getDepartment().getId() != null) {
            Department dept = departmentService.getById(employee.getDepartment().getId());
            employee.setDepartment(dept);
        }

        if (employee.getStatus() == null || employee.getStatus().isBlank()) {
            employee.setStatus("ACTIVE");
        }

        return employeeRepository.save(employee);
    }

    public Employee update(Long id, Employee updated) {
        Employee existing = getById(id);

        existing.setFirstName(updated.getFirstName());
        existing.setLastName(updated.getLastName());
        existing.setEmail(updated.getEmail());
        existing.setPhone(updated.getPhone());
        existing.setDateOfBirth(updated.getDateOfBirth());
        existing.setGender(updated.getGender());
        existing.setAddress(updated.getAddress());
        existing.setDateOfJoining(updated.getDateOfJoining());
        existing.setDesignation(updated.getDesignation());
        existing.setBasicSalary(updated.getBasicSalary());
        existing.setHourlyRate(updated.getHourlyRate());
        if (updated.getStatus() != null) {
            existing.setStatus(updated.getStatus());
        }

        if (updated.getDepartment() != null && updated.getDepartment().getId() != null) {
            Department dept = departmentService.getById(updated.getDepartment().getId());
            existing.setDepartment(dept);
        } else {
            existing.setDepartment(null);
        }

        return employeeRepository.save(existing);
    }

    public void delete(Long id) {
        Employee existing = getById(id);
        employeeRepository.delete(existing);
    }
}
