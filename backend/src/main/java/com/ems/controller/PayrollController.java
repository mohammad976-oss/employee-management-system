package com.ems.controller;

import com.ems.dto.PayrollGenerateRequest;
import com.ems.entity.Payroll;
import com.ems.service.PayrollService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payroll")
@RequiredArgsConstructor
public class PayrollController {

    private final PayrollService payrollService;

    @GetMapping
    public List<Payroll> getAll(@RequestParam(required = false) Long employeeId) {
        if (employeeId != null) {
            return payrollService.getByEmployee(employeeId);
        }
        return payrollService.getAll();
    }

    @GetMapping("/{id}")
    public Payroll getById(@PathVariable Long id) {
        return payrollService.getById(id);
    }

    // Calculates and stores (or recalculates) the payslip for one employee/month
    @PostMapping("/generate")
    @ResponseStatus(HttpStatus.CREATED)
    public Payroll generate(@Valid @RequestBody PayrollGenerateRequest request) {
        return payrollService.generatePayroll(request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        payrollService.delete(id);
    }
}
