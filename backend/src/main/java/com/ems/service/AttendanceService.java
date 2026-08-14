package com.ems.service;

import com.ems.dto.AttendanceRequest;
import com.ems.entity.Attendance;
import com.ems.entity.Employee;
import com.ems.exception.ResourceNotFoundException;
import com.ems.repository.AttendanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final EmployeeService employeeService;

    public List<Attendance> getAll() {
        return attendanceRepository.findAll();
    }

    public List<Attendance> getByEmployee(Long employeeId) {
        return attendanceRepository.findByEmployee_Id(employeeId);
    }

    public List<Attendance> getByEmployeeAndMonth(Long employeeId, int month, int year) {
        YearMonth ym = YearMonth.of(year, month);
        return attendanceRepository.findByEmployee_IdAndAttendanceDateBetween(
                employeeId, ym.atDay(1), ym.atEndOfMonth());
    }

    public List<Attendance> getByDate(LocalDate date) {
        return attendanceRepository.findByAttendanceDate(date);
    }

    /**
     * Mark attendance for an employee on a given day. If a record already exists
     * for that employee/date it is updated (idempotent "mark attendance" action),
     * otherwise a new record is created.
     */
    public Attendance markAttendance(AttendanceRequest request) {
        Employee employee = employeeService.getById(request.getEmployeeId());

        Optional<Attendance> existing = attendanceRepository
                .findByEmployee_IdAndAttendanceDate(request.getEmployeeId(), request.getAttendanceDate());

        Attendance attendance = existing.orElseGet(Attendance::new);
        attendance.setEmployee(employee);
        attendance.setAttendanceDate(request.getAttendanceDate());
        attendance.setStatus(request.getStatus().toUpperCase());
        attendance.setHoursWorked(request.getHoursWorked() == null ? 0.0 : request.getHoursWorked());
        attendance.setOvertimeHours(request.getOvertimeHours() == null ? 0.0 : request.getOvertimeHours());
        attendance.setRemarks(request.getRemarks());

        return attendanceRepository.save(attendance);
    }

    public void delete(Long id) {
        Attendance attendance = attendanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance record not found with id: " + id));
        attendanceRepository.delete(attendance);
    }
}
