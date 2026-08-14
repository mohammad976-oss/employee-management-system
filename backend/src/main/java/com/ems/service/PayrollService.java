package com.ems.service;

import com.ems.dto.PayrollGenerateRequest;
import com.ems.entity.Attendance;
import com.ems.entity.Employee;
import com.ems.entity.Payroll;
import com.ems.exception.ResourceNotFoundException;
import com.ems.repository.PayrollRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

/**
 * Handles salary calculation:
 *   Basic pay (pro-rated by days present) + Overtime pay
 *   - Tax deduction
 *   - Other deductions
 *   = Net salary
 */
@Service
@RequiredArgsConstructor
public class PayrollService {

    // Company policy constants - adjust to match real HR policy
    private static final int STANDARD_WORKING_DAYS_PER_MONTH = 26;
    private static final double STANDARD_HOURS_PER_DAY = 8.0;
    private static final BigDecimal OVERTIME_MULTIPLIER = BigDecimal.valueOf(1.5);
    private static final BigDecimal DEFAULT_TAX_RATE = BigDecimal.valueOf(0.10); // 10%

    private final PayrollRepository payrollRepository;
    private final EmployeeService employeeService;
    private final AttendanceService attendanceService;

    public List<Payroll> getAll() {
        return payrollRepository.findAll();
    }

    public List<Payroll> getByEmployee(Long employeeId) {
        return payrollRepository.findByEmployee_Id(employeeId);
    }

    public Payroll getById(Long id) {
        return payrollRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payroll record not found with id: " + id));
    }

    /**
     * Generates (or regenerates) the payroll for one employee for one month,
     * based on that month's attendance records.
     */
    public Payroll generatePayroll(PayrollGenerateRequest request) {
        Employee employee = employeeService.getById(request.getEmployeeId());

        List<Attendance> monthRecords = attendanceService.getByEmployeeAndMonth(
                employee.getId(), request.getPayMonth(), request.getPayYear());

        // Tally attendance: PRESENT/HOLIDAY = 1 day, HALF_DAY = 0.5 day, ABSENT/unpaid LEAVE = 0
        double daysPresent = 0;
        double daysAbsent = 0;
        double totalOvertimeHours = 0;

        for (Attendance a : monthRecords) {
            switch (a.getStatus().toUpperCase()) {
                case "PRESENT", "HOLIDAY" -> daysPresent += 1;
                case "HALF_DAY" -> daysPresent += 0.5;
                case "ABSENT", "LEAVE" -> daysAbsent += 1;
                default -> { /* ignore unrecognized status */ }
            }
            if (a.getOvertimeHours() != null) {
                totalOvertimeHours += a.getOvertimeHours();
            }
        }

        BigDecimal basicSalary = employee.getBasicSalary();
        BigDecimal perDaySalary = basicSalary.divide(
                BigDecimal.valueOf(STANDARD_WORKING_DAYS_PER_MONTH), 4, RoundingMode.HALF_UP);

        // Hourly rate: use the employee's configured rate, otherwise derive it from basic salary
        BigDecimal hourlyRate = employee.getHourlyRate();
        if (hourlyRate == null || hourlyRate.compareTo(BigDecimal.ZERO) == 0) {
            hourlyRate = perDaySalary.divide(
                    BigDecimal.valueOf(STANDARD_HOURS_PER_DAY), 4, RoundingMode.HALF_UP);
        }
        BigDecimal overtimeRate = hourlyRate.multiply(OVERTIME_MULTIPLIER);

        BigDecimal earnedBasic = perDaySalary.multiply(BigDecimal.valueOf(daysPresent))
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal overtimePay = overtimeRate.multiply(BigDecimal.valueOf(totalOvertimeHours))
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal grossSalary = earnedBasic.add(overtimePay);

        BigDecimal absenceDeduction = perDaySalary.multiply(BigDecimal.valueOf(daysAbsent))
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal taxRate = request.getTaxRate() != null ? request.getTaxRate() : DEFAULT_TAX_RATE;
        BigDecimal taxDeduction = grossSalary.multiply(taxRate).setScale(2, RoundingMode.HALF_UP);

        BigDecimal otherDeduction = request.getOtherDeduction() != null
                ? request.getOtherDeduction() : BigDecimal.ZERO;

        // Absence is already reflected in grossSalary (fewer days paid), so it is not
        // subtracted again here - it's kept on the record for transparency/reporting.
        BigDecimal totalDeductions = taxDeduction.add(otherDeduction);

        BigDecimal netSalary = grossSalary.subtract(totalDeductions).setScale(2, RoundingMode.HALF_UP);

        Payroll payroll = payrollRepository
                .findByEmployee_IdAndPayMonthAndPayYear(employee.getId(), request.getPayMonth(), request.getPayYear())
                .orElseGet(Payroll::new);

        payroll.setEmployee(employee);
        payroll.setPayMonth(request.getPayMonth());
        payroll.setPayYear(request.getPayYear());
        payroll.setDaysPresent((int) Math.round(daysPresent));
        payroll.setDaysAbsent((int) Math.round(daysAbsent));
        payroll.setOvertimeHours(totalOvertimeHours);
        payroll.setBasicSalary(earnedBasic);
        payroll.setOvertimePay(overtimePay);
        payroll.setGrossSalary(grossSalary);
        payroll.setAbsenceDeduction(absenceDeduction);
        payroll.setTaxDeduction(taxDeduction);
        payroll.setOtherDeduction(otherDeduction);
        payroll.setTotalDeductions(totalDeductions);
        payroll.setNetSalary(netSalary);

        return payrollRepository.save(payroll);
    }

    public void delete(Long id) {
        Payroll payroll = getById(id);
        payrollRepository.delete(payroll);
    }
}
