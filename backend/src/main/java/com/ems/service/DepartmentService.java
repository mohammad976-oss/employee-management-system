package com.ems.service;

import com.ems.entity.Department;
import com.ems.exception.BadRequestException;
import com.ems.exception.ResourceNotFoundException;
import com.ems.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

    public List<Department> getAll() {
        return departmentRepository.findAll();
    }

    public Department getById(Long id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + id));
    }

    public Department create(Department department) {
        if (departmentRepository.existsByNameIgnoreCase(department.getName())) {
            throw new BadRequestException("Department already exists: " + department.getName());
        }
        return departmentRepository.save(department);
    }

    public Department update(Long id, Department updated) {
        Department existing = getById(id);
        existing.setName(updated.getName());
        existing.setDescription(updated.getDescription());
        existing.setHeadOfDepartment(updated.getHeadOfDepartment());
        existing.setLocation(updated.getLocation());
        return departmentRepository.save(existing);
    }

    public void delete(Long id) {
        Department existing = getById(id);
        departmentRepository.delete(existing);
    }
}
